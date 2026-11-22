import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ post: 1 });
// The 2 newest comments of each post in the feed (REVIEW M-2): match by
// post, sort by date, take 2 - straight from the index. Built by Mongoose
// autoIndex; server.js waits for it and logs the result.
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ createdAt: -1 });

export default mongoose.model("Comment", commentSchema);