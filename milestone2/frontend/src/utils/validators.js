/**
 * Form validation utilities for ExamAI authentication
 * Strict, clear error messages explaining what is wrong and how to fix it.
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const HAS_UPPERCASE = /[A-Z]/;
export const HAS_LOWERCASE = /[a-z]/;
export const HAS_NUMBER = /[0-9]/;
export const HAS_SPECIAL = /[^A-Za-z0-9]/;

/**
 * Validates a single field
 * @param {string} name - Field name
 * @param {string} value - Field value
 * @param {object} allValues - Full form values (for cross-validation like confirmPassword)
 * @returns {string} - Error message, or empty string if valid
 */
export function validateField(name, value, allValues = {}) {
  const trimmed = typeof value === 'string' ? value.trim() : '';

  // Required check
  if (!trimmed) {
    const fieldLabels = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email address',
      institute: 'Institute name',
      rollNumber: 'Roll number',
      classYear: 'Class or academic year',
      department: 'Department',
      password: 'Password',
      confirmPassword: 'Confirm password',
    };
    const label = fieldLabels[name] || 'This field';
    return `${label} is required. Please fill in this field to continue.`;
  }

  // Field-specific validation
  switch (name) {
    case 'email': {
      if (!EMAIL_REGEX.test(trimmed)) {
        return 'Please enter a valid email address with an "@" symbol and a valid domain (e.g. name@university.edu).';
      }
      break;
    }

    case 'password': {
      if (trimmed.length < 8) {
        return 'Password is too short. It must contain at least 8 characters.';
      }
      if (!HAS_UPPERCASE.test(trimmed)) {
        return 'Password must include at least one uppercase letter (A-Z).';
      }
      if (!HAS_LOWERCASE.test(trimmed)) {
        return 'Password must include at least one lowercase letter (a-z).';
      }
      if (!HAS_NUMBER.test(trimmed)) {
        return 'Password must include at least one numeric digit (0-9).';
      }
      break;
    }

    case 'confirmPassword': {
      if (trimmed !== (allValues.password || '')) {
        return 'Passwords do not match. Please ensure both passwords match exactly.';
      }
      break;
    }

    case 'firstName':
    case 'lastName': {
      if (trimmed.length < 2) {
        return `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters long.`;
      }
      break;
    }

    case 'rollNumber': {
      if (trimmed.length < 2) {
        return 'Please enter a valid student roll number or ID as issued by your institution.';
      }
      break;
    }

    case 'department': {
      if (trimmed.length < 2) {
        return 'Please specify your academic department (e.g. Computer Science, Mathematics).';
      }
      break;
    }

    default:
      break;
  }

  return '';
}

/**
 * Validates the full form and returns an object of errors
 */
export function validateForm(fields, values) {
  const errors = {};
  for (const field of fields) {
    const error = validateField(field.name, values[field.name], values);
    if (error) {
      errors[field.name] = error;
    }
  }
  return errors;
}

/**
 * Computes password strength metrics and score
 * @param {string} password
 * @returns {object} { score: 0-4, label: string, checks: object }
 */
export function getPasswordStrength(password = '') {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: HAS_UPPERCASE.test(password),
    hasLower: HAS_LOWERCASE.test(password),
    hasNumber: HAS_NUMBER.test(password),
    hasSpecial: HAS_SPECIAL.test(password),
  };

  let passedCount = 0;
  if (checks.minLength) passedCount++;
  if (checks.hasUpper) passedCount++;
  if (checks.hasLower) passedCount++;
  if (checks.hasNumber) passedCount++;
  if (checks.hasSpecial && password.length >= 10) passedCount++;

  let score = 0; // 0: empty, 1: weak, 2: fair, 3: good, 4: strong
  let label = 'Too weak';

  if (!password) {
    return { score: 0, label: '', checks };
  }

  if (passedCount <= 2) {
    score = 1;
    label = 'Weak';
  } else if (passedCount === 3) {
    score = 2;
    label = 'Fair';
  } else if (passedCount === 4) {
    score = 3;
    label = 'Good';
  } else {
    score = 4;
    label = 'Strong';
  }

  return { score, label, checks };
}
