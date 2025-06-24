import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Save } from 'lucide-react-native';
import { useAuth } from '../../../hooks/useAuth';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { H1 } from '../../../components/ui';

export default function ChangePasswordScreen() {
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // In a real app, you would verify the current password first
      // For this demo, we'll skip that step
      
      await updatePassword(newPassword);
      
      Alert.alert(
        'Password Updated',
        'Your password has been updated successfully.',
        [{ 
          text: 'OK',
          onPress: () => router.back()
        }]
      );
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <H1>Change Password</H1>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionDescription}>
            Create a new password for your account. Your password should be at least 6 characters long and include uppercase, lowercase, and numbers.
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={[
              styles.inputContainer,
              errors.currentPassword ? styles.inputError : null
            ]}>
              <Lock size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
                placeholderTextColor={Colors.text.tertiary}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color={Colors.text.secondary} />
                ) : (
                  <Eye size={20} color={Colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
            {errors.currentPassword ? (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            ) : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={[
              styles.inputContainer,
              errors.newPassword ? styles.inputError : null
            ]}>
              <Lock size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter your new password"
                placeholderTextColor={Colors.text.tertiary}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color={Colors.text.secondary} />
                ) : (
                  <Eye size={20} color={Colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            ) : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[
              styles.inputContainer,
              errors.confirmPassword ? styles.inputError : null
            ]}>
              <Lock size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your new password"
                placeholderTextColor={Colors.text.tertiary}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={Colors.text.secondary} />
                ) : (
                  <Eye size={20} color={Colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>
          
          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementItem}>
              <View style={[
                styles.requirementDot,
                newPassword.length >= 6 ? styles.requirementMet : null
              ]} />
              <Text style={styles.requirementText}>At least 6 characters long</Text>
            </View>
            <View style={styles.requirementItem}>
              <View style={[
                styles.requirementDot,
                /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? styles.requirementMet : null
              ]} />
              <Text style={styles.requirementText}>Contains uppercase and lowercase letters</Text>
            </View>
            <View style={styles.requirementItem}>
              <View style={[
                styles.requirementDot,
                /\d/.test(newPassword) ? styles.requirementMet : null
              ]} />
              <Text style={styles.requirementText}>Contains at least one number</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Save size={20} color={Colors.white} />
              <Text style={styles.saveButtonText}>Update Password</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.primary,
  },
  inputError: {
    borderColor: Colors.error[500],
  },
  inputIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  eyeButton: {
    padding: Spacing.md,
  },
  errorText: {
    ...Typography.caption.medium,
    color: Colors.error[600],
    marginTop: Spacing.xs,
  },
  passwordRequirements: {
    backgroundColor: Colors.info[50],
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginTop: Spacing.md,
  },
  requirementsTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral[300],
    marginRight: Spacing.sm,
  },
  requirementMet: {
    backgroundColor: Colors.success[500],
  },
  requirementText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  saveButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
});