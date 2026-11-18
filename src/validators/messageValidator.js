import { body } from "express-validator";

// REVIEW H-12. Custom validators on purpose: standard express-validator
// validators run on every element of an array, so e.g. receiver: ["<id>"]
// or messageType: ["text"] would pass and reach the database.

const MAX_TEXT_LENGTH = 1000;

const isObjectIdString = (value) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

const getMessageType = (req) => req.body.messageType ?? "text";

// The client sends two shapes:
//   text:        { receiver, text, messageType: "text" }
//   shared post: { receiver, messageType: "post", sharedPost }
export const messageValidator = [
  body("receiver").custom((receiver) => {
    if (receiver === undefined || receiver === null || receiver === "") {
      throw new Error("Receiver is required");
    }

    if (!isObjectIdString(receiver)) {
      throw new Error("Invalid receiver id");
    }

    return true;
  }),

  body("messageType").custom((messageType) => {
    if (
      messageType !== undefined &&
      messageType !== "text" &&
      messageType !== "post"
    ) {
      throw new Error("Invalid message type");
    }

    return true;
  }),

  body("text").custom((text, { req }) => {
    if (text !== undefined && typeof text !== "string") {
      throw new Error("Message text must be a string");
    }

    const normalizedText = text?.trim() ?? "";

    if (getMessageType(req) === "text" && !normalizedText) {
      throw new Error("Message text is required");
    }

    if (normalizedText.length > MAX_TEXT_LENGTH) {
      throw new Error("Message is too long");
    }

    return true;
  }),

  body("sharedPost").custom((sharedPost, { req }) => {
    // Only a "post" message carries a post; for text messages the
    // controller ignores the field.
    if (getMessageType(req) !== "post") {
      return true;
    }

    if (!sharedPost) {
      throw new Error("Shared post is required");
    }

    if (!isObjectIdString(sharedPost)) {
      throw new Error("Invalid post id");
    }

    return true;
  }),
];

// PUT /messages/message/:messageId
export const editMessageValidator = [
  body("text").custom((text) => {
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Message cannot be empty");
    }

    if (text.trim().length > MAX_TEXT_LENGTH) {
      throw new Error("Message is too long");
    }

    return true;
  }),
];
