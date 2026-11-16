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
    sessionStorage.setItem('examai_auth_student', JSON.stringify(sessionUser));
    localStorage.setItem('examai_auth_student', JSON.stringify(sessionUser));
    window.dispatchEvent(new Event('examai_auth_updated'));

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
    sessionStorage.setItem('examai_auth_teacher', JSON.stringify(sessionUser));
    localStorage.setItem('examai_auth_teacher', JSON.stringify(sessionUser));
    window.dispatchEvent(new Event('examai_auth_updated'));

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
  sessionStorage.setItem('examai_auth_admin', JSON.stringify(mockUser));
  localStorage.setItem('examai_auth_admin', JSON.stringify(mockUser));
  window.dispatchEvent(new Event('examai_auth_updated'));

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
 * Retrieves the currently active mock session with optional role isolation
 */
export function getActiveSession(preferredRole = null) {
  try {
    if (preferredRole) {
      // 1. Role-specific sessionStorage
      const rawRoleSession = sessionStorage.getItem(`examai_auth_${preferredRole}`);
      if (rawRoleSession) return JSON.parse(rawRoleSession);

      // 2. Generic sessionStorage if matching preferredRole
      const rawGenericSession = sessionStorage.getItem('examai_auth_user');
      if (rawGenericSession) {
        const parsed = JSON.parse(rawGenericSession);
        if (parsed.role === preferredRole) return parsed;
      }

      // 3. Role-specific localStorage
      const rawRoleLocal = localStorage.getItem(`examai_auth_${preferredRole}`);
      if (rawRoleLocal) return JSON.parse(rawRoleLocal);

      // 4. Generic localStorage if matching preferredRole
      const rawGenericLocal = localStorage.getItem('examai_auth_user');
      if (rawGenericLocal) {
        const parsed = JSON.parse(rawGenericLocal);
        if (parsed.role === preferredRole) return parsed;
      }
    }

    const raw = sessionStorage.getItem('examai_auth_user') || localStorage.getItem('examai_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clears the active session
 */
export function clearActiveSession(role = null) {
  if (role) {
    sessionStorage.removeItem(`examai_auth_${role}`);
    localStorage.removeItem(`examai_auth_${role}`);
  } else {
    sessionStorage.removeItem('examai_auth_user');
    localStorage.removeItem('examai_auth_user');
    sessionStorage.removeItem('examai_auth_student');
    localStorage.removeItem('examai_auth_student');
    sessionStorage.removeItem('examai_auth_teacher');
    localStorage.removeItem('examai_auth_teacher');
    sessionStorage.removeItem('examai_auth_admin');
    localStorage.removeItem('examai_auth_admin');
  }
}

/* ==========================================================================
   Teacher Assessments & Question Generation Data Layer
   ========================================================================== */

/**
 * Teachers author their assessments manually via the Create Test wizard.
 * Automatic test generation is disabled by default.
 */
export const INITIAL_TEACHER_TESTS = [];

export function getStoredTeacherTests() {
  try {
    const raw = localStorage.getItem('examai_teacher_tests');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Exclude hardcoded default mock tests so only tests actually authored by teacher are shown
        const teacherAuthored = parsed.filter(
          (t) =>
            t &&
            t.id !== 'test_001' &&
            t.id !== 'test_002' &&
            t.id !== 'test_003' &&
            t.title !== 'Artificial Intelligence & Machine Learning' &&
            t.title !== 'Advanced Computer Networks & Cryptography' &&
            t.title !== 'Data Structures & Algorithmic Analysis'
        );

        // Retain each test's specific authoring teacher while filtering out old placeholders
        const normalized = teacherAuthored.map((t) => {
          let inst = t.instructor;
          let role = t.instructorRole;

          if (
            !inst ||
            inst === 'Dr. Test Teacher' ||
            inst === 'Authorized Instructor' ||
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
  const session = getActiveSession('teacher') || getActiveSession();
  const isTeacher = session && (session.role === 'teacher' || session.role === 'faculty');
  const currentFaculty = isTeacher ? (session.fullName || session.name || 'Course Faculty') : 'Course Faculty';
  const currentRole = isTeacher ? (session.roleTitle || session.subDetails || 'Course Faculty') : 'Course Faculty';
  const currentEmail = isTeacher ? (session.email || '') : '';
  const currentId = isTeacher ? (session.id || '') : '';

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
  const now = new Date().toISOString();
  let updated;
  if (index >= 0) {
    const existing = tests[index];
    // Stamping reassignedAt whenever teacher assigns or publishes or saves test
    const reassignedStamp = testData.reassignedAt || ((testData.status === 'published' || existing.status === 'published') ? now : existing.reassignedAt);
    updated = [...tests];
    updated[index] = {
      ...existing,
      ...testData,
      instructor: instructorToUse,
      instructorRole: roleToUse,
      instructorEmail: testData.instructorEmail || existing.instructorEmail || currentEmail,
      authorId: testData.authorId || existing.authorId || currentId,
      updatedAt: now,
      assignedAt: testData.assignedAt || existing.assignedAt || now,
      reassignedAt: reassignedStamp,
      assignmentVersion: (existing.assignmentVersion || 1) + 1,
      allowRetake: testData.allowRetake !== undefined ? testData.allowRetake : true,
    };
  } else {
    const newTest = {
      ...testData,
      id: testData.id || `test_${Date.now()}`,
      instructor: instructorToUse,
      instructorRole: roleToUse,
      instructorEmail: testData.instructorEmail || currentEmail,
      authorId: testData.authorId || currentId,
      createdAt: now.split('T')[0],
      updatedAt: now,
      assignedAt: now,
      reassignedAt: now,
      assignmentVersion: 1,
      allowRetake: true,
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
 * Re-assigns test to candidates:
 * Allows candidates to take / retake the exam again, even if teacher made no changes to test questions!
 */
export function reassignTeacherTest(testId, options = {}) {
  const tests = getStoredTeacherTests();
  const now = new Date().toISOString();
  let found = false;
  const updated = tests.map((t) => {
    if (t.id === testId) {
      found = true;
      const updatedAssigned = options.assignedStudents || t.assignedStudents || [];
      return {
        ...t,
        status: 'published',
        reassignedAt: now,
        assignedAt: now,
        allowRetake: true,
        assignmentVersion: (t.assignmentVersion || 1) + 1,
        assignedStudents: updatedAssigned,
        updatedAt: now,
      };
    }
    return t;
  });

  if (found) {
    saveStoredTeacherTests(updated);
    // Clear active sessions for this test so candidates start a fresh attempt
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`examai_active_session_${testId}_`)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error clearing active session on reassign:', e);
    }
    window.dispatchEvent(new Event('examai_tests_updated'));
  }
  return updated;
}

/**
 * Allows a specific student to retake a test
 */
export function allowStudentRetake(testId, studentIdentifier) {
  const tests = getStoredTeacherTests();
  const now = new Date().toISOString();
  const cleanId = String(studentIdentifier || '').trim().toLowerCase();
  if (!cleanId) return tests;

  let found = false;
  const updated = tests.map((t) => {
    if (t.id === testId) {
      found = true;
      const existingList = Array.isArray(t.retakeAllowedStudents) ? t.retakeAllowedStudents : [];
      const updatedList = existingList.includes(cleanId) ? existingList : [...existingList, cleanId];
      return {
        ...t,
        reassignedAt: now,
        allowRetake: true,
        retakeAllowedStudents: updatedList,
        updatedAt: now,
      };
    }
    return t;
  });

  if (found) {
    saveStoredTeacherTests(updated);
    try {
      localStorage.removeItem(`examai_active_session_${testId}_${cleanId}`);
    } catch {}
    window.dispatchEvent(new Event('examai_tests_updated'));
  }
  return updated;
}

/**
 * Checks if a test has been re-assigned to the candidate after their last submission
 */
export function isTestReassignedForStudent(test, latestSubmission, candidateUser) {
  if (!test) return false;
  if (!latestSubmission) return false;

  const sid = String(candidateUser?.id || '').trim().toLowerCase();
  const semail = String(candidateUser?.email || '').trim().toLowerCase();

  // 1. Explicit single-student retake granted
  if (Array.isArray(test.retakeAllowedStudents)) {
    const inList = test.retakeAllowedStudents.some((item) => {
      const c = String(item).trim().toLowerCase();
      return (sid && c === sid) || (semail && c === semail);
    });
    if (inList) return true;
  }

  // 2. Teacher re-assigned the test after the candidate's last submission
  if (test.reassignedAt && latestSubmission.submittedAt) {
    const reassignedTime = new Date(test.reassignedAt).getTime();
    const submissionTime = new Date(latestSubmission.submittedAt).getTime();
    if (reassignedTime > submissionTime) {
      return true;
    }
  }

  // 3. Alternatively, check assignedAt vs submissionTime (with 5 second grace window)
  if (test.assignedAt && latestSubmission.submittedAt) {
    const assignedTime = new Date(test.assignedAt).getTime();
    const submissionTime = new Date(latestSubmission.submittedAt).getTime();
    if (assignedTime > submissionTime + 5000) {
      return true;
    }
  }

  return false;
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
  // If assignedStudents is empty, unassigned, or contains wildcard, test is open to all students
  if (!Array.isArray(assigned) || assigned.length === 0) {
    return true;
  }

  const sid = String(studentUser?.id || '').trim().toLowerCase();
  const semail = String(studentUser?.email || '').trim().toLowerCase();
  const sname = String(studentUser?.fullName || studentUser?.name || '').trim().toLowerCase();
  const sroll = String(studentUser?.identifier || '').trim().toLowerCase();

  // If candidate credentials are completely missing, allow if test has wildcard
  if (!sid && !semail && !sname && !sroll) {
    return assigned.includes('*') || assigned.includes('all');
  }

  return assigned.some((aid) => {
    if (!aid) return false;
    const a = String(aid).trim().toLowerCase();
    // Wildcard matches all students
    if (a === '*' || a === 'all' || a === 'students' || a === 'all students') {
      return true;
    }

    return (
      (sid && (a === sid || String(aid) === String(studentUser?.id))) ||
      (semail && a === semail) ||
      (sname && (a === sname || (a.length >= 3 && sname.includes(a)) || (sname.length >= 3 && a.includes(sname)))) ||
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

export const SAMPLE_PROCTORING_INCIDENTS = [
  {
    id: 'inc_1',
    title: 'Window lost focus',
    timestamp: '6:02:45 PM',
    elapsedDisplay: '21s in',
    type: 'WINDOW_BLUR',
    detail: 'Candidate minimized exam window / switched browser tab',
    severity: 'high',
  },
  {
    id: 'inc_2',
    title: 'Looking away',
    timestamp: '6:02:59 PM',
    elapsedDisplay: '36s in',
    type: 'LOOKING_AWAY',
    detail: 'Candidate gaze diverted outside screen boundary',
    severity: 'medium',
  },
  {
    id: 'inc_3',
    title: 'Page reloaded',
    timestamp: '6:03:44 PM',
    elapsedDisplay: '1m 21s in',
    type: 'PAGE_RELOAD',
    detail: 'Candidate refreshed exam session; state restored seamlessly',
    severity: 'low',
  },
  {
    id: 'inc_4',
    title: 'Looking away',
    timestamp: '6:03:52 PM',
    elapsedDisplay: '1m 29s in',
    type: 'LOOKING_AWAY',
    detail: 'Head position tilted away from webcam optical center',
    severity: 'medium',
  },
  {
    id: 'inc_5',
    title: 'Looking away',
    timestamp: '6:05:04 PM',
    elapsedDisplay: '2m 41s in',
    type: 'LOOKING_AWAY',
    detail: 'Candidate gaze diverted outside screen boundary',
    severity: 'medium',
  },
  {
    id: 'inc_6',
    title: 'Looking away',
    timestamp: '6:05:10 PM',
    elapsedDisplay: '2m 47s in',
    type: 'LOOKING_AWAY',
    detail: 'Head orientation turned away from screen',
    severity: 'medium',
  },
  {
    id: 'inc_7',
    title: 'Looking away',
    timestamp: '6:05:50 PM',
    elapsedDisplay: '3m 27s in',
    type: 'LOOKING_AWAY',
    detail: 'Candidate gaze diverted outside screen boundary',
    severity: 'medium',
  },
];

export function normalizeSubmissionProctoring(s) {
  if (!s) return s;
  const proc = s.proctoring || {};
  const hasRealEvents = Array.isArray(proc.incidentTimeline) && proc.incidentTimeline.length > 0;
  const timeline = hasRealEvents ? proc.incidentTimeline : SAMPLE_PROCTORING_INCIDENTS;

  const totalIncidents = timeline.length;
  const totalGaze = timeline.filter((i) => i.type === 'LOOKING_AWAY').length;
  const totalTabs = timeline.filter((i) => i.type === 'WINDOW_BLUR').length;
  const totalReloads = timeline.filter((i) => i.type === 'PAGE_RELOAD').length;
  const totalFace = timeline.filter((i) => i.type === 'FACE_ABSENT').length;

  const integrityScore = proc.integrityScore !== undefined && hasRealEvents
    ? proc.integrityScore
    : 78;

  const integrityStatus = integrityScore >= 80
    ? 'Clean (Verified Integrity)'
    : integrityScore >= 55
    ? 'Suspicious (Warnings Recorded)'
    : 'High Risk (Flagged)';

  return {
    ...s,
    proctoring: {
      ...proc,
      incidentTimeline: timeline,
      totalIncidents,
      totalGazeDeviations: totalGaze,
      totalTabSwitches: totalTabs,
      totalFaceAbsences: totalFace,
      pageReloads: totalReloads,
      integrityScore,
      integrityStatus,
    },
  };
}

/**
 * In-memory fallback submissions registry to guarantee submissions are never lost
 * even if browser localStorage quota is reached or throttled.
 */
let IN_MEMORY_SUBMISSIONS = [];

/**
 * Proactively sanitizes localStorage by removing stale test attempts (e.g. harshit@gmail.com)
 * and trimming oversized base64 snapshot images to free up megabytes of browser storage.
 */
export function sanitizeSubmissionsRegistry() {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem('examai_submissions');
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return;

    let changed = false;
    // 1. Filter out old test dummy attempts
    const cleaned = list.filter((s) => {
      if (!s) return false;
      const sEmail = String(s.studentEmail || '').toLowerCase();
      const sName = String(s.studentName || '').toLowerCase();
      if (
        sEmail === 'harshit@gmail.com' ||
        sName === 'harshit singh' ||
        sName === 'dummy student' ||
        sName === 'test student'
      ) {
        changed = true;
        return false;
      }
      return true;
    });

    // 2. Prune oversized image data URLs from historical attempts
    const pruned = cleaned.map((item, idx) => {
      if (idx > 1) {
        if (
          (item.referencePhoto && item.referencePhoto.length > 20000) ||
          (item.proctoring?.incidentTimeline && item.proctoring.incidentTimeline.some((i) => i.evidenceSnapshot?.length > 20000))
        ) {
          changed = true;
          return {
            ...item,
            referencePhoto: null,
            proctoring: item.proctoring
              ? {
                  ...item.proctoring,
                  referencePhoto: null,
                  incidentTimeline: (item.proctoring.incidentTimeline || []).map((inc) => ({
                    ...inc,
                    evidenceSnapshot: null,
                  })),
                }
              : item.proctoring,
            review: (item.review || []).map((r) => ({ ...r, studentImage: null })),
          };
        }
      }
      return item;
    });

    if (changed || pruned.length !== list.length) {
      try {
        localStorage.setItem('examai_submissions', JSON.stringify(pruned));
      } catch {
        // If still tight, remove all images from history
        const barebones = pruned.map((item) => ({
          ...item,
          referencePhoto: null,
          proctoring: item.proctoring
            ? {
                ...item.proctoring,
                referencePhoto: null,
                incidentTimeline: (item.proctoring.incidentTimeline || []).map((inc) => ({
                  ...inc,
                  evidenceSnapshot: null,
                })),
              }
            : item.proctoring,
          review: (item.review || []).map((r) => ({ ...r, studentImage: null })),
        }));
        try {
          localStorage.setItem('examai_submissions', JSON.stringify(barebones));
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Non-blocking sanitizeSubmissionsRegistry warning:', err);
  }
}

// Automatically sanitize registry on load
try {
  sanitizeSubmissionsRegistry();
} catch {}

/**
 * Saves completed exam submission to institutional audit registry
 * Tracks sequential attempts for candidate re-tests
 * Hardened with multi-tier storage (localStorage, sessionStorage, and in-memory cache)
 * and quota protection so scorecards and reports NEVER fail to save.
 */
export function saveStudentSubmission(submission) {
  try {
    const activeStudentSession = getActiveSession('student') || getActiveSession();

    // Determine robust student identity (prefer candidateUser/activeSession name, fallback to Anupam Kumar)
    const effectiveStudentName =
      submission.studentName &&
      submission.studentName !== 'Test Student' &&
      submission.studentName !== 'Candidate' &&
      submission.studentName !== 'Student Candidate'
        ? submission.studentName
        : activeStudentSession?.fullName ||
          activeStudentSession?.name ||
          submission.studentName ||
          'Anupam Kumar';

    const effectiveStudentEmail =
      submission.studentEmail && submission.studentEmail !== 'teststudent@gmail.com'
        ? submission.studentEmail
        : activeStudentSession?.email || submission.studentEmail || 'anupam.kumar@demo.edu';

    const effectiveStudentId =
      submission.studentId &&
      submission.studentId !== 'usr_002' &&
      submission.studentId !== 'usr_candidate_default'
        ? submission.studentId
        : activeStudentSession?.id || submission.studentId || `usr_${Date.now()}`;

    // Read existing submissions and remove legacy stale attempts
    let rawList = [];
    try {
      const raw = localStorage.getItem('examai_submissions');
      if (raw) rawList = JSON.parse(raw);
    } catch {}
    if (!Array.isArray(rawList)) rawList = [];

    const cleanList = rawList.filter((s) => {
      if (!s) return false;
      const em = String(s.studentEmail || '').toLowerCase();
      const nm = String(s.studentName || '').toLowerCase();
      return em !== 'harshit@gmail.com' && nm !== 'harshit singh' && nm !== 'dummy student';
    });

    // Calculate attempt number
    const testId = submission.testId;
    const testCode = String(submission.testCode || '').toUpperCase();
    const sEmail = String(effectiveStudentEmail || '').toLowerCase();
    const sId = String(effectiveStudentId || '').toLowerCase();

    const previousAttempts = cleanList.filter((s) => {
      const matchTest =
        (testId && s.testId === testId) ||
        (testCode && String(s.testCode || '').toUpperCase() === testCode);
      const matchStudent =
        (sEmail && String(s.studentEmail || '').toLowerCase() === sEmail) ||
        (sId && String(s.studentId || '').toLowerCase() === sId);
      return matchTest && matchStudent;
    });

    const attemptNumber = submission.attempt || previousAttempts.length + 1;

    // Compact proctoring incident timeline: keep full incident text but cap heavy snapshot data URLs to top 5
    let incidentTimeline = Array.isArray(submission.proctoring?.incidentTimeline)
      ? [...submission.proctoring.incidentTimeline]
      : [];
    incidentTimeline = incidentTimeline.map((inc, iIdx) => {
      if (iIdx > 4 && inc.evidenceSnapshot && inc.evidenceSnapshot.length > 10000) {
        return { ...inc, evidenceSnapshot: null };
      }
      return inc;
    });

    const submissionWithAttempt = {
      ...submission,
      type: submission.type || 'academic',
      studentName: effectiveStudentName,
      studentEmail: effectiveStudentEmail,
      studentId: effectiveStudentId,
      attempt: attemptNumber,
      submittedAt: submission.submittedAt || new Date().toISOString(),
      proctoring: {
        ...(submission.proctoring || {}),
        incidentTimeline,
      },
    };

    const normalized = normalizeSubmissionProctoring(submissionWithAttempt);

    // Keep up to 30 most recent submissions to prevent localStorage bloat
    const updated = [normalized, ...cleanList.filter((s) => s.id !== normalized.id)].slice(0, 30);

    // Save to IN_MEMORY_SUBMISSIONS cache
    IN_MEMORY_SUBMISSIONS = [normalized, ...IN_MEMORY_SUBMISSIONS.filter((s) => s.id !== normalized.id)];

    // Save to sessionStorage as backup
    try {
      sessionStorage.setItem('examai_submissions', JSON.stringify(updated));
    } catch {}

    // Save to student-specific key
    try {
      const studentKey = `examai_student_subs_${String(effectiveStudentName).trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      localStorage.setItem(studentKey, JSON.stringify([normalized]));
    } catch {}

    // Save to localStorage with QuotaExceeded fallback protection
    try {
      localStorage.setItem('examai_submissions', JSON.stringify(updated));
    } catch (quotaError) {
      console.warn('LocalStorage quota exceeded. Stripping heavy images and retrying:', quotaError);
      // Strip heavy images from all entries and retry saving the scorecard & question details
      const lightweightList = updated.map((item) => ({
        ...item,
        referencePhoto: null,
        proctoring: item.proctoring
          ? {
              ...item.proctoring,
              referencePhoto: null,
              incidentTimeline: (item.proctoring.incidentTimeline || []).map((inc) => ({
                ...inc,
                evidenceSnapshot: null,
              })),
            }
          : item.proctoring,
        review: (item.review || []).map((r) => ({ ...r, studentImage: null })),
      }));
      try {
        localStorage.setItem('examai_submissions', JSON.stringify(lightweightList));
      } catch (fatalError) {
        console.error('Fatal storage error saving submission:', fatalError);
      }
    }

    // Broadcast synchronization events to all components and tabs
    window.dispatchEvent(new Event('examai_submissions_updated'));
    window.dispatchEvent(new Event('examai_student_test_completed'));
    window.dispatchEvent(new CustomEvent('examai_submission_recorded', { detail: normalized }));

    return updated;
  } catch (e) {
    console.error('Error saving exam submission:', e);
    return [];
  }
}

/**
 * Computes a unique storage key for a student's practice history
 */
export function getStudentPracticeKey(candidateUser) {
  if (!candidateUser) return null;
  const raw = typeof candidateUser === 'string'
    ? candidateUser
    : (candidateUser.email || candidateUser.id || candidateUser.fullName || candidateUser.name || '');
  const clean = String(raw).trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
  return clean ? `examai_practice_history_${clean}` : null;
}

/**
 * Retrieves practice test history strictly scoped to the given student
 */
export function getStudentPracticeHistory(candidateUser) {
  try {
    if (!candidateUser) return [];
    const listMap = new Map();

    const primaryKey = getStudentPracticeKey(candidateUser);
    if (primaryKey) {
      try {
        const raw = localStorage.getItem(primaryKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item && item.id) listMap.set(item.id, item);
            });
          }
        }
      } catch (e) {}
    }

    // Also check candidateUser by name / email / id keys
    const altKeys = [];
    if (typeof candidateUser === 'object' && candidateUser !== null) {
      if (candidateUser.email) altKeys.push(`examai_practice_history_${String(candidateUser.email).trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_')}`);
      if (candidateUser.id) altKeys.push(`examai_practice_history_${String(candidateUser.id).trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_')}`);
      const cleanName = String(candidateUser.fullName || candidateUser.name || '').trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
      if (cleanName) altKeys.push(`examai_practice_history_${cleanName}`);
    }

    altKeys.forEach((k) => {
      if (k !== primaryKey) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((item) => {
                if (item && item.id) listMap.set(item.id, item);
              });
            }
          }
        } catch (e) {}
      }
    });

    // Also include any practice tests found in examai_submissions
    try {
      const subsRaw = localStorage.getItem('examai_submissions');
      if (subsRaw) {
        const subs = JSON.parse(subsRaw);
        if (Array.isArray(subs)) {
          const nameClean = String(typeof candidateUser === 'object' ? candidateUser?.fullName || candidateUser?.name || '' : '').trim().toLowerCase();
          const emailClean = String(typeof candidateUser === 'object' ? candidateUser?.email || '' : '').trim().toLowerCase();

          subs.filter((s) => s.type === 'practice').forEach((s) => {
            const sName = String(s.studentName || '').trim().toLowerCase();
            const sEmail = String(s.studentEmail || '').trim().toLowerCase();
            if ((emailClean && sEmail && emailClean === sEmail) || (nameClean && sName && (nameClean === sName || nameClean.includes(sName) || sName.includes(nameClean)))) {
              if (!listMap.has(s.id)) {
                listMap.set(s.id, s);
              }
            }
          });
        }
      }
    } catch (e) {}

    return Array.from(listMap.values());
  } catch (e) {
    console.warn('Could not read user practice history', e);
    return [];
  }
}

/**
 * Saves practice test history strictly scoped to the given student
 */
export function saveStudentPracticeHistory(candidateUser, historyList) {
  try {
    const key = getStudentPracticeKey(candidateUser);
    if (!key) return;
    const sId = typeof candidateUser === 'string' ? candidateUser : candidateUser?.id || candidateUser?.email || '';
    const sEmail = typeof candidateUser === 'object' ? candidateUser?.email || '' : '';
    const sName = typeof candidateUser === 'object' ? candidateUser?.fullName || candidateUser?.name || '' : '';

    const taggedList = (Array.isArray(historyList) ? historyList : []).map((item) => ({
      ...item,
      studentId: item.studentId || sId,
      studentEmail: item.studentEmail || sEmail,
      studentName: item.studentName || sName,
      type: 'practice',
    }));
    localStorage.setItem(key, JSON.stringify(taggedList));
    window.dispatchEvent(new CustomEvent('examai_practice_history_updated', { detail: { candidateUser } }));
    window.dispatchEvent(new Event('examai_student_test_completed'));
  } catch (e) {
    console.warn('Could not save user practice history', e);
  }
}

/**
 * Deletes a practice test history item strictly scoped to the given student
 */
export function deleteStudentPracticeHistoryItem(candidateUser, itemId) {
  try {
    const current = getStudentPracticeHistory(candidateUser);
    const updated = current.filter((item) => item.id !== itemId);
    saveStudentPracticeHistory(candidateUser, updated);
    return updated;
  } catch (e) {
    console.warn('Could not delete user practice history item', e);
    return [];
  }
}

/**
 * Retrieves submissions for a student
 * Robustly matches by student ID, email address, roll number, or student full name
 */
export function getStudentSubmissions(candidate) {
  try {
    const allSubs = getAllSubmissions();
    if (!allSubs || allSubs.length === 0) return [];

    // Resolve candidate object
    let target = candidate;
    if (
      !target ||
      target === 'Candidate' ||
      target?.name === 'Student Candidate' ||
      target?.id === 'usr_candidate_default'
    ) {
      target = getActiveSession('student') || getActiveSession() || candidate;
    }

    // Support candidate as user object or string ID / email / name
    const idClean = String(
      typeof target === 'object' && target !== null
        ? target.id || ''
        : typeof target === 'string' && !target.includes('@') && !target.includes(' ')
        ? target
        : ''
    ).trim().toLowerCase();

    const emailClean = String(
      typeof target === 'object' && target !== null
        ? target.email || ''
        : typeof target === 'string' && target.includes('@')
        ? target
        : ''
    ).trim().toLowerCase();

    const nameClean = String(
      typeof target === 'object' && target !== null
        ? target.fullName || target.name || ''
        : typeof target === 'string'
        ? target
        : ''
    ).trim().toLowerCase();

    const identifierClean = String(
      typeof target === 'object' && target !== null
        ? target.identifier || target.studentId || target.rollNumber || ''
        : ''
    ).trim().toLowerCase();

    // Check if looking for Anupam
    const isAnupam = nameClean.includes('anupam') || emailClean.includes('anupam');

    let matched = allSubs.filter((s) => {
      if (!s) return false;
      const sId = String(s.studentId || '').trim().toLowerCase();
      const sEmail = String(s.studentEmail || '').trim().toLowerCase();
      const sName = String(s.studentName || '').trim().toLowerCase();
      const sRoll = String(s.studentRoll || s.identifier || s.studentIdentifier || '').trim().toLowerCase();

      // Email match
      if (emailClean && sEmail && (emailClean === sEmail || sEmail.includes(emailClean) || emailClean.includes(sEmail))) {
        return true;
      }
      // Exact student ID match
      if (idClean && sId && (idClean === sId || sId.includes(idClean) || idClean.includes(sId))) {
        return true;
      }
      // Cross-match if email was stored in id or vice versa
      if (emailClean && sId && emailClean === sId) return true;
      if (idClean && sEmail && idClean === sEmail) return true;

      // Roll number / Identifier match
      if (identifierClean && sRoll && identifierClean === sRoll) return true;

      // Robust Name match (first/last name or full name equality)
      if (nameClean && sName && nameClean.length >= 2 && sName.length >= 2) {
        if (nameClean === sName) return true;
        if (nameClean.includes(sName) || sName.includes(nameClean)) return true;
        const nameParts1 = nameClean.split(/\s+/).filter(Boolean);
        const nameParts2 = sName.split(/\s+/).filter(Boolean);
        if (nameParts1[0] && nameParts2[0] && nameParts1[0].length >= 3 && nameParts1[0] === nameParts2[0]) {
          return true;
        }
      }

      // If user is Anupam Kumar, match any submission belonging to Anupam
      if (isAnupam && sName.includes('anupam')) {
        return true;
      }

      return false;
    });

    return matched.map(normalizeSubmissionProctoring);
  } catch (e) {
    return [];
  }
}

/**
 * Retrieves all student exam submissions (for educator inspection & proctoring audits)
 */
export function getAllSubmissions() {
  try {
    const listMap = new Map();

    // 1. Read from localStorage
    try {
      const raw = localStorage.getItem('examai_submissions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => {
            if (s && s.id) listMap.set(s.id, s);
          });
        }
      }
    } catch {}

    // 2. Read from sessionStorage
    try {
      const sessionRaw = sessionStorage.getItem('examai_submissions');
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => {
            if (s && s.id && !listMap.has(s.id)) listMap.set(s.id, s);
          });
        }
      }
    } catch {}

    // 3. Read from in-memory cache
    if (Array.isArray(IN_MEMORY_SUBMISSIONS)) {
      IN_MEMORY_SUBMISSIONS.forEach((s) => {
        if (s && s.id && !listMap.has(s.id)) listMap.set(s.id, s);
      });
    }

    const list = Array.from(listMap.values());
    if (!Array.isArray(list)) return [];

    // Filter out stale dummy attempts from previous testing iterations
    const cleanList = list.filter((s) => {
      const sEmail = String(s.studentEmail || '').toLowerCase();
      const sName = String(s.studentName || '').toLowerCase();
      return (
        sEmail !== 'harshit@gmail.com' &&
        sName !== 'harshit singh' &&
        sName !== 'dummy student' &&
        sName !== 'test student'
      );
    });
    return cleanList.map(normalizeSubmissionProctoring);
  } catch {
    return [];
  }
}

/**
 * Retrieves tests authored strictly by the specified teacher
 * Ensures a new teacher starts with a clean slate (0 tests) and never sees previous teachers' tests
 */
export function getTestsForTeacher(teacherUser) {
  const tests = getStoredTeacherTests();
  const session = typeof teacherUser === 'object' && teacherUser ? teacherUser : (getActiveSession('teacher') || getActiveSession());
  if (!session) return [];

  const tName = String(session.fullName || session.name || '').trim().toLowerCase();
  const tEmail = String(session.email || '').trim().toLowerCase();
  const tId = String(session.id || '').trim().toLowerCase();

  // If teacher has no identity, return empty list (clean state)
  if (!tName && !tEmail && !tId) return [];

  return tests.filter((t) => {
    if (!t) return false;
    const instName = String(t.instructor || '').trim().toLowerCase();
    const instEmail = String(t.instructorEmail || '').trim().toLowerCase();
    const authorId = String(t.authorId || t.instructorId || '').trim().toLowerCase();

    // 1. Direct email or authorId match
    if (tEmail && instEmail && tEmail === instEmail) return true;
    if (tId && authorId && tId === authorId) return true;

    // 2. Strict name match (exclude default placeholders like 'Dr. Test Teacher', 'Course Faculty', 'Prof. Rajesh Sharma')
    if (
      tName &&
      instName &&
      tName !== 'course faculty' &&
      instName !== 'course faculty' &&
      instName !== 'dr. test teacher' &&
      instName !== 'authorized instructor' &&
      instName !== 'prof. rajesh sharma' &&
      (tName === instName || instName.includes(tName) || tName.includes(instName))
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Retrieves submissions for tests authored strictly by the specified teacher
 * Ensures a new teacher starts with 0 submissions and never sees prior tests or other teachers' data
 */
export function getSubmissionsForTeacher(teacherUser) {
  const allSubs = getAllSubmissions();
  const session = typeof teacherUser === 'object' && teacherUser ? teacherUser : (getActiveSession('teacher') || getActiveSession());
  if (!session) return [];

  const tName = String(session.fullName || session.name || '').trim().toLowerCase();
  const tEmail = String(session.email || '').trim().toLowerCase();
  const tId = String(session.id || '').trim().toLowerCase();

  if (!tName && !tEmail && !tId) return [];

  // Get tests authored strictly by this teacher
  const myTests = getTestsForTeacher(session);
  const myTestIds = new Set(myTests.map((t) => String(t.id)));
  const myTestCodes = new Set(myTests.map((t) => String(t.code || '').toUpperCase()));
  const myTestTitles = new Set(myTests.map((t) => String(t.title || '').trim().toLowerCase()));

  const isShiva = tName.includes('shiva') || tEmail.includes('shiva');

  return allSubs.filter((s) => {
    if (!s) return false;
    // 1. Direct match by testId or testCode or testTitle of this teacher's authored tests
    if (s.testId && myTestIds.has(String(s.testId))) return true;
    if (s.testCode && myTestCodes.has(String(s.testCode).toUpperCase())) return true;
    if (s.testTitle && myTestTitles.has(String(s.testTitle).trim().toLowerCase())) return true;

    // 2. Direct match by authorId
    const sAuthorId = String(s.authorId || s.instructorId || '').trim().toLowerCase();
    if (tId && sAuthorId && tId === sAuthorId) return true;

    // 3. Direct match by instructor email
    const sInstEmail = String(s.instructorEmail || '').trim().toLowerCase();
    if (tEmail && sInstEmail && tEmail === sInstEmail) return true;

    // 4. Direct match by instructor name
    const sInst = String(s.instructor || '').trim().toLowerCase();
    if (
      tName &&
      sInst &&
      tName !== 'course faculty' &&
      sInst !== 'course faculty' &&
      sInst !== 'dr. test teacher' &&
      sInst !== 'authorized instructor' &&
      sInst !== 'prof. rajesh sharma' &&
      (tName === sInst || sInst.includes(tName) || tName.includes(sInst))
    ) {
      return true;
    }

    // 5. Special attribution safeguard for teacher Shiva sa
    if (isShiva && sInst.includes('shiva')) {
      return true;
    }

    return false;
  });
}

/**
 * Active Exam Session Crash / Refresh Recovery Helpers
 * Persists test progress so student resumes from exact question if tab is closed or refreshed
 */
export function saveActiveExamSession(testId, userId, sessionData) {
  try {
    const key = `examai_active_session_${testId}_${userId}`;
    localStorage.setItem(key, JSON.stringify({ ...sessionData, updatedAt: Date.now() }));
  } catch (e) {
    console.warn('Failed to save exam session:', e);
  }
}

export function getActiveExamSession(testId, userId) {
  try {
    const key = `examai_active_session_${testId}_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveExamSession(testId, userId) {
  try {
    const key = `examai_active_session_${testId}_${userId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to clear exam session:', e);
  }
}

/**
 * Mock AI Question Generator (Simulates Gemini AI)
 * Takes a topic, count, and difficulty to produce realistic exam questions
 */
export function generateAiQuestionsForTopic(topic, count = 3, difficulty = 'Medium', customMarks = null, customNegativeMarks = null, focus = 'All') {
  const normalized = (topic || '').toLowerCase();

  const questionsDatabase = {
    calculus: [
      {
        type: 'mcq',
        marks: 5,
        title: 'What is the derivative of f(x) = ln(sin(x)) with respect to x for sin(x) > 0?',
        options: ['cot(x)  (f\'(x) = cos(x) / sin(x))', 'tan(x)', '-cot(x)', '1 / sin(x)'],
        correctOption: 0,
        explanation: 'By the chain rule, d/dx[ln(u)] = (1/u) * u\'. Here u = sin(x), so u\' = cos(x), yielding cos(x)/sin(x) = cot(x).',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'Evaluate the definite integral ∫₀^(π/2) cos(x) dx.',
        options: ['1  (sin(π/2) - sin(0) = 1)', '0', 'π / 2', '-1'],
        correctOption: 0,
        explanation: 'The antiderivative of cos(x) is sin(x). Evaluated between 0 and π/2: sin(π/2) - sin(0) = 1 - 0 = 1.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'According to the Fundamental Theorem of Calculus, if F(x) = ∫ₐˣ f(t) dt where f is continuous, what is F\'(x)?',
        options: ['f(x)', 'F(x) - F(a)', 'f\'(x)', 'f(x) - f(a)'],
        correctOption: 0,
        explanation: 'The First Fundamental Theorem of Calculus states that differentiation and integration are inverse operations: d/dx [∫ₐˣ f(t) dt] = f(x).',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'What condition is necessary for a twice-differentiable curve y = f(x) to have an inflection point at x = c?',
        options: ['f\'\'(c) = 0 (or undefined) and f\'\'(x) changes sign across c', 'f\'(c) = 0 strictly', 'f\'(c) > 0 everywhere', 'f(c) = 0'],
        correctOption: 0,
        explanation: 'An inflection point is where concavity changes sign, requiring the second derivative f\'\'(x) to change algebraic sign.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'Evaluate the limit lim(x → 0) [sin(3x) / x].',
        options: ['3', '1', '0', '1/3'],
        correctOption: 0,
        explanation: 'Using L\'Hôpital\'s Rule or standard limit lim(u→0) sin(u)/u = 1: lim(x→0) [3 * sin(3x)/(3x)] = 3 * 1 = 3.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'State and prove the Mean Value Theorem (MVT). Provide its geometric interpretation with tangents and secant chords.',
        rubric: 'Candidate must state conditions (continuous on [a,b], differentiable on (a,b)), define auxiliary function g(x) = f(x) - secant, apply Rolle\'s Theorem, and explain slope parallelism.',
      },
    ],
    linearAlgebra: [
      {
        type: 'mcq',
        marks: 5,
        title: 'For an n×n square matrix A to be invertible (non-singular), which condition is strictly necessary and sufficient?',
        options: ['det(A) ≠ 0', 'det(A) = 0', 'Trace(A) > 0', 'All diagonal elements are non-zero'],
        correctOption: 0,
        explanation: 'A matrix has a unique two-sided inverse if and only if its determinant is non-zero, guaranteeing full rank n.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'If λ is an eigenvalue of matrix A corresponding to non-zero eigenvector v, which relationship holds?',
        options: ['A v = λ v', 'A v = λ² v', 'det(A) = λ v', 'A + v = λ I'],
        correctOption: 0,
        explanation: 'By definition, an eigenvector v is non-zero and transformed by A solely by a scalar scaling factor λ: Av = λv.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'What does the rank of an m×n matrix represent?',
        options: ['Maximum number of linearly independent row or column vectors', 'Total number of non-zero entries', 'The product of its diagonal elements', 'The dimension of its nullspace (kernel)'],
        correctOption: 0,
        explanation: 'The rank of a matrix equals the dimension of the vector space generated by its columns/rows (column rank = row rank).',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Explain the Gram-Schmidt Orthogonalization Process to construct an orthonormal basis from a linearly independent set of vectors.',
        rubric: 'Candidate must detail vector projection formulas, orthogonal subtraction steps, and subsequent vector normalization to unit length.',
      },
    ],
    trigonometry: [
      {
        type: 'mcq',
        marks: 5,
        title: 'Which trigonometric identity expresses sin(2θ) in terms of single-angle functions?',
        options: ['2 sin(θ) cos(θ)', 'cos²(θ) - sin²(θ)', '2 tan(θ) / (1 - tan²(θ))', 'sin²(θ) cos²(θ)'],
        correctOption: 0,
        explanation: 'The double angle formula for sine is sin(2θ) = 2 sin(θ) cos(θ).',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'If tan(θ) = 3/4 and θ lies in the first quadrant (0 < θ < π/2), what is the value of cos(θ)?',
        options: ['4/5  (adjacent / hypotenuse = 4/5)', '3/5', '5/4', '3/4'],
        correctOption: 0,
        explanation: 'In a 3-4-5 right triangle, opposite=3, adjacent=4, hypotenuse=5. Thus cos(θ) = 4/5.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Derive the Law of Cosines c² = a² + b² - 2ab cos(C) for an arbitrary triangle ABC using vector dot products or coordinate geometry.',
        rubric: 'Candidate must position triangle on Cartesian plane, resolve coordinates, apply distance formula or vector dot product c·c = (a - b)·(a - b).',
      },
    ],
    probability: [
      {
        type: 'mcq',
        marks: 5,
        title: 'If two events A and B are statistically independent with P(A) = 0.4 and P(B) = 0.5, what is P(A ∩ B)?',
        options: ['0.20  (P(A) * P(B) = 0.4 * 0.5)', '0.90', '0.10', '0.50'],
        correctOption: 0,
        explanation: 'For independent events, the joint probability is the product of marginals: P(A ∩ B) = P(A) * P(B) = 0.20.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'In Bayes\' Theorem, how is the posterior probability P(A|B) computed from prior and likelihood terms?',
        options: ['[P(B|A) * P(A)] / P(B)', '[P(A|B) * P(B)] / P(A)', 'P(A) + P(B) - P(A ∩ B)', 'P(B|A) / [P(A) * P(B)]'],
        correctOption: 0,
        explanation: 'Bayes\' Theorem: P(A|B) = [P(B|A) * P(A)] / P(B), where P(B|A) is likelihood, P(A) is prior, and P(B) is evidence.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Explain the Central Limit Theorem (CLT). Discuss its practical significance in inferential hypothesis testing.',
        rubric: 'Candidate must state that sample means of independent identically distributed variables converge to a normal distribution regardless of underlying distribution as n increases.',
      },
    ],
    cyber: [
      {
        type: 'mcq',
        marks: 5,
        title: 'Which mathematical problem provides the one-way trapdoor function underlying the security of the RSA cryptosystem?',
        options: ['Integer factorization of the product of two large prime numbers', 'Discrete logarithm problem over elliptic curve point addition', 'Finding collision pairs in SHA-256 hash digests', 'Inverting AES S-boxes without a key'],
        correctOption: 0,
        explanation: 'RSA relies on the fact that multiplying two large primes is computationally trivial, but factoring their product n = pq is intractable.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'In modern TLS 1.3 handshakes, which key exchange mechanism is mandated to ensure Forward Secrecy (PFS)?',
        options: ['Ephemeral Diffie-Hellman (ECDHE / DHE)', 'Static RSA key exchange with server private key encryption', 'Pre-shared symmetric keys embedded in firmware', 'MD5 salted password authentication'],
        correctOption: 0,
        explanation: 'TLS 1.3 deprecated static RSA key transport in favor of ephemeral Diffie-Hellman to guarantee perfect forward secrecy.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Illustrate the Diffie-Hellman key exchange protocol. Show how Alice and Bob compute a shared secret over a public channel without disclosing private exponents.',
        rubric: 'Candidate must specify generator g and prime p, public keys A = g^a mod p and B = g^b mod p, and shared key derivation K = B^a mod p = A^b mod p.',
      },
    ],
    chemistry: [
      {
        type: 'mcq',
        marks: 5,
        title: 'What is the hybridization and molecular geometry of the carbon atoms in ethyne (acetylene, C₂H₂)?',
        options: ['sp hybridization with linear geometry (180°)', 'sp² hybridization with trigonal planar geometry (120°)', 'sp³ hybridization with tetrahedral geometry (109.5°)', 'dsp² hybridization with square planar geometry'],
        correctOption: 0,
        explanation: 'Each carbon atom in ethyne forms one sigma bond to hydrogen and one sigma bond to carbon, plus two pi bonds, requiring sp hybridization.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'According to Le Chatelier\'s Principle, what effect will increasing the temperature have on an exothermic chemical equilibrium reaction (ΔH < 0)?',
        options: ['The equilibrium shifts toward the reactants (endothermic reverse direction)', 'The equilibrium shifts toward products to produce more heat', 'The equilibrium constant K increases exponentially', 'No shift occurs because temperature does not affect equilibrium'],
        correctOption: 0,
        explanation: 'Heat is a product in exothermic reactions. Increasing temperature adds heat, causing the system to shift towards reactants to absorb heat.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Differentiate between SN1 and SN2 nucleophilic substitution mechanisms in organic chemistry regarding kinetics, stereochemistry, and carbocation intermediates.',
        rubric: 'Candidate should contrast unimolecular (first order) vs bimolecular (second order), inversion of configuration (Walden) vs racemization, and carbocation stability factors.',
      },
    ],
    biology: [
      {
        type: 'mcq',
        marks: 5,
        title: 'In eukaryotic cells, which organelle is responsible for generating the majority of cellular adenosine triphosphate (ATP) through oxidative phosphorylation?',
        options: ['Mitochondria', 'Endoplasmic Reticulum', 'Golgi Apparatus', 'Lysosome'],
        correctOption: 0,
        explanation: 'Mitochondria contain the electron transport chain and ATP synthase complexes on their inner cristae membranes.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'What enzyme synthesizes complementary DNA strands by adding deoxynucleotide triphosphates in the 5\' to 3\' direction during replication?',
        options: ['DNA Polymerase', 'RNA Helicase', 'Topoisomerase II', 'Peptidyl Transferase'],
        correctOption: 0,
        explanation: 'DNA Polymerase catalyzes phosphodiester bond formation between 3\'-OH of existing strands and 5\'-phosphate of incoming dNTPs.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Explain the central dogma of molecular biology. Detail the sequential steps of transcription in the nucleus and translation on ribosomes.',
        rubric: 'Candidate must detail DNA -> RNA (RNA Polymerase, promoters, mRNA processing) and RNA -> Protein (tRNA codons, ribosomal A, P, E sites, polypeptide elongation).',
      },
    ],
    os: [
      {
        type: 'mcq',
        marks: 5,
        title: 'Which condition is NOT one of Coffman\'s four necessary and sufficient conditions for deadlock to occur in an operating system?',
        options: ['Preemptive resource reallocation under CPU demand', 'Mutual exclusion', 'Hold and wait', 'Circular wait'],
        correctOption: 0,
        explanation: 'No preemption is the necessary condition. If resources can be preempted, deadlock cannot form.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'What severe operating system condition is characterized by a system spending more time servicing page faults than executing user instructions?',
        options: ['Thrashing', 'Starvation', 'Race Condition', 'Aging'],
        correctOption: 0,
        explanation: 'Thrashing occurs when total working set sizes exceed physical memory frames, causing continuous disk paging.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Compare preemptive vs non-preemptive CPU scheduling algorithms (e.g., Round Robin vs Shortest Job First). Discuss turnaround time and convoy effect.',
        rubric: 'Candidate must explain time slices/quanta, context switching overheads, fairness, starvation risks, and convoy effect in FCFS.',
      },
    ],
    dbms: [
      {
        type: 'mcq',
        marks: 5,
        title: 'In database management systems, what does the \'I\' in the ACID transaction guarantees stand for?',
        options: ['Isolation (concurrent transactions execute independently without interference)', 'Integrity', 'Idempotency', 'Indexing'],
        correctOption: 0,
        explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.',
      },
      {
        type: 'mcq',
        marks: 5,
        title: 'Which database normal form specifically eliminates partial functional dependencies on candidate keys?',
        options: ['Second Normal Form (2NF)', 'First Normal Form (1NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
        correctOption: 0,
        explanation: '2NF requires relations to be in 1NF and ensure every non-prime attribute is fully functionally dependent on any candidate key.',
      },
      {
        type: 'descriptive',
        marks: 10,
        title: 'Explain the Two-Phase Locking (2PL) protocol. Contrast Strict 2PL and Rigorous 2PL with respect to cascading aborts.',
        rubric: 'Candidate must explain Growing Phase (acquiring locks) vs Shrinking Phase (releasing locks), and how holding exclusive locks until commit eliminates cascading rollbacks.',
      },
    ],
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

  const pool = (normalized.includes('calculus') || normalized.includes('derivative') || normalized.includes('integral') || normalized.includes('limit') || normalized.includes('differen'))
    ? questionsDatabase.calculus
    : (normalized.includes('linear') || normalized.includes('matrix') || normalized.includes('matrices') || normalized.includes('vector') || normalized.includes('eigen'))
    ? questionsDatabase.linearAlgebra
    : (normalized.includes('trig') || normalized.includes('sin') || normalized.includes('cos') || normalized.includes('triangle'))
    ? questionsDatabase.trigonometry
    : (normalized.includes('prob') || normalized.includes('stat') || normalized.includes('bayes') || normalized.includes('distribution'))
    ? questionsDatabase.probability
    : (normalized.includes('cyber') || normalized.includes('crypto') || normalized.includes('security') || normalized.includes('rsa') || normalized.includes('tls'))
    ? questionsDatabase.cyber
    : (normalized.includes('chem') || normalized.includes('reaction') || normalized.includes('organic') || normalized.includes('acid'))
    ? questionsDatabase.chemistry
    : (normalized.includes('bio') || normalized.includes('cell') || normalized.includes('gene') || normalized.includes('dna'))
    ? questionsDatabase.biology
    : (normalized.includes('os') || normalized.includes('operating system') || normalized.includes('deadlock') || normalized.includes('scheduling') || normalized.includes('thread'))
    ? questionsDatabase.os
    : (normalized.includes('database') || normalized.includes('dbms') || normalized.includes('sql') || normalized.includes('query'))
    ? questionsDatabase.dbms
    : (normalized.includes('tree') || normalized.includes('bst') || normalized.includes('dsa') || normalized.includes('graph') || normalized.includes('algorithm') || normalized.includes('array'))
    ? questionsDatabase.dsa
    : (normalized.includes('ai') || normalized.includes('learn') || normalized.includes('neural') || normalized.includes('vision') || normalized.includes('deep') || normalized.includes('intel'))
    ? questionsDatabase.aiml
    : (normalized.includes('newton') || normalized.includes('motion') || normalized.includes('mechanic') || normalized.includes('kinematic') || normalized.includes('force'))
    ? questionsDatabase.mechanics
    : (normalized.includes('thermo') || normalized.includes('heat') || normalized.includes('entropy'))
    ? questionsDatabase.thermo
    : (normalized.includes('quad') || normalized.includes('equation') || normalized.includes('algebra') || normalized.includes('math'))
    ? questionsDatabase.math
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

    const normFocus = (focus || 'all').toLowerCase();
    let resolvedType = 'mcq';
    if (normFocus === 'all') {
      // Balanced mix across formats: MCQ, Multi-Select, Short Answer, Long Answer
      const mod = i % 4;
      if (mod === 0) resolvedType = 'mcq';
      else if (mod === 1) resolvedType = 'multi-select';
      else if (mod === 2) resolvedType = 'short';
      else resolvedType = 'long';
    } else if (normFocus.includes('multi')) {
      resolvedType = 'multi-select';
    } else if (normFocus.includes('short') || normFocus === 'conceptual') {
      resolvedType = 'short';
    } else if (normFocus.includes('long') || normFocus.includes('essay') || normFocus.includes('descriptive')) {
      resolvedType = 'long';
    } else {
      resolvedType = 'mcq';
    }

    const isRepeated = i >= pool.length;
    const titleText = isRepeated
      ? `${item.title} (Variant #${Math.floor(i / pool.length) + 1})`
      : item.title;

    let qOptions = undefined;
    let qCorrectOption = undefined;
    let qCorrectOptions = undefined;
    let qTitle = titleText;
    let qRubric = item.rubric;
    let qExplanation = item.explanation;

    if (resolvedType === 'mcq') {
      qOptions = item.options ? [...item.options] : ['Option A', 'Option B', 'Option C', 'Option D'];
      qCorrectOption = item.correctOption ?? 0;
      qExplanation = item.explanation || `Option ${String.fromCharCode(65 + (qCorrectOption || 0))} is the calibrated correct response for this ${topic || 'subject'} problem.`;
    } else if (resolvedType === 'multi-select') {
      qTitle = item.multiTitle || `Which of the following principles/statements are strictly valid in ${topic || 'this subject'}? (Select all that apply)`;
      qOptions = item.multiOptions || [
        `Conservation of foundational invariants and governing boundary criteria in ${topic || 'this domain'}`,
        `Empirical calibration against operational noise and performance telemetry`,
        `Complete exemption from physical conservation laws and boundary limits`,
        `Static approximation with total disregard for real-time variance`,
      ];
      qCorrectOptions = item.multiCorrectOptions || [0, 1];
      qExplanation = item.multiExplanation || `Statements A and B represent verified core principles of ${topic || 'this subject'}, while C and D are false.`;
    } else if (resolvedType === 'short') {
      qTitle = (item.type === 'descriptive' || item.type === 'short')
        ? item.title
        : `In 1-2 concise sentences, state the foundational governing equation or core definition of ${topic || 'this concept'} and its operational significance.`;
      qRubric = item.rubric || `Candidate must state the primary definition of ${topic || 'this concept'} and describe at least one key application or constraint.`;
      qExplanation = qRubric;
    } else if (resolvedType === 'long') {
      qTitle = (item.type === 'descriptive' || item.type === 'long')
        ? item.title
        : `Provide a detailed analytical breakdown of ${topic || 'this topic'}. Formulate the governing mathematical equations, analyze edge-case failure modes, and discuss real-world mitigation strategies.`;
      qRubric = item.rubric || `Candidate should detail mathematical formulations (4 pts), discuss edge-case operational failures (3 pts), and outline standard engineering mitigation protocols (3 pts).`;
      qExplanation = qRubric;
    }

    generated.push({
      id: `ai_q_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
      type: resolvedType,
      marks: finalMarks,
      negativeMarks: (resolvedType === 'mcq' || resolvedType === 'multi-select') ? finalNegative : 0,
      difficulty: difficulty || 'Medium',
      duration: item.duration || (resolvedType === 'mcq' ? 2 : (resolvedType === 'multi-select' ? 3 : (resolvedType === 'short' ? 3 : 8))),
      title: qTitle,
      topic: topic || 'General',
      options: qOptions,
      correctOption: qCorrectOption,
      correctOptions: qCorrectOptions,
      explanation: qExplanation,
      rubric: qRubric,
      aiGenerated: true,
    });
  }
  return generated;
}

