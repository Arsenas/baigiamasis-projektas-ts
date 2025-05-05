const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, default: "https://i.imgur.com/BoN9kdC.png" },
});

module.exports = mongoose.model("User", userSchema);
