import Post from "../models/Post.js";

const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    const image =
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const post = await Post.create({
      caption: req.body.caption,
      image,
      author: req.user._id,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export { createPost };