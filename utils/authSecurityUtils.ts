import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for forgot password security
export const FORGOT_PASSWORD_COOLDOWN = 60000; // 1 minute in milliseconds
export const MAX_FORGOT_PASSWORD_ATTEMPTS = 3; // Max attempts per session
export const SESSION_RESET_TIME = 300000; // 5 minutes to reset attempts
export const RESEND_COOLDOWN = 30000; // 30 seconds between resends
export const MAX_RESENDS = 5; // Maximum resends per session

// Interface for forgot password guard state
export interface ForgotPasswordGuard {
  attempts: number;
  lastAttempt: number;
  sessionStart: number;
}

// Storage keys
const STORAGE_KEYS = {
  FORGOT_PASSWORD_GUARD: 'forgot_password_guard',
  PASSWORD_RESET_ATTEMPTS: 'password_reset_attempts',
} as const;

// In-memory fallback for the current session
let memoryGuard: ForgotPasswordGuard = {
  attempts: 0,
  lastAttempt: 0,
  sessionStart: Date.now(),
};

/**
 * Enhanced email validation with security checks
 */
export const validateEmailSecurity = (
  email: string
): { isValid: boolean; message?: string } => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  const domainPart = email.split('@')[1];
  if (!domainPart) {
    return { isValid: false, message: 'Invalid email domain' };
  }

  // Check for common disposable email domains (basic protection)
  const disposableDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'tempmail.org',
    'throwaway.email',
    'mailinator.com',
    'yopmail.com',
    '0-mail.com',
    'dispostable.com',
  ];

  const isDisposable = disposableDomains.some(domain =>
    domainPart.toLowerCase().includes(domain)
  );

  if (isDisposable) {
    return { isValid: false, message: 'Please use a permanent email address' };
  }

  // Check for suspicious patterns
  if (
    domainPart.includes('temp') ||
    domainPart.includes('fake') ||
    domainPart.includes('trash')
  ) {
    return { isValid: false, message: 'Please use a permanent email address' };
  }

  return { isValid: true };
};

/**
 * Get forgot password guard state
 */
export const getForgotPasswordGuard =
  async (): Promise<ForgotPasswordGuard> => {
    try {
      const stored = await AsyncStorage.getItem(
        STORAGE_KEYS.FORGOT_PASSWORD_GUARD
      );
      if (stored) {
        const parsed = JSON.parse(stored) as ForgotPasswordGuard;

        // Reset if session timeout exceeded
        const now = Date.now();
        if (now - parsed.sessionStart > SESSION_RESET_TIME) {
          const resetGuard: ForgotPasswordGuard = {
            attempts: 0,
            lastAttempt: 0,
            sessionStart: now,
          };
          await setForgotPasswordGuard(resetGuard);
          return resetGuard;
        }

        return parsed;
      }
    } catch (error) {
      console.error('Error reading forgot password guard:', error);
    }

    // Return memory fallback
    return memoryGuard;
  };

/**
 * Set forgot password guard state
 */
export const setForgotPasswordGuard = async (
  guard: ForgotPasswordGuard
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.FORGOT_PASSWORD_GUARD,
      JSON.stringify(guard)
    );
    memoryGuard = guard; // Update memory fallback
  } catch (error) {
    console.error('Error saving forgot password guard:', error);
    memoryGuard = guard; // Use memory as fallback
  }
};

/**
 * Check if forgot password action is allowed
 */
export const checkForgotPasswordAllowed = async (): Promise<{
  allowed: boolean;
  message?: string;
  remainingTime?: number;
}> => {
  const guard = await getForgotPasswordGuard();
  const now = Date.now();

  // Check rate limiting
  if (guard.lastAttempt > 0) {
    const timeSinceLastAttempt = now - guard.lastAttempt;
    if (timeSinceLastAttempt < FORGOT_PASSWORD_COOLDOWN) {
      const remainingTime = Math.ceil(
        (FORGOT_PASSWORD_COOLDOWN - timeSinceLastAttempt) / 1000
      );
      return {
        allowed: false,
        message: `To prevent abuse, please wait ${remainingTime} seconds before requesting another password reset.`,
        remainingTime,
      };
    }
  }

  // Check max attempts
  if (guard.attempts >= MAX_FORGOT_PASSWORD_ATTEMPTS) {
    return {
      allowed: false,
      message:
        'You have exceeded the maximum number of password reset attempts. Please wait 5 minutes before trying again.',
    };
  }

  return { allowed: true };
};

/**
 * Record forgot password attempt
 */
export const recordForgotPasswordAttempt = async (): Promise<void> => {
  const guard = await getForgotPasswordGuard();
  const updatedGuard: ForgotPasswordGuard = {
    ...guard,
    attempts: guard.attempts + 1,
    lastAttempt: Date.now(),
  };
  await setForgotPasswordGuard(updatedGuard);
};

/**
 * Reset forgot password guard (for testing or admin purposes)
 */
export const resetForgotPasswordGuard = async (): Promise<void> => {
  const resetGuard: ForgotPasswordGuard = {
    attempts: 0,
    lastAttempt: 0,
    sessionStart: Date.now(),
  };
  await setForgotPasswordGuard(resetGuard);
};

/**
 * Check resend rate limiting
 */
export const checkResendAllowed = (
  lastResendTime: number,
  resendCount: number
): { allowed: boolean; message?: string; remainingTime?: number } => {
  const now = Date.now();

  if (lastResendTime > 0) {
    const timeSinceLastResend = now - lastResendTime;
    if (timeSinceLastResend < RESEND_COOLDOWN) {
      const remainingTime = Math.ceil(
        (RESEND_COOLDOWN - timeSinceLastResend) / 1000
      );
      return {
        allowed: false,
        message: `Please wait ${remainingTime} seconds before requesting another reset email.`,
        remainingTime,
      };
    }
  }

  if (resendCount >= MAX_RESENDS) {
    return {
      allowed: false,
      message:
        'You have exceeded the maximum number of reset email requests. Please wait and try again later.',
    };
  }

  return { allowed: true };
};

/**
 * Normalize error messages for security (don't reveal if user exists)
 */
export const normalizeAuthError = (error: Error): string => {
  const message = error.message.toLowerCase();

  if (message.includes('user not found') || message.includes('invalid email')) {
    return 'If an account with this email exists, you will receive a password reset link shortly.';
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many requests. Please wait before trying again.';
  }

  if (message.includes('network') || message.includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Generic fallback for any other errors
  return 'Unable to process request. Please try again later.';
};

/**
 * Security logging for forgot password attempts
 */
export const logSecurityEvent = async (
  event: 'forgot_password_attempt' | 'rate_limit_hit' | 'suspicious_email',
  details: Record<string, any>
): Promise<void> => {
  try {
    // In production, this would send to a security monitoring service
    console.log('Security Event:', {
      event,
      timestamp: new Date().toISOString(),
      details,
    });

    // Store locally for debugging (remove in production)
    const logs = (await AsyncStorage.getItem('security_logs')) || '[]';
    const parsedLogs = JSON.parse(logs);
    parsedLogs.push({
      event,
      timestamp: new Date().toISOString(),
      details,
    });

    // Keep only last 100 entries
    if (parsedLogs.length > 100) {
      parsedLogs.splice(0, parsedLogs.length - 100);
    }

    await AsyncStorage.setItem('security_logs', JSON.stringify(parsedLogs));
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};
