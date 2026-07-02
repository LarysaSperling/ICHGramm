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
    .sort({ createdAt: -1 })
    .lean();

  res.json(posts);
});

export { getProfile, updateProfile, searchUsers, getMyPosts };