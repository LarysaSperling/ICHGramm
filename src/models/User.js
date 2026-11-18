import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Follows live only in the Follow collection (REVIEW H-7).
    // Old documents may still contain legacy `followers` / `following`
    // arrays; they are not used and are excluded from queries
    // (LEGACY_FOLLOW_FIELDS).

    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Projection that hides the legacy follow arrays still stored in old
// user documents. Use it wherever a query selects "everything".
export const LEGACY_FOLLOW_FIELDS = "-followers -following";

export default mongoose.model("User", userSchema);