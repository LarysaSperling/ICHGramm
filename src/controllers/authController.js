import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import generateToken from "../config/jwt.js";
import { sendEmail } from "../config/email.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const register = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

  const userExists = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { username: normalizedUsername },
    ],
  });

  if (userExists) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username: normalizedUsername,
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  if (!user) {
    throw new ApiError(500, "Failed to create user");
  }

  res.status(201).json({
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar || "",
    token: generateToken(user._id),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  res.json({
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar || "",
    token: generateToken(user._id),
  });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier?.trim().toLowerCase();

  if (!identifier) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({
    $or: [
      { email: identifier },
      { username: identifier },
    ],
  });

  const publicMessage =
    "If an account with these details exists, a password reset link has been sent.";

  if (!user) {
    return res.status(200).json({
      message: publicMessage,
    });
  }

  const resetToken = jwt.sign(
    {
      userId: user._id.toString(),
      purpose: "password-reset",
    },
    process.env.RESET_TOKEN_SECRET,
    {
      expiresIn: process.env.RESET_TOKEN_EXPIRES_IN || "15m",
    }
  );

  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = new Date(
    Date.now() + 15 * 60 * 1000
  );

  await user.save();

  const resetUrl =
    `${process.env.CLIENT_URL}/new-password?token=` +
    encodeURIComponent(resetToken);

  try {
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset your ICHGramm password",
      text: [
        `Hello ${user.fullName},`,
        "",
        "We received a request to reset your ICHGramm password.",
        `Open this link to choose a new password: ${resetUrl}`,
        "",
        "This link expires in 15 minutes.",
        "If you did not request this change, ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Reset your ICHGramm password</h2>

          <p>Hello ${user.fullName},</p>

          <p>
            We received a request to reset your ICHGramm password.
          </p>

          <p>
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 20px;
                border-radius: 8px;
                background: #0095f6;
                color: #ffffff;
                text-decoration: none;
                font-weight: 700;
              "
            >
              Choose a new password
            </a>
          </p>

          <p>This link expires in 15 minutes.</p>

          <p>
            If you did not request this change, you can ignore this email.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message: publicMessage,

      // Лише для локального Ethereal-тестування.
      previewUrl: emailResult.previewUrl,
    });
  } catch (error) {
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    console.error("Password reset email error:", error);

    throw new ApiError(
      500,
      "Failed to send password reset email"
    );
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token) {
    throw new ApiError(400, "Reset token is required");
  }

  if (!password || !confirmPassword) {
    throw new ApiError(
      400,
      "Password and password confirmation are required"
    );
  }

  if (password.length < 6) {
    throw new ApiError(
      400,
      "Password must contain at least 6 characters"
    );
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(
      token,
      process.env.RESET_TOKEN_SECRET
    );
  } catch {
    throw new ApiError(
      400,
      "Reset link is invalid or has expired"
    );
  }

  if (decodedToken.purpose !== "password-reset") {
    throw new ApiError(400, "Invalid reset token");
  }

  const resetTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    _id: decodedToken.userId,
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires: {
      $gt: new Date(),
    },
  }).select(
    "+resetPasswordToken +resetPasswordExpires"
  );

  if (!user) {
    throw new ApiError(
      400,
      "Reset link is invalid or has expired"
    );
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;

  await user.save();

  res.status(200).json({
    message:
      "Password has been reset successfully. You can now log in.",
  });
});

export {
  register,
  login,
  requestPasswordReset,
  resetPassword,
};