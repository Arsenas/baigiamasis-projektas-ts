const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { username, password, image } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.json({ error: true, message: "Username taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, image });
    await newUser.save();

    res.json({ error: false, message: "Registration successful", user: newUser });
  } catch (err) {
    res.json({ error: true, message: "Server error" });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ error: true, message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ error: true, message: "Incorrect password" });
    }

    const token = jwt.sign({ id: user._id }, "secret");

    res.json({ success: true, message: "Login successful", user, token });
  } catch (err) {
    res.json({ error: true, message: "Server error" });
  }
};

module.exports = { register, login };
