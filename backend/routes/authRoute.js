const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  const { username, password, image } = req.body;

  const existing = await User.findOne({ username });
  if (existing) return res.json({ error: true, message: "Username taken" });

  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash, image });

  await user.save();

  res.json({ error: false, message: "Registration successful", user });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ error: true, message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ error: true, message: "Incorrect password" });

  const token = jwt.sign({ id: user._id }, "secret");

  res.json({
    success: true,
    message: "Login successful",
    user,
    token,
  });
});

module.exports = router;
