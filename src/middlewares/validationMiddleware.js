import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];

    return next(
      new ApiError(400, firstError.msg)
    );
  }

  next();
};

export default validationMiddleware;