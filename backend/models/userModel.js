const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: {
    type: String,
    default:
      "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
  },
  wallpaperUrl: { type: String, default: "" },
  description: { type: String, default: "" },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});

module.exports = mongoose.model("User", userSchema);
