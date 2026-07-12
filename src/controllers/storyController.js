import Story from "../models/Story.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const createStory = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Story image is required");
  }

  const image = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
    "base64"
  )}`;

  const story = await Story.create({
    image,
    author: req.user._id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const populatedStory = await Story.findById(story._id)
    .populate("author", "username fullName avatar")
    .lean();

  res.status(201).json(populatedStory);
});

const getStories = asyncHandler(async (req, res) => {
  const stories = await Story.find({
    expiresAt: {
      $gt: new Date(),
    },
  })
    .populate("author", "username fullName avatar")
    .sort({
      createdAt: -1,
    })
    .lean();

  res.json(stories);
});

const getMyStories = asyncHandler(async (req, res) => {
  const stories = await Story.find({
    author: req.user._id,
    expiresAt: {
      $gt: new Date(),
    },
  })
    .populate("author", "username fullName avatar")
    .sort({
      createdAt: -1,
    })
    .lean();

  res.json(stories);
});

const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  if (story.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this story");
  }

  await story.deleteOne();

  res.json({
    message: "Story deleted successfully",
    storyId: req.params.id,
  });
});

export {
  createStory,
  getStories,
  getMyStories,
  deleteStory,
};