let onlineUsers = [];

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    // User joins
    socket.on("userConnected", (user) => {
      if (!onlineUsers.some((u) => u._id === user._id)) {
        onlineUsers.push(user);
      }
      io.emit("updateOnline", onlineUsers);
    });

    // Profile updated (image, username, etc)
    socket.on("profileUpdated", (updatedUser) => {
      onlineUsers = onlineUsers.map((u) => (u._id === updatedUser.userId ? { ...u, image: updatedUser.image } : u));
      io.emit("updateOnline", onlineUsers);
    });

    // Account deleted
    socket.on("deletedAcc", (id) => {
      onlineUsers = onlineUsers.filter((u) => u._id !== id);
      io.emit("updateOnline", onlineUsers);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
      onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
      io.emit("updateOnline", onlineUsers);
    });
  });
};
