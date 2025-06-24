import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User } from 'lucide-react-native';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { SocialLoginButton } from '../../components/auth/SocialLoginButton';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { Button, H1, BodyMedium } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { registerSchema, RegisterFormData } from '../../utils/validation';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function RegisterScreen() {
  const { signUp, signInWithGoogle, signInWithApple, loading } = useAuth();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password, data.fullName);
      
      Alert.alert(
        'Account Created',
        'Please check your email for a verification link before signing in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      // Handle specific error types
      if (error.message.includes('already registered')) {
        setError('email', { message: 'An account with this email already exists' });
      } else if (error.message.includes('Password should be')) {
        setError('password', { message: error.message });
      } else if (error.message.includes('Invalid email')) {
        setError('email', { message: 'Please enter a valid email address' });
      } else {
        Alert.alert('Sign Up Error', error.message || 'An unexpected error occurred');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Google Sign Up Error', error.message || 'An unexpected error occurred');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setSocialLoading('apple');
    
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Apple Sign Up Error', error.message || 'An unexpected error occurred');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <AuthLayout>
      <LoadingOverlay visible={loading || isSubmitting} message="Creating your account..." />
      
      <View style={styles.header}>
        <H1 style={styles.title}>Create Account</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          Join Stylisto to start building your perfect wardrobe
        </BodyMedium>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Full Name"
              value={value}
              onChangeText={onChange}
              error={errors.fullName?.message}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              leftIcon={<User size={20} color={Colors.text.secondary} />}
            />
          )}
        />

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
              returnKeyType="next"
              leftIcon={<Mail size={20} color={Colors.text.secondary} />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Password"
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
              label="Confirm Password"
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
              placeholder="Confirm your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
              leftIcon={<Lock size={20} color={Colors.text.secondary} />}
            />
          )}
        />

        <View style={styles.termsContainer}>
          <BodyMedium color="secondary" style={styles.termsText}>
            By creating an account, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </BodyMedium>
        </View>

        <Button
          title="Create Account"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={loading || !!socialLoading}
          style={styles.signUpButton}
        />
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtons}>
        <SocialLoginButton
          provider="google"
          onPress={handleGoogleLogin}
          loading={socialLoading === 'google'}
          disabled={loading || isSubmitting || !!socialLoading}
        />
        
        <SocialLoginButton
          provider="apple"
          onPress={handleAppleLogin}
          loading={socialLoading === 'apple'}
          disabled={loading || isSubmitting || !!socialLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/(auth)/login" asChild>
            <Text style={styles.footerLink}>Sign in</Text>
          </Link>
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.lg,
  },
  termsContainer: {
    marginBottom: Spacing.lg,
  },
  termsText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary[700],
    fontWeight: '500',
  },
  signUpButton: {
    marginTop: Spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.primary,
  },
  dividerText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginHorizontal: Spacing.md,
  },
  socialButtons: {
    marginBottom: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.md,
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