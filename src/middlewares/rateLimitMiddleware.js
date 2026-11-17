import {
  rateLimit,
  ipKeyGenerator,
} from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// On Render every request comes through Cloudflare, which sets
// CF-Connecting-IP to the real client IP and rejects requests that try
// to send this header themselves (403, error 1000). req.ip is only a
// Cloudflare edge IP there, so users would share counters (REVIEW M-21e).
// Locally there is no Cloudflare and the header is absent -> req.ip.
// ipKeyGenerator groups IPv6 addresses by /56 so one user cannot rotate
// through their own IPv6 range.
const clientIpKey = (req) =>
  ipKeyGenerator(
    req.headers["cf-connecting-ip"] || req.ip,
  );

// Login, register and setting a new password.
// Only failed requests (status >= 400) are counted,
// so normal users who log in successfully are never blocked.
const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: clientIpKey,
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
  keyGenerator: clientIpKey,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many password reset requests. Please try again in an hour.",
  },
});

export { authLimiter, passwordResetRequestLimiter };
