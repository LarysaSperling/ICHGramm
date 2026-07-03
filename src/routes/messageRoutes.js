import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import {
  sendMessage,
  getMessagesWithUser,
  getChats,
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

router.get(
  "/:userId",
  authMiddleware,
  getMessagesWithUser
);

export default router;