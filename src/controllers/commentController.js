import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;

  const post = await Post.findById(req.params.postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const comment = await Comment.create({
    text: text.trim(),
    user: req.user._id,
    post: req.params.postId,
  });

  const populatedComment = await comment.populate(
    "user",
    "username fullName avatar"
  );

  if (post.author.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: post.author,
      sender: req.user._id,
      type: "comment",
      post: post._id,
      io: req.io,
    });
  }

  res.status(201).json(populatedComment);
});

const getPostComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({
    post: req.params.postId,
  })
    .populate("user", "username fullName avatar")
    .sort({ createdAt: -1 })
    .lean();

  res.json(comments);
});

export {
  addComment,
  getPostComments,
};