import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);

router.put("/read-all", authMiddleware, markAllAsRead);

router.put("/:id/read", authMiddleware, markAsRead);

router.delete("/clear", authMiddleware, clearNotifications);

router.delete("/:id", authMiddleware, deleteNotification);

export default router;