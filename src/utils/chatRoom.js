// A chat between two users is identified by "<userIdA>_<userIdB>"
// with the ids sorted, so both sides compute the same name.
const getChatRoom = (userIdA, userIdB) =>
  [userIdA.toString(), userIdB.toString()].sort().join("_");

// Chat events go to the personal rooms of both participants (REVIEW H-9,
// H-10). The server joins every socket to its user's personal room on
// connect, so this keeps working after a reconnect, reaches every open tab,
// and updates the chat list even when that chat is not open. Socket.io sends
// an event only once per socket, even if it is in both rooms.
const emitToParticipants = (io, userIds, event, payload) => {
  if (!io) {
    return;
  }

  io.to(userIds.map((id) => id.toString())).emit(event, payload);
};

export { getChatRoom, emitToParticipants };
