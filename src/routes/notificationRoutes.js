import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.param("id", validateObjectId);

router.get("/", authMiddleware, getNotifications);

router.get("/unread-count", authMiddleware, getUnreadCount);

router.put("/read-all", authMiddleware, markAllAsRead);

router.put("/:id/read", authMiddleware, markAsRead);

router.delete("/clear", authMiddleware, clearNotifications);

router.delete("/:id", authMiddleware, deleteNotification);

export default router;