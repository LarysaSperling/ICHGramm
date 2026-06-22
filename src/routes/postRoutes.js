import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  createPost,
  getAllPosts,
  getPostById,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", getAllPosts);
router.get("/:id", getPostById);

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  createPost
);

export default router;