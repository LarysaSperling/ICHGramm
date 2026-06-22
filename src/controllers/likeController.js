import Like from "../models/Like.js";

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