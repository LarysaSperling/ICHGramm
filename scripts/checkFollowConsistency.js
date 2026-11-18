// Read-only consistency check between the Follow collection (the source of
// truth since REVIEW H-7) and the legacy User.followers / User.following
// arrays that may still be stored in old user documents.
//
// Usage (from the repo root, uses MONGO_URI from .env):
//   npm run check:follows
//
// READ-ONLY: it only runs find / aggregate / listIndexes. It does not import
// the Mongoose models on purpose (that could trigger index builds) and
// connects with autoIndex / autoCreate disabled. Nothing is written.
//
// Exit code: 0 = no problems in Follow, 2 = problems found, 1 = error.
import "dotenv/config";
import mongoose from "mongoose";

const EXAMPLES = 5;

const key = (a, b) => `${a}->${b}`;

const report = [];
let followProblems = 0;

const section = (title, items, { problem = false } = {}) => {
  report.push({ title, count: items.length, examples: items.slice(0, EXAMPLES), problem });
  if (problem) {
    followProblems += items.length;
  }
};

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

  // Only ids and the legacy arrays - never load avatars (base64).
  const users = await db
    .collection("users")
    .find({}, { projection: { _id: 1, followers: 1, following: 1 } })
    .toArray();

  const follows = await db
    .collection("follows")
    .find({}, { projection: { _id: 1, follower: 1, following: 1 } })
    .toArray();

  const userIds = new Set(users.map((u) => u._id.toString()));

  // ---------- 1. Follow collection itself (what users see) ----------
  const pairCount = new Map();
  for (const f of follows) {
    const k = key(f.follower, f.following);
    pairCount.set(k, (pairCount.get(k) || 0) + 1);
  }

  section(
    "Follow: duplicate pairs (same follower -> following more than once)",
    [...pairCount].filter(([, n]) => n > 1).map(([k, n]) => `${k} x${n}`),
    { problem: true },
  );

  section(
    "Follow: self-follows",
    follows
      .filter((f) => f.follower?.toString() === f.following?.toString())
      .map((f) => f._id.toString()),
    { problem: true },
  );

  section(
    "Follow: points to a user that does not exist",
    follows
      .filter(
        (f) =>
          !userIds.has(f.follower?.toString()) ||
          !userIds.has(f.following?.toString()),
      )
      .map((f) => `${f._id} (${key(f.follower, f.following)})`),
    { problem: true },
  );

  const indexes = await db.collection("follows").indexes().catch(() => []);
  const hasUniqueIndex = indexes.some(
    (i) =>
      i.unique &&
      Object.keys(i.key).join(",") === "follower,following",
  );

  section(
    "Follow: unique index { follower: 1, following: 1 } is MISSING",
    hasUniqueIndex ? [] : ["no unique index - concurrent follows can create duplicates"],
    { problem: true },
  );

  // ---------- 2. Legacy arrays vs Follow (informational) ----------
  const followSet = new Set(pairCount.keys());
  const followingArr = new Set(); // A.following contains B  -> "A->B"
  const followersArr = new Set(); // B.followers contains A  -> "A->B"
  const arrayDuplicates = [];
  let usersWithArrays = 0;

  for (const u of users) {
    const id = u._id.toString();
    if (u.followers !== undefined || u.following !== undefined) {
      usersWithArrays += 1;
    }

    for (const [field, list] of [
      ["following", u.following || []],
      ["followers", u.followers || []],
    ]) {
      const seen = new Set();
      for (const other of list) {
        const o = other.toString();
        if (seen.has(o)) {
          arrayDuplicates.push(`${id}.${field} has ${o} more than once`);
        }
        seen.add(o);
        if (field === "following") followingArr.add(key(id, o));
        else followersArr.add(key(o, id));
      }
    }
  }

  section(
    "Legacy: Follow exists, but missing in follower's User.following",
    [...followSet].filter((k) => !followingArr.has(k)),
  );
  section(
    "Legacy: Follow exists, but missing in target's User.followers",
    [...followSet].filter((k) => !followersArr.has(k)),
  );
  section(
    "Legacy: in User.following, but NO Follow document (never shown in UI)",
    [...followingArr].filter((k) => !followSet.has(k)),
  );
  section(
    "Legacy: in User.followers, but NO Follow document (never shown in UI)",
    [...followersArr].filter((k) => !followSet.has(k)),
  );
  section("Legacy: duplicate entries inside arrays", arrayDuplicates);

  // ---------- output ----------
  console.log(`Users: ${users.length} (with legacy arrays: ${usersWithArrays})`);
  console.log(`Follow documents: ${follows.length}`);
  console.log(`Unique index on Follow: ${hasUniqueIndex ? "yes" : "NO"}\n`);

  for (const { title, count, examples, problem } of report) {
    const mark = count === 0 ? "OK  " : problem ? "!!  " : "--  ";
    console.log(`${mark}${title}: ${count}`);
    for (const e of examples) console.log(`       ${e}`);
    if (count > examples.length) console.log(`       ... and ${count - examples.length} more`);
  }

  console.log(
    "\n'Legacy' lines are informational: the app uses only the Follow collection,",
  );
  console.log("so mismatches in the old arrays ('--') are not visible to users.");
  console.log(
    followProblems === 0
      ? "\nRESULT: Follow collection is consistent."
      : `\nRESULT: ${followProblems} problem(s) in the Follow collection - see '!!' lines above.`,
  );

  return followProblems === 0 ? 0 : 2;
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
