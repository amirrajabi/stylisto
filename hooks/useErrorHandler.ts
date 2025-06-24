import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { errorHandling, ErrorSeverity, ErrorCategory, AppError } from '../lib/errorHandling';

interface ErrorState {
  hasError: boolean;
  message: string | null;
  details: string | null;
  severity: ErrorSeverity;
  timestamp: Date | null;
}

interface UseErrorHandlerOptions {
  captureInSentry?: boolean;
  showAlert?: boolean;
  context?: {
    screen?: string;
    action?: string;
    userId?: string;
    [key: string]: any;
  };
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { captureInSentry = true, showAlert = true, context = {} } = options;
  
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: null,
    details: null,
    severity: ErrorSeverity.ERROR,
    timestamp: null,
  });
  
  const handleError = useCallback((error: unknown, customMessage?: string) => {
    // Extract error details
    let errorMessage: string;
    let errorDetails: string | null = null;
    let severity = ErrorSeverity.ERROR;
    
    if (error instanceof AppError) {
      errorMessage = error.userMessage || error.message;
      errorDetails = error.stack || null;
      severity = error.severity;
    } else if (error instanceof Error) {
      errorMessage = customMessage || error.message;
      errorDetails = error.stack || null;
    } else {
      errorMessage = customMessage || 'An unexpected error occurred';
      errorDetails = error ? JSON.stringify(error) : null;
    }
    
    // Update error state
    setErrorState({
      hasError: true,
      message: errorMessage,
      details: errorDetails,
      severity,
      timestamp: new Date(),
    });
    
    // Capture in Sentry if enabled
    if (captureInSentry) {
      if (error instanceof Error) {
        errorHandling.captureError(error, {
          context: {
            ...context,
            customMessage,
          },
        });
      } else {
        errorHandling.captureMessage(errorMessage, {
          severity,
          category: ErrorCategory.UNKNOWN,
          context,
        });
      }
    }
    
    // Show alert if enabled
    if (showAlert && Platform.OS !== 'web') {
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
    
    return errorMessage;
  }, [captureInSentry, showAlert, context]);
  
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      message: null,
      details: null,
      severity: ErrorSeverity.ERROR,
      timestamp: null,
    });
  }, []);
  
  const reportFeedback = useCallback((feedback: string, email?: string) => {
    // Send user feedback to Sentry
    Sentry.captureUserFeedback({
      email: email || 'anonymous@user.com',
      name: email ? email.split('@')[0] : 'Anonymous User',
      comments: feedback,
    });
    
    // Add additional context
    Sentry.withScope(scope => {
      scope.setContext('user_feedback', {
        feedback,
        email,
        screen: context.screen,
        action: context.action,
      });
      
      if (errorState.hasError && errorState.details) {
        // If there's an active error, associate the feedback with it
        const error = new Error(errorState.message || 'User reported error');
        error.stack = errorState.details;
        Sentry.captureException(error);
      } else {
        // Otherwise, just send as a message
        Sentry.captureMessage('User feedback', {
          level: 'info',
        });
      }
    });
  }, [context, errorState]);
  
  return {
    error: errorState,
    handleError,
    clearError,
    reportFeedback,
  };
};