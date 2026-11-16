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
import {
  authLimiter,
  passwordResetRequestLimiter,
} from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  registerValidator,
  validationMiddleware,
  register,
);

router.post(
  "/login",
  authLimiter,
  loginValidator,
  validationMiddleware,
  login,
);

router.post(
  "/reset-password",
  passwordResetRequestLimiter,
  requestPasswordReset,
);

router.post(
  "/reset-password/:token",
  authLimiter,
  resetPassword,
);

export default router;