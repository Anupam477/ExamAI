import React from 'react';

/**
 * Detailed Scorecard & Diagnostic Feedback Modal for AI Practice Sessions
 */
export default function PracticeResultModal({ result, onClose, onRetake }) {
  if (!result) return null;

  const {
    title,
    difficulty,
    score = 0,
    correctCount = 0,
    totalQuestions = 0,
    timeTakenDisplay = '12 mins',
    timestampDisplay = 'Recently',
    review = [],
  } = result;

  const isPassing = score >= 50;

  return (
    <div className="sp-modal-backdrop">
      <div className="sp-modal-content" style={{ maxWidth: '780px' }}>
        {/* Header */}
        <div className="sp-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`sp-badge sp-badge-${(difficulty || 'medium').toLowerCase()}`}>
                {difficulty}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--sp-text-muted)' }}>
                {timestampDisplay}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sp-text-primary)', margin: '4px 0 0' }}>
              Diagnostic Scorecard: {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--sp-text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scorecard Hero Banner */}
        <div className="sp-modal-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderRadius: '12px',
              backgroundColor: 'var(--sp-surface-hover)',
              border: '1px solid var(--sp-border)',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: isPassing
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              >
                {score}%
              </div>

              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--sp-text-primary)' }}>
                  {isPassing ? 'Proficiency Demonstrated' : 'Foundation Building Required'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--sp-text-muted)' }}>
                  {correctCount} of {totalQuestions} answered accurately &bull; {timeTakenDisplay}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--sp-surface)',
                  border: '1px solid var(--sp-border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--sp-text-muted)', fontWeight: 600 }}>ACCURACY</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sp-brand-primary)' }}>{score}%</div>
              </div>

              <div
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--sp-surface)',
                  border: '1px solid var(--sp-border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--sp-text-muted)', fontWeight: 600 }}>PRIVACY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10B981' }}>Practice Only</div>
              </div>
            </div>
          </div>

          {/* AI Diagnostic Explanation */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: 'var(--sp-brand-light)',
              border: '1px solid var(--sp-brand-border)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1rem' }}>✨</span>
              <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--sp-brand-text)' }}>
                Gemini AI Diagnostic Feedback
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--sp-text-secondary)', lineHeight: 1.5 }}>
              {score >= 70
                ? 'Excellent conceptual mastery! You demonstrated strong retention of key governing principles. Proceed to Hard mode or explore multi-select application questions.'
                : 'Key areas for improvement identified: Focus on first-principles derivation, boundary invariants, and review common distractors in multiple-choice reasoning.'}
            </p>
          </div>

          {/* Question Breakdown List */}
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--sp-text-primary)', marginBottom: '0.75rem' }}>
            Question-by-Question Review ({review.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {review.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: `1px solid ${item.isCorrect ? '#A7F3D0' : '#FECDD3'}`,
                  backgroundColor: item.isCorrect ? 'var(--sp-accent-emerald-light)' : 'var(--sp-accent-rose-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.isCorrect ? '#065F46' : '#9F1239' }}>
                    {item.isCorrect ? '✓ CORRECT' : '✕ NEEDS REVIEW'} &bull; Q{idx + 1} ({item.type})
                  </span>
                </div>

                <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--sp-text-primary)', marginBottom: '8px' }}>
                  {item.question}
                </div>

                {/* Attached Handwritten Answer Sheet / Captured Photo */}
                {item.studentImage && (
                  <div
                    style={{
                      margin: '8px 0',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.75)',
                      borderRadius: '8px',
                      border: '1px solid var(--sp-border)',
                      display: 'inline-block',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>📸 Attached Sheet / Captured Image</span>
                      {item.fileName && <span style={{ color: 'var(--sp-text-muted)', fontWeight: 400 }}>({item.fileName})</span>}
                    </div>
                    <img
                      src={item.studentImage}
                      alt="Student submitted answer"
                      style={{
                        maxHeight: '160px',
                        maxWidth: '100%',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        display: 'block',
                        objectFit: 'contain',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                )}

                {/* Student Answer Text or Selected Option */}
                {item.studentAnswer !== undefined && item.studentAnswer !== null && item.studentAnswer !== '' && (
                  <div style={{ fontSize: '0.78125rem', color: 'var(--sp-text-secondary)', marginBottom: '4px' }}>
                    <strong>Your Answer:</strong>{' '}
                    <span>
                      {item.type === 'mcq' && item.options
                        ? item.options[item.studentAnswer] || `Option ${item.studentAnswer + 1}`
                        : item.type === 'multi-select' && Array.isArray(item.studentAnswer) && item.options
                        ? item.studentAnswer.map((i) => item.options[i] || `Option ${i + 1}`).join('; ')
                        : String(item.studentAnswer)}
                    </span>
                  </div>
                )}

                {/* Model or Correct Answer */}
                {!item.isCorrect && item.correctAnswer !== undefined && item.correctAnswer !== null && (
                  <div style={{ fontSize: '0.78125rem', color: '#065F46', marginBottom: '4px' }}>
                    <strong>Correct Answer:</strong>{' '}
                    <span>
                      {item.type === 'mcq' && item.options
                        ? item.options[item.correctAnswer] || `Option ${item.correctAnswer + 1}`
                        : item.type === 'multi-select' && Array.isArray(item.correctAnswer) && item.options
                        ? item.correctAnswer.map((i) => item.options[i] || `Option ${i + 1}`).join('; ')
                        : String(item.correctAnswer)}
                    </span>
                  </div>
                )}

                {item.explanation && (
                  <div style={{ fontSize: '0.78125rem', color: 'var(--sp-text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                    <strong>Insight:</strong> {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sp-modal-footer">
          <button type="button" className="sp-btn-subtle" onClick={onClose}>
            Close Scorecard
          </button>

          <button
            type="button"
            className="sp-generate-btn"
            style={{ width: 'auto', padding: '0.55rem 1.25rem', fontSize: '0.84375rem' }}
            onClick={() => {
              onClose();
              if (onRetake) onRetake(result);
            }}
          >
            ⟳ Retake This Topic
          </button>
        </div>
      </div>
    </div>
  );
}
