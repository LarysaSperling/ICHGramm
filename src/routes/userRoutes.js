import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  getProfile,
  updateProfile,
  searchUsers,
  getMyPosts,
  getUserById,
} from "../controllers/userController.js";

import {
  updateProfileValidator,
  searchUsersValidator,
} from "../validators/userValidator.js";

import validationMiddleware from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);

router.put(
  "/profile",
  authMiddleware,
  upload.single("avatar"),
  updateProfileValidator,
  validationMiddleware,
  updateProfile
);

router.get(
  "/search",
  authMiddleware,
  searchUsersValidator,
  validationMiddleware,
  searchUsers
);

router.get("/profile/posts", authMiddleware, getMyPosts);

router.get("/:id", authMiddleware, getUserById);

export default router;