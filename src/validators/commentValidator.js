import { body } from "express-validator";

export const commentValidator = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Comment text is required")
    .isLength({ max: 500 })
    .withMessage("Comment must be less than 500 characters"),
];