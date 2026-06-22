import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  createPost,
} from "../controllers/postController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  createPost
);

export default router;