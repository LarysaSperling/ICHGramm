import mongoose from "mongoose";

import ApiError from "../utils/ApiError.js";

// Param handler for router.param(): rejects a malformed id with 400
// before any controller runs, instead of a Mongoose CastError (500).
// isObjectIdOrHexString accepts only a 24-character hex string;
// isValidObjectId would also accept any 12-character string.
//
// Usage: router.param("id", validateObjectId);
// Covers every route of that router that has :id in its path.
const validateObjectId = (req, res, next, value, name) => {
  if (!mongoose.isObjectIdOrHexString(value)) {
    next(new ApiError(400, `Invalid ${name}`));
    return;
  }

  next();
};

export default validateObjectId;
