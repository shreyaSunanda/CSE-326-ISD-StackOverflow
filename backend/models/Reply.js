// models/Reply.js
const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
  answerId: { type: mongoose.Schema.Types.ObjectId, ref: "Answer", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Reply", ReplySchema);