// One-off cleanup of the notifications collection (REVIEW M-4 / M-5).
// Before M-4 every like / follow created a new notification and unlike /
// unfollow did not remove it, so old data has duplicates and leftovers.
//
// Deleted (each notification is counted in the first category it fits):
//   1. self             sender = recipient
//   2. missing user     sender or recipient does not exist
//   3. missing post     like / comment whose post does not exist (or none)
//   4. missing comment  comment notification whose comment was deleted
//                       (only newer ones have a comment id)
//   5. stale like       the like was taken back (sender not in post.likes)
//   6. stale follow     the follow was taken back (no Follow document)
//   7. duplicate        more than one like (same sender + post) or follow
//                       (same sender) for a recipient; the newest is kept
// Updated:
//   8. groupKey         remaining like / follow notifications without
//                       groupKey get it, so the unique index and the
//                       API's upsert cover them too
// Only reported:
//   - comment notifications without a comment id (from before M-4): they
//     cannot be linked to a comment and are kept
//
// Usage (from the repo root, uses MONGO_URI from .env):
//   npm run cleanup:notifications              dry run: only reports
//   npm run cleanup:notifications -- --apply   delete / update
//
// Safety:
//   - Dry run by default; nothing is written without --apply.
//   - Deletes only by the _ids found in this run, so notifications created
//     while it runs are not touched. Running it again is safe.
//   - Best run after the M-4 deploy, so no new duplicates appear.
//   - Does not import the Mongoose models (no index builds) and connects
//     with autoIndex / autoCreate disabled.
// PRIVACY: prints only ids and counts.
//
// Exit code: 0 = done (or nothing to do), 1 = error.
import "dotenv/config";
import mongoose from "mongoose";

const EXAMPLES = 5;
const DUPLICATE_KEY = 11000;

const CATEGORIES = [
  ["self", "sender = recipient"],
  ["missingUser", "sender or recipient does not exist"],
  ["missingPost", "like / comment: post does not exist"],
  ["missingComment", "comment notification: comment was deleted"],
  ["staleLike", "like was taken back"],
  ["staleFollow", "follow was taken back"],
  ["duplicate", "duplicate like / follow (newest kept)"],
];

const parseArgs = (argv) => {
  const args = { apply: false };

  argv.forEach((arg) => {
    if (arg === "--apply") {
      args.apply = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  });

  return args;
};

const str = (id) => (id ? id.toString() : "");

const getGroupKey = (notification) =>
  notification.type === "like"
    ? `like:${str(notification.post)}`
    : "follow";

// Newest first: createdAt, then _id (which also grows with time).
const newestFirst = (a, b) =>
  (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0) ||
  str(b._id).localeCompare(str(a._id));

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false,
    autoCreate: false,
  });

  const db = mongoose.connection.db;
  const notificationsCollection = db.collection("notifications");

  console.log(
    `Database: ${db.databaseName} (${args.apply ? "APPLY" : "dry run"})\n`,
  );

  const notifications = await notificationsCollection
    .find(
      {},
      {
        projection: {
          _id: 1,
          recipient: 1,
          sender: 1,
          type: 1,
          post: 1,
          comment: 1,
          groupKey: 1,
          isRead: 1,
          createdAt: 1,
        },
      },
    )
    .toArray();

  // The stored values themselves (deduplicated), whatever their type.
  const distinctValues = (field) => [
    ...new Map(
      notifications
        .filter((n) => n[field])
        .map((n) => [str(n[field]), n[field]]),
    ).values(),
  ];

  const postIdsInUse = distinctValues("post");
  const commentIdsInUse = distinctValues("comment");

  // Only ids and likes - no captions, no images.
  const [users, posts, comments, follows] = await Promise.all([
    db.collection("users").find({}, { projection: { _id: 1 } }).toArray(),
    db
      .collection("posts")
      .find({ _id: { $in: postIdsInUse } }, { projection: { _id: 1, likes: 1 } })
      .toArray(),
    db
      .collection("comments")
      .find({ _id: { $in: commentIdsInUse } }, { projection: { _id: 1 } })
      .toArray(),
    db
      .collection("follows")
      .find({}, { projection: { _id: 0, follower: 1, following: 1 } })
      .toArray(),
  ]);

  const userIds = new Set(users.map((u) => str(u._id)));
  const likesByPost = new Map(
    posts.map((p) => [
      str(p._id),
      new Set((Array.isArray(p.likes) ? p.likes : []).map(str)),
    ]),
  );
  const commentIds = new Set(comments.map((c) => str(c._id)));
  const followPairs = new Set(
    follows.map((f) => `${str(f.follower)}>${str(f.following)}`),
  );

  const found = Object.fromEntries(CATEGORIES.map(([key]) => [key, []]));

  const classify = (n) => {
    const sender = str(n.sender);
    const recipient = str(n.recipient);
    const post = str(n.post);

    if (sender && sender === recipient) return "self";

    if (!userIds.has(sender) || !userIds.has(recipient)) {
      return "missingUser";
    }

    if (
      (n.type === "like" || n.type === "comment") &&
      (!post || !likesByPost.has(post))
    ) {
      return "missingPost";
    }

    if (
      n.type === "comment" &&
      n.comment &&
      !commentIds.has(str(n.comment))
    ) {
      return "missingComment";
    }

    if (n.type === "like" && !likesByPost.get(post).has(sender)) {
      return "staleLike";
    }

    if (n.type === "follow" && !followPairs.has(`${sender}>${recipient}`)) {
      return "staleFollow";
    }

    return null;
  };

  const survivors = [];

  notifications.forEach((n) => {
    const category = classify(n);

    if (category) {
      found[category].push(n);
    } else {
      survivors.push(n);
    }
  });

  // Duplicates among what is left: group like / follow by their key.
  const groups = new Map();
  const commentsWithoutId = [];

  survivors.forEach((n) => {
    if (n.type === "comment") {
      if (!n.comment) commentsWithoutId.push(n);
      return;
    }

    if (n.type !== "like" && n.type !== "follow") return;

    const key = `${str(n.recipient)}|${str(n.sender)}|${getGroupKey(n)}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(n);
  });

  const kept = [];
  let keptReadWithUnreadDuplicates = 0;

  groups.forEach((group) => {
    group.sort(newestFirst);

    const [newest, ...older] = group;

    kept.push(newest);
    found.duplicate.push(...older);

    if (newest.isRead && older.some((n) => !n.isRead)) {
      keptReadWithUnreadDuplicates += 1;
    }
  });

  const needGroupKey = kept.filter(
    (n) => n.groupKey !== getGroupKey(n),
  );

  // ---- report ----
  console.log(`Notifications: ${notifications.length}\n`);

  let toDelete = 0;

  CATEGORIES.forEach(([key, title]) => {
    const items = found[key];
    toDelete += items.length;

    const unread = items.filter((n) => !n.isRead).length;
    const examples = items
      .slice(0, EXAMPLES)
      .map((n) => str(n._id))
      .join(", ");

    console.log(
      `${title}: ${items.length}` +
        (items.length ? ` (unread ${unread}) e.g. ${examples}` : ""),
    );
  });

  if (keptReadWithUnreadDuplicates) {
    console.log(
      `  (in ${keptReadWithUnreadDuplicates} group(s) the kept newest one is read, older unread ones go)`,
    );
  }

  console.log(`\nTo delete: ${toDelete}`);
  console.log(`groupKey to set: ${needGroupKey.length}`);
  console.log(
    `Comment notifications without comment id (kept, cannot be linked): ${commentsWithoutId.length}`,
  );

  if (!args.apply) {
    console.log("\nDry run: nothing changed. Run with --apply to clean up.");
    return 0;
  }

  // ---- apply ----
  console.log("");

  for (const [key, title] of CATEGORIES) {
    const ids = found[key].map((n) => n._id);

    if (ids.length === 0) continue;

    const { deletedCount } = await notificationsCollection.deleteMany({
      _id: { $in: ids },
    });

    console.log(`deleted (${title}): ${deletedCount} of ${ids.length}`);
  }

  let groupKeySet = 0;
  let groupKeyConflicts = 0;

  for (const n of needGroupKey) {
    try {
      const { modifiedCount } = await notificationsCollection.updateOne(
        { _id: n._id },
        { $set: { groupKey: getGroupKey(n) } },
      );

      groupKeySet += modifiedCount;
    } catch (error) {
      if (error.code !== DUPLICATE_KEY) throw error;

      // The API created the same notification (with groupKey) while this
      // ran: this older copy is a duplicate.
      await notificationsCollection.deleteOne({ _id: n._id });
      groupKeyConflicts += 1;
    }
  }

  console.log(`groupKey set: ${groupKeySet} of ${needGroupKey.length}`);

  if (groupKeyConflicts) {
    console.log(
      `deleted (newer copy appeared meanwhile): ${groupKeyConflicts}`,
    );
  }

  console.log("\nDone.");
  return 0;
};

main()
  .then(async (code) => {
    await mongoose.disconnect();
    process.exit(code);
  })
  .catch(async (error) => {
    console.error("Error:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
