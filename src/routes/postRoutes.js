import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  createPost,
  getAllPosts,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", getAllPosts);

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  createPost
);

export default router;