import Message from "../models/Message.js";

const sendMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body;

    if (!receiver || !text) {
      return res.status(400).json({
        message: "Receiver and text are required",
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      text,
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

    if (req.io) {
      req.io
        .to(receiver.toString())
        .emit("newMessage", populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMessagesWithUser = async (req, res) => {
  try {
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
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export {
  sendMessage,
  getMessagesWithUser,
};