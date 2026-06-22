import User from "../models/User.js";

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.fullName =
      req.body.fullName || user.fullName;

    user.bio =
      req.body.bio || user.bio;

    if (req.file) {
      user.avatar =
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.q;

    if (!keyword) {
      return res.status(400).json({
        message: "Search keyword is required",
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { fullName: { $regex: keyword, $options: "i" } },
      ],
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export {
  getProfile,
  updateProfile,
  searchUsers,
};