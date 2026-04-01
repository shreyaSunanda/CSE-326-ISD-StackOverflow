import React, { useEffect, useState } from "react";
import axios from "axios";

const ReplyList = ({ answerId }) => {
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState("");

  const fetchReplies = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/questions/answer/${answerId}/replies`
      );
      setReplies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitReply = async () => {
    if (!newReply) return;

    try {
      await axios.post(
        `http://localhost:5000/questions/answer/${answerId}/reply`,
        { text: newReply }
      );

      setNewReply("");
      fetchReplies();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [answerId]);

  return (
    <div className="reply-section">
      {replies.map((r) => (
        <div key={r._id} className="reply-card">
          {r.text}
        </div>
      ))}

      <div style={{ marginTop: "5px" }}>
        <input
          placeholder="Write a reply..."
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          style={{ width: "80%", marginRight: "5px" }}
        />
        <button onClick={submitReply}>Reply</button>
      </div>
    </div>
  );
};

export default ReplyList;