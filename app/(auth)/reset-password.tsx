import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Key } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { BodyMedium, BodySmall, Button, H1 } from '../../components/ui';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { supabase } from '../../lib/supabase';

const resetPasswordSchema = z
  .object({
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

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const params = useLocalSearchParams();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

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
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <AuthLayout>
      <LoadingOverlay visible={loading} message="Updating password..." />

      <View style={styles.header}>
        <Button
          title=""
          onPress={handleBackToLogin}
          style={styles.backButton}
          leftIcon={<ArrowLeft size={20} color={Colors.primary[600]} />}
        />
        <H1 style={styles.title}>Reset Password</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          Enter your new password below
        </BodyMedium>
      </View>

      <View style={styles.form}>
        <View style={styles.mainContent}>
          <Controller
            control={form.control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="New Password"
                value={value}
                onChangeText={onChange}
                error={form.formState.errors.password?.message}
                placeholder="Enter your new password"
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
                label="Confirm New Password"
                value={value}
                onChangeText={onChange}
                error={form.formState.errors.confirmPassword?.message}
                placeholder="Confirm your new password"
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
            title="Update Password"
            onPress={form.handleSubmit(onSubmit)}
            disabled={
              loading || form.formState.isSubmitting || !form.formState.isValid
            }
            style={styles.updateButton}
          />

          <Button
            title="Back to Sign In"
            variant="outline"
            onPress={handleBackToLogin}
            style={styles.backToLoginButton}
          />
        </View>
      </View>
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
    maxWidth: 280,
  },
  form: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    gap: Spacing.md,
  },
  helperText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontSize: 13,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  updateButton: {
    backgroundColor: Colors.primary[600],
  },
  backToLoginButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary[600],
  },
});
