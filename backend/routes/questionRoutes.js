// backend/routes/questionRoutes.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Reply = require("../models/Reply");

// Get all questions
// router.get("/", async (req, res) => {
//   try {
//     const questions = await Question.find();
//     res.json(questions);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch questions" });
//   }
// });

//change

router.get("/", async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });

    // Fetch answer count for each question
    const questionsWithAnswerCount = await Promise.all(
      questions.map(async (question) => {
        const answerCount = await Answer.countDocuments({
          questionId: question._id,
        });
        return {
          ...question.toObject(),
          answerCount: answerCount,
        };
      }),
    );

    res.json({ success: true, data: { questions: questionsWithAnswerCount } });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch questions" });
  }
});

// Post a new question
// router.post("/", async (req, res) => {
//   try {
//     const { title, description } = req.body;
//     const q = new Question({ title, description });
//     await q.save();
//     res.json(q);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to post question" });
//   }
// });

//change

router.post("/", async (req, res) => {
  try {
    const { title, body, tags, authorId, authorName, source } = req.body;

    if (!authorId || !authorName) {
      return res.status(400).json({
        success: false,
        error: "Author ID and Name are required. Please login again.",
      });
    }

    const q = new Question({
      title,
      body,
      tags: Array.isArray(tags) ? tags : [],
      authorId,
      authorName,
      source: source || "manual",
    });

    await q.save();

    return res.status(201).json({ success: true, data: q });
  } catch (err) {
    console.error("Save Error:", err.message);

    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// POST /api/questions/ai/suggest - AI Question Generation
router.post("/ai/suggest", async (req, res) => {
  try {
    const { rawInput, context } = req.body;

    if (!rawInput || rawInput.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Please provide at least 10 characters for AI to work with",
      });
    }

    // Build the prompt
    const systemPrompt = `You are a Stack Overflow expert. Help users write better questions.

Given a rough question idea and context, generate a well-structured, professional question.

Format the output as a structured question with these sections:
TITLE: [Write a precise, concise, and professional title for the question here]

## Problem Description
[Clear description of the problem]

## Context
[Background information]

## What I've Tried
[What the user has attempted]

## Expected Behavior
[What should happen]

## Code Example
[Code snippet if applicable]

## Environment
[Technical details]

Make it professional, clear, and easy to read.`;

    const userPrompt = `User's rough question: "${rawInput}"
${context ? `\nAdditional context: ${context}` : ""}

Generate ONE well-structured question.`;

    // OpenRouter API Call
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000", // OpenRouter asks for a referer header
          "X-Title": "StackOverflow Clone",
          "Content-Type": "application/json",
        },
      },
    );

    const generatedQuestion = response.data.choices[0].message.content;
    if (!generatedQuestion || generatedQuestion.trim() === "") {
      return res.status(500).json({
        success: false,
        error: "The AI model returned an empty response. Please try again.",
      });
    }
    // res.json({
    //   success: true,
    //   data: {
    //     title: rawInput, // Use raw input as title
    //     body: generatedQuestion
    //   }
    // });
    let generatedTitle = rawInput; // Fallback to rawInput just in case
    let generatedBody = generatedQuestion;

    // Look for the "TITLE: " line at the very beginning of the response
    const titleMatch = generatedQuestion.match(/^TITLE:\s*(.*)/i);

    if (titleMatch) {
      // Extract the title text
      generatedTitle = titleMatch[1].trim();

      // Remove the "TITLE: ..." line from the body so it doesn't show up in the text editor
      generatedBody = generatedQuestion
        .replace(/^TITLE:\s*(.*)\n*/i, "")
        .trim();
    }

    res.json({
      success: true,
      data: {
        title: generatedTitle, // Use the extracted AI title
        body: generatedBody, // Use the rest of the text for the body
      },
    });
  } catch (err) {
    console.error("AI suggestion error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: "AI generation failed. Please try again.",
    });
  }
});

// POST /api/questions/:questionId/ai-answer - Generate AI Answer
router.post("/:questionId/ai-answer", async (req, res) => {
  try {
    const { authorId } = req.body;
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    // Check if user is the question author
    if (question.authorId.toString() !== authorId) {
      return res.status(403).json({
        success: false,
        error: "Only the question author can generate AI answers",
      });
    }

    const systemPrompt = `You are a Stack Overflow expert. Generate a concise, helpful answer to the following question. Keep it professional and informative.`;

    const userPrompt = `Question: ${question.title}\n\n${question.body}`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "StackOverflow Clone",
          "Content-Type": "application/json",
        },
      },
    );

    const aiAnswer = response.data.choices[0].message.content;

    if (!aiAnswer || aiAnswer.trim() === "") {
      return res.status(500).json({
        success: false,
        error: "The AI model returned an empty response. Please try again.",
      });
    }

    // Save the AI-generated answer
    const answer = new Answer({
      questionId: req.params.questionId,
      text: aiAnswer,
      authorId: undefined,
      authorName: "AI Assistant",
      aiGenerated: true,
      visibleOnlyToAuthor: true,
    });

    await answer.save();

    // Update the question to mark AI answer as generated
    await Question.findByIdAndUpdate(
      req.params.questionId,
      { isAiAnswerGenerated: true },
      { new: true },
    );

    res.json({
      success: true,
      data: answer,
    });
  } catch (err) {
    console.error(
      "AI answer generation error:",
      err.response?.data || err.message,
    );
    res.status(500).json({
      success: false,
      error: "AI answer generation failed. Please try again.",
    });
  }
});

// POST /api/questions/:questionId/ai-answer/regenerate - Regenerate AI Answer
router.post("/:questionId/ai-answer/regenerate", async (req, res) => {
  try {
    const { authorId, answerId } = req.body;
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    // Check if user is the question author
    if (question.authorId.toString() !== authorId) {
      return res.status(403).json({
        success: false,
        error: "Only the question author can regenerate AI answers",
      });
    }

    const systemPrompt = `You are a Stack Overflow expert. Generate a concise, helpful answer to the following question. Keep it professional and informative. Generate a DIFFERENT answer than any previous attempts.`;

    const userPrompt = `Question: ${question.title}\n\n${question.body}`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "StackOverflow Clone",
          "Content-Type": "application/json",
        },
      },
    );

    const aiAnswer = response.data.choices[0].message.content;

    if (!aiAnswer || aiAnswer.trim() === "") {
      return res.status(500).json({
        success: false,
        error: "The AI model returned an empty response. Please try again.",
      });
    }

    // Update the existing answer with new text
    const updatedAnswer = await Answer.findByIdAndUpdate(
      answerId,
      { text: aiAnswer },
      { new: true },
    );

    res.json({
      success: true,
      data: updatedAnswer,
    });
  } catch (err) {
    console.error(
      "AI answer regeneration error:",
      err.response?.data || err.message,
    );
    res.status(500).json({
      success: false,
      error: "AI answer regeneration failed. Please try again.",
    });
  }
});

// PUT /api/questions/:questionId/ai-answer/:answerId/keep - Keep AI Answer
router.put("/:questionId/ai-answer/:answerId/keep", async (req, res) => {
  try {
    const { authorId } = req.body;
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    // Check if user is the question author
    if (question.authorId.toString() !== authorId) {
      return res.status(403).json({
        success: false,
        error: "Only the question author can keep AI answers",
      });
    }

    // Update the answer to mark it as kept and make it visible to all
    const updatedAnswer = await Answer.findByIdAndUpdate(
      req.params.answerId,
      { aiAnswerKept: true, visibleOnlyToAuthor: false },
      { new: true },
    );

    res.json({
      success: true,
      data: updatedAnswer,
    });
  } catch (err) {
    console.error("AI answer keep error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: "Failed to keep AI answer. Please try again.",
    });
  }
});

// Post an answer to a question
router.post("/:questionId/answer", async (req, res) => {
  try {
    const { text, authorId, authorName } = req.body;
    const answer = new Answer({
      questionId: req.params.questionId,
      text,
      authorId: authorId || undefined,
      authorName: authorName || "Anonymous",
    });
    await answer.save();
    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: "Failed to post answer" });
  }
});

// Post a reply to an answer
router.post("/answer/:answerId/reply", async (req, res) => {
  try {
    const { text, authorId, authorName } = req.body;
    const reply = new Reply({
      answerId: req.params.answerId,
      text,
      authorId: authorId || undefined,
      authorName: authorName || "Anonymous",
    });
    await reply.save();
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: "Failed to post reply" });
  }
});

// Get all answers for a question
router.get("/:questionId/answers", async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query params
    const question = await Question.findById(req.params.questionId);

    let answers = await Answer.find({ questionId: req.params.questionId }).sort(
      { createdAt: 1 },
    );

    // Filter AI answers - only show to question author
    if (question) {
      answers = answers.filter((answer) => {
        if (answer.visibleOnlyToAuthor && answer.aiGenerated) {
          return question.authorId.toString() === userId;
        }
        return true;
      });
    }

    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch answers" });
  }
});

// Get all replies for an answer
router.get("/answer/:answerId/replies", async (req, res) => {
  try {
    const replies = await Reply.find({ answerId: req.params.answerId }).sort({
      createdAt: 1,
    });
    res.json(replies);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch replies" });
  }
});

// Get a single question by ID
router.get("/:questionId", async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch question" });
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
            {
              role: "system",
              content:
                "Polish the following question for grammar, clarity, and conciseness:",
            },
            { role: "user", content: text },
          ],
          max_tokens: 300,
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } },
      ),
    );

    const responses = await Promise.all(calls);

    // Map responses to choices
    const choices = responses.map((r) => ({
      title: r.data.choices[0].message.content.split("\n")[0].slice(0, 50),
      description: r.data.choices[0].message.content,
    }));

    res.json({ choices });
  } catch (err) {
    console.error("Groq polish error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI polishing failed" });
  }
});

module.exports = router;
