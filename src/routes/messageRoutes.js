import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import {
  sendMessage,
  getMessagesWithUser,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", authMiddleware, sendMessage);

router.get(
  "/:userId",
  authMiddleware,
  getMessagesWithUser
);

export default router;