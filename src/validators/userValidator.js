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

export const MAX_SEARCH_LENGTH = 50;

// Empty or missing q is allowed: the controller returns [] for it.
export const searchUsersValidator = [
  query("q")
    .optional()
    .isString()
    .withMessage("Search keyword must be a string")
    .bail()
    .trim()
    .isLength({ max: MAX_SEARCH_LENGTH })
    .withMessage(
      `Search keyword must be at most ${MAX_SEARCH_LENGTH} characters`,
    ),
];