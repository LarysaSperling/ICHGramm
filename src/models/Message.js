import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "post"],
      default: "text",
    },

    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    isSeen: {
      type: Boolean,
      default: false,
    },

    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.pre("validate", function () {
  const hasText = Boolean(this.text?.trim());
  const hasSharedPost = Boolean(this.sharedPost);

  if (!hasText && !hasSharedPost) {
    throw new Error("Message must contain text or a shared post");
  }

  if (this.messageType === "post" && !hasSharedPost) {
    throw new Error("Shared post is required for post messages");
  }

  if (this.messageType === "text" && !hasText) {
    throw new Error("Text is required for text messages");
  }
});

messageSchema.index({
  sender: 1,
  receiver: 1,
  createdAt: -1,
});

messageSchema.index({
  receiver: 1,
  sender: 1,
  createdAt: -1,
});

export default mongoose.model("Message", messageSchema);