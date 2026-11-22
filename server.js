import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import http from "http";

import connectDB from "./src/config/db.js";
import { configureCloudinary } from "./src/config/cloudinary.js";
import { ensureStoryIndexes } from "./src/models/Story.js";
import Message from "./src/models/Message.js";
import Notification from "./src/models/Notification.js";
import { startExpiredStoriesCleanup } from "./src/jobs/cleanupExpiredStories.js";
import initializeSocket from "./src/socket/socket.js";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import postRoutes from "./src/routes/postRoutes.js";
import commentRoutes from "./src/routes/commentRoutes.js";
import followRoutes from "./src/routes/followRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import storyRoutes from "./src/routes/storyRoutes.js";

import errorMiddleware from "./src/middlewares/errorMiddleware.js";
import ApiError from "./src/utils/ApiError.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // 403 (not 500) and no stack trace in the logs; the cors package
    // passes this error on to errorMiddleware, also for preflight OPTIONS.
    callback(
      new ApiError(
        403,
        "CORS blocked request from this origin",
      ),
    );
  },
  credentials: true,
};

// On Render a request passes Cloudflare -> Render load balancer ->
// local proxy (127.0.0.1) -> app (measured 17.11.2026, REVIEW M-21e).
// With this setting req.ip is a Cloudflare edge IP, which changes from
// request to request. Rate limits therefore do NOT use req.ip: they key
// on the CF-Connecting-IP header (see rateLimitMiddleware.js).
app.set("trust proxy", 2);

app.use(
  helmet({
    // The API is called from the frontend on another domain (Vercel).
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(cors(corsOptions));
app.use(express.json());

const io = initializeSocket(
  server,
  allowedOrigins,
);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/follows", followRoutes);
app.use(
  "/api/notifications",
  notificationRoutes,
);
app.use("/api/messages", messageRoutes);
app.use("/api/stories", storyRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "ICHGramm API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Fails fast if a Cloudinary variable is missing (REVIEW H-1).
    configureCloudinary();

    await connectDB();

    const storyIndexes = await ensureStoryIndexes();
    console.log(`Story indexes: ${storyIndexes}`);

    // Mongoose builds the Message indexes itself (autoIndex) and only
    // reports a failure as a model event that nobody listens to. Wait for
    // them so a failure shows up in the log. Not fatal: without the
    // clientId index (REVIEW M-8) a retry is still found by the lookup in
    // sendMessage, only two copies arriving at the same moment are not
    // caught.
    try {
      await Message.init();
      console.log("Message indexes: ok");
    } catch (error) {
      console.error("Message indexes failed:", error.message);
    }

    // Same for the Notification indexes (REVIEW M-4). Not fatal either:
    // without the groupKey index a like / follow notification is still
    // found by the upsert, only two at the very same moment are not
    // caught.
    try {
      await Notification.init();
      console.log("Notification indexes: ok");
    } catch (error) {
      console.error("Notification indexes failed:", error.message);
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Server running on port ${PORT}`,
      );

      startExpiredStoriesCleanup();
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message,
    );

    process.exit(1);
  }
};

startServer();