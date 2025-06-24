import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { CircleAlert as AlertCircle, RefreshCw, Home } from 'lucide-react-native';
import * as Sentry from '@sentry/react-native';
import { errorHandling, ErrorSeverity, ErrorCategory } from '../lib/errorHandling';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, Layout } from '../constants/Spacing';
import { Shadows } from '../constants/Shadows';

export default function ErrorScreen() {
  const params = useLocalSearchParams<{ message?: string; stack?: string }>();
  const { message, stack } = params;
  
  // Report error to Sentry
  useEffect(() => {
    if (message) {
      const error = new Error(message);
      if (stack) {
        error.stack = stack;
      }
      
      errorHandling.captureError(error, {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NAVIGATION,
        context: {
          screen: 'ErrorScreen',
          action: 'navigation_error',
        },
      });
    }
  }, [message, stack]);
  
  const handleRetry = () => {
    router.back();
  };
  
  const handleGoHome = () => {
    router.replace('/(tabs)');
  };
  
  const handleReportError = () => {
    // Send additional feedback to Sentry
    Sentry.captureUserFeedback({
      email: 'user@example.com', // In a real app, get this from the user
      name: 'User', // In a real app, get this from the user
      comments: `Error: ${message || 'Unknown error'}\nUser reported this error manually.`,
    });
    
    // Show confirmation to user
    alert('Thank you for reporting this error. Our team has been notified.');
  };
  
  return (
    <>
      <Stack.Screen options={{ title: 'Error', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <AlertCircle size={64} color={Colors.error[500]} />
        </View>
        
        <Text style={styles.title}>Something went wrong</Text>
        
        <Text style={styles.message}>
          {message || 'An unexpected error occurred. Please try again.'}
        </Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <RefreshCw size={20} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <Home size={20} color={Colors.text.primary} />
            <Text style={styles.secondaryButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
        
        {stack && (
          <ScrollView style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Error Details</Text>
            <Text style={styles.stackTrace}>{stack}</Text>
            
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={handleReportError}
            >
              <Text style={styles.reportButtonText}>Report This Error</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actionsContainer: {
    width: '100%',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    ...Shadows.sm,
  },
  primaryButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    ...Shadows.sm,
  },
  secondaryButtonText: {
    ...Typography.button.medium,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  detailsContainer: {
    width: '100%',
    maxHeight: 300,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  detailsTitle: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  stackTrace: {
    ...Typography.caption.medium,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.error[700],
    marginBottom: Spacing.md,
  },
  reportButton: {
    backgroundColor: Colors.error[500],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
  reportButtonText: {
    ...Typography.button.small,
    color: Colors.white,
  },
});