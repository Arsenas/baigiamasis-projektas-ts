const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Conversation = require("../schemas/conversationSchema"); // Needed for conversations
const Message = require("../schemas/messageSchema");

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
    })
      .populate("participants", "username image") // ✅ get usernames & images
      .populate("messages"); // optional, only if you want to preview messages

    res.json({ error: false, data: conversations });
  } catch (err) {
    console.error("❌ Error fetching conversations:", err);
    res.status(500).json({ error: true, message: "Failed to fetch conversations" });
  }
};

const changeImage = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user?.id;

    if (!userId || typeof image !== "string" || !image.trim()) {
      return res.status(400).json({ error: true, message: "Missing or invalid image data" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { image }, { new: true, select: "-password" });

    if (!updatedUser) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    res.json({
      error: false,
      message: "Image updated",
      updatedUser, // ✅ key name matters here for your frontend
    });
  } catch (err) {
    console.error("❌ Failed to update image:", err);
    res.status(500).json({ error: true, message: "Server error" });
  }
};
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
const getUserByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username }, { password: 0 }); // pašalina slaptažodį

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    return res.json({ error: false, data: user });
  } catch (err) {
    console.error("❌ Failed to get user by username:", err);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

const sendMessage = async (req, res) => {
  console.log("✅ sendMessage called");
  console.log("BODY:", req.body);
  console.log("USER:", req.user); // requires authMiddle

  const { sender, recipient, message, timestamp } = req.body;

  if (!sender || !recipient || !message) {
    return res.status(400).json({ error: true, message: "Missing required fields" });
  }

  try {
    // ✅ Use nested sender.username since sender is now an object
    const senderUser = await User.findOne({ username: sender.username });
    const recipientUser = await User.findOne({ username: recipient });

    if (!senderUser || !recipientUser) {
      return res.status(404).json({ error: true, message: "User(s) not found" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderUser._id, recipientUser._id] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderUser._id, recipientUser._id],
        messages: [],
      });
      await conversation.save();
    }

    const newMessage = new Message({
      sender: senderUser._id,
      recipient: recipientUser._id,
      message,
      timestamp,
      conversation: conversation._id,
    });

    await newMessage.save();
    await newMessage.populate("sender", "username image");

    conversation.messages.push(newMessage._id);
    await conversation.save();

    const io = req.app.get("io");
    io.emit("chatMessage", newMessage);
    console.log("📨 Emitted message:", newMessage);

    return res.json({ error: false, message: "Message sent", data: newMessage });
  } catch (err) {
    console.error("❌ Failed to send message:", err);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};
const getMessages = async (req, res) => {
  const { sender, recipient } = req.params;

  try {
    const senderUser = await User.findOne({ username: sender });
    const recipientUser = await User.findOne({ username: recipient });

    if (!senderUser || !recipientUser) {
      return res.status(404).json({ error: true, message: "User(s) not found" });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [senderUser._id, recipientUser._id] },
    }).populate({
      path: "messages",
      populate: { path: "sender", select: "username image" }, // <— THIS LINE FIXES IT
      options: { sort: { timestamp: 1 } },
    });

    if (!conversation) {
      return res.json({ error: false, data: [] }); // no messages yet
    }

    res.json({ error: false, data: conversation.messages });
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: true, message: "Failed to fetch messages" });
  }
};
const likeMessage = (req, res) => res.json({ message: "likeMessage not implemented" });
const deleteAcc = (req, res) => res.json({ message: "deleteAcc not implemented" });
const getConversationDetails = (req, res) => res.json({ message: "getConversationDetails not implemented" });
const deleteConversation = (req, res) => res.json({ message: "deleteConversation not implemented" });
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate("participants", "username image")
      .populate({
        path: "messages",
        options: { sort: { timestamp: 1 } },
        populate: {
          path: "sender",
          select: "username image",
        },
      });

    if (!conversation) {
      return res.status(404).json({ error: true, message: "Conversation not found" });
    }

    res.json({
      error: false,
      data: {
        participants: conversation.participants,
        messages: conversation.messages,
      },
    });
  } catch (err) {
    console.error("❌ Failed to fetch conversation by ID:", err);
    res.status(500).json({ error: true, message: "Failed to fetch conversation" });
  }
};
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
