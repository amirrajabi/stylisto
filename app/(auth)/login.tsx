import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Key, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { BodyMedium, Button, H1 } from '../../components/ui';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useAuth } from '../../hooks/useAuth';

// Validation schema for email/password login
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signInWithPassword, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signInWithPassword(data.email, data.password);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        form.setError('password', {
          message: 'Invalid email or password',
        });
      } else if (error.message.includes('Email not confirmed')) {
        Alert.alert(
          'Email Not Verified',
          'Please check your email and verify your account before signing in.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in');
      }
    }
  };

  const handleForgotPassword = () => {
    const currentEmail = form.getValues('email');

    if (currentEmail && currentEmail.trim() !== '') {
      // Pre-fill the forgot password screen with current email
      router.push({
        pathname: '/(auth)/forgot-password',
        params: { email: currentEmail },
      });
    } else {
      // Navigate to forgot password screen without email
      router.push('/(auth)/forgot-password');
    }
  };

  return (
    <AuthLayout>
      <LoadingOverlay visible={loading} message="Signing in..." />

      <View style={styles.header}>
        <H1 style={styles.title}>Welcome Back</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          Sign in to your Stylisto account
        </BodyMedium>
      </View>

      <View style={styles.form}>
        <View style={styles.mainContent}>
          <Controller
            control={form.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Email"
                value={value}
                onChangeText={onChange}
                error={form.formState.errors.email?.message}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon={<Mail size={20} color={Colors.primary[600]} />}
              />
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Password"
                value={value}
                onChangeText={onChange}
                error={form.formState.errors.password?.message}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={form.handleSubmit(onSubmit)}
                leftIcon={<Key size={20} color={Colors.primary[600]} />}
              />
            )}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Sign In"
            onPress={form.handleSubmit(onSubmit)}
            disabled={loading || form.formState.isSubmitting}
            style={styles.signInButton}
          />
        </View>
      </View>

      <View style={styles.forgotPasswordContainer}>
        <BodyMedium color="secondary" style={styles.forgotPasswordText}>
          Can&apos;t access your account?
        </BodyMedium>
        <Button
          title="Reset Password"
          variant="ghost"
          size="small"
          onPress={handleForgotPassword}
          style={styles.forgotPasswordButton}
          textStyle={styles.forgotPasswordLinkText}
        />
      </View>

      <AuthFooter currentPage="login" />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    gap: Spacing.md,
  },
  forgotPassword: {
    alignItems: 'flex-end',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  forgotPasswordText: {
    textAlign: 'center',
    fontSize: 14,
  },
  forgotPasswordButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: Spacing.xs,
  },
  forgotPasswordLinkText: {
    color: Colors.primary[600],
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  signInButton: {
    backgroundColor: Colors.primary[600],
  },
});
