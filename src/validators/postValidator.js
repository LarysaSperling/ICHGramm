import { body } from "express-validator";

export const createPostValidator = [
  body("caption")
    .trim()
    .notEmpty()
    .withMessage("Caption is required")
    .isLength({ max: 500 })
    .withMessage("Caption must be less than 500 characters"),
];

export const updatePostValidator = [
  body("caption")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Caption cannot be empty")
    .isLength({ max: 500 })
    .withMessage("Caption must be less than 500 characters"),
];