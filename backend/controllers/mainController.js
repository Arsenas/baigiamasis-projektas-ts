const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Conversation = require("../schemas/conversationSchema"); // Needed for conversations

// ✅ Auth
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

    const userSafe = newUser.toObject();
    delete userSafe.password;

    res.json({ error: false, message: "Registration successful", user: userSafe });
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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const userSafe = user.toObject();
    delete userSafe.password;

    res.json({ success: true, message: "Login successful", updatedUser: userSafe, token });
  } catch (err) {
    res.json({ error: true, message: "Server error" });
  }
};

// ✅ Implemented
const getUserConversations = async (req, res) => {
  const userId = req.params.userID;

  try {
    const conversations = await Conversation.find({
      participants: userId,
    });

    res.json({ error: false, data: conversations });
  } catch (err) {
    console.error("❌ Error fetching conversations:", err);
    res.status(500).json({ error: true, message: "Failed to fetch conversations" });
  }
};

// ❌ Not implemented yet (placeholders)
const changeImage = (req, res) => res.json({ message: "changeImage not implemented" });
const changeUsername = (req, res) => res.json({ message: "changeUsername not implemented" });
const changePassword = (req, res) => res.json({ message: "changePassword not implemented" });
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // exclude passwords
    res.json({ error: false, data: users });
  } catch (err) {
    console.error("❌ Failed to get users:", err);
    res.status(500).json({ error: true, message: "Failed to fetch users" });
  }
};
const getUserByUsername = (req, res) => res.json({ message: "getUserByUsername not implemented" });
const sendMessage = (req, res) => res.json({ message: "sendMessage not implemented" });
const getMessages = (req, res) => res.json({ message: "getMessages not implemented" });
const likeMessage = (req, res) => res.json({ message: "likeMessage not implemented" });
const deleteAcc = (req, res) => res.json({ message: "deleteAcc not implemented" });
const getConversationDetails = (req, res) => res.json({ message: "getConversationDetails not implemented" });
const deleteConversation = (req, res) => res.json({ message: "deleteConversation not implemented" });
const getConversationById = (req, res) => res.json({ message: "getConversationById not implemented" });
const getPublicRoomMessages = (req, res) => res.json({ message: "getPublicRoomMessages not implemented" });
const addUser = (req, res) => res.json({ message: "addUser not implemented" });
const likeMessagePrivate = (req, res) => res.json({ message: "likeMessagePrivate not implemented" });
const getNonParticipants = (req, res) => res.json({ message: "getNonParticipants not implemented" });

module.exports = {
  register,
  login,
  changeImage,
  changeUsername,
  changePassword,
  getAllUsers,
  getUserByUsername,
  sendMessage,
  getMessages,
  likeMessage,
  deleteAcc,
  getUserConversations,
  getConversationDetails,
  deleteConversation,
  getConversationById,
  getPublicRoomMessages,
  addUser,
  likeMessagePrivate,
  getNonParticipants,
};
