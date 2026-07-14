import express from "express";

import {
  register,
  login,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";

import {
  registerValidator,
  loginValidator,
} from "../validators/authValidator.js";

import validationMiddleware from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  registerValidator,
  validationMiddleware,
  register,
);

router.post(
  "/login",
  loginValidator,
  validationMiddleware,
  login,
);

router.post(
  "/reset-password",
  requestPasswordReset,
);

router.post(
  "/reset-password/:token",
  resetPassword,
);

export default router;