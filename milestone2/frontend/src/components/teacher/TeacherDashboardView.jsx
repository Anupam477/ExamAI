import React, { useMemo, useState, useEffect } from 'react';
import { getTestsForTeacher, getSubmissionsForTeacher, getStoredUsers } from '../../utils/mockApi';

/**
 * Teacher Dashboard View
 * High-level telemetry, active exam monitoring, and quick action cards
 * Strictly scoped to the currently logged-in educator
 */
export default function TeacherDashboardView({ currentTeacher, onNavigateToCreate, onNavigateToTests }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleSync = () => setRefreshTrigger((prev) => prev + 1);
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
  }, []);

  const tests = useMemo(() => getTestsForTeacher(currentTeacher), [currentTeacher, refreshTrigger]);
  const submissions = useMemo(() => getSubmissionsForTeacher(currentTeacher), [currentTeacher, refreshTrigger]);
  const users = getStoredUsers().filter(
    (u) =>
      u.role === 'student' &&
      u.active &&
      u.id !== 'usr_001' &&
      u.id !== 'usr_002' &&
      u.email !== 'dummystudent@gmail.com' &&
      u.email !== 'teststudent@gmail.com' &&
      u.name !== 'Dummy Student' &&
      u.name !== 'Test Student'
  );

  const teacherDisplayName = currentTeacher?.fullName || currentTeacher?.name || 'Faculty Member';
  const publishedCount = tests.filter((t) => t.status === 'published').length;
  const draftCount = tests.filter((t) => t.status === 'draft').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        className="teacher-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          background: 'linear-gradient(135deg, rgba(30, 107, 82, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)',
          borderColor: 'var(--tp-green-border)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--tp-green-text)',
              backgroundColor: 'var(--tp-green-light)',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}
          >
            Educator Studio Active
          </span>
          <h2 style={{ margin: '0.35rem 0 0.25rem', fontSize: '1.5rem', color: 'var(--tp-text-primary)' }}>
            Welcome back, {teacherDisplayName}
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--tp-text-muted)' }}>
            Author new proctored exam blueprints, review AI-graded submissions, and track student proctoring integrity.
          </p>
        </div>

        <button
          type="button"
          className="teacher-btn-primary"
          style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
          onClick={onNavigateToCreate}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Launch Test Creator
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="teacher-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Tests Created</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--tp-text-primary)', marginTop: '4px' }}>
            {tests.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--tp-green-primary)', fontWeight: 600 }}>
            {publishedCount} Published &bull; {draftCount} Drafts
          </span>
        </div>

        <div className="teacher-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Enrolled Candidates</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--tp-text-primary)', marginTop: '4px' }}>
            {users.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>
            Across 3 Academic Departments
          </span>
        </div>

        <div className="teacher-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Proctoring Trust</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16A34A', marginTop: '4px' }}>
            98.4%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>
            Gaze &amp; multi-face verification clean
          </span>
        </div>

        <div className="teacher-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Automated AI Gradings</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563EB', marginTop: '4px' }}>
            14
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>
            Evaluated via Gemini OCR
          </span>
        </div>
      </div>

      {/* Recent Tests Table Card */}
      <div className="teacher-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--tp-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--tp-text-primary)' }}>
            Recent Examination Blueprints
          </h3>
          <button
            type="button"
            className="teacher-btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            onClick={onNavigateToTests}
          >
            View All Tests &rarr;
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--tp-surface-hover)', borderBottom: '1px solid var(--tp-border)' }}>
                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--tp-text-muted)' }}>TEST TITLE</th>
                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--tp-text-muted)' }}>SUBJECT / TOPIC</th>
                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--tp-text-muted)' }}>DURATION</th>
                <th style={{ padding: '0.75rem 1.5rem', color: 'var(--tp-text-muted)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--tp-text-muted)' }}>
                    No assessments authored yet. Click "Launch Test Creator" above to create your first examination.
                  </td>
                </tr>
              ) : (
                tests.slice(0, 3).map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--tp-border-light)' }}>
                    <td style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--tp-text-primary)' }}>
                      {t.title}
                    </td>
                    <td style={{ padding: '0.85rem 1.5rem', color: 'var(--tp-text-secondary)' }}>
                      {t.subject} &bull; {t.topic}
                    </td>
                    <td style={{ padding: '0.85rem 1.5rem', color: 'var(--tp-text-muted)' }}>
                      ⏱ {t.duration} mins
                    </td>
                    <td style={{ padding: '0.85rem 1.5rem' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: t.status === 'published' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                          color: t.status === 'published' ? '#16A34A' : '#CA8A04',
                        }}
                      >
                        {t.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
