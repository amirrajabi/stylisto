import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { Button, H1, BodyMedium } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../utils/validation';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function ForgotPasswordScreen() {
  const { resetPassword, loading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await resetPassword(data.email);
      
      Alert.alert(
        'Reset Link Sent',
        'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      if (error.message.includes('not found')) {
        setError('email', { message: 'No account found with this email address' });
      } else {
        Alert.alert('Reset Error', error.message || 'An unexpected error occurred');
      }
    }
  };

  return (
    <AuthLayout showLogo={false}>
      <LoadingOverlay visible={loading || isSubmitting} message="Sending reset link..." />
      
      <View style={styles.backButton}>
        <Link href="/(auth)/login" asChild>
          <Button
            title=""
            variant="ghost"
            leftIcon={<ArrowLeft size={20} color={Colors.text.secondary} />}
            onPress={() => {}}
            style={styles.backButtonStyle}
          />
        </Link>
      </View>

      <View style={styles.header}>
        <H1 style={styles.title}>Forgot Password?</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          No worries! Enter your email address and we'll send you a link to reset your password.
        </BodyMedium>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Email Address"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
              leftIcon={<Mail size={20} color={Colors.text.secondary} />}
            />
          )}
        />

        <Button
          title="Send Reset Link"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={loading}
          style={styles.submitButton}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Remember your password?{' '}
          <Link href="/(auth)/login" asChild>
            <Text style={styles.footerLink}>Sign in</Text>
          </Link>
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  backButtonStyle: {
    paddingHorizontal: 0,
    paddingVertical: Spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
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
    marginBottom: Spacing['2xl'],
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  footerLink: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
});