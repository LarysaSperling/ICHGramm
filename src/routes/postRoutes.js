import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getExplorePosts,
} from "../controllers/postController.js";
import {
  createPostValidator,
  updatePostValidator,
} from "../validators/postValidator.js";

import validationMiddleware from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.get("/explore", getExplorePosts);

router.get("/", getAllPosts);
router.get("/:id", getPostById);

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  createPostValidator,
  validationMiddleware,
  createPost
);

router.put(
  "/:id",
  authMiddleware,
  upload.single("image"),
  updatePostValidator,
  validationMiddleware,
  updatePost
);

router.delete(
  "/:id",
  authMiddleware,
  deletePost
);

export default router;