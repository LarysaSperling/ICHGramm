import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["like", "comment", "follow"],
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    // The comment a "comment" notification is about, so it can be removed
    // together with the comment (REVIEW M-4). Not set on older ones.
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },

    // "like:<postId>" or "follow": at most one such notification per
    // sender and recipient (REVIEW M-4). Comments have none - every comment
    // is its own notification. Not set on notifications created before
    // M-4; scripts/cleanupNotifications.js fills it in.
    groupKey: {
      type: String,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  isRead: 1,
});

// One like / follow notification per pair (REVIEW M-4). Partial: comment
// notifications and older documents without groupKey are not indexed, so
// existing duplicates cannot make the index build fail. Built by Mongoose
// autoIndex; server.js waits for it and logs the result.
notificationSchema.index(
  {
    recipient: 1,
    sender: 1,
    groupKey: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      groupKey: { $type: "string" },
    },
  },
);

// Removing the notification of a deleted comment.
notificationSchema.index(
  {
    comment: 1,
  },
  {
    partialFilterExpression: {
      comment: { $type: "objectId" },
    },
  },
);

export default mongoose.model("Notification", notificationSchema);
