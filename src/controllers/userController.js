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

export { getProfile };