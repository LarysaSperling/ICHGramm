import Follow from "../models/Follow.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot follow yourself",
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: targetUserId,
    });

    if (existingFollow) {
      return res.status(400).json({
        message: "Already following this user",
      });
    }

    const follow = await Follow.create({
      follower: req.user._id,
      following: targetUserId,
    });

const notification = await Notification.create({
  recipient: targetUserId,
  sender: req.user._id,
  type: "follow",
});

if (req.io) {
  req.io
    .to(targetUserId.toString())
    .emit("newNotification", notification);
}

    res.status(201).json({
      message: "User followed successfully",
      follow,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    const follow = await Follow.findOne({
      follower: req.user._id,
      following: targetUserId,
    });

    if (!follow) {
      return res.status(404).json({
        message: "Follow relationship not found",
      });
    }

    await follow.deleteOne();

    res.json({
      message: "User unfollowed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getFollowers = async (req, res) => {
  try {
    const followers = await Follow.find({
      following: req.params.userId,
    }).populate("follower", "username fullName avatar");

    res.json(followers);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getFollowing = async (req, res) => {
  try {
    const following = await Follow.find({
      follower: req.params.userId,
    }).populate("following", "username fullName avatar");

    res.json(following);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};