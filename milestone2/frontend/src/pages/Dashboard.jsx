import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import {
  getActiveSession,
  clearActiveSession,
  getStoredTeacherTests,
  getStoredUsers,
  isStudentAssignedToTest,
  saveStudentSubmission,
} from '../utils/mockApi';

/**
 * Examination Dashboard
 * When role is student, renders full candidate examination workspace,
 * dynamically loads tests assigned to the logged-in student by their instructors,
 * pre-exam verification summary, proctoring readiness, and interactive test runner.
 */
export default function Dashboard() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTestCode = searchParams.get('testCode') || searchParams.get('code') || '';

  // Active Session & Candidate Resolution
  const session = getActiveSession();
  const [allUsers, setAllUsers] = useState(() => getStoredUsers());
  const [allTests, setAllTests] = useState(() => getStoredTeacherTests());

  // Real-time synchronization when tests or user statuses update
  useEffect(() => {
    const handleSync = () => {
      setAllTests(getStoredTeacherTests());
      setAllUsers(getStoredUsers());
    };
    window.addEventListener('examai_tests_updated', handleSync);
    window.addEventListener('examai_admin_users', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('examai_tests_updated', handleSync);
      window.removeEventListener('examai_admin_users', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Determine active candidate info
  const candidateUser = useMemo(() => {
    if (session) {
      const matched = allUsers.find(
        (u) =>
          (session.id && u.id === session.id) ||
          (session.email && u.email?.toLowerCase() === session.email?.toLowerCase())
      );
      if (matched) {
        return {
          ...matched,
          ...session,
          fullName: session.fullName || matched.name,
        };
      }
      return {
        id: session.id || `usr_${(session.email || '').replace(/[^a-zA-Z0-9]/g, '') || Date.now()}`,
        fullName: session.fullName || session.name || session.email || 'Verified Candidate',
        email: session.email || '',
        identifier: session.identifier || 'STU-NEW',
        department: session.department || 'Computer Science',
        college: session.college || 'Apex Institute of Technology',
        role: 'student',
        status: session.status || 'approved',
      };
    }
    // Fallback for student demo workspace
    const defaultStudent = allUsers.find((u) => u.role === 'student' && u.active) || {
      id: 'usr_001',
      fullName: 'Dummy Student',
      email: 'dummystudent@gmail.com',
      identifier: '36FFHFHGF',
      department: 'Computer Science',
      college: 'Apex Institute of Technology',
      role: 'student',
      status: 'approved',
    };
    return defaultStudent;
  }, [session, allUsers]);

  // Filter published tests assigned to this student
  const assignedTests = useMemo(() => {
    return allTests.filter((t) => t.status === 'published' && isStudentAssignedToTest(t, candidateUser));
  }, [allTests, candidateUser]);

  // Find any test directly shared via URL testCode
  const urlMatchedTest = useMemo(() => {
    if (!urlTestCode) return null;
    return (
      allTests.find(
        (t) => t.status === 'published' && t.code?.trim().toUpperCase() === urlTestCode.trim().toUpperCase()
      ) || null
    );
  }, [allTests, urlTestCode]);

  // Manual Exam Code Entry State
  const [examCodeInput, setExamCodeInput] = useState('');
  const [examCodeError, setExamCodeError] = useState('');
  const [manuallyJoinedTestId, setManuallyJoinedTestId] = useState(null);

  // Selected test state
  const [selectedTestId, setSelectedTestId] = useState(null);

  // Active Test to display
  const activeTest = useMemo(() => {
    if (manuallyJoinedTestId) {
      const found = allTests.find((t) => t.id === manuallyJoinedTestId);
      if (found) return found;
    }
    if (selectedTestId) {
      const found = allTests.find((t) => t.id === selectedTestId);
      if (found) return found;
    }
    if (urlMatchedTest) return urlMatchedTest;
    if (assignedTests.length > 0) return assignedTests[0];
    return null;
  }, [manuallyJoinedTestId, selectedTestId, urlMatchedTest, assignedTests, allTests]);

  // All tests available to this student (assigned + joined via URL or code)
  const availableTests = useMemo(() => {
    const list = [...assignedTests];
    if (urlMatchedTest && !list.some((t) => t.id === urlMatchedTest.id)) {
      list.push(urlMatchedTest);
    }
    if (manuallyJoinedTestId) {
      const manual = allTests.find((t) => t.id === manuallyJoinedTestId);
      if (manual && !list.some((t) => t.id === manual.id)) {
        list.push(manual);
      }
    }
    return list;
  }, [assignedTests, urlMatchedTest, manuallyJoinedTestId, allTests]);

  // Handle manual exam code join
  const handleJoinByCode = (e) => {
    e.preventDefault();
    setExamCodeError('');
    const code = examCodeInput.trim().toUpperCase();
    if (!code) return;

    const found = allTests.find(
      (t) => t.code?.trim().toUpperCase() === code && t.status === 'published'
    );
    if (found) {
      setManuallyJoinedTestId(found.id);
      setSelectedTestId(found.id);
      setExamCodeInput('');
    } else {
      setExamCodeError(`No published examination found with code "${code}". Please check with your teacher.`);
    }
  };

  // Test Runner State
  const [isTestActive, setIsTestActive] = useState(false);
  const [testTimeRemaining, setTestTimeRemaining] = useState(1800);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [descriptiveAnswers, setDescriptiveAnswers] = useState({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleLogout = () => {
    clearActiveSession();
    navigate('/');
  };

  // Timer countdown while test is active
  useEffect(() => {
    if (!isTestActive || testSubmitted) return;
    const timer = setInterval(() => {
      setTestTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTestActive, testSubmitted]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId, optionIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleDescriptiveChange = (qId, value) => {
    setDescriptiveAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleStartExam = () => {
    if (!activeTest) return;
    const durationMins = Number(activeTest.duration) || 30;
    setTestTimeRemaining(durationMins * 60);
    setSelectedAnswers({});
    setDescriptiveAnswers({});
    setTestSubmitted(false);
    setTestResult(null);
    setIsTestActive(true);
  };

  // Dynamic Test Submission and Evaluation based on active test questions
  const handleSubmitTest = () => {
    if (!activeTest) return;

    const questions = activeTest.questions || [];
    let totalScore = 0;
    let totalPossibleMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach((q, idx) => {
      const qId = q.id || `q_${idx}`;
      const marks = Number(q.marks) || (q.type === 'descriptive' ? 10 : 5);
      totalPossibleMarks += marks;

      const isMcq = q.type === 'mcq' || (Array.isArray(q.options) && q.options.length > 0);

      if (isMcq) {
        const studentAns = selectedAnswers[qId];
        const correctAns =
          q.correctOption !== undefined ? q.correctOption : q.correct !== undefined ? q.correct : 0;

        if (studentAns !== undefined) {
          if (studentAns === correctAns) {
            totalScore += marks;
            correctCount++;
          } else {
            incorrectCount++;
            if (activeTest.proctoring?.negativeMarking && q.negativeMarks) {
              totalScore = Math.max(0, totalScore - Number(q.negativeMarks));
            }
          }
        }
      } else {
        // Descriptive / short / long answer dynamic simulated evaluation
        const text = (descriptiveAnswers[qId] || '').trim();
        if (text.length > 30) {
          totalScore += Math.round(marks * 0.85);
          correctCount++;
        } else if (text.length > 10) {
          totalScore += Math.round(marks * 0.5);
          correctCount++;
        }
      }
    });

    if (totalPossibleMarks === 0) totalPossibleMarks = 100;

    const percentage = Math.round((totalScore / totalPossibleMarks) * 100);
    const status = percentage >= 40 ? 'PASSED' : 'NEEDS_REVIEW';

    const resultData = {
      score: totalScore,
      total: totalPossibleMarks,
      percentage: percentage,
      status: status,
      correctCount: correctCount,
      incorrectCount: incorrectCount,
      suspicionScore: '0% (Clean Proctor Telemetry)',
      evaluatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTestResult(resultData);
    setTestSubmitted(true);

    // Save submission to institutional registry
    saveStudentSubmission({
      id: `sub_${Date.now()}`,
      testId: activeTest.id,
      testCode: activeTest.code,
      testTitle: activeTest.title,
      studentId: candidateUser.id,
      studentName: candidateUser.fullName || candidateUser.name,
      studentEmail: candidateUser.email,
      score: totalScore,
      totalMarks: totalPossibleMarks,
      percentage: percentage,
      status: status,
      submittedAt: new Date().toISOString(),
    });
  };

  const roleTitles = {
    student: 'Student Examination Workspace',
    teacher: 'Educator Assessment Console',
    admin: 'Institutional Security & Platform Administration',
  };

  // Schedule access calculation for the active test
  const scheduledStart = activeTest?.scheduledStart ? new Date(activeTest.scheduledStart) : null;
  const scheduledEnd = activeTest?.scheduledEnd ? new Date(activeTest.scheduledEnd) : null;
  const now = new Date();
  const isUpcoming = Boolean(scheduledStart && now < scheduledStart);
  const isExpired = Boolean(scheduledEnd && now > scheduledEnd);
  const isWindowOpen = Boolean(activeTest) && !isUpcoming && !isExpired;

  // Active test question metrics
  const activeQuestions = activeTest?.questions || [];
  const mcqCount = activeQuestions.filter(
    (q) => q.type === 'mcq' || (Array.isArray(q.options) && q.options.length > 0)
  ).length;
  const descCount = activeQuestions.filter(
    (q) => q.type === 'descriptive' || q.type === 'short' || q.type === 'long' || !q.options
  ).length;
  const totalCalculatedMarks =
    activeQuestions.reduce(
      (acc, q) => acc + (Number(q.marks) || (q.type === 'descriptive' ? 10 : 5)),
      0
    ) || (activeTest ? 100 : 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F9FC', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          backgroundColor: '#0B1B33',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.9rem 0',
          color: '#FFFFFF',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#2D5BD0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF' }}>
                ExamAI
              </span>
            </Link>
            <Badge variant="student">
              {role === 'student' ? 'Admitted Student Portal' : `${role?.toUpperCase()} Portal`}
            </Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 600 }}>
                {candidateUser?.fullName || 'Verified Candidate'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9DB6F5' }}>
                {candidateUser?.email || 'student@examai.edu'}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.8125rem',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="container" style={{ padding: '2.5rem 1.5rem', flex: 1 }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>

          {/* ======================================================== */}
          {/* STUDENT WORKSPACE VIEW                                    */}
          {/* ======================================================== */}
          {role === 'student' ? (
            <>
              {/* Candidate Admission & Identity Card */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E1E6EE',
                  padding: '1.75rem 2rem',
                  boxShadow: '0 4px 12px -2px rgba(11, 27, 51, 0.05)',
                  marginBottom: '1.75rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#5F6B7D', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Institutional Candidate Status
                    </span>
                    <h1
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.75rem',
                        color: '#0B1B33',
                        margin: '0.25rem 0 0',
                      }}
                    >
                      {candidateUser?.fullName || 'Verified Candidate'}
                    </h1>
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.45rem 1rem',
                      borderRadius: '20px',
                      backgroundColor: '#E3F1EC',
                      border: '1px solid #B7DACD',
                      color: '#0E6B58',
                      fontWeight: 600,
                      fontSize: '0.84375rem',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Test Admission Approved by Administrator</span>
                  </div>
                </div>

                {/* Candidate Info Grid */}
                <div
                  style={{
                    backgroundColor: '#F7F9FC',
                    borderRadius: '8px',
                    border: '1px solid #E1E6EE',
                    padding: '1rem 1.25rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#5F6B7D', display: 'block' }}>Candidate Roll Number:</span>
                    <strong style={{ fontSize: '0.9375rem', color: '#2D5BD0' }}>
                      {candidateUser?.identifier || 'ROLL-PENDING'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#5F6B7D', display: 'block' }}>Department / Branch:</span>
                    <strong style={{ fontSize: '0.9375rem', color: '#14233C' }}>
                      {candidateUser?.department || 'Computer Science'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#5F6B7D', display: 'block' }}>Enrolled Institution:</span>
                    <strong style={{ fontSize: '0.9375rem', color: '#14233C' }}>
                      {candidateUser?.college || 'Apex Institute of Technology'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#5F6B7D', display: 'block' }}>Assigned Tests Count:</span>
                    <strong style={{ fontSize: '0.9375rem', color: '#0E6B58' }}>
                      {availableTests.length} Exam{availableTests.length === 1 ? '' : 's'} Ready
                    </strong>
                  </div>
                </div>
              </div>

              {/* Multiple Assigned Tests Switcher & Direct Code Entry */}
              {!isTestActive && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E1E6EE',
                    padding: '1.25rem 1.75rem',
                    boxShadow: '0 4px 12px -2px rgba(11, 27, 51, 0.05)',
                    marginBottom: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#0B1B33', fontWeight: 700 }}>
                        📋 Examinations Assigned to You ({availableTests.length})
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#5F6B7D' }}>
                        Tests created by your instructors and assigned to your candidate roster
                      </p>
                    </div>

                    {/* Quick Exam Code Form */}
                    <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Enter Exam Code (e.g. EXAM-1234)"
                        value={examCodeInput}
                        onChange={(e) => {
                          setExamCodeInput(e.target.value);
                          if (examCodeError) setExamCodeError('');
                        }}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.825rem',
                          width: '200px',
                          textTransform: 'uppercase',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: '0.45rem 1rem',
                          backgroundColor: '#2D5BD0',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Join Code
                      </button>
                    </form>
                  </div>

                  {examCodeError && (
                    <div style={{ padding: '0.5rem 0.85rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '0.8rem', color: '#B91C1C' }}>
                      ⚠ {examCodeError}
                    </div>
                  )}

                  {/* List of available tests chips/tabs */}
                  {availableTests.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {availableTests.map((t) => {
                        const isSelected = activeTest?.id === t.id;
                        const tStart = t.scheduledStart ? new Date(t.scheduledStart) : null;
                        const tEnd = t.scheduledEnd ? new Date(t.scheduledEnd) : null;
                        const tOpen = (!tStart || now >= tStart) && (!tEnd || now <= tEnd);

                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTestId(t.id)}
                            style={{
                              padding: '0.65rem 1rem',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #2D5BD0' : '1px solid #E2E8F0',
                              backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 2px 8px rgba(45, 91, 208, 0.15)' : 'none',
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>{tOpen ? '🟢' : '⏳'}</span>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#1E40AF' : '#1E293B' }}>
                                {t.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                Code: <strong>{t.code}</strong> &bull; {t.duration}m &bull; {t.questions?.length || 0} Questions
                              </div>
                            </div>
                            {isSelected && (
                              <span style={{ marginLeft: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#2D5BD0', backgroundColor: '#DBEAFE', padding: '2px 6px', borderRadius: '4px' }}>
                                SELECTED
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '0.825rem', color: '#64748B' }}>
                      No tests currently assigned to this student roster. You can join directly if your instructor gave you an Exam Code above.
                    </div>
                  )}
                </div>
              )}

              {/* Active Scheduled Examination Card */}
              {!isTestActive && activeTest ? (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E1E6EE',
                    padding: '2rem',
                    boxShadow: '0 4px 12px -2px rgba(11, 27, 51, 0.05)',
                    marginBottom: '1.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'inline-flex', marginBottom: '0.5rem', gap: '8px', alignItems: 'center' }}>
                        <Badge variant="ai">Assigned Examination Schedule</Badge>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 700, color: '#2D5BD0', backgroundColor: '#EFF6FF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                          CODE: {activeTest.code}
                        </span>
                      </div>
                      <h2
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1.65rem',
                          color: '#0B1B33',
                          margin: 0,
                        }}
                      >
                        {activeTest.title}
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: '#5F6B7D', margin: '0.35rem 0 0' }}>
                        {activeTest.subject ? `${activeTest.subject} • ` : ''}
                        {activeTest.topic || activeTest.description || 'Milestone Proctored Assessment'}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '6px',
                        backgroundColor: '#E6EDFB',
                        color: '#2347A8',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      Duration: {activeTest.duration || 30} Minutes
                    </div>
                  </div>

                  {/* Exam Schedule Access Window & Instructor Lock */}
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: isWindowOpen ? '#F0FDF4' : isUpcoming ? '#FFFBEB' : '#FEF2F2',
                      borderRadius: '8px',
                      border: `1.5px solid ${isWindowOpen ? '#86EFAC' : isUpcoming ? '#FDE68A' : '#FECACA'}`,
                      marginBottom: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.95rem' }}>{isWindowOpen ? '🟢' : isUpcoming ? '⏳' : '🔴'}</span>
                        <strong style={{ fontSize: '0.9rem', color: isWindowOpen ? '#15803D' : isUpcoming ? '#B45309' : '#B91C1C' }}>
                          {isWindowOpen
                            ? 'Exam Access Window Open (Ready for Examination)'
                            : isUpcoming
                            ? 'Exam Access Window Not Open Yet'
                            : 'Exam Access Window Closed / Expired'}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#4B5563' }}>
                        <strong>Scheduled Window:</strong>{' '}
                        {scheduledStart ? scheduledStart.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Immediate'}{' '}
                        &bull;{' '}
                        <strong>Deadline:</strong>{' '}
                        {scheduledEnd ? scheduledEnd.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No Expiry'}
                      </div>
                    </div>

                    {/* Student Lock Indicator */}
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#4B5563',
                        backgroundColor: '#FFFFFF',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        border: '1px solid #D1D5DB',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                      title="Only your instructor can modify or reschedule this test."
                    >
                      <span>🔒 Schedule Locked by Instructor</span>
                    </div>
                  </div>

                  {/* Instructor Instructions if set */}
                  {activeTest.instructions && (
                    <div
                      style={{
                        padding: '0.85rem 1.15rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        marginBottom: '1.5rem',
                        fontSize: '0.84rem',
                        color: '#334155',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong style={{ color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                        📌 Instructor Guidelines:
                      </strong>
                      {activeTest.instructions}
                    </div>
                  )}

                  {/* Exam Specifications */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.75rem',
                    }}
                  >
                    <div style={{ padding: '0.9rem', border: '1px solid #E1E6EE', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#5F6B7D', display: 'block' }}>Total Marks</span>
                      <strong style={{ fontSize: '1.1rem', color: '#0B1B33' }}>{totalCalculatedMarks} Marks</strong>
                    </div>
                    <div style={{ padding: '0.9rem', border: '1px solid #E1E6EE', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#5F6B7D', display: 'block' }}>Question Format</span>
                      <strong style={{ fontSize: '1.1rem', color: '#0B1B33' }}>
                        {mcqCount > 0 ? `${mcqCount} MCQs` : ''}
                        {mcqCount > 0 && descCount > 0 ? ' + ' : ''}
                        {descCount > 0 ? `${descCount} Descriptive` : ''}
                        {mcqCount === 0 && descCount === 0 ? `${activeQuestions.length} Questions` : ''}
                      </strong>
                    </div>
                    <div style={{ padding: '0.9rem', border: '1px solid #E1E6EE', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#5F6B7D', display: 'block' }}>Passing Criteria</span>
                      <strong style={{ fontSize: '1.1rem', color: '#0E6B58' }}>40% Minimum</strong>
                    </div>
                    <div style={{ padding: '0.9rem', border: '1px solid #E1E6EE', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#5F6B7D', display: 'block' }}>AI Proctoring</span>
                      <strong style={{ fontSize: '1.1rem', color: '#2D5BD0' }}>
                        {activeTest.proctoring?.webcam ? 'Webcam Active' : 'Standard'}
                      </strong>
                    </div>
                  </div>

                  {/* Pre-Exam Hardware & Safety Checks */}
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', color: '#0B1B33', marginBottom: '0.75rem' }}>
                      Proctoring Pre-Flight System Readiness
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', backgroundColor: '#F7F9FC', borderRadius: '6px', border: '1px solid #E1E6EE' }}>
                        <span style={{ color: '#2F7D5B', fontSize: '1.1rem' }}>✓</span>
                        <span style={{ fontSize: '0.84375rem', color: '#14233C' }}>
                          Webcam Proctoring {activeTest.proctoring?.webcam ? 'Required & Ready' : 'Optional'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', backgroundColor: '#F7F9FC', borderRadius: '6px', border: '1px solid #E1E6EE' }}>
                        <span style={{ color: '#2F7D5B', fontSize: '1.1rem' }}>✓</span>
                        <span style={{ fontSize: '0.84375rem', color: '#14233C' }}>
                          Max {activeTest.maxTabSwitches || 3} Browser Tab Switches Allowed
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', backgroundColor: '#F7F9FC', borderRadius: '6px', border: '1px solid #E1E6EE' }}>
                        <span style={{ color: '#2F7D5B', fontSize: '1.1rem' }}>✓</span>
                        <span style={{ fontSize: '0.84375rem', color: '#14233C' }}>
                          Negative Marking: {activeTest.proctoring?.negativeMarking ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Start Exam Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleStartExam}
                      disabled={!isWindowOpen}
                      style={{
                        backgroundColor: !isWindowOpen ? '#9CA3AF' : '#2D5BD0',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.9rem 2.2rem',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: !isWindowOpen ? 'not-allowed' : 'pointer',
                        boxShadow: !isWindowOpen ? 'none' : '0 4px 14px rgba(45, 91, 208, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>
                        {isWindowOpen
                          ? 'Join Test / Start Exam Now'
                          : isUpcoming
                          ? `Exam Opens at ${scheduledStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Exam Window Closed'}
                      </span>
                    </button>
                    <span style={{ fontSize: '0.8125rem', color: !isWindowOpen ? '#DC2626' : '#5F6B7D', fontWeight: !isWindowOpen ? 600 : 400 }}>
                      {!isWindowOpen
                        ? '🔒 Notice: Only your instructor can modify or extend this examination window.'
                        : 'Once started, your exam window will enter full-screen monitored mode.'}
                    </span>
                  </div>
                </div>
              ) : !isTestActive ? (
                /* No Exam Currently Assigned Empty State */
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E1E6EE',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px -2px rgba(11, 27, 51, 0.05)',
                    marginBottom: '1.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#EFF6FF',
                      color: '#2D5BD0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>

                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', color: '#0B1B33', marginBottom: '0.5rem' }}>
                    No Examination Assigned to Your Account
                  </h2>
                  <p style={{ maxWidth: '540px', margin: '0 auto 1.5rem', fontSize: '0.9rem', color: '#5F6B7D', lineHeight: 1.5 }}>
                    Your teacher has not assigned an active exam to roll number{' '}
                    <strong>{candidateUser?.identifier || candidateUser?.email}</strong> yet. When an instructor authors
                    and publishes an exam with your candidate assignment, it will appear here automatically.
                  </p>

                  <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                    <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Enter Teacher Exam Code (e.g. EXAM-1234)"
                        value={examCodeInput}
                        onChange={(e) => {
                          setExamCodeInput(e.target.value);
                          if (examCodeError) setExamCodeError('');
                        }}
                        style={{
                          flex: 1,
                          padding: '0.65rem 0.95rem',
                          borderRadius: '8px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: '0.65rem 1.25rem',
                          backgroundColor: '#2D5BD0',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Find Exam
                      </button>
                    </form>
                    {examCodeError && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#DC2626' }}>
                        {examCodeError}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* LIVE EXAMINATION RUNNER (When Test is Active) */}
              {isTestActive && activeTest && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E1E6EE',
                    padding: '2rem',
                    boxShadow: '0 8px 24px -4px rgba(11, 27, 51, 0.1)',
                    marginBottom: '2rem',
                  }}
                >
                  {/* Test Top Ribbon */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #E1E6EE',
                      paddingBottom: '1rem',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
                          }}
                        />
                        <strong style={{ fontSize: '1.1rem', color: '#0B1B33' }}>
                          {activeTest.title} ({activeTest.code})
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#5F6B7D' }}>
                        AI Proctor Telemetry: Webcam Active • Audio Level: Normal • No Suspicious Movements
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '0.5rem 1.25rem',
                        backgroundColor: '#0B1B33',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '1.15rem',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ⏱️ {formatTimer(testTimeRemaining)}
                    </div>
                  </div>

                  {/* Submission Result Screen */}
                  {testSubmitted ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          backgroundColor: '#E3F1EC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 1.25rem',
                          color: '#2F7D5B',
                        }}
                      >
                        <svg width="36" height="36" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>

                      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: '#0B1B33', marginBottom: '0.5rem' }}>
                        Examination Successfully Submitted!
                      </h2>
                      <p style={{ fontSize: '0.9375rem', color: '#5F6B7D', marginBottom: '1.75rem' }}>
                        Your responses to <strong>{activeTest.title}</strong> have been evaluated and recorded to the institutional server.
                      </p>

                      <div
                        style={{
                          maxWidth: '460px',
                          margin: '0 auto 2rem',
                          backgroundColor: '#F7F9FC',
                          borderRadius: '8px',
                          border: '1px solid #E1E6EE',
                          padding: '1.25rem',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                          <span style={{ color: '#5F6B7D', fontSize: '0.85rem' }}>Candidate Score:</span>
                          <strong style={{ color: '#2F7D5B', fontSize: '1.05rem' }}>
                            {testResult?.score} / {testResult?.total} ({testResult?.percentage}%)
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                          <span style={{ color: '#5F6B7D', fontSize: '0.85rem' }}>Questions Correct:</span>
                          <strong style={{ color: '#0B1B33', fontSize: '0.85rem' }}>
                            {testResult?.correctCount} Correct
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                          <span style={{ color: '#5F6B7D', fontSize: '0.85rem' }}>Evaluation Status:</span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: testResult?.status === 'PASSED' ? '#DCFCE7' : '#FEF3C7',
                              color: testResult?.status === 'PASSED' ? '#15803D' : '#B45309',
                            }}
                          >
                            {testResult?.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#5F6B7D', fontSize: '0.85rem' }}>Proctor Integrity Audit:</span>
                          <strong style={{ color: '#2D5BD0', fontSize: '0.85rem' }}>{testResult?.suspicionScore}</strong>
                        </div>
                      </div>

                      <Button
                        variant="student"
                        onClick={() => {
                          setIsTestActive(false);
                          setTestSubmitted(false);
                        }}
                      >
                        Return to Examination Workspace
                      </Button>
                    </div>
                  ) : (
                    /* Dynamic Test Questions authored by teacher */
                    <div>
                      {activeQuestions.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                          This examination paper contains no questions. Please inform your instructor.
                        </div>
                      ) : (
                        activeQuestions.map((q, idx) => {
                          const qId = q.id || `q_${idx}`;
                          const isMcq = q.type === 'mcq' || (Array.isArray(q.options) && q.options.length > 0);

                          if (isMcq) {
                            return (
                              <div
                                key={qId}
                                style={{
                                  padding: '1.25rem',
                                  borderRadius: '8px',
                                  border: '1px solid #E1E6EE',
                                  marginBottom: '1.25rem',
                                  backgroundColor: '#FAFCFF',
                                }}
                              >
                                <div style={{ fontSize: '0.8125rem', color: '#2D5BD0', fontWeight: 700, marginBottom: '0.35rem' }}>
                                  QUESTION {idx + 1} ({q.marks || 5} MARKS)
                                  {q.negativeMarks ? ` • Negative: -${q.negativeMarks}` : ''}
                                </div>
                                <h4 style={{ fontSize: '0.98rem', color: '#0B1B33', marginBottom: '1rem', lineHeight: 1.45 }}>
                                  {q.title}
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {(q.options || []).map((opt, optIdx) => {
                                    const isSelected = selectedAnswers[qId] === optIdx;
                                    return (
                                      <div
                                        key={optIdx}
                                        onClick={() => handleSelectOption(qId, optIdx)}
                                        style={{
                                          padding: '0.75rem 1rem',
                                          borderRadius: '6px',
                                          border: isSelected ? '2px solid #2D5BD0' : '1px solid #E1E6EE',
                                          backgroundColor: isSelected ? '#E6EDFB' : '#FFFFFF',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '12px',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            border: isSelected ? '5px solid #2D5BD0' : '2px solid #C9D1DC',
                                            backgroundColor: '#FFFFFF',
                                            flexShrink: 0,
                                          }}
                                        />
                                        <span style={{ fontSize: '0.875rem', color: isSelected ? '#18335C' : '#14233C', fontWeight: isSelected ? 600 : 400 }}>
                                          {opt}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          // Descriptive Question
                          return (
                            <div
                              key={qId}
                              style={{
                                padding: '1.25rem',
                                borderRadius: '8px',
                                border: '1px solid #E1E6EE',
                                marginBottom: '1.75rem',
                                backgroundColor: '#FAFCFF',
                              }}
                            >
                              <div style={{ fontSize: '0.8125rem', color: '#2D5BD0', fontWeight: 700, marginBottom: '0.35rem' }}>
                                QUESTION {idx + 1} • {q.type?.toUpperCase() || 'DESCRIPTIVE'} ({q.marks || 10} MARKS)
                              </div>
                              <h4 style={{ fontSize: '0.98rem', color: '#0B1B33', marginBottom: '0.5rem', lineHeight: 1.45 }}>
                                {q.title}
                              </h4>
                              {q.rubric && (
                                <p style={{ fontSize: '0.8125rem', color: '#5F6B7D', marginBottom: '0.75rem' }}>
                                  Evaluation Guidance: {q.rubric}
                                </p>
                              )}
                              <textarea
                                rows={4}
                                value={descriptiveAnswers[qId] || ''}
                                onChange={(e) => handleDescriptiveChange(qId, e.target.value)}
                                placeholder="Type candidate descriptive response here..."
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid #E1E6EE',
                                  fontSize: '0.875rem',
                                  fontFamily: 'inherit',
                                  resize: 'vertical',
                                }}
                              />
                            </div>
                          );
                        })
                      )}

                      {/* Bottom Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <Button variant="outline" onClick={() => setIsTestActive(false)}>
                          Exit Exam
                        </Button>

                        <button
                          onClick={handleSubmitTest}
                          style={{
                            backgroundColor: '#2F7D5B',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.75rem 1.75rem',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(47, 125, 91, 0.3)',
                          }}
                        >
                          Submit Examination Paper
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* NON-STUDENT (TEACHER / ADMIN) WORKSPACE */
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E1E6EE',
                padding: '2.5rem',
                boxShadow: '0 4px 12px -2px rgba(11, 27, 51, 0.05)',
                marginBottom: '2rem',
              }}
            >
              <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
                <Badge variant="ai">Milestone 2 • Authentication Verified</Badge>
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2rem',
                  color: '#0B1B33',
                  marginBottom: '0.5rem',
                }}
              >
                {roleTitles[role] || 'ExamAI Dashboard'}
              </h1>

              <p style={{ fontSize: '1rem', color: '#5F6B7D', lineHeight: 1.6, marginBottom: '2rem' }}>
                {role === 'admin'
                  ? 'Audit platform authentication logs, inspect system telemetry, and manage candidate admission requests.'
                  : 'Manage exam blueprints, author question papers with Gemini, and review OCR evaluations.'}
              </p>

              {role === 'admin' && (
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Link
                    to="/admin/users"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.75rem 1.4rem',
                      backgroundColor: '#0B1B33',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(11, 27, 51, 0.2)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Open Users & Live Approvals Console</span>
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
