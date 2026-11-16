import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../styles/student.css';
import {
  saveActiveExamSession,
  getActiveExamSession,
  clearActiveExamSession,
} from '../../utils/mockApi';
import { extractTextFromImage } from '../../utils/ocrService';

/**
 * Interactive Fullscreen Exam Runner
 * Pixel-matched to ExamAI student test runner specification (matching reference layout):
 * - Clean institutional header with subject title, auto-save status, timer pill, and submit action
 * - Left sidebar with Top Live Camera Monitoring card + Question Navigation Palette & progress
 * - Main content area with Question Card (MCQ options, Short Answer OCR banner & derivation textarea)
 * - Bottom controls with Previous, Keyboard navigation tip, and Next / Finalize actions
 * - Crash & Accidental Reload Recovery (resumes exact question and answers on reload)
 * - Wall-clock Continuous Countdown Timer with auto-submit on timeout
 * - Real-time Proctoring Warning dialog
 */
export default function InteractiveExamRunner({
  exam = null,
  examTitle = 'Academic Examination',
  durationMinutes = 15,
  questions = [],
  onClose,
  onSubmit,
  isProctored = true,
  maxTabSwitches = 3,
  candidateUser = null,
  referencePhoto = null,
}) {
  const examId = exam?.id || 'active_exam';
  const sessionKeyUser = candidateUser?.id || candidateUser?.email || 'candidate';

  // Candidate reference photo from props or exam
  const candidateRefPhoto = referencePhoto || exam?.referencePhoto || null;

  // Restore existing active session if browser crashed or page refreshed
  const existingSession = useRef(getActiveExamSession(examId, sessionKeyUser)).current;

  const [currentIndex, setCurrentIndex] = useState(() =>
    existingSession?.currentIndex !== undefined && existingSession.currentIndex < questions.length
      ? existingSession.currentIndex
      : 0
  );
  const [answers, setAnswers] = useState(() => existingSession?.answers || {});
  const [flaggedIds, setFlaggedIds] = useState(
    () => new Set(existingSession?.flaggedIds || [])
  );
  const [savedStatusText, setSavedStatusText] = useState('All changes saved');

  // Proctoring Metrics State
  const [tabSwitches, setTabSwitches] = useState(() => existingSession?.tabSwitches || 0);
  const [gazeWarnings, setGazeWarnings] = useState(() => existingSession?.gazeWarnings || 0);
  const [faceLostWarnings, setFaceLostWarnings] = useState(() => existingSession?.faceLostWarnings || 0);
  const [multipleFaceCount, setMultipleFaceCount] = useState(() => existingSession?.multipleFaceCount || 0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(() => existingSession?.fullscreenExitCount || 0);
  const [movementAlertCount, setMovementAlertCount] = useState(() => existingSession?.movementAlertCount || 0);
  const [cameraDisconnectCount, setCameraDisconnectCount] = useState(() => existingSession?.cameraDisconnectCount || 0);
  const [cameraConnected, setCameraConnected] = useState(true);
  const [isFullscreenLocked, setIsFullscreenLocked] = useState(false);
  const [proctoringLogs, setProctoringLogs] = useState(() => existingSession?.proctoringLogs || []);

  // =========================================================================================
  // 🔊 VOICE ALERT (SPEECH SYNTHESIS) SETTING
  // Location: milestone2/frontend/src/components/student/InteractiveExamRunner.jsx (Line ~65)
  // To enable voice speaking alerts, change ENABLE_VOICE_ALERT to true.
  // =========================================================================================
  const ENABLE_VOICE_ALERT = false; // Currently DISABLED as requested

  const lastSpokenRef = useRef({ text: '', time: 0 });
  const speakAlert = useCallback((text) => {
    // Voice alerts disabled. Set ENABLE_VOICE_ALERT = true to enable.
    if (!ENABLE_VOICE_ALERT) return;

    try {
      const now = Date.now();
      if (lastSpokenRef.current.text === text && now - lastSpokenRef.current.time < 4500) {
        return;
      }
      lastSpokenRef.current = { text, time: now };
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.05;
        utter.pitch = 1.0;
        utter.volume = 1.0;
        utter.lang = 'en-US';
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }, []);

  // Live Toast & Alert States
  const [restoreNotice, setRestoreNotice] = useState(() =>
    existingSession
      ? `✓ Active Session Restored: Resumed from Question ${existingSession.currentIndex + 1}. Previous responses preserved.`
      : null
  );
  const [activeWarning, setActiveWarning] = useState(null);
  const [pipMinimized, setPipMinimized] = useState(false);
  const [pipFaceStatus, setPipFaceStatus] = useState('VERIFIED'); // 'VERIFIED' | 'WARNING'

  // OCR & Handwriting Recognition States
  const [ocrLoadingMap, setOcrLoadingMap] = useState({});
  const [ocrNoticeMap, setOcrNoticeMap] = useState({});
  const [showSideBySideMap, setShowSideBySideMap] = useState({});
  const [zoomedImage, setZoomedImage] = useState(null);

  // Camera & Video Streams for Written photo snapshot & Live monitoring
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const isPickingFileRef = useRef(false);
  const isUploadingImageRef = useRef(false);
  const isCameraActiveRef = useRef(false);
  const lastFileUploadTimeRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  const [cameraActive, setCameraActive] = useState(false);
  const [, setCameraError] = useState(null);
  const [isDocumentFullscreen, setIsDocumentFullscreen] = useState(() =>
    Boolean(
      typeof document !== 'undefined' &&
      (document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement)
    )
  );

  // Live PiP Video Stream Ref
  const pipVideoRef = useRef(null);
  const pipStreamRef = useRef(null);

  const handlePipVideoRef = useCallback((node) => {
    pipVideoRef.current = node;
    if (node && pipStreamRef.current && node.srcObject !== pipStreamRef.current) {
      node.srcObject = pipStreamRef.current;
      node.play().catch(() => { });
    }
  }, []);

  // Safe helper to restore browser full-screen display mode
  const restoreFullScreenDisplay = useCallback(async () => {
    setIsFullscreenLocked(false);
    setActiveWarning(null);
    try {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsDocumentFullscreen(isFs);
      if (!isFs) {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if (root.webkitRequestFullscreen) {
          await root.webkitRequestFullscreen();
        } else if (root.msRequestFullscreen) {
          await root.msRequestFullscreen();
        }
        setIsDocumentFullscreen(true);
      }
      setIsFullscreenLocked(false);
    } catch (err) {
      console.warn('Auto restore full display non-blocking:', err);
    }
  }, []);

  // 1. Continuous Wall-Clock Expiration Timer Calculation
  const expiresAt = useRef(
    existingSession?.expiresAt || Date.now() + durationMinutes * 60 * 1000
  ).current;

  const getRemainingSeconds = useCallback(() => {
    const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    return diff;
  }, [expiresAt]);

  const [secondsRemaining, setSecondsRemaining] = useState(getRemainingSeconds());

  // Timer Tick & Auto-Submission on 00:00
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getRemainingSeconds();
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        executeSubmission(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getRemainingSeconds]);

  // Cleanly exit full-screen mode when the exam runner unmounts
  useEffect(() => {
    return () => {
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        try {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        } catch (e) {}
      }
    };
  }, []);

  // Periodic Auto-Save into LocalStorage for Crash / Refresh Recovery
  useEffect(() => {
    saveActiveExamSession(examId, sessionKeyUser, {
      currentIndex,
      answers,
      flaggedIds: Array.from(flaggedIds),
      tabSwitches,
      gazeWarnings,
      faceLostWarnings,
      multipleFaceCount,
      fullscreenExitCount,
      movementAlertCount,
      cameraDisconnectCount,
      proctoringLogs,
      expiresAt,
      startedAt: existingSession?.startedAt || Date.now(),
    });
  }, [examId, sessionKeyUser, currentIndex, answers, flaggedIds, tabSwitches, gazeWarnings, faceLostWarnings, multipleFaceCount, fullscreenExitCount, movementAlertCount, cameraDisconnectCount, proctoringLogs, expiresAt]);

  // Format timer mm:ss
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const examStartTimeRef = useRef(existingSession?.startedAt || Date.now());

  // Helper to capture a lightweight snapshot of the live camera feed as evidence
  const captureEvidenceSnapshot = useCallback(() => {
    try {
      const video = pipVideoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return null;
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 160;
      snapCanvas.height = 120;
      const ctx = snapCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 160, 120);
      return snapCanvas.toDataURL('image/jpeg', 0.65);
    } catch (e) {
      return null;
    }
  }, []);

  // Proctor Incident Logger (records exact wall-clock time, elapsed offset & photographic evidence snapshot)
  const logIncident = useCallback((type, title, detail, severity = 'medium', customSnapshot = null) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    const elapsedSec = Math.max(1, Math.round((now.getTime() - examStartTimeRef.current) / 1000));
    const elapsedDisplay = elapsedSec < 60 ? `${elapsedSec}s in` : `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s in`;

    const snapshot = customSnapshot || captureEvidenceSnapshot();

    const entry = {
      id: `inc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: timeStr,
      time: timeStr,
      elapsedDisplay,
      title: title || type,
      event: title || type,
      type,
      detail,
      severity,
      evidenceSnapshot: snapshot || null,
    };
    setProctoringLogs((prev) => [...prev, entry]);
    return entry;
  }, [captureEvidenceSnapshot]);

  // Log reload if session was restored
  useEffect(() => {
    if (existingSession) {
      logIncident('PAGE_RELOAD', 'Page reloaded', 'Candidate reloaded exam session; responses preserved.', 'low');
    }
  }, []);

  // 1. Full-Screen Display Enforcement & Tab Lockdown
  useEffect(() => {
    if (!isProctored) return;

    const checkFullscreenState = () => {
      const now = Date.now();
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      setIsDocumentFullscreen(isFs);

      if (isFs) {
        setIsFullscreenLocked(false);
        return;
      }

      // 1. Mount grace period (first 3.5 seconds after runner mounts)
      if (now - mountTimeRef.current < 3500) {
        restoreFullScreenDisplay();
        return;
      }

      // 2. File upload & camera snapshot grace period (30 seconds)
      if (
        isPickingFileRef.current ||
        isUploadingImageRef.current ||
        isCameraActiveRef.current ||
        (now - lastFileUploadTimeRef.current < 30000)
      ) {
        // Auto-restore silently without violation penalty during file attachment
        restoreFullScreenDisplay();
        return;
      }

      // 3. Real fullscreen exit outside of upload
      restoreFullScreenDisplay();
      setIsFullscreenLocked(true);
      setFullscreenExitCount((prev) => prev + 1);
      const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      logIncident('FULLSCREEN_EXIT', 'Full-screen exited', 'Candidate exited full-screen mode.', 'high');
      speakAlert('Please return to full-screen mode immediately.');
      setActiveWarning({
        title: 'Security Alert',
        subtitle: 'Please return to full-screen mode.',
        message: 'Please return to full-screen mode. The examination must be taken in full-screen.',
        severity: 'high',
        action: 'return_fullscreen',
        timestamp: timeStr,
      });
    };

    // Check full-screen on mount and auto-request
    checkFullscreenState();
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
    } catch (e) { }

    document.addEventListener('fullscreenchange', checkFullscreenState);
    document.addEventListener('webkitfullscreenchange', checkFullscreenState);
    document.addEventListener('mozfullscreenchange', checkFullscreenState);
    document.addEventListener('MSFullscreenChange', checkFullscreenState);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreenState);
      document.removeEventListener('webkitfullscreenchange', checkFullscreenState);
      document.removeEventListener('mozfullscreenchange', checkFullscreenState);
      document.removeEventListener('MSFullscreenChange', checkFullscreenState);
    };
  }, [isProctored, logIncident, speakAlert]);

  // 2. Prevent Common Tab Switching & Navigation Shortcut Keys
  useEffect(() => {
    if (!isProctored) return;

    const handleKeySecurityGuard = (e) => {
      if (
        e.key === 'F5' ||
        e.key === 'F11' ||
        (e.ctrlKey && (e.key === 'r' || e.key === 'R' || e.key === 't' || e.key === 'T' || e.key === 'w' || e.key === 'W' || e.key === 'n' || e.key === 'N')) ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
        speakAlert('Tab switching is strictly prohibited.');
      }
    };

    window.addEventListener('keydown', handleKeySecurityGuard, true);
    return () => window.removeEventListener('keydown', handleKeySecurityGuard, true);
  }, [isProctored, speakAlert]);

  // 3. Tab Switch & Window Blur Detection
  useEffect(() => {
    if (!isProctored) return;

    const handleWindowLeave = () => {
      if (
        isPickingFileRef.current ||
        isUploadingImageRef.current ||
        isCameraActiveRef.current ||
        (Date.now() - lastFileUploadTimeRef.current < 30000)
      ) {
        return;
      }

      setTabSwitches((prev) => {
        const next = prev + 1;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
        logIncident('TAB_SWITCH', 'Tab switching detected', `Tab switched or exam window minimized (Attempt ${next} of ${maxTabSwitches})`, 'high');
        speakAlert('Tab switching detected. Return to your examination.');

        if (next >= maxTabSwitches) {
          setActiveWarning({
            title: 'Security Alert',
            subtitle: 'Tab switching limit exceeded',
            message: `Maximum allowed tab switches (${maxTabSwitches}) reached. Assessment is being locked and submitted for review.`,
            severity: 'high',
            timestamp: timeStr,
          });
          speakAlert('Maximum tab switches exceeded. Exam is being submitted.');
          setTimeout(() => {
            executeSubmission(true);
          }, 2000);
        } else {
          setActiveWarning({
            title: 'Security Alert',
            subtitle: 'Tab switching detected',
            message: 'Tab switching detected. Leaving the examination tab is strictly prohibited.',
            severity: 'high',
            timestamp: timeStr,
          });
        }
        return next;
      });
    };

    const handleVisibility = () => {
      if (
        isPickingFileRef.current ||
        isUploadingImageRef.current ||
        isCameraActiveRef.current ||
        (Date.now() - lastFileUploadTimeRef.current < 30000)
      ) {
        return;
      }
      if (document.hidden) {
        handleWindowLeave();
      }
    };

    const handleWindowFocus = () => {
      if (
        isPickingFileRef.current ||
        isUploadingImageRef.current ||
        (Date.now() - lastFileUploadTimeRef.current < 30000)
      ) {
        setTimeout(() => {
          isPickingFileRef.current = false;
          setIsFullscreenLocked(false);
          setActiveWarning(null);
          restoreFullScreenDisplay();
        }, 150);
      }
    };

    window.addEventListener('blur', handleWindowLeave);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleWindowLeave);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isProctored, maxTabSwitches, logIncident, speakAlert]);

  // 4. Global Seamless User Gesture Capture to Restore Full-Screen Immediately
  useEffect(() => {
    if (!isProctored) return;

    const handleGlobalInteraction = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsDocumentFullscreen(isFs);
      if (!isFs && !isPickingFileRef.current) {
        restoreFullScreenDisplay();
      }
    };

    window.addEventListener('pointerdown', handleGlobalInteraction, true);
    window.addEventListener('click', handleGlobalInteraction, true);
    window.addEventListener('keydown', handleGlobalInteraction, true);

    return () => {
      window.removeEventListener('pointerdown', handleGlobalInteraction, true);
      window.removeEventListener('click', handleGlobalInteraction, true);
      window.removeEventListener('keydown', handleGlobalInteraction, true);
    };
  }, [isProctored, restoreFullScreenDisplay]);

  // 4. Live Proctoring PiP Webcam Stream & Hardware Monitoring
  useEffect(() => {
    let stream = null;
    let mounted = true;

    async function startPipCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        pipStreamRef.current = stream;
        setCameraConnected(true);

        stream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            if (!mounted) return;
            setCameraConnected(false);
            setCameraDisconnectCount((prev) => prev + 1);
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
            logIncident('CAMERA_DISCONNECTED', 'Camera disconnected / disabled', 'Webcam video track ended or camera unplugged.', 'high');
            speakAlert('Warning: Camera is disconnected. Please enable your camera immediately.');
            setActiveWarning({
              title: 'Security Alert',
              subtitle: 'Camera monitoring alert',
              message: 'Camera is disabled or disconnected. Please enable your camera immediately.',
              severity: 'high',
              timestamp: timeStr,
            });
          };
        });

        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = stream;
          pipVideoRef.current.play().catch(() => { });
        }
      } catch (e) {
        console.warn('PiP Camera stream failed:', e);
        if (mounted) {
          setCameraConnected(false);
        }
      }
    }

    if (isProctored) {
      startPipCamera();
    }

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isProctored, logIncident, speakAlert]);

  // 5. Google MediaPipe Edge BlazeFace Detection & High-Speed Vision Engine
  const faceDetectorRef = useRef(null);
  const absentFramesRef = useRef(0);
  const lastFaceAlertTimeRef = useRef(0);
  const prevFacePosRef = useRef(null);

  // Initialize MediaPipe Face Detection
  useEffect(() => {
    if (!isProctored) return;
    let mounted = true;

    async function initEdgeDetector() {
      if (!window.FaceDetection) {
        const loadScript = (src) =>
          new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.crossOrigin = 'anonymous';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });

        try {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js');
        } catch (e) {
          console.warn('MediaPipe load failed:', e);
        }
      }

      if (mounted && window.FaceDetection) {
        try {
          const detector = new window.FaceDetection({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
          });
          detector.setOptions({
            model: 'short',
            minDetectionConfidence: 0.45,
          });
          detector.onResults((results) => {
            if (!mounted) return;
            handleMediaPipeResults(results);
          });
          faceDetectorRef.current = detector;
        } catch (e) {
          console.warn('Detector setup error:', e);
        }
      }
    }

    initEdgeDetector();

    return () => {
      mounted = false;
      if (faceDetectorRef.current && faceDetectorRef.current.close) {
        try { faceDetectorRef.current.close(); } catch (err) { }
      }
    };
  }, [isProctored]);

  // Handle MediaPipe Real-time Detections
  const handleMediaPipeResults = useCallback((results) => {
    if (isPickingFileRef.current || isUploadingImageRef.current || isCameraActiveRef.current) {
      absentFramesRef.current = 0;
      return;
    }

    const detections = results?.detections || [];
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    const alertCooldown = 5000; // 5 seconds between consecutive popups

    // A. Face Not Detected (Candidate moved away from camera / camera covered)
    if (detections.length === 0) {
      absentFramesRef.current++;
      // Immediate trigger after 2 consecutive frames (~600ms)
      if (absentFramesRef.current >= 2 && now - lastFaceAlertTimeRef.current > alertCooldown) {
        lastFaceAlertTimeRef.current = now;
        setFaceLostWarnings((prev) => prev + 1);
        setPipFaceStatus('WARNING');
        logIncident('FACE_ABSENT', 'Your face is not visible.', 'Student moved away from the camera or camera obstructed.', 'high');
        setActiveWarning({
          title: 'Security Alert',
          subtitle: 'Your face is not visible.',
          message: 'Your face is not visible. Please stay in front of the camera and keep looking at the screen.',
          severity: 'high',
          timestamp: timeStr,
        });
        speakAlert('Your face is not visible. Please stay in front of the camera.');
      }
      return;
    }

    absentFramesRef.current = 0;

    // B. Multiple Faces Detected (>1 person in camera)
    if (detections.length > 1) {
      if (now - lastFaceAlertTimeRef.current > alertCooldown) {
        lastFaceAlertTimeRef.current = now;
        setMultipleFaceCount((prev) => prev + 1);
        setPipFaceStatus('WARNING');
        logIncident('MULTIPLE_FACES', 'Multiple faces detected.', 'More than one face detected in the live camera viewport.', 'high');
        setActiveWarning({
          title: 'Security Alert',
          subtitle: 'Multiple faces detected.',
          message: 'Multiple faces detected. Please ensure you are alone in the room.',
          severity: 'high',
          timestamp: timeStr,
        });
        speakAlert('Warning: Multiple faces detected. Please ensure you are alone.');
      }
      return;
    }

    // C. Single Face Detected — Verified & Movement Tracking
    setPipFaceStatus('VERIFIED');
    const firstDet = detections[0];
    const bb = firstDet.boundingBox;
    if (bb) {
      const centerX = bb.xCenter !== undefined ? bb.xCenter : (bb.xmin + (bb.width || 0) / 2);
      const centerY = bb.yCenter !== undefined ? bb.yCenter : (bb.ymin + (bb.height || 0) / 2);

      if (prevFacePosRef.current) {
        const dX = Math.abs(centerX - prevFacePosRef.current.x);
        const dY = Math.abs(centerY - prevFacePosRef.current.y);

        if ((dX > 0.22 || dY > 0.24) && now - lastFaceAlertTimeRef.current > alertCooldown) {
          lastFaceAlertTimeRef.current = now;
          setMovementAlertCount((prev) => prev + 1);
          setPipFaceStatus('WARNING');
          logIncident('UNUSUAL_MOVEMENT', 'Unusual movement detected.', 'Rapid head or body movement detected outside threshold.', 'medium');
          setActiveWarning({
            title: 'Security Alert',
            subtitle: 'Please stay in front of the camera.',
            message: 'Please stay in front of the camera and keep watching the screen.',
            severity: 'medium',
            timestamp: timeStr,
          });
          speakAlert('Please keep watching in the camera and do not move away.');
        }
      }
      prevFacePosRef.current = { x: centerX, y: centerY };
    }
  }, [logIncident, speakAlert]);

  // Fallback Vision Check (runs if MediaPipe is not ready yet)
  const runFallbackVisionCheck = useCallback((video) => {
    if (isPickingFileRef.current || isUploadingImageRef.current || isCameraActiveRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 60;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, 80, 60);
      const data = ctx.getImageData(0, 0, 80, 60).data;

      let skinCount = 0;
      let centerSkinCount = 0;
      let leftCount = 0;
      let rightCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const pIdx = i / 4;
        const x = pIdx % 80;
        const y = Math.floor(pIdx / 80);

        if (r > 60 && g > 35 && b > 20 && r > g && r > b && (r - g) >= 8) {
          skinCount++;
          if (x >= 22 && x <= 58 && y >= 10 && y <= 50) {
            centerSkinCount++;
          }
          if (x < 28) leftCount++;
          if (x > 52) rightCount++;
        }
      }

      const now = Date.now();
      const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

      // If center skin count drops below threshold, face is absent
      if (centerSkinCount < 20) {
        absentFramesRef.current++;
        if (absentFramesRef.current >= 2 && now - lastFaceAlertTimeRef.current > 5000) {
          lastFaceAlertTimeRef.current = now;
          setFaceLostWarnings((prev) => prev + 1);
          setPipFaceStatus('WARNING');
          logIncident('FACE_ABSENT', 'Your face is not visible.', 'Student moved away from the camera or camera obstructed.', 'high');
          setActiveWarning({
            title: 'Security Alert',
            subtitle: 'Your face is not visible.',
            message: 'Your face is not visible. Please stay in front of the camera and keep looking at the screen.',
            severity: 'high',
            timestamp: timeStr,
          });
          speakAlert('Your face is not visible. Please stay in front of the camera and keep watching.');
        }
        return;
      }

      absentFramesRef.current = 0;

      if (leftCount > 65 && rightCount > 65 && now - lastFaceAlertTimeRef.current > 5000) {
        lastFaceAlertTimeRef.current = now;
        setMultipleFaceCount((prev) => prev + 1);
        setPipFaceStatus('WARNING');
        logIncident('MULTIPLE_FACES', 'Multiple faces detected.', 'More than one face detected in the live camera feed.', 'high');
        setActiveWarning({
          title: 'Security Alert',
          subtitle: 'Multiple faces detected.',
          message: 'Multiple faces detected. Please ensure you are alone in the room.',
          severity: 'high',
          timestamp: timeStr,
        });
        speakAlert('Warning: Multiple faces detected. Please ensure you are alone.');
        return;
      }

      setPipFaceStatus('VERIFIED');
    } catch (e) { }
  }, [logIncident, speakAlert]);

  // High-Speed Real-time Camera Vision Loop (every 300ms)
  useEffect(() => {
    if (!isProctored) return;

    let mounted = true;
    const interval = setInterval(async () => {
      if (!mounted) return;
      const video = pipVideoRef.current;
      if (!video || video.readyState < 2 || video.paused || video.ended) return;

      if (faceDetectorRef.current) {
        try {
          await faceDetectorRef.current.send({ image: video });
        } catch (e) {
          runFallbackVisionCheck(video);
        }
      } else {
        runFallbackVisionCheck(video);
      }
    }, 300);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isProctored, runFallbackVisionCheck]);

  // Test Alert Simulator for easy demonstration with live speech synthesis
  const testAlertIndexRef = useRef(0);
  const triggerManualWarning = () => {
    const alerts = [
      {
        title: 'Security Alert',
        subtitle: 'Your face is not visible.',
        message: 'Your face is not visible. Please stay in front of the camera.',
        type: 'FACE_ABSENT',
        incTitle: 'Your face is not visible.',
        detail: 'Candidate moved away from the camera or obstructed the lens.',
        severity: 'high',
        speech: 'Your face is not visible. Please stay in front of the camera and keep watching.',
        incCount: () => setFaceLostWarnings((p) => p + 1),
      },
      {
        title: 'Security Alert',
        subtitle: 'Multiple faces detected.',
        message: 'Multiple faces detected. Please ensure you are alone in the room.',
        type: 'MULTIPLE_FACES',
        incTitle: 'Multiple faces detected.',
        detail: 'More than one face was detected in camera view.',
        severity: 'high',
        speech: 'Multiple faces detected. Please ensure you are alone in the room.',
        incCount: () => setMultipleFaceCount((p) => p + 1),
      },
      {
        title: 'Security Alert',
        subtitle: 'Please stay in front of the camera.',
        message: 'Please stay in front of the camera and avoid unusual movements.',
        type: 'UNUSUAL_MOVEMENT',
        incTitle: 'Unusual movement detected.',
        detail: 'Candidate made sudden or excessive movements.',
        severity: 'medium',
        speech: 'Please stay in front of the camera and keep watching. Do not move away.',
        incCount: () => setMovementAlertCount((p) => p + 1),
      },
      {
        title: 'Security Alert',
        subtitle: 'Tab switching detected',
        message: 'Tab switching detected. Leaving the examination tab is strictly prohibited.',
        type: 'TAB_SWITCH',
        incTitle: 'Tab switching detected',
        detail: 'Exam window lost focus / candidate switched tab.',
        severity: 'high',
        speech: 'Tab switching detected. Return to your examination screen immediately.',
        incCount: () => setTabSwitches((p) => p + 1),
      },
      {
        title: 'Security Alert',
        subtitle: 'Please return to full-screen mode.',
        message: 'Please return to full-screen mode. The examination must be taken in full-screen.',
        type: 'FULLSCREEN_EXIT',
        incTitle: 'Full-screen exited',
        detail: 'Candidate exited full-screen mode.',
        severity: 'high',
        action: 'return_fullscreen',
        speech: 'Please return to full-screen mode immediately.',
        incCount: () => setFullscreenExitCount((p) => p + 1),
      },
    ];

    const chosen = alerts[testAlertIndexRef.current % alerts.length];
    testAlertIndexRef.current++;

    chosen.incCount();
    setPipFaceStatus('WARNING');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    logIncident(chosen.type, chosen.incTitle, chosen.detail, chosen.severity);
    speakAlert(chosen.speech);
    setActiveWarning({
      title: chosen.title,
      subtitle: chosen.subtitle,
      message: chosen.message,
      severity: chosen.severity,
      action: chosen.action,
      timestamp: timeStr,
    });
    setTimeout(() => setPipFaceStatus('VERIFIED'), 3500);
  };

  const currentQ = questions[currentIndex] || {};
  const currentQId = currentQ.id || `q_${currentIndex}`;

  // Helper to check if question is answered
  const isQuestionAnswered = (ans) => {
    if (ans === undefined || ans === null || ans === '') return false;
    if (typeof ans === 'number') return true;
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === 'object') return Boolean((ans.text && ans.text.trim()) || ans.image);
    if (typeof ans === 'string') return ans.trim().length > 0;
    return false;
  };

  const answeredCount = Object.keys(answers).filter((k) => isQuestionAnswered(answers[k])).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // Option selection
  const handleSelectOption = (optIdx) => {
    setAnswers((prev) => ({ ...prev, [currentQId]: optIdx }));
    triggerSavedIndicator();
  };

  const handleToggleMultiSelect = (optIdx) => {
    const existing = answers[currentQId] || [];
    const updated = existing.includes(optIdx)
      ? existing.filter((i) => i !== optIdx)
      : [...existing, optIdx];
    setAnswers((prev) => ({ ...prev, [currentQId]: updated }));
    triggerSavedIndicator();
  };

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

  // Downscale high-resolution photos (e.g. from mobile cameras) to keep state lightweight and fast
  const compressImageIfNeeded = (dataUrl, maxDimension = 1600) => {
    return new Promise((resolve) => {
      try {
        if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
          resolve(dataUrl);
          return;
        }
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width <= maxDimension && height <= maxDimension && dataUrl.length < 1500000) {
            resolve(dataUrl);
            return;
          }
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      } catch {
        resolve(dataUrl);
      }
    });
  };

  const handleImageAttach = async (dataUrl, fileName) => {
    isUploadingImageRef.current = true;
    setActiveWarning(null); // Explicitly suppress and dismiss any proctoring alert on image upload
    const qId = currentQId;
    const currentQItem = questions[currentIndex] || {};
    const currentVal = answers[qId];
    const currentText =
      typeof currentVal === 'object' && currentVal !== null
        ? currentVal.text || ''
        : typeof currentVal === 'string'
          ? currentVal
          : '';

    // Attach image immediately for instant visual response
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        text: currentText,
        image: dataUrl,
        fileName: fileName || 'written_sheet.jpg',
      },
    }));
    triggerSavedIndicator();

    // Trigger OCR loading state
    setOcrLoadingMap((prev) => ({ ...prev, [qId]: true }));

    try {
      const qContext = currentQItem?.title || currentQItem?.question || '';
      const ocrResult = await extractTextFromImage(dataUrl, fileName, qContext);

      if (ocrResult && ocrResult.success && ocrResult.text) {
        const extracted = ocrResult.text.trim();

        setAnswers((prev) => {
          const prevVal = prev[qId];
          const prevText =
            typeof prevVal === 'object' && prevVal !== null
              ? prevVal.text || ''
              : typeof prevVal === 'string'
                ? prevVal
                : '';

          const nextText = extracted;

          return {
            ...prev,
            [qId]: {
              text: nextText,
              image: dataUrl,
              fileName: fileName || 'written_sheet.jpg',
              ocrOriginalText: extracted,
              ocrStatus: 'completed',
              ocrSource: ocrResult.source,
            },
          };
        });
      }
    } catch (err) {
      console.warn('OCR error:', err);
    } finally {
      setOcrLoadingMap((prev) => ({ ...prev, [qId]: false }));
      triggerSavedIndicator();
      setTimeout(() => {
        isUploadingImageRef.current = false;
        setActiveWarning(null);
        setIsFullscreenLocked(false);
        restoreFullScreenDisplay();
      }, 1000);
    }
  };

  const handleRerunOcr = (qId) => {
    const val = answers[qId];
    if (val && typeof val === 'object' && val.image) {
      handleImageAttach(val.image, val.fileName || 'written_sheet.jpg');
    }
  };

  const handleRemoveImage = () => {
    const currentVal = answers[currentQId];
    if (typeof currentVal === 'object' && currentVal !== null) {
      setAnswers((prev) => ({
        ...prev,
        [currentQId]: {
          text: currentVal.text || '',
        },
      }));
      setOcrNoticeMap((prev) => {
        const next = { ...prev };
        delete next[currentQId];
        return next;
      });
      setShowSideBySideMap((prev) => {
        const next = { ...prev };
        delete next[currentQId];
        return next;
      });
      triggerSavedIndicator();
    }
  };

  const toggleSideBySide = (qId) => {
    setShowSideBySideMap((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Camera capture for written solution sheets
  const startCamera = async () => {
    isCameraActiveRef.current = true;
    setActiveWarning(null);
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
      setCameraError('Unable to access camera for written sheet capture.');
      setCameraActive(false);
      isCameraActiveRef.current = false;
    }
  };

  const stopCamera = () => {
    isCameraActiveRef.current = false;
    setActiveWarning(null);
    setIsFullscreenLocked(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    restoreFullScreenDisplay();
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
    handleImageAttach(dataUrl, `written_solution_${Date.now()}.jpg`);
    stopCamera();
    restoreFullScreenDisplay();
  };

  // Modern Chromium File System Access API: Auto-restores full-screen mode instantly upon file selection
  const handleUploadPhotoClick = async () => {
    lastFileUploadTimeRef.current = Date.now();
    setActiveWarning(null);
    setIsFullscreenLocked(false);

    if (typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function') {
      try {
        isPickingFileRef.current = true;
        const [fileHandle] = await window.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: 'Image or PDF Document',
              accept: {
                'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp'],
                'application/pdf': ['.pdf'],
              },
            },
          ],
        });

        isPickingFileRef.current = false;
        isUploadingImageRef.current = true;
        lastFileUploadTimeRef.current = Date.now();

        // 🚀 AUTOMATICALLY RESTORE FULL-SCREEN IMMEDIATELY IN THE USER GESTURE PROMISE!
        await restoreFullScreenDisplay();

        const file = await fileHandle.getFile();
        if (file) {
          const fileName = file.name || 'written_response.jpg';
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const rawDataUrl = ev.target?.result;
            if (rawDataUrl) {
              const optimized = await compressImageIfNeeded(rawDataUrl);
              await handleImageAttach(optimized, fileName);
              await restoreFullScreenDisplay();
            }
          };
          reader.onerror = () => {
            isUploadingImageRef.current = false;
            restoreFullScreenDisplay();
          };
          reader.readAsDataURL(file);
        } else {
          isUploadingImageRef.current = false;
          restoreFullScreenDisplay();
        }
        return;
      } catch (err) {
        isPickingFileRef.current = false;
        await restoreFullScreenDisplay();
        if (err.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback for browsers without showOpenFilePicker or if security policy restricts it
    isPickingFileRef.current = true;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e) => {
    isPickingFileRef.current = false;
    isUploadingImageRef.current = true;
    lastFileUploadTimeRef.current = Date.now();
    setActiveWarning(null); // Ensure no alert shows when image is selected
    setIsFullscreenLocked(false);

    // Auto-restore full-screen display immediately on the file change user gesture & stagger retries
    restoreFullScreenDisplay();
    setTimeout(restoreFullScreenDisplay, 50);
    setTimeout(restoreFullScreenDisplay, 200);
    setTimeout(restoreFullScreenDisplay, 500);

    const file = e.target.files?.[0];
    if (!file) {
      isUploadingImageRef.current = false;
      restoreFullScreenDisplay();
      return;
    }
    const fileName = file.name || 'written_response.jpg';
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawDataUrl = ev.target?.result;
      if (rawDataUrl) {
        const optimized = await compressImageIfNeeded(rawDataUrl);
        await handleImageAttach(optimized, fileName);
        restoreFullScreenDisplay();
        setTimeout(restoreFullScreenDisplay, 100);
      }
    };
    reader.onerror = (err) => {
      console.warn('FileReader error:', err);
      isUploadingImageRef.current = false;
      restoreFullScreenDisplay();
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste support (Ctrl+V) for instant image attach without exiting full-screen
  const handlePasteImage = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          lastFileUploadTimeRef.current = Date.now();
          isUploadingImageRef.current = true;
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const rawDataUrl = ev.target?.result;
            if (rawDataUrl) {
              const optimized = await compressImageIfNeeded(rawDataUrl);
              await handleImageAttach(optimized, `pasted_solution_${Date.now()}.png`);
              restoreFullScreenDisplay();
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  }, [restoreFullScreenDisplay]);

  useEffect(() => {
    stopCamera();
    return () => stopCamera();
  }, [currentIndex]);

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

  const triggerSavedIndicator = () => {
    setSavedStatusText('Saving...');
    setTimeout(() => {
      setSavedStatusText('All changes saved');
    }, 350);
  };

  // Final submission packaging
  const executeSubmission = (isAuto = false) => {
    clearActiveExamSession(examId, sessionKeyUser);

    const timeSpent = Math.max(1, durationMinutes * 60 - getRemainingSeconds());
    const totalSuspiciousActivities =
      tabSwitches +
      fullscreenExitCount +
      multipleFaceCount +
      faceLostWarnings +
      movementAlertCount +
      cameraDisconnectCount +
      gazeWarnings;
    const totalIncidents = totalSuspiciousActivities;

    const penalty =
      tabSwitches * 15 +
      fullscreenExitCount * 15 +
      multipleFaceCount * 25 +
      faceLostWarnings * 15 +
      movementAlertCount * 10 +
      cameraDisconnectCount * 20 +
      gazeWarnings * 5;

    const integrityScore = Math.max(10, 100 - penalty);
    const integrityStatus =
      integrityScore >= 80 ? 'Clean (Verified Integrity)' : integrityScore >= 55 ? 'Suspicious (Warnings Recorded)' : 'High Risk (Flagged)';

    const proctoringReport = {
      integrityScore,
      integrityStatus,
      totalSuspiciousActivities,
      totalIncidents,
      totalMovedAway: faceLostWarnings,
      totalFaceAbsences: faceLostWarnings,
      totalMultipleFaces: multipleFaceCount,
      totalTabSwitches: tabSwitches,
      totalFullscreenExits: fullscreenExitCount,
      totalMovementAlerts: movementAlertCount,
      totalCameraDisconnects: cameraDisconnectCount,
      totalGazeDeviations: gazeWarnings,
      referencePhoto: candidateRefPhoto,
      incidentTimeline: proctoringLogs,
      isAutoSubmitted: isAuto,
      verifiedAt: new Date().toISOString(),
    };

    // Safely exit full-screen mode when exam finishes/submits
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ) {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } catch (e) {
        console.warn('Exit fullscreen non-blocking catch:', e);
      }
    }

    onSubmit(answers, timeSpent, proctoringReport);
  };

  const handleFinalSubmit = () => {
    const unAnswered = questions.length - answeredCount;
    if (unAnswered > 0) {
      const proceed = window.confirm(
        `You have ${unAnswered} unanswered question${unAnswered > 1 ? 's' : ''}. Are you sure you want to finalize and submit your examination?`
      );
      if (!proceed) return;
    }
    executeSubmission(false);
  };

  // Keyboard navigation handler (ArrowLeft / ArrowRight)
  const handleKeyDown = useCallback(
    (e) => {
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

  // Current written answer and word count
  const currentTextAnswer =
    typeof answers[currentQId] === 'object' && answers[currentQId] !== null
      ? answers[currentQId].text || ''
      : typeof answers[currentQId] === 'string'
        ? answers[currentQId]
        : '';
  const wordCount = currentTextAnswer.trim() ? currentTextAnswer.trim().split(/\s+/).length : 0;

  // Auto-restore full-screen display on any user interaction within the exam
  const handleRunnerClick = useCallback(() => {
    if (!isProctored || isPickingFileRef.current) return;
    const isFs = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    if (!isFs) {
      restoreFullScreenDisplay();
    }
  }, [isProctored, restoreFullScreenDisplay]);

  return (
    <div className="er-fullscreen-overlay" onClickCapture={handleRunnerClick}>
      {/* Top Notification Toast (Session Restored Notification) */}
      {restoreNotice && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            backgroundColor: '#065F46',
            color: '#FFFFFF',
            padding: '0.65rem 1.35rem',
            borderRadius: '30px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            fontSize: '0.84375rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'spFadeIn 0.3s ease',
          }}
        >
          <span>{restoreNotice}</span>
          <button
            type="button"
            onClick={() => setRestoreNotice(null)}
            style={{ background: 'transparent', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontSize: '1rem', marginLeft: '4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Full-Screen Lockdown Barrier (Blocks entire screen if full-screen mode is exited) */}
      {isFullscreenLocked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999999,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            animation: 'spFadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '2.25rem',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              border: '2px solid #EF4444',
              textAlign: 'center',
              animation: 'spSlideUp 0.25s ease',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.85rem',
                margin: '0 auto 1.25rem',
              }}
            >
              🛡️
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#DC2626',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                backgroundColor: '#FEF2F2',
                padding: '4px 12px',
                borderRadius: '20px',
              }}
            >
              FULL-SCREEN LOCKDOWN ACTIVE
            </span>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '0.85rem 0 0.5rem' }}>
              Please return to full-screen mode
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              The examination requires full display lockdown with all other browser tabs and applications hidden. Exiting full-screen has been recorded with an exact timestamp and photographic evidence.
            </p>

            <button
              type="button"
              onClick={async () => {
                try {
                  const root = document.documentElement;
                  if (root.requestFullscreen) {
                    await root.requestFullscreen();
                  } else if (root.webkitRequestFullscreen) {
                    await root.webkitRequestFullscreen();
                  }
                  setIsFullscreenLocked(false);
                } catch (e) {
                  console.warn('Re-enter fullscreen error:', e);
                  setIsFullscreenLocked(false);
                }
              }}
              style={{
                width: '100%',
                padding: '0.9rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>⛶</span>
              <span>Re-enter Full-Screen Mode to Continue &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* Security Alert Box for Students (Small Floating Security Dialog) */}
      {activeWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
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
              maxWidth: '460px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.3)',
              border: '1.5px solid #FCD34D',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              animation: 'spSlideUp 0.2s ease',
            }}
          >
            {/* Header row with Shield, Alert Tag and Timestamp */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: activeWarning.severity === 'high' ? '#FEF2F2' : '#FEF3C7',
                    color: activeWarning.severity === 'high' ? '#DC2626' : '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  🛡️
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: activeWarning.severity === 'high' ? '#DC2626' : '#D97706',
                    }}
                  >
                    AI Proctoring Alert
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '1px 0 0' }}>
                    {activeWarning.subtitle || activeWarning.title || 'Security Warning'}
                  </h3>
                </div>
              </div>

              {activeWarning.timestamp && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#64748B',
                    backgroundColor: '#F1F5F9',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  ⏱ {activeWarning.timestamp}
                </span>
              )}
            </div>

            {/* Warning Message Card */}
            <div
              style={{
                backgroundColor: activeWarning.severity === 'high' ? '#FFF5F5' : '#FFFBEB',
                border: `1px solid ${activeWarning.severity === 'high' ? '#FED7D7' : '#FDE68A'}`,
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '0.875rem',
                color: '#1E293B',
                lineHeight: 1.5,
                fontWeight: 600,
              }}
            >
              {activeWarning.message}
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
              Every warning is recorded with exact timestamp and photographic evidence for course instructor review.
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.35rem' }}>
              {activeWarning.action === 'return_fullscreen' && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen();
                      } else if (document.documentElement.webkitRequestFullscreen) {
                        document.documentElement.webkitRequestFullscreen();
                      }
                    } catch (e) { }
                    setActiveWarning(null);
                  }}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    fontSize: '0.84375rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                  }}
                >
                  ⛶ Return to Full-Screen Mode
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveWarning(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  fontSize: '0.84375rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
                }}
              >
                I Understand &amp; Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar (Matching Reference Screenshot) */}
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
            <span className="er-test-title" style={{ textTransform: 'capitalize' }}>
              {examTitle}
            </span>
            <span className="er-saved-status">
              <span className="checkmark">✓</span> {savedStatusText}
            </span>
          </div>
        </div>

        <div className="er-header-actions">
          {/* Timer Pill */}
          <div className={`er-timer-pill ${secondsRemaining < 180 ? 'urgent' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          {/* Submit Button (Matching Right Image) */}
          <button
            type="button"
            className="er-submit-btn"
            onClick={handleFinalSubmit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 1.15rem',
              borderRadius: '8px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.8125rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* Main Layout Body (Matching Right Image Layout) */}
      <main className="er-main-layout">
        {/* Left Column: Proctoring Camera & Question Navigator Sidebar */}
        <aside style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top Monitoring Card (Matching Right Screenshot) */}
          {isProctored && (
            <div
              style={{
                backgroundColor: 'var(--sp-surface)',
                border: pipFaceStatus === 'WARNING' ? '1.5px solid #F59E0B' : '1px solid var(--sp-border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--sp-shadow-card)',
              }}
            >
              {/* Monitoring Header */}
              <div
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--sp-border)',
                  backgroundColor: 'var(--sp-surface-hover)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--sp-text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: pipFaceStatus === 'WARNING' ? '#F59E0B' : '#10B981',
                      boxShadow: pipFaceStatus === 'WARNING' ? '0 0 6px #F59E0B' : '0 0 6px #10B981',
                    }}
                  />
                  <span>⛶ Monitoring</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={triggerManualWarning}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#DC2626',
                      borderRadius: '6px',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      cursor: 'pointer',
                    }}
                    title="Simulate a proctoring alert for audit telemetry"
                  >
                    ⚡ Test Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => setPipMinimized(!pipMinimized)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--sp-text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      padding: '2px 4px',
                    }}
                    title={pipMinimized ? 'Expand Camera' : 'Collapse Camera'}
                  >
                    {pipMinimized ? '▼' : '▲'}
                  </button>
                </div>
              </div>

              {/* Live Video Frame */}
              {!pipMinimized && (
                <div>
                  <div style={{ position: 'relative', width: '100%', height: '150px', backgroundColor: '#070D1B', overflow: 'hidden' }}>
                    <video
                      ref={handlePipVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)', // Mirror feed
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        color: pipFaceStatus === 'WARNING' ? '#FBBF24' : '#34D399',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {pipFaceStatus === 'WARNING' ? '⚠️ Gaze Alert' : '✓ Verified'}
                    </div>
                  </div>

                  {/* Reference Photo vs Live Feed Identity Verification */}
                  {candidateRefPhoto && (
                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#F8FAFC',
                        borderTop: '1px solid var(--sp-border)',
                        borderBottom: '1px solid var(--sp-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img
                          src={candidateRefPhoto}
                          alt="ID Reference"
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                            border: '1.5px solid #10B981',
                          }}
                        />
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--sp-text-secondary)' }}>
                          ID Reference
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: '#059669',
                          backgroundColor: '#ECFDF5',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #A7F3D0',
                        }}
                      >
                        ✓ Match 98%
                      </span>
                    </div>
                  )}

                  {/* Live Security Metrics Chips */}
                  <div
                    style={{
                      padding: '6px 8px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--sp-surface-hover)',
                      borderTop: candidateRefPhoto ? 'none' : '1px solid var(--sp-border)',
                    }}
                  >
                    <div style={{ color: tabSwitches > 0 ? '#DC2626' : 'var(--sp-text-muted)' }}>
                      Tabs: {tabSwitches}/{maxTabSwitches}
                    </div>
                    <div style={{ color: multipleFaceCount > 0 ? '#DC2626' : '#059669' }}>
                      People: {multipleFaceCount > 0 ? '⚠️ >1' : '1 (Solo)'}
                    </div>
                    <div style={{ color: fullscreenExitCount > 0 ? '#DC2626' : '#059669' }}>
                      Screen: {fullscreenExitCount > 0 ? '⚠️ Exited' : '✓ Full'}
                    </div>
                    <div style={{ color: cameraConnected ? '#059669' : '#DC2626' }}>
                      Cam: {cameraConnected ? '✓ Active' : '⚠️ Off'}
                    </div>
                  </div>

                  {/* Device-only caption */}
                  <div
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.65rem',
                      color: 'var(--sp-text-muted)',
                      backgroundColor: 'var(--sp-surface)',
                      lineHeight: 1.3,
                      borderTop: '1px solid var(--sp-border)',
                    }}
                  >
                    AI Edge Monitoring &bull; Identity verified
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Questions Palette Card (.er-sidebar from student.css) */}
          <div className="er-sidebar" style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="er-sidebar-header">
              <span className="er-sidebar-title">Questions</span>
              <span className="er-sidebar-progress-label">
                {answeredCount}/{questions.length} answered
              </span>
            </div>

            <div className="er-progress-track">
              <div className="er-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="er-palette-grid">
              {questions.map((q, idx) => {
                const qId = q.id || `q_${idx}`;
                const isAnswered = isQuestionAnswered(answers[qId]);
                const isFlagged = flaggedIds.has(qId);
                const isCurrent = idx === currentIndex;

                let stateClass = '';
                if (isCurrent) stateClass = 'active';
                else if (isAnswered) stateClass = 'answered';
                else if (isFlagged) stateClass = 'flagged';

                return (
                  <button
                    key={qId}
                    type="button"
                    className={`er-palette-btn ${stateClass}`}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

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
          </div>
        </aside>

        {/* Right Column: Main Question Display (.er-content-area from student.css) */}
        <section className="er-content-area">
          <div className="er-question-card">
            {/* Top Card Header */}
            {(() => {
              const rawType = String(currentQ.type || currentQ.question_type || '').toLowerCase();
              const hasOptions = Array.isArray(currentQ.options) && currentQ.options.length > 0;
              const isMultiSelect = (rawType === 'multi-select' || rawType === 'multiselect' || rawType === 'multi_select') && hasOptions;
              const isMcq = (rawType === 'mcq' || rawType === 'multiple-choice' || rawType === 'multiple_choice' || (!rawType && hasOptions)) && hasOptions && !isMultiSelect;
              const isWritten = !isMcq && !isMultiSelect;

              return (
                <>
                  <div className="er-card-header">
                    <div className="er-card-header-left">
                      <span className="er-question-number">
                        Question {currentIndex + 1} of {questions.length}
                      </span>

                      <span className="er-type-pill">
                        {isMultiSelect
                          ? 'Multi-select'
                          : isWritten
                            ? rawType.includes('long') ? 'Long answer' : 'Short answer'
                            : 'Multiple choice'}
                      </span>

                      <span className="er-marks-pill">
                        {currentQ.marks || 5} mark{Number(currentQ.marks) === 1 ? '' : 's'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`er-flag-btn ${isCurrentFlagged ? 'flagged' : ''}`}
                      onClick={handleToggleFlag}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentFlagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                      <span>{isCurrentFlagged ? 'Flagged' : 'Flag for review'}</span>
                    </button>
                  </div>

                  {/* Question Prompt Title */}
                  <h2 className="er-question-text">
                    {currentQ.question || currentQ.title || 'Question prompt'}
                  </h2>

                  {/* Answer Mode 1: Multiple Choice Options List */}
                  {isMcq && currentQ.options && (
                    <div className="er-options-list">
                      {currentQ.options.map((opt, optIdx) => {
                        const optText = typeof opt === 'object' && opt ? opt.text || opt : String(opt);
                        const isSelected = answers[currentQId] === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`er-option-row ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectOption(optIdx)}
                          >
                            <div className="er-option-badge">
                              {optionLetters[optIdx] || optIdx + 1}
                            </div>
                            <div className="er-option-text">{optText}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answer Mode 2: Multi-select Options List */}
                  {isMultiSelect && currentQ.options && (
                    <div className="er-options-list">
                      {currentQ.options.map((opt, optIdx) => {
                        const optText = typeof opt === 'object' && opt ? opt.text || opt : String(opt);
                        const isSelected = Array.isArray(answers[currentQId]) && answers[currentQId].includes(optIdx);

                        return (
                          <div
                            key={optIdx}
                            className={`er-option-row ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleToggleMultiSelect(optIdx)}
                          >
                            <div className="er-option-badge">
                              {isSelected ? '✓' : optionLetters[optIdx] || optIdx + 1}
                            </div>
                            <div className="er-option-text">{optText}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answer Mode 3: Short answer / Written Solution with OCR Extraction & Student Verification */}
                  {isWritten && (
                    <div onPaste={handlePasteImage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Wrote it on paper OCR upload bar */}
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#475569' }}>
                          <span style={{ fontSize: '1.1rem', color: '#6366F1' }}>✨</span>
                          <span>
                            <strong>Handwritten solution?</strong> Snap a live photo, upload an image, or paste with Ctrl+V — text will be transcribed automatically.
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={handleUploadPhotoClick}
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#334155',
                              fontSize: '0.78125rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <span>☁</span>
                            <span>Upload photo</span>
                          </button>

                          <button
                            type="button"
                            onClick={startCamera}
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#334155',
                              fontSize: '0.78125rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <span>📷</span>
                            <span>Take photo</span>
                          </button>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            onCancel={() => {
                              isPickingFileRef.current = false;
                              isUploadingImageRef.current = false;
                              lastFileUploadTimeRef.current = Date.now();
                              restoreFullScreenDisplay();
                            }}
                          />
                        </div>
                      </div>

                      {/* Live Camera Viewport for Snapshot */}
                      {cameraActive && (
                        <div style={{ position: 'relative', width: '100%', maxWidth: '460px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1', backgroundColor: '#000' }}>
                          <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }} autoPlay playsInline />
                          <button
                            type="button"
                            onClick={capturePhoto}
                            style={{
                              position: 'absolute',
                              bottom: '12px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              backgroundColor: '#4F46E5',
                              color: '#FFF',
                              border: 'none',
                              padding: '8px 18px',
                              borderRadius: '20px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: '0.8125rem',
                            }}
                          >
                            Capture Sheet &rarr;
                          </button>
                        </div>
                      )}

                      {/* Attached Photo Card with Thumbnail & Controls */}
                      {typeof answers[currentQId] === 'object' && answers[currentQId]?.image && (() => {
                        const currentAnswer = answers[currentQId];
                        const rawFileName = currentAnswer.fileName || 'uploaded_document';
                        const extMatch = rawFileName.match(/\.([a-zA-Z0-9]+)$/);
                        const fileExt = (extMatch ? extMatch[1] : (currentAnswer.image?.startsWith('data:application/pdf') ? 'pdf' : 'jpg')).toUpperCase();
                        const isPdf = fileExt === 'PDF' || currentAnswer.image?.startsWith('data:application/pdf');

                        return (
                          <div className="er-ocr-attach-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {/* Thumbnail / Document Preview */}
                              <div
                                className="er-ocr-thumb-preview"
                                onClick={() => setZoomedImage(currentAnswer.image)}
                                title={isPdf ? "Click to view full PDF document" : "Click to zoom and view full answer sheet"}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '1px solid #CBD5E1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  backgroundColor: isPdf ? '#FEE2E2' : '#0F172A',
                                  flexShrink: 0,
                                }}
                              >
                                {isPdf ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.25rem' }}>📄</span>
                                    <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#991B1B' }}>PDF</span>
                                  </div>
                                ) : (
                                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <img src={currentAnswer.image} alt="Upload sheet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div className="er-ocr-thumb-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 120ms' }}>🔍</div>
                                  </div>
                                )}
                              </div>

                              {/* File details with prominent EXTENSION badge */}
                              <div className="er-ocr-details">
                                <div className="er-ocr-filename" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span
                                    style={{
                                      fontSize: '0.6875rem',
                                      fontWeight: 800,
                                      padding: '2px 7px',
                                      borderRadius: '5px',
                                      backgroundColor: isPdf ? '#EF4444' : '#4F46E5',
                                      color: '#FFFFFF',
                                      letterSpacing: '0.05em',
                                      textTransform: 'uppercase',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    }}
                                  >
                                    .{fileExt}
                                  </span>
                                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1E293B' }}>
                                    {rawFileName}
                                  </span>
                                </div>

                                <div className="er-ocr-badge-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                  {ocrLoadingMap[currentQId] ? (
                                    <span className="er-ocr-pill-loading">
                                      <span>⏳</span> AI OCR Transcribing...
                                    </span>
                                  ) : (
                                    <span className="er-ocr-pill-success">
                                      <span>✓</span> .{fileExt} Transcribed &amp; Synced
                                    </span>
                                  )}
                                  <span style={{ fontSize: '0.71875rem', color: '#64748B' }}>
                                    Extension: <strong>.{fileExt}</strong> &bull; Click thumbnail to inspect
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="er-ocr-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {!isPdf && (
                                <button
                                  type="button"
                                  className={`er-ocr-btn-action ${showSideBySideMap[currentQId] ? 'active' : ''}`}
                                  onClick={() => toggleSideBySide(currentQId)}
                                  title="Toggle side-by-side comparison"
                                >
                                  <span>◫</span>
                                  <span>{showSideBySideMap[currentQId] ? 'Standard' : 'Side-by-Side'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                className="er-ocr-btn-action"
                                onClick={() => handleRerunOcr(currentQId)}
                                title="Re-run text extraction from file"
                                disabled={ocrLoadingMap[currentQId]}
                              >
                                <span>🔄</span>
                                <span>Re-scan</span>
                              </button>

                              <button
                                type="button"
                                className="er-ocr-btn-delete"
                                onClick={handleRemoveImage}
                                title="Remove attached file"
                              >
                                Remove ✕
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* OCR Loading Indicator (Subtle Spinner) */}
                      {ocrLoadingMap[currentQId] && (
                        <div className="er-ocr-verify-banner loading">
                          <span className="er-ocr-verify-icon">✨</span>
                          <div className="er-ocr-verify-content">
                            <div className="er-ocr-verify-title">AI OCR: Reading handwritten answer sheet...</div>
                            <div className="er-ocr-verify-text">
                              Transcribing handwriting, equations, and steps. Generated text will populate the editor below in a moment.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Workspace: Side-by-Side Mode OR Standard Full-Width Mode */}
                      {showSideBySideMap[currentQId] && typeof answers[currentQId] === 'object' && answers[currentQId]?.image ? (
                        <div className="er-ocr-split-container">
                          {/* Left Column: Original Photo */}
                          <div className="er-ocr-split-panel">
                            <div className="er-ocr-panel-header">
                              <span>📷 Original Photo</span>
                              <button
                                type="button"
                                className="er-ocr-btn-action"
                                style={{ padding: '2px 8px', fontSize: '0.71875rem' }}
                                onClick={() => setZoomedImage(answers[currentQId].image)}
                              >
                                🔍 Full Size
                              </button>
                            </div>
                            <div className="er-ocr-image-view">
                              <img src={answers[currentQId].image} alt="Original handwritten solution sheet" />
                            </div>
                          </div>

                          {/* Right Column: Editable Response Box */}
                          <div className="er-ocr-split-panel">
                            <div className="er-ocr-panel-header">
                              <span>📝 Generated Text (Correct mistakes here)</span>
                              <span style={{ fontSize: '0.71875rem', fontWeight: 600, color: 'var(--sp-indigo-primary)' }}>
                                {wordCount} words
                              </span>
                            </div>
                            <textarea
                              rows={14}
                              placeholder="Transcribed text from your image will appear here. Edit any mistakes directly..."
                              value={currentTextAnswer}
                              onChange={(e) => handleTextAnswer(e.target.value)}
                              style={{
                                width: '100%',
                                flex: 1,
                                minHeight: '280px',
                                padding: '0.85rem 1rem',
                                border: 'none',
                                backgroundColor: 'var(--sp-surface)',
                                color: 'var(--sp-text-primary)',
                                fontSize: '0.875rem',
                                fontFamily: 'inherit',
                                lineHeight: 1.55,
                                boxSizing: 'border-box',
                                resize: 'vertical',
                                outline: 'none',
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        /* Standard Mode */
                        <div style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sp-text-primary)' }}>
                              {answers[currentQId]?.image
                                ? 'Response Text (Generated from photo — edit and correct any errors below):'
                                : 'Response Text:'}
                            </label>
                            {answers[currentQId]?.image && (
                              <button
                                type="button"
                                className="er-ocr-btn-action"
                                style={{ padding: '2px 8px', fontSize: '0.71875rem' }}
                                onClick={() => setZoomedImage(answers[currentQId].image)}
                              >
                                🔍 Compare with Photo
                              </button>
                            )}
                          </div>

                          <textarea
                            rows={7}
                            placeholder="Write your answer in a few sentences... or take/upload a photo above to transcribe."
                            value={currentTextAnswer}
                            onChange={(e) => handleTextAnswer(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.85rem 1rem',
                              borderRadius: '10px',
                              border: '1px solid var(--sp-border)',
                              backgroundColor: 'var(--sp-surface)',
                              color: 'var(--sp-text-primary)',
                              fontSize: '0.875rem',
                              fontFamily: 'inherit',
                              lineHeight: 1.5,
                              boxSizing: 'border-box',
                              resize: 'vertical',
                              outline: 'none',
                            }}
                          />
                        </div>
                      )}

                      {/* Sub-label inside card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--sp-text-muted)' }}>
                        <span>{rawType.includes('long') ? 'Long Answer / Proof' : 'Short Written Answer'}</span>
                        <span>{wordCount} words &bull; {savedStatusText}</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Bottom Controls Row (.er-bottom-controls from student.css) */}
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
                className="er-finalize-btn"
                onClick={handleFinalSubmit}
              >
                ✓ Finalize &amp; Submit &rarr;
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Full-Screen Zoom Lightbox for Answer Sheet Verification */}
      {zoomedImage && (() => {
        const isPdf = typeof zoomedImage === 'string' && (zoomedImage.startsWith('data:application/pdf') || zoomedImage.toLowerCase().includes('.pdf'));

        return (
          <div className="er-ocr-modal-overlay" onClick={() => setZoomedImage(null)}>
            <div
              className="er-ocr-modal-content"
              onClick={(e) => e.stopPropagation()}
              style={isPdf ? { width: '92%', maxWidth: '1000px', height: '88vh', display: 'flex', flexDirection: 'column' } : {}}
            >
              <div className="er-ocr-modal-top">
                <span>{isPdf ? '📄 PDF Document Inspection' : 'Attached Solution Sheet • Detailed Verification Zoom'}</span>
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: 'var(--sp-text-primary)',
                    fontWeight: 700,
                    padding: '4px 8px',
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="er-ocr-modal-body" style={isPdf ? { flex: 1, padding: 0, overflow: 'hidden' } : {}}>
                {isPdf ? (
                  <iframe
                    src={zoomedImage}
                    title="PDF Document Inspection"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <img src={zoomedImage} alt="Zoomed handwritten response" />
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
