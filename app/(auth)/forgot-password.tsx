import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { BodyMedium, BodySmall, Button, H1 } from '../../components/ui';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useAuth } from '../../hooks/useAuth';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { resetPassword, loading } = useAuth();
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      if (error.message.includes('User not found')) {
        form.setError('email', {
          message: 'No account found with this email address',
        });
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to send password reset email'
        );
      }
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
              Didn&apos;t receive the email? Check your spam folder or try
              again.
            </BodySmall>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Resend Email"
              onPress={form.handleSubmit(onSubmit)}
              disabled={loading}
              style={styles.resendButton}
            />

            <Button
              title="Back to Sign In"
              onPress={handleBackToLogin}
              style={styles.backToLoginButton}
            />
          </View>
        </View>
      )}

      <AuthFooter currentPage="login" />
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
    alignItems: 'center',
    gap: Spacing.md,
  },
  successText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 13,
    opacity: 0.8,
  },
  resendButton: {
    backgroundColor: Colors.primary[600],
  },
});
