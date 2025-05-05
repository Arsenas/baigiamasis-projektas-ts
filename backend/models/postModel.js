const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  text: String,
  username: String,
  userImage: String,
  likes: [String],
  createdAt: Date,
});

module.exports = mongoose.model("Post", postSchema);
