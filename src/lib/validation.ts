/**
 * Input Validation Library
 * Centralized validation utilities for security and consistency
 */

// ============================================================
// PASSWORD VALIDATION
// ============================================================

export interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
  met: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-5 strength score
  requirements: PasswordRequirement[];
  feedback: string;
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const passwordRequirements: Omit<PasswordRequirement, 'met'>[] = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    validator: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: 'Contains uppercase letter (A-Z)',
    validator: (p) => /[A-Z]/.test(p),
  },
  {
    label: 'Contains lowercase letter (a-z)',
    validator: (p) => /[a-z]/.test(p),
  },
  {
    label: 'Contains number (0-9)',
    validator: (p) => /[0-9]/.test(p),
  },
  {
    label: 'Contains special character (!@#$%^&*)',
    validator: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  },
];

export function validatePassword(password: string): PasswordValidationResult {
  const requirements = passwordRequirements.map((req) => ({
    ...req,
    met: req.validator(password),
  }));

  const metCount = requirements.filter((r) => r.met).length;
  const score = metCount;
  const isValid = metCount >= 4; // Require at least 4 of 5 requirements

  let feedback = '';
  if (password.length === 0) {
    feedback = 'Enter a password';
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    feedback = `Password must be ${PASSWORD_MAX_LENGTH} characters or less`;
  } else if (score <= 1) {
    feedback = 'Very weak - add more variety';
  } else if (score === 2) {
    feedback = 'Weak - needs improvement';
  } else if (score === 3) {
    feedback = 'Fair - almost there';
  } else if (score === 4) {
    feedback = 'Strong password';
  } else {
    feedback = 'Excellent password!';
  }

  return { isValid, score, requirements, feedback };
}

export function getPasswordStrengthColor(score: number): string {
  const colors = ['#dc2626', '#dc2626', '#f59e0b', '#eab308', '#22c55e', '#16a34a'];
  return colors[Math.min(score, 5)];
}

// ============================================================
// EMAIL VALIDATION
// ============================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  return { isValid: true };
}

// ============================================================
// TEXT INPUT VALIDATION
// ============================================================

export interface TextValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
}

export function validateText(
  value: string,
  options: TextValidationOptions = {}
): { isValid: boolean; error?: string } {
  const { required = false, minLength, maxLength, pattern, patternMessage } = options;

  if (required && (!value || value.trim().length === 0)) {
    return { isValid: false, error: 'This field is required' };
  }

  if (value && minLength && value.length < minLength) {
    return { isValid: false, error: `Must be at least ${minLength} characters` };
  }

  if (value && maxLength && value.length > maxLength) {
    return { isValid: false, error: `Must be ${maxLength} characters or less` };
  }

  if (value && pattern && !pattern.test(value)) {
    return { isValid: false, error: patternMessage || 'Invalid format' };
  }

  return { isValid: true };
}

// ============================================================
// XSS PREVENTION / SANITIZATION
// ============================================================

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  // Trim whitespace
  sanitized = sanitized.trim();
  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return sanitized;
}

// ============================================================
// SQL INJECTION PREVENTION
// ============================================================

// Note: Supabase uses parameterized queries, but this adds an extra layer
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
  /(--|#|\/\*)/g,
  /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
  /(\bAND\b\s+\d+\s*=\s*\d+)/gi,
];

export function containsSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// ============================================================
// URL VALIDATION
// ============================================================

export function validateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: true }; // URLs are often optional
  }

  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: 'URL must use http or https' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

// ============================================================
// FORM VALIDATION HELPERS
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
}

export function createValidator<T extends Record<string, unknown>>(
  rules: {
    [K in keyof T]?: (value: T[K], data: T) => string | undefined;
  }
) {
  return (data: T): ValidationError[] => {
    const errors: ValidationError[] = [];

    for (const [field, validator] of Object.entries(rules)) {
      if (validator) {
        const error = validator(data[field as keyof T] as T[keyof T], data);
        if (error) {
          errors.push({ field, message: error });
        }
      }
    }

    return errors;
  };
}

// ============================================================
// ORGANIZATION CONTEXT VALIDATION
// ============================================================

export function requireOrganizationId(organizationId: string | null | undefined): string {
  if (!organizationId) {
    throw new Error('Organization context is required. Please complete organization setup.');
  }
  return organizationId;
}

export function requireUserId(userId: string | null | undefined): string {
  if (!userId) {
    throw new Error('User authentication required.');
  }
  return userId;
}

// ============================================================
// UUID VALIDATION
// ============================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function validateUUID(value: string, fieldName = 'ID'): { isValid: boolean; error?: string } {
  if (!value) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (!isValidUUID(value)) {
    return { isValid: false, error: `Invalid ${fieldName} format` };
  }
  return { isValid: true };
}
