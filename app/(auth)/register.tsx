import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Key, Mail, User } from 'lucide-react-native';
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

// Validation schema for email/password registration
const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { signUpWithPassword, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUpWithPassword({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account before signing in.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      if (error.message.includes('already registered')) {
        form.setError('email', {
          message: 'This email is already registered',
        });
      } else if (error.message.includes('weak password')) {
        form.setError('password', {
          message: 'Password is too weak',
        });
      } else {
        Alert.alert(
          'Registration Error',
          error.message || 'Failed to create account'
        );
      }
    }
  };

  return (
    <AuthLayout>
      <LoadingOverlay
        visible={loading || form.formState.isSubmitting}
        message="Creating account..."
      />

      <View style={styles.header}>
        <H1 style={styles.title}>Create Account</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          Sign up to get started with Stylisto
        </BodyMedium>
      </View>

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
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon={<Mail size={20} color={Colors.primary[600]} />}
              />
            )}
          />

          <Controller
            control={form.control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="First Name"
                value={value}
                onChangeText={onChange}
                error={form.formState.errors.firstName?.message}
                placeholder="John"
                autoCapitalize="words"
                autoComplete="name"
                leftIcon={<User size={20} color={Colors.primary[600]} />}
              />
            )}
          />

          <Controller
            control={form.control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Last Name"
                value={value}
                onChangeText={onChange}
                error={form.formState.errors.lastName?.message}
                placeholder="Doe"
                autoCapitalize="words"
                autoComplete="name"
                leftIcon={<User size={20} color={Colors.primary[600]} />}
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
                leftIcon={<Key size={20} color={Colors.primary[600]} />}
              />
            )}
          />

          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Confirm Password"
                value={value}
                onChangeText={onChange}
                error={form.formState.errors.confirmPassword?.message}
                placeholder="Confirm your password"
                secureTextEntry={!showPassword}
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={form.handleSubmit(onSubmit)}
                leftIcon={<Key size={20} color={Colors.primary[600]} />}
              />
            )}
          />

          <BodySmall color="secondary" style={styles.helperText}>
            Password must be at least 8 characters with uppercase, lowercase,
            and number
          </BodySmall>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Create Account"
            onPress={form.handleSubmit(onSubmit)}
            disabled={
              loading || form.formState.isSubmitting || !form.formState.isValid
            }
            style={styles.button}
          />
        </View>
      </View>

      <AuthFooter currentPage="register" />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  form: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
  },
  helperText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
});
