import Notification from "../models/Notification.js";

const DUPLICATE_KEY = 11000;

// Like and follow notifications are grouped: at most one per sender,
// recipient and post (REVIEW M-4). Comments are not.
const getGroupKey = (type, post) => {
  if (type === "like") {
    return `like:${post}`;
  }

  if (type === "follow") {
    return "follow";
  }

  return undefined;
};

// Sends the recipient's unread count to all of their tabs (REVIEW M-5),
// so the red badge is the server's number, not a local +1.
const emitUnreadCount = async (io, userId) => {
  if (!io || !userId) {
    return;
  }

  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  io.to(userId.toString()).emit("unreadNotificationsCount", {
    count,
  });
};

const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  comment = undefined,
  io = null,
}) => {
  const groupKey = getGroupKey(type, post);

  let notification;
  let isNew = true;

  if (groupKey) {
    const filter = { recipient, sender, groupKey };

    try {
      const result = await Notification.findOneAndUpdate(
        filter,
        {
          $setOnInsert: {
            recipient,
            sender,
            type,
            post,
            groupKey,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
          includeResultMetadata: true,
        },
      );

      notification = result.value;
      isNew = !result.lastErrorObject?.updatedExisting;
    } catch (error) {
      // Two upserts at the same moment: the unique index let one in.
      if (error.code !== DUPLICATE_KEY) {
        throw error;
      }

      notification = await Notification.findOne(filter);
      isNew = false;
    }
  } else {
    notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      comment,
    });
  }

  // An existing notification was not changed: nothing new to announce.
  if (isNew && io) {
    io.to(recipient.toString()).emit(
      "newNotification",
      notification
    );

    await emitUnreadCount(io, recipient);
  }

  return notification;
};

/**
 * Deletes the notifications matching `filter` (unlike, unfollow, deleted
 * comment or post - REVIEW M-4) and tells each recipient: the ids, so an
 * open notifications page can drop them, and the new unread count.
 *
 * @returns {Promise<number>} how many were deleted
 */
const removeNotifications = async (filter, io = null) => {
  const notifications = await Notification.find(filter)
    .select("_id recipient")
    .lean();

  if (notifications.length === 0) {
    return 0;
  }

  const { deletedCount } = await Notification.deleteMany({
    _id: { $in: notifications.map((notification) => notification._id) },
  });

  if (io) {
    const idsByRecipient = new Map();

    notifications.forEach(({ _id, recipient }) => {
      const key = recipient.toString();

      if (!idsByRecipient.has(key)) {
        idsByRecipient.set(key, []);
      }

      idsByRecipient.get(key).push(_id.toString());
    });

    await Promise.all(
      [...idsByRecipient].map(async ([recipient, ids]) => {
        io.to(recipient).emit("notificationsRemoved", { ids });

        await emitUnreadCount(io, recipient);
      }),
    );
  }

  return deletedCount;
};

export {
  createNotification,
  removeNotifications,
  emitUnreadCount,
};
