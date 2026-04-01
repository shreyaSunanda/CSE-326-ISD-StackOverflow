import React, { useEffect, useState } from "react";
import axios from "axios";
import ReplyList from "./ReplyList";

const AnswerList = ({ questionId }) => {
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");

  const fetchAnswers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/questions/${questionId}/answers`);
      setAnswers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer) return;
    try {
      await axios.post(`http://localhost:5000/questions/${questionId}/answer`, { text: newAnswer });
      setNewAnswer("");
      fetchAnswers();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, [questionId]);

  return (
    <div className="answer-section">
      <h4>Answers</h4>
      {answers.map((a) => (
        <div key={a._id} className="answer-card">
          <p>{a.text}</p>
          <ReplyList answerId={a._id} />
        </div>
      ))}
      <form className="answer-form" onSubmit={submitAnswer}>
        <input
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          placeholder="Write an answer"
        />
        <button type="submit">Submit Answer</button>
      </form>
    </div>
  );
};

export default AnswerList;