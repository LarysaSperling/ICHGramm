import Follow from "../models/Follow.js";
import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import { createNotification } from "../services/notificationService.js";

const followUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user._id;

  if (targetUserId === currentUserId.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  const existingFollow = await Follow.findOne({
    follower: currentUserId,
    following: targetUserId,
  });

  if (existingFollow) {
    throw new ApiError(400, "Already following this user");
  }

  const follow = await Follow.create({
    follower: currentUserId,
    following: targetUserId,
  });

  await Promise.all([
    User.findByIdAndUpdate(currentUserId, {
      $addToSet: {
        following: targetUserId,
      },
    }),

    User.findByIdAndUpdate(targetUserId, {
      $addToSet: {
        followers: currentUserId,
      },
    }),
  ]);

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

  const follow = await Follow.findOne({
    follower: currentUserId,
    following: targetUserId,
  });

  if (!follow) {
    throw new ApiError(404, "Follow relationship not found");
  }

  await follow.deleteOne();

  await Promise.all([
    User.findByIdAndUpdate(currentUserId, {
      $pull: {
        following: targetUserId,
      },
    }),

    User.findByIdAndUpdate(targetUserId, {
      $pull: {
        followers: currentUserId,
      },
    }),
  ]);

  res.json({
    message: "User unfollowed successfully",
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