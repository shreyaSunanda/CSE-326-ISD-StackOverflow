// backend/routes/questionRoutes.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Reply = require("../models/Reply");

// Get all questions
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Post a new question
router.post("/", async (req, res) => {
  try {
    const { title, description } = req.body;
    const q = new Question({ title, description });
    await q.save();
    res.json(q);
  } catch (err) {
    res.status(500).json({ error: "Failed to post question" });
  }
});

// Post an answer to a question
router.post("/:questionId/answer", async (req, res) => {
  try {
    const { text } = req.body;
    const answer = new Answer({ questionId: req.params.questionId, text });
    await answer.save();
    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: "Failed to post answer" });
  }
});

// Post a reply to an answer
router.post("/answer/:answerId/reply", async (req, res) => {
  try {
    const { text } = req.body;
    const reply = new Reply({ answerId: req.params.answerId, text });
    await reply.save();
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: "Failed to post reply" });
  }
});

// Get all answers for a question
router.get("/:questionId/answers", async (req, res) => {
  try {
    const answers = await Answer.find({ questionId: req.params.questionId });
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch answers" });
  }
});

// Get all replies for an answer
router.get("/answer/:answerId/replies", async (req, res) => {
  try {
    const replies = await Reply.find({ answerId: req.params.answerId });
    res.json(replies);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch replies" });
  }
});

// POST /questions/polish - AI polish using Groq
// AI polish route (3 variations)
router.post("/polish", async (req, res) => {
  try {
    const { text } = req.body;

    // Make 3 API calls in parallel
    const calls = [1, 2, 3].map(() =>
      axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "groq/compound",
          messages: [
            { role: "system", content: "Polish the following question for grammar, clarity, and conciseness:" },
            { role: "user", content: text }
          ],
          max_tokens: 300
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
      )
    );

    const responses = await Promise.all(calls);

    // Map responses to choices
    const choices = responses.map(r => ({
      title: r.data.choices[0].message.content.split("\n")[0].slice(0, 50),
      description: r.data.choices[0].message.content
    }));

    res.json({ choices });

  } catch (err) {
    console.error("Groq polish error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI polishing failed" });
  }
});

module.exports = router;