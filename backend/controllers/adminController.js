const User = require("../models/userModel"); // User modelis

// Gauti visus vartotojus (adminui)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id username image"); // Tik svarbiausi laukai
    res.status(200).json({ data: users });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Pašalinti vartotoją (adminui)
const deleteUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

// Pakeisti vartotojo rolę (adminui)
const changeUserRole = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { role } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role; // Keičiamas rolės laukas
    await user.save(); // Išsaugome vartotoją
    res.status(200).json({ success: true, message: "User role updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to change user role", error: error.message });
  }
};

const Message = require("../schemas/messageSchema");

const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("sender", "username")
      .populate("conversation", "_id")
      .sort({ createdAt: -1 });

    res.json({ error: false, data: messages });
  } catch (err) {
    console.error("❌ Failed to fetch messages:", err);
    res.status(500).json({ error: true, message: "Failed to fetch messages" });
  }
};

module.exports = { getAllUsers, deleteUser, changeUserRole, getAllMessages };
