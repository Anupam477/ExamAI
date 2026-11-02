import React, { useState } from 'react';
import { generateAiQuestionsForTopic } from '../../utils/mockApi';

/**
 * Step 2: Questions Authoring & AI Generation
 * 2-Column Side-by-Side:
 * - Left Column: Manual Question Creator with:
 *     - Question Format: MCQ, Short Answer, Long Answer
 *     - Difficulty: Easy, Medium, Hard
 *     - Duration (minutes) with stepper & quick chips
 *     - Marks (+) with stepper & quick chips
 *     - Negative Mark (-) with stepper & quick chips (for MCQ)
 * - Right Column: Gemini AI Question Generator
 * - Bottom: Live Question Paper Roster with individual real-time steppers
 */
export default function StepQuestions({ formData, onChange, onNext, onBack, onDirectPublish }) {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Manual Question state
  const [newQuestionType, setNewQuestionType] = useState('mcq');
  const [newQTitle, setNewQTitle] = useState('');
  const [newQDifficulty, setNewQDifficulty] = useState('Medium');
  const [newQDuration, setNewQDuration] = useState(2);
  const [newQMarks, setNewQMarks] = useState(5);
  const [newQNegativeMarks, setNewQNegativeMarks] = useState(
    formData.defaultNegativeMarks ?? (formData.proctoring?.negativeMarking ? 1.0 : 0)
  );
  const [newQOptions, setNewQOptions] = useState(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQExplanation, setNewQExplanation] = useState('');

  // AI Generator state
  const [aiCount, setAiCount] = useState(3);
  const [aiDifficulty, setAiDifficulty] = useState(formData.difficulty || 'Medium');
  const [aiMarks, setAiMarks] = useState(5);
  const [aiNegativeMarks, setAiNegativeMarks] = useState(
    formData.defaultNegativeMarks ?? (formData.proctoring?.negativeMarking ? 1.0 : 0)
  );
  const [aiFocus, setAiFocus] = useState('All');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const questions = formData.questions || [];

  const showNotification = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Switch Question Type with smart defaults
  const handleTypeChange = (type) => {
    setNewQuestionType(type);
    if (type === 'mcq') {
      setNewQMarks(5);
      setNewQDuration(2);
    } else if (type === 'short') {
      setNewQMarks(3);
      setNewQDuration(3);
    } else if (type === 'long') {
      setNewQMarks(10);
      setNewQDuration(8);
    }
  };

  const handleGenerateAi = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const generated = generateAiQuestionsForTopic(
        formData.topic || 'Artificial Intelligence & Machine Learning',
        Number(aiCount) || 3,
        aiDifficulty,
        Number(aiMarks) || 5,
        Number(aiNegativeMarks) || 0
      );
      onChange({
        ...formData,
        questions: [...questions, ...generated],
      });
      setIsGeneratingAi(false);
      showNotification(`✓ Successfully generated ${generated.length} AI questions.`);
    }, 650);
  };

  const handleAddManualQuestion = (e) => {
    e.preventDefault();
    if (!newQTitle.trim()) return;

    const newQuestion = {
      id: `q_custom_${Date.now()}`,
      type: newQuestionType,
      difficulty: newQDifficulty,
      duration: Math.max(1, Number(newQDuration) || 2),
      marks: Math.max(1, Number(newQMarks) || 5),
      negativeMarks: newQuestionType === 'mcq' ? Math.max(0, Number(newQNegativeMarks) || 0) : 0,
      title: newQTitle.trim(),
      options: newQuestionType === 'mcq' ? newQOptions.map((o, idx) => o.trim() || `Option ${idx + 1}`) : undefined,
      correctOption: newQuestionType === 'mcq' ? newQCorrect : undefined,
      explanation: newQExplanation.trim(),
      rubric: (newQuestionType === 'short' || newQuestionType === 'long') ? newQExplanation.trim() : undefined,
    };

    onChange({
      ...formData,
      questions: [...questions, newQuestion],
    });

    // Reset Form
    setNewQTitle('');
    setNewQOptions(['', '', '', '']);
    setNewQExplanation('');
    showNotification('✓ Question added to examination paper.');
  };

  const handleDeleteQuestion = (qId) => {
    onChange({
      ...formData,
      questions: questions.filter((q) => q.id !== qId),
    });
  };

  const updateQuestionMarks = (qId, newMarks) => {
    const clamped = Math.max(1, Math.min(100, Number(newMarks) || 1));
    onChange({
      ...formData,
      questions: questions.map((q) => (q.id === qId ? { ...q, marks: clamped } : q)),
    });
  };

  const updateQuestionNegativeMarks = (qId, newNegative) => {
    const clamped = Math.max(0, Math.min(20, Number(Number(newNegative).toFixed(2)) || 0));
    onChange({
      ...formData,
      questions: questions.map((q) => (q.id === qId ? { ...q, negativeMarks: clamped } : q)),
    });
  };

  const handleBulkSetMarks = (val) => {
    onChange({
      ...formData,
      questions: questions.map((q) => ({ ...q, marks: val })),
    });
    showNotification(`✓ Updated all questions to ${val} marks each.`);
  };

  const handleBulkSetNegative = (val) => {
    onChange({
      ...formData,
      questions: questions.map((q) => ({ ...q, negativeMarks: val })),
    });
    showNotification(`✓ Updated negative penalty to -${val} for all questions.`);
  };

  const totalMarks = questions.reduce((acc, curr) => acc + (Number(curr.marks) || 0), 0);
  const totalDuration = questions.reduce((acc, curr) => acc + (Number(curr.duration) || 2), 0);
  const totalNegative = questions.reduce((acc, curr) => acc + (Number(curr.negativeMarks) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          style={{
            position: 'fixed',
            top: '75px',
            right: '24px',
            backgroundColor: 'var(--tp-green-primary)',
            color: '#FFFFFF',
            padding: '0.65rem 1.15rem',
            borderRadius: '8px',
            fontSize: '0.84375rem',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2-Column Layout: Manual Form (Left) | AI Generator (Right) */}
      {/* ======================================================== */}
      <div className="teacher-create-grid">
        {/* Left Column: Compact Manual Question Creator */}
        <div className="teacher-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <div>
              <h2 className="teacher-card-title">Add Question to Paper</h2>
              <p className="teacher-card-desc" style={{ marginBottom: 0 }}>
                Craft custom MCQ, Short Answer, or Long Answer problem manually.
              </p>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor: 'var(--tp-surface-hover)',
                color: 'var(--tp-text-muted)',
                border: '1px solid var(--tp-border)',
              }}
            >
              Manual Form
            </span>
          </div>

          <form onSubmit={handleAddManualQuestion}>
            {/* Row 1: Question Format & Difficulty */}
            <div className="teacher-grid-2" style={{ marginBottom: '0.85rem' }}>
              <div>
                <label className="teacher-label">Question Format</label>
                <select
                  className="teacher-select"
                  value={newQuestionType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="mcq">Multiple Choice Question (MCQ)</option>
                  <option value="short">Short Answer (1-2 sentences)</option>
                  <option value="long">Long Answer (Detailed / Essay)</option>
                </select>
              </div>

              <div>
                <label className="teacher-label">Difficulty Level</label>
                <select
                  className="teacher-select"
                  value={newQDifficulty}
                  onChange={(e) => setNewQDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy (Foundational)</option>
                  <option value="Medium">Medium (Analytical)</option>
                  <option value="Hard">Hard (Deep Advanced)</option>
                </select>
              </div>
            </div>

            {/* Row 2: 3 Clean Input Boxes (Duration, Marks, Negative) */}
            <div className="teacher-grid-3" style={{ marginBottom: '0.85rem' }}>
              <div className="teacher-form-group" style={{ marginBottom: 0 }}>
                <label className="teacher-label" htmlFor="custom-q-duration">
                  Duration (minutes)
                </label>
                <input
                  id="custom-q-duration"
                  type="number"
                  min="1"
                  max="120"
                  className="teacher-input"
                  value={newQDuration}
                  onChange={(e) => setNewQDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="e.g. 2"
                  required
                />
              </div>

              <div className="teacher-form-group" style={{ marginBottom: 0 }}>
                <label className="teacher-label" htmlFor="custom-q-marks">
                  Marks (+)
                </label>
                <input
                  id="custom-q-marks"
                  type="number"
                  min="1"
                  max="100"
                  className="teacher-input"
                  value={newQMarks}
                  onChange={(e) => setNewQMarks(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="e.g. 5"
                  required
                />
              </div>

              <div className="teacher-form-group" style={{ marginBottom: 0 }}>
                <label className="teacher-label" htmlFor="custom-q-negative">
                  Negative (-)
                </label>
                <input
                  id="custom-q-negative"
                  type="number"
                  min="0"
                  max="10"
                  step="0.25"
                  className="teacher-input"
                  value={newQuestionType === 'mcq' ? newQNegativeMarks : 0}
                  onChange={(e) => setNewQNegativeMarks(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={newQuestionType !== 'mcq'}
                  placeholder="0"
                  title={newQuestionType !== 'mcq' ? 'Negative marking only applies to MCQ format' : 'Penalty deducted for incorrect response'}
                  style={newQuestionType !== 'mcq' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="teacher-form-group">
              <label className="teacher-label">
                {newQuestionType === 'mcq'
                  ? 'Problem Statement'
                  : newQuestionType === 'short'
                  ? 'Short Answer Question Prompt'
                  : 'Long Answer / Essay Problem Statement'}
              </label>
              <textarea
                rows={2}
                className="teacher-textarea"
                placeholder={
                  newQuestionType === 'mcq'
                    ? 'State the multiple choice problem clearly...'
                    : newQuestionType === 'short'
                    ? 'e.g. Define gradient descent and state its main objective in neural network training.'
                    : 'e.g. Derive the backpropagation algorithm for a multi-layer perceptron with cross-entropy loss...'
                }
                value={newQTitle}
                onChange={(e) => setNewQTitle(e.target.value)}
                required
              />
            </div>

            {/* MCQ Options with Radio Selectors */}
            {newQuestionType === 'mcq' && (
              <div className="teacher-form-group">
                <label className="teacher-label">Multiple Choice Options (Select correct radio)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {newQOptions.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="correct-opt"
                        checked={newQCorrect === idx}
                        onChange={() => setNewQCorrect(idx)}
                        style={{ accentColor: 'var(--tp-green-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        className="teacher-input"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newQOptions];
                          updated[idx] = e.target.value;
                          setNewQOptions(updated);
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Short Answer Model Key */}
            {newQuestionType === 'short' && (
              <div className="teacher-form-group">
                <label className="teacher-label">Expected Key Concepts / Model Answer (For auto-grading)</label>
                <textarea
                  rows={2}
                  className="teacher-textarea"
                  placeholder="Key concepts or mandatory phrases candidate must mention for full marks..."
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                />
              </div>
            )}

            {/* Long Answer Rubric */}
            {newQuestionType === 'long' && (
              <div className="teacher-form-group">
                <label className="teacher-label">Step-by-Step Marking Rubric &amp; Evaluation Guide</label>
                <textarea
                  rows={3}
                  className="teacher-textarea"
                  placeholder="e.g. 3 marks for mathematical derivation, 3 marks for algorithm steps, 4 marks for error analysis..."
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                />
              </div>
            )}

            {/* Add Button */}
            <button
              type="submit"
              className="teacher-btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add to Test Paper (+{newQMarks} pts &bull; ⏱ {newQDuration}m)
            </button>
          </form>
        </div>

        {/* Right Column: AI Question Generator */}
        <div
          className="teacher-card"
          style={{
            background: 'linear-gradient(135deg, rgba(35, 115, 86, 0.05) 0%, rgba(22, 163, 74, 0.02) 100%)',
            border: '1.5px solid var(--tp-green-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--tp-green-light)', color: 'var(--tp-green-text)', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px' }}>
                <span>⚡ Gemini AI Assistant</span>
              </div>
              <h2 className="teacher-card-title">Generate with AI</h2>
              <p className="teacher-card-desc" style={{ marginBottom: 0 }}>
                Synthesize calibrated questions with custom marks &amp; distractors.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Active Topic Card */}
            <div
              style={{
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: 'var(--tp-surface)',
                border: '1px solid var(--tp-border)',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--tp-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>
                Target Topic
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--tp-green-primary)' }}>
                {formData.topic || 'Artificial Intelligence & Machine Learning'}
              </div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--tp-text-muted)', marginTop: '2px' }}>
                Subject: {formData.subject || 'Computer Science'}
              </div>
            </div>

            {/* Count & Difficulty Selectors */}
            <div className="teacher-grid-2">
              <div>
                <label className="teacher-label">Number of Questions</label>
                <select
                  className="teacher-select"
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={8}>8 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>

              <div>
                <label className="teacher-label">Target Difficulty</label>
                <select
                  className="teacher-select"
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy (Foundational)</option>
                  <option value="Medium">Medium (Analytical)</option>
                  <option value="Hard">Hard (Deep Advanced)</option>
                </select>
              </div>
            </div>

            {/* AI Custom Marks & Negative Marks Clean Input Boxes */}
            <div className="teacher-grid-2">
              <div className="teacher-form-group" style={{ marginBottom: 0 }}>
                <label className="teacher-label" htmlFor="ai-q-marks">
                  Marks per Q (+)
                </label>
                <input
                  id="ai-q-marks"
                  type="number"
                  min="1"
                  max="100"
                  className="teacher-input"
                  value={aiMarks}
                  onChange={(e) => setAiMarks(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="5"
                />
              </div>

              <div className="teacher-form-group" style={{ marginBottom: 0 }}>
                <label className="teacher-label" htmlFor="ai-q-negative">
                  Negative Penalty (-)
                </label>
                <input
                  id="ai-q-negative"
                  type="number"
                  min="0"
                  max="10"
                  step="0.25"
                  className="teacher-input"
                  value={aiNegativeMarks}
                  onChange={(e) => setAiNegativeMarks(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* AI Focus Tags */}
            <div>
              <label className="teacher-label">Question Focus</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['All', 'Conceptual', 'Short Answer', 'Long Answer'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAiFocus(f)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: aiFocus === f ? '1px solid var(--tp-green-primary)' : '1px solid var(--tp-border)',
                      backgroundColor: aiFocus === f ? 'var(--tp-green-light)' : 'var(--tp-surface)',
                      color: aiFocus === f ? 'var(--tp-green-text)' : 'var(--tp-text-secondary)',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Primary AI Button */}
            <button
              type="button"
              className="teacher-btn-primary"
              onClick={handleGenerateAi}
              disabled={isGeneratingAi}
              style={{
                marginTop: '0.35rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
              }}
            >
              {isGeneratingAi ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>Synthesizing {aiCount} Questions with Gemini...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span>⚡ Generate {aiCount} Questions (+{aiMarks} pts each)</span>
                </>
              )}
            </button>

            <div style={{ fontSize: '0.7rem', color: 'var(--tp-text-muted)', textAlign: 'center', lineHeight: 1.35 }}>
              AI drafts balanced questions with distractors, answer keys &amp; rubrics.
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Bottom Section: Live Question Paper Roster               */}
      {/* ======================================================== */}
      <div style={{ marginTop: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '0.85rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--tp-surface)',
            border: '1px solid var(--tp-border)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--tp-text-primary)' }}>
              Question Paper ({questions.length} Questions)
            </h3>
            <div style={{ display: 'flex', gap: '14px', marginTop: '3px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--tp-text-muted)' }}>
                Total Marks: <strong style={{ color: 'var(--tp-green-primary)', fontSize: '0.92rem' }}>{totalMarks} pts</strong>
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--tp-text-muted)' }}>
                Total Duration: <strong style={{ color: 'var(--tp-text-primary)' }}>⏱ {totalDuration} mins</strong>
              </span>
              {totalNegative > 0 && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--tp-text-muted)' }}>
                  Total Potential Penalty: <strong style={{ color: '#DC2626' }}>-{totalNegative.toFixed(2)} pts</strong>
                </span>
              )}
            </div>
          </div>

          {/* Quick Bulk Adjust Actions */}
          {questions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--tp-text-muted)', fontWeight: 600 }}>Set all marks:</span>
              {[1, 2, 4, 5, 10].map((m) => (
                <button
                  key={m}
                  type="button"
                  className="teacher-stepper-chip"
                  onClick={() => handleBulkSetMarks(m)}
                  title={`Set all questions to ${m} marks`}
                >
                  +{m}
                </button>
              ))}
              <span style={{ fontSize: '0.72rem', color: 'var(--tp-text-muted)', fontWeight: 600, marginLeft: '6px' }}>Penalty:</span>
              {[0, 0.25, 0.5, 1.0].map((nm) => (
                <button
                  key={nm}
                  type="button"
                  className="teacher-stepper-chip negative"
                  onClick={() => handleBulkSetNegative(nm)}
                  title={`Set all questions negative mark to -${nm}`}
                >
                  {nm === 0 ? '0' : `-${nm}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {questions.length === 0 ? (
          <div
            className="teacher-card"
            style={{
              textAlign: 'center',
              padding: '2.5rem 1.5rem',
              color: 'var(--tp-text-muted)',
              borderStyle: 'dashed',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--tp-surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem',
                color: 'var(--tp-green-primary)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--tp-text-primary)' }}>
              No questions in assessment paper yet
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--tp-text-muted)' }}>
              Fill the form on the left to add questions manually, or click "Generate with AI" on the right.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {questions.map((q, idx) => {
              const currentMarks = Number(q.marks) || 5;
              const currentNegative = Number(q.negativeMarks ?? formData.defaultNegativeMarks ?? (formData.proctoring?.negativeMarking ? 1.0 : 0));
              const formatLabel = q.type === 'mcq' ? 'MCQ' : q.type === 'short' ? 'SHORT ANSWER' : 'LONG ANSWER';
              const diffColor = q.difficulty === 'Easy' ? '#16A34A' : q.difficulty === 'Hard' ? '#DC2626' : '#D97706';
              const diffBg = q.difficulty === 'Easy' ? 'rgba(22, 163, 74, 0.1)' : q.difficulty === 'Hard' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)';

              return (
                <div
                  key={q.id || idx}
                  className="teacher-card"
                  style={{
                    padding: '1.15rem 1.35rem',
                    borderLeft: '4px solid var(--tp-green-primary)',
                  }}
                >
                  {/* Question Header & Inline Interactive Steppers */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginBottom: '0.85rem',
                      paddingBottom: '0.65rem',
                      borderBottom: '1px solid var(--tp-border-light)',
                    }}
                  >
                    {/* Left Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--tp-green-primary)',
                          backgroundColor: 'var(--tp-green-light)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        QUESTION {idx + 1}
                      </span>

                      {/* Format Badge */}
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: q.type === 'mcq' ? 'var(--tp-green-primary)' : q.type === 'short' ? '#2563EB' : '#7C3AED',
                          backgroundColor: q.type === 'mcq' ? 'var(--tp-green-light)' : q.type === 'short' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {formatLabel}
                      </span>

                      {/* Difficulty Badge */}
                      {q.difficulty && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: diffColor,
                            backgroundColor: diffBg,
                            padding: '2px 7px',
                            borderRadius: '4px',
                          }}
                        >
                          {q.difficulty}
                        </span>
                      )}

                      {/* Duration Badge */}
                      <span style={{ fontSize: '0.7rem', color: 'var(--tp-text-muted)', fontWeight: 600 }}>
                        ⏱ {q.duration || 2}m
                      </span>

                      {q.aiGenerated && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#6366F1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          ✨ Gemini AI
                        </span>
                      )}
                    </div>

                    {/* Center: Live Inline Marks & Negative Marks Steppers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      {/* Positive Marks Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--tp-text-secondary)' }}>
                          Marks:
                        </span>
                        <div className="teacher-stepper-control">
                          <button
                            type="button"
                            className="teacher-stepper-btn"
                            onClick={() => updateQuestionMarks(q.id, currentMarks - 1)}
                            disabled={currentMarks <= 1}
                            title="Decrease marks for this question"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            className="teacher-stepper-input"
                            value={currentMarks}
                            onChange={(e) => updateQuestionMarks(q.id, e.target.value)}
                          />
                          <button
                            type="button"
                            className="teacher-stepper-btn"
                            onClick={() => updateQuestionMarks(q.id, currentMarks + 1)}
                            title="Increase marks for this question"
                          >
                            +
                          </button>
                        </div>
                        {/* Quick bump buttons */}
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {[1, 2, 4, 5, 10].map((m) => (
                            <button
                              key={m}
                              type="button"
                              className={`teacher-stepper-chip ${currentMarks === m ? 'active' : ''}`}
                              onClick={() => updateQuestionMarks(q.id, m)}
                              title={`Set to ${m} marks`}
                            >
                              +{m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Negative Marks Stepper (MCQ) */}
                      {q.type === 'mcq' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--tp-text-secondary)' }}>
                            Penalty:
                          </span>
                          <div className="teacher-stepper-control">
                            <button
                              type="button"
                              className="teacher-stepper-btn"
                              onClick={() => updateQuestionNegativeMarks(q.id, currentNegative - 0.25)}
                              disabled={currentNegative <= 0}
                              title="Decrease penalty"
                            >
                              -
                            </button>
                            <span className="teacher-stepper-val" style={{ color: '#DC2626', minWidth: '38px' }}>
                              -{currentNegative.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              className="teacher-stepper-btn"
                              onClick={() => updateQuestionNegativeMarks(q.id, currentNegative + 0.25)}
                              title="Increase penalty"
                            >
                              +
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {[0, 0.25, 0.5, 1.0].map((nm) => (
                              <button
                                key={nm}
                                type="button"
                                className={`teacher-stepper-chip negative ${currentNegative === nm ? 'active' : ''}`}
                                onClick={() => updateQuestionNegativeMarks(q.id, nm)}
                                title={`Set penalty to -${nm}`}
                              >
                                {nm === 0 ? '0' : `-${nm}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="Remove question"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Question Title */}
                  <h4 style={{ fontSize: '0.92rem', color: 'var(--tp-text-primary)', margin: '0 0 0.75rem', lineHeight: 1.45 }}>
                    {q.title}
                  </h4>

                  {/* MCQ Options Display */}
                  {q.options && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '0.65rem' }}>
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctOption === oIdx;
                        return (
                          <div
                            key={oIdx}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              border: isCorrect ? '1.5px solid var(--tp-green-primary)' : '1px solid var(--tp-border)',
                              backgroundColor: isCorrect ? 'var(--tp-green-light)' : 'var(--tp-surface)',
                              fontSize: '0.8125rem',
                              color: isCorrect ? 'var(--tp-green-text)' : 'var(--tp-text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: isCorrect ? 'var(--tp-green-primary)' : 'var(--tp-border)',
                                color: '#FFFFFF',
                                fontSize: '0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span style={{ fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Model Answer / Rubric Display for Short or Long Answer */}
                  {(q.rubric || q.explanation) && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--tp-text-secondary)',
                        backgroundColor: 'var(--tp-surface-hover)',
                        padding: '0.55rem 0.8rem',
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--tp-border)',
                      }}
                    >
                      <strong>{q.type === 'short' ? 'Expected Key Points:' : 'Grading Rubric:'}</strong>{' '}
                      {q.rubric || q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
        <button type="button" className="teacher-btn-secondary" onClick={onBack}>
          &larr; Back to Details &amp; Rules
        </button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onDirectPublish && (
            <button
              type="button"
              className="teacher-btn-primary"
              style={{
                width: 'auto',
                backgroundColor: '#16A34A',
                borderColor: '#16A34A',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
              }}
              onClick={() => onDirectPublish(formData)}
              disabled={questions.length === 0}
              title="Publish test immediately with all added questions"
            >
              <span>Publish Test Now</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>↗</span>
            </button>
          )}

          <button
            type="button"
            className="teacher-btn-primary"
            style={{ width: 'auto' }}
            onClick={onNext}
            disabled={questions.length === 0}
          >
            Continue to Assign Students ({questions.length} Questions &bull; {totalMarks} pts) &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
