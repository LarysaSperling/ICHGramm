import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// Login, register and setting a new password.
// Only failed requests (status >= 400) are counted,
// so normal users who log in successfully are never blocked.
const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many attempts. Please try again in 15 minutes.",
  },
});

// Requesting a reset email always answers 200 (so it does not reveal
// whether an account exists), therefore every request is counted.
// Protects the mailbox from being used to spam people.
const passwordResetRequestLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many password reset requests. Please try again in an hour.",
  },
});

export { authLimiter, passwordResetRequestLimiter };
