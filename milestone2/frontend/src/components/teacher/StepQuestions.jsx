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
  const [newQMultiCorrect, setNewQMultiCorrect] = useState([0]);
  const [newQExplanation, setNewQExplanation] = useState('');

  // AI Generator state
  const [aiTopic, setAiTopic] = useState(formData.topic || '');
  const [aiFormat, setAiFormat] = useState('all'); // 'all', 'mcq', 'multi-select', 'short', 'long'
  const [aiCount, setAiCount] = useState(3);
  const [aiDifficulty, setAiDifficulty] = useState(formData.difficulty || 'Medium');
  const [aiMarks, setAiMarks] = useState(5);
  const [aiNegativeMarks, setAiNegativeMarks] = useState(
    formData.defaultNegativeMarks ?? (formData.proctoring?.negativeMarking ? 1.0 : 0)
  );
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const handleAiFormatChange = (fmt) => {
    setAiFormat(fmt);
    if (fmt === 'mcq' || fmt === 'multi-select') {
      setAiMarks(5);
      setAiNegativeMarks(formData.defaultNegativeMarks ?? (formData.proctoring?.negativeMarking ? 1.0 : 0));
    } else if (fmt === 'short') {
      setAiMarks(3);
      setAiNegativeMarks(0);
    } else if (fmt === 'long') {
      setAiMarks(10);
      setAiNegativeMarks(0);
    } else if (fmt === 'all') {
      setAiMarks(5);
    }
  };

  // Sync with formData.topic if not initialized
  React.useEffect(() => {
    if (formData.topic && !aiTopic) {
      setAiTopic(formData.topic);
    }
  }, [formData.topic]);

  const getQuickTopicsForSubject = (subject) => {
    const s = (subject || '').toLowerCase();
    if (s.includes('math')) {
      return ['Calculus', 'Linear Algebra', 'Trigonometry', 'Probability & Statistics', 'Differential Equations'];
    }
    if (s.includes('comp') || s.includes('cs') || s.includes('it') || s.includes('code') || s.includes('softw')) {
      return ['Data Structures & Algorithms', 'Machine Learning & AI', 'Operating Systems', 'Database Systems (SQL)', 'Computer Networks', 'Cyber Security'];
    }
    if (s.includes('phys')) {
      return ['Mechanics & Kinematics', 'Thermodynamics', 'Electromagnetism', 'Optics & Light', 'Quantum Physics'];
    }
    if (s.includes('chem')) {
      return ['Organic Chemistry', 'Thermodynamics', 'Chemical Kinetics', 'Atomic Structure', 'Electrochemistry'];
    }
    if (s.includes('bio')) {
      return ['Cell Biology', 'Genetics & DNA', 'Human Physiology', 'Ecology', 'Biochemistry'];
    }
    return ['Foundations & Fundamentals', 'Analytical Methods', 'Theoretical Concepts', 'Practical Applications'];
  };

  const quickTopics = getQuickTopicsForSubject(formData.subject);

  const questions = formData.questions || [];

  // Question Selection State: Set of selected question IDs
  const [selectedIds, setSelectedIds] = useState(() => {
    const set = new Set();
    (formData.questions || []).forEach((q, idx) => {
      const qId = q.id || `q_${idx}`;
      if (q.selected !== false) {
        set.add(qId);
      }
    });
    return set;
  });

  // Ensure new questions added get automatically selected
  React.useEffect(() => {
    if (questions.length > 0) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        let changed = false;
        questions.forEach((q, idx) => {
          const qId = q.id || `q_${idx}`;
          if (!prev.has(qId) && q.selected !== false) {
            next.add(qId);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [questions]);

  const toggleQuestionSelect = (qId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < questions.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
      showNotification('Deselected all questions.');
    } else {
      setSelectedIds(new Set(questions.map((q, idx) => q.id || `q_${idx}`)));
      showNotification(`Selected all ${questions.length} questions.`);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const remaining = questions.filter((q, idx) => !selectedIds.has(q.id || `q_${idx}`));
    onChange({
      ...formData,
      questions: remaining,
    });
    setSelectedIds(new Set());
    showNotification(`✓ Deleted ${count} selected question${count > 1 ? 's' : ''}.`);
  };

  const handleRemoveDeselected = () => {
    const deselectedCount = questions.length - selectedIds.size;
    if (deselectedCount <= 0) return;
    const activeOnly = questions.filter((q, idx) => selectedIds.has(q.id || `q_${idx}`));
    onChange({
      ...formData,
      questions: activeOnly,
    });
    showNotification(`✓ Purged ${deselectedCount} deselected question${deselectedCount > 1 ? 's' : ''}.`);
  };

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
      setNewQNegativeMarks(formData.defaultNegativeMarks ?? (formData.proctoring?.negativeMarking ? 1.0 : 0));
    } else if (type === 'multi-select') {
      setNewQMarks(5);
      setNewQDuration(3);
      setNewQNegativeMarks(formData.defaultNegativeMarks ?? (formData.proctoring?.negativeMarking ? 1.0 : 0));
    } else if (type === 'short') {
      setNewQMarks(3);
      setNewQDuration(3);
      setNewQNegativeMarks(0);
    } else if (type === 'long') {
      setNewQMarks(10);
      setNewQDuration(8);
      setNewQNegativeMarks(0);
    }
  };

  const handleGenerateAi = () => {
    const targetTopic = (aiTopic && aiTopic.trim()) || formData.topic || 'General Knowledge';
    setIsGeneratingAi(true);
    setTimeout(() => {
      const generated = generateAiQuestionsForTopic(
        targetTopic,
        Number(aiCount) || 3,
        aiDifficulty,
        Number(aiMarks) || 5,
        Number(aiNegativeMarks) || 0,
        aiFormat
      );
      const newIds = generated.map((g) => g.id);
      setSelectedIds((prev) => new Set([...prev, ...newIds]));
      onChange({
        ...formData,
        questions: [...questions, ...generated],
      });
      setIsGeneratingAi(false);
      const fmtLabel = aiFormat === 'mcq'
        ? 'MCQ'
        : aiFormat === 'multi-select'
        ? 'Multi-Select'
        : aiFormat === 'short'
        ? 'Short Written'
        : aiFormat === 'long'
        ? 'Long Written Essay'
        : 'mixed-format';
      showNotification(`✓ Successfully generated ${generated.length} ${fmtLabel} questions for "${targetTopic}".`);
    }, 650);
  };

  const handleAddManualQuestion = (e) => {
    e.preventDefault();
    if (!newQTitle.trim()) return;

    const isChoiceFormat = newQuestionType === 'mcq' || newQuestionType === 'multi-select';

    const newQuestion = {
      id: `q_custom_${Date.now()}`,
      type: newQuestionType,
      difficulty: newQDifficulty,
      duration: Math.max(1, Number(newQDuration) || 2),
      marks: Math.max(1, Number(newQMarks) || 5),
      negativeMarks: isChoiceFormat ? Math.max(0, Number(newQNegativeMarks) || 0) : 0,
      title: newQTitle.trim(),
      options: isChoiceFormat ? newQOptions.map((o, idx) => o.trim() || `Option ${idx + 1}`) : undefined,
      correctOption: newQuestionType === 'mcq' ? newQCorrect : undefined,
      correctOptions: newQuestionType === 'multi-select' ? (newQMultiCorrect.length > 0 ? newQMultiCorrect : [0]) : undefined,
      explanation: newQExplanation.trim(),
      rubric: (newQuestionType === 'short' || newQuestionType === 'long') ? newQExplanation.trim() : undefined,
      selected: true,
    };

    setSelectedIds((prev) => new Set([...prev, newQuestion.id]));

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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(qId);
      return next;
    });
    onChange({
      ...formData,
      questions: questions.filter((q, idx) => (q.id || `q_${idx}`) !== qId),
    });
  };

  const updateQuestionMarks = (qId, newMarks) => {
    const clamped = Math.max(1, Math.min(100, Number(newMarks) || 1));
    onChange({
      ...formData,
      questions: questions.map((q, idx) => ((q.id || `q_${idx}`) === qId ? { ...q, marks: clamped } : q)),
    });
  };

  const updateQuestionNegativeMarks = (qId, newNegative) => {
    const clamped = Math.max(0, Math.min(20, Number(Number(newNegative).toFixed(2)) || 0));
    onChange({
      ...formData,
      questions: questions.map((q, idx) => ((q.id || `q_${idx}`) === qId ? { ...q, negativeMarks: clamped } : q)),
    });
  };

  const handleBulkSetMarks = (val) => {
    const targetSet = selectedIds.size > 0 ? selectedIds : new Set(questions.map((q, idx) => q.id || `q_${idx}`));
    onChange({
      ...formData,
      questions: questions.map((q, idx) => (targetSet.has(q.id || `q_${idx}`) ? { ...q, marks: val } : q)),
    });
    showNotification(`✓ Updated marks to ${val} for ${targetSet.size} question(s).`);
  };

  const handleBulkSetNegative = (val) => {
    const targetSet = selectedIds.size > 0 ? selectedIds : new Set(questions.map((q, idx) => q.id || `q_${idx}`));
    onChange({
      ...formData,
      questions: questions.map((q, idx) => (targetSet.has(q.id || `q_${idx}`) ? { ...q, negativeMarks: val } : q)),
    });
    showNotification(`✓ Updated negative penalty to -${val} for ${targetSet.size} question(s).`);
  };

  const selectedQuestions = questions.filter((q, idx) => selectedIds.has(q.id || `q_${idx}`));
  const totalMarks = selectedQuestions.reduce((acc, curr) => acc + (Number(curr.marks) || 0), 0);
  const totalDuration = selectedQuestions.reduce((acc, curr) => acc + (Number(curr.duration) || 2), 0);
  const totalNegative = selectedQuestions.reduce((acc, curr) => acc + (Number(curr.negativeMarks) || 0), 0);

  const handleContinueNext = () => {
    const activeQuestions = questions.filter((q, idx) => selectedIds.has(q.id || `q_${idx}`));
    if (activeQuestions.length === 0) {
      showNotification('⚠️ Please select at least 1 question to continue.');
      return;
    }
    onChange({
      ...formData,
      questions: activeQuestions,
    });
    onNext();
  };

  const handleDirectPublishClick = () => {
    const activeQuestions = questions.filter((q, idx) => selectedIds.has(q.id || `q_${idx}`));
    if (activeQuestions.length === 0) {
      showNotification('⚠️ Please select at least 1 question to publish.');
      return;
    }
    onDirectPublish({
      ...formData,
      questions: activeQuestions,
    });
  };

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
                  <option value="multi-select">Multi-Select (Multiple Answers)</option>
                  <option value="short">Short Answer (Written 1-2 sentences)</option>
                  <option value="long">Long Answer / Essay (Written Detailed)</option>
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
                  value={(newQuestionType === 'mcq' || newQuestionType === 'multi-select') ? newQNegativeMarks : 0}
                  onChange={(e) => setNewQNegativeMarks(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={newQuestionType !== 'mcq' && newQuestionType !== 'multi-select'}
                  placeholder="0"
                  title={newQuestionType !== 'mcq' && newQuestionType !== 'multi-select' ? 'Negative marking only applies to choice formats' : 'Penalty deducted for incorrect response'}
                  style={newQuestionType !== 'mcq' && newQuestionType !== 'multi-select' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="teacher-form-group">
              <label className="teacher-label">
                {newQuestionType === 'mcq'
                  ? 'Problem Statement'
                  : newQuestionType === 'multi-select'
                  ? 'Multi-Select Problem Statement (e.g. Select all that apply)'
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
                    : newQuestionType === 'multi-select'
                    ? 'State the problem and ask candidates to select all applicable options...'
                    : newQuestionType === 'short'
                    ? 'e.g. Define gradient descent and state its main objective in neural network training.'
                    : 'e.g. Derive the backpropagation algorithm for a multi-layer perceptron with cross-entropy loss...'
                }
                value={newQTitle}
                onChange={(e) => setNewQTitle(e.target.value)}
                required
              />
            </div>

            {/* MCQ & Multi-Select Options with Radio / Checkbox Selectors */}
            {(newQuestionType === 'mcq' || newQuestionType === 'multi-select') && (
              <div className="teacher-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="teacher-label" style={{ marginBottom: 0 }}>
                    {newQuestionType === 'multi-select'
                      ? 'Multi-Select Options (Check all correct)'
                      : 'Multiple Choice Options (Select single correct radio)'}
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--tp-green-primary)', fontWeight: 600 }}>
                    {newQuestionType === 'multi-select' ? `${newQMultiCorrect.length} option(s) correct` : `Option ${String.fromCharCode(65 + newQCorrect)} correct`}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {newQOptions.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {newQuestionType === 'multi-select' ? (
                        <input
                          type="checkbox"
                          checked={newQMultiCorrect.includes(idx)}
                          onChange={() => {
                            setNewQMultiCorrect((prev) =>
                              prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                            );
                          }}
                          style={{ accentColor: 'var(--tp-green-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                          title="Mark as correct answer"
                        />
                      ) : (
                        <input
                          type="radio"
                          name="correct-opt"
                          checked={newQCorrect === idx}
                          onChange={() => setNewQCorrect(idx)}
                          style={{ accentColor: 'var(--tp-green-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                          title="Mark as correct answer"
                        />
                      )}
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
                {/* Synthesize calibrated questions with custom marks &amp; distractors. */}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Active Topic / Custom Topic Selector */}
            <div
              style={{
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: 'var(--tp-surface)',
                border: '1.5px solid var(--tp-green-border, var(--tp-border))',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label
                  htmlFor="ai-topic-input"
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--tp-text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    margin: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>🎯</span> Target Topic for AI Questions
                </label>
                {aiTopic && formData.topic && aiTopic.trim().toLowerCase() !== formData.topic.trim().toLowerCase() && (
                  <button
                    type="button"
                    onClick={() => setAiTopic(formData.topic)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--tp-green-primary)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                    title={`Reset back to test default: ${formData.topic}`}
                  >
                    ↺ Reset to "{formData.topic}"
                  </button>
                )}
              </div>

              {/* Editable Topic Input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="ai-topic-input"
                  type="text"
                  className="teacher-input"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder={formData.topic ? `e.g. ${formData.topic} or type any topic...` : 'Enter custom topic (e.g. Calculus, Optics, Trees)...'}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--tp-green-primary)',
                    padding: '0.45rem 2rem 0.45rem 0.65rem',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--tp-border)',
                    borderRadius: '6px',
                    width: '100%',
                  }}
                />
                {aiTopic ? (
                  <button
                    type="button"
                    onClick={() => setAiTopic('')}
                    title="Clear topic input"
                    style={{
                      position: 'absolute',
                      right: '6px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--tp-text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: '2px 6px',
                    }}
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              {/* Subject & Status Context */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.71875rem', color: 'var(--tp-text-muted)', marginTop: '4px' }}>
                <span>Subject: <strong style={{ color: 'var(--tp-text-primary)' }}>{formData.subject || 'General'}</strong></span>
                {aiTopic && formData.topic && aiTopic.trim().toLowerCase() !== formData.topic.trim().toLowerCase() ? (
                  <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.6875rem' }}>
                    ✨ Custom Topic Active
                  </span>
                ) : (
                  <span style={{ fontSize: '0.6875rem' }}>
                    Paper Default: <strong>{formData.topic || 'None'}</strong>
                  </span>
                )}
              </div>

              {/* Quick Topic Suggestions */}
              {quickTopics.length > 0 && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--tp-border-light, #E2E8F0)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--tp-text-muted)', marginBottom: '4px', fontWeight: 500 }}>
                    Quick suggestions for {formData.subject || 'this paper'}:
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {quickTopics.map((t) => {
                      const isSelected = (aiTopic || '').trim().toLowerCase() === t.toLowerCase();
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAiTopic(t)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.6875rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            border: isSelected ? '1px solid var(--tp-green-primary)' : '1px solid var(--tp-border)',
                            backgroundColor: isSelected ? 'var(--tp-green-light)' : '#FFFFFF',
                            color: isSelected ? 'var(--tp-green-text)' : 'var(--tp-text-secondary)',
                            transition: 'all 120ms ease',
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Question Format & Target Difficulty Selectors */}
            <div className="teacher-grid-2">
              <div>
                <label className="teacher-label" htmlFor="ai-format-select">
                  Question Format (Formation)
                </label>
                <select
                  id="ai-format-select"
                  className="teacher-select"
                  value={aiFormat}
                  onChange={(e) => handleAiFormatChange(e.target.value)}
                >
                  <option value="all">⚡ All Formats (Balanced Mix)</option>
                  <option value="mcq">🔘 Multiple Choice (Single MCQ)</option>
                  <option value="multi-select">☑️ Multi-Select (Multiple Answers)</option>
                  <option value="short">✍️ Short Answer (Written 1-2 sent.)</option>
                  <option value="long">📝 Long Answer / Essay (Detailed)</option>
                </select>
              </div>

              <div>
                <label className="teacher-label" htmlFor="ai-difficulty-select">
                  Target Difficulty
                </label>
                <select
                  id="ai-difficulty-select"
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

            {/* Format Quick Selection Chips */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="teacher-label" style={{ marginBottom: 0 }}>
                  Format Quick Switch
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--tp-green-primary)', fontWeight: 600 }}>
                  {aiFormat === 'all'
                    ? 'Mixed: MCQ + Multi-Select + Written'
                    : aiFormat === 'mcq'
                    ? 'Single Choice MCQ'
                    : aiFormat === 'multi-select'
                    ? 'Multiple Correct Choices'
                    : aiFormat === 'short'
                    ? 'Written Short Answer'
                    : 'Written Long Essay'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Formats' },
                  { id: 'mcq', label: 'MCQ (Single)' },
                  { id: 'multi-select', label: 'Multi-Select' },
                  { id: 'short', label: 'Short Written' },
                  { id: 'long', label: 'Long Essay' },
                ].map((fmt) => {
                  const isActive = aiFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleAiFormatChange(fmt.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        border: isActive ? '1px solid var(--tp-green-primary)' : '1px solid var(--tp-border)',
                        backgroundColor: isActive ? 'var(--tp-green-light)' : 'var(--tp-surface)',
                        color: isActive ? 'var(--tp-green-text)' : 'var(--tp-text-secondary)',
                        transition: 'all 120ms ease',
                      }}
                    >
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Count, Marks & Penalty Clean Input Boxes */}
            <div className="teacher-grid-3">
              <div>
                <label className="teacher-label">Number of Qs</label>
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
                  Penalty (-)
                </label>
                <input
                  id="ai-q-negative"
                  type="number"
                  min="0"
                  max="10"
                  step="0.25"
                  className="teacher-input"
                  value={aiFormat === 'short' || aiFormat === 'long' ? 0 : aiNegativeMarks}
                  onChange={(e) => setAiNegativeMarks(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={aiFormat === 'short' || aiFormat === 'long'}
                  title={aiFormat === 'short' || aiFormat === 'long' ? 'Negative penalty not applicable to written questions' : 'Penalty deducted for incorrect response'}
                  style={aiFormat === 'short' || aiFormat === 'long' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  placeholder="0"
                />
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
                  <span>Synthesizing {aiCount} {aiFormat === 'mcq' ? 'MCQs' : aiFormat === 'multi-select' ? 'Multi-Select Qs' : aiFormat === 'short' ? 'Short Written Qs' : aiFormat === 'long' ? 'Written Essays' : 'Questions'} with Gemini...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span>
                    ⚡ Generate {aiCount} {aiFormat === 'mcq' ? 'MCQs' : aiFormat === 'multi-select' ? 'Multi-Select Qs' : aiFormat === 'short' ? 'Written Short Qs' : aiFormat === 'long' ? 'Written Essays' : 'Questions'}
                    {aiTopic.trim() ? ` for "${aiTopic.trim().length > 14 ? aiTopic.trim().slice(0, 12) + '...' : aiTopic.trim()}"` : ''} (+{aiMarks} pts each)
                  </span>
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
            gap: '12px',
            marginBottom: '0.85rem',
            padding: '0.85rem 1.15rem',
            borderRadius: '8px',
            backgroundColor: 'var(--tp-surface)',
            border: '1px solid var(--tp-border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Master Select All Checkbox */}
            {questions.length > 0 && (
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: isAllSelected ? 'var(--tp-green-light)' : 'var(--tp-surface-hover, #F1F5F9)',
                  border: isAllSelected ? '1px solid var(--tp-green-primary)' : '1px solid var(--tp-border)',
                  transition: 'all 120ms ease',
                }}
                title={isAllSelected ? "Click to deselect all questions" : "Click to select all questions"}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                  onChange={handleToggleSelectAll}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: 'var(--tp-green-primary)',
                    margin: 0,
                  }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isAllSelected ? 'var(--tp-green-primary)' : 'var(--tp-text-primary)' }}>
                  {isAllSelected ? 'All Selected' : isPartiallySelected ? `${selectedIds.size}/${questions.length} Selected` : 'Select All'}
                </span>
              </label>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--tp-text-primary)' }}>
                  Question Paper ({questions.length} Questions)
                </h3>
                {questions.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: selectedIds.size === questions.length ? 'var(--tp-green-light)' : 'rgba(217, 119, 6, 0.1)',
                      color: selectedIds.size === questions.length ? 'var(--tp-green-text)' : '#D97706',
                    }}
                  >
                    {selectedIds.size} Active in Paper
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '14px', marginTop: '3px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--tp-text-muted)' }}>
                  Active Marks: <strong style={{ color: 'var(--tp-green-primary)', fontSize: '0.92rem' }}>{totalMarks} pts</strong>
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--tp-text-muted)' }}>
                  Active Duration: <strong style={{ color: 'var(--tp-text-primary)' }}>⏱ {totalDuration} mins</strong>
                </span>
                {totalNegative > 0 && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--tp-text-muted)' }}>
                    Active Penalty: <strong style={{ color: '#DC2626' }}>-{totalNegative.toFixed(2)} pts</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Bulk Actions */}
          {questions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Delete Selected Button */}
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#DC2626',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                  title="Delete all currently selected questions from list"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              )}

              {/* Purge Deselected Button */}
              {questions.length - selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveDeselected}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    color: '#475569',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                  title="Purge all deselected questions from the paper"
                >
                  <span>Remove Deselected ({questions.length - selectedIds.size})</span>
                </button>
              )}

              {/* Bulk Marks Stepper Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--tp-text-muted)', fontWeight: 600 }}>
                  {selectedIds.size > 0 && selectedIds.size < questions.length ? `Set Marks (${selectedIds.size}):` : 'Set all marks:'}
                </span>
                {[1, 2, 4, 5, 10].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="teacher-stepper-chip"
                    onClick={() => handleBulkSetMarks(m)}
                    title={`Set marks to ${m}`}
                  >
                    +{m}
                  </button>
                ))}
              </div>

              {/* Bulk Negative Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--tp-text-muted)', fontWeight: 600 }}>Penalty:</span>
                {[0, 0.25, 0.5, 1.0].map((nm) => (
                  <button
                    key={nm}
                    type="button"
                    className="teacher-stepper-chip negative"
                    onClick={() => handleBulkSetNegative(nm)}
                    title={`Set negative penalty to -${nm}`}
                  >
                    {nm === 0 ? '0' : `-${nm}`}
                  </button>
                ))}
              </div>
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
              const qId = q.id || `q_${idx}`;
              const isSelected = selectedIds.has(qId);
              const currentMarks = Number(q.marks) || 5;
              const currentNegative = Number(q.negativeMarks ?? formData.defaultNegativeMarks ?? (formData.proctoring?.negativeMarking ? 1.0 : 0));
              const formatLabel = q.type === 'mcq'
                ? 'MCQ (SINGLE)'
                : q.type === 'multi-select'
                ? 'MULTI-SELECT'
                : q.type === 'short'
                ? 'SHORT ANSWER (WRITTEN)'
                : 'LONG ESSAY (WRITTEN)';
              const formatColor = q.type === 'mcq'
                ? 'var(--tp-green-primary)'
                : q.type === 'multi-select'
                ? '#0D9488'
                : q.type === 'short'
                ? '#2563EB'
                : '#7C3AED';
              const formatBg = q.type === 'mcq'
                ? 'var(--tp-green-light)'
                : q.type === 'multi-select'
                ? 'rgba(13, 148, 136, 0.12)'
                : q.type === 'short'
                ? 'rgba(37, 99, 235, 0.1)'
                : 'rgba(124, 58, 237, 0.1)';
              const diffColor = q.difficulty === 'Easy' ? '#16A34A' : q.difficulty === 'Hard' ? '#DC2626' : '#D97706';
              const diffBg = q.difficulty === 'Easy' ? 'rgba(22, 163, 74, 0.1)' : q.difficulty === 'Hard' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)';

              return (
                <div
                  key={qId}
                  className="teacher-card"
                  style={{
                    padding: '1.15rem 1.35rem',
                    borderLeft: isSelected ? '4px solid var(--tp-green-primary)' : '4px solid #CBD5E1',
                    backgroundColor: isSelected ? 'var(--tp-surface)' : 'rgba(241, 245, 249, 0.45)',
                    opacity: isSelected ? 1 : 0.68,
                    transition: 'all 140ms ease',
                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
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
                    {/* Left Badges with Selection Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Selection Checkbox */}
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          userSelect: 'none',
                          padding: '2px 8px 2px 4px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? 'var(--tp-green-light)' : 'rgba(148, 163, 184, 0.15)',
                          border: isSelected ? '1px solid var(--tp-green-border)' : '1px solid #CBD5E1',
                          transition: 'all 120ms ease',
                        }}
                        title={isSelected ? "Question is selected (Included in test) - click to deselect" : "Question is deselected (Excluded from test) - click to select"}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleQuestionSelect(qId)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: 'var(--tp-green-primary)',
                            margin: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: isSelected ? 'var(--tp-green-text)' : '#64748B',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {isSelected ? '✓ SELECTED' : '✕ DESELECTED'}
                        </span>
                      </label>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--tp-green-primary)' : '#64748B',
                          backgroundColor: isSelected ? 'var(--tp-green-light)' : 'rgba(148, 163, 184, 0.1)',
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
                          color: formatColor,
                          backgroundColor: formatBg,
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

                      {q.topic && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: 'var(--tp-green-primary)',
                            backgroundColor: 'var(--tp-green-light)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            maxWidth: '180px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={`Topic: ${q.topic}`}
                        >
                          🎯 {q.topic}
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

                  {/* Options Display for MCQ & Multi-Select Choice Questions */}
                  {q.options && (q.type === 'mcq' || q.type === 'multi-select' || !q.type) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '0.65rem' }}>
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = Array.isArray(q.correctOptions)
                          ? q.correctOptions.includes(oIdx)
                          : q.correctOption === oIdx;
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
                                borderRadius: q.type === 'multi-select' ? '4px' : '50%',
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
                            {isCorrect && (
                              <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--tp-green-primary)', fontWeight: 700 }}>
                                ✓ {q.type === 'multi-select' ? 'Correct' : ''}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Model Answer / Rubric Display for Short or Long Answer (Written) */}
                  {(q.type === 'short' || q.type === 'long' || (!q.options && (q.rubric || q.explanation))) && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--tp-text-secondary)',
                        backgroundColor: 'var(--tp-surface-hover)',
                        padding: '0.55rem 0.8rem',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${q.type === 'short' ? '#2563EB' : '#7C3AED'}`,
                        marginBottom: '0.5rem',
                      }}
                    >
                      <strong style={{ color: q.type === 'short' ? '#2563EB' : '#7C3AED' }}>
                        ✍️ {q.type === 'short' ? 'Expected Key Points (Short Written):' : 'Grading Rubric & Model Answer (Written):'}
                      </strong>{' '}
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
              onClick={handleDirectPublishClick}
              disabled={selectedQuestions.length === 0}
              title={selectedQuestions.length === 0 ? "Select at least 1 question to publish" : `Publish test with ${selectedQuestions.length} selected questions`}
            >
              <span>Publish Test Now ({selectedQuestions.length} Qs)</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>↗</span>
            </button>
          )}

          <button
            type="button"
            className="teacher-btn-primary"
            style={{ width: 'auto' }}
            onClick={handleContinueNext}
            disabled={selectedQuestions.length === 0}
            title={selectedQuestions.length === 0 ? "Select at least 1 question to continue" : `Continue with ${selectedQuestions.length} selected questions`}
          >
            Continue to Assign Students ({selectedQuestions.length} Selected &bull; {totalMarks} pts) &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
