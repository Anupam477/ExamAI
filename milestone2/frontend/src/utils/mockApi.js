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
    name: 'Dr. Test Teacher',
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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

    return {
      success: true,
      status: 'approved',
      message: `Welcome back, ${existingUser.name}! Signed in successfully.`,
      user: sessionUser,
    };
  }

  // Teacher or Admin role login
  const mockUser = {
    id: `usr_${Date.now()}`,
    email: credentials.email,
    role: role,
    fullName: role === 'admin' ? 'Institutional Administrator' : 'Authorized Instructor',
    token: `fake-jwt-token-examai-${role}-${Date.now()}`,
    authenticatedAt: new Date().toISOString(),
    status: 'approved',
  };

  sessionStorage.setItem('examai_auth_user', JSON.stringify(mockUser));

  return {
    success: true,
    status: 'approved',
    message: `Welcome back! Signed in successfully as ${role}.`,
    user: mockUser,
  };
}

/**
 * Simulates registration API call
 */
export async function mockSignupApi(role, formData) {
  await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));

  const newUser = {
    id: `usr_${Date.now()}`,
    name: `${formData.firstName} ${formData.lastName}`.trim(),
    email: formData.email.trim().toLowerCase(),
    role: role,
    college: formData.institute || 'Apex Institute of Technology',
    identifier: formData.rollNumber || `ID-${Math.floor(1000 + Math.random() * 9000)}`,
    subDetails: `${formData.classYear || '1 Year'} · ${formData.department || 'General'}`,
    classYear: formData.classYear || '1 Year',
    department: formData.department || 'Computer Science',
    joined: new Date().toISOString().split('T')[0],
    joinedDisplay: 'Just now',
    status: 'pending',
    active: true,
    rejectionReason: null,
    adminNotes: 'Candidate registered through student portal.',
    avatarColor: role === 'teacher' ? '#0E6B58' : '#2D5BD0',
    idProofUrl: 'DOC-STUDENT-UPLOAD',
  };

  const users = getStoredUsers();
  saveStoredUsers([newUser, ...users]);

  return {
    success: true,
    message: `Account created successfully for ${newUser.name}. Pending administrator approval.`,
    user: newUser,
  };
}

/**
 * Retrieves the currently active mock session from sessionStorage
 */
export function getActiveSession() {
  try {
    const raw = sessionStorage.getItem('examai_auth_user');
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
    instructor: 'Dr. Test Teacher',
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
    instructor: 'Dr. Test Teacher',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitize existing stored tests:
        // 1. Remove wildcards ('*', 'all', 'students') from assignedStudents
        // 2. For default seed tests (test_001, test_002, test_003), reset assignedStudents to their strict seed roster
        // 3. For custom tests created by teachers, retain assignedStudents chosen by the teacher
        const sanitized = parsed.map((test) => {
          const initMatch = INITIAL_TEACHER_TESTS.find((it) => it.id === test.id);
          let assigned = Array.isArray(test.assignedStudents)
            ? test.assignedStudents.filter((a) => {
                const s = String(a).trim().toLowerCase();
                return s && s !== '*' && s !== 'all' && s !== 'students' && s !== 'all students';
              })
            : [];

          if (initMatch) {
            assigned = [...initMatch.assignedStudents];
          }

          return {
            ...test,
            assignedStudents: assigned,
          };
        });

        // Ensure all initial tests exist in the list
        INITIAL_TEACHER_TESTS.forEach((initTest) => {
          const idx = sanitized.findIndex((t) => t.id === initTest.id);
          if (idx === -1) {
            sanitized.push(initTest);
          } else {
            sanitized[idx] = {
              ...initTest,
              ...sanitized[idx],
              status: sanitized[idx].status || initTest.status || 'published',
              instructor: sanitized[idx].instructor || initTest.instructor,
              instructorRole: sanitized[idx].instructorRole || initTest.instructorRole,
              assignedStudents: [...initTest.assignedStudents],
            };
          }
        });

        localStorage.setItem('examai_teacher_tests', JSON.stringify(sanitized));
        return sanitized;
      }
    }
  } catch (e) {
    console.warn('Error reading teacher tests:', e);
  }
  try {
    localStorage.setItem('examai_teacher_tests', JSON.stringify(INITIAL_TEACHER_TESTS));
  } catch {
    // ignore
  }
  return INITIAL_TEACHER_TESTS;
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
  const index = tests.findIndex((t) => t.id === testData.id);
  let updated;
  if (index >= 0) {
    updated = [...tests];
    updated[index] = { ...updated[index], ...testData, updatedAt: new Date().toISOString() };
  } else {
    const newTest = {
      ...testData,
      id: testData.id || `test_${Date.now()}`,
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
 */
export function isStudentAssignedToTest(test, studentUser) {
  if (!test || !studentUser) return false;

  const assigned = test.assignedStudents;
  // If assignedStudents is empty, the test is not assigned to anyone yet
  if (!Array.isArray(assigned) || assigned.length === 0) return false;

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
    // Exclude wildcards
    if (a === '*' || a === 'all' || a === 'students' || a === 'all students') {
      return false;
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
 */
export function getStudentSubmissions(studentIdOrEmail) {
  try {
    const raw = localStorage.getItem('examai_submissions');
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!studentIdOrEmail) return list;
    const clean = String(studentIdOrEmail).trim().toLowerCase();
    return list.filter(
      (s) =>
        String(s.studentId || '').trim().toLowerCase() === clean ||
        String(s.studentEmail || '').trim().toLowerCase() === clean
    );
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
        options: ['Isobaric process', 'Isochoric process', 'Isothermal process', 'Isentropic process'],
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
          `Core empirical conservation law in ${topic || 'theoretical computer science'}`,
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
        title: `What is the primary constraint encountered when applying theoretical models of ${topic || 'this topic'} to real experimental conditions?`,
        options: [
          'Non-ideal noise, latency constraints, and boundary conditions',
          'Complete absence of mathematical formulations',
          'Incompatibility with SI standard units',
          'Violation of speed of light in vacuum',
        ],
        correctOption: 0,
        explanation: 'Real-world operational systems always encounter latency, boundary noise, and empirical constraints.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: `Provide a structured analytical breakdown of key governing equations and real-world engineering applications of ${topic || 'this topic'}.`,
        rubric: 'Candidate should define key variables, formulate relevant equations, and discuss practical engineering implementations.',
      },
    ],
  };

  const pool = normalized.includes('ai') || normalized.includes('learn') || normalized.includes('neural') || normalized.includes('vision') || normalized.includes('deep') || normalized.includes('intel')
    ? questionsDatabase.aiml
    : normalized.includes('thermo') || normalized.includes('physic')
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

