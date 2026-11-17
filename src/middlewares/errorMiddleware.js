import multer from "multer";

const getStatusCode = (err) => {
  if (err instanceof multer.MulterError) {
    return 400;
  }

  return err.statusCode || 500;
};

const getMessage = (err) => {
  if (
    err instanceof multer.MulterError &&
    err.code === "LIMIT_FILE_SIZE"
  ) {
    return "File size must not exceed 2 MB";
  }

  return err.message || "Internal Server Error";
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
  const message = getMessage(err);

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
