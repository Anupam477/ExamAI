import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Interactive Fullscreen Exam Runner
 * Pixel-matched to the user's reference design:
 * - Header: ExamAI brand, title, "✓ All changes saved", timer pill, Submit button
 * - Left: "Questions" palette card with X/Y answered, progress bar, 5-col number grid, legend
 * - Right: Main Question card with question counter, type pill, marks, "Flag for review",
 *          question text, and custom option rows (A, B, C, D with checkmark when selected)
 * - Bottom: Previous button, keyboard navigation tip (← →), Next / Submit button
 */
export default function InteractiveExamRunner({
  examTitle = 'Binary search trees practice',
  durationMinutes = 15,
  questions = [],
  onClose,
  onSubmit,
  isProctored = false,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedIds, setFlaggedIds] = useState(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [savedStatusText, setSavedStatusText] = useState('All changes saved');

  // Multimodal Camera & Upload State
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timer into mm:ss
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex] || {};
  const currentQId = currentQ.id || `q_${currentIndex}`;

  // Helper to check if question is answered (handles MCQ, multi-select, typed text, and photo uploads)
  const isQuestionAnswered = (ans) => {
    if (ans === undefined || ans === null) return false;
    if (typeof ans === 'number') return true;
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === 'object') {
      return Boolean((ans.text && ans.text.trim()) || ans.image);
    }
    if (typeof ans === 'string') return ans.trim().length > 0;
    return false;
  };

  // Count answered questions
  const answeredCount = Object.keys(answers).filter((k) => isQuestionAnswered(answers[k])).length;

  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // Option selection
  const handleSelectOption = (optIdx) => {
    setAnswers((prev) => ({ ...prev, [currentQId]: optIdx }));
    triggerSavedIndicator();
  };

  // Toggle multi-select
  const handleToggleMultiSelect = (optIdx) => {
    const existing = answers[currentQId] || [];
    const updated = existing.includes(optIdx)
      ? existing.filter((i) => i !== optIdx)
      : [...existing, optIdx];
    setAnswers((prev) => ({ ...prev, [currentQId]: updated }));
    triggerSavedIndicator();
  };

  // Text answer
  const handleTextAnswer = (text) => {
    const currentVal = answers[currentQId];
    if (typeof currentVal === 'object' && currentVal !== null && currentVal.image) {
      setAnswers((prev) => ({
        ...prev,
        [currentQId]: {
          ...currentVal,
          text,
        },
      }));
    } else {
      setAnswers((prev) => ({ ...prev, [currentQId]: text }));
    }
    triggerSavedIndicator();
  };

  // Image attach (Camera or File)
  const handleImageAttach = (dataUrl, fileName) => {
    const currentVal = answers[currentQId];
    const currentText =
      typeof currentVal === 'object' && currentVal !== null
        ? currentVal.text || ''
        : typeof currentVal === 'string'
        ? currentVal
        : '';

    setAnswers((prev) => ({
      ...prev,
      [currentQId]: {
        text: currentText,
        image: dataUrl,
        fileName: fileName || 'handwritten_sheet.jpg',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    }));
    triggerSavedIndicator();
  };

  // Remove attached image
  const handleRemoveImage = () => {
    const currentVal = answers[currentQId];
    const currentText = typeof currentVal === 'object' && currentVal !== null ? currentVal.text || '' : '';
    setAnswers((prev) => ({
      ...prev,
      [currentQId]: currentText ? currentText : undefined,
    }));
    triggerSavedIndicator();
  };

  // Camera Handlers
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or click "Upload File" instead.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    handleImageAttach(dataUrl, `camera_capture_${Date.now()}.jpg`);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleImageAttach(ev.target.result, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Stop camera when changing questions or unmounting
  useEffect(() => {
    stopCamera();
    return () => stopCamera();
  }, [currentIndex]);

  // Toggle flagged
  const handleToggleFlag = () => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentQId)) {
        next.delete(currentQId);
      } else {
        next.add(currentQId);
      }
      return next;
    });
  };

  // Feedback indicator
  const triggerSavedIndicator = () => {
    setSavedStatusText('Saving...');
    setTimeout(() => {
      setSavedStatusText('All changes saved');
    }, 400);
  };

  // Submit confirmation & execution
  const handleFinalSubmit = () => {
    const unAnswered = questions.length - answeredCount;
    if (unAnswered > 0) {
      const proceed = window.confirm(
        `You have ${unAnswered} unanswered question${unAnswered > 1 ? 's' : ''}. Are you sure you want to submit your examination?`
      );
      if (!proceed) return;
    }
    const timeSpent = durationMinutes * 60 - secondsRemaining;
    onSubmit(answers, timeSpent);
  };

  // Keyboard navigation handler (← / →)
  const handleKeyDown = useCallback(
    (e) => {
      // Don't intercept if user is typing in a textarea or input
      if (['TEXTAREA', 'INPUT'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      }
    },
    [questions.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const isCurrentFlagged = flaggedIds.has(currentQId);

  // Dynamic theme detection
  const isDark = typeof document !== 'undefined' && (
    document.querySelector('[data-student-theme="dark"]') !== null ||
    document.body.classList.contains('dark') ||
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  return (
    <div className="er-fullscreen-overlay" data-student-theme={isDark ? 'dark' : 'light'}>
      {/* Top Header Bar */}
      <header className="er-top-header">
        <div className="er-brand-group">
          <div className="er-logo-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <span className="er-logo-text">ExamAI</span>

          <div className="er-title-block">
            <span className="er-test-title">{examTitle}</span>
            <span className="er-saved-status">
              <span className="checkmark">✓</span> {savedStatusText}
            </span>
          </div>
        </div>

        <div className="er-header-actions">
          {isProctored && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0.25rem 0.6rem',
                borderRadius: '20px',
                backgroundColor: 'var(--sp-emerald-bg)',
                color: 'var(--sp-emerald-text)',
                fontSize: '0.6875rem',
                fontWeight: 700,
              }}
            >
              <span>●</span> Proctor Active
            </span>
          )}

          {/* Timer Pill */}
          <div className={`er-timer-pill ${secondsRemaining < 120 ? 'urgent' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          {/* Submit Button */}
          <button type="button" className="er-submit-btn" onClick={handleFinalSubmit}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span>Submit</span>
          </button>

          {/* Close / Quit Session */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close examination"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sp-text-muted)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                padding: '3px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="er-main-layout">
        {/* Left Sidebar: "Questions" Card */}
        <aside className="er-sidebar">
          <div className="er-sidebar-header">
            <span className="er-sidebar-title">Questions</span>
            <span className="er-sidebar-progress-label">
              {answeredCount}/{questions.length} answered
            </span>
          </div>

          {/* Progress Bar */}
          <div className="er-progress-track">
            <div className="er-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          {/* Numbered Palette Grid (5 cols) */}
          <div className="er-palette-grid">
            {questions.map((q, idx) => {
              const qId = q.id || `q_${idx}`;
              const isCurrent = idx === currentIndex;
              const hasAnswer =
                answers[qId] !== undefined &&
                answers[qId] !== '' &&
                (!Array.isArray(answers[qId]) || answers[qId].length > 0);
              const isFlagged = flaggedIds.has(qId);

              let stateClass = '';
              if (isCurrent) stateClass = 'active';
              else if (isFlagged) stateClass = 'flagged';
              else if (hasAnswer) stateClass = 'answered';

              return (
                <button
                  key={qId}
                  type="button"
                  className={`er-palette-btn ${stateClass}`}
                  onClick={() => setCurrentIndex(idx)}
                  title={`Question ${idx + 1}${isFlagged ? ' (Flagged)' : ''}${hasAnswer ? ' (Answered)' : ''}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="er-sidebar-legend">
            <div className="er-legend-item">
              <span className="er-legend-dot answered" />
              <span>Answered</span>
            </div>
            <div className="er-legend-item">
              <span className="er-legend-dot flagged" />
              <span>Flagged</span>
            </div>
            <div className="er-legend-item">
              <span className="er-legend-dot notyet" />
              <span>Not yet</span>
            </div>
          </div>
        </aside>

        {/* Right Area: Question Card & Controls */}
        <section className="er-content-area">
          <div className="er-question-card">
            {/* Question Top Bar */}
            <div className="er-card-header">
              <div className="er-card-header-left">
                <span className="er-question-number">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="er-type-pill">
                  {currentQ.type === 'multi-select'
                    ? 'Multi-select'
                    : currentQ.type === 'short-answer' || currentQ.type === 'long-answer' || currentQ.type === 'descriptive'
                    ? 'Written response'
                    : 'Multiple choice'}
                </span>
                <span className="er-marks-pill">
                  {currentQ.marks || 1} mark{(currentQ.marks || 1) > 1 ? 's' : ''}
                </span>
              </div>

              {/* Flag for review toggle */}
              <button
                type="button"
                className={`er-flag-btn ${isCurrentFlagged ? 'flagged' : ''}`}
                onClick={handleToggleFlag}
              >
                <span>{isCurrentFlagged ? '⚑' : '⚐'}</span>
                <span>{isCurrentFlagged ? 'Flagged for review' : 'Flag for review'}</span>
              </button>
            </div>

            {/* Question Text */}
            <h2 className="er-question-text">
              {currentQ.question || currentQ.title}
            </h2>

            {/* MCQ Options */}
            {(!currentQ.type || currentQ.type === 'mcq') && currentQ.options && (
              <div className="er-options-list">
                {currentQ.options.map((optText, optIdx) => {
                  const isSelected = answers[currentQId] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`er-option-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(optIdx)}
                    >
                      <div className="er-option-badge">
                        {isSelected ? '✓' : optionLetters[optIdx] || optIdx + 1}
                      </div>
                      <span className="er-option-text">{optText}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Multi-Select Options */}
            {currentQ.type === 'multi-select' && currentQ.options && (
              <div className="er-options-list">
                <div style={{ fontSize: '0.78125rem', color: 'var(--sp-text-muted)', marginBottom: '4px' }}>
                  Select all options that apply:
                </div>
                {currentQ.options.map((optText, optIdx) => {
                  const selectedArr = answers[currentQId] || [];
                  const isSelected = selectedArr.includes(optIdx);
                  return (
                    <div
                      key={optIdx}
                      className={`er-option-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleMultiSelect(optIdx)}
                    >
                      <div className="er-option-badge">
                        {isSelected ? '✓' : optionLetters[optIdx] || optIdx + 1}
                      </div>
                      <span className="er-option-text">{optText}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Descriptive / Short Answer / Written Response with Live Camera & File Upload */}
            {(currentQ.type === 'short-answer' ||
              currentQ.type === 'long-answer' ||
              currentQ.type === 'descriptive' ||
              currentQ.type === 'written') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Multimodal action bar: Type, Live Capture, Upload File */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--sp-surface-hover)',
                    borderRadius: '8px',
                    border: '1px solid var(--sp-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sp-text-primary)' }}>
                      ✍️ Written / Handwritten Submission:
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--sp-text-muted)' }}>
                      Type in editor, snap with camera, or upload paper sheet
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Live Camera Capture Button */}
                    <button
                      type="button"
                      className="sp-btn-subtle"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78125rem',
                        fontWeight: 600,
                        color: cameraActive ? '#EF4444' : '#2563EB',
                        backgroundColor: cameraActive ? '#FEF2F2' : '#EFF6FF',
                        borderColor: cameraActive ? '#FECACA' : '#BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                      onClick={cameraActive ? stopCamera : startCamera}
                    >
                      <span>{cameraActive ? '✕ Close Camera' : '📸 Live Capture Photo'}</span>
                    </button>

                    {/* Upload File Button */}
                    <button
                      type="button"
                      className="sp-btn-subtle"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78125rem',
                        fontWeight: 600,
                        color: 'var(--sp-emerald-text)',
                        backgroundColor: 'var(--sp-emerald-bg)',
                        borderColor: 'var(--sp-emerald-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span>📁 Upload File / Photo</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                {/* Camera Error Notice if any */}
                {cameraError && (
                  <div style={{ padding: '0.65rem 0.95rem', borderRadius: '6px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: '0.78125rem' }}>
                    ⚠ {cameraError}
                  </div>
                )}

                {/* Live Camera Viewfinder Box */}
                {cameraActive && (
                  <div
                    style={{
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '2px solid #2563EB',
                      backgroundColor: '#0F172A',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ position: 'relative', maxWidth: '480px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: '#000000', borderRadius: '8px' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          color: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                        }}
                      >
                        ● Align handwritten paper sheet inside frame
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        style={{
                          backgroundColor: '#16A34A',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.55rem 1.35rem',
                          borderRadius: '6px',
                          fontSize: '0.84375rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(22, 163, 74, 0.4)',
                        }}
                      >
                        <span>📸 Snap &amp; Attach Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          padding: '0.55rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.84375rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Attached Image / File Preview Card */}
                {typeof answers[currentQId] === 'object' && answers[currentQId]?.image && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--sp-emerald-bg)',
                      border: '1px solid var(--sp-emerald-border)',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={answers[currentQId].image}
                        alt="Attached Answer Sheet"
                        style={{
                          width: '64px',
                          height: '64px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid var(--sp-border)',
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sp-emerald-text)' }}>
                          ✓ Answer Sheet Attached: {answers[currentQId].fileName || 'photo.jpg'}
                        </div>
                        <div style={{ fontSize: '0.71875rem', color: 'var(--sp-text-muted)', marginTop: '2px' }}>
                          Multimodal Handwritten Capture &bull; {answers[currentQId].timestamp || 'Attached'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="sp-btn-subtle"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        onClick={startCamera}
                      >
                        Retake Photo
                      </button>
                      <button
                        type="button"
                        className="sp-btn-subtle"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#EF4444' }}
                        onClick={handleRemoveImage}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Typing Textarea */}
                <div>
                  <textarea
                    rows={currentQ.type === 'long-answer' || currentQ.type === 'descriptive' ? 6 : 4}
                    className="sp-input"
                    placeholder="Type your written response here, or supplement your attached handwritten sheet..."
                    value={
                      typeof answers[currentQId] === 'object' && answers[currentQId] !== null
                        ? answers[currentQId].text || ''
                        : answers[currentQId] || ''
                    }
                    onChange={(e) => handleTextAnswer(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '0.9375rem',
                      lineHeight: 1.5,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--sp-text-muted)' }}>
                    <span>
                      {typeof answers[currentQId] === 'object' && answers[currentQId]?.image
                        ? '✓ Photo attached & text synchronized'
                        : 'You can write explanation or snap/upload paper solution'}
                    </span>
                    <span>
                      {(typeof answers[currentQId] === 'object' && answers[currentQId] !== null
                        ? answers[currentQId].text || ''
                        : answers[currentQId] || '').length}{' '}
                      characters typed
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation & Tip Bar */}
          <div className="er-bottom-controls">
            <button
              type="button"
              className="er-prev-btn"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              &larr; Previous
            </button>

            <span className="er-tip-text">
              Tip: use &larr; &rarr; keys to move between questions
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                className="er-next-btn"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              >
                Next &rarr;
              </button>
            ) : (
              <button
                type="button"
                className="er-next-btn"
                onClick={handleFinalSubmit}
                style={{ backgroundColor: 'var(--sp-accent-emerald)' }}
              >
                Finalize &amp; Submit &rarr;
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
