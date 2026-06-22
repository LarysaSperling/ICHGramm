import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import {
  addComment,
  getPostComments,
} from "../controllers/commentController.js";

const router = express.Router();

router.post("/:postId", authMiddleware, addComment);
router.get("/:postId", getPostComments);

export default router;