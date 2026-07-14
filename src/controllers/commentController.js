import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;

  const post = await Post.findById(
    req.params.postId,
  );

  if (!post) {
    throw new ApiError(
      404,
      "Post not found",
    );
  }

  const comment = await Comment.create({
    text: text.trim(),
    user: req.user._id,
    post: post._id,
  });

  const populatedComment =
    await Comment.findById(comment._id)
      .populate(
        "user",
        "username fullName avatar",
      )
      .lean();

  if (
    post.author.toString() !==
    req.user._id.toString()
  ) {
    await createNotification({
      recipient: post.author,
      sender: req.user._id,
      type: "comment",
      post: post._id,
      io: req.io,
    });
  }

  res.status(201).json(
    populatedComment,
  );
});

const getPostComments = asyncHandler(
  async (req, res) => {
    const comments = await Comment.find({
      post: req.params.postId,
    })
      .populate(
        "user",
        "username fullName avatar",
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    res.json(comments);
  },
);

const updateComment = asyncHandler(
  async (req, res) => {
    const comment = await Comment.findById(
      req.params.commentId,
    );

    if (!comment) {
      throw new ApiError(
        404,
        "Comment not found",
      );
    }

    if (
      comment.user.toString() !==
      req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You can edit only your own comments",
      );
    }

    comment.text = req.body.text.trim();

    await comment.save();

    const updatedComment =
      await Comment.findById(comment._id)
        .populate(
          "user",
          "username fullName avatar",
        )
        .lean();

    res.json(updatedComment);
  },
);

const deleteComment = asyncHandler(
  async (req, res) => {
    const comment = await Comment.findById(
      req.params.commentId,
    );

    if (!comment) {
      throw new ApiError(
        404,
        "Comment not found",
      );
    }

    if (
      comment.user.toString() !==
      req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You can delete only your own comments",
      );
    }

    const deletedCommentId =
      comment._id.toString();

    const postId =
      comment.post.toString();

    await comment.deleteOne();

    res.json({
      message:
        "Comment deleted successfully",
      commentId: deletedCommentId,
      postId,
    });
  },
);

export {
  addComment,
  getPostComments,
  updateComment,
  deleteComment,
};