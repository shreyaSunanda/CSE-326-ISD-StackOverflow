// models/Answer.js
const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  authorName: { type: String, default: "Anonymous" },
  text: { type: String, required: true },
  aiGenerated: { type: Boolean, default: false },
  visibleOnlyToAuthor: { type: Boolean, default: false },
  aiAnswerKept: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Answer", AnswerSchema);
