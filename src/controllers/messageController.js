import Message from "../models/Message.js";
import asyncHandler from "../utils/asyncHandler.js";

const sendMessage = asyncHandler(async (req, res) => {
  const { receiver, text } = req.body;

  const message = await Message.create({
    sender: req.user._id,
    receiver,
    text: text.trim(),
  });

  const populatedMessage = await message.populate([
    {
      path: "sender",
      select: "username fullName avatar",
    },
    {
      path: "receiver",
      select: "username fullName avatar",
    },
  ]);

  const chatRoom = [req.user._id.toString(), receiver.toString()].sort().join("_");

  if (req.io) {
    req.io.to(chatRoom).emit("newMessage", populatedMessage);
    req.io.to(receiver.toString()).emit("newMessageNotification", populatedMessage);
  }

  res.status(201).json(populatedMessage);
});

const getMessagesWithUser = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;

  const messages = await Message.find({
    $or: [
      {
        sender: req.user._id,
        receiver: otherUserId,
      },
      {
        sender: otherUserId,
        receiver: req.user._id,
      },
    ],
  })
    .populate("sender", "username fullName avatar")
    .populate("receiver", "username fullName avatar")
    .sort({ createdAt: 1 })
    .lean();

  res.json(messages);
});

const markMessagesAsSeen = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;

  await Message.updateMany(
    {
      sender: otherUserId,
      receiver: req.user._id,
      isSeen: false,
    },
    {
      isSeen: true,
      seenAt: new Date(),
    }
  );

  const chatRoom = [req.user._id.toString(), otherUserId.toString()]
    .sort()
    .join("_");

  if (req.io) {
    req.io.to(chatRoom).emit("messagesSeen", {
      seenBy: req.user._id,
      chatRoom,
    });
  }

  res.json({
    message: "Messages marked as seen",
  });
});

const getChats = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }],
  })
    .populate("sender", "username fullName avatar")
    .populate("receiver", "username fullName avatar")
    .sort({ createdAt: -1 })
    .lean();

  const chatsMap = new Map();

  messages.forEach((message) => {
    const otherUser =
      message.sender._id.toString() === req.user._id.toString()
        ? message.receiver
        : message.sender;

    if (!chatsMap.has(otherUser._id.toString())) {
      chatsMap.set(otherUser._id.toString(), {
        user: otherUser,
        lastMessage: message.text,
        lastMessageDate: message.createdAt,
        lastMessageSeen: message.isSeen,
        lastMessageSender: message.sender._id,
      });
    }
  });

  res.json([...chatsMap.values()]);
});

export {
  sendMessage,
  getMessagesWithUser,
  markMessagesAsSeen,
  getChats,
};