import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { BodyMedium, BodySmall, Button, H1 } from '../../components/ui';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useAuth } from '../../hooks/useAuth';
import {
  checkResendAllowed,
  logSecurityEvent,
  normalizeAuthError,
  validateEmailSecurity,
} from '../../utils/authSecurityUtils';

// Enhanced validation schema with stronger email requirements
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine(email => {
      const validation = validateEmailSecurity(email);
      return validation.isValid;
    }, 'Please use a permanent email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { resetPassword, loading } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [lastResendTime, setLastResendTime] = useState(0);

  // Get email parameter if passed from login screen
  const params = useLocalSearchParams<{ email?: string }>();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: params.email || '',
    },
  });

  // Set email from params when component mounts
  useEffect(() => {
    if (params.email) {
      form.setValue('email', params.email);
    }
  }, [params.email, form]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // Check resend rate limiting
      const resendCheck = checkResendAllowed(lastResendTime, resendCount);
      if (!resendCheck.allowed) {
        Alert.alert('Request Blocked', resendCheck.message!, [{ text: 'OK' }]);

        // Log rate limit hit
        await logSecurityEvent('rate_limit_hit', {
          type: 'resend',
          remainingTime: resendCheck.remainingTime,
          resendCount,
        });
        return;
      }

      // Additional email validation
      const emailValidation = validateEmailSecurity(data.email);
      if (!emailValidation.isValid) {
        Alert.alert('Invalid Email', emailValidation.message!, [
          { text: 'OK' },
        ]);

        // Log suspicious email attempt
        await logSecurityEvent('suspicious_email', {
          emailDomain: data.email.split('@')[1],
          reason: emailValidation.message,
          screen: 'forgot_password',
        });
        return;
      }

      const now = Date.now();

      await resetPassword(data.email);
      setEmailSent(true);
      setResendCount(prev => prev + 1);
      setLastResendTime(now);

      // Log successful reset request
      await logSecurityEvent('forgot_password_attempt', {
        emailDomain: data.email.split('@')[1],
        resendCount: resendCount + 1,
        screen: 'forgot_password',
      });

      Alert.alert(
        'Password Reset Email Sent',
        "Please check your email for instructions to reset your password. If you don't see it, check your spam folder.",
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      const normalizedMessage = normalizeAuthError(error);

      // Always show success message for security (don't reveal if user exists)
      Alert.alert('Reset Link Sent', normalizedMessage, [{ text: 'OK' }]);

      // Log the error for monitoring
      await logSecurityEvent('forgot_password_attempt', {
        emailDomain: data.email.split('@')[1],
        error: error.message,
        normalized: true,
        screen: 'forgot_password',
      });

      setEmailSent(true);
    }
  };

  const handleBackToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <AuthLayout>
      <LoadingOverlay visible={loading} message="Sending reset email..." />

      <View style={styles.header}>
        <Button
          title=""
          onPress={handleBackToLogin}
          style={styles.backButton}
          leftIcon={<ArrowLeft size={20} color={Colors.primary[600]} />}
        />
        <H1 style={styles.title}>Forgot Password</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          {emailSent
            ? 'We have sent you a password reset email'
            : 'Enter your email address and we will send you a link to reset your password'}
        </BodyMedium>
      </View>

      {!emailSent ? (
        <View style={styles.form}>
          <View style={styles.mainContent}>
            <Controller
              control={form.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  error={form.formState.errors.email?.message}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={form.handleSubmit(onSubmit)}
                  leftIcon={<Mail size={20} color={Colors.primary[600]} />}
                />
              )}
            />

            <View style={styles.securityNotice}>
              <BodySmall color="secondary" style={styles.securityText}>
                For security, we limit password reset requests. Please use a
                permanent email address.
              </BodySmall>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Send Reset Email"
              onPress={form.handleSubmit(onSubmit)}
              disabled={loading || form.formState.isSubmitting}
              style={styles.sendButton}
            />

            <Button
              title="Back to Sign In"
              variant="outline"
              onPress={handleBackToLogin}
              style={styles.backToLoginButton}
            />
          </View>
        </View>
      ) : (
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <BodyMedium color="secondary" style={styles.successText}>
              If an account with that email exists, you will receive a password
              reset link shortly.
            </BodyMedium>
            <BodySmall color="secondary" style={styles.helperText}>
              Didn&apos;t receive the email? Check your spam folder or try again
              in a few moments.
            </BodySmall>

            {resendCount > 0 && (
              <BodySmall color="secondary" style={styles.resendCount}>
                Reset emails sent: {resendCount}/5
              </BodySmall>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Resend Email"
              onPress={form.handleSubmit(onSubmit)}
              disabled={loading || resendCount >= 5}
              style={[
                styles.resendButton,
                resendCount >= 5 && styles.disabledButton,
              ]}
            />

            <Button
              title="Back to Sign In"
              variant="outline"
              onPress={handleBackToLogin}
              style={styles.backToLoginButton}
            />
          </View>
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
  form: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    gap: Spacing.md,
  },
  securityNotice: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[600],
  },
  securityText: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  sendButton: {
    backgroundColor: Colors.primary[600],
  },
  backToLoginButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary[600],
  },
  successContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  successContent: {
    gap: Spacing.md,
  },
  successText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  resendCount: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  resendButton: {
    backgroundColor: Colors.primary[600],
  },
  disabledButton: {
    backgroundColor: Colors.background.secondary,
    opacity: 0.6,
  },
});
