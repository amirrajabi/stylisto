import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkForgotPasswordAllowed,
  checkResendAllowed,
  FORGOT_PASSWORD_COOLDOWN,
  logSecurityEvent,
  MAX_FORGOT_PASSWORD_ATTEMPTS,
  normalizeAuthError,
  recordForgotPasswordAttempt,
  resetForgotPasswordGuard,
  validateEmailSecurity,
} from '../utils/authSecurityUtils';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Auth Security Guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('validateEmailSecurity', () => {
    it('should validate normal emails as valid', () => {
      const result = validateEmailSecurity('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should reject invalid email formats', () => {
      const result = validateEmailSecurity('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please enter a valid email address');
    });

    it('should reject disposable email domains', () => {
      const result = validateEmailSecurity('user@10minutemail.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please use a permanent email address');
    });

    it('should reject suspicious domain patterns', () => {
      const result = validateEmailSecurity('user@tempmail.fake');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please use a permanent email address');
    });
  });

  describe('checkForgotPasswordAllowed', () => {
    it('should allow first attempt', async () => {
      const result = await checkForgotPasswordAllowed();
      expect(result.allowed).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should block when cooldown period is active', async () => {
      const now = Date.now();
      const guardData = {
        attempts: 1,
        lastAttempt: now - FORGOT_PASSWORD_COOLDOWN / 2, // Half cooldown passed
        sessionStart: now - 60000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(guardData));

      const result = await checkForgotPasswordAllowed();
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('wait');
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it('should allow after cooldown period', async () => {
      const now = Date.now();
      const guardData = {
        attempts: 1,
        lastAttempt: now - (FORGOT_PASSWORD_COOLDOWN + 1000), // Cooldown passed
        sessionStart: now - 60000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(guardData));

      const result = await checkForgotPasswordAllowed();
      expect(result.allowed).toBe(true);
    });

    it('should block when max attempts reached', async () => {
      const now = Date.now();
      const guardData = {
        attempts: MAX_FORGOT_PASSWORD_ATTEMPTS,
        lastAttempt: now - (FORGOT_PASSWORD_COOLDOWN + 1000),
        sessionStart: now - 60000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(guardData));

      const result = await checkForgotPasswordAllowed();
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('exceeded');
    });

    it('should reset guard after session timeout', async () => {
      const now = Date.now();
      const guardData = {
        attempts: MAX_FORGOT_PASSWORD_ATTEMPTS,
        lastAttempt: now - 60000,
        sessionStart: now - (5 * 60 * 1000 + 1000), // Session timeout exceeded
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(guardData));

      const result = await checkForgotPasswordAllowed();
      expect(result.allowed).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('recordForgotPasswordAttempt', () => {
    it('should increment attempts and update timestamp', async () => {
      const now = Date.now();
      const guardData = {
        attempts: 1,
        lastAttempt: now - 60000,
        sessionStart: now - 60000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(guardData));

      await recordForgotPasswordAttempt();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'forgot_password_guard',
        expect.stringContaining('"attempts":2')
      );
    });
  });

  describe('checkResendAllowed', () => {
    it('should allow first resend', () => {
      const result = checkResendAllowed(0, 0);
      expect(result.allowed).toBe(true);
    });

    it('should block during cooldown period', () => {
      const now = Date.now();
      const lastResendTime = now - 15000; // 15 seconds ago (cooldown is 30s)

      const result = checkResendAllowed(lastResendTime, 1);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('wait');
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it('should block when max resends reached', () => {
      const result = checkResendAllowed(0, 5); // Max is 5
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('exceeded');
    });
  });

  describe('normalizeAuthError', () => {
    it('should normalize user not found errors', () => {
      const error = new Error('User not found');
      const result = normalizeAuthError(error);
      expect(result).toBe(
        'If an account with this email exists, you will receive a password reset link shortly.'
      );
    });

    it('should normalize rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const result = normalizeAuthError(error);
      expect(result).toBe(
        'Too many requests. Please wait before trying again.'
      );
    });

    it('should provide generic message for unknown errors', () => {
      const error = new Error('Unknown error');
      const result = normalizeAuthError(error);
      expect(result).toBe('Unable to process request. Please try again later.');
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events to AsyncStorage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      await logSecurityEvent('forgot_password_attempt', {
        emailDomain: 'example.com',
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'security_logs',
        expect.stringContaining('forgot_password_attempt')
      );
    });

    it('should maintain maximum log entries', async () => {
      // Create a large log array (over 100 entries)
      const largeLogs = Array(105)
        .fill(null)
        .map((_, i) => ({
          event: 'test',
          timestamp: new Date().toISOString(),
          details: { index: i },
        }));

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(largeLogs));

      await logSecurityEvent('forgot_password_attempt', { test: true });

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
      const logData = JSON.parse(setItemCall[1]);
      expect(logData.length).toBeLessThanOrEqual(100);
    });
  });

  describe('resetForgotPasswordGuard', () => {
    it('should reset guard to initial state', async () => {
      await resetForgotPasswordGuard();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'forgot_password_guard',
        expect.stringContaining('"attempts":0')
      );
    });
  });

  describe('Integration tests', () => {
    it('should handle complete forgot password flow with guards', async () => {
      // First attempt should be allowed
      let result = await checkForgotPasswordAllowed();
      expect(result.allowed).toBe(true);

      // Record the attempt
      await recordForgotPasswordAttempt();

      // Immediate second attempt should be blocked
      result = await checkForgotPasswordAllowed();
      expect(result.allowed).toBe(false);

      // Reset guard
      await resetForgotPasswordGuard();

      // Should be allowed again after reset
      result = await checkForgotPasswordAllowed();
      expect(result.allowed).toBe(true);
    });

    it('should validate email and handle security events together', async () => {
      const suspiciousEmail = 'user@tempmail.org';

      // Email validation should fail
      const emailResult = validateEmailSecurity(suspiciousEmail);
      expect(emailResult.isValid).toBe(false);

      // Should log security event
      await logSecurityEvent('suspicious_email', {
        emailDomain: suspiciousEmail.split('@')[1],
        reason: emailResult.message,
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'security_logs',
        expect.stringContaining('suspicious_email')
      );
    });
  });
});
