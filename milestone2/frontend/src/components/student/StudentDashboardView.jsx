import React, { useMemo, useState, useEffect } from 'react';
import {
  getStoredTeacherTests,
  isStudentAssignedToTest,
  getStudentSubmissions,
  isTestReassignedForStudent,
  getStudentPracticeHistory,
} from '../../utils/mockApi';

/**
 * Student Dashboard Overview View
 * Provides candidate credentials summary, proctoring health status,
 * enrolled upcoming tests, and quick AI practice shortcuts.
 */
export default function StudentDashboardView({ candidateUser, onNavigateTab }) {
  const allTests = getStoredTeacherTests();
  const assignedTests = useMemo(() => {
    return allTests.filter((t) => t.status === 'published' && isStudentAssignedToTest(t, candidateUser));
  }, [allTests, candidateUser]);

  const [submissions, setSubmissions] = useState(() => getStudentSubmissions(candidateUser));
  const [practiceCount, setPracticeCount] = useState(() => getStudentPracticeHistory(candidateUser).length);

  // Keep dashboard metrics strictly user-scoped and live
  useEffect(() => {
    const refreshData = () => {
      setSubmissions(getStudentSubmissions(candidateUser));
      setPracticeCount(getStudentPracticeHistory(candidateUser).length);
    };

    refreshData();
    window.addEventListener('examai_student_test_completed', refreshData);
    window.addEventListener('examai_submissions_updated', refreshData);
    window.addEventListener('examai_practice_history_updated', refreshData);

    return () => {
      window.removeEventListener('examai_student_test_completed', refreshData);
      window.removeEventListener('examai_submissions_updated', refreshData);
      window.removeEventListener('examai_practice_history_updated', refreshData);
    };
  }, [candidateUser]);

  return (
    <div>
      {/* Welcome & Identity Hero */}
      <div
        className="sp-card"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
          borderColor: 'var(--sp-brand-border)',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--sp-brand-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Institutional Candidate Portal
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--sp-text-primary)', margin: '0.25rem 0' }}>
              Welcome back, {candidateUser?.fullName || candidateUser?.name || 'Candidate'}!
            </h1>
            <p style={{ margin: 0, fontSize: '0.84375rem', color: 'var(--sp-text-muted)' }}>
              {candidateUser?.college || 'Apex Institute of Technology'} &bull; {candidateUser?.department || 'Computer Science'} ({candidateUser?.identifier || 'CS-2026-092'})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="sp-generate-btn"
              onClick={() => onNavigateTab('practice')}
              style={{ padding: '0.6rem 1.15rem', fontSize: '0.84375rem' }}
            >
              <span>✦</span> Start AI Practice
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        <div className="sp-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)', fontWeight: 600 }}>ENROLLED TESTS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--sp-brand-primary)', margin: '4px 0' }}>
            {assignedTests.length}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--sp-text-muted)' }}>Scheduled institutional exams</div>
        </div>

        <div className="sp-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)', fontWeight: 600 }}>PRACTICE SESSIONS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--sp-accent-teal)', margin: '4px 0' }}>
            {practiceCount}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--sp-text-muted)' }}>Self-paced AI quizzes taken</div>
        </div>

        <div
          className="sp-card"
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 140ms ease' }}
          onClick={() => onNavigateTab('results')}
          title="Click to view full results archive"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)', fontWeight: 600 }}>COMPLETED EXAMS</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--sp-brand-primary)', fontWeight: 700 }}>View Results &rarr;</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--sp-accent-amber)', margin: '4px 0' }}>
            {submissions.length + practiceCount}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--sp-text-muted)' }}>Graded exams &amp; practice records</div>
        </div>

        <div className="sp-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)', fontWeight: 600 }}>PROCTOR STATUS</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sp-accent-emerald)', margin: '6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Ready &amp; Verified
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--sp-text-muted)' }}>Webcam &amp; audio telemetry pass</div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Tests & Proctor Readiness */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '1.75rem' }}>
        {/* Left: Assigned Tests */}
        <div className="sp-card">
          <div className="sp-card-header">
            <h3 className="sp-card-title">Enrolled Institutional Assessments</h3>
            <button
              type="button"
              className="sp-btn-subtle"
              onClick={() => onNavigateTab('tests')}
            >
              View all &rarr;
            </button>
          </div>

          {assignedTests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--sp-text-muted)' }}>
              No institutional assessments currently assigned to your cohort.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assignedTests.slice(0, 3).map((test) => {
                const sub = submissions.find(
                  (s) => s.testId === test.id || (s.testCode && s.testCode.toUpperCase() === (test.code || '').toUpperCase())
                );
                const isReassigned = isTestReassignedForStudent(test, sub, candidateUser);

                return (
                  <div
                    key={test.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--sp-border)',
                      backgroundColor: 'var(--sp-surface-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="sp-badge sp-badge-medium">{test.difficulty || 'Medium'}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sp-brand-primary)' }}>
                          {test.code}
                        </span>
                        {isReassigned && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                            }}
                          >
                            🔄 Re-assigned
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--sp-text-primary)', marginTop: '4px' }}>
                        {test.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)', marginTop: '2px' }}>
                        {test.duration} mins &bull; {test.questions?.length || 0} questions
                        {sub && !isReassigned && ` • Recorded Score: ${sub.score}/${sub.totalMarks}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="sp-btn-subtle"
                      style={{
                        backgroundColor: isReassigned ? '#D97706' : 'var(--sp-brand-primary)',
                        color: '#FFFFFF',
                        borderColor: isReassigned ? '#D97706' : 'var(--sp-brand-primary)',
                      }}
                      onClick={() => onNavigateTab('tests')}
                    >
                      {isReassigned ? 'Re-test Ready →' : sub ? 'View Test →' : 'Enter Exam →'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: AI Practice Callout Card */}
        <div
          className="sp-card"
          style={{
            background: 'linear-gradient(135deg, var(--sp-brand-light) 0%, var(--sp-surface) 100%)',
            borderColor: 'var(--sp-brand-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <h3 className="sp-card-title" style={{ fontSize: '1.0625rem' }}>
              Daily AI Practice
            </h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--sp-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Sharpen your knowledge with instantaneous practice tests powered by ChatGPT and Gemini. Zero records sent to instructors.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="sp-btn-subtle"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigateTab('practice')}
            >
              Practice Laws of Thermodynamics
            </button>
            <button
              type="button"
              className="sp-btn-subtle"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigateTab('practice')}
            >
              Practice OOPS &amp; Data Structures
            </button>
            <button
              type="button"
              className="sp-generate-btn"
              style={{ marginTop: '0.5rem', padding: '0.65rem' }}
              onClick={() => onNavigateTab('practice')}
            >
              Create Custom AI Test &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
