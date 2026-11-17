import multer from "multer";

import ApiError from "../utils/ApiError.js";

// MongoDB duplicate key (unique index), e.g. two registrations with the
// same username at the same moment.
const isDuplicateKeyError = (err) => err.code === 11000;

const DUPLICATE_MESSAGES = {
  username: "Username is already taken",
  email: "Email is already in use",
};

const getStatusCode = (err) => {
  if (err instanceof multer.MulterError) {
    return 400;
  }

  // Malformed id that did not come from a validated route param
  // (e.g. from the request body).
  if (err.name === "CastError") {
    return 400;
  }

  if (isDuplicateKeyError(err)) {
    return 409;
  }

  return err.statusCode || 500;
};

const getMessage = (err, statusCode) => {
  if (
    err instanceof multer.MulterError &&
    err.code === "LIMIT_FILE_SIZE"
  ) {
    return "File size must not exceed 2 MB";
  }

  if (err.name === "CastError") {
    return `Invalid ${err.path}`;
  }

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue || {})[0];

    return DUPLICATE_MESSAGES[field] || "Already exists";
  }

  // Unexpected errors: internal details (Mongo/driver messages, code
  // errors) stay in the logs. An ApiError(500, "...") was written for
  // the user on purpose, so its message is kept.
  if (statusCode >= 500 && !(err instanceof ApiError)) {
    return "Something went wrong";
  }

  return err.message || "Something went wrong";
};

// Path for the logs: no query string, and the route pattern in place of
// the matched segments, so secrets in the path (e.g.
// /api/auth/reset-password/:token) never reach the logs.
// (req.baseUrl is already reset here, so the mount prefix is taken
// from originalUrl.)
const getLogPath = (req) => {
  const pathname = req.originalUrl.split("?")[0];

  if (typeof req.route?.path !== "string") {
    return pathname;
  }

  const segments = pathname.split("/").filter(Boolean);
  const routeSegments = req.route.path
    .split("/")
    .filter(Boolean);
  const prefix = segments.slice(
    0,
    Math.max(segments.length - routeSegments.length, 0),
  );

  return `/${[...prefix, ...routeSegments].join("/")}`;
};

const errorMiddleware = (err, req, res, next) => {
  const statusCode = getStatusCode(err);
  const message = getMessage(err, statusCode);

  if (statusCode >= 500) {
    // Real server errors: full stack trace.
    console.error(err);
  } else {
    // Expected client errors (401, 400, 403, 404, ...): one short line.
    console.warn(
      `${req.method} ${getLogPath(req)} ${statusCode} ${message}`,
    );
  }

  res.status(statusCode).json({
    message,
  });
};

export default errorMiddleware;
