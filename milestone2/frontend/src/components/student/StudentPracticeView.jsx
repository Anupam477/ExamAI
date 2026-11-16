import React, { useState, useEffect } from 'react';
import PracticeTestRunnerModal from './PracticeTestRunnerModal';
import PracticeResultModal from './PracticeResultModal';
import {
  getStudentPracticeHistory,
  saveStudentPracticeHistory,
  deleteStudentPracticeHistoryItem,
  saveStudentSubmission,
} from '../../utils/mockApi';

// Quick topic suggestion pills matching screenshot
const QUICK_SUGGESTIONS = [
  { label: 'Binary search trees', subject: 'Computer Science', topic: 'Binary search trees' },
  { label: "Newton's laws of motion", subject: 'Physics', topic: "Newton's laws of motion" },
  { label: 'Quadratic equations', subject: 'Mathematics', topic: 'Quadratic equations' },
  { label: 'Photosynthesis', subject: 'Biology', topic: 'Photosynthesis' },
  { label: 'Periodic table trends', subject: 'Chemistry', topic: 'Periodic table trends' },
];

export default function StudentPracticeView({ candidateUser, onShowToast, onNavigateTab }) {
  // Practice configuration form state
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCounts, setQuestionCounts] = useState({
    mcq: 5,
    multiSelect: 2,
    shortAnswer: 1,
    longAnswer: 0,
  });
  const [isTimed, setIsTimed] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [selectedChip, setSelectedChip] = useState(null);

  // Practice history strictly scoped to the logged-in candidate user
  const [historyList, setHistoryList] = useState(() => {
    return getStudentPracticeHistory(candidateUser);
  });

  // Re-sync whenever the candidate user changes
  useEffect(() => {
    setHistoryList(getStudentPracticeHistory(candidateUser));
  }, [candidateUser?.id, candidateUser?.email]);

  // Keep history synced across tabs or background updates
  useEffect(() => {
    const handleUpdate = () => {
      setHistoryList(getStudentPracticeHistory(candidateUser));
    };
    window.addEventListener('examai_practice_history_updated', handleUpdate);
    return () => window.removeEventListener('examai_practice_history_updated', handleUpdate);
  }, [candidateUser]);

  const saveHistory = (items) => {
    setHistoryList(items);
    saveStudentPracticeHistory(candidateUser, items);
  };

  // Modals state
  const [activeRunnerConfig, setActiveRunnerConfig] = useState(null);
  const [viewingResult, setViewingResult] = useState(null);

  // Stepper increment / decrement
  const handleCountChange = (field, delta) => {
    setQuestionCounts((prev) => {
      const newVal = Math.max(0, Math.min(25, (prev[field] || 0) + delta));
      return { ...prev, [field]: newVal };
    });
  };

  const totalQuestions =
    (questionCounts.mcq || 0) +
    (questionCounts.multiSelect || 0) +
    (questionCounts.shortAnswer || 0) +
    (questionCounts.longAnswer || 0);

  // Handle clicking a chip
  const handleSelectChip = (chip) => {
    setSelectedChip(chip.label);
    setSubject(chip.subject);
    setTopic(chip.topic);
  };

  // Launch fresh practice test
  const handleStartPractice = (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      if (onShowToast) onShowToast('Please fill out the Subject field.');
      return;
    }
    if (!topic.trim()) {
      if (onShowToast) onShowToast('Please fill out the Topic field.');
      return;
    }
    if (totalQuestions === 0) {
      if (onShowToast) onShowToast('Please select at least 1 question.');
      return;
    }

    setActiveRunnerConfig({
      subject: subject.trim(),
      topic: topic.trim(),
      difficulty,
      questionCounts,
      isTimed,
      durationMinutes,
    });
  };

  // Retake an existing history topic with EXACT same questions
  const handleRetakeHistory = (item) => {
    // 1. Check if questions list is directly saved on the history item
    let questionsToReuse = item.questions;

    // 2. Fallback: reconstruct from review items if questions array wasn't directly attached
    if ((!questionsToReuse || questionsToReuse.length === 0) && item.review && Array.isArray(item.review) && item.review.length > 0) {
      questionsToReuse = item.review.map((r, idx) => ({
        id: `retake_${item.id || 'test'}_${idx + 1}`,
        num: idx + 1,
        type: r.type || 'mcq',
        marks: r.type === 'mcq' ? 1 : r.type === 'multi-select' ? 2 : 5,
        question: r.question,
        options: r.options || [
          'Governing theoretical invariant and conservation law',
          'Empirical heuristic with divergent boundary conditions',
          'Zero-order approximation neglecting force vectors',
          'Non-convergent stochastic model',
        ],
        correctOption: typeof r.correctAnswer === 'number' ? r.correctAnswer : 0,
        correctOptions: Array.isArray(r.correctAnswer) ? r.correctAnswer : [0],
        modelAnswer: typeof r.correctAnswer === 'string' ? r.correctAnswer : '',
        explanation: r.explanation || '',
      }));
    }

    setActiveRunnerConfig({
      subject: item.subject || 'General',
      topic: item.topic || item.title?.replace(' practice', '') || 'Review',
      difficulty: item.difficulty || 'Medium',
      questionCounts: {
        mcq: Math.max(2, Math.round((item.questionsCount || 8) * 0.6)),
        multiSelect: Math.max(1, Math.round((item.questionsCount || 8) * 0.2)),
        shortAnswer: 1,
        longAnswer: 0,
      },
      isTimed: true,
      durationMinutes: 15,
      questions: questionsToReuse || null, // Guarantees exact same questions on Retake / Retest
    });
  };

  // Delete an item from practice history
  const handleDeleteHistory = (id) => {
    const updated = deleteStudentPracticeHistoryItem(candidateUser, id);
    setHistoryList(updated);
    if (onShowToast) onShowToast('Practice test removed from history.');
  };

  // Submission handler from test runner
  const handlePracticeSubmitted = (resultPayload) => {
    const newEntry = {
      ...resultPayload,
      studentId: candidateUser?.id || candidateUser?.email || '',
      studentEmail: candidateUser?.email || '',
      studentName: candidateUser?.fullName || candidateUser?.name || '',
      bestOfCount: 1,
      type: 'practice',
    };
    const updated = [newEntry, ...historyList];
    saveHistory(updated);

    try {
      saveStudentSubmission({
        ...newEntry,
        id: newEntry.id || `practice_${Date.now()}`,
        testId: newEntry.id || `practice_${Date.now()}`,
        type: 'practice',
        title: newEntry.title || `${newEntry.topic || 'Practice'} Test`,
        testTitle: newEntry.title || `${newEntry.topic || 'Practice'} Test`,
        subject: newEntry.subject || 'General Studies',
        topic: newEntry.topic || 'Practice',
        score: newEntry.score !== undefined ? newEntry.score : (newEntry.correctCount ? newEntry.correctCount * 5 : 0),
        totalMarks: newEntry.totalMarks || (newEntry.totalQuestions ? newEntry.totalQuestions * 5 : 25),
        percentage: newEntry.percentage !== undefined ? Number(newEntry.percentage) : 0,
        correctCount: newEntry.correctCount || 0,
        wrongCount: Math.max(0, (newEntry.totalQuestions || 5) - (newEntry.correctCount || 0)),
        totalQuestions: newEntry.totalQuestions || 5,
        submittedAt: newEntry.submittedAt || new Date().toISOString(),
        review: newEntry.review || [],
        proctoring: newEntry.proctoring || {},
      });
    } catch (e) {
      console.warn('Non-blocking practice submission register:', e);
    }

    window.dispatchEvent(new Event('examai_student_test_completed'));
    window.dispatchEvent(new Event('examai_submissions_updated'));

    setActiveRunnerConfig(null);
    setViewingResult(newEntry);
    if (onShowToast) onShowToast('Practice test graded instantly!');
  };

  return (
    <div>
      {/* Top Banner & Overview matching screenshot */}
      <div className="practice-header-section">
        <div className="practice-pill-tag">PRACTICE</div>
        <h1 className="practice-page-title">Practise anything, anytime</h1>
        <p className="practice-page-desc">
          Generate a fresh AI test on any topic. Practice tests are graded instantly and never shared with teachers.
        </p>
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div className="practice-grid-container">
        {/* ======================================================== */}
        {/* LEFT COLUMN: NEW PRACTICE TEST STUDIO                    */}
        {/* ======================================================== */}
        <div className="sp-card">
          {/* Card Header */}
          <div className="sp-card-header">
            <div className="sp-card-title-wrap">
              <div className="sp-sparkle-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
                </svg>
              </div>
              <div>
                <h2 className="sp-card-title">New practice test</h2>
                <div className="sp-card-sub">Powered by ChatGPT with Gemini as backup.</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleStartPractice}>
            {/* Subject and Topic row */}
            <div className="sp-form-group">
              <div className="sp-input-row">
                <div>
                  <label className="sp-label" htmlFor="practice-subject">
                    Subject
                  </label>
                  <input
                    id="practice-subject"
                    type="text"
                    className="sp-input"
                    placeholder="e.g. Physics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="sp-label" htmlFor="practice-topic">
                    Topic
                  </label>
                  <input
                    id="practice-topic"
                    type="text"
                    className="sp-input"
                    placeholder="e.g. Kinematics"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Quick Topic Suggestions Pills */}
              <div className="sp-chips-container">
                {QUICK_SUGGESTIONS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`sp-chip ${selectedChip === item.label ? 'active' : ''}`}
                    onClick={() => handleSelectChip(item)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty selector pills */}
            <div className="sp-form-group">
              <label className="sp-label">Difficulty</label>
              <div className="sp-diff-pills">
                {['Easy', 'Medium', 'Hard'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`sp-diff-pill ${difficulty === lvl ? 'active' : ''}`}
                    onClick={() => setDifficulty(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Breakdown 2x2 Grid */}
            <div className="sp-form-group">
              <label className="sp-label">Questions ({totalQuestions})</label>
              <div className="sp-steppers-grid">
                {/* Multiple choice */}
                <div className="sp-stepper-item">
                  <span className="sp-stepper-label">Multiple choice</span>
                  <div className="sp-counter-box">
                    <button
                      type="button"
                      className="sp-count-btn"
                      onClick={() => handleCountChange('mcq', -1)}
                      disabled={questionCounts.mcq <= 0}
                    >
                      &minus;
                    </button>
                    <span className="sp-count-num">{questionCounts.mcq}</span>
                    <button
                      type="button"
                      className="sp-count-btn"
                      onClick={() => handleCountChange('mcq', 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Multi-select */}
                <div className="sp-stepper-item">
                  <span className="sp-stepper-label">Multi-select</span>
                  <div className="sp-counter-box">
                    <button
                      type="button"
                      className="sp-count-btn"
                      onClick={() => handleCountChange('multiSelect', -1)}
                      disabled={questionCounts.multiSelect <= 0}
                    >
                      &minus;
                    </button>
                    <span className="sp-count-num">{questionCounts.multiSelect}</span>
                    <button
                      type="button"
                      className="sp-count-btn"
                      onClick={() => handleCountChange('multiSelect', 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Short answer */}
                <div className="sp-stepper-item">
                  <span className="sp-stepper-label">Short answer</span>
                  <div className="sp-counter-box">
                    <button
                      type="button"
                      className="sp-count-btn"
                      onClick={() => handleCountChange('shortAnswer', -1)}
                      disabled={questionCounts.shortAnswer <= 0}
                    >
                      &minus;
                    </button>
                    <span className="sp-count-num">{questionCounts.shortAnswer}</span>
                    <button
                      type="button"
                      className="sp-count-btn"
                      onClick={() => handleCountChange('shortAnswer', 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Long answer */}
                <div className="sp-stepper-item">
                  <span className="sp-stepper-label">Long answer</span>
                  <div className="sp-counter-box">
                    <button
                      type="button"
                      className="sp-count-btn"
                      onClick={() => handleCountChange('longAnswer', -1)}
                      disabled={questionCounts.longAnswer <= 0}
                    >
                      &minus;
                    </button>
                    <span className="sp-count-num">{questionCounts.longAnswer}</span>
                    <button
                      type="button"
                      className="sp-count-btn"
                      onClick={() => handleCountChange('longAnswer', 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Timed practice switch */}
            <div className="sp-toggle-row">
              <label className="sp-toggle-switch">
                <input
                  type="checkbox"
                  checked={isTimed}
                  onChange={(e) => setIsTimed(e.target.checked)}
                />
                <span className="sp-toggle-slider" />
              </label>

              <div className="sp-toggle-label-wrap">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sp-text-muted)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Timed practice</span>
              </div>

              {isTimed && (
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  style={{
                    marginLeft: 'auto',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                    border: '1px solid var(--sp-border)',
                    backgroundColor: 'var(--sp-surface)',
                    color: 'var(--sp-text-primary)',
                  }}
                >
                  <option value={10}>10 mins</option>
                  <option value={15}>15 mins</option>
                  <option value={20}>20 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                </select>
              )}
            </div>

            {/* Generate & Start Button */}
            <button
              type="submit"
              className="sp-generate-btn"
              style={{ marginTop: '0.5rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Generate &amp; Start AI Practice Test</span>
            </button>
          </form>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: YOUR PRACTICE HISTORY                      */}
        {/* ======================================================== */}
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, color: 'var(--sp-text-primary)', margin: 0 }}>
              Your practice history
            </h3>
          </div>

          {historyList.length === 0 ? (
            <div className="sp-card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--sp-text-muted)' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>📝</div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--sp-text-primary)' }}>
                No practice tests yet
              </div>
              <div style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                Fill out the form on the left to start your first session.
              </div>
            </div>
          ) : (
            <div className="sp-history-list">
              {historyList.map((item) => (
                <div key={item.id} className="sp-history-card">
                  {/* Top Row: Sparkle + Title and Score on right */}
                  <div className="sp-history-top">
                    <div className="sp-history-title-wrap">
                      <div className="sp-history-sparkle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
                        </svg>
                      </div>
                      <h4 className="sp-history-title">{item.title}</h4>
                    </div>

                    <div className="sp-history-score-col">
                      <div className="sp-score-big">{item.score}%</div>
                      <div className="sp-score-meta">
                        {item.bestOfCount ? `best of ${item.bestOfCount}` : 'latest'}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row: Badge + Count + Time */}
                  <div className="sp-history-meta">
                    <span className={`sp-badge sp-badge-${(item.difficulty || 'medium').toLowerCase()}`}>
                      {item.difficulty}
                    </span>
                    <span>
                      {item.questionsCount} questions &bull; {item.timestampDisplay}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="sp-history-actions">
                    <button
                      type="button"
                      className="sp-btn-subtle"
                      onClick={() => handleRetakeHistory(item)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      <span>Retake</span>
                    </button>

                    <button
                      type="button"
                      className="sp-btn-subtle"
                      onClick={() => {
                        if (onNavigateTab) {
                          onNavigateTab('results');
                        } else {
                          setViewingResult(item);
                        }
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                      <span>Latest result</span>
                    </button>

                    <button
                      type="button"
                      className="sp-btn-icon-danger"
                      title="Delete this practice history"
                      onClick={() => handleDeleteHistory(item.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Practice Test Runner Modal */}
      {activeRunnerConfig && (
        <PracticeTestRunnerModal
          practiceConfig={activeRunnerConfig}
          candidateUser={candidateUser}
          onClose={() => setActiveRunnerConfig(null)}
          onSubmitResult={handlePracticeSubmitted}
        />
      )}

      {/* Latest Result Scorecard Modal */}
      {viewingResult && (
        <PracticeResultModal
          result={viewingResult}
          onClose={() => setViewingResult(null)}
          onRetake={(res) => {
            setViewingResult(null);
            handleRetakeHistory(res);
          }}
        />
      )}
    </div>
  );
}
