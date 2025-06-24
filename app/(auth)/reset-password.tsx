import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, CheckCircle } from 'lucide-react-native';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { Button, H1, BodyMedium } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { resetPasswordSchema, ResetPasswordFormData } from '../../utils/validation';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function ResetPasswordScreen() {
  const { updatePassword, loading } = useAuth();
  const params = useLocalSearchParams();
  const [isValidToken, setIsValidToken] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // In a real implementation, you would validate the reset token here
    // For now, we'll assume it's valid if we have the necessary parameters
    if (params.access_token || params.refresh_token) {
      setIsValidToken(true);
    } else {
      Alert.alert(
        'Invalid Reset Link',
        'This password reset link is invalid or has expired. Please request a new one.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/forgot-password'),
          },
        ]
      );
    }
  }, [params]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await updatePassword(data.password);
      
      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated. You can now sign in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      if (error.message.includes('Password should be')) {
        setError('password', { message: error.message });
      } else {
        Alert.alert('Update Error', error.message || 'An unexpected error occurred');
      }
    }
  };

  if (!isValidToken) {
    return (
      <AuthLayout showLogo={false}>
        <View style={styles.errorContainer}>
          <H1 style={styles.errorTitle}>Invalid Reset Link</H1>
          <BodyMedium color="secondary" style={styles.errorSubtitle}>
            This password reset link is invalid or has expired.
          </BodyMedium>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout showLogo={false}>
      <LoadingOverlay visible={loading || isSubmitting} message="Updating password..." />
      
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <CheckCircle size={48} color={Colors.success[500]} />
        </View>
        <H1 style={styles.title}>Reset Password</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          Create a new password for your account. Make sure it's strong and secure.
        </BodyMedium>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="New Password"
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
              placeholder="Create a strong password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="next"
              leftIcon={<Lock size={20} color={Colors.text.secondary} />}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Confirm New Password"
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
              placeholder="Confirm your new password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
              leftIcon={<Lock size={20} color={Colors.text.secondary} />}
            />
          )}
        />

        <View style={styles.passwordRequirements}>
          <BodyMedium color="secondary" style={styles.requirementsTitle}>
            Password Requirements:
          </BodyMedium>
          <Text style={styles.requirementText}>• At least 6 characters long</Text>
          <Text style={styles.requirementText}>• Contains uppercase and lowercase letters</Text>
          <Text style={styles.requirementText}>• Contains at least one number</Text>
        </View>

        <Button
          title="Update Password"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={loading}
          style={styles.submitButton}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  passwordRequirements: {
    backgroundColor: Colors.info[50],
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  requirementsTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  requirementText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: Spacing.md,
    color: Colors.error[600],
  },
  errorSubtitle: {
    textAlign: 'center',
  },
});