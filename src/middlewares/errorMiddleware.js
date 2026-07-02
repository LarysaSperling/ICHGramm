import multer from "multer";

const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size must not exceed 2 MB",
      });
    }

    return res.status(400).json({
      message: err.message,
    });
  }

  if (err.message === "Only JPG, PNG and WEBP images are allowed") {
    return res.status(400).json({
      message: err.message,
    });
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
};

export default errorMiddleware;