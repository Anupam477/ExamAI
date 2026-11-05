/**
 * Mock API layer for ExamAI Authentication (Milestone 2)
 * Synchronized with Admin Users Registry & Live Admission Approvals
 */

const ARTIFICIAL_DELAY_MS = 600;

export const INITIAL_USERS = [
  {
    id: 'usr_001',
    name: 'Dummy Student',
    email: 'dummystudent@gmail.com',
    role: 'student',
    college: 'Apex Institute of Technology',
    identifier: '36FFHFHGF',
    subDetails: '12th Standard · Science',
    department: 'Computer Science',
    joined: '2026-10-22',
    joinedDisplay: '22 Oct 2026',
    status: 'pending',
    active: true,
    rejectionReason: null,
    adminNotes: 'Awaiting original scanned ID card verification.',
    avatarColor: '#2D5BD0',
    idProofUrl: 'DOC-STUDENT-AIT-9921',
  },
  {
    id: 'usr_002',
    name: 'Test Student',
    email: 'teststudent@gmail.com',
    role: 'student',
    college: 'Metro State University',
    identifier: '24HG-8812',
    subDetails: '12th Standard · Section B',
    department: 'Mathematics',
    joined: '2026-10-22',
    joinedDisplay: '22 Oct 2026',
    status: 'approved',
    active: true,
    rejectionReason: null,
    adminNotes: 'Verified via Student Affairs registrar API.',
    avatarColor: '#2563EB',
    idProofUrl: 'DOC-STUDENT-MSU-1003',
  },
  {
    id: 'usr_003',
    name: 'Prof. Rajesh Sharma',
    fullName: 'Prof. Rajesh Sharma',
    email: 'teacher@gmail.com',
    role: 'teacher',
    college: 'National Polytechnic College',
    identifier: 'FAC-MATHS-401',
    subDetails: 'Senior Lecturer · Mathematics',
    department: 'Mathematics',
    joined: '2026-10-22',
    joinedDisplay: '22 Oct 2026',
    status: 'approved',
    active: true,
    rejectionReason: null,
    adminNotes: 'Dean approval on file for exam blueprint authoring.',
    avatarColor: '#0E6B58',
    idProofUrl: 'DOC-FACULTY-NPC-8891',
  },
  {
    id: 'usr_004',
    name: 'Dev Student',
    email: 'student@gmail.com',
    role: 'student',
    college: 'Delhi Institute of Engineering',
    identifier: '24-CS-092',
    subDetails: 'B.Tech · 2nd Year',
    department: 'Computer Science',
    joined: '2026-10-22',
    joinedDisplay: '22 Oct 2026',
    status: 'approved',
    active: true,
    rejectionReason: null,
    adminNotes: 'Exam seat 404 assigned.',
    avatarColor: '#3B82F6',
    idProofUrl: 'DOC-STUDENT-DIE-3341',
  },
  {
    id: 'usr_005',
    name: 'Sneha Das',
    email: 'sneha.das@demo.edu',
    role: 'student',
    college: 'Demo Institute of Technology',
    identifier: 'CS-2026-081',
    subDetails: 'B.Tech · 3rd Year',
    department: 'Computer Science',
    joined: '2026-10-16',
    joinedDisplay: '16 Oct 2026',
    status: 'rejected',
    active: false,
    rejectionReason: 'ID card expired / Institutional registration not found in registrar roster',
    adminNotes: 'Candidate requested to re-upload active 2026 semester card.',
    avatarColor: '#DC2626',
    idProofUrl: 'DOC-STUDENT-DIT-4021',
  },
  {
    id: 'usr_006',
    name: 'Prof. Kiran Rao',
    email: 'kiran.rao@demo.edu',
    role: 'teacher',
    college: 'Demo Institute of Technology',
    identifier: 'FAC-PHY-104',
    subDetails: 'Associate Professor · Physics',
    department: 'Physics',
    joined: '2026-10-16',
    joinedDisplay: '16 Oct 2026',
    status: 'approved',
    active: true,
    rejectionReason: null,
    adminNotes: 'Invigilator privileges enabled.',
    avatarColor: '#0E6B58',
    idProofUrl: 'DOC-FACULTY-DIT-2290',
  },
  {
    id: 'usr_007',
    name: 'Meera Nair',
    email: 'meera.nair@demo.edu',
    role: 'student',
    college: 'Demo Institute of Technology',
    identifier: 'CS-2026-119',
    subDetails: 'B.Tech · 2nd Year',
    department: 'Computer Science',
    joined: '2026-10-16',
    joinedDisplay: '16 Oct 2026',
    status: 'approved',
    active: true,
    rejectionReason: null,
    adminNotes: 'Eligible for Milestone examination.',
    avatarColor: '#4F46E5',
    idProofUrl: 'DOC-STUDENT-DIT-4491',
  },
  {
    id: 'usr_008',
    name: 'Rohan Iyer',
    email: 'rohan.iyer@demo.edu',
    role: 'student',
    college: 'Demo Institute of Technology',
    identifier: 'CS-2026-044',
    subDetails: 'B.Tech · 4th Year',
    department: 'Computer Science',
    joined: '2026-10-16',
    joinedDisplay: '16 Oct 2026',
    status: 'approved',
    active: true,
    rejectionReason: null,
    adminNotes: 'Graduating batch candidate.',
    avatarColor: '#2563EB',
    idProofUrl: 'DOC-STUDENT-DIT-1120',
  },
  {
    id: 'usr_009',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@apex.edu',
    role: 'student',
    college: 'Apex Institute of Technology',
    identifier: '24-EE-109',
    subDetails: 'Electrical Eng · 1st Year',
    department: 'Electrical Eng',
    joined: '2026-10-23',
    joinedDisplay: '23 Oct 2026',
    status: 'pending',
    active: true,
    rejectionReason: null,
    adminNotes: 'Uploaded document pending OCR extraction.',
    avatarColor: '#D97706',
    idProofUrl: 'DOC-STUDENT-AIT-7731',
  },
];

/**
 * Returns users list stored in localStorage, initialized with INITIAL_USERS
 */
export function getStoredUsers() {
  try {
    const raw = localStorage.getItem('examai_admin_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure any newly registered faculty who hasn't been explicitly approved by admin remains pending
        return parsed.map((u) => {
          if (u.role === 'teacher' && u.id !== 'usr_003' && !u.approvedByAdmin && u.status !== 'rejected') {
            return { ...u, status: 'pending' };
          }
          return u;
        });
      }
    }
  } catch (e) {
    console.warn('Error reading stored users:', e);
  }
  try {
    localStorage.setItem('examai_admin_users', JSON.stringify(INITIAL_USERS));
  } catch {
    // ignore
  }
  return INITIAL_USERS;
}

/**
 * Persist users list to localStorage and broadcast change
 */
export function saveStoredUsers(users) {
  try {
    localStorage.setItem('examai_admin_users', JSON.stringify(users));
    window.dispatchEvent(new Event('examai_users_updated'));
  } catch (e) {
    console.warn('Error saving users to localStorage:', e);
  }
}

/**
 * Find user by email
 */
export function findUserByEmail(email) {
  if (!email) return null;
  const users = getStoredUsers();
  return users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()) || null;
}

/**
 * Records an active test admission request when a student logs in
 */
export function recordAdmissionRequest(user) {
  try {
    const request = {
      id: user.id || `usr_${Date.now()}`,
      name: user.name || user.fullName || 'Candidate',
      email: user.email,
      role: user.role || 'student',
      identifier: user.identifier || 'CS-2026-092',
      department: user.department || 'Computer Science',
      college: user.college || 'Apex Institute of Technology',
      requestedAt: new Date().toISOString(),
      requestedDisplayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
    };
    localStorage.setItem('examai_latest_admission_request', JSON.stringify(request));
    window.dispatchEvent(new CustomEvent('examai_admission_requested', { detail: request }));
    return request;
  } catch (e) {
    console.warn('Could not record admission request', e);
    return null;
  }
}

/**
 * Fetches the current active admission request if pending
 */
export function getLatestAdmissionRequest() {
  try {
    const raw = localStorage.getItem('examai_latest_admission_request');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Resolves an admission request from Admin Console (Approve or Reject)
 */
export function resolveAdmissionRequest(userId, decision, reason = null) {
  try {
    const users = getStoredUsers();
    let targetUser = null;
    const updatedUsers = users.map((u) => {
      if (u.id === userId || u.email === userId) {
        targetUser = {
          ...u,
          status: decision,
          approvedByAdmin: decision === 'approved',
          rejectionReason: decision === 'rejected' ? (reason || 'Administrative review denial') : null,
        };
        return targetUser;
      }
      return u;
    });

    saveStoredUsers(updatedUsers);

    // Update active admission request state
    const currentReq = getLatestAdmissionRequest();
    if (currentReq && (currentReq.id === userId || currentReq.email === userId)) {
      currentReq.status = decision;
      currentReq.rejectionReason = reason;
      localStorage.setItem('examai_latest_admission_request', JSON.stringify(currentReq));
    }

    // Broadcast admission decision
    const decisionPayload = {
      userId,
      status: decision,
      reason,
      timestamp: Date.now(),
    };
    localStorage.setItem('examai_admission_decision', JSON.stringify(decisionPayload));
    window.dispatchEvent(new CustomEvent('examai_decision_updated', { detail: decisionPayload }));

    return targetUser;
  } catch (e) {
    console.error('Failed to resolve admission request', e);
    return null;
  }
}

/**
 * Simulates a login API call
 * Integrates directly with institutional users registry & status
 */
export async function mockLoginApi(role, credentials) {
  await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));

  if (!credentials.email || !credentials.password) {
    throw new Error('Please provide both your registered email and password.');
  }

  const emailTrimmed = credentials.email.trim().toLowerCase();

  // If student role, check approval status in registered users
  if (role === 'student') {
    let existingUser = findUserByEmail(emailTrimmed);

    // If user does not exist in seed list, automatically register them as a student with 'pending'
    if (!existingUser) {
      existingUser = {
        id: `usr_${Date.now()}`,
        name: emailTrimmed.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: emailTrimmed,
        role: 'student',
        college: 'Apex Institute of Technology',
        identifier: `26-CS-${Math.floor(100 + Math.random() * 900)}`,
        subDetails: 'Enrolled Candidate · 2026 Batch',
        department: 'Computer Science',
        joined: new Date().toISOString().split('T')[0],
        joinedDisplay: 'Just now',
        status: 'pending',
        active: true,
        rejectionReason: null,
        adminNotes: 'Registered candidate waiting for session proctor admission.',
        avatarColor: '#2D5BD0',
        idProofUrl: 'DOC-STUDENT-AIT-NEW',
      };
      const allUsers = getStoredUsers();
      saveStoredUsers([existingUser, ...allUsers]);
    }

    // Case 1: Pending Approval
    if (existingUser.status === 'pending') {
      recordAdmissionRequest(existingUser);
      return {
        success: false,
        status: 'pending',
        user: existingUser,
        message: 'Your student account is pending administrator approval before you can access the examination.',
      };
    }

    // Case 2: Rejected by Admin
    if (existingUser.status === 'rejected') {
      return {
        success: false,
        status: 'rejected',
        user: existingUser,
        reason: existingUser.rejectionReason || 'Institutional identity or credential verification was not accepted.',
        message: 'Your admission request was rejected by the administrator.',
      };
    }

    // Case 3: Approved
    const sessionUser = {
      id: existingUser.id,
      email: existingUser.email,
      fullName: existingUser.name,
      role: 'student',
      college: existingUser.college,
      identifier: existingUser.identifier,
      department: existingUser.department,
      subDetails: existingUser.subDetails,
      status: 'approved',
      token: `jwt-examai-student-${existingUser.id}-${Date.now()}`,
      authenticatedAt: new Date().toISOString(),
    };

    sessionStorage.setItem('examai_auth_user', JSON.stringify(sessionUser));
    localStorage.setItem('examai_auth_user', JSON.stringify(sessionUser));

    return {
      success: true,
      status: 'approved',
      message: `Welcome back, ${existingUser.name}! Signed in successfully.`,
      user: sessionUser,
    };
  }

  // Teacher role login
  if (role === 'teacher') {
    const users = getStoredUsers();
    const cleanEmail = credentials.email.trim().toLowerCase();
    let existingTeacher = users.find(
      (u) => u.email?.trim().toLowerCase() === cleanEmail && u.role === 'teacher'
    ) || users.find(
      (u) => u.email?.trim().toLowerCase() === cleanEmail
    );

    // If teacher does not exist, auto-register them as pending so admin must approve
    if (!existingTeacher) {
      const emailPrefix = cleanEmail.split('@')[0];
      const parts = emailPrefix.split(/[._-]/).filter(Boolean);
      const generatedName = parts.length > 0
        ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
        : 'Course Faculty';

      existingTeacher = {
        id: `usr_${Date.now()}`,
        name: generatedName,
        fullName: generatedName,
        email: cleanEmail,
        role: 'teacher',
        college: 'Apex Institute of Technology',
        identifier: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
        subDetails: 'Department of Computer Science',
        roleTitle: 'Department of Computer Science',
        department: 'Computer Science',
        joined: new Date().toISOString().split('T')[0],
        joinedDisplay: 'Just now',
        status: cleanEmail === 'teacher@gmail.com' ? 'approved' : 'pending',
        active: true,
        rejectionReason: null,
        adminNotes: 'Educator registered. Awaiting administrator approval.',
        avatarColor: '#0E6B58',
        idProofUrl: 'DOC-FACULTY-UPLOAD',
      };
      saveStoredUsers([existingTeacher, ...users]);
    }

    // Case 1: Pending Approval
    if (existingTeacher.status === 'pending') {
      recordAdmissionRequest(existingTeacher);
      return {
        success: false,
        status: 'pending',
        user: existingTeacher,
        message: 'Your educator account is pending administrator approval before you can access the educator portal.',
      };
    }

    // Case 2: Rejected by Admin
    if (existingTeacher.status === 'rejected') {
      return {
        success: false,
        status: 'rejected',
        user: existingTeacher,
        reason: existingTeacher.rejectionReason || 'Institutional educator credential verification was declined by administrator.',
        message: 'Your educator registration was rejected by the administrator.',
      };
    }

    // Case 3: Approved
    const teacherDisplayName = existingTeacher.fullName || existingTeacher.name;
    const teacherRoleTitle = existingTeacher.roleTitle || existingTeacher.subDetails || existingTeacher.department || 'Course Faculty';

    const sessionUser = {
      id: existingTeacher.id,
      email: existingTeacher.email,
      role: 'teacher',
      name: teacherDisplayName,
      fullName: teacherDisplayName,
      roleTitle: teacherRoleTitle,
      department: existingTeacher.department || 'Academic Department',
      college: existingTeacher.college || 'Institutional Faculty',
      token: `fake-jwt-token-examai-teacher-${existingTeacher.id}-${Date.now()}`,
      authenticatedAt: new Date().toISOString(),
      status: 'approved',
    };

    sessionStorage.setItem('examai_auth_user', JSON.stringify(sessionUser));
    localStorage.setItem('examai_auth_user', JSON.stringify(sessionUser));

    return {
      success: true,
      status: 'approved',
      message: `Welcome back, ${teacherDisplayName}! Signed in successfully as teacher.`,
      user: sessionUser,
    };
  }

  // Admin role login
  const mockUser = {
    id: `usr_admin_${Date.now()}`,
    email: credentials.email,
    role: 'admin',
    name: 'Institutional Administrator',
    fullName: 'Institutional Administrator',
    roleTitle: 'System Administrator',
    department: 'Administration',
    college: 'ExamAI Central Administration',
    token: `fake-jwt-token-examai-admin-${Date.now()}`,
    authenticatedAt: new Date().toISOString(),
    status: 'approved',
  };

  sessionStorage.setItem('examai_auth_user', JSON.stringify(mockUser));
  localStorage.setItem('examai_auth_user', JSON.stringify(mockUser));

  return {
    success: true,
    status: 'approved',
    message: 'Welcome back! Signed in successfully as administrator.',
    user: mockUser,
  };
}

/**
 * Simulates registration API call
 */
export async function mockSignupApi(role, formData) {
  await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));

  const newUserName = `${formData.firstName} ${formData.lastName}`.trim() || (role === 'teacher' ? 'Course Faculty' : 'Candidate');
  const newUser = {
    id: `usr_${Date.now()}`,
    name: newUserName,
    fullName: newUserName,
    email: formData.email.trim().toLowerCase(),
    role: role,
    college: formData.institute || 'Apex Institute of Technology',
    identifier: formData.rollNumber || (role === 'teacher' ? `FAC-${Math.floor(1000 + Math.random() * 9000)}` : `ID-${Math.floor(1000 + Math.random() * 9000)}`),
    subDetails: role === 'teacher'
      ? (formData.department ? `Department of ${formData.department}` : 'Course Faculty')
      : `${formData.classYear || '1 Year'} · ${formData.department || 'General'}`,
    roleTitle: role === 'teacher'
      ? (formData.department ? `Department of ${formData.department}` : 'Course Faculty')
      : 'Student Candidate',
    classYear: formData.classYear || '1 Year',
    department: formData.department || (role === 'teacher' ? 'Academic Department' : 'Computer Science'),
    joined: new Date().toISOString().split('T')[0],
    joinedDisplay: 'Just now',
    status: 'pending',
    active: true,
    rejectionReason: null,
    adminNotes: role === 'teacher'
      ? 'Faculty registration submitted via teacher portal. Awaiting administrator verification.'
      : 'Candidate registration submitted through student portal. Awaiting administrator verification.',
    avatarColor: role === 'teacher' ? '#0E6B58' : '#2D5BD0',
    idProofUrl: role === 'teacher' ? 'DOC-FACULTY-UPLOAD' : 'DOC-STUDENT-UPLOAD',
  };

  const users = getStoredUsers();
  saveStoredUsers([newUser, ...users]);
  recordAdmissionRequest(newUser);

  return {
    success: true,
    message: `Account created successfully for ${newUser.name}. Pending administrator approval before access is granted.`,
    user: newUser,
  };
}

/**
 * Retrieves the currently active mock session from sessionStorage or localStorage
 */
export function getActiveSession() {
  try {
    const raw = sessionStorage.getItem('examai_auth_user') || localStorage.getItem('examai_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clears the active session
 */
export function clearActiveSession() {
  sessionStorage.removeItem('examai_auth_user');
  localStorage.removeItem('examai_auth_user');
}

/* ==========================================================================
   Teacher Assessments & Question Generation Data Layer
   ========================================================================== */

export const INITIAL_TEACHER_TESTS = [
  {
    id: 'test_001',
    title: 'Artificial Intelligence & Machine Learning',
    subject: 'Computer Science',
    topic: 'Deep Learning & Neural Networks',
    instructor: 'Prof. Rajesh Sharma',
    instructorRole: 'Senior Lecturer · Mathematics & AI',
    description: 'Comprehensive midterm evaluation on deep neural network architectures, backpropagation gradients, and real-time computer vision proctoring.',
    instructions: 'Webcam proctoring is active throughout the session. Closed-book examination. Max 3 tab switches permitted.',
    difficulty: 'Medium',
    duration: 45,
    maxTabSwitches: 3,
    scheduledStart: '2026-10-26T09:00',
    scheduledEnd: '2026-10-30T21:00',
    proctoring: {
      webcam: true,
      negativeMarking: false,
      shuffleQuestions: true,
      shuffleOptions: true,
    },
    status: 'published',
    code: 'AIML-DEEP-2026',
    createdAt: '2026-10-25',
    assignedStudents: ['usr_001', 'usr_002', 'usr_004', 'usr_008'],
    questions: [
      {
        id: 'q_001',
        type: 'mcq',
        marks: 5,
        title: 'In deep convolutional neural networks (CNNs), what is the primary role of a pooling layer (such as Max-Pooling)?',
        options: [
          'Reduces spatial dimensions (width x height) to limit computational load and prevent overfitting',
          'Flattens all weight matrices into one-dimensional scalar probability tensors',
          'Computes the backward chain-rule gradient vector for the output layer',
          'Normalizes pixel luminance uniformly across all incoming RGB color channels',
        ],
        correctOption: 0,
        explanation: 'Pooling downsamples spatial dimensions while preserving translational invariant dominant feature maps.',
      },
      {
        id: 'q_002',
        type: 'mcq',
        marks: 5,
        title: 'Which loss function is mathematically standard when optimizing a multi-class neural network with a Softmax output layer?',
        options: [
          'Categorical Cross-Entropy Loss',
          'Mean Squared Error (MSE) Euclidean distance',
          'Huber Smooth L1 Loss',
          'Hinge Loss for binary linear margins',
        ],
        correctOption: 0,
        explanation: 'Categorical cross-entropy directly measures the divergence between target one-hot distributions and Softmax probabilities.',
      },
      {
        id: 'q_003',
        type: 'mcq',
        marks: 5,
        title: 'What core architectural mechanism enables Transformer models (e.g., Gemini, GPT) to capture global context without recurrent loops?',
        options: [
          'Scaled Dot-Product Multi-Head Self-Attention',
          'K-Nearest Neighbors feature aggregation',
          'Depthwise Dilated 1D Convolutions',
          'Fixed-stride temporal Average-Pooling',
        ],
        correctOption: 0,
        explanation: 'Self-attention calculates pairwise query-key alignment matrices across all tokens in parallel.',
      },
      {
        id: 'q_004',
        type: 'mcq',
        marks: 5,
        title: 'In real-time edge proctoring models (e.g. MediaPipe BlazeFace), why is Depthwise Separable Convolution favored?',
        options: [
          'It drastically reduces FLOPs and inference latency on web browsers and edge devices',
          'It completely eliminates the requirement for training data labels',
          'It guarantees zero gradient loss during backpropagation',
          'It converts floating-point weights into non-negative integers',
        ],
        correctOption: 0,
        explanation: 'Depthwise separable convolution splits spatial filtering from pointwise 1x1 combination, yielding ~8-9x FLOP savings.',
      },
      {
        id: 'q_005',
        type: 'descriptive',
        marks: 10,
        title: 'Explain the Vanishing Gradient problem during backpropagation in deep neural networks. Discuss how Residual Skip Connections (ResNet) mitigate this issue.',
        rubric: 'Candidate must mention chain-rule derivative multiplication decay (< 1), saturation of sigmoid/tanh activations, and identity shortcut formulation F(x) + x allowing gradient flow.',
        sampleAnswer: 'When backpropagating through many layers, gradients diminish exponentially due to repeated multiplication of small derivatives. ResNet skip connections introduce identity mappings H(x) = F(x) + x, allowing gradients to flow unimpeded directly back to earlier layers via dH/dx = dF/dx + 1.',
      },
    ],
  },
  {
    id: 'test_002',
    title: 'Advanced Computer Networks & Cryptography',
    subject: 'Computer Science',
    topic: 'TLS Handshake & RSA Public Key Crypto',
    instructor: 'Prof. Kiran Rao',
    instructorRole: 'Associate Professor · Computer Science & Physics',
    description: 'Comprehensive evaluation of secure transport protocols and asymmetric encryption algorithms.',
    instructions: 'Closed book exam. Proctoring webcam and gaze deviation tracking will run continuously.',
    difficulty: 'Hard',
    duration: 60,
    maxTabSwitches: 2,
    scheduledStart: '2026-10-27T10:00',
    scheduledEnd: '2026-10-31T20:00',
    proctoring: {
      webcam: true,
      negativeMarking: true,
      shuffleQuestions: true,
      shuffleOptions: true,
    },
    status: 'published',
    code: 'CS-NET-CRYPTO-26',
    createdAt: '2026-10-23',
    assignedStudents: ['usr_001', 'usr_002', 'usr_004', 'usr_007', 'usr_008'],
    questions: [
      {
        id: 'q_201',
        type: 'mcq',
        marks: 10,
        title: 'During TLS 1.3 handshake, which key exchange mechanism eliminates the requirement for static RSA key sharing?',
        options: [
          'Diffie-Hellman Ephemeral (ECDHE)',
          'DES symmetric stream cipher',
          'MD5 digest checksum hashing',
          'RC4 pseudo-random permutation',
        ],
        correctOption: 0,
        explanation: 'TLS 1.3 mandates ephemeral Diffie-Hellman to guarantee Forward Secrecy.',
      },
      {
        id: 'q_202',
        type: 'descriptive',
        marks: 15,
        title: 'Explain how RSA encryption relies on the computational hardness of large integer factorization. Discuss chosen-ciphertext attacks.',
        rubric: 'Expects discussion of Euler totient function phi(n) = (p-1)(q-1), modular exponentiation, and padding schemes (OAEP).',
      },
    ],
  },
  {
    id: 'test_003',
    title: 'Data Structures & Algorithmic Analysis',
    subject: 'Computer Science',
    topic: 'Trees, Graphs, and Greedy Optimization',
    instructor: 'Prof. Rajesh Sharma',
    instructorRole: 'Head of Assessment Curriculum',
    description: 'End-term practical examination covering self-balancing search trees, Dijkstra shortest paths, and dynamic programming memoization.',
    instructions: 'Webcam and full screen lockdown mandatory. Do not navigate away from test runner.',
    difficulty: 'Medium',
    duration: 50,
    maxTabSwitches: 3,
    scheduledStart: '2026-10-27T08:00',
    scheduledEnd: '2026-10-31T23:59',
    proctoring: {
      webcam: true,
      negativeMarking: false,
      shuffleQuestions: true,
      shuffleOptions: true,
    },
    status: 'published',
    code: 'CS-ALGO-2026',
    createdAt: '2026-10-24',
    assignedStudents: ['usr_001', 'usr_002', 'usr_004', 'usr_008'],
    questions: [
      {
        id: 'q_301',
        type: 'mcq',
        marks: 5,
        title: 'What is the tight asymptotic time complexity of Dijkstra algorithm implemented with a Fibonacci heap on a graph with V vertices and E edges?',
        options: [
          'O(E + V log V)',
          'O(V²)',
          'O(E log V)',
          'O(V + E)',
        ],
        correctOption: 0,
        explanation: 'Fibonacci heap provides O(1) amortized decrease-key and O(log V) extract-min, yielding O(E + V log V).',
      },
      {
        id: 'q_302',
        type: 'mcq',
        marks: 5,
        title: 'In a B-tree of order m, what is the maximum number of children any internal node can hold?',
        options: [
          'm',
          'm - 1',
          '2m',
          'ceil(m / 2)',
        ],
        correctOption: 0,
        explanation: 'By definition, a B-tree of order m allows each node to have at most m children and m-1 keys.',
      },
    ],
  },
];

export function getStoredTeacherTests() {
  try {
    const raw = localStorage.getItem('examai_teacher_tests');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Retain each test's specific authoring teacher while filtering out old placeholders
        const normalized = parsed.map((t) => {
          let inst = t.instructor;
          let role = t.instructorRole;

          // If instructor was a placeholder or student name, fallback to email prefix or Course Faculty
          if (
            !inst ||
            inst === 'Dr. Test Teacher' ||
            inst === 'Authorized Instructor' ||
            inst === 'Abhi Singh' ||
            inst === 'Test Student' ||
            inst === 'Candidate'
          ) {
            if (t.instructorEmail) {
              const prefix = t.instructorEmail.split('@')[0];
              const parts = prefix.split(/[._-]/).filter(Boolean);
              inst = parts.length > 0 ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') : 'Course Faculty';
            } else {
              inst = 'Course Faculty';
            }
            role = 'Course Faculty';
          }

          if (
            !role ||
            role.includes('Year') ||
            role.includes('Standard') ||
            role.includes('Student')
          ) {
            role = 'Course Faculty';
          }

          return {
            ...t,
            instructor: inst,
            instructorRole: role,
          };
        });
        return normalized;
      }
    }
  } catch (e) {
    console.warn('Error reading teacher tests:', e);
  }
  return [];
}


export function saveStoredTeacherTests(tests) {
  try {
    localStorage.setItem('examai_teacher_tests', JSON.stringify(tests));
    window.dispatchEvent(new Event('examai_tests_updated'));
  } catch (e) {
    console.warn('Error saving teacher tests:', e);
  }
}

export function saveOrUpdateTeacherTest(testData) {
  const tests = getStoredTeacherTests();
  const session = getActiveSession();
  const isTeacher = session && (session.role === 'teacher' || session.role === 'faculty');
  const currentFaculty = isTeacher ? (session.fullName || session.name || 'Course Faculty') : 'Course Faculty';
  const currentRole = isTeacher ? (session.roleTitle || session.subDetails || 'Course Faculty') : 'Course Faculty';

  let instructorToUse = testData.instructor;
  if (
    !instructorToUse ||
    instructorToUse === 'Dr. Test Teacher' ||
    instructorToUse === 'Authorized Instructor' ||
    instructorToUse === 'Abhi Singh' ||
    instructorToUse === 'Test Student'
  ) {
    instructorToUse = currentFaculty;
  }

  let roleToUse = testData.instructorRole;
  if (!roleToUse || roleToUse.includes('Year') || roleToUse.includes('Student')) {
    roleToUse = currentRole;
  }

  const index = tests.findIndex((t) => t.id === testData.id);
  let updated;
  if (index >= 0) {
    updated = [...tests];
    updated[index] = {
      ...updated[index],
      ...testData,
      instructor: instructorToUse,
      instructorRole: roleToUse,
      updatedAt: new Date().toISOString(),
    };
  } else {
    const newTest = {
      ...testData,
      id: testData.id || `test_${Date.now()}`,
      instructor: instructorToUse,
      instructorRole: roleToUse,
      createdAt: new Date().toISOString().split('T')[0],
      code: testData.code || `${(testData.subject || 'TEST').slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: testData.status || 'draft',
    };
    updated = [newTest, ...tests];
  }
  saveStoredTeacherTests(updated);
  return updated;
}

export function deleteTeacherTest(testId) {
  const tests = getStoredTeacherTests();
  const updated = tests.filter((t) => t.id !== testId);
  saveStoredTeacherTests(updated);
  return updated;
}

/**
 * Reschedule test: allows teacher to change the start and end date/time repeatedly
 */
export function rescheduleTeacherTest(testId, scheduledStart, scheduledEnd) {
  const tests = getStoredTeacherTests();
  const updated = tests.map((t) =>
    t.id === testId
      ? { ...t, scheduledStart, scheduledEnd, updatedAt: new Date().toISOString() }
      : t
  );
  saveStoredTeacherTests(updated);
  return updated;
}

/**
 * Checks if a test is assigned to a specific student
 * Strictly ensures:
 * 1. Test must be published (drafts are never shown to students)
 * 2. Teacher must have assigned this test to the student (assignedStudents contains student id/email/name)
 * 3. Tests with 0 assigned students are NOT shown
 */
export function isStudentAssignedToTest(test, studentUser) {
  if (!test || !studentUser) return false;

  // Draft or archived tests are strictly hidden from students
  if (test.status !== 'published') return false;

  const assigned = test.assignedStudents;
  // If assignedStudents is empty or missing, this test was NOT assigned to any student
  if (!Array.isArray(assigned) || assigned.length === 0) {
    return false;
  }

  const sid = String(studentUser?.id || '').trim().toLowerCase();
  const semail = String(studentUser?.email || '').trim().toLowerCase();
  const sname = String(studentUser?.fullName || studentUser?.name || '').trim().toLowerCase();
  const sroll = String(studentUser?.identifier || '').trim().toLowerCase();

  // If candidate credentials are completely missing, cannot match
  if (!sid && !semail && !sname && !sroll) {
    return false;
  }

  return assigned.some((aid) => {
    if (!aid) return false;
    const a = String(aid).trim().toLowerCase();
    // Wildcard matches all students only if explicitly set
    if (a === '*' || a === 'all' || a === 'students' || a === 'all students') {
      return true;
    }

    return (
      (sid && a === sid) ||
      (semail && a === semail) ||
      (sname && (a === sname || (a.length >= 3 && sname === a))) ||
      (sroll && a === sroll)
    );
  });
}

/**
 * Retrieves all published examinations assigned to a candidate
 */
export function getTestsForStudent(studentUser) {
  const tests = getStoredTeacherTests();
  if (!studentUser) return [];
  return tests.filter((t) => t.status === 'published' && isStudentAssignedToTest(t, studentUser));
}

/**
 * Lookup test by institutional exam code
 */
export function getTestByCode(code) {
  if (!code) return null;
  const tests = getStoredTeacherTests();
  const cleanCode = String(code).trim().toUpperCase();
  return tests.find((t) => t.code && t.code.trim().toUpperCase() === cleanCode) || null;
}

/**
 * Saves completed exam submission to institutional audit registry
 */
export function saveStudentSubmission(submission) {
  try {
    const raw = localStorage.getItem('examai_submissions');
    const list = raw ? JSON.parse(raw) : [];
    const updated = [submission, ...list];
    localStorage.setItem('examai_submissions', JSON.stringify(updated));
    window.dispatchEvent(new Event('examai_submissions_updated'));
    return updated;
  } catch (e) {
    console.warn('Error saving exam submission:', e);
    return [];
  }
}

/**
 * Retrieves submissions for a student
 * Robustly matches by student ID, email address, or full name
 */
export function getStudentSubmissions(candidate) {
  try {
    const raw = localStorage.getItem('examai_submissions');
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    if (!candidate) return list;

    // Support candidate as user object or string ID / email
    const idClean = String(candidate?.id || (typeof candidate === 'string' ? candidate : '')).trim().toLowerCase();
    const emailClean = String(candidate?.email || (typeof candidate === 'string' && candidate.includes('@') ? candidate : '')).trim().toLowerCase();
    const nameClean = String(candidate?.fullName || candidate?.name || '').trim().toLowerCase();

    return list.filter((s) => {
      const sId = String(s.studentId || '').trim().toLowerCase();
      const sEmail = String(s.studentEmail || '').trim().toLowerCase();
      const sName = String(s.studentName || '').trim().toLowerCase();

      return (
        (idClean && sId === idClean) ||
        (emailClean && sEmail === emailClean) ||
        (idClean && sEmail === idClean) ||
        (emailClean && sId === emailClean) ||
        (nameClean && sName && (sName === nameClean || nameClean.includes(sName)))
      );
    });
  } catch (e) {
    return [];
  }
}

/**
 * Mock AI Question Generator (Simulates Gemini AI)
 * Takes a topic, count, and difficulty to produce realistic exam questions
 */
export function generateAiQuestionsForTopic(topic, count = 3, difficulty = 'Medium', customMarks = null, customNegativeMarks = null) {
  const normalized = (topic || '').toLowerCase();


  const questionsDatabase = {
    math: [
      {
        type: 'mcq',
        marks: 5,
        title: 'What condition on the discriminant D = b² - 4ac guarantees two distinct real roots for ax² + bx + c = 0?',
        options: ['D > 0', 'D = 0', 'D < 0', 'D ≤ 0'],
        correctOption: 0,
        explanation: 'A strictly positive discriminant yields a non-zero real square root resulting in two distinct real roots.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'According to Vieta’s formulas, if α and β are the roots of 3x² - 12x + 9 = 0, what is the sum of the roots (α + β)?',
        options: ['4  (-b/a = -(-12)/3 = 4)', '-4', '3', '12'],
        correctOption: 0,
        explanation: 'For ax² + bx + c = 0, the sum of roots is -b/a = 12/3 = 4.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'What are the real roots of the quadratic equation x² - 8x + 15 = 0?',
        options: ['x = 3 and x = 5', 'x = -3 and x = -5', 'x = 1 and x = 15', 'x = 2 and x = 6'],
        correctOption: 0,
        explanation: 'Factoring (x - 3)(x - 5) = 0 gives roots x = 3 and x = 5.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'What is the x-coordinate of the vertex of the parabola y = 2x² - 8x + 11?',
        options: ['x = 2  (-b / 2a = 8 / 4 = 2)', 'x = -2', 'x = 4', 'x = 1'],
        correctOption: 0,
        explanation: 'The vertex x-coordinate is -b/(2a) = -(-8)/(2*2) = 2.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Derive the quadratic formula x = (-b ± √(b² - 4ac)) / (2a) starting from ax² + bx + c = 0 by completing the square.',
        rubric: 'Candidate must divide by a, move c/a to RHS, add (b/2a)² to both sides, factor LHS as a perfect square, and solve for x.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Discuss the geometric interpretation of the discriminant in terms of parabolic intersections with the Cartesian x-axis.',
        rubric: 'Candidate should contrast D > 0 (two distinct intersections), D = 0 (tangent/single touchpoint), and D < 0 (no real intersection).',
      },
    ],
    mechanics: [
      {
        type: 'mcq',
        marks: 5,
        title: 'According to Newton’s First Law of Motion, an object maintains constant velocity unless acted upon by:',
        options: ['An unbalanced net external force', 'An internal thermodynamic gradient', 'A gravitational potential only', 'A continuous constant force equal to its mass'],
        correctOption: 0,
        explanation: 'Law of Inertia states net external force is required to alter velocity.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'Newton’s Second Law states that net force is fundamentally proportional to the rate of change of:',
        options: ['Linear momentum (F = dp/dt)', 'Kinetic energy', 'Angular displacement', 'Mechanical power'],
        correctOption: 0,
        explanation: 'F_net = dp/dt. When mass is constant, dp/dt = m(dv/dt) = ma.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'Which statement is strictly true regarding Newton’s Third Law action-reaction force pairs?',
        options: ['They act on two different interacting bodies simultaneously and never cancel each other', 'They act on the same body in opposite directions to establish equilibrium', 'Action force precedes reaction force by a slight time delay', 'The reaction force is smaller if the opposing object has greater mass'],
        correctOption: 0,
        explanation: 'Action and reaction forces act on different bodies and cannot cancel each other in a single free body diagram.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'A net horizontal force of 24 N accelerates an object at 6.0 m/s². What is the mass of the object?',
        options: ['4.0 kg  (m = F/a = 24/6)', '144 kg', '0.25 kg', '18 kg'],
        correctOption: 0,
        explanation: 'Using m = F / a = 24 / 6 = 4.0 kg.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'State Newton’s Three Laws of Motion and provide complete Free Body Diagrams (FBD) for an inclined plane problem with friction.',
        rubric: 'Candidate must state all 3 laws accurately, draw block on incline with gravity, normal force, and friction resolved along parallel/perpendicular axes.',
      },
    ],
    dsa: [
      {
        type: 'mcq',
        marks: 5,
        title: 'What is the worst-case time complexity of searching in an unbalanced Binary Search Tree with N nodes?',
        options: ['O(N) - degenerate linear linked list structure', 'O(log N)', 'O(1)', 'O(N log N)'],
        correctOption: 0,
        explanation: 'When inserted in sorted order, an unbalanced BST degenerates into a linear linked list with height O(N).',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'Which tree traversal on a valid Binary Search Tree visits node keys in strictly ascending sorted order?',
        options: ['Inorder traversal (Left, Root, Right)', 'Preorder traversal', 'Postorder traversal', 'Breadth-first level-order traversal'],
        correctOption: 0,
        explanation: 'Inorder traversal visits Left -> Root -> Right, preserving the BST ordering property.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'What is the maximum height difference allowed between left and right subtrees of any node in an AVL tree?',
        options: ['At most 1', 'At most 2', 'At most 0 (strictly equal)', 'Arbitrary as long as keys are sorted'],
        correctOption: 0,
        explanation: 'AVL trees enforce the balance factor property: |height(left) - height(right)| ≤ 1.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Explain the four rotation cases (LL, RR, LR, RL) used in AVL Trees to restore self-balancing invariants after an insertion.',
        rubric: 'Candidate must illustrate single rotations (LL, RR) and double rotations (LR, RL) with balance factors before and after rotation.',
      },
    ],
    aiml: [
      {
        type: 'mcq',
        marks: 5,
        title: 'Which optimization algorithm adapts individual learning rates for each parameter using first and second moments of gradients?',
        options: [
          'Adam (Adaptive Moment Estimation)',
          'Standard Stochastic Gradient Descent (SGD) with static alpha',
          'Mini-batch gradient descent without momentum',
          'Coordinate Descent on convex loss functions',
        ],
        correctOption: 0,
        explanation: 'Adam computes exponentially decaying averages of past squared gradients (v_t) and past gradients (m_t).',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'Why is the ReLU (Rectified Linear Unit) activation function favored over Sigmoid in deep hidden layers?',
        options: [
          'It avoids gradient saturation for positive activations, mitigating vanishing gradients',
          'It maps all negative numbers strictly to +1 for faster multiplication',
          'It ensures all output activations sum to exactly 1.0',
          'It is twice continuously differentiable everywhere including zero',
        ],
        correctOption: 0,
        explanation: 'ReLU has constant derivative 1 for positive inputs, avoiding the derivative shrinkage (< 0.25) of Sigmoid.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'In multimodal AI proctoring, how is head pose yaw/pitch/roll typically estimated from video frames?',
        options: [
          'Perspective-n-Point (PnP) solver mapping 2D facial landmarks to a canonical 3D head model',
          'Simple pixel luminance thresholding over the forehead region',
          'Acoustic Doppler shift detection from microphone sensors',
          'Counting total keystrokes per second on the keyboard',
        ],
        correctOption: 0,
        explanation: 'EPnP / solvePnP algorithms solve the camera pose from 2D FaceMesh landmarks to 3D facial coordinates.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'Which regularization technique randomly drops hidden units during forward passes in training to prevent co-adaptation?',
        options: ['Dropout', 'L1 Lasso Regularization', 'Batch Normalization', 'Early Stopping'],
        correctOption: 0,
        explanation: 'Dropout forces neurons to develop robust, non-co-dependent features.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Compare Overfitting vs Underfitting in Machine Learning models. Detail 3 regularization techniques used in Deep Learning.',
        rubric: 'Candidate must define high variance (overfitting) vs high bias (underfitting), and explain Dropout, L2 Weight Decay, and Data Augmentation.',
      },
    ],
    thermo: [
      {
        type: 'mcq',
        marks: 5,
        title: 'What thermodynamic quantity is described as the measure of molecular disorder or randomness in a closed system?',
        options: ['Enthalpy (H)', 'Entropy (S)', 'Gibbs Free Energy (G)', 'Specific Heat Capacity (Cp)'],
        correctOption: 1,
        explanation: 'Entropy (S) quantifies the microscopic multiplicity and irreversible dissipation of energy.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'Which process occurs at strictly constant pressure in a thermodynamic cylinder system?',
        options: ['Isobaric process (dP = 0)', 'Isochoric process', 'Isothermal process', 'Isentropic process'],
        correctOption: 0,
        explanation: 'Isobaric signifies constant pressure (dP = 0).',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'At absolute zero temperature (0 Kelvin), the entropy of a perfect crystalline substance is:',
        options: ['Exactly zero (Third Law of Thermodynamics)', 'Infinite due to quantum fluctuation', 'Dependent on external atmospheric pressure', 'Negative value equivalent to lattice binding energy'],
        correctOption: 0,
        explanation: 'Third law states crystalline entropy converges to zero at absolute zero.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'What is the Carnot thermal efficiency of a reversible heat engine operating between 600 K source and 300 K sink?',
        options: ['50% (1 - 300/600 = 0.50)', '100%', '33.3%', '75%'],
        correctOption: 0,
        explanation: 'η = 1 - (Tc / Th) = 1 - (300 / 600) = 50%.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Differentiate between Reversible and Irreversible thermodynamic processes with graphical PV diagrams and real-world engine examples.',
        rubric: 'Candidate must provide PV cycle diagrams, entropy changes (ΔS > 0 for irreversible), and identify frictional dissipation causes.',
      },
    ],
    default: [
      {
        type: 'mcq',
        marks: 5,
        title: `Which fundamental principle is foundational to modern understanding of ${topic || 'the subject'}?`,
        options: [
          `Conservation of state invariants and formal boundary conditions in ${topic || 'theoretical computer science'}`,
          'Arbitrary axiomatic convention without experimental backing',
          'Classical approximation without empirical verification',
          'Statistical outlier measurement model',
        ],
        correctOption: 0,
        explanation: `Fundamental empirical laws dictate the governing dynamics of ${topic || 'the subject'}.`,
      },
      {
        type: 'mcq',
        marks: 5,
        title: `What is the primary constraint encountered when applying theoretical models of ${topic || 'this topic'} to real operational conditions?`,
        options: [
          'Non-ideal noise, latency constraints, and boundary condition limits',
          'Complete absence of mathematical formulations',
          'Incompatibility with SI standard units',
          'Violation of speed of light in vacuum',
        ],
        correctOption: 0,
        explanation: 'Real-world operational systems always encounter latency, boundary noise, and empirical constraints.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: `When optimizing the efficiency of ${topic || 'this system'}, which performance trade-off is most commonly analyzed?`,
        options: [
          'Throughput vs latency and resource utilization under high load',
          'Arbitrary instruction frequency without variance tracking',
          'Constant zero-overhead assumption',
          'Unconstrained memory expansion without bounds',
        ],
        correctOption: 0,
        explanation: 'System optimization standardly evaluates trade-offs between throughput, latency, and memory footprint.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: `Which diagnostic technique or methodology is standardly employed to detect edge-case anomalies in ${topic || 'this domain'}?`,
        options: [
          'Comprehensive automated regression benchmarking and telemetry invariant checks',
          'Skipping unit and boundary validation suites',
          'Hardcoding static assumptions across dynamic inputs',
          'Immediate unconditional system termination',
        ],
        correctOption: 0,
        explanation: 'Automated telemetry and regression checks identify edge-case boundary departures.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: `Provide a structured analytical breakdown of key governing equations and real-world engineering applications of ${topic || 'this topic'}.`,
        rubric: 'Candidate should define key variables, formulate relevant equations, and discuss practical engineering implementations.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: `Discuss the primary failure modes and mitigation strategies encountered in real-world deployments of ${topic || 'this domain'}.`,
        rubric: 'Candidate must identify resource bottlenecks, failure isolation protocols, and disaster recovery or fallback policies.',
      },
    ],
  };

  const pool = normalized.includes('quad') || normalized.includes('equation') || normalized.includes('math') || normalized.includes('algebra') || normalized.includes('calculus')
    ? questionsDatabase.math
    : normalized.includes('newton') || normalized.includes('motion') || normalized.includes('mechanic') || normalized.includes('kinematic') || normalized.includes('force')
    ? questionsDatabase.mechanics
    : normalized.includes('tree') || normalized.includes('bst') || normalized.includes('dsa') || normalized.includes('graph') || normalized.includes('algorithm')
    ? questionsDatabase.dsa
    : normalized.includes('ai') || normalized.includes('learn') || normalized.includes('neural') || normalized.includes('vision') || normalized.includes('deep') || normalized.includes('intel')
    ? questionsDatabase.aiml
    : normalized.includes('thermo') || normalized.includes('heat') || normalized.includes('entropy') || normalized.includes('physic')
    ? questionsDatabase.thermo
    : questionsDatabase.default;


  const generated = [];
  for (let i = 0; i < count; i++) {
    const item = pool[i % pool.length];
    const finalMarks = customMarks !== null && customMarks !== undefined && Number(customMarks) > 0
      ? Number(customMarks)
      : item.marks;
    const finalNegative = customNegativeMarks !== null && customNegativeMarks !== undefined
      ? Number(customNegativeMarks)
      : (item.type === 'mcq' ? 1.0 : 0);

    const isRepeated = i >= pool.length;
    const titleText = isRepeated
      ? `${item.title} (Variant #${Math.floor(i / pool.length) + 1})`
      : item.title;

    generated.push({
      id: `ai_q_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
      type: item.type,
      marks: finalMarks,
      negativeMarks: finalNegative,
      difficulty: difficulty || 'Medium',
      duration: item.duration || (item.type === 'mcq' ? 2 : (item.type === 'short' ? 3 : 8)),
      title: titleText,
      options: item.options ? [...item.options] : undefined,
      correctOption: item.correctOption,
      explanation: item.explanation,
      rubric: item.rubric,
      aiGenerated: true,
    });
  }
  return generated;
}

