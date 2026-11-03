import React from 'react';

/**
 * Step 1: Details & Rules
 * Replicates the exact teacher assessment creation screen from user screenshot
 * Includes smart presets, live proctoring security rating, and clean sans-serif controls.
 */
export default function StepDetailsAndRules({ formData, onChange, onNext }) {
  const handleTextChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const handleProctoringChange = (ruleKey, value) => {
    onChange({
      ...formData,
      proctoring: {
        ...formData.proctoring,
        [ruleKey]: value,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  // Exam Presets for instant population
  const presets = [
    {
      label: '⚡ AI & Deep Learning',
      title: 'Artificial Intelligence & Machine Learning',
      subject: 'Computer Science',
      topic: 'Deep Learning & Neural Networks',
      description: 'Comprehensive midterm evaluation on deep neural network architectures, backpropagation gradients, and real-time computer vision proctoring.',
      instructions: 'Webcam proctoring is active throughout the session. Closed-book examination. Max 3 tab switches permitted.',
      difficulty: 'Medium',
      duration: 45,
      maxTabSwitches: 3,
      proctoring: { webcam: true, negativeMarking: false, shuffleQuestions: true, shuffleOptions: true },
    },
    {
      label: '💻 Data Structures & Algorithms',
      title: 'CS 301 - Data Structures & Algorithms',
      subject: 'Computer Science',
      topic: 'Graph Traversal, Dynamic Programming & Trees',
      description: 'Midterm paper covering Dijkstra, Bellman-Ford, Red-Black Trees, and Memoization techniques.',
      instructions: 'Webcam proctoring is enabled. No external browser tabs or IDE extensions permitted.',
      difficulty: 'Hard',
      duration: 60,
      maxTabSwitches: 2,
      proctoring: { webcam: true, negativeMarking: true, shuffleQuestions: true, shuffleOptions: true },
    },
    {
      label: '🔐 Cyber Security & Cryptography',
      title: 'SEC 402 - Information Security & Cryptography',
      subject: 'Information Security',
      topic: 'Public Key Infrastructure & TLS 1.3',
      description: 'Evaluation of asymmetric cryptography, RSA integer factorization, and zero-knowledge proofs.',
      instructions: 'Closed-book examination. Gaze deviation tracking and multi-face audit active.',
      difficulty: 'Hard',
      duration: 50,
      maxTabSwitches: 2,
      proctoring: { webcam: true, negativeMarking: true, shuffleQuestions: true, shuffleOptions: true },
    },
    {
      label: '🧮 Applied Calculus',
      title: 'Math 202 - Multivariable Calculus',
      subject: 'Mathematics',
      topic: 'Partial Derivatives & Green Theorem',
      description: 'Rigorous assessment of surface integrals, flux calculations, and directional gradients.',
      instructions: 'Scientific calculators allowed. Rough paper OCR upload enabled for handwritten steps.',
      difficulty: 'Medium',
      duration: 60,
      maxTabSwitches: 3,
      proctoring: { webcam: true, negativeMarking: false, shuffleQuestions: true, shuffleOptions: true },
    },
  ];

  const toDateTimeLocalStr = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const setSchedulePreset = (type) => {
    const now = new Date();
    if (type === 'now') {
      const end = new Date(now.getTime() + (formData.duration || 60) * 60 * 1000 + 4 * 60 * 60 * 1000);
      onChange({
        ...formData,
        scheduledStart: toDateTimeLocalStr(now),
        scheduledEnd: toDateTimeLocalStr(end),
      });
    } else if (type === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const end = new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000);
      onChange({
        ...formData,
        scheduledStart: toDateTimeLocalStr(tomorrow),
        scheduledEnd: toDateTimeLocalStr(end),
      });
    } else if (type === 'nextweek') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(10, 0, 0, 0);
      const end = new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000);
      onChange({
        ...formData,
        scheduledStart: toDateTimeLocalStr(nextWeek),
        scheduledEnd: toDateTimeLocalStr(end),
      });
    }
  };

  const proctoring = formData.proctoring || {};
  const activeRulesCount = Object.values(proctoring).filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit}>
      {/* Quick AI Presets Bar */}
      <div className="teacher-presets-bar">
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--tp-green-text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>✨ Fast Presets:</span>
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className={`teacher-preset-chip ${formData.title && formData.title === p.title ? 'active' : ''}`}
            onClick={() => {
              const { label, ...presetFields } = p;
              onChange({ ...formData, ...presetFields });
            }}
          >
            {p.label}
          </button>
        ))}
        {(formData.title || formData.subject || formData.topic || formData.description) && (
          <button
            type="button"
            className="teacher-preset-chip"
            style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
            onClick={() => {
              onChange({
                ...formData,
                title: '',
                subject: '',
                topic: '',
                description: '',
                instructions: '',
              });
            }}
          >
            ✕ Clear Form
          </button>
        )}
      </div>

      <div className="teacher-create-grid">
        {/* ======================================================== */}
        {/* Left Column: Test Details                                */}
        {/* ======================================================== */}
        <div className="teacher-card">
          <h2 className="teacher-card-title">Test details</h2>
          <p className="teacher-card-desc">What students will see before they start.</p>

          {/* Title */}
          <div className="teacher-form-group">
            <label className="teacher-label" htmlFor="test-title">Title</label>
            <input
              id="test-title"
              type="text"
              className="teacher-input"
              value={formData.title}
              onChange={(e) => handleTextChange('title', e.target.value)}
              placeholder="e.g. Artificial Intelligence & Machine Learning"
              required
            />
          </div>

          {/* Subject and Topic Grid */}
          <div className="teacher-grid-2 teacher-form-group">
            <div>
              <label className="teacher-label" htmlFor="test-subject">Subject</label>
              <input
                id="test-subject"
                type="text"
                className="teacher-input"
                value={formData.subject}
                onChange={(e) => handleTextChange('subject', e.target.value)}
                placeholder="e.g. Computer Science"
                required
              />
            </div>

            <div>
              <label className="teacher-label" htmlFor="test-topic">Topic</label>
              <input
                id="test-topic"
                type="text"
                className="teacher-input"
                value={formData.topic}
                onChange={(e) => handleTextChange('topic', e.target.value)}
                placeholder="e.g. Deep Learning & Neural Networks"
                required
              />
              <div className="teacher-helper-text">
                Used as the default topic for AI-generated questions
              </div>
            </div>
          </div>

          {/* Faculty / Instructor Attribution */}
          <div className="teacher-grid-2 teacher-form-group">
            <div>
              <label className="teacher-label" htmlFor="test-instructor">Faculty / Instructor Name</label>
              <input
                id="test-instructor"
                type="text"
                className="teacher-input"
                value={formData.instructor || ''}
                onChange={(e) => handleTextChange('instructor', e.target.value)}
                placeholder="e.g. Prof. Priya Sharma"
              />
              <div className="teacher-helper-text">
                Shown to candidates on their examination cards and scorecards
              </div>
            </div>

            <div>
              <label className="teacher-label" htmlFor="test-instructor-role">Department / Faculty Designation</label>
              <input
                id="test-instructor-role"
                type="text"
                className="teacher-input"
                value={formData.instructorRole || ''}
                onChange={(e) => handleTextChange('instructorRole', e.target.value)}
                placeholder="e.g. Department of Computer Science"
              />
              <div className="teacher-helper-text">
                Department or role badge on student dashboard
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="teacher-form-group">
            <label className="teacher-label" htmlFor="test-desc">Description</label>
            <textarea
              id="test-desc"
              rows={2}
              className="teacher-textarea"
              value={formData.description}
              onChange={(e) => handleTextChange('description', e.target.value)}
              placeholder="e.g. Comprehensive evaluation of deep neural network architectures, backpropagation, and computer vision."
            />
          </div>

          {/* Instructions for students (with prominent active focus highlight) */}
          <div className="teacher-form-group">
            <label className="teacher-label" htmlFor="test-instructions">Instructions for students</label>
            <textarea
              id="test-instructions"
              rows={2}
              className="teacher-textarea focus-highlight"
              value={formData.instructions}
              onChange={(e) => handleTextChange('instructions', e.target.value)}
              placeholder="e.g. Webcam proctoring is active throughout the session. Closed-book exam. Max 3 tab switches permitted."
            />
          </div>

          {/* Difficulty, Duration, and Max tab switches Grid */}
          <div className="teacher-grid-3">
            <div className="teacher-form-group" style={{ marginBottom: 0 }}>
              <label className="teacher-label" htmlFor="test-difficulty">Difficulty</label>
              <select
                id="test-difficulty"
                className="teacher-select"
                value={formData.difficulty}
                onChange={(e) => handleTextChange('difficulty', e.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="teacher-form-group" style={{ marginBottom: 0 }}>
              <label className="teacher-label" htmlFor="test-duration">Duration (minutes)</label>
              <input
                id="test-duration"
                type="number"
                min="5"
                max="240"
                className="teacher-input"
                value={formData.duration}
                onChange={(e) => handleTextChange('duration', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="teacher-form-group" style={{ marginBottom: 0 }}>
              <label className="teacher-label" htmlFor="test-tabs">Max tab switches</label>
              <input
                id="test-tabs"
                type="number"
                min="0"
                max="20"
                className="teacher-input"
                value={formData.maxTabSwitches}
                onChange={(e) => handleTextChange('maxTabSwitches', parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Exam Schedule (Date & Time Window) */}
          <div
            style={{
              marginTop: '1.15rem',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--tp-surface-hover)',
              border: '1px solid var(--tp-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--tp-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📅 Exam Access Schedule</span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--tp-green-light)',
                      color: 'var(--tp-green-text)',
                    }}
                  >
                    🔒 Instructor Controlled
                  </span>
                </div>
                <div style={{ fontSize: '0.71875rem', color: 'var(--tp-text-muted)' }}>
                  Set date &amp; time students are allowed to take this test. You can reschedule this anytime.
                </div>
              </div>

              {/* Presets */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="teacher-preset-chip"
                  style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
                  onClick={() => setSchedulePreset('now')}
                >
                  ⚡ Start Now
                </button>
                <button
                  type="button"
                  className="teacher-preset-chip"
                  style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
                  onClick={() => setSchedulePreset('tomorrow')}
                >
                  Tomorrow 10 AM
                </button>
                <button
                  type="button"
                  className="teacher-preset-chip"
                  style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
                  onClick={() => setSchedulePreset('nextweek')}
                >
                  Next Week
                </button>
              </div>
            </div>

            <div className="teacher-grid-2">
              <div>
                <label className="teacher-label" htmlFor="test-scheduled-start">
                  Opens On (Start Date &amp; Time)
                </label>
                <input
                  id="test-scheduled-start"
                  type="datetime-local"
                  className="teacher-input"
                  value={formData.scheduledStart || '2026-10-26T09:00'}
                  onChange={(e) => handleTextChange('scheduledStart', e.target.value)}
                  required
                />
                <div style={{ fontSize: '0.6875rem', color: 'var(--tp-text-muted)', marginTop: '2px' }}>
                  Students cannot start test before this time
                </div>
              </div>

              <div>
                <label className="teacher-label" htmlFor="test-scheduled-end">
                  Closes On (Deadline Date &amp; Time)
                </label>
                <input
                  id="test-scheduled-end"
                  type="datetime-local"
                  className="teacher-input"
                  value={formData.scheduledEnd || '2026-10-26T21:00'}
                  onChange={(e) => handleTextChange('scheduledEnd', e.target.value)}
                  required
                />
                <div style={{ fontSize: '0.6875rem', color: 'var(--tp-text-muted)', marginTop: '2px' }}>
                  Student test window terminates after this time
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Right Column: Rules & Integrity                          */}
        {/* ======================================================== */}
        <div className="teacher-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="teacher-card-title">Rules &amp; integrity</h2>
              <p className="teacher-card-desc">Proctoring signals never change marks; they inform your review.</p>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor: activeRulesCount >= 3 ? 'var(--tp-green-light)' : 'rgba(234, 179, 8, 0.12)',
                color: activeRulesCount >= 3 ? 'var(--tp-green-text)' : '#CA8A04',
                whiteSpace: 'nowrap',
              }}
            >
              {activeRulesCount >= 3 ? '🛡 Strict Integrity' : 'Standard Rules'}
            </span>
          </div>

          <div className="teacher-rules-list">
            {/* Rule 1: AI webcam proctoring */}
            <div className="teacher-rule-row">
              <div className="teacher-rule-info">
                <div className="teacher-rule-icon">
                  {/* Camera Icon */}
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <div>
                  <div className="teacher-rule-title">AI webcam proctoring</div>
                  <div className="teacher-rule-desc">
                    Face presence, multiple faces, gaze and tab-switch monitoring
                  </div>
                </div>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={!!formData.proctoring?.webcam}
                  onChange={(e) => handleProctoringChange('webcam', e.target.checked)}
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Rule 2: Negative marking with interactive penalty stepper */}
            <div className="teacher-rule-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div className="teacher-rule-info">
                  <div className="teacher-rule-icon">
                    {/* Shield Icon */}
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <div className="teacher-rule-title">Negative marking</div>
                    <div className="teacher-rule-desc">
                      Deduct each question's negative marks for wrong objective answers
                    </div>
                  </div>
                </div>
                <label className="teacher-switch">
                  <input
                    type="checkbox"
                    checked={!!formData.proctoring?.negativeMarking}
                    onChange={(e) => handleProctoringChange('negativeMarking', e.target.checked)}
                  />
                  <span className="teacher-slider" />
                </label>
              </div>

              {/* Expandable Negative Marks Deduction Stepper & Presets */}
              {formData.proctoring?.negativeMarking && (
                <div
                  style={{
                    marginTop: '0.65rem',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid var(--tp-border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--tp-text-secondary)', fontWeight: 600 }}>
                    Default Deduction per Wrong Answer:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="teacher-stepper-control">
                      <button
                        type="button"
                        className="teacher-stepper-btn"
                        onClick={() => {
                          const current = Number(formData.defaultNegativeMarks ?? 1);
                          if (current > 0.25) {
                            onChange({ ...formData, defaultNegativeMarks: Number((current - 0.25).toFixed(2)) });
                          }
                        }}
                        title="Decrease negative mark"
                      >
                        -
                      </button>
                      <span className="teacher-stepper-val" style={{ color: '#DC2626' }}>
                        -{formData.defaultNegativeMarks ?? 1.0}
                      </span>
                      <button
                        type="button"
                        className="teacher-stepper-btn"
                        onClick={() => {
                          const current = Number(formData.defaultNegativeMarks ?? 1);
                          onChange({ ...formData, defaultNegativeMarks: Number((current + 0.25).toFixed(2)) });
                        }}
                        title="Increase negative mark"
                      >
                        +
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0.25, 0.33, 0.5, 1.0, 2.0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => onChange({ ...formData, defaultNegativeMarks: val })}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            border: '1px solid var(--tp-border)',
                            background: (formData.defaultNegativeMarks ?? 1) === val ? 'var(--tp-green-light)' : 'var(--tp-surface)',
                            color: (formData.defaultNegativeMarks ?? 1) === val ? 'var(--tp-green-text)' : 'var(--tp-text-muted)',
                            cursor: 'pointer',
                            fontWeight: (formData.defaultNegativeMarks ?? 1) === val ? 700 : 500,
                          }}
                        >
                          -{val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Rule 3: Shuffle questions */}
            <div className="teacher-rule-row">
              <div className="teacher-rule-info">
                <div className="teacher-rule-icon">
                  {/* Shuffle Icon */}
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                </div>
                <div>
                  <div className="teacher-rule-title">Shuffle questions</div>
                  <div className="teacher-rule-desc">
                    Every student gets a different question order
                  </div>
                </div>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={!!formData.proctoring?.shuffleQuestions}
                  onChange={(e) => handleProctoringChange('shuffleQuestions', e.target.checked)}
                />
                <span className="teacher-slider" />
              </label>
            </div>

            {/* Rule 4: Shuffle options */}
            <div className="teacher-rule-row">
              <div className="teacher-rule-info">
                <div className="teacher-rule-icon">
                  {/* Split/Branch shuffle icon */}
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div>
                  <div className="teacher-rule-title">Shuffle options</div>
                  <div className="teacher-rule-desc">
                    Randomise MCQ option order per student
                  </div>
                </div>
              </div>
              <label className="teacher-switch">
                <input
                  type="checkbox"
                  checked={!!formData.proctoring?.shuffleOptions}
                  onChange={(e) => handleProctoringChange('shuffleOptions', e.target.checked)}
                />
                <span className="teacher-slider" />
              </label>
            </div>
          </div>

          {/* Primary CTA Button */}
          <button type="submit" className="teacher-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {formData.title ? 'Save changes & continue to questions' : 'Create draft & continue'}
          </button>

          {/* Sub-note */}
          <div className="teacher-subnote">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>The server enforces the timer — students can't extend it.</span>
          </div>
        </div>
      </div>
    </form>
  );
}
