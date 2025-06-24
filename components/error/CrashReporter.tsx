import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Sentry from '@sentry/react-native';
import { X, Send } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface CrashReporterProps {
  visible: boolean;
  onClose: () => void;
  error?: Error;
  context?: Record<string, any>;
}

export const CrashReporter: React.FC<CrashReporterProps> = ({
  visible,
  onClose,
  error,
  context,
}) => {
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSubmit = async () => {
    setIsSending(true);
    
    try {
      // Send user feedback to Sentry
      Sentry.captureUserFeedback({
        email: email || 'anonymous@user.com',
        name: email ? email.split('@')[0] : 'Anonymous User',
        comments: `Description: ${description}\n\nSteps to reproduce: ${steps}`,
      });
      
      // Add additional context to the error
      if (error) {
        Sentry.withScope(scope => {
          scope.setContext('user_feedback', {
            email,
            description,
            steps_to_reproduce: steps,
            ...context,
          });
          
          Sentry.captureException(error);
        });
      } else {
        // If no error is provided, send as a message
        Sentry.captureMessage('User-reported issue', {
          level: 'error',
          contexts: {
            user_feedback: {
              email,
              description,
              steps_to_reproduce: steps,
              ...context,
            },
          },
        });
      }
      
      // Show success message
      alert('Thank you for your feedback! Our team has been notified and will investigate the issue.');
      
      // Close the modal
      onClose();
    } catch (sendError) {
      console.error('Failed to send crash report:', sendError);
      alert('Failed to send crash report. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Report an Issue</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContent}>
            <Text style={styles.description}>
              We're sorry you encountered an issue. Please help us improve by providing some details about what happened.
            </Text>
            
            {error && (
              <View style={styles.errorSummary}>
                <Text style={styles.errorTitle}>Error Summary</Text>
                <Text style={styles.errorMessage}>{error.message}</Text>
              </View>
            )}
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Email (optional)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>What happened?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Please describe the issue you encountered..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Steps to Reproduce (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={steps}
                onChangeText={setSteps}
                placeholder="1. I tapped on...\n2. Then I selected...\n3. The app crashed when..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.submitButton, !description && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!description || isSending}
            >
              {isSending ? (
                <Text style={styles.submitButtonText}>Sending...</Text>
              ) : (
                <>
                  <Send size={16} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Send Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface.primary,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    paddingTop: Spacing.lg,
    maxHeight: '80%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  description: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  errorSummary: {
    backgroundColor: Colors.error[50],
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.error[700],
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    ...Typography.body.small,
    color: Colors.error[700],
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  cancelButtonText: {
    ...Typography.button.medium,
    color: Colors.text.primary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  submitButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
});