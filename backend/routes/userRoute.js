const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/userModel");

// ✅ Gauti visus vartotojus (GET /api/users/get-all-users)
router.get("/get-all-users", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // be slaptažodžio
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: true, message: "Failed to fetch users" });
  }
});

// 🔄 Pakeisti profilio paveikslėlį
router.post("/change-image", async (req, res) => {
  const { imageUrl, userID } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userID, { image: imageUrl }, { new: true });

    if (!user) return res.status(404).json({ error: true, message: "User not found" });

    res.json({ error: false, message: "Image updated", user });
  } catch (err) {
    res.status(500).json({ error: true, message: "Server error" });
  }
});

// 🔄 Pakeisti vartotojo vardą
router.post("/change-username", async (req, res) => {
  const { username, userID } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing && existing._id.toString() !== userID) {
      return res.status(409).json({ error: true, message: "Username already taken" });
    }

    const user = await User.findByIdAndUpdate(userID, { username }, { new: true });

    if (!user) return res.status(404).json({ error: true, message: "User not found" });

    res.json({ error: false, message: "Username updated", user });
  } catch (err) {
    res.status(500).json({ error: true, message: "Server error" });
  }
});

// 🔄 Pakeisti slaptažodį
router.post("/change-password", async (req, res) => {
  const { password, passwordTwo, userID } = req.body;

  if (password !== passwordTwo) {
    return res.status(400).json({ error: true, message: "Passwords do not match" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await User.findByIdAndUpdate(userID, { password: hashedPassword }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    res.json({ error: false, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: true, message: "Server error" });
  }
});

// 🗑️ Ištrinti vartotoją
router.post("/delete-account", async (req, res) => {
  const { userID } = req.body;

  try {
    const deletedUser = await User.findByIdAndDelete(userID);

    if (!deletedUser) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    res.json({ error: false, message: "Account deleted", data: deletedUser._id });
  } catch (err) {
    res.status(500).json({ error: true, message: "Server error" });
  }
});

module.exports = router;
