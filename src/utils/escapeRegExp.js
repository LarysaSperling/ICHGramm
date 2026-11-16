// Escapes special RegExp characters so user input is matched
// literally (prevents regex injection and ReDoS in $regex queries).
const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default escapeRegExp;
