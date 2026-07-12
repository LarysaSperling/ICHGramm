import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  createStory,
  getStories,
  getMyStories,
  deleteStory,
} from "../controllers/storyController.js";

const router = express.Router();

router.get("/", authMiddleware, getStories);

router.get("/my", authMiddleware, getMyStories);

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  createStory
);

router.delete(
  "/:id",
  authMiddleware,
  deleteStory
);

export default router;