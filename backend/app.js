require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const postRoute = require("./routes/postRoute");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);

// MongoDB Atlas Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Socket.io events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("profileUpdated", (data) => {
    socket.broadcast.emit("profileUpdated", data);
  });

  socket.on("deletedAcc", (userId) => {
    socket.broadcast.emit("deletedAcc", userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
