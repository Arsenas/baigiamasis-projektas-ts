const express = require("express");
const Router = express.Router();
const { Types } = require("mongoose");

// ⛑️ Middleware
const checkOwnershipOrAdmin = require("../middleware/checkOwnershipOrAdmin");
const checkRole = require("../middleware/checkRole");
const authMiddle = require("../middleware/auth");

// 🧠 Validators
const {
  registerUserValidate,
  loginUserValidate,
  imageValidate,
  usernameValidate,
  messageValidate,
} = require("../middleware/validators");

// 🧩 Schemas
const Conversation = require("../schemas/conversationSchema");
const User = require("../schemas/userSchema");

// 🧠 Controllers
const {
  register,
  login,
  changeImage,
  changeUsername,
  changePassword,
  getAllUsers,
  getUserByUsername,
  sendMessage,
  sendPublicMessage,
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

// 🔐 Auth Routes
Router.post("/register", registerUserValidate, register);
Router.post("/login", loginUserValidate, login);
Router.post("/change-image", authMiddle, imageValidate, changeImage);
Router.post("/change-username", authMiddle, usernameValidate, changeUsername);
Router.post("/change-password", authMiddle, registerUserValidate, changePassword);
Router.post("/delete-account", authMiddle, deleteAcc);

// 📨 Messages
Router.post("/send-message", authMiddle, messageValidate, sendMessage);
Router.get("/get-messages/:sender/:recipient", getMessages);
Router.post("/like-message", authMiddle, likeMessage);
Router.post("/like-message-private", authMiddle, likeMessagePrivate);

// 👤 Users
Router.get("/get-all-users", getAllUsers);
Router.get("/get-user/:username", getUserByUsername);

// 💬 Conversations
Router.get("/conversations/:userID", getUserConversations);
Router.get("/conversation/:conversationId", getConversationById);
Router.get("/conversation/:conversationId/non-participants", getNonParticipants);
Router.post("/conversation/:conversationId/:username", authMiddle, addUser);
Router.get("/get-public-room-messages", getPublicRoomMessages);
Router.post("/send-public-message", authMiddle, sendPublicMessage);

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

// 🛠️ Admin
Router.post("/admin/delete-user/:userId", authMiddle, checkRole("admin"), async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("🧪 Deleting user ID:", userId);

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const deleted = await User.findByIdAndDelete(userId);
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
