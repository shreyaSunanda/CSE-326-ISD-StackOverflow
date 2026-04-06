import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnswerList from './AnswerList';
import './QuestionDetail.css';

const QuestionDetail = ({ questionId, onBackClick }) => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/questions/${questionId}`);
        
        if (res.data && res.data.success) {
          setQuestion(res.data.data);
        } else {
          setError('Failed to load question');
        }
      } catch (err) {
        console.error('Error fetching question:', err);
        setError('Could not load question details');
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  return (
    <div className="question-detail-container">
      <button className="back-btn" onClick={onBackClick}>← Back to Feed</button>
      
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
              <span>asked by <strong>{question.authorName || 'Anonymous'}</strong></span>
              <span className="question-date">
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="question-detail-content">
            <div className="question-body">
              <p>{question.body}</p>
            </div>

            {question.tags && question.tags.length > 0 && (
              <div className="question-detail-tags">
                {question.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="divider"></div>

          <AnswerList questionId={questionId} />
        </>
      )}
    </div>
  );
};

export default QuestionDetail;
