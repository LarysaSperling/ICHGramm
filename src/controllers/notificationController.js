import Notification from "../models/Notification.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { emitUnreadCount } from "../services/notificationService.js";

// Only the newest ones (REVIEW M-5); loading older ones is a separate
// item in REVIEW.md.
const NOTIFICATIONS_LIMIT = 50;

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    recipient: req.user._id,
  })
    .populate("sender", "username fullName avatar")
    .populate("post", "image caption")
    .sort({ createdAt: -1 })
    .limit(NOTIFICATIONS_LIMIT)
    .lean();

  const filteredNotifications = notifications.filter((notification) => {
    if (notification.type === "follow") {
      return true;
    }

    return notification.post !== null;
  });

  res.json(filteredNotifications);
});

// The red badge (REVIEW M-5): a count instead of the whole list.
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.json({ count });
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

  // All tabs of the user update their badge (REVIEW M-5).
  await emitUnreadCount(req.io, req.user._id);

  res.json(notification);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  await emitUnreadCount(req.io, req.user._id);

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

  await emitUnreadCount(req.io, req.user._id);

  res.json({ message: "Notification deleted" });
});

const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({
    recipient: req.user._id,
  });

  await emitUnreadCount(req.io, req.user._id);

  res.json({ message: "All notifications cleared" });
});

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
};