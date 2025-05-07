const express = require("express");
const Router = express.Router();
const { Types } = require("mongoose");
const { addUserToConversation } = require("../controllers/mainController");

// ⛑️ Middleware
const checkOwnershipOrAdmin = require("../middleware/checkOwnershipOrAdmin");
const checkRole = require("../middleware/checkRole");
const auth = require("../middleware/auth");

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
const Message = require("../schemas/messageSchema"); // būtina dėl delete-message-for-me

// 🧠 Controllers
const {
  register,
  login,
  changeImage,
  changeUsername,
  changePassword,
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

const { getAllUsers, deleteUser, changeUserRole } = require("../controllers/adminController");

// 🔐 Auth Routes
Router.post("/register", registerUserValidate, register);
Router.post("/login", loginUserValidate, login);
Router.post("/change-image", auth, imageValidate, changeImage);
Router.post("/change-username", auth, usernameValidate, changeUsername);
Router.post("/change-password", auth, registerUserValidate, changePassword);
Router.post("/delete-account", auth, deleteAcc);

// 📨 Messages
Router.post("/send-message", auth, messageValidate, sendMessage);
Router.get("/get-messages/:sender/:recipient", getMessages);
Router.post("/like-message", auth, likeMessage);
Router.post("/like-message-private", auth, likeMessagePrivate);
Router.post("/delete-message/:messageId", auth, deleteMessage);
Router.delete("/permanent-delete-message/:messageId", auth, deleteMessagePermanent);

// 📨 DELETE Message for current user (Unsend for me)
Router.post("/delete-message-for-me/:messageId", auth, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.status === "deleted") {
      return res.status(400).json({ error: "Message is already deleted" });
    }

    if (!message.seenBy) {
      message.seenBy = [];
    }

    message.seenBy = message.seenBy.filter((user) => user !== userId);
    message.status = "deleted";

    await message.save();
    req.io.emit("messagePermanentlyDeleted", { messageId });

    res.status(200).json({ message: "Message unsent for you" });
  } catch (err) {
    console.error("❌ Error unsending message:", err);
    res.status(500).json({ error: "Failed to unsend message" });
  }
});

// 👤 Users
Router.get("/get-user/:username", getUserByUsername);

// 💬 Conversations
Router.get("/conversations/:userID", getUserConversations);
Router.get("/conversation/:conversationId", getConversationById);
Router.get("/conversation/:conversationId/non-participants", getNonParticipants);
Router.post("/add-user-to-conversation", auth, addUserToConversation);
Router.get("/get-public-room-messages", getPublicRoomMessages);
Router.post("/send-public-message", auth, sendPublicMessage);
Router.post("/deleteConversation/:conversationId", auth, deleteConversation);

// 🛠️ Admin (tik su auth)
Router.get("/get-all-users", getAllUsers);
Router.post("/admin/delete-user/:id", auth, deleteUser);
Router.patch("/admin/change-role/:id", auth, changeUserRole);

// 📝 Profile update
Router.post("/update-profile", auth, async (req, res) => {
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
