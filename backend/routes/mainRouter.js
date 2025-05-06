const express = require("express");
const mongoose = require("mongoose");
const Router = express.Router();

const checkOwnershipOrAdmin = require("../middleware/checkOwnershipOrAdmin");
const checkRole = require("../middleware/checkRole");
const authMiddle = require("../middleware/auth");

const Conversation = require("../schemas/conversationSchema");
const User = require("../schemas/userSchema");

const {
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
} = require("../controllers/mainController");

const {
  registerUserValidate,
  loginUserValidate,
  validateUser,
  imageValidate,
  usernameValidate,
  messageValidate,
} = require("../middleware/validators");

// Public & Auth routes
Router.post("/register", registerUserValidate, register);
Router.post("/login", loginUserValidate, login);
Router.post("/change-image", authMiddle, imageValidate, changeImage);
Router.post("/change-username", authMiddle, usernameValidate, changeUsername);
Router.post("/change-password", authMiddle, registerUserValidate, changePassword);
Router.post("/send-message", authMiddle, messageValidate, sendMessage);
Router.get("/get-all-users", getAllUsers);
Router.get("/get-user/:username", getUserByUsername);
Router.get("/get-messages/:sender/:recipient", getMessages);
Router.post("/like-message", authMiddle, likeMessage);
Router.post("/like-message-private", authMiddle, likeMessagePrivate);
Router.post("/delete-account", authMiddle, deleteAcc);

// Conversations
Router.get("/conversations/:userID", getUserConversations);
Router.get("/conversation/:conversationId", getConversationById);
Router.get("/get-public-room-messages", getPublicRoomMessages);
Router.get("/conversation/:conversationId/non-participants", getNonParticipants);

Router.post(
  "/deleteConversation/:conversationId",
  authMiddle,
  checkOwnershipOrAdmin({
    model: Conversation,
    idParam: "conversationId",
    authorField: "participants",
  }),
  deleteConversation
);

Router.post("/conversation/:conversationId/:username", authMiddle, addUser);

const { Types } = require("mongoose");

Router.post("/admin/delete-user/:userId", authMiddle, checkRole("admin"), async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("🧪 Deleting user ID:", userId);

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const deleted = await User.findByIdAndDelete(userId); // NEBEREIKIA jokių ObjectId ranka

    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

Router.patch("/admin/change-role/:userId", authMiddle, checkRole("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const updated = await User.findByIdAndUpdate(userId, { role });

    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Role updated" });
  } catch (err) {
    console.error("❌ Error updating role:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = Router;
