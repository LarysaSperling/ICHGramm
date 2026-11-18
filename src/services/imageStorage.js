import { getCloudinary, getRootFolder } from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";

// Size limits applied by Cloudinary on upload ("incoming transformation"):
// the stored original is already scaled down, so it takes less space and
// is delivered faster. "limit" never upscales and keeps the aspect ratio.
const KINDS = {
  posts: { width: 1440, height: 1440 },
  stories: { width: 1080, height: 1920 },
  avatars: { width: 400, height: 400 },
};

const UPLOAD_TIMEOUT_MS = 60 * 1000;

/**
 * Uploads an image buffer (from multer.memoryStorage) to Cloudinary.
 *
 * @param {Buffer} buffer
 * @param {"posts" | "stories" | "avatars"} kind
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadImage = (buffer, kind) => {
  const size = KINDS[kind];

  if (!size) {
    throw new Error(`Unknown image kind: ${kind}`);
  }

  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${getRootFolder()}/${kind}`,
        resource_type: "image",
        overwrite: false,
        timeout: UPLOAD_TIMEOUT_MS,
        transformation: [
          {
            ...size,
            crop: "limit",
          },
        ],
      },
      (error, result) => {
        if (error) {
          // The file passed the mimetype check but is not a real image.
          if (error.http_code === 400) {
            reject(new ApiError(400, "Invalid image file"));
            return;
          }

          // Cloudinary unreachable / wrong credentials / quota: the
          // details stay in the logs.
          console.error("Cloudinary upload failed:", error.message);
          reject(new ApiError(502, "Image upload failed, please try again"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
};

/**
 * Deletes an image from Cloudinary. Best effort: a failure is logged and
 * never fails the request (the database change has already happened; an
 * orphaned file is better than a broken post).
 *
 * Records created before the migration have no public_id (base64 in the
 * database) - nothing to delete then.
 *
 * @param {string | null | undefined} publicId
 * @returns {Promise<boolean>} true if Cloudinary confirmed the deletion
 */
export const deleteImage = async (publicId) => {
  if (!publicId) {
    return false;
  }

  try {
    const result = await getCloudinary().uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    // "not found" = already gone, which is the state we want.
    if (result.result !== "ok" && result.result !== "not found") {
      console.error(
        `Cloudinary delete of ${publicId} returned "${result.result}"`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `Cloudinary delete of ${publicId} failed:`,
      error.message || error,
    );
    return false;
  }
};

// Fire-and-forget variant for request handlers: the response does not
// wait for Cloudinary.
export const deleteImageInBackground = (publicId) => {
  if (publicId) {
    deleteImage(publicId);
  }
};
