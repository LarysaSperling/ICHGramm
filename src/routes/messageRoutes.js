import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

import {
  sendMessage,
  getMessagesWithUser,
  markMessagesAsSeen,
  getChats,
  editMessage,
  deleteMessage,
  deleteChat,
} from "../controllers/messageController.js";

import {
  messageValidator,
  editMessageValidator,
} from "../validators/messageValidator.js";
import validationMiddleware from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.param("messageId", validateObjectId);
router.param("userId", validateObjectId);

router.post(
  "/",
  authMiddleware,
  messageValidator,
  validationMiddleware,
  sendMessage
);

router.get(
  "/",
   authMiddleware, 
   getChats);

router.put(
  "/message/:messageId",
  authMiddleware,
  editMessageValidator,
  validationMiddleware,
  editMessage,
);

router.delete(
  "/message/:messageId",
   authMiddleware,
    deleteMessage);

router.delete(
  "/chat/:userId",
   authMiddleware, 
   deleteChat);

router.put(
  "/:userId/seen",
   authMiddleware,
    markMessagesAsSeen);

router.get("/:userId",
   authMiddleware,
    getMessagesWithUser);

export default router;