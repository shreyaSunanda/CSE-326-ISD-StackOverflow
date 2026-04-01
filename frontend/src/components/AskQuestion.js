
import React, { useState } from 'react';
import axios from 'axios';
import './AskQuestion.css';

const AskQuestion = ({ onCancel, onSuccess }) => {
    const [mode, setMode] = useState('manual'); // 'manual' or 'ai'
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);

    // AI Mode States
    const [aiContext, setAiContext] = useState('');
    const [aiRawQuestion, setAiRawQuestion] = useState('');
    const [aiGeneratedBody, setAiGeneratedBody] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

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

    // AI Generation Function
    const handleGenerateAI = async () => {
        if (!aiContext.trim() || !aiRawQuestion.trim()) {
            alert('Please fill in both Context and Question fields');
            return;
        }

        setIsGenerating(true);

        try {
            const res = await axios.post('http://localhost:5000/api/questions/ai/suggest', {
                rawInput: aiRawQuestion,
                context: aiContext
            });

            if (res.data.success) {
                // Set the generated content
                setTitle(res.data.data.title);
                setBody(res.data.data.body);
                setAiGeneratedBody(res.data.data.body);
                alert('AI question generated! You can now edit it below.');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || "AI generation failed";
            alert(errorMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (mode === 'ai') {
            if (!aiRawQuestion?.trim() || !aiContext?.trim()) {
                alert('Please fill in both your "Rough Question" and "Context" first.');
                return; // Stop the submission
            }

            if (!title?.trim() || !body?.trim()) {
                alert('Please click "✨ Generate Question" to create your draft before posting.');
                return; // Stop the submission
            }
        }

        if (tags.length === 0) {
            alert('Please add at least 1 tag.');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        try {
            const res = await axios.post('http://localhost:5000/api/questions', {
                title,
                body,
                tags,
                authorId: userData?.id || userData?._id,
                authorName: userData?.username || userData?.name || 'Anonymous',
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

                    {/* Mode Toggle */}
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
                            <span className="ai-icon">✨</span> AI Assisted
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* MANUAL MODE */}
                        {mode === 'manual' && (
                            <>
                                {/* Title */}
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

                                {/* Body */}
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
                            </>
                        )}

                        {/* AI MODE */}
                        {mode === 'ai' && (
                            <>
                                {/* Context Input */}
                                <div className="field-group">
                                    <label className="field-label">Context</label>
                                    <p className="field-hint">Provide background information about your situation.</p>
                                    <textarea
                                        className="field-textarea"
                                        placeholder="e.g., I'm building a React app with TypeScript and using Tailwind CSS..."
                                        rows="4"
                                        value={aiContext}
                                        onChange={(e) => setAiContext(e.target.value)}
                                    />
                                </div>

                                {/* Raw Question Input */}
                                <div className="field-group">
                                    <label className="field-label">Your Question (Raw)</label>
                                    <p className="field-hint">Write your question in simple terms, AI will format it professionally.</p>
                                    <textarea
                                        className="field-textarea"
                                        placeholder="e.g., how do i make a component rerender when props change?"
                                        rows="4"
                                        value={aiRawQuestion}
                                        onChange={(e) => setAiRawQuestion(e.target.value)}
                                    />
                                </div>

                                {/* Generate Button */}
                                <button
                                    type="button"
                                    className="generate-btn"
                                    onClick={handleGenerateAI}
                                    disabled={isGenerating || !aiContext.trim() || !aiRawQuestion.trim()}
                                >
                                    {isGenerating ? '⏳ Generating...' : '✨ Generate Question'}
                                </button>

                                {/* AI Generated Preview */}
                                {aiGeneratedBody && (
                                    <div className="ai-preview">
                                        <div className="ai-preview-header">
                                            <span className="ai-label">AI Generated Draft</span>
                                            <span className="review-badge">Review & Edit Below</span>
                                        </div>
                                        <pre className="ai-preview-content">{aiGeneratedBody}</pre>
                                    </div>
                                )}

                                {/* Editable Title (after generation) */}
                                {aiGeneratedBody && (
                                    <>
                                        <div className="field-group">
                                            <label className="field-label">Edit Title</label>
                                            <input
                                                type="text"
                                                className="field-input"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                required
                                                minLength="15"
                                            />
                                        </div>

                                        {/* Editable Body (after generation) */}
                                        <div className="field-group">
                                            <label className="field-label">Edit Content</label>
                                            <textarea
                                                className="field-textarea"
                                                rows="10"
                                                value={body}
                                                onChange={(e) => setBody(e.target.value)}
                                                required
                                                minLength="30"
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {/* Tags - Common for both modes */}
                        <div className="field-group">
                            <label className="field-label">Tags (up to 5)</label>
                            <p className="field-hint">Add tags to describe what your question is about.</p>

                            {/* Tag Chips */}
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

                        {/* Submit Buttons */}
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Posting...' : 'Post Your Question'}
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