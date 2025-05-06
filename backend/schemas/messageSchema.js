const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
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
});

const message = mongoose.model("Messages", messageSchema);

module.exports = message;
