import { body, query } from "express-validator";

export const updateProfileValidator = [
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Full name must be less than 100 characters"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio must be less than 300 characters"),
];

export const searchUsersValidator = [
  query("q")
    .trim()
    .notEmpty()
    .withMessage("Search keyword is required"),
];