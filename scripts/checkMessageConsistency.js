// Read-only check of the messages collection for broken records that the
// API no longer allows (REVIEW H-12):
//   - sender / receiver that does not exist (broke GET /messages with 500)
//   - messages to oneself
//   - sharedPost pointing to a post that does not exist
//
// Usage (from the repo root, uses MONGO_URI from .env):
//   npm run check:messages
//
// READ-ONLY: it only runs find. It does not import the Mongoose models on
// purpose (that could trigger index builds) and connects with autoIndex /
// autoCreate disabled. Nothing is written.
// PRIVACY: only ids are loaded and printed - never message texts.
//
// Exit code: 0 = nothing found, 2 = broken messages found, 1 = error.
import "dotenv/config";
import mongoose from "mongoose";

const EXAMPLES = 5;

const report = [];

const section = (title, messages, affectedUsers) => {
  report.push({
    title,
    count: messages.length,
    examples: messages.slice(0, EXAMPLES).map((m) => m._id.toString()),
    affectedUsers,
  });
};

// distinct ids of the users that still exist on the given side
const existingParticipants = (messages, field, userIds) =>
  new Set(
    messages
      .map((m) => m[field]?.toString())
      .filter((id) => id && userIds.has(id)),
  ).size;

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false,
    autoCreate: false,
  });

  const db = mongoose.connection.db;
  console.log(`Database: ${db.databaseName} (read-only check)\n`);

  // Only ids - no texts, no avatars, no post images (base64).
  const [users, posts, messages] = await Promise.all([
    db.collection("users").find({}, { projection: { _id: 1 } }).toArray(),
    db.collection("posts").find({}, { projection: { _id: 1 } }).toArray(),
    db
      .collection("messages")
      .find(
        {},
        { projection: { _id: 1, sender: 1, receiver: 1, sharedPost: 1 } },
      )
      .toArray(),
  ]);

  const userIds = new Set(users.map((u) => u._id.toString()));
  const postIds = new Set(posts.map((p) => p._id.toString()));

  const senderMissing = messages.filter(
    (m) => !userIds.has(m.sender?.toString()),
  );
  const receiverMissing = messages.filter(
    (m) => !userIds.has(m.receiver?.toString()),
  );
  const toSelf = messages.filter(
    (m) => m.sender && m.sender.toString() === m.receiver?.toString(),
  );
  const postMissing = messages.filter(
    (m) => m.sharedPost && !postIds.has(m.sharedPost.toString()),
  );

  // Before H-12 a message whose other side does not exist made
  // GET /messages fail for the user who still exists.
  section(
    "Messages TO a user that does not exist",
    receiverMissing,
    `senders affected: ${existingParticipants(receiverMissing, "sender", userIds)}`,
  );
  section(
    "Messages FROM a user that does not exist",
    senderMissing,
    `receivers affected: ${existingParticipants(senderMissing, "receiver", userIds)}`,
  );
  section(
    "Messages to oneself",
    toSelf,
    `users: ${existingParticipants(toSelf, "sender", userIds)}`,
  );
  section(
    "sharedPost points to a post that does not exist",
    postMissing,
    `senders: ${existingParticipants(postMissing, "sender", userIds)}`,
  );

  console.log(`Users: ${users.length}`);
  console.log(`Posts: ${posts.length}`);
  console.log(`Messages: ${messages.length}\n`);

  let problems = 0;

  for (const { title, count, examples, affectedUsers } of report) {
    problems += count;
    console.log(
      `${count === 0 ? "OK  " : "!!  "}${title}: ${count}` +
        (count ? `  (${affectedUsers})` : ""),
    );
    for (const id of examples) console.log(`       message ${id}`);
    if (count > examples.length) {
      console.log(`       ... and ${count - examples.length} more`);
    }
  }

  // A message can be in several groups (e.g. to oneself AND the user is
  // gone), so the total is not the number of distinct messages.
  const distinct = new Set(
    [senderMissing, receiverMissing, toSelf, postMissing]
      .flat()
      .map((m) => m._id.toString()),
  ).size;

  console.log(
    problems === 0
      ? "\nRESULT: no broken messages."
      : `\nRESULT: ${distinct} broken message(s) - see '!!' lines above.`,
  );

  return problems === 0 ? 0 : 2;
};

main()
  .then(async (code) => {
    await mongoose.disconnect();
    process.exit(code);
  })
  .catch(async (error) => {
    console.error("Check failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
