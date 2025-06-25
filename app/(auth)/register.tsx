import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, Key, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { PrivacyModal } from '../../components/auth/PrivacyModal';
import { TermsModal } from '../../components/auth/TermsModal';
import {
  BodyMedium,
  BodySmall,
  Button,
  CheckBox,
  H1,
} from '../../components/ui';
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
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the Terms and Conditions',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { signUpWithPassword, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
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
        'Account Created Successfully!',
        "Please check your email for a verification link. You must verify your email before you can sign in.\n\nIf you don't see the email, check your spam folder.",
        [
          {
            text: 'Go to Login',
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      if (
        error.message.includes('already registered') ||
        error.message.includes('User already registered')
      ) {
        Alert.alert(
          'Email Already Registered',
          'This email address is already associated with an account. Would you like to sign in instead or reset your password?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Reset Password',
              onPress: () =>
                router.push({
                  pathname: '/(auth)/forgot-password',
                  params: { email: data.email },
                }),
            },
            {
              text: 'Sign In',
              onPress: () =>
                router.push({
                  pathname: '/(auth)/login',
                  params: { email: data.email },
                }),
            },
          ]
        );
      } else if (
        error.message.includes('weak password') ||
        error.message.includes('Password should be')
      ) {
        form.setError('password', {
          message: 'Password is too weak. Please choose a stronger password.',
        });
      } else if (
        error.message.includes('invalid email') ||
        error.message.includes('Invalid email')
      ) {
        form.setError('email', {
          message: 'Please enter a valid email address.',
        });
      } else if (
        error.message.includes('rate limit') ||
        error.message.includes('too many requests')
      ) {
        Alert.alert(
          'Registration Temporarily Blocked',
          'Too many registration attempts. Please wait a moment and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Registration Error',
          error.message || 'Failed to create account. Please try again.'
        );
      }
    }
  };

  const handleBackToLogin = () => {
    router.push('/(auth)/login');
  };

  const handleTermsPress = () => {
    setShowTermsModal(true);
  };

  const handlePrivacyPress = () => {
    setShowPrivacyModal(true);
  };

  const handleCloseTermsModal = () => {
    setShowTermsModal(false);
  };

  const handleClosePrivacyModal = () => {
    setShowPrivacyModal(false);
  };

  return (
    <AuthLayout>
      <LoadingOverlay
        visible={loading || form.formState.isSubmitting}
        message="Creating account..."
      />

      <View style={styles.header}>
        <Button
          title=""
          onPress={handleBackToLogin}
          style={styles.backButton}
          leftIcon={<ArrowLeft size={20} color={Colors.primary[600]} />}
        />
        <H1 style={styles.title}>Create Account</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          Sign up to get started with Stylisto
        </BodyMedium>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.fieldsContainer}>
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

          <Controller
            control={form.control}
            name="acceptTerms"
            render={({ field: { value, onChange } }) => (
              <View style={styles.termsContainer}>
                <CheckBox
                  checked={value}
                  onToggle={() => onChange(!value)}
                  error={!!form.formState.errors.acceptTerms}
                >
                  <View style={styles.termsLinksRow}>
                    <BodySmall style={styles.termsText}>
                      I agree to the{' '}
                    </BodySmall>
                    <Pressable onPress={handleTermsPress}>
                      <BodySmall style={styles.termsLinkText}>Terms</BodySmall>
                    </Pressable>
                    <BodySmall style={styles.termsText}> & </BodySmall>
                    <Pressable onPress={handlePrivacyPress}>
                      <BodySmall style={styles.termsLinkText}>
                        Privacy Policy
                      </BodySmall>
                    </Pressable>
                  </View>
                </CheckBox>
                {form.formState.errors.acceptTerms && (
                  <BodySmall style={styles.errorText}>
                    {form.formState.errors.acceptTerms.message}
                  </BodySmall>
                )}
              </View>
            )}
          />
        </View>

        <View style={styles.actionsContainer}>
          <Button
            title="Create Account"
            onPress={form.handleSubmit(onSubmit)}
            disabled={
              loading || form.formState.isSubmitting || !form.formState.isValid
            }
            style={styles.createButton}
          />
        </View>
      </View>

      <AuthFooter currentPage="register" />

      <TermsModal visible={showTermsModal} onClose={handleCloseTermsModal} />
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={handleClosePrivacyModal}
      />
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
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 300,
  },
  fieldsContainer: {
    gap: Spacing.md,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 13,
    opacity: 0.8,
  },
  termsContainer: {
    marginTop: Spacing.md,
  },
  termsLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  termsText: {
    lineHeight: 20,
    color: Colors.text.secondary,
  },
  termsLinkText: {
    color: Colors.primary[600],
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error[600],
    marginTop: Spacing.xs,
    marginLeft: 28,
  },
  actionsContainer: {
    marginTop: Spacing.xl,
  },
  createButton: {
    backgroundColor: Colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
});
