const express = require("express");
const router = express.Router();
const User = require("../models/userModel"); // jei modelis dar nepadarytas – grįšim

// Pakeisti profilio paveikslėlį
router.post("/change-image", async (req, res) => {
  const { imageUrl, userID } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userID, { image: imageUrl }, { new: true });

    if (!user) return res.json({ error: true, message: "User not found" });

    res.json({ error: false, message: "Image updated", user });
  } catch (err) {
    res.json({ error: true, message: "Server error" });
  }
});

// Pakeisti username
router.post("/change-username", async (req, res) => {
  const { username, userID } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing && existing._id.toString() !== userID) {
      return res.json({ error: true, message: "Username already taken" });
    }

    const user = await User.findByIdAndUpdate(userID, { username }, { new: true });

    if (!user) return res.json({ error: true, message: "User not found" });

    res.json({ error: false, message: "Username updated", user });
  } catch (err) {
    res.json({ error: true, message: "Server error" });
  }
});

// Pakeisti slaptažodį
const bcrypt = require("bcrypt");

router.post("/change-password", async (req, res) => {
  const { password, passwordTwo, username, userID } = req.body;

  if (password !== passwordTwo) {
    return res.json({ error: true, message: "Passwords do not match" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await User.findByIdAndUpdate(userID, { password: hashedPassword }, { new: true });

    if (!updatedUser) {
      return res.json({ error: true, message: "User not found" });
    }

    res.json({ error: false, message: "Password changed successfully" });
  } catch (err) {
    res.json({ error: true, message: "Server error" });
  }
});

// Ištrinti paskyrą
router.post("/delete-account", async (req, res) => {
  const { userID } = req.body;

  try {
    const deletedUser = await User.findByIdAndDelete(userID);

    if (!deletedUser) {
      return res.json({ error: true, message: "User not found" });
    }

    res.json({ error: false, message: "Account deleted", data: deletedUser._id });
  } catch (err) {
    res.json({ error: true, message: "Server error" });
  }
});

module.exports = router;
