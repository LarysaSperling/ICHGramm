import { v2 as cloudinary } from "cloudinary";

// Images (posts, stories, avatars) live in Cloudinary; MongoDB keeps only
// the URL and the public_id (REVIEW H-1). Credentials are server-only and
// never reach the client.
const REQUIRED_ENV = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_FOLDER",
];

let configured = false;

// Called once on startup (server.js) and by the migration script, after
// dotenv has loaded. Throws instead of letting the first upload fail
// with a 500.
export const configureCloudinary = () => {
  const missing = REQUIRED_ENV.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing Cloudinary environment variables: ${missing.join(", ")}`,
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });

  configured = true;
};

export const getCloudinary = () => {
  if (!configured) {
    configureCloudinary();
  }

  return cloudinary;
};

// Root folder of this environment: "ichgramm" in production,
// "ichgramm-test" locally, so test files never mix with real ones.
export const getRootFolder = () =>
  process.env.CLOUDINARY_FOLDER.trim().replace(/^\/+|\/+$/g, "");
