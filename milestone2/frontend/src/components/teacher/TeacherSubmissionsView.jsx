import React, { useState, useEffect } from 'react';
import { getAllSubmissions, allowStudentRetake } from '../../utils/mockApi';
import TeacherSubmissionReportModal from './TeacherSubmissionReportModal';

/**
 * TeacherSubmissionsView
 * Educator console displaying assessment results, live integrity violations, and detailed audit timelines.
 * Designed after institutional educator portal standards.
 */
export default function TeacherSubmissionsView() {
  const [submissions, setSubmissions] = useState(() => getAllSubmissions());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [retakeGrantedMap, setRetakeGrantedMap] = useState({});
  const [retakeToast, setRetakeToast] = useState(null);

  const handleAllowRetake = (sub) => {
    allowStudentRetake(sub.testId, sub.studentEmail || sub.studentId);
    setRetakeGrantedMap((prev) => ({ ...prev, [sub.id]: true }));
    setRetakeToast(`✓ Retake granted for ${sub.studentName || 'candidate'} on "${sub.testTitle}"! Candidate can now take this examination again.`);
    setTimeout(() => setRetakeToast(null), 3500);
  };

  useEffect(() => {
    const handleUpdate = () => {
      setSubmissions(getAllSubmissions());
    };
    window.addEventListener('examai_submissions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('examai_submissions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const filtered = submissions.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.studentName && s.studentName.toLowerCase().includes(term)) ||
      (s.studentEmail && s.studentEmail.toLowerCase().includes(term)) ||
      (s.testTitle && s.testTitle.toLowerCase().includes(term)) ||
      (s.testCode && s.testCode.toLowerCase().includes(term))
    );
  });

  // Calculate 4 Overview Metrics
  const totalSubmissions = submissions.length;
  const avgScore = totalSubmissions > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / totalSubmissions)
    : 0;

  const highestScore = totalSubmissions > 0
    ? Math.max(...submissions.map((s) => s.percentage || 0))
    : 0;

  const lowestScore = totalSubmissions > 0
    ? Math.min(...submissions.map((s) => s.percentage || 0))
    : 0;

  const flaggedCount = submissions.filter((s) => {
    const score = s.proctoring?.integrityScore;
    return score !== undefined ? score < 80 : false;
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Retake Toast Banner */}
      {retakeToast && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            fontSize: '0.84375rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{retakeToast}</span>
          <button
            type="button"
            onClick={() => setRetakeToast(null)}
            style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontSize: '1rem', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                color: '#059669',
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '12px',
                textTransform: 'uppercase',
              }}
            >
              • LIVE AUDIT REGISTRY
            </span>
          </div>

          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--tp-text-primary)' }}>
            Assessment Submissions &amp; Proctoring Results
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.84375rem', color: 'var(--tp-text-muted)' }}>
            Status and scores update live. Suspicion scores are for educator review only and never affect marks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="teacher-btn-secondary"
            onClick={() => {
              const rows = [
                ['Student', 'Email', 'Exam Title', 'Code', 'Score', 'Percentage', 'Integrity Score', 'Submitted At'],
                ...submissions.map((s) => [
                  s.studentName,
                  s.studentEmail,
                  s.testTitle,
                  s.testCode,
                  s.score,
                  `${s.percentage}%`,
                  `${s.proctoring?.integrityScore || 100}%`,
                  s.submittedAt,
                ]),
              ];
              const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `assessment_submissions_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>⤓</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Overview Metric Cards (Matching Image 3) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Card 1: Submitted */}
        <div className="teacher-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--tp-text-muted)', fontSize: '0.8125rem' }}>
            <span>Submitted</span>
            <span style={{ fontSize: '1rem' }}>👥</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--tp-text-primary)', marginTop: '4px' }}>
            {totalSubmissions}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', marginTop: '4px' }}>
            Active verified assessments completed
          </div>
        </div>

        {/* Card 2: Average */}
        <div className="teacher-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--tp-text-muted)', fontSize: '0.8125rem' }}>
            <span>Average Score</span>
            <span style={{ fontSize: '1rem' }}>⏱</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--tp-text-primary)', marginTop: '4px' }}>
            {totalSubmissions > 0 ? `${avgScore}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', marginTop: '4px' }}>
            Median performance rating
          </div>
        </div>

        {/* Card 3: Highest */}
        <div className="teacher-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--tp-text-muted)', fontSize: '0.8125rem' }}>
            <span>Highest Score</span>
            <span style={{ fontSize: '1rem' }}>🏆</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {totalSubmissions > 0 ? `${highestScore}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', marginTop: '4px' }}>
            Lowest: {totalSubmissions > 0 ? `${lowestScore}%` : '—'}
          </div>
        </div>

        {/* Card 4: Flagged Sessions */}
        <div className="teacher-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--tp-text-muted)', fontSize: '0.8125rem' }}>
            <span>Flagged Sessions</span>
            <span style={{ fontSize: '1rem' }}>🛡️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: flaggedCount > 0 ? '#DC2626' : '#059669', marginTop: '4px' }}>
            {flaggedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', marginTop: '4px' }}>
            {flaggedCount > 0 ? `${flaggedCount} awaiting your audit review` : 'All sessions verified clean'}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--tp-text-primary)' }}>
          Candidate Attempts
        </h3>

        <div style={{ width: '320px' }}>
          <input
            type="text"
            className="teacher-input"
            placeholder="Search student, test code, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Submissions Table */}
      {filtered.length === 0 ? (
        <div className="teacher-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📋🛡️</div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--tp-text-primary)' }}>
            No Exam Submissions Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.84375rem', color: 'var(--tp-text-muted)', maxWidth: '420px', marginInline: 'auto' }}>
            When students complete active examinations, their scorecards and complete AI proctoring incident reports will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="teacher-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--tp-surface-hover)', borderBottom: '1px solid var(--tp-border)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>STUDENT</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>SCORE</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>SUSPICION / INTEGRITY</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>SUBMITTED</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)' }}>TIME TAKEN</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => {
                  const proctoring = sub.proctoring || {};
                  const integrityScore = proctoring.integrityScore !== undefined ? proctoring.integrityScore : 100;
                  const isClean = integrityScore >= 80;
                  const totalIncidents = proctoring.incidentTimeline?.length || 0;

                  return (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--tp-border-light)' }}>
                      {/* Student info */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: '#E0E7FF',
                              color: '#4338CA',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {(sub.studentName || 'ST').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--tp-text-primary)' }}>
                              {sub.studentName || 'Student'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>
                              {sub.studentEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#ECFDF5',
                            color: '#059669',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }} />
                          Completed
                        </span>
                      </td>

                      {/* Score */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: sub.percentage >= 40 ? '#059669' : '#DC2626' }}>
                          {sub.score} / {sub.totalMarks} ({sub.percentage}%)
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--tp-text-muted)' }}>
                          {sub.testTitle} ({sub.testCode})
                        </span>
                      </td>

                      {/* Suspicion / Integrity Score */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: isClean ? '#ECFDF5' : '#FEF3C7',
                              color: isClean ? '#059669' : '#D97706',
                            }}
                          >
                            {integrityScore}% {isClean ? 'Clean ✓' : '⚠️ Suspicious'}
                          </span>
                        </div>
                        {totalIncidents > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                            {totalIncidents} proctoring event{totalIncidents > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>

                      {/* Submitted */}
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)', fontSize: '0.78rem' }}>
                        {sub.timestampDisplay || 'Just now'}
                      </td>

                      {/* Time taken */}
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--tp-text-muted)', fontSize: '0.78rem' }}>
                        {sub.timeTakenDisplay || '15 mins'}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="teacher-btn-secondary"
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.74rem',
                              color: retakeGrantedMap[sub.id] ? '#059669' : '#D97706',
                              borderColor: retakeGrantedMap[sub.id] ? '#A7F3D0' : '#FDE68A',
                              backgroundColor: retakeGrantedMap[sub.id] ? '#ECFDF5' : '#FFFBEB',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '8px',
                            }}
                            onClick={() => handleAllowRetake(sub)}
                            title="Permit this candidate to take this exam again (resets block)"
                          >
                            <span>{retakeGrantedMap[sub.id] ? '✓ Retake Granted' : '🔄 Allow Retake'}</span>
                          </button>
                          <button
                            type="button"
                            className="teacher-btn-secondary"
                            style={{
                              padding: '0.4rem 0.95rem',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 700,
                              borderRadius: '8px',
                            }}
                            onClick={() => setSelectedSubmission(sub)}
                          >
                            <span>Review Attempt</span>
                            <span>&rarr;</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proctoring Audit Detail Modal (Matching Image 2) */}
      {selectedSubmission && (
        <TeacherSubmissionReportModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}
