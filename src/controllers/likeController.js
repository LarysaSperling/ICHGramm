import Like from "../models/Like.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";

const toggleLike = async (req, res) => {
  try {
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

    const post = await Post.findById(req.params.postId);

    if (post && post.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: "like",
        post: post._id,
      });

      if (req.io) {
        req.io
          .to(post.author.toString())
          .emit("newNotification", notification);
      }
    }

    res.json({
      message: "Post liked",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export { toggleLike };