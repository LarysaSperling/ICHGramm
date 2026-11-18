import mongoose from "mongoose";

// How long an expired story is kept before MongoDB's TTL index removes
// it. Expired stories are normally deleted within an hour by
// jobs/cleanupExpiredStories.js, which also deletes the image in
// Cloudinary. A TTL deletion is silent and would leave the file behind,
// so the TTL index is only a safety net (e.g. if Cloudinary was down for
// a long time). REVIEW H-1.
export const STORY_TTL_GRACE_SECONDS = 7 * 24 * 60 * 60;

const storySchema = new mongoose.Schema(
  {
    // Cloudinary URL (stories created before the migration to Cloudinary
    // hold a base64 data URL; they expire within 24 hours anyway).
    image: {
      type: String,
      required: true,
    },

    // Cloudinary public_id, needed to delete the file. null for old
    // base64 stories.
    imagePublicId: {
      type: String,
      default: null,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    // Indexes are built by ensureStoryIndexes() on startup, after the
    // TTL of an existing index has been brought in line with the schema
    // (createIndex cannot change the options of an existing index and
    // would fail with IndexOptionsConflict).
    autoIndex: false,
  }
);

storySchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: STORY_TTL_GRACE_SECONDS,
  }
);

storySchema.index({
  author: 1,
  createdAt: -1,
});

const Story = mongoose.model("Story", storySchema);

const TTL_KEY = { expiresAt: 1 };

const isTtlIndex = (index) =>
  JSON.stringify(index.key) === JSON.stringify(TTL_KEY);

/**
 * Builds the Story indexes. An existing TTL index with another
 * expireAfterSeconds (before H-1 it was 0) is changed first: via collMod,
 * or - if the database user may not run collMod (it is not part of the
 * readWrite role) - by dropping and recreating it. Idempotent.
 *
 * @returns {Promise<string>} what was done, for the startup log
 */
export const ensureStoryIndexes = async () => {
  let indexes = [];

  try {
    indexes = await Story.collection.indexes();
  } catch (error) {
    // The collection does not exist yet.
    if (error.code !== 26) {
      throw error;
    }
  }

  const ttlIndex = indexes.find(isTtlIndex);
  let action = "unchanged";

  if (
    ttlIndex &&
    ttlIndex.expireAfterSeconds !== STORY_TTL_GRACE_SECONDS
  ) {
    try {
      await Story.db.db.command({
        collMod: Story.collection.collectionName,
        index: {
          keyPattern: TTL_KEY,
          expireAfterSeconds: STORY_TTL_GRACE_SECONDS,
        },
      });
      action = `TTL changed via collMod (${ttlIndex.expireAfterSeconds}s -> ${STORY_TTL_GRACE_SECONDS}s)`;
    } catch (error) {
      // 13 = Unauthorized
      if (error.code !== 13) {
        throw error;
      }

      await Story.collection.dropIndex(ttlIndex.name);
      action = `TTL index recreated (${ttlIndex.expireAfterSeconds}s -> ${STORY_TTL_GRACE_SECONDS}s)`;
    }
  }

  await Story.createIndexes();

  return action;
};

export default Story;
