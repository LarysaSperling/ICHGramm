import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import validationMiddleware from "../middlewares/validationMiddleware.js";

import {
  addComment,
  getPostComments,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

import { commentValidator } from "../validators/commentValidator.js";

const router = express.Router();

router.put(
  "/comment/:commentId",
  authMiddleware,
  commentValidator,
  validationMiddleware,
  updateComment,
);

router.delete(
  "/comment/:commentId",
  authMiddleware,
  deleteComment,
);

router.post(
  "/:postId",
  authMiddleware,
  commentValidator,
  validationMiddleware,
  addComment,
);

router.get(
  "/:postId",
  getPostComments,
);

export default router;