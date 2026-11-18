import Story from "../models/Story.js";
import { deleteImage } from "../services/imageStorage.js";

const INTERVAL_MS = 60 * 60 * 1000;
const BATCH_SIZE = 100;

let running = false;

/**
 * Deletes expired stories together with their Cloudinary images.
 * The image is deleted first: if Cloudinary fails, the story stays and
 * the next run retries (it is invisible anyway - GET /stories filters by
 * expiresAt). The TTL index removes whatever is left after
 * STORY_TTL_GRACE_SECONDS.
 *
 * @returns {Promise<{ deleted: number, failed: number }>}
 */
export const cleanupExpiredStories = async () => {
  if (running) {
    return { deleted: 0, failed: 0 };
  }

  running = true;

  let deleted = 0;
  let failed = 0;

  try {
    const now = new Date();
    const failedIds = [];

    // Batches, so a long backlog never loads everything at once.
    // Stories whose image could not be deleted are skipped.
    for (;;) {
      const stories = await Story.find({
        expiresAt: { $lte: now },
        _id: { $nin: failedIds },
      })
        .select("_id imagePublicId")
        .limit(BATCH_SIZE)
        .lean();

      if (stories.length === 0) {
        break;
      }

      for (const story of stories) {
        const imageGone =
          !story.imagePublicId ||
          (await deleteImage(story.imagePublicId));

        if (!imageGone) {
          failed += 1;
          failedIds.push(story._id);
          continue;
        }

        const result = await Story.deleteOne({
          _id: story._id,
          expiresAt: { $lte: now },
        });

        deleted += result.deletedCount;
      }
    }

    if (deleted > 0 || failed > 0) {
      console.log(
        `Expired stories cleanup: ${deleted} deleted, ${failed} kept (image delete failed)`,
      );
    }
  } catch (error) {
    console.error("Expired stories cleanup failed:", error.message);
  } finally {
    running = false;
  }

  return { deleted, failed };
};

// Runs once on startup (Render's free tier sleeps, so every wake-up
// catches up) and then every hour while the server is awake.
export const startExpiredStoriesCleanup = () => {
  cleanupExpiredStories();

  const timer = setInterval(cleanupExpiredStories, INTERVAL_MS);
  timer.unref();

  return timer;
};
