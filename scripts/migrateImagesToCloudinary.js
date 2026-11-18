// One-off migration of base64 images stored in MongoDB to Cloudinary
// (REVIEW H-1):
//   - posts.image  -> Cloudinary URL + posts.imagePublicId
//   - users.avatar -> Cloudinary URL + users.avatarPublicId
// Stories are NOT migrated: they expire within 24 hours, and the API
// handles old base64 stories (no public_id = nothing to delete).
//
// Usage (from the repo root, uses MONGO_URI and CLOUDINARY_* from .env):
//   npm run migrate:images                       dry run: only counts
//   npm run migrate:images -- --apply            migrate
//   npm run migrate:images -- --apply --limit 1  migrate one image (trial)
//   npm run migrate:images -- --apply --backup-dir "D:\backups"
//
// Safety:
//   - Dry run by default; nothing is written without --apply.
//   - Only values starting with "data:" are touched, so running it again
//     is safe (already migrated records are skipped).
//   - Before each upload the original value is appended to a backup file
//     (JSON lines). The backup directory must be outside the repository
//     and outside OneDrive; default: <home>/ichgramm-backups.
//   - The record is updated only if the image is still the one that was
//     read; if it changed meanwhile, the uploaded file is deleted again.
//   - Does not import the Mongoose models (no index builds) and connects
//     with autoIndex / autoCreate disabled.
// PRIVACY: prints only ids, sizes and counts - never image data.
//
// Exit code: 0 = done (or nothing to do), 2 = some records failed, 1 = error.
import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import { configureCloudinary, getRootFolder } from "../src/config/cloudinary.js";
import { uploadImage, deleteImage } from "../src/services/imageStorage.js";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const TARGETS = [
  {
    collection: "posts",
    field: "image",
    publicIdField: "imagePublicId",
    kind: "posts",
  },
  {
    collection: "users",
    field: "avatar",
    publicIdField: "avatarPublicId",
    kind: "avatars",
  },
];

const DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is;

const parseArgs = (argv) => {
  const args = { apply: false, limit: Infinity, backupDir: null };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--apply") {
      args.apply = true;
    } else if (arg === "--limit") {
      args.limit = Number(argv[++i]);
      if (!Number.isInteger(args.limit) || args.limit < 1) {
        throw new Error("--limit must be a positive integer");
      }
    } else if (arg === "--backup-dir") {
      args.backupDir = argv[++i];
      if (!args.backupDir) {
        throw new Error("--backup-dir needs a path");
      }
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
};

const isInside = (child, parent) => {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

// The backup holds the original images: never inside the repository
// (could be committed) and never in OneDrive (synced to the cloud).
const resolveBackupDir = (requested) => {
  const dir = path.resolve(
    requested || path.join(os.homedir(), "ichgramm-backups"),
  );

  if (isInside(dir, REPO_ROOT)) {
    throw new Error(`Backup directory is inside the repository: ${dir}`);
  }

  const oneDriveRoots = [
    process.env.OneDrive,
    process.env.OneDriveConsumer,
    process.env.OneDriveCommercial,
  ].filter(Boolean);

  if (
    /onedrive/i.test(dir) ||
    oneDriveRoots.some((root) => isInside(dir, path.resolve(root)))
  ) {
    throw new Error(`Backup directory is inside OneDrive: ${dir}`);
  }

  return dir;
};

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  configureCloudinary();

  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false,
    autoCreate: false,
  });

  const db = mongoose.connection.db;

  console.log(
    `Database: ${db.databaseName}, Cloudinary folder: ${getRootFolder()}`,
  );
  console.log(args.apply ? "Mode: APPLY\n" : "Mode: dry run (nothing is written)\n");

  // Find what has to be migrated: ids and sizes only.
  const plan = [];

  for (const target of TARGETS) {
    const docs = await db
      .collection(target.collection)
      .aggregate([
        { $match: { [target.field]: { $regex: /^data:/ } } },
        {
          $project: {
            _id: 1,
            size: { $strLenBytes: `$${target.field}` },
          },
        },
      ])
      .toArray();

    const total = docs.reduce((sum, doc) => sum + doc.size, 0);
    console.log(
      `${target.collection}.${target.field}: ${docs.length} base64 image(s), ${mb(total)}`,
    );

    for (const doc of docs) {
      plan.push({ target, _id: doc._id, size: doc.size });
    }
  }

  const base64Stories = await db
    .collection("stories")
    .countDocuments({ image: { $regex: /^data:/ } });
  console.log(
    `stories.image: ${base64Stories} base64 image(s) - not migrated, they expire on their own`,
  );

  if (plan.length === 0) {
    console.log("\nNothing to migrate.");
    return 0;
  }

  if (!args.apply) {
    console.log(
      `\nDry run: ${plan.length} image(s) would be uploaded. Run with --apply to migrate.`,
    );
    return 0;
  }

  const backupDir = resolveBackupDir(args.backupDir);
  fs.mkdirSync(backupDir, { recursive: true });

  const backupFile = path.join(
    backupDir,
    `images-${db.databaseName}-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`,
  );
  console.log(`\nBackup file: ${backupFile}\n`);

  const stats = { migrated: 0, changed: 0, failed: 0 };
  const queue = plan.slice(0, args.limit);

  for (const { target, _id } of queue) {
    const label = `${target.collection} ${_id}`;
    const collection = db.collection(target.collection);

    try {
      const doc = await collection.findOne(
        { _id },
        { projection: { [target.field]: 1 } },
      );
      const value = doc?.[target.field];

      if (typeof value !== "string" || !value.startsWith("data:")) {
        console.log(`--  ${label}: already migrated or deleted, skipped`);
        continue;
      }

      const match = DATA_URL.exec(value);

      if (!match) {
        console.log(`!!  ${label}: not a valid base64 image, skipped`);
        stats.failed += 1;
        continue;
      }

      // Original first, synchronously: if anything below fails, the
      // value is already safe on disk.
      fs.appendFileSync(
        backupFile,
        `${JSON.stringify({
          collection: target.collection,
          _id: _id.toString(),
          field: target.field,
          value,
        })}\n`,
      );

      const buffer = Buffer.from(match[2], "base64");
      const { url, publicId } = await uploadImage(buffer, target.kind);

      const result = await collection.updateOne(
        { _id, [target.field]: value },
        { $set: { [target.field]: url, [target.publicIdField]: publicId } },
      );

      if (result.matchedCount === 0) {
        await deleteImage(publicId);
        console.log(`--  ${label}: changed during the migration, skipped`);
        stats.changed += 1;
        continue;
      }

      stats.migrated += 1;
      console.log(
        `OK  ${label}: ${mb(value.length)} -> ${publicId}`,
      );
    } catch (error) {
      stats.failed += 1;
      console.log(`!!  ${label}: ${error.message}`);
    }
  }

  console.log(
    `\nRESULT: ${stats.migrated} migrated, ${stats.changed} skipped (changed meanwhile), ${stats.failed} failed` +
      (queue.length < plan.length
        ? `, ${plan.length - queue.length} left (--limit)`
        : ""),
  );
  console.log(`Backup: ${backupFile}`);

  return stats.failed > 0 ? 2 : 0;
};

main()
  .then(async (code) => {
    await mongoose.disconnect();
    process.exit(code);
  })
  .catch(async (error) => {
    console.error("Migration failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
