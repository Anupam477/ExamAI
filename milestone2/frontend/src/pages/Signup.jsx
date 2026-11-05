import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import Button from '../components/Button';
import { validateField, validateForm } from '../utils/validators';
import { mockSignupApi } from '../utils/mockApi';

/**
 * Reusable Signup Page driven by role prop / url param
 * Supported roles: 'student' | 'teacher'
 * Note: Admin has NO signup page.
 */
export default function Signup({ roleOverride }) {
  const params = useParams();
  const role = roleOverride || params.role || 'student';

  const isStudent = role === 'student';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institute: '',
    rollNumber: '',
    classYear: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Class / Year Dropdown state
  const [classYearSelect, setClassYearSelect] = useState('');
  const [customClassYear, setCustomClassYear] = useState('');

  // Safeguard: Admin has NO signup page
  if (role === 'admin') {
    return <Navigate to="/login/admin" replace />;
  }

  // Define active fields for validation
  const activeFields = isStudent
    ? [
        { name: 'firstName', label: 'First name' },
        { name: 'lastName', label: 'Last name' },
        { name: 'email', label: 'Institutional email' },
        { name: 'institute', label: 'Institute name' },
        { name: 'rollNumber', label: 'Roll number' },
        { name: 'classYear', label: 'Class / Year' },
        { name: 'password', label: 'Password' },
        { name: 'confirmPassword', label: 'Confirm password' },
      ]
    : [
        { name: 'firstName', label: 'First name' },
        { name: 'lastName', label: 'Last name' },
        { name: 'email', label: 'Institutional email' },
        { name: 'department', label: 'Department' },
        { name: 'password', label: 'Password' },
        { name: 'confirmPassword', label: 'Confirm password' },
      ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time clearance of error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // Also re-validate confirm password if password changes
    if (name === 'password' && errors.confirmPassword && formData.confirmPassword) {
      if (value === formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
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

  const handleClassYearSelectChange = (e) => {
    const val = e.target.value;
    setClassYearSelect(val);
    if (val === 'Other') {
      setFormData((prev) => ({ ...prev, classYear: customClassYear.trim() }));
      if (!customClassYear.trim()) {
        setErrors((prev) => ({ ...prev, classYear: 'Please enter your class or academic year.' }));
      } else {
        setErrors((prev) => ({ ...prev, classYear: '' }));
      }
    } else {
      setFormData((prev) => ({ ...prev, classYear: val }));
      if (errors.classYear) {
        setErrors((prev) => ({ ...prev, classYear: '' }));
      }
    }
  };

  const handleCustomClassYearChange = (e) => {
    const val = e.target.value;
    setCustomClassYear(val);
    setFormData((prev) => ({ ...prev, classYear: val.trim() }));
    if (errors.classYear && val.trim()) {
      setErrors((prev) => ({ ...prev, classYear: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const formErrors = validateForm(activeFields, formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setLoading(true);
    try {
      const response = await mockSignupApi(role, formData);
      setSuccessMessage(response.message);
      setIsSuccess(true);
    } catch (err) {
      setApiError(err.message || 'Account registration failed. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    } finally {
      setLoading(false);
    }
  };

  const loginLink = (
    <span>
      Already have an account?{' '}
      <Link
        to={`/login/${role}`}
        style={{
          fontWeight: 600,
          color: role === 'teacher' ? '#0E6B58' : '#2D5BD0',
        }}
      >
        Log in
      </Link>
    </span>
  );

  return (
    <AuthLayout
      role={role}
      title="Create your account"
      subtitle={
        isStudent
          ? 'Register with your institutional credentials to begin taking verified examinations.'
          : 'Register your educator account to author exam papers and manage student evaluations.'
      }
      footerLink={!isSuccess ? loginLink : null}
    >
      {/* Top API Error */}
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

      {/* Success State */}
      {isSuccess ? (
        <div
          className="tick-animation"
          style={{
            textAlign: 'center',
            padding: '1.5rem 0',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#E3F1EC',
              border: '2px solid #B7DACD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 20 20" fill="#0E6B58">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h3
            style={{
              fontSize: '1.35rem',
              fontFamily: 'var(--font-heading)',
              color: '#0B1B33',
              marginBottom: '0.6rem',
            }}
          >
            Registration submitted for review
          </h3>

          <p
            style={{
              fontSize: '0.9375rem',
              color: '#5F6B7D',
              lineHeight: 1.5,
              marginBottom: '1.25rem',
            }}
          >
            {successMessage || 'Account created successfully. Pending administrator approval.'}
          </p>

          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              color: '#1E40AF',
              fontSize: '0.8125rem',
              textAlign: 'left',
              lineHeight: 1.45,
              marginBottom: '1.75rem',
            }}
          >
            <strong>Institutional Verification Queue:</strong> Your credentials have been submitted to the administrator console. Proceed to log in to monitor your live admission status.
          </div>

          <Link to={`/login/${role}`} style={{ textDecoration: 'none' }}>
            <Button variant={role} fullWidth>
              Continue to log in &rarr;
            </Button>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className={isShaking ? 'shake' : ''}
        >
          {/* First name & Last name side by side */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <Input
              id={`${role}-firstName`}
              name="firstName"
              label="First name"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.firstName}
              placeholder="e.g. Eleanor"
              autoComplete="given-name"
              roleAccent={role}
            />
            <Input
              id={`${role}-lastName`}
              name="lastName"
              label="Last name"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.lastName}
              placeholder="e.g. Vance"
              autoComplete="family-name"
              roleAccent={role}
            />
          </div>

          {/* Institutional Email */}
          <Input
            id={`${role}-email`}
            name="email"
            label="Institutional email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            placeholder={isStudent ? 'student.id@university.edu' : 'prof.name@university.edu'}
            autoComplete="email"
            roleAccent={role}
          />

          {/* Student specific fields: institute, roll number, class/year */}
          {isStudent && (
            <>
              <Input
                id="student-institute"
                name="institute"
                label="Institute / University"
                value={formData.institute}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.institute}
                placeholder="e.g. National Institute of Technology"
                autoComplete="organization"
                roleAccent={role}
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                }}
              >
                <Input
                  id="student-rollNumber"
                  name="rollNumber"
                  label="Roll number"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.rollNumber}
                  placeholder="e.g. 2026-CS-401"
                  roleAccent={role}
                />
                <div className="input-group" style={{ marginBottom: '1.25rem', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label
                      htmlFor="student-classYear-select"
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#14233C',
                        display: 'inline-block',
                      }}
                    >
                      Class / Year
                      <span style={{ color: '#B8433F', marginLeft: '3px', fontWeight: 600 }} aria-hidden="true">
                        *
                      </span>
                    </label>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <select
                      id="student-classYear-select"
                      name="classYearSelect"
                      value={classYearSelect}
                      onChange={handleClassYearSelectChange}
                      onBlur={() => {
                        if (!formData.classYear) {
                          setErrors((prev) => ({ ...prev, classYear: 'Class / Year is required. Please select an option.' }));
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 2.25rem 0 0.875rem',
                        fontSize: '0.9375rem',
                        fontFamily: 'var(--font-body)',
                        color: classYearSelect ? '#14233C' : '#94A3B8',
                        backgroundColor: '#FFFFFF',
                        border: `1px solid ${errors.classYear ? '#B8433F' : '#E1E6EE'}`,
                        borderRadius: '6px',
                        outline: 'none',
                        cursor: 'pointer',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                        boxShadow: errors.classYear ? '0 0 0 2px rgba(184, 67, 63, 0.12)' : 'none',
                      }}
                      onFocus={(e) => {
                        if (!errors.classYear) {
                          e.currentTarget.style.borderColor = '#2D5BD0';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45, 91, 208, 0.22)';
                        }
                      }}
                      onBlurCapture={(e) => {
                        if (!errors.classYear) {
                          e.currentTarget.style.borderColor = '#E1E6EE';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <option value="" disabled>Select Class / Year</option>
                      <option value="1 Year">1 Year (1st Year)</option>
                      <option value="2 Year">2 Year (2nd Year)</option>
                      <option value="3 Year">3 Year (3rd Year)</option>
                      <option value="4 Year">4 Year (4th Year)</option>
                      <option value="Other">Other Class</option>
                    </select>

                    {/* Chevron Dropdown Arrow */}
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {/* Other Class Custom Input */}
                  {classYearSelect === 'Other' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        id="student-customClassYear"
                        placeholder="Enter your Class (e.g. 10th, 12th, M.Tech, Diploma)"
                        value={customClassYear}
                        onChange={handleCustomClassYearChange}
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 0.875rem',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-body)',
                          color: '#14233C',
                          backgroundColor: '#F8FAFC',
                          border: `1px solid ${errors.classYear ? '#B8433F' : '#CBD5E1'}`,
                          borderRadius: '6px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#2D5BD0';
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(45, 91, 208, 0.2)';
                        }}
                        onBlurCapture={(e) => {
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        autoFocus
                      />
                    </div>
                  )}

                  {errors.classYear && (
                    <p
                      role="alert"
                      style={{
                        color: '#B8433F',
                        fontSize: '0.8125rem',
                        marginTop: '0.35rem',
                        lineHeight: 1.4,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '5px',
                      }}
                    >
                      <svg
                        style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px' }}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors.classYear}</span>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Teacher specific fields: department */}
          {!isStudent && (
            <Input
              id="teacher-department"
              name="department"
              label="Academic department"
              value={formData.department}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.department}
              placeholder="e.g. Department of Computer Science & AI"
              autoComplete="organization-title"
              roleAccent={role}
            />
          )}

          {/* Password with live strength indicator */}
          <PasswordInput
            id={`${role}-password`}
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            roleAccent={role}
          />

          {/* Live password strength bar & criteria */}
          <PasswordStrength password={formData.password} />

          {/* Confirm Password */}
          <PasswordInput
            id={`${role}-confirmPassword`}
            name="confirmPassword"
            label="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.confirmPassword}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            roleAccent={role}
          />

          <div style={{ marginTop: '1.5rem' }}>
            <Button
              type="submit"
              variant={role}
              fullWidth
              loading={loading}
              loadingText="Creating account..."
            >
              Create account
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
