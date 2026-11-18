// Atomically adds `value` to the array `field` of document `id`, or removes it
// if it is already there (REVIEW H-6).
//
// The old code did read -> modify in JS -> save. Two concurrent requests
// (double click, two tabs) both read the same state, so a like could be
// duplicated or lost. Here the "is it already in the array?" check and the
// change happen inside ONE update on the MongoDB server (an update pipeline),
// and MongoDB applies updates to a single document one at a time. So every
// request sees the result of the previous one - no retries, no conflicts.
//
// `value` must already be an ObjectId: pipeline updates are not cast by
// Mongoose.
//
// Returns { doc, added } with the updated document, or null if the
// document does not exist.
const atomicToggle = async (Model, id, field, value, options = {}) => {
  const current = { $ifNull: [`$${field}`, []] };

  const doc = await Model.findOneAndUpdate(
    { _id: id },
    [
      {
        $set: {
          [field]: {
            $cond: [
              { $in: [value, current] },
              // remove (keeps the order of the other items)
              {
                $filter: {
                  input: current,
                  cond: { $ne: ["$$this", value] },
                },
              },
              // add
              { $concatArrays: [current, [value]] },
            ],
          },
        },
      },
    ],
    {
      returnDocument: "after",
      updatePipeline: true,
      ...options,
    },
  );

  if (!doc) {
    return null;
  }

  // The returned document is the state right after THIS update,
  // so it tells us whether this request added or removed the value.
  const added = doc[field].some(
    (item) => (item._id ?? item).toString() === value.toString(),
  );

  return { doc, added };
};

export default atomicToggle;
