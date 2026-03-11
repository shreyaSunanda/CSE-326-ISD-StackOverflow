import React, { useEffect, useState } from "react";
import axios from "axios";
import AnswerList from "./AnswerList";

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({ title: "", description: "" });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async () => {
    const res = await axios.get("http://localhost:5000/questions");
    setQuestions(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/questions", newQuestion);
    setNewQuestion({ title: "", description: "" });
    setAiSuggestions([]);
    fetchQuestions();
  };

  const handleAIPolish = async () => {
    if (!newQuestion.description) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/questions/polish", {
        text: newQuestion.description,
      });

      const suggestions = res.data.choices || [
        { title: newQuestion.title, description: res.data.polished },
      ];

      setAiSuggestions(suggestions);
    } catch (err) {
      console.error("AI polish failed:", err.response?.data || err.message);
    }
    setLoading(false);
  };

  const handleSuggestionClick = (s) => {
    setNewQuestion({ title: s.title, description: s.description });
    setAiSuggestions([]);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return (
    <div>
      <h2>Ask a Question</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={newQuestion.title}
          onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={newQuestion.description}
          onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
          required
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button type="submit">Submit</button>
          <button type="button" onClick={handleAIPolish} disabled={loading}>
            {loading ? "Polishing..." : "Polish with AI"}
          </button>
        </div>
      </form>

      {aiSuggestions.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          {aiSuggestions.map((s, idx) => (
            <div
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              style={{
                border: "1px solid #ddd",
                padding: "8px",
                marginBottom: "5px",
                cursor: "pointer",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <strong>{s.title}</strong>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
      )}

      <h2>Questions</h2>
      {questions.map((q) => (
        <div key={q._id} style={{ border: "1px solid black", margin: "10px", padding: "10px" }}>
          <h3>{q.title}</h3>
          <p>{q.description}</p>
          <AnswerList questionId={q._id} />
        </div>
      ))}
    </div>
  );
};

export default QuestionList;