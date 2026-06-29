import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
postSchema.index({ createdAt: -1 });

postSchema.index({
  author: 1,
  createdAt: -1,
});


export default mongoose.model("Post", postSchema);