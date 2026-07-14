import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

const createPost = asyncHandler(async (req, res) => {
  const { caption } = req.body;

  if (!caption || caption.trim() === "") {
    throw new ApiError(400, "Caption is required");
  }

  if (!req.file) {
    throw new ApiError(400, "Image is required");
  }

  const image = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
    "base64",
  )}`;

  const post = await Post.create({
    caption: caption.trim(),
    image,
    author: req.user._id,
  });

  const populatedPost = await Post.findById(post._id)
    .populate("author", "username fullName avatar")
    .lean();

  res.status(201).json(populatedPost);
});

const getAllPosts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(req.query.limit) || 5, 1),
    20,
  );

  const skip = (page - 1) * limit;

  const [totalPosts, posts] = await Promise.all([
    Post.countDocuments(),

    Post.find()
      .populate("author", "username fullName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  res.json({
    page,
    limit,
    totalPosts,
    totalPages: Math.ceil(totalPosts / limit),
    hasMore: skip + posts.length < totalPosts,
    posts,
  });
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("author", "username fullName avatar")
    .lean();

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  res.json(post);
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (req.body.caption !== undefined) {
    const normalizedCaption = req.body.caption.trim();

    if (!normalizedCaption) {
      throw new ApiError(400, "Caption cannot be empty");
    }

    post.caption = normalizedCaption;
  }

  if (req.file) {
    post.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64",
    )}`;
  }

  await post.save();

  const updatedPost = await Post.findById(post._id)
    .populate("author", "username fullName avatar")
    .lean();

  res.json(updatedPost);
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  await Promise.all([
    Comment.deleteMany({
      post: post._id,
    }),

    Notification.deleteMany({
      post: post._id,
    }),

    User.updateMany(
      {
        savedPosts: post._id,
      },
      {
        $pull: {
          savedPosts: post._id,
        },
      },
    ),
  ]);

  await post.deleteOne();

  res.json({
    message: "Post deleted successfully",
  });
});

const getExplorePosts = asyncHandler(async (req, res) => {
  const posts = await Post.aggregate([
    {
      $sample: {
        size: 60,
      },
    },
  ]);

  const populatedPosts = await Post.populate(posts, {
    path: "author",
    select: "username fullName avatar",
  });

  res.json(populatedPosts);
});

const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const userId = req.user._id.toString();

  const alreadyLiked = post.likes.some(
    (like) => like.toString() === userId,
  );

  if (alreadyLiked) {
    post.likes = post.likes.filter(
      (like) => like.toString() !== userId,
    );
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();

  const isOwnPost =
    post.author.toString() === req.user._id.toString();

  if (!alreadyLiked && !isOwnPost) {
    await createNotification({
      recipient: post.author,
      sender: req.user._id,
      type: "like",
      post: post._id,
      io: req.io,
    });
  }

  const updatedPost = await Post.findById(post._id)
    .populate("author", "username fullName avatar")
    .lean();

  res.json({
    post: updatedPost,
    liked: !alreadyLiked,
    likesCount: updatedPost.likes.length,
  });
});

export {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getExplorePosts,
  toggleLikePost,
};