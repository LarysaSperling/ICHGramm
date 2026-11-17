import multer from "multer";

import ApiError from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const upload = multer({
  storage,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter(req, file, cb) {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    // ApiError carries the 400 itself, so errorMiddleware does not have
    // to recognise this error by its text.
    cb(
      new ApiError(
        400,
        "Only JPG, JPEG, PNG and WEBP images are allowed",
      ),
    );
  },
});

export default upload;