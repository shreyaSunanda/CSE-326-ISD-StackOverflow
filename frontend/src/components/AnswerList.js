import React, { useEffect, useState } from "react";
import axios from "axios";
import ReplyList from "./ReplyList";
import "./AnswerList.css";

const AnswerList = ({ questionId }) => {
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [fetchingAnswers, setFetchingAnswers] = useState(false);
  const [postingAnswer, setPostingAnswer] = useState(false);
  const [error, setError] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [keepingId, setKeepingId] = useState(null);

  const getCurrentUser = () => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      return null;
    }
  };

  const fetchAnswers = async () => {
    try {
      setFetchingAnswers(true);
      const currentUser = getCurrentUser();
      const res = await axios.get(
        `http://localhost:5000/api/questions/${questionId}/answers?userId=${currentUser?.id || ""}`,
      );
      setAnswers(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching answers:", err);
      setError("Failed to load answers");
    } finally {
      setFetchingAnswers(false);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    const currentUser = getCurrentUser();

    try {
      setPostingAnswer(true);
      await axios.post(
        `http://localhost:5000/api/questions/${questionId}/answer`,
        {
          text: newAnswer,
          authorId: currentUser?.id,
          authorName: currentUser?.username || currentUser?.name || "Anonymous",
        },
      );
      setNewAnswer("");
      setError(null);
      await fetchAnswers();
      setPostingAnswer(false);
    } catch (err) {
      console.error("Error posting answer:", err);
      setError("Failed to post answer");
      setPostingAnswer(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      fetchAnswers();
    }
  }, [questionId]);

  const handleRegenerateAnswer = async (answerId, questionId) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.id) {
        setError("Please log in to regenerate answers");
        return;
      }

      setRegeneratingId(answerId);
      const res = await axios.post(
        `http://localhost:5000/api/questions/${questionId}/ai-answer/regenerate`,
        {
          authorId: currentUser.id,
          answerId: answerId,
        },
      );

      if (res.data.success) {
        // Update the answer in the state
        setAnswers(
          answers.map((a) => (a._id === answerId ? res.data.data : a)),
        );
      }
    } catch (err) {
      console.error("Error regenerating answer:", err);
      setError(err.response?.data?.error || "Failed to regenerate answer");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleKeepAnswer = async (answerId, questionId) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.id) {
        setError("Please log in to keep answers");
        return;
      }

      setKeepingId(answerId);
      const res = await axios.put(
        `http://localhost:5000/api/questions/${questionId}/ai-answer/${answerId}/keep`,
        {
          authorId: currentUser.id,
        },
      );

      if (res.data.success) {
        // Update the answer in the state
        setAnswers(
          answers.map((a) => (a._id === answerId ? res.data.data : a)),
        );
      }
    } catch (err) {
      console.error("Error keeping answer:", err);
      setError(err.response?.data?.error || "Failed to keep answer");
    } finally {
      setKeepingId(null);
    }
  };

  return (
    <div className="answer-list-container">
      <h2 className="answer-title">
        {answers.length} Answer{answers.length !== 1 ? "s" : ""}
      </h2>

      {error && <div className="error-message">{error}</div>}

      {fetchingAnswers && answers.length === 0 ? (
        <p className="loading-text">Loading answers...</p>
      ) : answers.length > 0 ? (
        <div className="answers-list">
          {answers.map((a) => (
            <div
              key={a._id}
              className={`answer-item ${a.aiAnswerKept ? "answer-kept" : ""}`}
            >
              <div className="answer-text">{a.text}</div>
              <div className="answer-meta">
                answered by <strong>{a.authorName || "Anonymous"}</strong>
                {a.aiGenerated && (
                  <span className="ai-badge">🤖 AI Generated</span>
                )}
                on {new Date(a.createdAt).toLocaleDateString()}
                {a.aiGenerated && a.visibleOnlyToAuthor && !a.aiAnswerKept && (
                  <div className="ai-answer-actions">
                    <button
                      className="ai-action-btn regenerate-btn"
                      onClick={() => handleRegenerateAnswer(a._id, questionId)}
                      disabled={regeneratingId === a._id}
                    >
                      {regeneratingId === a._id
                        ? "Regenerating..."
                        : "Regenerate"}
                    </button>
                    <button
                      className="ai-action-btn keep-btn"
                      onClick={() => handleKeepAnswer(a._id, questionId)}
                      disabled={keepingId === a._id}
                    >
                      {keepingId === a._id ? "Keeping..." : "Keep"}
                    </button>
                  </div>
                )}
              </div>
              <ReplyList answerId={a._id} />
            </div>
          ))}
        </div>
      ) : (
        <p className="no-answers">No answers yet. Be the first to answer!</p>
      )}

      <form className="answer-form" onSubmit={submitAnswer}>
        <div className="form-group">
          <label htmlFor="answer-input">Your Answer</label>
          <textarea
            id="answer-input"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Write your answer here..."
            rows="8"
            disabled={postingAnswer}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={postingAnswer}
            className="submit-answer-btn"
          >
            {postingAnswer ? "Posting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnswerList;
