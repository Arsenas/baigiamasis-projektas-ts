const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const errorSchema = new Schema({
  message: String,
  stack: String,
  code: String,
  time: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Error", errorSchema);
