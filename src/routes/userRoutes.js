import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  getProfile,
  updateProfile,
  searchUsers,
  getMyPosts,
  getUserById,
  toggleFollowUser,
  toggleSavedPost,
  getSavedPosts,
  getShareUsers,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, upload.single("avatar"), updateProfile);

router.get("/profile/posts", authMiddleware, getMyPosts);
router.get("/me/posts", authMiddleware, getMyPosts);

router.get("/search", authMiddleware, searchUsers);
router.get("/share-list", authMiddleware, getShareUsers);

router.get("/saved", authMiddleware, getSavedPosts);
router.post("/saved/:postId", authMiddleware, toggleSavedPost);

router.post("/:id/follow", authMiddleware, toggleFollowUser);
router.get("/:id", authMiddleware, getUserById);

export default router;