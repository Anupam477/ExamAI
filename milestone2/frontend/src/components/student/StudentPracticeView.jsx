import React, { useState, useEffect } from 'react';
import PracticeTestRunnerModal from './PracticeTestRunnerModal';
import PracticeResultModal from './PracticeResultModal';

// Initial realistic practice history matching user screenshot
const INITIAL_PRACTICE_HISTORY = [
  {
    id: 'hist_thermo_01',
    title: 'laws of thermodynamics practice',
    subject: 'Physics',
    topic: 'Laws of Thermodynamics',
    difficulty: 'Hard',
    questionsCount: 4,
    score: 50,
    bestOfCount: 2,
    timestampDisplay: '7 minutes ago',
    correctCount: 2,
    totalQuestions: 4,
    timeTakenDisplay: '14 mins',
    questions: [
      {
        id: 'thermo_1',
        num: 1,
        type: 'mcq',
        marks: 1,
        question: 'What thermodynamic quantity is described as the microscopic measure of molecular disorder and irreversible dissipation in a closed system?',
        options: [
          'Entropy (S)',
          'Enthalpy (H)',
          'Internal Energy (U)',
          'Gibbs Free Energy (G)',
        ],
        correctOption: 0,
        explanation: 'Entropy (S) quantifies microscopic multiplicity and the irreversible dissipation of usable work into thermal energy.',
      },
      {
        id: 'thermo_2',
        num: 2,
        type: 'mcq',
        marks: 1,
        question: 'Which thermodynamic process occurs strictly under constant pressure in a cylinder-piston system?',
        options: [
          'Isobaric process (dP = 0)',
          'Isochoric process (dV = 0)',
          'Isothermal process (dT = 0)',
          'Adiabatic process (dQ = 0)',
        ],
        correctOption: 0,
        explanation: 'Isobaric signifies constant pressure throughout the state change.',
      },
      {
        id: 'thermo_3',
        num: 3,
        type: 'multi-select',
        marks: 2,
        question: 'Select all thermodynamic properties that are state functions (independent of the path taken between equilibrium states):',
        options: [
          'Internal Energy (U)',
          'Heat transferred (Q)',
          'Entropy (S)',
          'Work done by the system (W)',
        ],
        correctOptions: [0, 2],
        explanation: 'Internal Energy and Entropy are state functions depending only on initial and final states. Heat (Q) and Work (W) are path-dependent quantities.',
      },
      {
        id: 'thermo_4',
        num: 4,
        type: 'long-answer',
        marks: 5,
        question: 'State the Second Law of Thermodynamics (Kelvin-Planck and Clausius statements) and derive the theoretical maximum efficiency of a Carnot heat engine operating between temperatures Th and Tc. You may write your derivation on paper and capture/upload a photo, or type below.',
        modelAnswer: 'The Kelvin-Planck statement states no heat engine can produce continuous work by absorbing heat from a single reservoir with 100% efficiency. Clausius statement states heat cannot spontaneously flow from cold to hot without external work. Carnot efficiency is derived as η = 1 - (Tc / Th).',
        explanation: 'Full credit requires stating both classical formulations and deriving the Carnot efficiency formula η = 1 - (Tc / Th) with temperature in Kelvin.',
      },
    ],
    review: [
      {
        question: 'What thermodynamic quantity is described as the microscopic measure of molecular disorder and irreversible dissipation in a closed system?',
        type: 'mcq',
        options: ['Entropy (S)', 'Enthalpy (H)', 'Internal Energy (U)', 'Gibbs Free Energy (G)'],
        studentAnswer: 0,
        correctAnswer: 0,
        isCorrect: true,
        explanation: 'Entropy (S) quantifies the microscopic multiplicity and irreversible dissipation of energy.',
      },
      {
        question: 'Which thermodynamic process occurs strictly under constant pressure in a cylinder-piston system?',
        type: 'mcq',
        options: ['Isobaric process (dP = 0)', 'Isochoric process (dV = 0)', 'Isothermal process (dT = 0)', 'Adiabatic process (dQ = 0)'],
        studentAnswer: 1,
        correctAnswer: 0,
        isCorrect: false,
        explanation: 'Isobaric signifies constant pressure (dP = 0).',
      },
    ],
  },
  {
    id: 'hist_oops_02',
    title: 'oops practice',
    subject: 'Computer Science',
    topic: 'Object-Oriented Programming (OOPS)',
    difficulty: 'Medium',
    questionsCount: 3,
    score: 66,
    bestOfCount: 1,
    timestampDisplay: '38 minutes ago',
    correctCount: 2,
    totalQuestions: 3,
    timeTakenDisplay: '8 mins',
    questions: [
      {
        id: 'oops_1',
        num: 1,
        type: 'mcq',
        marks: 1,
        question: 'Which OOP pillar promotes information hiding by bundling data and methods into a single class unit and restricting direct outside access?',
        options: [
          'Encapsulation',
          'Polymorphism',
          'Inheritance',
          'Composition',
        ],
        correctOption: 0,
        explanation: 'Encapsulation restricts direct access to internal object components.',
      },
      {
        id: 'oops_2',
        num: 2,
        type: 'multi-select',
        marks: 2,
        question: 'Select all mechanisms that support runtime polymorphism in object-oriented languages:',
        options: [
          'Virtual method table (vtable) dispatch',
          'Method overriding in derived subclasses',
          'Compile-time operator overloading',
          'Interface / abstract base class dynamic binding',
        ],
        correctOptions: [0, 1, 3],
        explanation: 'Vtables, method overriding, and dynamic interface binding occur at runtime. Operator overloading is resolved at compile time.',
      },
      {
        id: 'oops_3',
        num: 3,
        type: 'short-answer',
        marks: 5,
        question: 'Explain the difference between Composition and Inheritance with a real-world software architecture diagram or code example. You may write on paper and capture/upload a photo, or type below.',
        modelAnswer: 'Inheritance represents an "is-a" relationship, creating tight coupling between subclass and superclass. Composition represents a "has-a" relationship, promoting loose coupling and runtime flexibility by delegating responsibilities to contained components.',
        explanation: 'Favours "composition over inheritance" design principle for modularity and testability.',
      },
    ],
    review: [
      {
        question: 'Which OOP pillar promotes information hiding by bundling data and methods into a single class unit and restricting direct outside access?',
        type: 'mcq',
        options: ['Encapsulation', 'Polymorphism', 'Inheritance', 'Composition'],
        studentAnswer: 0,
        correctAnswer: 0,
        isCorrect: true,
        explanation: 'Encapsulation restricts direct access to internal object components.',
      },
    ],
  },
];

// Quick topic suggestion pills matching screenshot
const QUICK_SUGGESTIONS = [
  { label: 'Binary search trees', subject: 'Computer Science', topic: 'Binary search trees' },
  { label: "Newton's laws of motion", subject: 'Physics', topic: "Newton's laws of motion" },
  { label: 'Quadratic equations', subject: 'Mathematics', topic: 'Quadratic equations' },
  { label: 'Photosynthesis', subject: 'Biology', topic: 'Photosynthesis' },
  { label: 'Periodic table trends', subject: 'Chemistry', topic: 'Periodic table trends' },
];

export default function StudentPracticeView({ onShowToast, onNavigateTab }) {
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

  // Practice history persisted in localStorage
  const [historyList, setHistoryList] = useState(() => {
    try {
      const stored = localStorage.getItem('examai_student_practice_history');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read practice history', e);
    }
    return INITIAL_PRACTICE_HISTORY;
  });

  const saveHistory = (items) => {
    setHistoryList(items);
    try {
      localStorage.setItem('examai_student_practice_history', JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save practice history', e);
    }
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
    const updated = historyList.filter((item) => item.id !== id);
    saveHistory(updated);
    if (onShowToast) onShowToast('Practice test removed from history.');
  };

  // Submission handler from test runner
  const handlePracticeSubmitted = (resultPayload) => {
    const newEntry = {
      ...resultPayload,
      bestOfCount: 1,
      type: 'practice',
    };
    const updated = [newEntry, ...historyList];
    saveHistory(updated);

    window.dispatchEvent(new Event('examai_student_test_completed'));

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
