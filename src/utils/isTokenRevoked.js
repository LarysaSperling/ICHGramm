// True when the JWT was issued before the user's last password change
// (REVIEW H-13). Needs the user loaded with "+passwordChangedAt".
//
// `iat` is in seconds, passwordChangedAt in milliseconds. Comparing
// whole seconds keeps a token issued in the same second as the change
// valid (a new token signed right after the change must not be
// rejected).
const isTokenRevoked = (decoded, user) => {
  if (!user?.passwordChangedAt) {
    return false;
  }

  const changedAtSeconds = Math.floor(
    new Date(user.passwordChangedAt).getTime() / 1000,
  );

  return decoded.iat < changedAtSeconds;
};

export default isTokenRevoked;
