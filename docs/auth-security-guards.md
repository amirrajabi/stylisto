# Authentication Security Guards

This document describes the security measures implemented for the authentication system, specifically focusing on the forgot password functionality to prevent abuse and enhance security.

## Overview

The authentication security system includes multiple layers of protection:

1. **Rate Limiting**: Prevents rapid-fire attempts
2. **Email Validation**: Blocks suspicious and disposable email addresses
3. **Security Logging**: Tracks security events for monitoring
4. **Error Normalization**: Prevents information disclosure

## Security Guards Implementation

### 1. Forgot Password Guards

Located in `utils/authSecurityUtils.ts`, these guards protect the forgot password functionality:

#### Rate Limiting

- **Cooldown Period**: 60 seconds between attempts
- **Max Attempts**: 3 attempts per session
- **Session Reset**: 5 minutes timeout to reset attempt counter

#### Email Security Validation

- **Format Validation**: Standard email regex checking
- **Disposable Email Blocking**: Prevents use of temporary email services
- **Suspicious Pattern Detection**: Blocks domains containing "temp", "fake", "trash"

#### Protected Domains List

```typescript
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
```

### 2. Resend Rate Limiting

For the forgot password screen:

- **Resend Cooldown**: 30 seconds between resend attempts
- **Max Resends**: 5 resends per session
- **Visual Feedback**: Shows remaining resend count to users

### 3. Security Logging

All security events are logged for monitoring:

```typescript
await logSecurityEvent('forgot_password_attempt', {
  emailDomain: 'example.com',
  resendCount: 1,
  screen: 'login',
});
```

#### Event Types

- `forgot_password_attempt`: Legitimate reset attempts
- `rate_limit_hit`: When guards block attempts
- `suspicious_email`: When suspicious emails are detected

### 4. Error Normalization

To prevent information disclosure, all error messages are normalized:

- **User Not Found**: Always shows "reset link sent" message
- **Rate Limiting**: Generic "too many requests" message
- **Network Errors**: Simplified connection error message

## Implementation Details

### Login Screen Guards (`app/(auth)/login.tsx`)

The login screen implements these security measures:

1. **Pre-validation**: Checks email format before navigation
2. **Rate Limit Check**: Verifies if forgot password is allowed
3. **Email Security**: Validates against disposable emails
4. **Attempt Recording**: Logs each attempt for rate limiting
5. **Security Events**: Logs events for monitoring

#### User Experience Flow

```
User clicks "Forgot Password?" →
System checks rate limiting →
System validates email format →
System checks for suspicious email →
Records attempt →
Navigates to forgot password screen
```

### Forgot Password Screen Guards (`app/(auth)/forgot-password.tsx`)

Enhanced with additional protections:

1. **Email Pre-filling**: Accepts validated email from login
2. **Enhanced Validation**: Uses Zod with security refinement
3. **Resend Protection**: Rate limits resend attempts
4. **Error Masking**: Normalizes all error responses
5. **Visual Indicators**: Shows security notices to users

## Security Features

### Client-Side Protection

- **AsyncStorage Persistence**: Guards persist across app restarts
- **Memory Fallback**: Works even if storage fails
- **Session Management**: Automatic reset after timeout

### Server-Side Integration

- **Supabase Rate Limiting**: Configured in `supabase/config.toml`
- **Email Rate Limits**: 2 emails per hour maximum
- **Token Verification Limits**: 30 verifications per 5 minutes

### Configuration

```toml
[auth.rate_limit]
email_sent = 2                    # Emails per hour
sign_in_sign_ups = 30            # Sign-ins per 5 minutes
token_verifications = 30         # Verifications per 5 minutes
token_refresh = 150              # Refreshes per 5 minutes
```

## User Experience

### Security Notices

The system provides clear user feedback:

- **Rate Limiting**: Shows countdown timer for remaining wait time
- **Email Validation**: Explains why certain emails are rejected
- **Attempt Tracking**: Displays remaining attempts when appropriate
- **Success Messaging**: Consistent messaging regardless of user existence

### Accessibility

- **Clear Instructions**: Step-by-step guidance for users
- **Error Recovery**: Helpful suggestions for blocked actions
- **Visual Indicators**: Security icons and progress feedback

## Testing

Comprehensive test suite in `tests/auth-security-guards.test.ts`:

- **Unit Tests**: Individual guard functions
- **Integration Tests**: Complete user flows
- **Edge Cases**: Rate limiting, timeouts, storage failures
- **Security Scenarios**: Malicious input handling

### Running Tests

```bash
npm test auth-security-guards.test.ts
```

## Security Monitoring

### Local Development

- **Console Logging**: Security events logged to console
- **AsyncStorage Logs**: Local storage of security events (debugging)
- **Test Data**: Clear test scenarios for verification

### Production Considerations

- **External Monitoring**: Integrate with security services
- **Log Aggregation**: Centralized security event collection
- **Alert Systems**: Real-time notification of security events
- **Analytics**: Pattern analysis for abuse detection

## Maintenance

### Regular Updates

- **Disposable Domain List**: Update monthly with new services
- **Rate Limit Tuning**: Adjust based on usage patterns
- **Security Patches**: Keep dependencies updated

### Monitoring Metrics

- **False Positives**: Legitimate users blocked
- **Attack Patterns**: Common abuse scenarios
- **Performance Impact**: Guard execution timing
- **User Feedback**: Support ticket patterns

## Configuration Constants

All security constants are configurable in `utils/authSecurityUtils.ts`:

```typescript
export const FORGOT_PASSWORD_COOLDOWN = 60000; // 1 minute
export const MAX_FORGOT_PASSWORD_ATTEMPTS = 3; // Per session
export const SESSION_RESET_TIME = 300000; // 5 minutes
export const RESEND_COOLDOWN = 30000; // 30 seconds
export const MAX_RESENDS = 5; // Per session
```

## Best Practices

### For Developers

1. **Always validate input** before processing
2. **Log security events** for monitoring
3. **Provide clear user feedback** without revealing sensitive information
4. **Test edge cases** thoroughly
5. **Monitor for new attack patterns**

### For Users

1. **Use permanent email addresses** for account recovery
2. **Wait for cooldown periods** to complete
3. **Check spam folders** for reset emails
4. **Contact support** if legitimately blocked

## Security Considerations

### Threats Mitigated

- **Brute Force Attacks**: Rate limiting prevents rapid attempts
- **Email Enumeration**: Normalized responses hide user existence
- **Resource Exhaustion**: Limits prevent server overload
- **Social Engineering**: Disposable email blocking

### Limitations

- **Determined Attackers**: May use multiple IP addresses
- **Legitimate Users**: May be temporarily blocked
- **New Disposable Services**: Require manual list updates
- **Client-Side Bypass**: Server-side validation also required

## Integration Points

### Supabase Authentication

- **Row Level Security**: Additional database protection
- **Email Templates**: Consistent branding and security messaging
- **Webhook Integration**: Real-time security event processing

### Error Handling System

- **Centralized Logging**: Integration with existing error tracking
- **User-Friendly Messages**: Consistent with app design
- **Support Integration**: Automatic ticket creation for blocked users

This security system provides comprehensive protection while maintaining a smooth user experience. Regular monitoring and updates ensure continued effectiveness against evolving threats.
