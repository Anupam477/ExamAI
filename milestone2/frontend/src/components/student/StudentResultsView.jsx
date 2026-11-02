import React, { useState, useMemo, useEffect } from 'react';
import { getStudentSubmissions } from '../../utils/mockApi';

// Default mock questions for initial fallback when no tests have been taken yet
const DEFAULT_FALLBACK_TESTS = [
  {
    id: 'res_bst_01',
    title: 'Binary search trees practice',
    subject: 'Computer Science',
    topic: 'Binary Search Trees',
    type: 'practice',
    difficulty: 'Medium',
    percentage: 67,
    score: 10,
    totalMarks: 15,
    correctCount: 2,
    wrongCount: 1,
    skippedCount: 0,
    totalQuestions: 3,
    timeTakenDisplay: '12 mins',
    timestampDisplay: 'Today, 5:25 PM',
    review: [
      {
        num: 1,
        type: 'Multiple choice',
        status: 'correct',
        marks: '5 / 5',
        question: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST) with N nodes?',
        options: [
          { letter: 'A', text: 'O(N) - degenerate linear linked list structure', isCorrect: true },
          { letter: 'B', text: 'O(log N) - balanced height branching', isCorrect: false },
          { letter: 'C', text: 'O(1) - hash table direct lookup', isCorrect: false },
          { letter: 'D', text: 'O(N log N) - divide and conquer sort', isCorrect: false },
        ],
        studentSelected: 'A',
        explanation: 'When elements are inserted in strictly sorted order, a standard BST degenerates into a linear linked list of height N. Lookup requires inspecting every node from root to leaf, giving O(N) runtime.',
      },
      {
        num: 2,
        type: 'Multi-select',
        status: 'correct',
        marks: '5 / 5',
        question: 'Select all valid self-balancing tree invariants and balance factor properties that apply to AVL Trees:',
        options: [
          { letter: 'A', text: 'The height difference between left and right subtrees cannot exceed 1', isCorrect: true },
          { letter: 'B', text: 'Every node has a balance factor in {-1, 0, +1}', isCorrect: true },
          { letter: 'C', text: 'Insertions always require an exponential number of rotations in worst-case', isCorrect: false },
          { letter: 'D', text: 'Worst-case search, insert, and delete run in guaranteed O(log N) time', isCorrect: true },
        ],
        studentSelected: 'A, B, D',
        explanation: 'Options A, B, and D are valid AVL invariants. Rotations are bounded by O(1) for insertion and O(log N) for deletion, never exponential.',
      },
      {
        num: 3,
        type: 'Written response',
        status: 'wrong',
        marks: '0 / 5',
        question: 'Derive and illustrate the Left-Right (LR) double rotation on an AVL tree. You can write your step-by-step derivation on paper and attach photo, or type below.',
        studentAnswer: 'Incomplete derivation.',
        modelAnswer: 'An LR imbalance occurs when a node has a balance factor of +2 and its left child has a balance factor of -1. Resolution requires a Left Rotation on the left child, transforming it into an LL configuration, followed by a Right Rotation on the unbalanced ancestor node.',
        explanation: 'Full marks awarded for correctly identifying the 2-step rotation mechanism (Left rotation on child, Right rotation on root) and height invariance.',
      },
    ],
  },
  {
    id: 'res_thermo_02',
    title: 'Laws of thermodynamics practice',
    subject: 'Physics',
    topic: 'Thermodynamics',
    type: 'practice',
    difficulty: 'Hard',
    percentage: 50,
    score: 6,
    totalMarks: 12,
    correctCount: 1,
    wrongCount: 1,
    skippedCount: 0,
    totalQuestions: 2,
    timeTakenDisplay: '14 mins',
    timestampDisplay: 'Yesterday, 3:10 PM',
    review: [
      {
        num: 1,
        type: 'Multiple choice',
        status: 'correct',
        marks: '6 / 6',
        question: 'What thermodynamic quantity is described as the microscopic measure of molecular disorder and irreversible dissipation in a closed system?',
        options: [
          { letter: 'A', text: 'Entropy (S)', isCorrect: true },
          { letter: 'B', text: 'Enthalpy (H)', isCorrect: false },
          { letter: 'C', text: 'Internal Energy (U)', isCorrect: false },
          { letter: 'D', text: 'Gibbs Free Energy (G)', isCorrect: false },
        ],
        studentSelected: 'A',
        explanation: 'Entropy (S) quantifies the microscopic multiplicity and irreversibility of energy distribution.',
      },
      {
        num: 2,
        type: 'Multiple choice',
        status: 'wrong',
        marks: '0 / 6',
        question: 'Which thermodynamic process occurs strictly under constant pressure in a cylinder-piston system?',
        options: [
          { letter: 'A', text: 'Isobaric process (dP = 0)', isCorrect: true },
          { letter: 'B', text: 'Isochoric process (dV = 0)', isCorrect: false },
          { letter: 'C', text: 'Isothermal process (dT = 0)', isCorrect: false },
          { letter: 'D', text: 'Adiabatic process (dQ = 0)', isCorrect: false },
        ],
        studentSelected: 'B',
        explanation: 'Isobaric signifies constant pressure throughout the state change (dP = 0).',
      },
    ],
  },
];

export default function StudentResultsView({ candidateUser, onNavigateTab }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'lost' | 'skipped'
  const [testTypeFilter, setTestTypeFilter] = useState('all'); // 'all' | 'academic' | 'practice'
  const [openExplanations, setOpenExplanations] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync when tests or submissions are updated anywhere
  useEffect(() => {
    const handleSync = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener('examai_student_test_completed', handleSync);
    window.addEventListener('examai_submissions_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('examai_student_test_completed', handleSync);
      window.removeEventListener('examai_submissions_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Fetch and normalize ALL completed tests across both Academic Exams and Practice Sessions
  const allTests = useMemo(() => {
    const combined = [];

    // 1. Fetch formal academic exam submissions
    try {
      const studentId = candidateUser?.id || candidateUser?.email || 'usr_002';
      const academicSubs = getStudentSubmissions(studentId);
      if (Array.isArray(academicSubs) && academicSubs.length > 0) {
        academicSubs.forEach((sub, idx) => {
          combined.push({
            id: sub.id || `academic_${idx}`,
            title: sub.testTitle || sub.title || 'Academic Examination',
            subject: sub.subject || 'Computer Science',
            topic: sub.topic || sub.testTitle || 'Exam',
            type: 'academic',
            testCode: sub.testCode || '',
            difficulty: sub.difficulty || 'Medium',
            percentage: sub.percentage !== undefined ? Number(sub.percentage) : Math.round(((sub.score || 0) / (sub.totalMarks || 100)) * 100),
            score: sub.score !== undefined ? sub.score : 0,
            totalMarks: sub.totalMarks || 100,
            correctCount: sub.correctCount || 0,
            wrongCount: sub.wrongCount !== undefined ? sub.wrongCount : Math.max(0, (sub.totalQuestions || 0) - (sub.correctCount || 0)),
            skippedCount: sub.skippedCount || 0,
            totalQuestions: sub.totalQuestions || (sub.review ? sub.review.length : 0),
            timeTakenDisplay: sub.timeTakenDisplay || '30 mins',
            timestampDisplay: sub.timestampDisplay || (sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'),
            questions: sub.questions || [],
            review: sub.review || [],
            submittedAt: sub.submittedAt || new Date().toISOString(),
          });
        });
      }
    } catch (e) {
      console.warn('Could not read academic submissions:', e);
    }

    // 2. Fetch AI Practice session history
    try {
      const rawPractice = localStorage.getItem('examai_student_practice_history');
      if (rawPractice) {
        const parsedPractice = JSON.parse(rawPractice);
        if (Array.isArray(parsedPractice) && parsedPractice.length > 0) {
          parsedPractice.forEach((p, idx) => {
            // Check if already in combined
            if (!combined.some((t) => t.id === p.id)) {
              // Normalize review questions
              const normalizedReview = (p.review || []).map((r, rIdx) => {
                const isCorrect = Boolean(r.isCorrect);
                const marksVal = r.marks ? r.marks : isCorrect ? '5 / 5' : '0 / 5';

                let optionsList = undefined;
                if (Array.isArray(r.options)) {
                  optionsList = r.options.map((opt, oIdx) => {
                    const text = typeof opt === 'object' && opt ? opt.text || opt : String(opt);
                    const isOptionCorrect =
                      r.type === 'multi-select'
                        ? Array.isArray(r.correctAnswer) && r.correctAnswer.includes(oIdx)
                        : r.correctAnswer === oIdx;
                    return {
                      letter: String.fromCharCode(65 + oIdx),
                      text,
                      isCorrect: isOptionCorrect,
                    };
                  });
                }

                let studentSelected = '';
                if (typeof r.studentAnswer === 'number') {
                  studentSelected = String.fromCharCode(65 + r.studentAnswer);
                } else if (Array.isArray(r.studentAnswer)) {
                  studentSelected = r.studentAnswer.map((i) => String.fromCharCode(65 + i)).join(', ');
                } else if (typeof r.studentAnswer === 'string') {
                  studentSelected = r.studentAnswer;
                }

                return {
                  num: rIdx + 1,
                  type: r.type === 'multi-select' ? 'Multi-select' : r.type === 'short-answer' || r.type === 'long-answer' || r.type === 'descriptive' ? 'Written response' : 'Multiple choice',
                  status: isCorrect ? 'correct' : (r.studentAnswer === undefined || r.studentAnswer === '' || r.studentAnswer === null ? 'skipped' : 'wrong'),
                  marks: marksVal,
                  question: r.question,
                  options: optionsList,
                  studentSelected,
                  studentAnswer: typeof r.studentAnswer === 'string' ? r.studentAnswer : undefined,
                  studentImage: r.studentImage,
                  fileName: r.fileName,
                  explanation: r.explanation || 'Instant AI evaluation criteria applied.',
                };
              });

              combined.push({
                id: p.id || `practice_${idx}`,
                title: p.title || `${p.topic || 'General'} practice`,
                subject: p.subject || 'General Studies',
                topic: p.topic || p.title || 'Practice Topic',
                type: 'practice',
                difficulty: p.difficulty || 'Medium',
                percentage: p.percentage !== undefined ? Number(p.percentage) : Number(p.score) || 0,
                score: p.correctCount || (p.score ? Math.round((p.score / 100) * (p.totalQuestions || 5)) : 0),
                totalMarks: p.totalQuestions ? p.totalQuestions * 5 : 25,
                correctCount: p.correctCount || 0,
                wrongCount: Math.max(0, (p.totalQuestions || 0) - (p.correctCount || 0)),
                skippedCount: 0,
                totalQuestions: p.totalQuestions || p.questionsCount || 0,
                timeTakenDisplay: p.timeTakenDisplay || '12 mins',
                timestampDisplay: p.timestampDisplay || 'Recently',
                questions: p.questions || [],
                review: normalizedReview,
                submittedAt: p.submittedAt || new Date().toISOString(),
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Could not read practice history:', e);
    }

    // 3. Fallback to default mock tests if user has not taken any tests yet
    if (combined.length === 0) {
      return DEFAULT_FALLBACK_TESTS;
    }

    return combined;
  }, [candidateUser, refreshTrigger]);

  // Selected test state (defaults to the first/most recent test)
  const [selectedTestId, setSelectedTestId] = useState(allTests[0]?.id || 'res_bst_01');

  // Auto-select latest test if current selected is no longer valid
  const activeTest = useMemo(() => {
    const found = allTests.find((t) => t.id === selectedTestId);
    return found || allTests[0] || DEFAULT_FALLBACK_TESTS[0];
  }, [allTests, selectedTestId]);

  // Filtered test attempt tabs (All | Academic | Practice)
  const displayedTestCards = useMemo(() => {
    if (testTypeFilter === 'academic') return allTests.filter((t) => t.type === 'academic');
    if (testTypeFilter === 'practice') return allTests.filter((t) => t.type === 'practice');
    return allTests;
  }, [allTests, testTypeFilter]);

  // Toggle individual question explanation
  const toggleExplanation = (qId) => {
    setOpenExplanations((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Filtered question review list based on active pill
  const filteredQuestions = useMemo(() => {
    const list = activeTest.review || [];
    if (filter === 'correct') {
      return list.filter((q) => q.status === 'correct');
    }
    if (filter === 'lost') {
      return list.filter((q) => q.status === 'wrong' || q.status === 'skipped');
    }
    if (filter === 'skipped') {
      return list.filter((q) => q.status === 'skipped');
    }
    return list;
  }, [activeTest, filter]);

  // Score split calculation
  const { objectiveScore, writtenScore } = useMemo(() => {
    let obj = 0;
    let wri = 0;
    (activeTest.review || []).forEach((q) => {
      if (q.status === 'correct') {
        if (q.type === 'Written response') {
          wri += 5;
        } else {
          obj += 5;
        }
      }
    });
    return { objectiveScore: obj, writtenScore: wri };
  }, [activeTest]);

  // SVG Circular Meter Calculation (radius = 36, circumference = 226)
  const scorePercent = Math.min(100, Math.max(0, activeTest.percentage || 0));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;
  const isPassing = scorePercent >= 40;

  return (
    <div>
      {/* ======================================================== */}
      {/* 0. ALL COMPLETED TESTS ARCHIVE SELECTOR (User Request)   */}
      {/* ======================================================== */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--sp-brand)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
              EXAMINATION &amp; PRACTICE RESULTS ARCHIVE
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--sp-text-primary)', margin: 0 }}>
              All Completed Tests ({allTests.length})
            </h2>
            <p style={{ fontSize: '0.78125rem', color: 'var(--sp-text-muted)', margin: '2px 0 0' }}>
              Every exam and practice session you take is recorded here with live scorecards and question breakdowns.
            </p>
          </div>

          {/* Test Type Filters: All | Academic Exams | Practice Tests */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--sp-surface-hover)', padding: '4px', borderRadius: '10px', border: '1px solid var(--sp-border)' }}>
            <button
              type="button"
              className={`rv-filter-btn ${testTypeFilter === 'all' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              onClick={() => setTestTypeFilter('all')}
            >
              All Tests ({allTests.length})
            </button>
            <button
              type="button"
              className={`rv-filter-btn ${testTypeFilter === 'academic' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              onClick={() => setTestTypeFilter('academic')}
            >
              Academic Exams ({allTests.filter((t) => t.type === 'academic').length})
            </button>
            <button
              type="button"
              className={`rv-filter-btn ${testTypeFilter === 'practice' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              onClick={() => setTestTypeFilter('practice')}
            >
              AI Practice ({allTests.filter((t) => t.type === 'practice').length})
            </button>
          </div>
        </div>

        {/* Horizontal Test Cards Carousel */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
          }}
        >
          {displayedTestCards.map((test) => {
            const isSelected = test.id === activeTest.id;
            const testPassing = test.percentage >= 40;

            return (
              <div
                key={test.id}
                onClick={() => setSelectedTestId(test.id)}
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #4F46E5' : '1px solid var(--sp-border)',
                  backgroundColor: isSelected ? 'var(--sp-brand-light)' : 'var(--sp-surface)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'var(--sp-shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Header: Subject & Type Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--sp-brand)', textTransform: 'uppercase' }}>
                    {test.subject || 'GENERAL'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: test.type === 'academic' ? '#EEF2FF' : '#F3E8FF',
                      color: test.type === 'academic' ? '#4F46E5' : '#7E22CE',
                    }}
                  >
                    {test.type === 'academic' ? 'PROCTORED EXAM' : 'AI PRACTICE'}
                  </span>
                </div>

                {/* Test Title */}
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--sp-text-primary)', lineHeight: 1.3 }}>
                  {test.title}
                </div>

                {/* Score & Timing Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid var(--sp-border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        color: testPassing ? '#059669' : '#DC2626',
                        backgroundColor: testPassing ? 'var(--sp-emerald-bg)' : 'var(--sp-rose-bg)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {test.percentage}% {testPassing ? 'PASSED' : 'NEEDS WORK'}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.71875rem', color: 'var(--sp-text-muted)' }}>
                    {test.timestampDisplay}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. HERO SCORECARD BANNER FOR SELECTED TEST               */}
      {/* ======================================================== */}
      <div className="rv-hero-card">
        <div className="rv-hero-left">
          {/* Circular Score Meter */}
          <div className="rv-circle-meter-wrap">
            <svg className="rv-circle-meter-svg" viewBox="0 0 90 90">
              <circle
                cx="45"
                cy="45"
                r={radius}
                stroke="var(--sp-border)"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="45"
                cy="45"
                r={radius}
                stroke={isPassing ? '#10B981' : '#6366F1'}
                strokeWidth="7"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="rv-circle-meter-text">
              <div className="rv-circle-meter-pct">{scorePercent}%</div>
              <div className="rv-circle-meter-sub">{isPassing ? 'Passed' : 'Needs work'}</div>
            </div>
          </div>

          {/* Title and Metadata */}
          <div>
            <div className="rv-tags-row">
              <span className="rv-tag-subject">{activeTest.subject || 'COMPUTER SCIENCE'}</span>
              <span className={activeTest.type === 'academic' ? 'rv-tag-subject' : 'rv-tag-practice'}>
                {activeTest.type === 'academic' ? 'Academic Exam' : 'Practice Test'}
              </span>
              {activeTest.testCode && (
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--sp-text-muted)', backgroundColor: 'var(--sp-surface-hover)', padding: '2px 6px', borderRadius: '4px' }}>
                  Code: {activeTest.testCode}
                </span>
              )}
            </div>

            <h1 className="rv-hero-title">{activeTest.title}</h1>

            <div className="rv-hero-meta">
              <span>Submitted {activeTest.timestampDisplay}</span>
              <span>&bull;</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {activeTest.timeTakenDisplay}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span className="rv-hero-score-fraction">{activeTest.score}</span>
              <span className="rv-hero-score-total">/ {activeTest.totalMarks || (activeTest.totalQuestions * 5)} Marks</span>
            </div>
          </div>
        </div>

        {/* Right Stats Breakdown Box (Correct, Wrong, Skipped) */}
        <div className="rv-stats-pill-box">
          {/* Correct */}
          <div className="rv-stat-col">
            <div className="rv-stat-icon-wrap" style={{ backgroundColor: 'var(--sp-emerald-bg)', color: 'var(--sp-emerald-text)' }}>
              ✓
            </div>
            <div className="rv-stat-num">{activeTest.correctCount}</div>
            <div className="rv-stat-label">Correct</div>
          </div>

          {/* Wrong */}
          <div className="rv-stat-col">
            <div className="rv-stat-icon-wrap" style={{ backgroundColor: 'var(--sp-rose-bg)', color: 'var(--sp-rose-text)' }}>
              ✕
            </div>
            <div className="rv-stat-num">{activeTest.wrongCount}</div>
            <div className="rv-stat-label">Wrong</div>
          </div>

          {/* Skipped */}
          <div className="rv-stat-col">
            <div className="rv-stat-icon-wrap" style={{ backgroundColor: 'var(--sp-border)', color: 'var(--sp-text-muted)' }}>
              ⊝
            </div>
            <div className="rv-stat-num">{activeTest.skippedCount || 0}</div>
            <div className="rv-stat-label">Skipped</div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN REVIEW GRID (Question Breakdown + Sidebar Cards) */}
      {/* ======================================================== */}
      <div className="rv-layout-grid">
        {/* Left: Question Breakdown List */}
        <div>
          {/* Section Header with Filter Pills */}
          <div className="rv-breakdown-header">
            <h2 className="rv-breakdown-title">
              Question breakdown ({filteredQuestions.length} of {activeTest.review?.length || 0})
            </h2>

            <div className="rv-filters-wrap">
              <button
                type="button"
                className={`rv-filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({activeTest.review?.length || 0})
              </button>
              <button
                type="button"
                className={`rv-filter-btn ${filter === 'correct' ? 'active' : ''}`}
                onClick={() => setFilter('correct')}
              >
                Correct ({activeTest.correctCount || 0})
              </button>
              <button
                type="button"
                className={`rv-filter-btn ${filter === 'lost' ? 'active' : ''}`}
                onClick={() => setFilter('lost')}
              >
                Lost marks ({activeTest.wrongCount + (activeTest.skippedCount || 0)})
              </button>
              <button
                type="button"
                className={`rv-filter-btn ${filter === 'skipped' ? 'active' : ''}`}
                onClick={() => setFilter('skipped')}
              >
                Skipped ({activeTest.skippedCount || 0})
              </button>
            </div>
          </div>

          {/* Question Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredQuestions.length === 0 ? (
              <div className="rv-question-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--sp-text-muted)' }}>
                No questions match the "{filter}" filter.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const qKey = `q_${q.num || idx}`;
                const isExplanationOpen = openExplanations[qKey];

                return (
                  <div key={qKey} className="rv-question-card">
                    {/* Top Badges Row */}
                    <div className="rv-q-header">
                      <div className="rv-q-badges">
                        <span className="rv-q-num">Q{q.num || idx + 1}</span>
                        <span className="rv-q-type">{q.type || 'Multiple choice'}</span>

                        {q.status === 'skipped' && (
                          <span className="rv-q-status-skipped">
                            <span>⊝</span> Not answered
                          </span>
                        )}

                        {q.status === 'wrong' && (
                          <span className="rv-q-status-wrong">
                            <span>✕</span> Incorrect
                          </span>
                        )}

                        {q.status === 'correct' && (
                          <span className="rv-q-status-correct">
                            <span>✓</span> Correct
                          </span>
                        )}
                      </div>

                      <div className="rv-q-marks">{q.marks}</div>
                    </div>

                    {/* Question Text */}
                    <div className="rv-q-text">{q.question}</div>

                    {/* Attached Photo / Handwritten Sheet Preview if student captured/uploaded */}
                    {q.studentImage && (
                      <div
                        style={{
                          margin: '10px 0',
                          padding: '10px 14px',
                          backgroundColor: 'var(--sp-surface-hover)',
                          borderRadius: '10px',
                          border: '1px solid var(--sp-border)',
                          display: 'inline-block',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>📸 Attached Paper Sheet / Captured Photo</span>
                          {q.fileName && <span style={{ color: 'var(--sp-text-muted)', fontWeight: 400 }}>({q.fileName})</span>}
                        </div>
                        <img
                          src={q.studentImage}
                          alt="Student submitted answer"
                          style={{
                            maxHeight: '180px',
                            maxWidth: '100%',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            display: 'block',
                            objectFit: 'contain',
                            backgroundColor: '#FFFFFF',
                          }}
                        />
                      </div>
                    )}

                    {/* Student Written Response / Text if available */}
                    {q.studentAnswer && (
                      <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: 'var(--sp-surface-hover)', border: '1px solid var(--sp-border-subtle)', marginBottom: '10px', fontSize: '0.8125rem', color: 'var(--sp-text-secondary)' }}>
                        <strong style={{ color: 'var(--sp-text-primary)' }}>Your Response:</strong> {q.studentAnswer}
                      </div>
                    )}

                    {/* Options List (for MCQ / Multi-select) */}
                    {q.options && q.options.length > 0 && (
                      <div className="rv-options-list">
                        {q.options.map((opt) => (
                          <div
                            key={opt.letter}
                            className={`rv-option-row ${opt.isCorrect ? 'correct-choice' : ''}`}
                          >
                            <div>
                              <span className="rv-option-letter">{opt.letter}</span>
                              <span>{opt.text}</span>
                            </div>

                            {opt.isCorrect && (
                              <span className="rv-check-icon">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Model Answer for Written Questions */}
                    {q.modelAnswer && (
                      <div style={{ marginTop: '8px', padding: '0.6rem 0.85rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.78125rem', color: '#065F46' }}>
                        <strong>Model Solution / Key Points:</strong> {q.modelAnswer}
                      </div>
                    )}

                    {/* Collapsible Explanation Button */}
                    <div style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        className="rv-explanation-btn"
                        onClick={() => toggleExplanation(qKey)}
                      >
                        <span style={{ fontSize: '0.95rem' }}>💡</span>
                        <span>Explanation &amp; Insight</span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          style={{
                            transform: isExplanationOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 150ms ease',
                            marginLeft: 2,
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isExplanationOpen && (
                        <div className="rv-explanation-content">
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar: Retake CTA Card, Score Split Card, Quick Switcher */}
        <div>
          {/* Card 1: Practice Retake CTA */}
          <div className="rv-cta-card">
            <div className="rv-bot-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8" y2="16" />
                <line x1="16" y1="16" x2="16" y2="16" />
              </svg>
            </div>

            <p className="rv-cta-desc">
              Practice makes perfect. Retake this test with the exact same questions or try a fresh topic.
            </p>

            <button
              type="button"
              className="rv-retake-btn"
              onClick={() => {
                if (onNavigateTab) onNavigateTab(activeTest.type === 'academic' ? 'tests' : 'practice');
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span>Retake this test</span>
            </button>

            <button
              type="button"
              className="rv-new-test-link"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('practice');
              }}
            >
              Start new practice test
            </button>
          </div>

          {/* Card 2: Score Split Breakdown */}
          <div className="rv-split-card">
            <h3 className="rv-split-title">Score split</h3>

            <div className="rv-split-row">
              <span>Objective (MCQ / Multi)</span>
              <span style={{ fontWeight: 600, color: 'var(--sp-text-primary)' }}>{objectiveScore} pts</span>
            </div>

            <div className="rv-split-row">
              <span>Written &amp; Uploads</span>
              <span style={{ fontWeight: 600, color: 'var(--sp-text-primary)' }}>{writtenScore} pts</span>
            </div>

            <div className="rv-split-divider" />

            <div className="rv-split-row" style={{ paddingTop: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--sp-text-primary)' }}>Total Achieved</span>
              <span style={{ fontWeight: 700, color: 'var(--sp-brand)', fontSize: '1.05rem' }}>
                {activeTest.score} / {activeTest.totalMarks || (activeTest.totalQuestions * 5)}
              </span>
            </div>
          </div>

          {/* Card 3: Switch Test Attempts */}
          {allTests.length > 1 && (
            <div className="rv-split-card" style={{ marginTop: '1.25rem' }}>
              <h3 className="rv-split-title" style={{ marginBottom: '0.75rem' }}>
                Other Test Sessions ({allTests.length - 1})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allTests
                  .filter((t) => t.id !== activeTest.id)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTestId(t.id)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--sp-surface-hover)',
                        border: '1px solid var(--sp-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78125rem',
                        transition: 'all 120ms ease',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--sp-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--sp-text-muted)' }}>
                          {t.timestampDisplay}
                        </div>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          color: t.percentage >= 40 ? '#059669' : '#DC2626',
                          flexShrink: 0,
                        }}
                      >
                        {t.percentage}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}