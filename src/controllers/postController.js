import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import atomicToggle from "../utils/atomicToggle.js";
import { createNotification } from "../services/notificationService.js";
import {
  uploadImage,
  deleteImage,
  deleteImageInBackground,
} from "../services/imageStorage.js";

const createPost = asyncHandler(async (req, res) => {
  const { caption } = req.body;

  if (!caption || caption.trim() === "") {
    throw new ApiError(400, "Caption is required");
  }

  if (!req.file) {
    throw new ApiError(400, "Image is required");
  }

  const { url, publicId } = await uploadImage(req.file.buffer, "posts");

  let post;

  try {
    post = await Post.create({
      caption: caption.trim(),
      image: url,
      imagePublicId: publicId,
      author: req.user._id,
    });
  } catch (error) {
    // The post was not saved: do not leave the file behind.
    await deleteImage(publicId);
    throw error;
  }

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

  const changes = {};

  if (req.body.caption !== undefined) {
    const normalizedCaption = req.body.caption.trim();

    if (!normalizedCaption) {
      throw new ApiError(400, "Caption cannot be empty");
    }

    changes.caption = normalizedCaption;
  }

  if (req.file) {
    const oldPublicId = post.imagePublicId;
    const { url, publicId } = await uploadImage(req.file.buffer, "posts");

    let replaced;

    try {
      // Only if the image is still the one we loaded: with two parallel
      // updates the loser must not delete the winner's file or leave its
      // own behind.
      replaced = await Post.updateOne(
        { _id: post._id, image: post.image },
        { $set: { ...changes, image: url, imagePublicId: publicId } },
      );
    } catch (error) {
      await deleteImage(publicId);
      throw error;
    }

    if (replaced.matchedCount === 0) {
      await deleteImage(publicId);
      throw new ApiError(
        409,
        "The post was changed at the same time, please try again",
      );
    }

    deleteImageInBackground(oldPublicId);
  } else if (Object.keys(changes).length > 0) {
    await Post.updateOne({ _id: post._id }, { $set: changes });
  }

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

  // After the database: if Cloudinary fails, an orphaned file is left,
  // not a broken post.
  deleteImageInBackground(post.imagePublicId);

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
  const result = await atomicToggle(
    Post,
    req.params.id,
    "likes",
    req.user._id,
    {
      populate: {
        path: "author",
        select: "username fullName avatar",
      },
      lean: true,
    },
  );

  if (!result) {
    throw new ApiError(404, "Post not found");
  }

  const { doc: updatedPost, added: liked } = result;

  // author is null if the author's account was deleted
  const authorId = updatedPost.author?._id;

  const isOwnPost =
    authorId?.toString() === req.user._id.toString();

  if (liked && authorId && !isOwnPost) {
    await createNotification({
      recipient: authorId,
      sender: req.user._id,
      type: "like",
      post: updatedPost._id,
      io: req.io,
    });
  }

  res.json({
    post: updatedPost,
    liked,
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