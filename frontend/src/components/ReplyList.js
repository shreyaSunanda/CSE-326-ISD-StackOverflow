import React, { useEffect, useState, useCallback } from "react";
import axios from "../api/client";
import "./ReplyList.css";

const ReplyList = ({ answerId }) => {
	const [replies, setReplies] = useState([]);
	const [newReply, setNewReply] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showReplyForm, setShowReplyForm] = useState(false);

	const getCurrentUser = () => {
		try {
			const savedUser = localStorage.getItem("user");
			return savedUser ? JSON.parse(savedUser) : null;
		} catch (err) {
			return null;
		}
	};

	const fetchReplies = useCallback(async () => {
		try {
			setLoading(true);
			const res = await axios.get(`/api/questions/answer/${answerId}/replies`);
			setReplies(res.data || []);
			setError(null);
		} catch (err) {
			console.error("Error fetching replies:", err);
			setError("Failed to load replies");
		} finally {
			setLoading(false);
		}
	}, [answerId]);

	const submitReply = async (e) => {
		e.preventDefault();
		if (!newReply.trim()) return;

		const currentUser = getCurrentUser();

		try {
			setLoading(true);
			await axios.post(`/api/questions/answer/${answerId}/reply`, {
				text: newReply,
				authorId: currentUser?.id,
				authorName: currentUser?.username || currentUser?.name || "Anonymous",
			});

			setNewReply("");
			setError(null);
			setShowReplyForm(false);
			fetchReplies();
		} catch (err) {
			console.error("Error posting reply:", err);
			setError("Failed to post reply");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (answerId) {
			fetchReplies();
		}
	}, [answerId, fetchReplies]);

	return (
		<div className="reply-list-container">
			{error && <div className="reply-error">{error}</div>}

			{replies.length > 0 && (
				<div className="replies">
					{replies.map((r) => (
						<div key={r._id} className="reply-item">
							<div className="reply-text">{r.text}</div>
							<div className="reply-meta">
								replied by <strong>{r.authorName || "Anonymous"}</strong> on{" "}
								{new Date(r.createdAt).toLocaleDateString()}
							</div>
						</div>
					))}
				</div>
			)}

			<button className="toggle-reply-btn" onClick={() => setShowReplyForm(!showReplyForm)}>
				{showReplyForm ? "Cancel" : "Reply"}
			</button>

			{showReplyForm && (
				<form className="reply-form" onSubmit={submitReply}>
					<input
						placeholder="Write a reply..."
						value={newReply}
						onChange={(e) => setNewReply(e.target.value)}
						className="reply-input"
						disabled={loading}
					/>
					<button type="submit" disabled={loading} className="reply-submit-btn">
						{loading ? "Posting..." : "Reply"}
					</button>
				</form>
			)}
		</div>
	);
};

export default ReplyList;
