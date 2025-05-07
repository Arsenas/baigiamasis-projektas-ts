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
      hiddenFor: { $ne: userId }, // ✅ exclude hidden ones
    })
      .populate("participants", "username image")
      .populate("messages");
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

const deleteMessage = async (req, res) => {
  const userId = req.user?.id;
  const { messageId } = req.params;

  if (!userId || !messageId) {
    return res.status(400).json({ error: true, message: "Missing user or message ID" });
  }

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: true, message: "Message not found" });
    }
    // If already marked deleted for this user, do nothing
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    const io = req.app.get("io");
    io.emit("messageDeleted", { messageId, userId }); // frontends should hide the message locally

    return res.json({ error: false, message: "Message deleted for user" });
  } catch (err) {
    console.error("❌ Failed to delete message:", err);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

// Backend - message delete handler
const deleteMessagePermanent = async (req, res) => {
  const userId = req.user?.id;
  const { messageId } = req.params;

  if (!userId || !messageId) {
    return res.status(400).json({ error: true, message: "Missing user or message ID" });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: true, message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: true, message: "Not authorized to delete this message" });
    }

    await message.deleteOne(); // Delete the message

    const io = req.app.get("io");
    io.emit("messagePermanentlyDeleted", { messageId }); // Emit the delete event

    return res.json({ error: false, message: "Message permanently deleted" });
  } catch (err) {
    console.error("❌ Failed to permanently delete message:", err);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

const sendPublicMessage = async (req, res) => {
  const { sender, message, timestamp } = req.body;

  if (!sender || !message || !timestamp) {
    return res.status(400).json({ error: true, message: "Missing required fields" });
  }

  try {
    const senderUser = await User.findOne({ username: sender.username });

    if (!senderUser) {
      return res.status(404).json({ error: true, message: "Sender not found" });
    }

    const newMessage = new Message({
      sender: senderUser._id,
      message,
      timestamp,
      recipient: null, // This marks it as a public message
    });

    await newMessage.save();
    await newMessage.populate("sender", "username image");

    const io = req.app.get("io");
    io.emit("publicMessage", newMessage); // Broadcast to all sockets

    return res.json({ error: false, message: "Public message sent", data: newMessage });
  } catch (err) {
    console.error("❌ Failed to send public message:", err);
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
      populate: { path: "sender", select: "username image" },
      options: { sort: { timestamp: 1 } },
    });

    if (!conversation) {
      return res.json({ error: false, data: [] });
    }

    // ✅ Filter out messages deleted for the sender
    const filtered = conversation.messages.filter(
      (msg) => !msg.deletedFor?.some((id) => id.toString() === senderUser._id.toString())
    );

    res.json({ error: false, data: filtered });
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: true, message: "Failed to fetch messages" });
  }
};
const likeMessage = async (req, res) => {
  const { messageId, username } = req.body;

  if (!messageId || !username) {
    return res.status(400).json({ error: true, message: "Missing fields" });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: true, message: "Message not found" });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: true, message: "User not found" });

    const alreadyLiked = message.liked.includes(user._id);
    if (alreadyLiked) {
      message.liked = message.liked.filter((id) => id.toString() !== user._id.toString());
    } else {
      message.liked.push(user._id);
    }

    await message.save();
    await message.populate("sender", "username image");

    const io = req.app.get("io");
    io.emit("likeMessage", message); // broadcast updated message

    return res.json({ error: false, data: message });
  } catch (err) {
    console.error("❌ Failed to like message:", err);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};
const deleteAcc = (req, res) => res.json({ message: "deleteAcc not implemented" });
const getConversationDetails = (req, res) => res.json({ message: "getConversationDetails not implemented" });
const deleteConversation = async (req, res) => {
  const userId = req.user?.id;
  const { conversationId } = req.params;

  if (!userId) return res.status(401).json({ error: true, message: "Unauthorized" });

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: true, message: "Conversation not found" });
    }

    if (!conversation.hiddenFor.includes(userId)) {
      conversation.hiddenFor.push(userId);
      await conversation.save();
    }

    const io = req.app.get("io");
    io.emit("conversationDeleted");

    return res.json({ error: false, message: "Conversation deleted for current user" });
  } catch (err) {
    console.error("❌ Failed to delete conversation:", err);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};
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
const getPublicRoomMessages = async (req, res) => {
  try {
    const userId = req.user?.id;

    const messages = await Message.find({ recipient: null })
      .sort({ timestamp: 1 })
      .populate("sender", "username image");

    // ✅ Exclude deleted-for-user messages
    const filtered = messages.filter((msg) => !msg.deletedFor?.some((id) => id.toString() === userId));

    res.json({ error: false, data: filtered });
  } catch (err) {
    console.error("❌ Failed to fetch public room messages:", err);
    res.status(500).json({ error: true, message: "Failed to fetch public messages" });
  }
};
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
  sendPublicMessage,
  addUser,
  deleteMessage,
  deleteMessagePermanent,
  likeMessagePrivate,
  getNonParticipants,
};
