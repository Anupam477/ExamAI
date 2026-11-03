import React, { useState, useEffect } from 'react';
import TeacherSidebar from '../components/teacher/TeacherSidebar';
import TeacherHeader from '../components/teacher/TeacherHeader';
import StepDetailsAndRules from '../components/teacher/StepDetailsAndRules';
import StepQuestions from '../components/teacher/StepQuestions';
import StepAssignStudents from '../components/teacher/StepAssignStudents';
import StepPublish from '../components/teacher/StepPublish';
import TeacherTestsList from '../components/teacher/TeacherTestsList';
import TeacherDashboardView from '../components/teacher/TeacherDashboardView';
import TeacherStudentsView from '../components/teacher/TeacherStudentsView';
import {
  INITIAL_TEACHER_TESTS,
  saveOrUpdateTeacherTest,
  getActiveSession,
} from '../utils/mockApi';
import '../styles/teacher.css';

/**
 * Main Teacher Portal & Assessment Creator Studio
 * Replicates the educator dashboard and test authoring wizard.
 */
export default function TeacherPortal({ initialView = 'create-test' }) {
  const [currentTab, setCurrentTab] = useState(initialView);
  const [currentStep, setCurrentStep] = useState(1);
  const [theme, setTheme] = useState('light');
  const [toastMessage, setToastMessage] = useState(null);

  // Active educator session
  const session = getActiveSession();
  const teacherName = session?.fullName || session?.name || 'Course Faculty';
  const teacherRole = session?.roleTitle || session?.subDetails || session?.department || 'Course Faculty';
  const teacherInitials = (teacherName || 'CF')
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'CF';

  const activeUser = {
    name: teacherName,
    roleTitle: teacherRole,
    initials: teacherInitials,
  };

  // Clean blank test blueprint helper
  const createBlankTest = () => ({
    id: `test_${Date.now()}`,
    title: '',
    subject: '',
    topic: '',
    description: '',
    instructions: '',
    instructor: teacherName,
    instructorRole: teacherRole,
    instructorEmail: session?.email || '',
    difficulty: 'Medium',
    duration: 30,
    maxTabSwitches: 3,
    proctoring: {
      webcam: true,
      negativeMarking: false,
      shuffleQuestions: true,
      shuffleOptions: true,
    },
    questions: [],
    assignedStudents: [],
    code: `EXAM-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'draft',
  });

  // Form State initialized to empty blank fields for new assessment
  const [formData, setFormData] = useState(createBlankTest);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDraft = (data) => {
    saveOrUpdateTeacherTest({
      ...data,
      instructor: data.instructor || teacherName,
      instructorRole: data.instructorRole || teacherRole,
      status: 'draft',
    });
    showToast('Assessment blueprint saved as Draft.');
  };

  const handlePublish = (data) => {
    saveOrUpdateTeacherTest({
      ...data,
      instructor: data.instructor || teacherName,
      instructorRole: data.instructorRole || teacherRole,
      status: 'published',
    });
    showToast('Assessment published successfully!');
  };

  const handleCreateNewTest = () => {
    setFormData(createBlankTest());
    setCurrentStep(1);
    setCurrentTab('create-test');
  };

  const handleEditTest = (test, step = 1) => {
    setFormData(test);
    setCurrentStep(step);
    setCurrentTab('create-test');
  };

  const handleDirectPublish = (test) => {
    const updatedTest = {
      ...test,
      instructor: test.instructor || teacherName,
      instructorRole: test.instructorRole || teacherRole,
      status: 'published',
    };
    saveOrUpdateTeacherTest(updatedTest);
    setFormData(updatedTest);
    showToast(`✓ Test "${test.title || 'Assessment'}" is now PUBLISHED and live for students! (Code: ${test.code})`);
    setCurrentTab('tests');
  };

  return (
    <div className="teacher-layout" data-teacher-theme={theme}>
      {/* Left Sidebar */}
      <TeacherSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'create-test') {
            handleCreateNewTest();
          } else {
            setCurrentTab(tab);
          }
        }}
      />

      {/* Main Body */}
      <div className="teacher-main">
        {/* Top Header */}
        <TeacherHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          activeUser={activeUser}
        />

        {/* Dynamic Toast Feedback */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '75px',
              right: '24px',
              backgroundColor: '#1E6B52',
              color: '#FFFFFF',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.84375rem',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>✓</span> {toastMessage}
          </div>
        )}

        {/* Wizard or Subview Container */}
        <div className="teacher-wizard-container">
          {currentTab === 'create-test' && (
            <>
              {/* Wizard Subtitle Guide matching screenshot */}
              <div className="teacher-step-guide">
                {currentStep === 1 && "Start with the basics. You'll add questions and students next."}
                {currentStep === 2 && 'Author test questions manually or generate peer-reviewed questions with Gemini AI.'}
                {currentStep === 3 && 'Select eligible candidates or institutional cohorts admitted to take this test.'}
                {currentStep === 4 && 'Final review of proctoring policies, duration limits, and test distribution code.'}
              </div>

              {/* 4-Step Stepper Bar matching screenshot */}
              <div className="teacher-stepper-bar">
                <div
                  className={`teacher-step-pill ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(1)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="teacher-step-num">1</span>
                  <span>Details &amp; rules</span>
                </div>

                <div
                  className={`teacher-step-pill ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(2)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="teacher-step-num">2</span>
                  <span>Questions</span>
                </div>

                <div
                  className={`teacher-step-pill ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(3)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="teacher-step-num">3</span>
                  <span>Assign students</span>
                </div>

                <div
                  className={`teacher-step-pill ${currentStep === 4 ? 'active' : ''}`}
                  onClick={() => setCurrentStep(4)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="teacher-step-num">4</span>
                  <span>Publish</span>
                </div>
              </div>

              {/* Active Wizard Step Content */}
              {currentStep === 1 && (
                <StepDetailsAndRules
                  formData={formData}
                  onChange={setFormData}
                  onNext={() => {
                    handleSaveDraft(formData);
                    setCurrentStep(2);
                  }}
                />
              )}

              {currentStep === 2 && (
                <StepQuestions
                  formData={formData}
                  onChange={setFormData}
                  onNext={() => {
                    handleSaveDraft(formData);
                    setCurrentStep(3);
                  }}
                  onBack={() => setCurrentStep(1)}
                  onDirectPublish={handleDirectPublish}
                />
              )}

              {currentStep === 3 && (
                <StepAssignStudents
                  formData={formData}
                  onChange={setFormData}
                  onNext={() => {
                    handlePublish({ ...formData, status: 'published' });
                    setCurrentStep(4);
                  }}
                  onBack={() => setCurrentStep(2)}
                  onDirectPublish={handleDirectPublish}
                />
              )}

              {currentStep === 4 && (
                <StepPublish
                  formData={formData}
                  onSaveDraft={handleSaveDraft}
                  onPublish={handlePublish}
                  onBack={() => setCurrentStep(3)}
                  onViewTests={() => setCurrentTab('tests')}
                />
              )}
            </>
          )}

          {currentTab === 'tests' && (
            <TeacherTestsList
              onCreateNew={handleCreateNewTest}
              onEditTest={handleEditTest}
              onDirectPublish={handleDirectPublish}
            />
          )}

          {currentTab === 'dashboard' && (
            <TeacherDashboardView
              onNavigateToCreate={handleCreateNewTest}
              onNavigateToTests={() => setCurrentTab('tests')}
            />
          )}

          {currentTab === 'students' && (
            <TeacherStudentsView />
          )}
        </div>
      </div>
    </div>
  );
}
