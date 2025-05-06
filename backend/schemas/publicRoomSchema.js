const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const publicRoomSchema = new Schema(
  {
    participants: [
      {
        type: String,
        required: true,
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message", // 👈 Modelio pavadinimas, ne kolekcijos
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message", // 👈 Taip pat čia
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const PublicRoom = mongoose.model("PublicRoom", publicRoomSchema);

module.exports = PublicRoom;
