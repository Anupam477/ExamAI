import React, { useState, useEffect } from 'react';
import {
  getStoredTeacherTests,
  deleteTeacherTest,
  rescheduleTeacherTest,
  saveOrUpdateTeacherTest,
  reassignTeacherTest,
} from '../../utils/mockApi';

/**
 * Teacher Tests List Console
 * Shows all active, published, and draft examination papers
 */
export default function TeacherTestsList({ onCreateNew, onEditTest, onDirectPublish }) {
  const [tests, setTests] = useState(getStoredTeacherTests());
  const [filter, setFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [reschedulingTest, setReschedulingTest] = useState(null);
  const [modalStart, setModalStart] = useState('');
  const [modalEnd, setModalEnd] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Quick Add Question Modal state
  const [quickAddTest, setQuickAddTest] = useState(null);
  const [qType, setQType] = useState('mcq');
  const [qTitle, setQTitle] = useState('');
  const [qMarks, setQMarks] = useState(5);
  const [qDuration, setQDuration] = useState(2);
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState('');

  // Re-assign test to students (even if no questions were modified)
  const handleReassignClick = (test) => {
    const studentCount = test.assignedStudents?.length || 0;
    const confirmMsg = `Re-assign "${test.title}" to ${studentCount > 0 ? `${studentCount} enrolled candidates` : 'all eligible students'}?\n\nCandidates who already completed this exam will immediately be granted a fresh attempt to take it again (even without modifying questions).`;
    if (window.confirm(confirmMsg)) {
      const updated = reassignTeacherTest(test.id);
      setTests(updated);
      setSaveSuccessMsg(`✓ Test "${test.title}" RE-ASSIGNED successfully! Candidates can now take this examination again.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  // Sync tests on changes
  useEffect(() => {
    const handleSync = () => {
      setTests(getStoredTeacherTests());
    };
    window.addEventListener('examai_tests_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('examai_tests_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handlePublishClick = (test) => {
    const updatedTest = { ...test, status: 'published' };
    const updated = saveOrUpdateTeacherTest(updatedTest);
    setTests(updated);
    if (onDirectPublish) {
      onDirectPublish(test);
    } else {
      setSaveSuccessMsg(`✓ Test "${test.title}" is now PUBLISHED and live for students! (Code: ${test.code})`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  const handleRevertToDraft = (test) => {
    const updated = saveOrUpdateTeacherTest({ ...test, status: 'draft' });
    setTests(updated);
    setSaveSuccessMsg(`Test "${test.title}" reverted back to Draft status.`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleOpenQuickAdd = (test) => {
    setQuickAddTest(test);
    setQType('mcq');
    setQTitle('');
    setQMarks(5);
    setQDuration(2);
    setQOptions(['', '', '', '']);
    setQCorrect(0);
    setQExplanation('');
  };

  const handleSaveQuickQuestion = (e, andPublish = false) => {
    e.preventDefault();
    if (!quickAddTest || !qTitle.trim()) return;

    const newQ = {
      id: `q_quick_${Date.now()}`,
      type: qType,
      title: qTitle.trim(),
      marks: Number(qMarks) || 5,
      duration: Number(qDuration) || 2,
      options: qType === 'mcq' ? qOptions.map((o, idx) => o.trim() || `Option ${idx + 1}`) : undefined,
      correctOption: qType === 'mcq' ? qCorrect : undefined,
      explanation: qExplanation.trim(),
      rubric: (qType === 'short' || qType === 'long') ? qExplanation.trim() : undefined,
    };

    const existingQuestions = quickAddTest.questions || [];
    const updatedTest = {
      ...quickAddTest,
      questions: [...existingQuestions, newQ],
      status: andPublish ? 'published' : quickAddTest.status,
    };

    const updated = saveOrUpdateTeacherTest(updatedTest);
    setTests(updated);

    const msg = andPublish
      ? `✓ Added question and PUBLISHED "${quickAddTest.title}" (Code: ${quickAddTest.code})!`
      : `✓ Extra question added to "${quickAddTest.title}". Total: ${existingQuestions.length + 1} questions.`;
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    setQuickAddTest(null);
  };

  const filteredTests = tests.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      const updated = deleteTeacherTest(id);
      setTests(updated);
    }
  };

  const handleCopyLink = (test) => {
    const url = `${window.location.origin}/dashboard/student?testCode=${test.code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(test.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toDateTimeLocalStr = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenReschedule = (test) => {
    setReschedulingTest(test);
    setModalStart(test.scheduledStart || toDateTimeLocalStr(new Date()));
    setModalEnd(test.scheduledEnd || toDateTimeLocalStr(new Date(Date.now() + 4 * 3600 * 1000)));
  };

  const handleApplyPreset = (preset) => {
    const now = new Date();
    if (preset === 'now') {
      const end = new Date(now.getTime() + 4 * 3600 * 1000);
      setModalStart(toDateTimeLocalStr(now));
      setModalEnd(toDateTimeLocalStr(end));
    } else if (preset === 'tomorrow') {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      tom.setHours(10, 0, 0, 0);
      const end = new Date(tom.getTime() + 4 * 3600 * 1000);
      setModalStart(toDateTimeLocalStr(tom));
      setModalEnd(toDateTimeLocalStr(end));
    } else if (preset === 'extend') {
      const currentEnd = modalEnd ? new Date(modalEnd) : new Date();
      const extended = new Date(currentEnd.getTime() + 2 * 3600 * 1000);
      setModalEnd(toDateTimeLocalStr(extended));
    }
  };

  const handleSaveReschedule = (e) => {
    e.preventDefault();
    if (!reschedulingTest) return;
    const updated = rescheduleTeacherTest(reschedulingTest.id, modalStart, modalEnd);
    setTests(updated);
    setSaveSuccessMsg(`✓ Schedule updated for "${reschedulingTest.title}". Repeated updates permitted by teacher.`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
      setReschedulingTest(null);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', color: 'var(--tp-text-primary)' }}>
            Assessment Papers
          </h2>
          <p style={{ margin: 0, fontSize: '0.84375rem', color: 'var(--tp-text-muted)' }}>
            Manage blueprints, question papers, and live candidate admission links.
          </p>
        </div>

        <button
          type="button"
          className="teacher-btn-primary"
          style={{ width: 'auto' }}
          onClick={onCreateNew}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Test
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['all', 'published', 'draft'].map((st) => (
          <button
            key={st}
            type="button"
            className="teacher-btn-secondary"
            onClick={() => setFilter(st)}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.8125rem',
              backgroundColor: filter === st ? 'var(--tp-green-light)' : 'var(--tp-surface)',
              color: filter === st ? 'var(--tp-green-text)' : 'var(--tp-text-secondary)',
              borderColor: filter === st ? 'var(--tp-green-border)' : 'var(--tp-border)',
              fontWeight: filter === st ? 600 : 500,
            }}
          >
            {st.toUpperCase()} ({st === 'all' ? tests.length : tests.filter((t) => t.status === st).length})
          </button>
        ))}
      </div>

      {/* Tests Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className="teacher-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderLeft: test.status === 'published' ? '4px solid #16A34A' : '4px solid #EAB308',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: test.status === 'published' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                    color: test.status === 'published' ? '#16A34A' : '#CA8A04',
                  }}
                >
                  {test.status?.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--tp-text-muted)' }}>
                  CODE: {test.code}
                </span>
              </div>

              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--tp-text-primary)' }}>
                {test.title}
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--tp-text-muted)', lineHeight: 1.4 }}>
                {test.topic || test.description || 'Thermodynamics assessment module.'}
              </p>

              {/* Access Schedule Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  color: 'var(--tp-green-text)',
                  backgroundColor: 'var(--tp-green-light)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--tp-green-border)',
                  marginBottom: '0.85rem',
                }}
              >
                <span>📅 Schedule:</span>
                <strong>
                  {test.scheduledStart
                    ? new Date(test.scheduledStart).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Open Now'}
                </strong>
                <span>→</span>
                <strong>
                  {test.scheduledEnd
                    ? new Date(test.scheduledEnd).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'No Expiry'}
                </strong>
              </div>

              {/* Specs */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--tp-text-secondary)', marginBottom: '1.25rem' }}>
                <span>⏱ {test.duration}m</span>
                <span>&bull;</span>
                <span>{test.questions?.length || 0} Questions</span>
                <span>&bull;</span>
                <span>{test.assignedStudents?.length || 0} Students</span>
                {test.assignmentVersion > 1 && (
                  <>
                    <span>&bull;</span>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>
                      🔄 Re-assigned (v{test.assignmentVersion})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--tp-border-light)', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Publish Arrow button specifically for DRAFT tests as requested by user */}
                {test.status === 'draft' ? (
                  <button
                    type="button"
                    className="teacher-btn-primary"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.76rem',
                      backgroundColor: '#16A34A',
                      borderColor: '#16A34A',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                    }}
                    onClick={() => handlePublishClick(test)}
                    title="Publish this draft test so enrolled students can take it"
                  >
                    <span>Publish</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>↗</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="teacher-btn-secondary"
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.74rem',
                      color: '#16A34A',
                      borderColor: 'rgba(22, 163, 74, 0.4)',
                      backgroundColor: 'rgba(22, 163, 74, 0.08)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleRevertToDraft(test)}
                    title="Click to revert to Draft if you want to make edits"
                  >
                    <span>✓ Live</span>
                  </button>
                )}

                {/* Direct Re-assign / Allow Retake Button */}
                <button
                  type="button"
                  className="teacher-btn-secondary"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    color: '#D97706',
                    borderColor: '#FDE68A',
                    backgroundColor: '#FFFBEB',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleReassignClick(test)}
                  title="Re-assign this test to candidates: allows students who already completed the test to take it again (even without changing questions)"
                >
                  <span>🔄 Re-assign</span>
                </button>

                {/* Direct Shortcut to Step 3: Assign Candidates */}
                <button
                  type="button"
                  className="teacher-btn-secondary"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    color: '#0D9488',
                    borderColor: '#99F6E4',
                    backgroundColor: '#F0FDFA',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => onEditTest(test, 3)}
                  title="Open candidate roster to assign/re-assign students"
                >
                  <span>👥 Assign ({test.assignedStudents?.length || 0})</span>
                </button>

                {/* Edit Basic Details */}
                <button
                  type="button"
                  className="teacher-btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                  onClick={() => onEditTest(test, 1)}
                  title="Edit test rules, subject, and time duration"
                >
                  Edit
                </button>

                {/* Add Extra Questions button */}
                <button
                  type="button"
                  className="teacher-btn-secondary"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.76rem',
                    color: '#2563EB',
                    borderColor: '#93C5FD',
                    backgroundColor: '#EFF6FF',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => onEditTest(test, 2)}
                  title="Open question authoring studio to add or generate extra questions"
                >
                  <span>+ Questions ({test.questions?.length || 0})</span>
                </button>

                {/* Quick Add Question Modal shortcut */}
                <button
                  type="button"
                  className="teacher-btn-secondary"
                  style={{
                    padding: '0.35rem 0.55rem',
                    fontSize: '0.74rem',
                    color: '#7C3AED',
                    borderColor: '#DDD6FE',
                    backgroundColor: '#F5F3FF',
                  }}
                  onClick={() => handleOpenQuickAdd(test)}
                  title="Quickly append a question without leaving this page"
                >
                  + Quick Q
                </button>

                <button
                  type="button"
                  className="teacher-btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', color: 'var(--tp-green-text)', borderColor: 'var(--tp-green-border)' }}
                  onClick={() => handleOpenReschedule(test)}
                  title="Change test date and time window"
                >
                  🗓 Reschedule
                </button>

                <button
                  type="button"
                  className="teacher-btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                  onClick={() => handleCopyLink(test)}
                >
                  {copiedId === test.id ? '✓ Copied' : 'Share Link'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(test.id)}
                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                title="Delete test"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {filteredTests.length === 0 && (
          <div
            className="teacher-card"
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3.5rem 2rem',
              backgroundColor: 'var(--tp-surface)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📝</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--tp-text-primary)' }}>
              No Assessments Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--tp-text-muted)', margin: '0 0 1.5rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
              No tests have been created yet. Automatic test generation is turned off. Click below to create and publish your first assessment.
            </p>
            <button
              type="button"
              className="teacher-btn-primary"
              onClick={onCreateNew}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>+</span> Create New Test
            </button>
          </div>
        )}
      </div>

      {/* Reschedule Interactive Modal */}
      {reschedulingTest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            className="teacher-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--tp-surface)',
              borderRadius: '12px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--tp-border)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: 'var(--tp-text-primary)' }}>
                  Reschedule Examination Window
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--tp-text-muted)' }}>
                  Test: <strong>{reschedulingTest.title}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReschedulingTest(null)}
                style={{ background: 'none', border: 'none', color: 'var(--tp-text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            {saveSuccessMsg && (
              <div
                style={{
                  backgroundColor: 'var(--tp-green-light)',
                  color: 'var(--tp-green-text)',
                  border: '1px solid var(--tp-green-border)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                {saveSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveReschedule}>
              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="teacher-preset-chip"
                  onClick={() => handleApplyPreset('now')}
                >
                  ⚡ Start Now (4h Window)
                </button>
                <button
                  type="button"
                  className="teacher-preset-chip"
                  onClick={() => handleApplyPreset('tomorrow')}
                >
                  🌅 Tomorrow 10:00 AM
                </button>
                <button
                  type="button"
                  className="teacher-preset-chip"
                  onClick={() => handleApplyPreset('extend')}
                >
                  ⏳ Extend +2 Hours
                </button>
              </div>

              {/* Date & Time Inputs */}
              <div className="teacher-grid-2" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <label className="teacher-label" htmlFor="reschedule-start">
                    Opens On (Start Date &amp; Time)
                  </label>
                  <input
                    id="reschedule-start"
                    type="datetime-local"
                    className="teacher-input"
                    value={modalStart}
                    onChange={(e) => setModalStart(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="teacher-label" htmlFor="reschedule-end">
                    Closes On (Deadline Date &amp; Time)
                  </label>
                  <input
                    id="reschedule-end"
                    type="datetime-local"
                    className="teacher-input"
                    value={modalEnd}
                    onChange={(e) => setModalEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="teacher-btn-secondary"
                  onClick={() => setReschedulingTest(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="teacher-btn-primary"
                  style={{ width: 'auto' }}
                >
                  Save New Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Quick Add Question Modal */}
      {quickAddTest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="teacher-card"
            style={{
              maxWidth: '620px',
              width: '100%',
              backgroundColor: 'var(--tp-surface)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
              borderRadius: '12px',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#2563EB',
                    backgroundColor: '#EFF6FF',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  DRAFT QUESTION BUILDER &bull; {quickAddTest.code}
                </span>
                <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.2rem', color: 'var(--tp-text-primary)' }}>
                  Add Extra Question to &quot;{quickAddTest.title}&quot;
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddTest(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--tp-text-muted)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={(e) => handleSaveQuickQuestion(e, false)}>
              {/* Type Switcher */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="teacher-label">Question Format</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'mcq', label: 'Multiple Choice (MCQ)' },
                    { id: 'short', label: 'Short Answer' },
                    { id: 'long', label: 'Long Answer / Derivation' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="teacher-btn-secondary"
                      onClick={() => setQType(t.id)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: qType === t.id ? 700 : 500,
                        backgroundColor: qType === t.id ? '#EFF6FF' : 'var(--tp-surface)',
                        color: qType === t.id ? '#2563EB' : 'var(--tp-text-primary)',
                        borderColor: qType === t.id ? '#3B82F6' : 'var(--tp-border)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="teacher-label" htmlFor="quick-q-title">
                  Question Statement / Problem Text
                </label>
                <textarea
                  id="quick-q-title"
                  className="teacher-textarea"
                  rows={3}
                  placeholder="e.g. Which process occurs strictly under constant temperature without internal energy change?"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  required
                />
              </div>

              {/* MCQ Options */}
              {qType === 'mcq' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="teacher-label">
                    Answer Options (Select the green radio for the correct option)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {qOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="quick-correct-opt"
                          checked={qCorrect === idx}
                          onChange={() => setQCorrect(idx)}
                          style={{ accentColor: '#16A34A', width: '16px', height: '16px', cursor: 'pointer' }}
                          title="Mark this as the correct option"
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.8125rem', width: '18px', color: qCorrect === idx ? '#16A34A' : 'var(--tp-text-muted)' }}>
                          {String.fromCharCode(65 + idx)}:
                        </span>
                        <input
                          type="text"
                          className="teacher-input"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...qOptions];
                            updated[idx] = e.target.value;
                            setQOptions(updated);
                          }}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Marks & Duration */}
              <div className="teacher-grid-2" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <label className="teacher-label">Marks / Score Points</label>
                  <input
                    type="number"
                    className="teacher-input"
                    min={1}
                    max={100}
                    value={qMarks}
                    onChange={(e) => setQMarks(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="teacher-label">Estimated Duration (Mins)</label>
                  <input
                    type="number"
                    className="teacher-input"
                    min={1}
                    max={60}
                    value={qDuration}
                    onChange={(e) => setQDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Explanation / Rubric */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="teacher-label">
                  {qType === 'mcq' ? 'Explanation / Solution Concept (Optional)' : 'Grading Rubric / Key Concepts'}
                </label>
                <input
                  type="text"
                  className="teacher-input"
                  placeholder="e.g. Isothermal signifies dT = 0. Internal energy is constant."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  type="button"
                  className="teacher-btn-secondary"
                  onClick={() => {
                    setQuickAddTest(null);
                    onEditTest(quickAddTest, 2);
                  }}
                  title="Open full wizard with AI question generator and syllabus roster"
                >
                  Open in Full AI Studio &rarr;
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="teacher-btn-secondary"
                    onClick={() => setQuickAddTest(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="teacher-btn-secondary"
                    style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE', fontWeight: 600 }}
                  >
                    + Add to Draft
                  </button>

                  <button
                    type="button"
                    className="teacher-btn-primary"
                    style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={(e) => handleSaveQuickQuestion(e, true)}
                  >
                    <span>Save &amp; Publish</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>↗</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
