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
    res.json({ success: true, data: { questions } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch questions" });
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
            error: "Author ID and Name are required. Please login again." 
        });
    }

    const q = new Question({ 
        title, 
        body,       
        tags: Array.isArray(tags) ? tags : [],       
        authorId,   
        authorName, 
        source: source || 'manual'
    });

    
    await q.save();
    
    
    return res.status(201).json({ success: true, data: q });

  } catch (err) {
    console.error("Save Error:", err.message);
    
    
    return res.status(400).json({ 
        success: false, 
        error: err.message 
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
        error: "Please provide at least 10 characters for AI to work with" 
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
${context ? `\nAdditional context: ${context}` : ''}

Generate ONE well-structured question.`;

   
    // OpenRouter API Call
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      { 
        headers: { 
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000", // OpenRouter asks for a referer header
          "X-Title": "StackOverflow Clone",
          "Content-Type": "application/json"
        } 
      }
    );

    const generatedQuestion = response.data.choices[0].message.content;
    if (!generatedQuestion || generatedQuestion.trim() === '') {
      return res.status(500).json({ 
        success: false,
        error: "The AI model returned an empty response. Please try again."
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
      generatedBody = generatedQuestion.replace(/^TITLE:\s*(.*)\n*/i, '').trim();
    }

    res.json({ 
      success: true,
      data: {
        title: generatedTitle, // Use the extracted AI title
        body: generatedBody    // Use the rest of the text for the body
      }
    });

  } catch (err) {
    console.error("AI suggestion error:", err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      error: "AI generation failed. Please try again."
    });
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