import React, { useState, useMemo, useEffect } from 'react';
import {
  getStoredTeacherTests,
  isStudentAssignedToTest,
  saveStudentSubmission,
  getStudentSubmissions,
  getActiveExamSession,
  clearActiveExamSession,
  isTestReassignedForStudent,
} from '../../utils/mockApi';
import InteractiveExamRunner from './InteractiveExamRunner';
import PreExamVerificationModal from './PreExamVerificationModal';

/**
 * Student Tests View ("My Tests")
 * Clean, well-proportioned view displaying examinations assigned by faculty.
 * Supports multiple attempts whenever faculty re-assigns the exam (even with zero question edits).
 */
export default function StudentTestsView({ candidateUser, onShowToast, onNavigateTab }) {
  const [allTests, setAllTests] = useState(() => getStoredTeacherTests());
  const [submissions, setSubmissions] = useState(() =>
    getStudentSubmissions(candidateUser)
  );
  const [examCodeInput, setExamCodeInput] = useState('');
  const [examCodeError, setExamCodeError] = useState('');
  const [manuallyJoinedIds, setManuallyJoinedIds] = useState([]);
  const [filterTab, setFilterTab] = useState('assigned'); // 'assigned' | 'open' | 'completed'

  // Modal states
  const [selectedSyllabusTest, setSelectedSyllabusTest] = useState(null);
  const [verifyingExam, setVerifyingExam] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Sync tests & submissions
  useEffect(() => {
    const handleSync = () => {
      setAllTests(getStoredTeacherTests());
      setSubmissions(getStudentSubmissions(candidateUser));
    };
    window.addEventListener('examai_tests_updated', handleSync);
    window.addEventListener('examai_submissions_updated', handleSync);
    window.addEventListener('examai_student_test_completed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('examai_tests_updated', handleSync);
      window.removeEventListener('examai_submissions_updated', handleSync);
      window.removeEventListener('examai_student_test_completed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [candidateUser]);

  // Assigned teacher tests (shows ONLY tests published by teacher and assigned to this student)
  const assignedTests = useMemo(() => {
    return allTests.filter((t) => {
      // Must be published! Drafts and archived are strictly excluded.
      if (t.status !== 'published') return false;
      const isAssigned = isStudentAssignedToTest(t, candidateUser);
      const isManual = manuallyJoinedIds.includes(t.id);
      return isAssigned || isManual;
    });
  }, [allTests, candidateUser, manuallyJoinedIds]);

  // Submission lookup helper (returns newest submission for this test)
  const getTestSubmission = (testId, testCode) => {
    return submissions.find(
      (s) =>
        (testId && s.testId === testId) ||
        (testCode && s.testCode && s.testCode.toUpperCase() === String(testCode).toUpperCase())
    );
  };

  // Filtered view by tab (re-assigned tests reappear in 'assigned' and 'open' as fresh attempts)
  const displayedTests = useMemo(() => {
    if (filterTab === 'completed') {
      if (submissions.length > 0) {
        return submissions.map((s) => {
          const matchedTest = allTests.find((t) => t.id === s.testId || (s.testCode && t.code === s.testCode)) || {};
          return {
            ...matchedTest,
            id: s.testId || s.id,
            submissionId: s.id,
            title: s.testTitle || matchedTest.title || 'Examination',
            subject: s.subject || matchedTest.subject || 'Computer Science',
            topic: s.topic || matchedTest.topic || '',
            instructor: s.instructor || matchedTest.instructor || 'Course Faculty',
            instructorRole: s.instructorRole || matchedTest.instructorRole || 'Course Faculty',
            code: s.testCode || matchedTest.code || 'EXAM',
            duration: matchedTest.duration || 30,
            status: 'completed',
            isCompleted: true,
            submission: s,
          };
        });
      }
      return assignedTests.filter((t) => !!getTestSubmission(t.id, t.code));
    }
    if (filterTab === 'open') {
      return assignedTests.filter((t) => {
        const sub = getTestSubmission(t.id, t.code);
        return !sub || isTestReassignedForStudent(t, sub, candidateUser);
      });
    }
    return assignedTests;
  }, [assignedTests, allTests, filterTab, submissions, candidateUser]);

  // Counts
  const completedCount = submissions.length;
  const openCount = useMemo(() => {
    return assignedTests.filter((t) => {
      const sub = getTestSubmission(t.id, t.code);
      return !sub || isTestReassignedForStudent(t, sub, candidateUser);
    }).length;
  }, [assignedTests, submissions, candidateUser]);

  // Handle joining via exam code
  const handleJoinByCode = (e) => {
    e.preventDefault();
    setExamCodeError('');
    const code = examCodeInput.trim().toUpperCase();
    if (!code) return;

    const matched = allTests.find(
      (t) => t.code?.trim().toUpperCase() === code && t.status !== 'archived'
    );

    if (matched) {
      if (!manuallyJoinedIds.includes(matched.id)) {
        setManuallyJoinedIds((prev) => [...prev, matched.id]);
      }
      setExamCodeInput('');
      if (onShowToast) onShowToast(`✓ Enrolled in test: ${matched.title} (${matched.code})`);
    } else {
      setExamCodeError(`No active exam found for code "${code}". Please verify with your instructor.`);
    }
  };

  // Copy code helper
  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    if (onShowToast) onShowToast(`Copied Exam Code: ${code}`);
  };

  // Launch formal exam (opens camera & face verification first; clears stale active sessions)
  const handleStartExam = (test, isRetake = false) => {
    clearActiveExamSession(test.id, candidateUser?.id || candidateUser?.email);
    setVerifyingExam(test);
    setExamSubmitted(false);
    setExamResult(null);
  };

  // Submit formal exam
  const handleSubmitExam = (finalAnswers = {}, timeSpentSec = 0, proctoringReport = null) => {
    if (!activeExam) return;

    const questions = activeExam.questions || [];
    let score = 0;
    let totalMarks = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const reviewList = [];

    questions.forEach((q, idx) => {
      const qId = q.id || `q_${idx}`;
      const marks = Number(q.marks) || 5;
      totalMarks += marks;
      const studentAns = finalAnswers[qId];

      let isCorrect = false;
      let status = 'skipped'; // 'correct' | 'wrong' | 'skipped'

      const isAnswered =
        studentAns !== undefined &&
        studentAns !== null &&
        studentAns !== '' &&
        (!Array.isArray(studentAns) || studentAns.length > 0) &&
        (typeof studentAns !== 'object' || (studentAns.text && studentAns.text.trim()) || studentAns.image);

      if (!isAnswered) {
        skipped++;
        status = 'skipped';
      } else if (q.type === 'mcq' || (q.options && q.options.length > 0 && !Array.isArray(studentAns))) {
        const correctAns = q.correctOption !== undefined ? q.correctOption : 0;
        if (studentAns === correctAns) {
          isCorrect = true;
          status = 'correct';
          score += marks;
          correct++;
        } else {
          status = 'wrong';
          wrong++;
        }
      } else if (q.type === 'multi-select') {
        const selected = Array.isArray(studentAns) ? [...studentAns].sort().join(',') : '';
        const target = Array.isArray(q.correctOptions) ? [...q.correctOptions].sort().join(',') : '';
        if (selected === target && selected.length > 0) {
          isCorrect = true;
          status = 'correct';
          score += marks;
          correct++;
        } else {
          status = 'wrong';
          wrong++;
        }
      } else {
        // Written response: text or attached photo
        const studentText =
          typeof studentAns === 'object' && studentAns !== null
            ? studentAns.text || ''
            : typeof studentAns === 'string'
            ? studentAns
            : '';
        const hasAttachedImage =
          typeof studentAns === 'object' && studentAns !== null && Boolean(studentAns.image);

        if (studentText.trim().length > 15 || hasAttachedImage) {
          isCorrect = true;
          status = 'correct';
          score += marks;
          correct++;
        } else {
          status = 'wrong';
          wrong++;
        }
      }

      const studentText =
        typeof studentAns === 'object' && studentAns !== null ? studentAns.text : studentAns;
      const studentImage =
        typeof studentAns === 'object' && studentAns !== null ? studentAns.image : null;
      const fileName =
        typeof studentAns === 'object' && studentAns !== null ? studentAns.fileName : null;

      reviewList.push({
        num: idx + 1,
        question: q.question || q.title,
        type: q.type === 'multi-select' ? 'Multi-select' : q.type === 'short' || q.type === 'long' || q.type === 'descriptive' ? 'Written response' : 'Multiple choice',
        marks: `${isCorrect ? marks : 0} / ${marks}`,
        maxMarks: marks,
        options: q.options
          ? q.options.map((optText, oIdx) => ({
              letter: String.fromCharCode(65 + oIdx),
              text: typeof optText === 'object' && optText ? optText.text || optText : String(optText),
              isCorrect:
                q.type === 'multi-select'
                  ? Array.isArray(q.correctOptions) && q.correctOptions.includes(oIdx)
                  : (q.correctOption !== undefined ? q.correctOption : 0) === oIdx,
            }))
          : undefined,
        studentSelected:
          typeof studentAns === 'number'
            ? String.fromCharCode(65 + studentAns)
            : Array.isArray(studentAns)
            ? studentAns.map((i) => String.fromCharCode(65 + i)).join(', ')
            : studentText,
        studentAnswer: studentText,
        studentImage,
        fileName,
        status,
        isCorrect,
        explanation: q.explanation || q.rubric || 'Standard academic evaluation guidelines applied.',
      });
    });

    if (totalMarks === 0) totalMarks = 100;
    const percentage = Math.round((score / totalMarks) * 100);
    const passed = percentage >= 40;

    const defaultProctoring = {
      integrityScore: 100,
      integrityStatus: 'Clean (Verified Integrity)',
      totalTabSwitches: 0,
      totalGazeDeviations: 0,
      totalFaceAbsences: 0,
      totalIncidents: 0,
      incidentTimeline: [],
      verifiedAt: new Date().toISOString(),
    };

    // Count prior attempts to track sequential attempt numbers
    const priorAttempts = submissions.filter(
      (s) => s.testId === activeExam.id || (s.testCode && s.testCode.toUpperCase() === (activeExam.code || '').toUpperCase())
    );
    const attemptNumber = priorAttempts.length + 1;

    const submissionPayload = {
      id: `sub_${Date.now()}`,
      testId: activeExam.id,
      testCode: activeExam.code,
      testTitle: activeExam.title,
      subject: activeExam.subject || 'Computer Science',
      topic: activeExam.topic || activeExam.title,
      difficulty: activeExam.difficulty || 'Medium',
      instructor: activeExam.instructor || 'Course Faculty',
      instructorRole: activeExam.instructorRole || 'Course Faculty',
      studentId: candidateUser?.id || 'usr_002',
      studentName: candidateUser?.fullName || candidateUser?.name || 'Test Student',
      studentEmail: candidateUser?.email || 'teststudent@gmail.com',
      score: score,
      totalMarks: totalMarks,
      percentage: percentage,
      status: passed ? 'PASSED' : 'NEEDS_REVIEW',
      submittedAt: new Date().toISOString(),
      timestampDisplay: 'Just now',
      timeTakenDisplay: `${Math.max(1, Math.round(timeSpentSec / 60))} mins`,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      totalQuestions: questions.length,
      questions: questions,
      review: reviewList,
      type: 'academic',
      attempt: attemptNumber,
      referencePhoto: activeExam.referencePhoto || (proctoringReport && proctoringReport.referencePhoto) || null,
      proctoring: proctoringReport
        ? {
            ...proctoringReport,
            referencePhoto: proctoringReport.referencePhoto || activeExam.referencePhoto || null,
          }
        : {
            ...defaultProctoring,
            referencePhoto: activeExam.referencePhoto || null,
          },
    };

    saveStudentSubmission(submissionPayload);
    setSubmissions((prev) => [submissionPayload, ...prev]);

    // Dispatch global event for Results tab sync
    window.dispatchEvent(new Event('examai_student_test_completed'));

    setExamResult({
      ...submissionPayload,
      correctCount: correct,
      totalQuestions: questions.length,
    });
    setExamSubmitted(true);

    // Cleanly exit full-screen mode upon exam submission
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }
      } catch (e) {}
    }
    if (onShowToast) onShowToast(`Exam attempt #${attemptNumber} submitted successfully! Results recorded.`);
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'CF';
    const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, '').trim();
    if (!clean) return 'CF';
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase() || 'CF';
    }
    return clean.slice(0, 2).toUpperCase() || 'CF';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2.5rem' }}>
      {/* Top Header & Join Code in single compact row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--sp-brand)',
              marginBottom: '2px',
            }}
          >
            ACADEMIC EXAMINATIONS
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sp-text-primary)', margin: 0 }}>
            My Tests &amp; Midterms
          </h1>
          <p style={{ fontSize: '0.78125rem', color: 'var(--sp-text-muted)', margin: '2px 0 0' }}>
            Institutional assessments assigned by course faculty with automated proctoring.
          </p>
        </div>

        {/* Compact Code Enroll Bar */}
        <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            className="sp-input"
            placeholder="Enter Exam Code (e.g. AIML-DEEP-2026)"
            value={examCodeInput}
            onChange={(e) => setExamCodeInput(e.target.value)}
            style={{
              textTransform: 'uppercase',
              fontWeight: 600,
              fontSize: '0.78125rem',
              padding: '0.45rem 0.75rem',
              width: '240px',
            }}
          />
          <button
            type="submit"
            className="sp-generate-btn"
            style={{ width: 'auto', padding: '0.45rem 0.95rem', fontSize: '0.78125rem', whiteSpace: 'nowrap' }}
          >
            Enroll
          </button>
        </form>
      </div>

      {examCodeError && (
        <div
          style={{
            padding: '0.5rem 0.85rem',
            borderRadius: '6px',
            backgroundColor: 'var(--sp-rose-bg)',
            color: 'var(--sp-rose-text)',
            fontSize: '0.78125rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          {examCodeError}
        </div>
      )}

      {/* Sleek Faculty Summary Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '0.55rem 0.85rem',
          borderRadius: '8px',
          backgroundColor: 'var(--sp-surface-hover)',
          border: '1px solid var(--sp-border)',
          marginBottom: '1rem',
          fontSize: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>🎓</span>
          <span style={{ fontWeight: 700, color: 'var(--sp-text-primary)' }}>
            Faculty Assigned Assessments
          </span>
          <span style={{ color: 'var(--sp-text-muted)' }}>&bull;</span>
          <span style={{ color: 'var(--sp-text-muted)' }}>
            Candidate: <strong>{candidateUser?.fullName || 'test student'}</strong> ({candidateUser?.email || 'teststudent@gmail.com'})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
          <span style={{ color: 'var(--sp-brand)' }}>● {assignedTests.length} Tests Assigned</span>
          <span style={{ color: 'var(--sp-emerald-text)' }}>✓ {completedCount} Completed</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tt-subtabs-row" style={{ marginBottom: '1.25rem', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`tt-subtab-btn ${filterTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setFilterTab('assigned')}
        >
          <span>👨‍🏫 To do</span>
          <span className="tt-subtab-count">{assignedTests.length}</span>
        </button>
        <button
          type="button"
          className={`tt-subtab-btn ${filterTab === 'open' ? 'active' : ''}`}
          onClick={() => setFilterTab('open')}
        >
          <span>⚡ Upcoming</span>
          <span className="tt-subtab-count">{openCount}</span>
        </button>
        <button
          type="button"
          className={`tt-subtab-btn ${filterTab === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterTab('completed')}
        >
          <span>✓ Completed Submissions</span>
          <span className="tt-subtab-count">{completedCount}</span>
        </button>
      </div>

      {/* Tests Grid */}
      {displayedTests.length === 0 ? (
        <div className="sp-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sp-text-primary)', margin: 0 }}>
            {filterTab === 'completed' ? 'No Completed Submissions Yet' : 'No Assigned Examinations Found'}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--sp-text-muted)', margin: '6px auto 14px' }}>
            {filterTab === 'completed'
              ? 'You have not submitted any examinations yet. Take an active test below.'
              : 'There are no active tests matching this filter.'}
          </p>
          <button
            type="button"
            className="sp-generate-btn"
            style={{ width: 'auto', margin: '0 auto', padding: '0.5rem 1.15rem', fontSize: '0.8125rem' }}
            onClick={() => (filterTab === 'completed' ? setFilterTab('assigned') : onNavigateTab('practice'))}
          >
            {filterTab === 'completed' ? 'View All Assigned Tests' : 'Go to AI Practice Studio →'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
          {displayedTests.map((test) => {
            const submission = getTestSubmission(test.id, test.code);
            const isReassigned = isTestReassignedForStudent(test, submission, candidateUser);
            const totalMarks =
              test.questions?.reduce((acc, q) => acc + (Number(q.marks) || 5), 0) || 100;

            let instructorName = test.instructor || (submission ? submission.instructor : null);
            let instructorRole = test.instructorRole || (submission ? submission.instructorRole : null);
            if (
              !instructorName ||
              instructorName === 'Dr. Test Teacher' ||
              instructorName === 'Authorized Instructor' ||
              instructorName === candidateUser?.fullName ||
              instructorName === candidateUser?.name ||
              instructorName === 'Abhi Singh' ||
              instructorName === 'Test Student'
            ) {
              if (test.instructorEmail) {
                const prefix = test.instructorEmail.split('@')[0];
                const parts = prefix.split(/[._-]/).filter(Boolean);
                instructorName = parts.length > 0
                  ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
                  : 'Course Faculty';
              } else {
                instructorName = 'Course Faculty';
              }
              instructorRole = 'Course Faculty';
            }
            if (!instructorRole || instructorRole.includes('Year') || instructorRole.includes('Student')) {
              instructorRole = 'Course Faculty';
            }
            const initials = getInitials(instructorName);

            return (
              <div
                key={test.id}
                className="tt-exam-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                }}
              >
                {/* Top Strip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className="sp-badge sp-badge-medium" style={{ fontSize: '0.6875rem' }}>
                      {test.subject || 'Computer Science'}
                    </span>
                    <span className="sp-badge sp-badge-easy" style={{ fontSize: '0.6875rem' }}>
                      {test.difficulty || 'Medium'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: test.status === 'published' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: test.status === 'published' ? '#059669' : '#D97706',
                      }}
                    >
                      {test.status === 'published' ? 'LIVE' : 'ASSIGNED'}
                    </span>
                  </div>
                  <button
                    type="button"
                    title="Click to copy exam code"
                    onClick={() => handleCopyCode(test.code)}
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '5px',
                      backgroundColor: 'var(--sp-surface-hover)',
                      border: '1px solid var(--sp-border)',
                      color: 'var(--sp-brand)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {test.code}
                    <span>{copiedCode === test.code ? '✓' : '⧉'}</span>
                  </button>
                </div>

                {/* Faculty Attribution Box */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--sp-surface-hover)',
                    border: '1px solid var(--sp-border-subtle)',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sp-text-primary)' }}>
                        {instructorName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--sp-emerald-bg)',
                          color: 'var(--sp-emerald-text)',
                          marginLeft: 'auto',
                        }}
                      >
                        FACULTY
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--sp-text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {instructorRole}
                    </div>
                  </div>
                </div>

                {/* Title & Topic */}
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--sp-text-primary)', margin: '0 0 2px', lineHeight: 1.3 }}>
                  {test.title}
                </h3>
                {test.topic && (
                  <div style={{ fontSize: '0.71875rem', fontWeight: 600, color: 'var(--sp-brand)', marginBottom: '6px' }}>
                    Topic: {test.topic}
                  </div>
                )}
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--sp-text-muted)',
                    margin: '0 0 0.75rem',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {test.description || 'Midterm institutional evaluation with automated proctoring and code execution.'}
                </p>

                {/* Specs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--sp-surface-hover)',
                      fontSize: '0.71875rem',
                      color: 'var(--sp-text-primary)',
                      border: '1px solid var(--sp-border-subtle)',
                    }}
                  >
                    <span>⏱</span>
                    <span><strong>{test.duration || 30}</strong> Mins</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--sp-surface-hover)',
                      fontSize: '0.71875rem',
                      color: 'var(--sp-text-primary)',
                      border: '1px solid var(--sp-border-subtle)',
                    }}
                  >
                    <span>📝</span>
                    <span><strong>{totalMarks}</strong> Marks ({test.questions?.length || 0} Qs)</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--sp-surface-hover)',
                      fontSize: '0.71875rem',
                      color: 'var(--sp-text-primary)',
                      border: '1px solid var(--sp-border-subtle)',
                    }}
                  >
                    <span>📷</span>
                    <span>Proctor: Active</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--sp-surface-hover)',
                      fontSize: '0.71875rem',
                      color: 'var(--sp-text-primary)',
                      border: '1px solid var(--sp-border-subtle)',
                    }}
                  >
                    <span>🔒</span>
                    <span>Max {test.maxTabSwitches || 3} Switches</span>
                  </div>
                </div>

                {/* Schedule Window */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.6875rem',
                    color: 'var(--sp-text-muted)',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--sp-surface-hover)',
                    marginBottom: '0.85rem',
                  }}
                >
                  <span>📅 Window: {test.scheduledStart ? test.scheduledStart.split('T')[0] : 'Oct 26'} – {test.scheduledEnd ? test.scheduledEnd.split('T')[0] : 'Oct 31'}</span>
                  <span style={{ color: 'var(--sp-emerald-text)', fontWeight: 700 }}>● Active Now</span>
                </div>

                {/* Status banner */}
                {submission && isReassigned ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(217, 119, 6, 0.12)',
                      color: '#B45309',
                      border: '1px solid rgba(217, 119, 6, 0.3)',
                      fontSize: '0.71875rem',
                      fontWeight: 700,
                      marginBottom: '0.85rem',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span>🔄</span>
                      <span>Re-assigned by Faculty &bull; Fresh Attempt Ready!</span>
                    </span>
                    <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      Attempt #{(submission.attempt || 1) + 1}
                    </span>
                  </div>
                ) : submission ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--sp-emerald-bg)',
                      color: 'var(--sp-emerald-text)',
                      fontSize: '0.71875rem',
                      fontWeight: 700,
                      marginBottom: '0.85rem',
                    }}
                  >
                    <span>✓ Completed &bull; Score: {submission.score}/{submission.totalMarks} ({submission.percentage}%){submission.attempt > 1 ? ` • Att #${submission.attempt}` : ''}</span>
                    <span style={{ fontSize: '0.6875rem' }}>Recorded</span>
                  </div>
                ) : null}

                {/* Actions */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="sp-btn-subtle"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.78125rem', flexShrink: 0 }}
                    onClick={() => setSelectedSyllabusTest(test)}
                  >
                    Syllabus
                  </button>

                  {submission && isReassigned ? (
                    <div style={{ display: 'flex', gap: '6px', flex: 1.6 }}>
                      <button
                        type="button"
                        className="sp-btn-subtle"
                        style={{ padding: '0.45rem 0.55rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          setExamResult(submission);
                          setExamSubmitted(true);

    // Cleanly exit full-screen mode upon exam submission
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }
      } catch (e) {}
    }
                        }}
                        title="View previous attempt scorecard"
                      >
                        Prev Score
                      </button>
                      <button
                        type="button"
                        className="sp-generate-btn"
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.7rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#D97706',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          fontWeight: 700,
                        }}
                        onClick={() => handleStartExam(test, true)}
                        title="Faculty re-assigned this test. Click to take it again."
                      >
                        <span>⚡ Start Re-test &rarr;</span>
                      </button>
                    </div>
                  ) : submission ? (
                    <div style={{ display: 'flex', gap: '6px', flex: 1.6 }}>
                      <button
                        type="button"
                        className="sp-btn-subtle"
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.5rem',
                          fontSize: '0.75rem',
                          color: '#059669',
                          borderColor: '#A7F3D0',
                          backgroundColor: '#ECFDF5',
                          fontWeight: 700,
                        }}
                        onClick={() => {
                          setExamResult(submission);
                          setExamSubmitted(true);

    // Cleanly exit full-screen mode upon exam submission
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }
      } catch (e) {}
    }
                        }}
                      >
                        Scorecard &rarr;
                      </button>
                      <button
                        type="button"
                        className="sp-generate-btn"
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.55rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#2563EB',
                        }}
                        onClick={() => {
                          if (window.confirm(`Take "${test.title}" again? A fresh attempt will be recorded while preserving your previous results.`)) {
                            handleStartExam(test, true);
                          }
                        }}
                        title="Retake this examination for extra practice"
                      >
                        ⚡ Retake &rarr;
                      </button>
                    </div>
                  ) : (() => {
                    const activeSession = getActiveExamSession(test.id, candidateUser?.id || candidateUser?.email);
                    return (
                      <button
                        type="button"
                        className="sp-generate-btn"
                        style={{
                          flex: 1.4,
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.78125rem',
                          backgroundColor: activeSession ? '#D97706' : undefined,
                        }}
                        onClick={() => handleStartExam(test)}
                      >
                        {activeSession ? '⚡ Resume Exam →' : 'Start Examination →'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Syllabus Modal */}
      {selectedSyllabusTest && (
        <div className="sp-modal-backdrop" onClick={() => setSelectedSyllabusTest(null)}>
          <div className="sp-modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <div>
                <span className="sp-badge sp-badge-medium">{selectedSyllabusTest.code}</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--sp-text-primary)', margin: '4px 0 0' }}>
                  {selectedSyllabusTest.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSyllabusTest(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--sp-text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <div className="sp-modal-body">
              {(() => {
                let syllabusInstructor = selectedSyllabusTest.instructor;
                if (
                  !syllabusInstructor ||
                  syllabusInstructor === 'Dr. Test Teacher' ||
                  syllabusInstructor === 'Authorized Instructor' ||
                  syllabusInstructor === 'Abhi Singh' ||
                  syllabusInstructor === candidateUser?.fullName ||
                  syllabusInstructor === candidateUser?.name
                ) {
                  if (selectedSyllabusTest.instructorEmail) {
                    const prefix = selectedSyllabusTest.instructorEmail.split('@')[0];
                    const parts = prefix.split(/[._-]/).filter(Boolean);
                    syllabusInstructor = parts.length > 0
                      ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
                      : 'Course Faculty';
                  } else {
                    syllabusInstructor = 'Course Faculty';
                  }
                }
                const syllabusRole =
                  selectedSyllabusTest.instructorRole &&
                  !selectedSyllabusTest.instructorRole.includes('Year') &&
                  !selectedSyllabusTest.instructorRole.includes('Student')
                    ? selectedSyllabusTest.instructorRole
                    : 'Course Faculty';

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: 'var(--sp-surface-hover)', marginBottom: '1rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                      {getInitials(syllabusInstructor)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--sp-text-primary)' }}>
                        {syllabusInstructor}
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: 'var(--sp-text-muted)' }}>
                        {syllabusRole}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--sp-text-primary)', marginBottom: '6px' }}>
                Instructions from Course Faculty
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--sp-text-secondary)', lineHeight: 1.45, marginBottom: '1rem' }}>
                {selectedSyllabusTest.instructions || 'Webcam proctoring is active throughout the session. Closed-book examination. Max 3 tab switches permitted.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78125rem', color: 'var(--sp-text-secondary)', marginBottom: '1rem' }}>
                <div>&bull; <strong>Duration:</strong> {selectedSyllabusTest.duration || 30} Minutes</div>
                <div>&bull; <strong>Questions:</strong> {selectedSyllabusTest.questions?.length || 0} Questions (MCQ &amp; Written)</div>
                <div>&bull; <strong>Max Tab Switches:</strong> {selectedSyllabusTest.maxTabSwitches || 3}</div>
                <div>&bull; <strong>Proctoring:</strong> Webcam stream, eye gaze deviation, tab lockdown</div>
              </div>
            </div>

            <div className="sp-modal-footer">
              <button type="button" className="sp-btn-subtle" onClick={() => setSelectedSyllabusTest(null)}>
                Close
              </button>
              <button
                type="button"
                className="sp-generate-btn"
                style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
                onClick={() => {
                  const t = selectedSyllabusTest;
                  setSelectedSyllabusTest(null);
                  handleStartExam(t);
                }}
              >
                Launch Examination &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Exam Face & Camera Verification Modal */}
      {verifyingExam && (
        <PreExamVerificationModal
          exam={verifyingExam}
          candidateUser={candidateUser}
          onProceed={(verificationData = {}) => {
            const chosen = verifyingExam;
            setVerifyingExam(null);
            setActiveExam({
              ...chosen,
              referencePhoto: verificationData.referencePhoto || null,
              verifiedAt: verificationData.verifiedAt || new Date().toISOString(),
            });
          }}
          onCancel={() => setVerifyingExam(null)}
        />
      )}

      {/* Formal Proctored Exam Runner (Pixel-Matched Fullscreen Runner) */}
      {activeExam && !examSubmitted && (
        <InteractiveExamRunner
          exam={activeExam}
          examTitle={activeExam.title}
          durationMinutes={activeExam.duration || 45}
          questions={activeExam.questions || []}
          isProctored={true}
          maxTabSwitches={activeExam.maxTabSwitches || 3}
          candidateUser={candidateUser}
          referencePhoto={activeExam.referencePhoto}
          onClose={() => {
            if (window.confirm('Quit active exam session? Your in-progress responses are saved and can be resumed.')) {
              setActiveExam(null);
            }
          }}
          onSubmit={(finalAnswers, timeSpentSec, proctoringReport) =>
            handleSubmitExam(finalAnswers, timeSpentSec, proctoringReport)
          }
        />
      )}

      {/* Post-Exam Scorecard Modal */}
      {examSubmitted && examResult && (
        <div className="sp-modal-backdrop">
          <div className="sp-modal-content" style={{ maxWidth: '520px', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
              {examResult.percentage >= 40 ? '🎉' : '⚠️'}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sp-text-primary)', margin: 0 }}>
              {examResult.percentage >= 40 ? 'Examination Completed Successfully' : 'Submission Recorded'}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--sp-text-muted)', marginTop: '4px' }}>
              {examResult.testTitle} &bull; Code: <strong>{examResult.testCode}</strong>
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: examResult.percentage >= 40 ? 'var(--sp-emerald-bg)' : 'var(--sp-amber-bg)',
                color: examResult.percentage >= 40 ? 'var(--sp-emerald-text)' : 'var(--sp-amber-text)',
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: '1.25rem auto',
              }}
            >
              {examResult.percentage}%
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--sp-text-secondary)', marginBottom: '1.5rem' }}>
              Score: <strong>{examResult.score}</strong> / {examResult.totalMarks} Marks &bull; Proctoring Clean (0% Suspicion)
              {examResult.instructor && (
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--sp-text-muted)' }}>
                  Evaluated under Faculty: <strong style={{ color: 'var(--sp-text-primary)' }}>{examResult.instructor}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                className="sp-btn-subtle"
                onClick={() => {
                  setActiveExam(null);
                  setExamSubmitted(false);
                  setExamResult(null);
                }}
              >
                Back to Tests
              </button>
              <button
                type="button"
                className="sp-generate-btn"
                style={{ width: 'auto', padding: '0.55rem 1.35rem' }}
                onClick={() => {
                  setActiveExam(null);
                  setExamSubmitted(false);
                  setExamResult(null);
                  if (onNavigateTab) onNavigateTab('results');
                }}
              >
                View in Results Archive &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
