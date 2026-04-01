import React, { useState } from 'react';
import axios from 'axios';
import './AskQuestion.css';

const AskQuestion = ({ onCancel, onSuccess }) => {
    const [mode, setMode] = useState('manual'); 
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);

    
    const handleAddTag = () => {
        const newTags = tagInput
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t !== '' && !tags.includes(t));

        if (tags.length + newTags.length > 5) {
            alert('Maximum 5 tags allowed!');
            return;
        }
        setTags([...tags, ...newTags]);
        setTagInput('');
    };

    
    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (tags.length === 0) {
            alert('Please add at least 1 tag.');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        try {
            const res = await axios.post('http://localhost:5000/api/questions', {
                title,
                body,
                tags,
                authorId: userData?.id || userData?._id,
                authorName: userData?.username || userData?.name,
                source: mode === 'ai' ? 'ai' : 'manual'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.success) {
                alert("Question posted successfully!");
                onSuccess();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Failed to post question";
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ask-page">
            <div className="ask-wrapper">
                <button className="back-btn" onClick={onCancel}>
                    ← Back
                </button>

                <div className="ask-card">
                    <h2 className="ask-title">Ask a Public Question</h2>

                
                    <div className="mode-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${mode === 'manual' ? 'active' : ''}`}
                            onClick={() => setMode('manual')}
                        >
                            Manual Draft
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${mode === 'ai' ? 'active' : ''}`}
                            onClick={() => setMode('ai')}
                        >
                            <span className="ai-icon">✦</span> AI Assisted
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        
                        <div className="field-group">
                            <label className="field-label">Title</label>
                            <p className="field-hint">Be specific and imagine you're asking a question to another person.</p>
                            <input
                                type="text"
                                className="field-input"
                                placeholder="e.g., How do I center a div in CSS?"
                                required
                                minLength="15"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        
                        <div className="field-group">
                            <label className="field-label">What are the details of your problem?</label>
                            <p className="field-hint">Include all the information someone would need to answer your question.</p>
                            <textarea
                                className="field-textarea"
                                placeholder="Describe your problem in detail... Include code examples if relevant."
                                rows="10"
                                required
                                minLength="30"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                            />
                        </div>

                        
                        <div className="field-group">
                            <label className="field-label">Tags (up to 5)</label>
                            <p className="field-hint">Add tags to describe what your question is about.</p>

                            
                            {tags.length > 0 && (
                                <div className="tag-chips">
                                    {tags.map(tag => (
                                        <span key={tag} className="tag-chip">
                                            {tag}
                                            <button
                                                type="button"
                                                className="tag-remove"
                                                onClick={() => handleRemoveTag(tag)}
                                            >×</button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="tag-input-row">
                                <input
                                    type="text"
                                    className="field-input tag-input"
                                    placeholder="e.g., javascript, react, css"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    disabled={tags.length >= 5}
                                />
                                <button
                                    type="button"
                                    className="add-tag-btn"
                                    onClick={handleAddTag}
                                    disabled={tags.length >= 5 || !tagInput.trim()}
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Posting...' : (
                                    <>
                                        Post Your Question
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={onCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AskQuestion;