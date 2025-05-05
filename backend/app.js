const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});
const mongoose = require("mongoose");
const cors = require("cors");
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const postRoute = require("./routes/postRoute");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);

// MongoDB
mongoose.connect("mongodb://localhost:27017/baigiamasis");

// Socket.io
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

// Server start
const PORT = 2000;
http.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
