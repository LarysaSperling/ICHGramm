import { body } from "express-validator";

export const messageValidator = [
  body("receiver")
    .notEmpty()
    .withMessage("Receiver is required"),

  body("text")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Message is too long"),

  body("messageType")
    .optional()
    .isIn(["text", "post"])
    .withMessage("Invalid message type"),

  body("sharedPost")
    .optional()
    .isMongoId()
    .withMessage("Invalid post id"),

  body().custom((value) => {
    const hasText = value.text && value.text.trim().length > 0;
    const hasPost = Boolean(value.sharedPost);

    if (!hasText && !hasPost) {
      throw new Error("Message text or shared post is required");
    }

    return true;
  }),
];