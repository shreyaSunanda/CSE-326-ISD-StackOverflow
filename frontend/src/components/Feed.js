import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Feed.css';

const Feed = (props) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                
                const res = await axios.get('http://localhost:5000/api/questions');
                
                
                if (res.data && res.data.success && res.data.data) {
                    setQuestions(res.data.data.questions || []);
                } else if (Array.isArray(res.data)) {
                    setQuestions(res.data);
                } else {
                    setQuestions([]);
                }
            } catch (err) {
                console.error("Error fetching questions:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    return (
        <div className="feed-container">
            <div className="feed-header">
                <h2>Your Feed</h2>
                
                <button 
                    className="ask-btn" 
                    onClick={props.onAskQuestionClick}
                >
                    + Ask Question
                </button>
            </div>

            <div className="questions-list">
                {loading ? (
                    <div className="loading-container">
                        <p className="loading-text">Loading questions...</p>
                    </div>
                ) : questions.length > 0 ? (
                    questions.map((q) => (
                        <div key={q._id} className="question-card">
                            <div className="question-stats">
                                {/* <div className="stat-item">
                                    <span>{q.voteCount || 0}</span> votes
                                </div> */}
                                <div className="stat-item">
                                    <span>{q.answerCount || 0}</span> answers
                                </div>
                            </div>
                            <div className="question-content">
                                <h3 className="question-title">{q.title}</h3>
                                <p className="question-excerpt">
                                    
                                    {q.body ? (q.body.substring(0, 160) + "...") : "No description available."}
                                </p>
                                <div className="question-tags">
                                    {q.tags && q.tags.map((tag, index) => (
                                        <span key={index} className="tag">{tag}</span>
                                    ))}
                                </div>
                                <div className="question-meta">
                                    <span>asked by <strong>{q.authorName || 'Anonymous'}</strong></span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-questions">
                        <p>No questions found. Be the first to ask!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feed;