import Follow from "../models/Follow.js";
import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import { createNotification } from "../services/notificationService.js";

// The Follow collection is the only source of truth for follows (REVIEW H-7).
// User.followers / User.following are no longer written or read.
//
// Follow and unfollow are idempotent: "follow" when already following, or
// "unfollow" when not following, answer 200 with the resulting state instead
// of an error. A stale button in a second tab therefore just catches up.

const DUPLICATE_KEY = 11000;

const followUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user._id;

  if (targetUserId === currentUserId.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const targetExists = await User.exists({ _id: targetUserId });

  if (!targetExists) {
    throw new ApiError(404, "User not found");
  }

  const pair = {
    follower: currentUserId,
    following: targetUserId,
  };

  let follow;

  try {
    // No "already following?" pre-check: the unique index on
    // { follower, following } decides atomically, even for
    // concurrent requests (double click, two tabs).
    follow = await Follow.create(pair);
  } catch (error) {
    if (error.code !== DUPLICATE_KEY) {
      throw error;
    }

    // Already following -> nothing to do, no second notification.
    return res.json({
      message: "Already following this user",
      isFollowing: true,
      follow: await Follow.findOne(pair).lean(),
    });
  }

  await createNotification({
    recipient: targetUserId,
    sender: currentUserId,
    type: "follow",
    io: req.io,
  });

  res.status(201).json({
    message: "User followed successfully",
    isFollowing: true,
    follow,
  });
});

const unfollowUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user._id;

  if (targetUserId === currentUserId.toString()) {
    throw new ApiError(400, "You cannot unfollow yourself");
  }

  // One atomic operation: concurrent unfollows cannot both "find" the
  // same document and then fail on delete.
  const deleted = await Follow.findOneAndDelete({
    follower: currentUserId,
    following: targetUserId,
  });

  res.json({
    message: deleted
      ? "User unfollowed successfully"
      : "Not following this user",
    isFollowing: false,
  });
});

const getFollowers = asyncHandler(async (req, res) => {
  const followers = await Follow.find({
    following: req.params.userId,
  })
    .populate("follower", "username fullName avatar")
    .sort({ createdAt: -1 })
    .lean();

  res.json(followers);
});

const getFollowing = asyncHandler(async (req, res) => {
  const following = await Follow.find({
    follower: req.params.userId,
  })
    .populate("following", "username fullName avatar")
    .sort({ createdAt: -1 })
    .lean();

  res.json(following);
});

export {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
