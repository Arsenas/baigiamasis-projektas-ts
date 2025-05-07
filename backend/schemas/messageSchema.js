const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    required: true,
    default: false,
  },
  liked: {
    type: [String],
    default: [],
  },
  senderImage: {
    type: String,
  },
  recipientImage: {
    type: String,
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversations",
    required: true,
  },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
