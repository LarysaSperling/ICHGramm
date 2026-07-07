import Notification from "../models/Notification.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    recipient: req.user._id,
  })
    .populate("sender", "username fullName avatar")
    .populate("post", "image caption")
    .sort({ createdAt: -1 })
    .lean();

  const filteredNotifications = notifications.filter((notification) => {
    if (notification.type === "follow") {
      return true;
    }

    return notification.post !== null;
  });

  res.json(filteredNotifications);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  notification.isRead = true;

  await notification.save();

  res.json(notification);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ message: "All notifications marked as read" });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  await notification.deleteOne();

  res.json({ message: "Notification deleted" });
});

const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({
    recipient: req.user._id,
  });

  res.json({ message: "All notifications cleared" });
});

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
};