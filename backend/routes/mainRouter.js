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
  deleteMessage,
  deleteMessagePermanent,
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
Router.post("/delete-message/:messageId", authMiddle, deleteMessage);
Router.delete("/permanent-delete-message/:messageId", authMiddle, deleteMessagePermanent);
// 📨 DELETE Message for current user (Unsend for me)
Router.post("/delete-message-for-me/:messageId", authMiddle, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id; // Assuming you're using authentication middleware

  try {
    // Find the message by its ID
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // If the message is already deleted, return early
    if (message.status === "deleted") {
      return res.status(400).json({ error: "Message is already deleted" });
    }

    // Remove the user from the 'seenBy' list or mark it as deleted for this user
    if (!message.seenBy) {
      message.seenBy = [];
    }

    // Remove user from the 'seenBy' list (if present)
    message.seenBy = message.seenBy.filter((user) => user !== userId);

    // Mark the message as deleted for the current user
    message.status = "deleted";

    // Save the updated message
    await message.save();

    // Emit the event to notify others (if needed)
    req.io.emit("messagePermanentlyDeleted", { messageId });

    res.status(200).json({ message: "Message unsent for you" });
  } catch (err) {
    console.error("❌ Error unsending message:", err);
    res.status(500).json({ error: "Failed to unsend message" });
  }
});

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

Router.post("/deleteConversation/:conversationId", authMiddle, deleteConversation);

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

Router.post("/update-profile", authMiddle, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          username: req.body.username,
          image: req.body.image,
          wallpaperUrl: req.body.wallpaperUrl,
          description: req.body.description,
        },
      },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Failed to update profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = Router;
