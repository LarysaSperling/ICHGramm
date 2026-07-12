import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

storySchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

storySchema.index({
  author: 1,
  createdAt: -1,
});

export default mongoose.model("Story", storySchema);