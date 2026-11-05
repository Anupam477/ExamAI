import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { validateField, validateForm } from '../utils/validators';
import { mockLoginApi, findUserByEmail } from '../utils/mockApi';

/**
 * Reusable Login Page driven by role prop / url param
 * Supported roles: 'student' | 'teacher' | 'admin'
 * Features Live Admin Approval Flow for Students
 */
export default function Login({ roleOverride }) {
  const params = useParams();
  const navigate = useNavigate();

  // Role can come from prop or url parameter
  const role = roleOverride || params.role || 'student';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Admission state for students: null | { status: 'pending' | 'approved' | 'rejected', user, reason }
  const [admissionState, setAdmissionState] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Define form field configuration
  const fields = [
    {
      id: `${role}-login-email`,
      name: 'email',
      label: 'Institutional email address',
      type: 'email',
      placeholder: role === 'admin' ? 'admin@examai.edu' : role === 'teacher' ? 'teacher@gmail.com' : 'dummystudent@gmail.com',
      autoComplete: 'username',
    },
    {
      id: `${role}-login-password`,
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: '••••••••',
      autoComplete: 'current-password',
    },
  ];

  // Live listener for student admission approval while in 'pending' state
  useEffect(() => {
    if (!admissionState || admissionState.status !== 'pending') return;

    const checkLiveDecision = () => {
      const email = admissionState.user?.email;
      if (!email) return;

      const latestUser = findUserByEmail(email);
      if (latestUser) {
        if (latestUser.status === 'approved') {
          setAdmissionState({
            status: 'approved',
            user: latestUser,
            reason: null,
          });

          // Create active session
          const userRole = latestUser.role || role || 'student';
          const sessionUser = {
            id: latestUser.id,
            email: latestUser.email,
            name: latestUser.name,
            fullName: latestUser.name,
            role: userRole,
            college: latestUser.college || 'Apex Institute of Technology',
            identifier: latestUser.identifier,
            department: latestUser.department,
            subDetails: latestUser.subDetails,
            roleTitle: latestUser.roleTitle || latestUser.subDetails || (userRole === 'teacher' ? 'Course Faculty' : 'Student Candidate'),
            status: 'approved',
            token: `jwt-examai-${userRole}-${latestUser.id}-${Date.now()}`,
            authenticatedAt: new Date().toISOString(),
          };
          sessionStorage.setItem('examai_auth_user', JSON.stringify(sessionUser));
          localStorage.setItem('examai_auth_user', JSON.stringify(sessionUser));

          // Auto-redirect to designated workspace
          setTimeout(() => {
            navigate(`/dashboard/${userRole}`);
          }, 1500);
        } else if (latestUser.status === 'rejected') {
          setAdmissionState({
            status: 'rejected',
            user: latestUser,
            reason: latestUser.rejectionReason || 'Access denied by administrator.',
          });
        }
      }
    };

    // Poll every 1 second
    const interval = setInterval(checkLiveDecision, 1000);

    // Listen to storage events across tabs
    const handleStorage = (e) => {
      if (e.key === 'examai_admin_users' || e.key === 'examai_admission_decision') {
        checkLiveDecision();
      }
    };

    const handleCustomDecision = () => {
      checkLiveDecision();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('examai_decision_updated', handleCustomDecision);
    window.addEventListener('examai_users_updated', handleCustomDecision);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('examai_decision_updated', handleCustomDecision);
      window.removeEventListener('examai_users_updated', handleCustomDecision);
    };
  }, [admissionState, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value, formData);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleManualStatusCheck = () => {
    setCheckingStatus(true);
    setTimeout(() => {
      setCheckingStatus(false);
      if (admissionState?.user?.email) {
        const latestUser = findUserByEmail(admissionState.user.email);
        if (latestUser?.status === 'approved') {
          setAdmissionState({
            status: 'approved',
            user: latestUser,
            reason: null,
          });
          const userRole = latestUser.role || role || 'student';
          const sessionUser = {
            id: latestUser.id,
            email: latestUser.email,
            name: latestUser.name,
            fullName: latestUser.name,
            role: userRole,
            college: latestUser.college || 'Apex Institute of Technology',
            identifier: latestUser.identifier,
            department: latestUser.department,
            subDetails: latestUser.subDetails,
            roleTitle: latestUser.roleTitle || latestUser.subDetails || (userRole === 'teacher' ? 'Course Faculty' : 'Student Candidate'),
            status: 'approved',
            token: `jwt-examai-${userRole}-${latestUser.id}-${Date.now()}`,
            authenticatedAt: new Date().toISOString(),
          };
          sessionStorage.setItem('examai_auth_user', JSON.stringify(sessionUser));
          localStorage.setItem('examai_auth_user', JSON.stringify(sessionUser));
          setTimeout(() => navigate(`/dashboard/${userRole}`), 600);
        } else if (latestUser?.status === 'rejected') {
          setAdmissionState({
            status: 'rejected',
            user: latestUser,
            reason: latestUser.rejectionReason || 'Access denied by administrator.',
          });
        }
      }
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validate all fields
    const formErrors = validateForm(fields, formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setLoading(true);
    try {
      const response = await mockLoginApi(role, formData);

      if (response.status === 'pending') {
        setAdmissionState({
          status: 'pending',
          user: response.user,
          reason: null,
        });
        setLoading(false);
        return;
      }

      if (response.status === 'rejected') {
        setAdmissionState({
          status: 'rejected',
          user: response.user,
          reason: response.reason || 'Institutional verification failed.',
        });
        setLoading(false);
        return;
      }

      setSuccessMessage(response.message);
      setTimeout(() => {
        navigate(`/dashboard/${role}`);
      }, 500);
    } catch (err) {
      setApiError(err.message || 'Authentication failed. Please verify your credentials.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    } finally {
      setLoading(false);
    }
  };

  const roleTitles = {
    student: 'Welcome back',
    teacher: 'Welcome back',
    admin: 'Administrator sign in',
  };

  const roleSubtitles = {
    student: 'Sign in to access your scheduled examinations and performance feedback.',
    teacher: 'Access your exam creator studio, grading dashboard, and proctoring logs.',
    admin: 'Enter your institutional administrative credentials to manage portal security.',
  };

  const signupLink = role !== 'admin' ? (
    <span>
      Don't have an account?{' '}
      <Link
        to={`/signup/${role}`}
        style={{
          fontWeight: 600,
          color: role === 'teacher' ? '#0E6B58' : '#2D5BD0',
        }}
      >
        Create account
      </Link>
    </span>
  ) : null;

  // RENDER: Admission Waiting / Approval / Rejection Screen for Students
  if (admissionState) {
    const isPending = admissionState.status === 'pending';
    const isApproved = admissionState.status === 'approved';
    const isRejected = admissionState.status === 'rejected';

    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0B1B33',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(45, 91, 208, 0.15) 0%, transparent 60%)',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            border: '1px solid #E1E6EE',
          }}
        >
          {/* Top Decorative Header */}
          <div
            style={{
              padding: '1.75rem 2rem 1.25rem',
              borderBottom: '1px solid #E1E6EE',
              backgroundColor: '#F7F9FC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: '#0B1B33',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#0B1B33' }}>
                ExamAI
              </span>
            </div>
            <Badge variant={isApproved ? 'success' : isRejected ? 'danger' : (role === 'teacher' ? 'teacher' : 'student')}>
              {isApproved ? 'Access Authorized' : isRejected ? 'Entry Denied' : (role === 'teacher' ? 'Faculty Verification Queue' : 'Proctor Review Queue')}
            </Badge>
          </div>

          {/* Body Content */}
          <div style={{ padding: '2.5rem 2rem' }}>
            {/* Pulsing Visual / Icon Indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {isPending && (
                <div
                  style={{
                    position: 'relative',
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    backgroundColor: '#E6EDFB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #BFD0F3',
                    boxShadow: '0 0 0 8px rgba(45, 91, 208, 0.08)',
                  }}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2D5BD0" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: '#2D5BD0',
                      border: '2px solid #FFFFFF',
                    }}
                  />
                </div>
              )}

              {isApproved && (
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    backgroundColor: '#E3F1EC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #B7DACD',
                    boxShadow: '0 0 0 8px rgba(47, 125, 91, 0.1)',
                  }}
                >
                  <svg width="38" height="38" viewBox="0 0 20 20" fill="#2F7D5B">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {isRejected && (
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    backgroundColor: '#FDF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #F8D7DA',
                    boxShadow: '0 0 0 8px rgba(184, 67, 63, 0.1)',
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#B8433F" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
              )}
            </div>

            {/* Status Titles */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.65rem',
                  color: '#0B1B33',
                  marginBottom: '0.5rem',
                }}
              >
                {isApproved
                  ? (role === 'teacher' ? 'Faculty Account Approved by Admin!' : 'Admission Approved by Admin!')
                  : isRejected
                  ? (role === 'teacher' ? 'Faculty Access Denied' : 'Examination Access Denied')
                  : (role === 'teacher' ? 'Faculty Account Review in Progress' : 'Test Admission Review in Progress')}
              </h2>
              <p style={{ fontSize: '0.925rem', color: '#5F6B7D', lineHeight: 1.55, margin: 0 }}>
                {isApproved
                  ? (role === 'teacher' ? 'Your faculty credentials have been verified by the administrator. Entering educator portal...' : 'Your identity has been verified by the administrator. Entering examination room...')
                  : isRejected
                  ? (role === 'teacher' ? 'The institutional administrator has declined educator registration.' : 'The institutional administrator has declined entry for this session.')
                  : (role === 'teacher' ? 'Your faculty registration has been recorded. An approval request was dispatched to the administrator console.' : 'Your login has been recorded. An admission request was dispatched to the administrator console for approval.')}
              </p>
            </div>

            {/* Candidate & Session Details Card */}
            <div
              style={{
                backgroundColor: '#F7F9FC',
                borderRadius: '10px',
                border: '1px solid #E1E6EE',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#5F6B7D', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {role === 'teacher' ? 'Faculty Name' : 'Candidate Name'}
                </span>
                <strong style={{ fontSize: '0.9375rem', color: '#0B1B33' }}>
                  {admissionState.user?.name || (role === 'teacher' ? 'Educator' : 'Enrolled Student')}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#5F6B7D', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {role === 'teacher' ? 'Faculty ID' : 'Roll / Identifier'}
                </span>
                <span style={{ fontSize: '0.9375rem', color: role === 'teacher' ? '#0E6B58' : '#2D5BD0', fontWeight: 600 }}>
                  {admissionState.user?.identifier || (role === 'teacher' ? 'FAC-2026' : '36FFHFHGF')}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#5F6B7D', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {role === 'teacher' ? 'Faculty Email' : 'Registered Email'}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#14233C' }}>
                  {admissionState.user?.email}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#5F6B7D', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {role === 'teacher' ? 'Assigned Department' : 'Exam Room'}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#14233C', fontWeight: 600 }}>
                  {role === 'teacher' ? (admissionState.user?.department || 'Academic Department') : 'AI-Milestone Exam 2026'}
                </span>
              </div>
            </div>

            {/* Real-time Indicator or Reason */}
            {isPending && (
              <div
                style={{
                  backgroundColor: '#E6EDFB',
                  border: '1px solid #BFD0F3',
                  borderRadius: '8px',
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '1.75rem',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#2D5BD0',
                    boxShadow: '0 0 0 4px rgba(45, 91, 208, 0.25)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: '0.84375rem', color: '#18335C', lineHeight: 1.45 }}>
                  <strong>Live connection active.</strong> Keep this tab open. When the administrator clicks <em>Accept</em> in their console, your exam will launch automatically.
                </div>
              </div>
            )}

            {isRejected && (
              <div
                style={{
                  backgroundColor: '#FDF2F2',
                  border: '1px solid #F8D7DA',
                  borderRadius: '8px',
                  padding: '1rem 1.1rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B8433F', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Administrative Rejection Reason:</span>
                </div>
                <p style={{ fontSize: '0.84375rem', color: '#7D2220', margin: 0, lineHeight: 1.45 }}>
                  {admissionState.reason}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isPending && (
                <Button
                  variant="student"
                  fullWidth
                  loading={checkingStatus}
                  loadingText="Checking with administrator..."
                  onClick={handleManualStatusCheck}
                >
                  Check Live Status
                </Button>
              )}

              {isApproved && (
                <Button
                  variant={role === 'teacher' ? 'teacher' : 'success'}
                  fullWidth
                  onClick={() => navigate(`/dashboard/${admissionState.user?.role || role || 'student'}`)}
                >
                  {role === 'teacher' ? 'Open Educator Studio →' : 'Join Exam Now →'}
                </Button>
              )}

              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setAdmissionState(null);
                  setApiError('');
                }}
              >
                Back to Sign in
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD LOGIN VIEW
  return (
    <AuthLayout
      role={role}
      title={roleTitles[role] || 'Welcome back'}
      subtitle={roleSubtitles[role] || 'Sign in to your account'}
      footerLink={signupLink}
    >
      {/* Top API error banner */}
      {apiError && (
        <div
          role="alert"
          style={{
            backgroundColor: '#FDF2F2',
            border: '1px solid #F8D7DA',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            color: '#B8433F',
            fontSize: '0.84375rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      {/* Success banner */}
      {successMessage && (
        <div
          role="status"
          className="tick-animation"
          style={{
            backgroundColor: '#E3F1EC',
            border: '1px solid #B7DACD',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            color: '#0E6B58',
            fontSize: '0.84375rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="#0E6B58">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>{successMessage} Redirecting...</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className={isShaking ? 'shake' : ''}
      >
        <Input
          id={fields[0].id}
          name={fields[0].name}
          label={fields[0].label}
          type={fields[0].type}
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          placeholder={fields[0].placeholder}
          autoComplete={fields[0].autoComplete}
          roleAccent={role}
        />

        <PasswordInput
          id={fields[1].id}
          name={fields[1].name}
          label={fields[1].label}
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          placeholder={fields[1].placeholder}
          autoComplete={fields[1].autoComplete}
          roleAccent={role}
        />

        <div style={{ marginTop: '1.5rem' }}>
          <Button
            type="submit"
            variant={role}
            fullWidth
            loading={loading}
            loadingText="Logging in..."
          >
            Log in
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
