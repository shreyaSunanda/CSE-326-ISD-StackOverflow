// models/Answer.js
const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  authorName: { type: String, default: "Anonymous" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Answer", AnswerSchema);