import jwt from "jsonwebtoken";

import User, { LEGACY_FOLLOW_FIELDS } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import isTokenRevoked from "../utils/isTokenRevoked.js";

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new ApiError(401, "Not authorized");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "Not authorized");
  }

  // jwt.verify throws errors without statusCode (TokenExpiredError,
  // JsonWebTokenError), which errorMiddleware would turn into 500.
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(
      401,
      error.name === "TokenExpiredError"
        ? "Session expired"
        : "Not authorized",
    );
  }

  const user = await User.findById(decoded.userId).select(
    `-password ${LEGACY_FOLLOW_FIELDS} +passwordChangedAt`,
  );

  if (!user) {
    throw new ApiError(401, "Not authorized");
  }

  // Password changed after this token was issued (REVIEW H-13).
  if (isTokenRevoked(decoded, user)) {
    throw new ApiError(401, "Session expired");
  }

  req.user = user;

  next();
});

export default authMiddleware;