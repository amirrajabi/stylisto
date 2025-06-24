import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, Key, Mail, Send } from 'lucide-react-native';
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
import { useAuth } from '../../hooks/useAuth';

// Validation schemas
const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function LoginScreen() {
  const { sendOTP, verifyOTP, loading } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [emailAddress, setEmailAddress] = useState('');
  const [countdown, setCountdown] = useState(0);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Countdown timer for resend OTP
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown => countdown - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  const onSendOTP = async (data: EmailFormData) => {
    try {
      await sendOTP(data.email);
      setEmailAddress(data.email);
      setStep('otp');
      setCountdown(60); // 60 seconds countdown

      Alert.alert(
        'OTP Sent',
        `We have sent a verification code to ${data.email}. Please check your email and enter the 6-digit code below.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      if (error.message.includes('Invalid email')) {
        emailForm.setError('email', {
          message: 'Please enter a valid email address',
        });
      } else if (error.message.includes('Rate limit')) {
        Alert.alert(
          'Too Many Requests',
          'Please wait a moment before requesting another code.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to send verification code'
        );
      }
    }
  };

  const onVerifyOTP = async (data: OTPFormData) => {
    try {
      await verifyOTP(emailAddress, data.otp);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (
        error.message.includes('Invalid token') ||
        error.message.includes('expired')
      ) {
        otpForm.setError('otp', {
          message: 'Invalid or expired verification code',
        });
      } else if (error.message.includes('Too many attempts')) {
        Alert.alert(
          'Too Many Attempts',
          'Too many failed attempts. Please request a new code.',
          [
            {
              text: 'OK',
              onPress: () => {
                setStep('email');
                emailForm.reset();
                otpForm.reset();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Verification Error',
          error.message || 'Failed to verify code'
        );
      }
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    try {
      await sendOTP(emailAddress);
      setCountdown(60);
      Alert.alert(
        'Code Resent',
        'A new verification code has been sent to your email.'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to resend verification code'
      );
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCountdown(0);
    otpForm.reset();
  };

  if (step === 'email') {
    return (
      <AuthLayout>
        <LoadingOverlay
          visible={loading || emailForm.formState.isSubmitting}
          message="Sending code..."
        />

        <View style={styles.header}>
          <H1 style={styles.title}>Welcome to Stylisto</H1>
          <BodyMedium color="secondary" style={styles.subtitle}>
            Enter your email to get started
          </BodyMedium>
        </View>

        <View style={styles.form}>
          <Controller
            control={emailForm.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Email Address"
                value={value}
                onChangeText={onChange}
                error={emailForm.formState.errors.email?.message}
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="go"
                onSubmitEditing={emailForm.handleSubmit(onSendOTP)}
                leftIcon={<Mail size={20} color={Colors.primary[600]} />}
              />
            )}
          />

          <BodySmall color="secondary" style={styles.helperText}>
            A verification code will be sent to your email
          </BodySmall>

          <Button
            title="Send Verification Code"
            onPress={emailForm.handleSubmit(onSendOTP)}
            loading={emailForm.formState.isSubmitting}
            disabled={loading}
            style={styles.sendButton}
            size="large"
            rightIcon={<Send size={20} color={Colors.white} />}
          />

          <View style={styles.footerNote}>
            <BodySmall color="secondary" style={styles.noteText}>
              By signing up, you agree to our{' '}
              <BodySmall color="primary" style={styles.linkText}>
                Terms and Conditions
              </BodySmall>
            </BodySmall>
          </View>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <LoadingOverlay
        visible={loading || otpForm.formState.isSubmitting}
        message="Verifying code..."
      />

      <View style={styles.header}>
        <H1 style={styles.title}>Enter Verification Code</H1>
        <BodyMedium color="secondary" style={styles.subtitle}>
          Enter the 6-digit code sent to {emailAddress}
        </BodyMedium>
      </View>

      <View style={styles.form}>
        <Controller
          control={otpForm.control}
          name="otp"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Verification Code"
              value={value}
              onChangeText={text => onChange(text.slice(0, 6))}
              error={otpForm.formState.errors.otp?.message}
              placeholder="Enter your 6-digit code"
              keyboardType="numeric"
              returnKeyType="go"
              onSubmitEditing={otpForm.handleSubmit(onVerifyOTP)}
              leftIcon={<Key size={20} color={Colors.primary[600]} />}
            />
          )}
        />

        <Button
          title="Verify Code"
          onPress={otpForm.handleSubmit(onVerifyOTP)}
          loading={otpForm.formState.isSubmitting}
          disabled={loading}
          style={styles.verifyButton}
          size="large"
        />

        <View style={styles.resendContainer}>
          {countdown > 0 ? (
            <BodyMedium color="secondary" style={styles.countdownText}>
              Resend code in {countdown} seconds
            </BodyMedium>
          ) : (
            <Button
              title="Resend Code"
              variant="outline"
              onPress={handleResendOTP}
              disabled={loading}
              style={styles.resendButton}
            />
          )}
        </View>

        <Button
          title="Change Email"
          variant="ghost"
          onPress={handleBackToEmail}
          style={styles.changeButton}
          leftIcon={<ArrowLeft size={16} color={Colors.primary[600]} />}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 16,
    paddingHorizontal: Spacing.lg,
  },
  form: {
    width: '100%',
  },
  helperText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    fontSize: 14,
    lineHeight: 20,
  },
  sendButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary[700],
    borderRadius: 12,
    shadowColor: Colors.primary[700],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary[700],
    borderRadius: 12,
    shadowColor: Colors.primary[700],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  countdownText: {
    fontSize: 14,
  },
  resendButton: {
    minWidth: 150,
    borderColor: Colors.primary[400],
    borderWidth: 2,
    borderRadius: 10,
  },
  changeButton: {
    marginTop: Spacing.lg,
  },
  footerNote: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  noteText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  linkText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
