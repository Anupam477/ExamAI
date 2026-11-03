import React, { useState } from 'react';

/**
 * Step 4: Publish & Review
 * Final review of blueprint, proctoring safeguards, and live publication
 */
export default function StepPublish({ formData, onSaveDraft, onPublish, onBack, onViewTests }) {
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const testCode = formData.code || `${(formData.subject || 'EXAM').slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const questions = formData.questions || [];
  const assigned = formData.assignedStudents || [];
  const totalMarks = questions.reduce((acc, curr) => acc + (Number(curr.marks) || 0), 0);

  const candidateUrl = `${window.location.origin}/dashboard/student?testCode=${testCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(candidateUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePublishClick = () => {
    onPublish({ ...formData, code: testCode, status: 'published' });
    setPublishedSuccess(true);
  };

  const handleDraftClick = () => {
    onSaveDraft({ ...formData, code: testCode, status: 'draft' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Success Modal / Banner */}
      {publishedSuccess && (
        <div
          className="teacher-card"
          style={{
            background: 'linear-gradient(135deg, #EAF7EE 0%, #D4EDDA 100%)',
            border: '2px solid var(--tp-green-border)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'var(--tp-green-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', color: 'var(--tp-green-text)' }}>
            Examination Successfully Published!
          </h3>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: '#135A44' }}>
            Enrolled students can now launch this exam with server-enforced proctoring and real-time tracking.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0.65rem 1.25rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--tp-green-border)',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--tp-text-muted)' }}>EXAM CODE:</span>
            <strong style={{ fontSize: '1.15rem', letterSpacing: '0.08em', color: 'var(--tp-green-primary)' }}>
              {testCode}
            </strong>
            <button
              type="button"
              onClick={handleCopy}
              className="teacher-btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              {copiedLink ? '✓ Copied Link' : 'Copy Direct Link'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              className="teacher-btn-primary"
              style={{ width: 'auto' }}
              onClick={onViewTests}
            >
              View in All Tests List
            </button>
          </div>
        </div>
      )}

      {/* Blueprint Review Card */}
      <div className="teacher-card">
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', color: 'var(--tp-text-primary)' }}>
          Review Examination Blueprint
        </h3>

        <div className="teacher-grid-2" style={{ marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Title &amp; Subject</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--tp-text-primary)', marginTop: '2px' }}>
              {formData.title || 'Untitled Assessment'}
            </div>
            <div style={{ fontSize: '0.84375rem', color: 'var(--tp-text-secondary)', marginTop: '2px' }}>
              Subject: <strong>{formData.subject}</strong> &bull; Topic: <strong>{formData.topic}</strong>
            </div>
            <div style={{ fontSize: '0.84375rem', color: 'var(--tp-green-primary)', marginTop: '4px', fontWeight: 600 }}>
              Faculty: <strong>{formData.instructor || 'Course Faculty'}</strong> {formData.instructorRole ? `(${formData.instructorRole})` : ''}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Duration &amp; Constraints</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--tp-text-primary)', marginTop: '2px' }}>
              ⏱ {formData.duration} Minutes &bull; Max {formData.maxTabSwitches} Tab Switches
            </div>
            <div style={{ fontSize: '0.84375rem', color: 'var(--tp-text-secondary)', marginTop: '2px' }}>
              Difficulty: <strong>{formData.difficulty}</strong>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: '8px',
            backgroundColor: 'var(--tp-surface-hover)',
            border: '1px solid var(--tp-border)',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>Total Questions</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tp-green-primary)' }}>
              {questions.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>Total Marks</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tp-green-primary)' }}>
              {totalMarks} pts
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>Assigned Candidates</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tp-green-primary)' }}>
              {assigned.length} Enrolled
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>Negative Marking</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: formData.proctoring?.negativeMarking ? '#DC2626' : 'var(--tp-text-muted)' }}>
              {formData.proctoring?.negativeMarking ? `-${formData.defaultNegativeMarks ?? 1.0} pts` : 'Disabled'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>Scheduled Access Window</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--tp-text-primary)' }}>
              {formData.scheduledStart ? new Date(formData.scheduledStart).toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'Today'},{' '}
              {formData.scheduledStart ? new Date(formData.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>
              &rarr; Closes {formData.scheduledEnd ? new Date(formData.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:00 PM'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tp-text-muted)' }}>Test Access Code</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--tp-green-primary)', fontFamily: 'monospace' }}>
              {testCode}
            </div>
          </div>
        </div>

        {/* Proctoring Safeguards Summary */}
        <div>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', color: 'var(--tp-text-primary)' }}>
            Active AI Proctoring Safeguards
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--tp-border)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: formData.proctoring?.webcam ? '#16A34A' : '#9CA3AF' }}>●</span>
              <span>AI Webcam Gaze &amp; Face Detection: <strong>{formData.proctoring?.webcam ? 'ON' : 'OFF'}</strong></span>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--tp-border)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: formData.proctoring?.negativeMarking ? '#16A34A' : '#9CA3AF' }}>●</span>
              <span>Negative Marking: <strong>{formData.proctoring?.negativeMarking ? 'ON' : 'OFF'}</strong></span>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--tp-border)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: formData.proctoring?.shuffleQuestions ? '#16A34A' : '#9CA3AF' }}>●</span>
              <span>Shuffle Questions: <strong>{formData.proctoring?.shuffleQuestions ? 'ON' : 'OFF'}</strong></span>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--tp-border)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: formData.proctoring?.shuffleOptions ? '#16A34A' : '#9CA3AF' }}>●</span>
              <span>Shuffle Options: <strong>{formData.proctoring?.shuffleOptions ? 'ON' : 'OFF'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      {!publishedSuccess && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button type="button" className="teacher-btn-secondary" onClick={onBack}>
            &larr; Back to Candidate Assignment
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="teacher-btn-secondary"
              onClick={handleDraftClick}
            >
              Save as Draft
            </button>

            <button
              type="button"
              className="teacher-btn-primary"
              style={{ width: 'auto', padding: '0.75rem 1.75rem' }}
              onClick={handlePublishClick}
            >
              🚀 Publish Examination Paper
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
