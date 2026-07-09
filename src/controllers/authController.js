import bcrypt from "bcrypt";

import User from "../models/User.js";
import generateToken from "../config/jwt.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const register = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;

  const userExists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (userExists) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    fullName,
    email,
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

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

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

export { register, login };