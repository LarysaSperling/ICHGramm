import { body } from "express-validator";

export const messageValidator = [
  body("receiver")
    .notEmpty()
    .withMessage("Receiver is required"),

  body("text")
    .trim()
    .notEmpty()
    .withMessage("Message cannot be empty")
    .isLength({ max: 1000 })
    .withMessage("Message is too long"),
];