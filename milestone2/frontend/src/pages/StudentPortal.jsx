
import React, { useState, useEffect } from 'react';
import StudentSidebar from '../components/student/StudentSidebar';
import StudentHeader from '../components/student/StudentHeader';
import StudentPracticeView from '../components/student/StudentPracticeView';
import StudentDashboardView from '../components/student/StudentDashboardView';
import StudentTestsView from '../components/student/StudentTestsView';
import StudentResultsView from '../components/student/StudentResultsView';
import { getActiveSession, getStoredUsers } from '../utils/mockApi';
import '../styles/student.css';

/**
 * Main Student Portal & AI Practice Studio
 * Complete student learning and examination workspace:
 * - OVERVIEW: Dashboard
 * - LEARNING: My Tests, Practice (AI generator), Results
 */
export default function StudentPortal({ initialView = 'practice' }) {
  const [currentTab, setCurrentTab] = useState(initialView);
  const [theme, setTheme] = useState('light');
  const [toastMessage, setToastMessage] = useState(null);

  // Sync initialView when route changes
  useEffect(() => {
    if (initialView) {
      setCurrentTab(initialView);
    }
  }, [initialView]);

  // Active student user resolution
  const session = getActiveSession();
  const allUsers = getStoredUsers();

  const candidateUser = React.useMemo(() => {
    if (session) {
      const matched = allUsers.find(
        (u) =>
          (session.id && u.id === session.id) ||
          (session.email && u.email?.toLowerCase() === session.email?.toLowerCase())
      );
      if (matched) {
        return {
          ...matched,
          ...session,
          fullName: session.fullName || matched.name,
        };
      }
      return {
        id: session.id || `usr_${(session.email || '').replace(/[^a-zA-Z0-9]/g, '') || Date.now()}`,
        name: session.fullName || session.name || session.email || 'Candidate',
        fullName: session.fullName || session.name || session.email || 'Candidate',
        email: session.email || '',
        identifier: session.identifier || 'STU-NEW',
        department: session.department || 'Computer Science',
        college: session.college || 'Institutional Student',
        role: 'student',
        status: session.status || 'approved',
      };
    }
    return {
      id: 'usr_002',
      name: 'test student',
      fullName: 'test student',
      email: 'teststudent@gmail.com',
      identifier: '24HG-8812',
      department: 'Mathematics',
      college: 'Metro State University',
      role: 'student',
      status: 'approved',
    };
  }, [session, allUsers]);

  const activeHeaderUser = React.useMemo(() => {
    const rawName = candidateUser.fullName || candidateUser.name || 'Student';
    const parts = rawName.trim().split(/\s+/);
    let inits = 'ST';
    if (parts.length >= 2) {
      inits = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    } else if (parts[0]) {
      inits = parts[0].slice(0, 2).toUpperCase();
    }

    return {
      name: rawName,
      email: candidateUser.email || 'teststudent@gmail.com',
      roleTitle: 'Student',
      initials: inits,
    };
  }, [candidateUser]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="student-layout" data-student-theme={theme}>
      {/* Left Navigation Sidebar */}
      <StudentSidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Learning & Examination Workspace */}
      <div className="student-main">
        {/* Top Header */}
        <StudentHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          activeUser={activeHeaderUser}
          currentTab={currentTab}
        />

        {/* Dynamic Toast Feedback */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '75px',
              right: '24px',
              backgroundColor: '#4338CA',
              color: '#FFFFFF',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.84375rem',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'spModalSlideUp 180ms ease',
            }}
          >
            <span>✓</span> {toastMessage}
          </div>
        )}

        {/* Body View Container */}
        <div className="student-content-container">
          {currentTab === 'practice' && (
            <StudentPracticeView
              candidateUser={candidateUser}
              onShowToast={showToast}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'dashboard' && (
            <StudentDashboardView
              candidateUser={candidateUser}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'tests' && (
            <StudentTestsView
              candidateUser={candidateUser}
              onShowToast={showToast}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'results' && (
            <StudentResultsView
              candidateUser={candidateUser}
              onNavigateTab={setCurrentTab}
            />
          )}
        </div>
      </div>
    </div>
  );
}
