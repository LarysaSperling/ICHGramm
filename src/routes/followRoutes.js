import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/followController.js";

const router = express.Router();

router.post("/:userId", authMiddleware, followUser);
router.delete("/:userId", authMiddleware, unfollowUser);

router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

export default router;