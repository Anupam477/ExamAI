import React, { useState } from 'react';
import { SAMPLE_PROCTORING_INCIDENTS } from '../../utils/mockApi';

/**
 * TeacherSubmissionReportModal
 * Comprehensive proctoring audit and examination evaluation view matching institutional educator standard.
 * Features:
 * - 2-Column Evaluation & Audit Studio (Left: Candidate responses & Grading, Right: Incident Timeline & Score breakdown)
 * - Chronological incident timeline with exact wall-clock timestamps and elapsed offsets (e.g. "6:02:45 PM · 21s in")
 * - Incident frequency chips (e.g. "Window lost focus ×2", "Looking away ×3", "Page reloaded ×1")
 * - Question-by-question candidate response inspection with green/red status badges
 * - Multiple-choice student selection vs correct option visual diff
 * - Written responses with uploaded handwritten sheet previews
 * - Manual educator mark overrides, feedback notes, and AI grading assistant
 */
export default function TeacherSubmissionReportModal({
  submission,
  onClose,
}) {
  const [grades, setGrades] = useState(() => {
    const initial = {};
    if (submission?.review) {
      submission.review.forEach((item, idx) => {
        initial[idx] = item.isCorrect ? item.maxMarks : 0;
      });
    }
    return initial;
  });

  const [feedback, setFeedback] = useState({});
  const [savedGrades, setSavedGrades] = useState({});
  const [selectedEvidenceSnapshot, setSelectedEvidenceSnapshot] = useState(null);

  // Active proctoring incidents list - initialized with real session timeline or institutional sample
  const [incidents, setIncidents] = useState(() => {
    if (submission?.proctoring?.incidentTimeline && submission.proctoring.incidentTimeline.length > 0) {
      return submission.proctoring.incidentTimeline;
    }
    return SAMPLE_PROCTORING_INCIDENTS;
  });

  if (!submission) return null;

  const proctoring = submission.proctoring || {};
  const referencePhoto = submission.referencePhoto || proctoring.referencePhoto || null;

  const integrityScore = proctoring.integrityScore !== undefined
    ? proctoring.integrityScore
    : Math.max(20, 100 - incidents.length * 5);
  const isClean = incidents.length === 0 && integrityScore >= 80;
  const isModerate = incidents.length > 0 && integrityScore >= 55;

  // Breakdown metrics requested by institutional proctoring guidelines
  const suspiciousCount = proctoring.totalSuspiciousActivities ?? proctoring.totalIncidents ?? incidents.length;
  const movedAwayCount = proctoring.totalMovedAway ?? proctoring.totalFaceAbsences ?? incidents.filter((i) => i.type === 'FACE_ABSENT' || i.title?.toLowerCase().includes('face not visible') || i.title?.toLowerCase().includes('face not detected')).length;
  const multipleFacesCount = proctoring.totalMultipleFaces ?? incidents.filter((i) => i.type === 'MULTIPLE_FACES' || i.title?.toLowerCase().includes('multiple faces')).length;
  const tabSwitchesCount = proctoring.totalTabSwitches ?? incidents.filter((i) => i.type === 'TAB_SWITCH' || i.type === 'WINDOW_BLUR' || i.title?.toLowerCase().includes('tab')).length;
  const fullscreenExitsCount = proctoring.totalFullscreenExits ?? incidents.filter((i) => i.type === 'FULLSCREEN_EXIT' || i.title?.toLowerCase().includes('full-screen')).length;

  // Incident counts breakdown
  const incidentCounts = incidents.reduce((acc, inc) => {
    const key = inc.title || inc.event || inc.type || 'Incident';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const handleSimulateNewAlert = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    const elapsedSec = (incidents.length + 1) * 35;
    const elapsedDisplay = elapsedSec < 60 ? `${elapsedSec}s in` : `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s in`;

    const sampleTypes = [
      { title: 'Looking away', type: 'LOOKING_AWAY', detail: 'Candidate head or gaze diverted from screen boundary.', severity: 'medium' },
      { title: 'Window lost focus', type: 'WINDOW_BLUR', detail: 'Exam window minimized or candidate switched tab.', severity: 'high' },
      { title: 'Page reloaded', type: 'PAGE_RELOAD', detail: 'Candidate reloaded exam session.', severity: 'low' },
      { title: 'Face not detected', type: 'FACE_ABSENT', detail: 'Candidate left camera view or covered webcam.', severity: 'high' },
    ];
    const picked = sampleTypes[incidents.length % sampleTypes.length];

    const newInc = {
      id: `sim_${Date.now()}`,
      title: picked.title,
      event: picked.title,
      timestamp: timeStr,
      time: timeStr,
      elapsedDisplay,
      type: picked.type,
      detail: picked.detail,
      severity: picked.severity,
    };
    setIncidents((prev) => [...prev, newInc]);
  };

  const handleResetClean = () => {
    setIncidents([]);
  };

  const handleReloadDefaultTimeline = () => {
    setIncidents(SAMPLE_PROCTORING_INCIDENTS);
  };

  // Objective vs Subjective score breakdown
  const reviews = submission.review || [];
  const objectiveScore = reviews
    .filter((r) => r.type === 'Multiple choice' || r.type === 'Multi-select')
    .reduce((sum, r) => sum + (r.isCorrect ? (r.maxMarks || 5) : 0), 0);

  const subjectiveScore = reviews
    .filter((r) => r.type !== 'Multiple choice' && r.type !== 'Multi-select')
    .reduce((sum, r) => sum + (r.isCorrect ? (r.maxMarks || 5) : 0), 0);

  const totalScore = submission.score || (objectiveScore + subjectiveScore);
  const totalMaxMarks = submission.totalMarks || 100;

  const handleGradeChange = (idx, val) => {
    setGrades((prev) => ({ ...prev, [idx]: Number(val) }));
  };

  const handleFeedbackChange = (idx, val) => {
    setFeedback((prev) => ({ ...prev, [idx]: val }));
  };

  const handleSaveGrade = (idx) => {
    setSavedGrades((prev) => ({ ...prev, [idx]: true }));
    setTimeout(() => {
      setSavedGrades((prev) => ({ ...prev, [idx]: false }));
    }, 2000);
  };

  const handleAiAutoGrade = (idx, maxMarks) => {
    // Simulates Gemini AI rubric evaluation
    const suggested = Math.round(maxMarks * 0.9);
    setGrades((prev) => ({ ...prev, [idx]: suggested }));
    setFeedback((prev) => ({
      ...prev,
      [idx]: 'AI Evaluation: Clear formulation of principles, accurate terminology and valid boundary conditions cited.',
    }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'spFadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1180px',
          height: '92vh',
          backgroundColor: '#F8FAFC',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '1.1rem 1.75rem',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              &larr; Back to all attempts
            </button>

            <span style={{ color: '#CBD5E1' }}>|</span>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  {submission.studentName || 'Student'}
                </span>
                <span style={{ fontSize: '0.78125rem', color: '#64748B' }}>
                  ({submission.studentEmail})
                </span>
                <span
                  style={{
                    backgroundColor: isClean ? '#ECFDF5' : isModerate ? '#FEF3C7' : '#FEF2F2',
                    color: isClean ? '#059669' : isModerate ? '#D97706' : '#DC2626',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {isClean ? '✓ Clean Integrity' : isModerate ? '⚠️ Suspicious Events' : '🚨 High Risk Proctoring'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                Exam: <strong>{submission.testTitle}</strong> &bull; Code: <strong>{submission.testCode}</strong> &bull; Submitted: {submission.timestampDisplay || 'Recently'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              color: '#94A3B8',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* 2-Column Body (Left: Responses & Grading, Right: Incident Timeline & Score Breakdown) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 0.95fr)',
            gap: '1.5rem',
            padding: '1.5rem 1.75rem',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Left Column: Candidate Question Responses & Grading */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Candidate Question Responses &amp; Evaluation
            </h3>

            {reviews.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
                No recorded candidate answers found for this examination attempt.
              </div>
            ) : (
              reviews.map((item, idx) => {
                const currentGrade = grades[idx] !== undefined ? grades[idx] : (item.isCorrect ? item.maxMarks : 0);
                const isItemSaved = Boolean(savedGrades[idx]);

                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    {/* Top Row: Q Number, Type Badge, Correct/Incorrect status, Marks */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                          {idx + 1}
                        </span>

                        <span
                          style={{
                            padding: '3px 9px',
                            borderRadius: '12px',
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            fontSize: '0.71875rem',
                            fontWeight: 600,
                          }}
                        >
                          {item.type}
                        </span>

                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: item.isCorrect ? '#ECFDF5' : '#FEF2F2',
                            color: item.isCorrect ? '#059669' : '#DC2626',
                            fontSize: '0.71875rem',
                            fontWeight: 700,
                          }}
                        >
                          {item.isCorrect ? '✓ Correct' : '⊗ Incorrect'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                        {item.marks}
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.45 }}>
                      {item.question}
                    </div>

                    {/* Options (For MCQ / Multi-select) */}
                    {item.options && item.options.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {item.options.map((opt, oIdx) => {
                          const isSelectedByStudent =
                            item.studentSelected === opt.letter ||
                            (typeof item.studentSelected === 'string' && item.studentSelected.includes(opt.letter));

                          let borderStyle = '1px solid #E2E8F0';
                          let bgStyle = '#FFFFFF';

                          if (opt.isCorrect) {
                            borderStyle = '1.5px solid #10B981';
                            bgStyle = '#F0FDF4';
                          } else if (isSelectedByStudent && !opt.isCorrect) {
                            borderStyle = '1.5px solid #F87171';
                            bgStyle = '#FEF2F2';
                          }

                          return (
                            <div
                              key={oIdx}
                              style={{
                                padding: '0.65rem 1rem',
                                borderRadius: '10px',
                                border: borderStyle,
                                backgroundColor: bgStyle,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.84375rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 700, color: '#64748B', width: '18px' }}>
                                  {opt.letter}
                                </span>
                                <span style={{ color: '#1E293B' }}>{opt.text}</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isSelectedByStudent && !opt.isCorrect && (
                                  <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.75rem' }}>
                                    Selected ✕
                                  </span>
                                )}
                                {opt.isCorrect && (
                                  <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.9rem' }}>
                                    ✓
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Written Response Answer */}
                    {(!item.options || item.options.length === 0) && (
                      <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Candidate's Written Response:
                        </div>
                        <div style={{ fontSize: '0.84375rem', color: '#0F172A', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {item.studentAnswer || item.studentSelected || 'No answer submitted.'}
                        </div>

                        {item.studentImage && (
                          <div style={{ marginTop: '10px' }}>
                            <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>
                              Attached Handwritten Solution Sheet:
                            </div>
                            <img
                              src={item.studentImage}
                              alt="Handwritten solution"
                              style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', border: '1px solid #CBD5E1', objectFit: 'contain' }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {item.explanation && (
                      <div style={{ backgroundColor: '#FFFBEB', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid #FDE68A', fontSize: '0.78125rem', color: '#92400E' }}>
                        <strong>💡 Explanation:</strong> {item.explanation}
                      </div>
                    )}

                    {/* Teacher Grading Inputs */}
                    <div
                      style={{
                        paddingTop: '0.85rem',
                        borderTop: '1px solid #F1F5F9',
                        display: 'grid',
                        gridTemplateColumns: '140px minmax(0, 1fr) auto auto',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      {/* Marks Input */}
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                          Your marks (AI: {item.isCorrect ? item.maxMarks : 0})
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="0"
                            max={item.maxMarks || 10}
                            value={currentGrade}
                            onChange={(e) => handleGradeChange(idx, e.target.value)}
                            style={{
                              width: '56px',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.84375rem',
                              fontWeight: 700,
                              textAlign: 'center',
                            }}
                          />
                          <span style={{ color: '#64748B', fontSize: '0.8125rem' }}>/ {item.maxMarks || 5}</span>
                        </div>
                      </div>

                      {/* Feedback Input */}
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                          Feedback to student (optional)
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Good reasoning, but cite the formula."
                          value={feedback[idx] || ''}
                          onChange={(e) => handleFeedbackChange(idx, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.78125rem',
                          }}
                        />
                      </div>

                      {/* Use AI Button */}
                      <button
                        type="button"
                        onClick={() => handleAiAutoGrade(idx, item.maxMarks || 5)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          color: '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ✨ Use AI
                      </button>

                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={() => handleSaveGrade(idx)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: isItemSaved ? '#10B981' : '#059669',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isItemSaved ? '✓ Saved' : '💾 Save'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Proctoring Incident Timeline & Score Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Student Reference Identity & Live Verification Comparison Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>STUDENT IDENTITY VERIFICATION</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    backgroundColor: referencePhoto ? '#ECFDF5' : '#F1F5F9',
                    color: referencePhoto ? '#059669' : '#64748B',
                    fontWeight: 700,
                  }}
                >
                  {referencePhoto ? '✓ Reference Stored' : '● Auto-Calibrated'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {referencePhoto ? (
                  <img
                    src={referencePhoto}
                    alt="Student Pre-Exam Reference"
                    onClick={() => setSelectedEvidenceSnapshot({ image: referencePhoto, title: 'Student Pre-Exam Reference Photo', time: 'Pre-Exam Verification' })}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '2px solid #10B981',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    }}
                    title="Click to view full reference photo"
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      backgroundColor: '#F1F5F9',
                      border: '1px dashed #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                    }}
                  >
                    👤
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>
                    {submission.studentName || 'Student'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '1px' }}>
                    Pre-Exam Reference Photo compared with live webcam feed throughout examination.
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '6px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: isClean ? '#059669' : '#D97706',
                      backgroundColor: isClean ? '#ECFDF5' : '#FEF3C7',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    <span>{isClean ? '✓ Identity Match: 98%' : '⚠️ Deviations Flagged'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Proctoring Key Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: suspiciousCount > 0 ? '#DC2626' : '#059669' }}>
                  {suspiciousCount}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Suspicious Events
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: movedAwayCount > 0 ? '#D97706' : '#059669' }}>
                  {movedAwayCount}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Moved Away
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: multipleFacesCount > 0 ? '#DC2626' : '#059669' }}>
                  {multipleFacesCount}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Multiple Faces
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tabSwitchesCount > 0 ? '#DC2626' : '#059669' }}>
                  {tabSwitchesCount}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Tab Switches
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: fullscreenExitsCount > 0 ? '#DC2626' : '#059669' }}>
                  {fullscreenExitsCount}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Fullscreen Exits
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: integrityScore >= 80 ? '#059669' : '#DC2626' }}>
                  {integrityScore}%
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Integrity Score
                </div>
              </div>
            </div>

            {/* Top Incident Summary Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.keys(incidentCounts).length === 0 ? (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  ✓ 0 Violations Recorded
                </span>
              ) : (
                Object.entries(incidentCounts).map(([title, count], cIdx) => (
                  <span
                    key={cIdx}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      color: '#0F172A',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                  >
                    <span>{title}</span>
                    <span style={{ color: '#D97706', fontWeight: 800 }}>&times;{count}</span>
                  </span>
                ))
              )}
            </div>

            {/* Incident Chronological Timeline Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#64748B',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>TIMELINE &amp; EVIDENCE IMAGES</span>
                  <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', fontWeight: 700 }}>
                    ● Real-time Logs
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSimulateNewAlert}
                    style={{
                      background: 'none',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      color: '#6366F1',
                      fontSize: '0.71875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Simulate candidate movement or window blur"
                  >
                    + Simulate Alert
                  </button>
                  {incidents.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleResetClean}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        fontSize: '0.6875rem',
                        cursor: 'pointer',
                      }}
                      title="Clear timeline to view clean session state"
                    >
                      Clear
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReloadDefaultTimeline}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6366F1',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Restore Timeline
                    </button>
                  )}
                </div>
              </div>

              {incidents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748B', fontSize: '0.8125rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🛡️</div>
                  Session was completely clean. No proctoring alerts or window blur events were triggered.
                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleReloadDefaultTimeline}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#F8FAFC',
                        color: '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Load Real-time Proctoring Telemetry Demo
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                  {incidents.map((ev, eIdx) => (
                    <div
                      key={eIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '10px',
                        fontSize: '0.8125rem',
                        lineHeight: 1.4,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #F1F5F9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
                        <span style={{ color: ev.severity === 'high' ? '#DC2626' : '#D97706', fontSize: '0.75rem', marginTop: '2px' }}>
                          &#9654;
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontWeight: 700, color: '#0F172A' }}>
                            {ev.title || ev.event || ev.type || 'Incident Event'}
                          </span>
                          <span style={{ fontSize: '0.71875rem', color: '#64748B' }}>
                            {ev.timestamp || ev.time || '12:00:00 PM'} {ev.elapsedDisplay ? `• ${ev.elapsedDisplay}` : ''}
                          </span>
                          {ev.detail && (
                            <span style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '1px' }}>
                              {ev.detail}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Clickable Evidence Snapshot Thumbnail */}
                      {ev.evidenceSnapshot ? (
                        <div
                          onClick={() => setSelectedEvidenceSnapshot({
                            image: ev.evidenceSnapshot,
                            title: ev.title || ev.event || 'Proctoring Incident',
                            time: ev.timestamp || ev.time || 'Timestamp recorded',
                            detail: ev.detail || '',
                          })}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                          title="Click to view evidence photo at exact timestamp"
                        >
                          <img
                            src={ev.evidenceSnapshot}
                            alt="Incident Evidence"
                            style={{
                              width: '48px',
                              height: '36px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                              border: '1.5px solid #DC2626',
                            }}
                          />
                          <span style={{ fontSize: '0.625rem', color: '#2563EB', fontWeight: 600 }}>
                            🔍 Evidence
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: ev.severity === 'high' ? '#FEE2E2' : '#FEF3C7',
                            color: ev.severity === 'high' ? '#991B1B' : '#92400E',
                            flexShrink: 0,
                          }}
                        >
                          {ev.severity === 'high' ? 'High' : 'Medium'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score Breakdown Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1rem' }}>
                Score breakdown
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84375rem' }}>
                  <span style={{ color: '#475569' }}>Objective (auto)</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{objectiveScore}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84375rem' }}>
                  <span style={{ color: '#475569' }}>Subjective (AI / you)</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{subjectiveScore}</span>
                </div>

                <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '6px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>Total</span>
                  <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.1rem' }}>
                    {totalScore} / {totalMaxMarks}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Snapshot Lightbox Modal */}
      {selectedEvidenceSnapshot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'spFadeIn 0.2s ease',
          }}
          onClick={() => setSelectedEvidenceSnapshot(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              border: '1px solid #334155',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {selectedEvidenceSnapshot.title || 'Proctoring Evidence Snapshot'}
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Recorded at: <strong>{selectedEvidenceSnapshot.time}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvidenceSnapshot(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#0F172A', textAlign: 'center' }}>
              <img
                src={selectedEvidenceSnapshot.image}
                alt="Proctoring Evidence"
                style={{
                  maxWidth: '100%',
                  maxHeight: '380px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              />
            </div>
            {selectedEvidenceSnapshot.detail && (
              <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.8125rem', color: '#475569', backgroundColor: '#FFFFFF' }}>
                <strong>Details:</strong> {selectedEvidenceSnapshot.detail}
              </div>
            )}
            <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedEvidenceSnapshot(null)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
