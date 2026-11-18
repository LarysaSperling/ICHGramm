import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      default: "",
    },

    // Cloudinary URL. Posts created before the migration to Cloudinary
    // (REVIEW H-1) may still hold a base64 data URL here; the client
    // renders both the same way.
    image: {
      type: String,
      required: true,
    },

    // Cloudinary public_id, needed to delete the file. null for old
    // base64 images.
    imagePublicId: {
      type: String,
      default: null,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model("Post", postSchema);