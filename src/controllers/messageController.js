import Message from "../models/Message.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  getChatRoom,
  emitToParticipants,
} from "../utils/chatRoom.js";

const betweenUsers = (userIdA, userIdB) => ({
  $or: [
    { sender: userIdA, receiver: userIdB },
    { sender: userIdB, receiver: userIdA },
  ],
});

const messagePopulate = [
  {
    path: "sender",
    select: "username fullName avatar",
  },
  {
    path: "receiver",
    select: "username fullName avatar",
  },
  {
    path: "sharedPost",
    select: "image caption author createdAt",
    populate: {
      path: "author",
      select: "username fullName avatar",
    },
  },
];

const sendMessage = asyncHandler(async (req, res) => {
  const {
    receiver,
    text = "",
    messageType = "text",
    sharedPost = null,
  } = req.body;

  const normalizedText = text.trim();

  const message = await Message.create({
    sender: req.user._id,
    receiver,
    text: normalizedText,
    messageType,
    sharedPost: sharedPost || null,
  });

  const populatedMessage = await message.populate(messagePopulate);

  emitToParticipants(
    req.io,
    [req.user._id, receiver],
    "newMessage",
    populatedMessage,
  );

  if (req.io) {
    req.io
      .to(receiver.toString())
      .emit("newMessageNotification", populatedMessage);
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
    .populate(messagePopulate)
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

  emitToParticipants(
    req.io,
    [req.user._id, otherUserId],
    "messagesSeen",
    {
      seenBy: req.user._id,
      chatRoom: getChatRoom(req.user._id, otherUserId),
    },
  );

  res.json({
    message: "Messages marked as seen",
  });
});

const getChats = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }],
  })
    .populate(messagePopulate)
    .sort({ createdAt: -1 })
    .lean();

  const chatsMap = new Map();

  for (const message of messages) {
    const otherUser =
      message.sender._id.toString() === req.user._id.toString()
        ? message.receiver
        : message.sender;

    const otherUserId = otherUser._id.toString();

    if (!chatsMap.has(otherUserId)) {
      const unreadCount = await Message.countDocuments({
        sender: otherUser._id,
        receiver: req.user._id,
        isSeen: false,
      });

      const lastMessage =
        message.messageType === "post"
          ? "Shared a post"
          : message.text;

      chatsMap.set(otherUserId, {
        user: otherUser,
        lastMessage,
        lastMessageDate: message.createdAt,
        lastMessageSeen: message.isSeen,
        lastMessageSender: message.sender._id,
        unreadCount,
        lastMessageType: message.messageType,
        lastSharedPost: message.sharedPost || null,
      });
    }
  }

  res.json([...chatsMap.values()]);
});

const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      message: "Message not found",
    });
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  if (message.messageType !== "text") {
    return res.status(400).json({
      message: "Shared post messages cannot be edited",
    });
  }

  if (!text?.trim()) {
    return res.status(400).json({
      message: "Message cannot be empty",
    });
  }

  message.text = text.trim();

  await message.save();

  const participants = [message.sender, message.receiver];

  const populatedMessage = await message.populate(messagePopulate);

  // Real-time update for the other participant and the sender's other tabs.
  emitToParticipants(
    req.io,
    participants,
    "messageUpdated",
    populatedMessage,
  );

  res.json(populatedMessage);
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      message: "Message not found",
    });
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  const { sender, receiver, isSeen } = message;

  await message.deleteOne();

  // The chat list shows the last message of every chat, so send the new
  // last message along (without images: only what the list needs).
  // null = the chat has no messages left.
  const lastMessage = await Message.findOne(
    betweenUsers(sender, receiver),
  )
    .sort({ createdAt: -1 })
    .select("text messageType sharedPost createdAt isSeen sender")
    .lean();

  emitToParticipants(req.io, [sender, receiver], "messageDeleted", {
    messageId,
    chatRoom: getChatRoom(sender, receiver),
    sender,
    receiver,
    // lets the receiver decrease the unread counter
    wasSeen: isSeen,
    lastMessage: lastMessage && {
      text: lastMessage.text,
      messageType: lastMessage.messageType,
      hasSharedPost: Boolean(lastMessage.sharedPost),
      createdAt: lastMessage.createdAt,
      isSeen: lastMessage.isSeen,
      sender: lastMessage.sender,
    },
  });

  res.json({
    message: "Message deleted",
    messageId,
  });
});

const deleteChat = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;

  await Message.deleteMany({
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
  });

  res.json({
    message: "Chat deleted",
    userId: otherUserId,
  });
});

export {
  sendMessage,
  getMessagesWithUser,
  markMessagesAsSeen,
  getChats,
  editMessage,
  deleteMessage,
  deleteChat,
};
