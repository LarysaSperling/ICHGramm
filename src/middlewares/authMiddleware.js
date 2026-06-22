import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      req.user = await User.findById(
        decoded.userId
      ).select("-password");

      next();
    } else {
      res.status(401).json({
        message: "Not authorized",
      });
    }
  } catch (error) {
    res.status(401).json({
      message: "Not authorized",
    });
  }
};

export default authMiddleware;