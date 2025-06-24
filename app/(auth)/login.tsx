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
import { Mail, Lock } from 'lucide-react-native';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { SocialLoginButton } from '../../components/auth/SocialLoginButton';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { Button, H1, BodyMedium } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema, LoginFormData } from '../../utils/validation';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      router.replace('/(tabs)');
    } catch (error: any) {
      // Handle specific error types
      if (error.message.includes('Invalid login credentials')) {
        setError('email', { message: 'Invalid email or password' });
        setError('password', { message: 'Invalid email or password' });
      } else if (error.message.includes('Email not confirmed')) {
        Alert.alert(
          'Email Not Verified',
          'Please check your email and click the verification link before signing in.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Sign In Error', error.message || 'An unexpected error occurred');
      }
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    
    try {
      // Implement social login based on platform
      if (Platform.OS === 'web') {
        // Web implementation would use supabase.auth.signInWithOAuth
        Alert.alert('Social Login', `${provider} login would be implemented here`);
      } else {
        // Mobile implementation would use native OAuth
        Alert.alert('Social Login', `${provider} login would be implemented here`);
      }
    } catch (error: any) {
      Alert.alert('Social Login Error', error.message || 'An unexpected error occurred');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <AuthLayout>
      <LoadingOverlay visible={loading || isSubmitting} message="Signing you in..." />
      
      <View style={styles.header}>
        <H1 style={styles.title}>Welcome Back</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          Sign in to your account to continue
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
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
              leftIcon={<Lock size={20} color={Colors.text.secondary} />}
            />
          )}
        />

        <TouchableOpacity style={styles.forgotPassword}>
          <Link href="/(auth)/forgot-password" asChild>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </Link>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={loading}
          style={styles.signInButton}
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
          onPress={() => handleSocialLogin('google')}
          loading={socialLoading === 'google'}
          disabled={loading || isSubmitting}
        />
        
        {Platform.OS === 'ios' && (
          <SocialLoginButton
            provider="apple"
            onPress={() => handleSocialLogin('apple')}
            loading={socialLoading === 'apple'}
            disabled={loading || isSubmitting}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Link href="/(auth)/register" asChild>
            <Text style={styles.footerLink}>Sign up</Text>
          </Link>
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    ...Typography.body.small,
    color: Colors.primary[700],
    fontWeight: '500',
  },
  signInButton: {
    marginTop: Spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
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
    marginBottom: Spacing.xl,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
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