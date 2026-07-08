import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import {
  sendMessage,
  getMessagesWithUser,
  markMessagesAsSeen,
  getChats,
  editMessage,
  deleteMessage,
} from "../controllers/messageController.js";

import { messageValidator } from "../validators/messageValidator.js";
import validationMiddleware from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  messageValidator,
  validationMiddleware,
  sendMessage
);

router.get("/", authMiddleware, getChats);

router.put(
  "/:userId/seen",
  authMiddleware,
  markMessagesAsSeen
);

router.get(
  "/:userId",
  authMiddleware,
  getMessagesWithUser
);

router.put(
  "/message/:messageId",
  authMiddleware,
  messageValidator,
  validationMiddleware,
  editMessage
);

router.delete(
  "/message/:messageId",
  authMiddleware,
  deleteMessage
);

export default router;