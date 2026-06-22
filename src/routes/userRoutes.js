import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  getProfile,
  updateProfile,
  searchUsers,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);

router.put(
  "/profile",
  authMiddleware,
  upload.single("avatar"),
  updateProfile
);
router.get("/search", authMiddleware, searchUsers);

export default router;