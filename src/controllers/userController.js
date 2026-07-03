import User from "../models/User.js";
import Post from "../models/Post.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password").lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json(user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const fullName = req.body?.fullName;
  const bio = req.body?.bio;
  const website = req.body?.website;

  if (fullName !== undefined) {
    if (fullName.trim() === "") {
      throw new ApiError(400, "Full name cannot be empty");
    }

    user.fullName = fullName.trim();
  }

  if (bio !== undefined) {
    user.bio = bio.trim();
  }

  if (website !== undefined) {
    user.website = website.trim();
  }

  if (req.file) {
    user.avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    username: updatedUser.username,
    fullName: updatedUser.fullName,
    email: updatedUser.email,
    bio: updatedUser.bio,
    website: updatedUser.website,
    avatar: updatedUser.avatar,
  });
});

const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.q;

  if (!keyword || keyword.trim() === "") {
    throw new ApiError(400, "Search keyword is required");
  }

  const users = await User.find({
    $or: [
      { username: { $regex: keyword.trim(), $options: "i" } },
      { fullName: { $regex: keyword.trim(), $options: "i" } },
    ],
  })
    .select("-password")
    .lean();

  res.json(users);
});

const getMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user._id })
    .populate("author", "username fullName avatar")
    .sort({ createdAt: -1 })
    .lean();

  res.json(posts);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const posts = await Post.find({ author: req.params.id })
    .populate("author", "username fullName avatar")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    user,
    posts,
  });
});

const toggleFollowUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user._id.toString();

  if (targetUserId === currentUserId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const targetUser = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser || !currentUser) {
    throw new ApiError(404, "User not found");
  }

  const isFollowing = targetUser.followers.some(
    (followerId) => followerId.toString() === currentUserId
  );

  if (isFollowing) {
    targetUser.followers = targetUser.followers.filter(
      (followerId) => followerId.toString() !== currentUserId
    );

    currentUser.following = currentUser.following.filter(
      (followingId) => followingId.toString() !== targetUserId
    );
  } else {
    targetUser.followers.push(currentUserId);
    currentUser.following.push(targetUserId);
  }

  await targetUser.save();
  await currentUser.save();

  res.json({
    message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
    isFollowing: !isFollowing,
    followersCount: targetUser.followers.length,
    followingCount: currentUser.following.length,
  });
});

export {
  getProfile,
  updateProfile,
  searchUsers,
  getMyPosts,
  getUserById,
  toggleFollowUser,
};