import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import {
  addComment,
  getPostComments,
} from "../controllers/commentController.js";
import { commentValidator } from "../validators/commentValidator.js";
import validationMiddleware from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.post(
  "/:postId",
  authMiddleware,
  commentValidator,
  validationMiddleware,
  addComment
);
router.get("/:postId", getPostComments);

export default router;