import Notification from "../models/Notification.js";

const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  io = null,
}) => {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    post,
  });

  if (io) {
    io.to(recipient.toString()).emit(
      "newNotification",
      notification
    );
  }

  return notification;
};

export { createNotification };