# Stylisto Authentication Implementation Guide

## Overview

This document provides a comprehensive guide to the Stylisto authentication system, built with Supabase as the backend service. The implementation includes email/password authentication, OAuth providers (Google and Apple), secure token management, and comprehensive security features.

## Architecture

### Authentication Flow
```
User → Auth UI → Auth Service → Supabase Auth → Database
                     ↓
              Token Management → Secure Storage
```

### Key Components

1. **Auth Service** (`lib/auth.ts`) - Centralized authentication logic
2. **Auth Hook** (`hooks/useAuth.ts`) - React hook for auth state management
3. **Auth UI Components** (`components/auth/`) - Reusable authentication forms
4. **Database Schema** - User profiles and session tracking
5. **Email Templates** - Custom branded email communications

## Features

### ✅ Implemented Features

#### Core Authentication
- [x] Email/password registration and login
- [x] Email verification with custom templates
- [x] Password reset with secure tokens
- [x] OAuth integration (Google and Apple)
- [x] Session management with refresh token rotation
- [x] Secure token storage using AsyncStorage/SecureStore

#### Security Features
- [x] Row Level Security (RLS) policies
- [x] PKCE flow for enhanced OAuth security
- [x] Automatic token refresh
- [x] Session timeout handling
- [x] Secure password requirements
- [x] Rate limiting protection

#### User Experience
- [x] Real-time form validation
- [x] Loading states and error handling
- [x] Responsive design across platforms
- [x] Accessibility compliance
- [x] Social login buttons with platform detection
- [x] Custom email templates with branding

#### Data Management
- [x] User profile creation and management
- [x] User preferences initialization
- [x] Session tracking and analytics
- [x] Soft delete functionality
- [x] Data isolation between users

## Implementation Details

### Authentication Service

The `AuthService` class provides a centralized interface for all authentication operations:

```typescript
// Core methods
signUp({ email, password, fullName })
signIn({ email, password })
signInWithGoogle()
signInWithApple()
signOut()
resetPassword(email)
updatePassword(password)
updateProfile(updates)
```

### Security Implementation

#### Row Level Security (RLS)
All database tables implement RLS policies ensuring users can only access their own data:

```sql
CREATE POLICY "Users can read own data"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL);
```

#### Token Management
- Automatic refresh token rotation
- Secure storage using platform-appropriate methods
- Session validation and cleanup
- PKCE flow for OAuth security

#### Password Security
- Minimum 6 characters with complexity requirements
- Secure password reset with time-limited tokens
- Password visibility toggle with accessibility support

### OAuth Integration

#### Google OAuth
- Web: Uses Supabase OAuth with redirect handling
- Mobile: Native OAuth implementation ready
- Automatic profile creation from OAuth data

#### Apple Sign In
- iOS only implementation
- Native Apple Sign In integration
- Privacy-focused user data handling

### Email Templates

Custom HTML email templates for all authentication flows:

1. **Welcome/Confirmation** - Account verification
2. **Password Reset** - Secure password recovery
3. **Magic Link** - Passwordless authentication
4. **Email Change** - Email address updates

Templates include:
- Responsive design
- Brand consistency
- Security information
- Clear call-to-action buttons
- Accessibility features

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);
```

#### User Sessions
```sql
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  platform text NOT NULL,
  app_version text
);
```

## Configuration

### Environment Variables

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OAuth Configuration (Production)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_APPLE_CLIENT_ID=your_apple_client_id
```

### Supabase Configuration

#### Auth Settings
- Email confirmation: Optional (configurable)
- Password requirements: Minimum 6 characters
- Session timeout: 1 hour (configurable)
- Refresh token rotation: Enabled
- OAuth providers: Google, Apple

#### Email Configuration
- Custom SMTP settings
- Branded email templates
- Redirect URL configuration
- Rate limiting settings

## Usage Examples

### Basic Authentication

```typescript
import { useAuth } from '../hooks/useAuth';

function LoginScreen() {
  const { signIn, loading, error } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      // User is automatically redirected on success
    } catch (error) {
      // Error handling is managed by the hook
    }
  };
}
```

### OAuth Authentication

```typescript
function SocialLogin() {
  const { signInWithGoogle, signInWithApple } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };
}
```

### Protected Routes

```typescript
function ProtectedScreen() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  return <MainApp />;
}
```

## Testing Strategy

### Unit Tests
- Form validation logic
- Authentication service methods
- Error handling scenarios
- Token management functions

### Integration Tests
- Complete authentication flows
- OAuth callback handling
- Database operations
- Email template rendering

### End-to-End Tests
- User registration flow
- Login/logout cycles
- Password reset process
- Social login integration

### Security Tests
- RLS policy validation
- Token security verification
- Session management testing
- Input sanitization checks

## Deployment Considerations

### Production Setup

1. **Supabase Configuration**
   - Configure custom domain
   - Set up SMTP for emails
   - Configure OAuth providers
   - Set rate limiting rules

2. **Environment Variables**
   - Secure credential storage
   - Platform-specific configuration
   - OAuth client IDs and secrets

3. **Monitoring**
   - Authentication metrics
   - Error tracking
   - Performance monitoring
   - Security alerts

### Security Checklist

- [ ] RLS policies tested and verified
- [ ] OAuth providers properly configured
- [ ] Email templates tested across clients
- [ ] Rate limiting configured
- [ ] Session security validated
- [ ] Token rotation working
- [ ] Error messages don't leak sensitive data
- [ ] HTTPS enforced in production
- [ ] Backup and recovery procedures tested

## Troubleshooting

### Common Issues

1. **OAuth Redirect Issues**
   - Verify redirect URLs in provider settings
   - Check deep link configuration
   - Validate URL schemes

2. **Email Delivery Problems**
   - Check SMTP configuration
   - Verify DNS settings
   - Test email templates

3. **Token Refresh Failures**
   - Check network connectivity
   - Verify token expiration settings
   - Review refresh token rotation

4. **RLS Policy Errors**
   - Validate policy syntax
   - Check user context
   - Test with different user roles

### Debug Tools

- Supabase Auth logs
- Network request inspection
- Local storage examination
- Database query analysis

## Future Enhancements

### Planned Features
- [ ] Multi-factor authentication (MFA)
- [ ] Biometric authentication
- [ ] Social login expansion (Facebook, Twitter)
- [ ] Enterprise SSO integration
- [ ] Advanced session management
- [ ] Audit logging
- [ ] Account linking/unlinking
- [ ] Progressive user onboarding

### Performance Optimizations
- [ ] Token caching strategies
- [ ] Offline authentication support
- [ ] Background refresh optimization
- [ ] Network request batching

This authentication system provides a robust, secure, and user-friendly foundation for the Stylisto application, with comprehensive features and room for future expansion.