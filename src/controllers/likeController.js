import Like from "../models/Like.js";
import Post from "../models/Post.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const existingLike = await Like.findOne({
    user: req.user._id,
    post: req.params.postId,
  });

  if (existingLike) {
    await existingLike.deleteOne();

    return res.json({
      message: "Like removed",
    });
  }

  await Like.create({
    user: req.user._id,
    post: req.params.postId,
  });

  if (post.author.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: post.author,
      sender: req.user._id,
      type: "like",
      post: post._id,
      io: req.io,
    });
  }

  res.json({
    message: "Post liked",
  });
});

export { toggleLike };