import React, { useState, useEffect } from "react";
import axios from "axios";
import AnswerList from "./AnswerList";
import "./QuestionDetail.css";

const QuestionDetail = ({ questionId, onBackClick }) => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiAnswerMessage, setAiAnswerMessage] = useState(null);
  const [aiAnswerGenerated, setAiAnswerGenerated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/questions/${questionId}`,
        );

        if (res.data && res.data.success) {
          setQuestion(res.data.data);

          // Check if AI answer was already generated using the flag in the question model
          if (res.data.data.isAiAnswerGenerated) {
            setAiAnswerGenerated(true);
          }
        } else {
          setError("Failed to load question");
        }
      } catch (err) {
        console.error("Error fetching question:", err);
        setError("Could not load question details");
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);
  const handleGenerateAIAnswer = async () => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || !user.id) {
        setAiAnswerMessage({
          type: "error",
          text: "Please log in to generate AI answers",
        });
        return;
      }

      if (question.authorId !== user.id) {
        setAiAnswerMessage({
          type: "error",
          text: "Only the question author can generate AI answers",
        });
        return;
      }

      setGeneratingAI(true);
      setAiAnswerMessage(null);

      const res = await axios.post(
        `http://localhost:5000/api/questions/${questionId}/ai-answer`,
        { authorId: user.id },
      );

      if (res.data.success) {
        setAiAnswerMessage({
          type: "success",
          text: "AI answer generated successfully!",
        });
        setAiAnswerGenerated(true);
        // Trigger refresh of AnswerList without page reload
        setRefreshKey((prev) => prev + 1);
        // Clear message after 2 seconds
        setTimeout(() => {
          setAiAnswerMessage(null);
        }, 2000);
      }
    } catch (err) {
      console.error("Error generating AI answer:", err);
      setAiAnswerMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to generate AI answer",
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="question-detail-container">
      <button className="back-btn" onClick={onBackClick}>Back to Feed</button>

      {loading ? (
        <div className="loading-container">
          <p className="loading-text">Loading question...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-text">{error}</p>
        </div>
      ) : !question ? (
        <div className="error-container">
          <p className="error-text">Question not found</p>
        </div>
      ) : (
        <>
          <div className="question-detail-header">
            <h1 className="question-detail-title">{question.title}</h1>
            <div className="question-meta-info">
              <span>
                asked by <strong>{question.authorName || "Anonymous"}</strong>
              </span>
              <span className="question-date">
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
            </div>
            {question.authorId ===
              JSON.parse(localStorage.getItem("user") || "{}")?.id && (
              <button
                className="ask-ai-btn"
                onClick={handleGenerateAIAnswer}
                disabled={generatingAI || aiAnswerGenerated}
              >
                {generatingAI
                  ? "Generating AI Answer..."
                  : aiAnswerGenerated
                    ? "✓ AI Answer Generated"
                    : "🤖 Ask AI"}
              </button>
            )}
          </div>

          {aiAnswerMessage && (
            <div className={`ai-message ${aiAnswerMessage.type}`}>
              {aiAnswerMessage.text}
            </div>
          )}

          <div className="question-detail-content">
            <div className="question-body">
              <p>{question.body}</p>
            </div>

            {question.tags && question.tags.length > 0 && (
              <div className="question-detail-tags">
                {question.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="divider"></div>

          <AnswerList questionId={questionId} key={refreshKey} />
        </>
      )}
    </div>
  );
};

export default QuestionDetail;
