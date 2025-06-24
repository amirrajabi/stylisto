import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { errorHandling, ErrorSeverity, ErrorCategory, AppError } from '../lib/errorHandling';

// Function to show a user-friendly error message
export const showErrorMessage = (
  error: unknown, 
  options?: { 
    title?: string; 
    fallbackMessage?: string;
    showAlert?: boolean;
    navigateToErrorScreen?: boolean;
  }
) => {
  const { 
    title = 'Error', 
    fallbackMessage = 'An unexpected error occurred. Please try again.',
    showAlert = true,
    navigateToErrorScreen = false,
  } = options || {};
  
  // Extract error message
  let errorMessage: string;
  let errorStack: string | undefined;
  
  if (error instanceof AppError) {
    errorMessage = error.userMessage || error.message;
    errorStack = error.stack;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
  } else {
    errorMessage = fallbackMessage;
  }
  
  // Log the error
  if (error instanceof Error) {
    errorHandling.captureError(error);
  } else {
    errorHandling.captureMessage(errorMessage, {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.UNKNOWN,
    });
  }
  
  // Show alert if enabled
  if (showAlert && Platform.OS !== 'web') {
    Alert.alert(title, errorMessage);
  }
  
  // Navigate to error screen if enabled
  if (navigateToErrorScreen) {
    router.push({
      pathname: '/+error',
      params: {
        message: errorMessage,
        stack: errorStack,
      },
    });
  }
  
  return errorMessage;
};

// Function to handle API errors
export const handleApiError = (error: unknown, options?: {
  fallbackMessage?: string;
  showAlert?: boolean;
  navigateToErrorScreen?: boolean;
  context?: Record<string, any>;
}) => {
  const { 
    fallbackMessage = 'An error occurred while communicating with the server.',
    showAlert = true,
    navigateToErrorScreen = false,
    context,
  } = options || {};
  
  // Log the error with context
  if (error instanceof Error) {
    errorHandling.captureError(error, {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.NETWORK,
      context,
    });
  } else {
    errorHandling.captureMessage(fallbackMessage, {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.NETWORK,
      context,
    });
  }
  
  // Extract error message
  let errorMessage: string;
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    errorMessage = (error as { message: string }).message;
  } else {
    errorMessage = fallbackMessage;
  }
  
  // Show alert if enabled
  if (showAlert && Platform.OS !== 'web') {
    Alert.alert('Error', errorMessage);
  }
  
  // Navigate to error screen if enabled
  if (navigateToErrorScreen) {
    router.push({
      pathname: '/+error',
      params: {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
  
  return errorMessage;
};

// Function to handle form validation errors
export const handleValidationError = (error: unknown, setError?: (field: string, error: { message: string }) => void) => {
  if (error instanceof Error) {
    // Check if it's a Zod validation error
    if (error.name === 'ZodError' && 'format' in error && typeof (error as any).format === 'function') {
      const formattedError = (error as any).format();
      
      // Set field errors if setError function is provided
      if (setError) {
        Object.entries(formattedError.fieldErrors || {}).forEach(([field, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
            setError(field, { message: errors[0] as string });
          }
        });
      }
      
      // Return the first error message
      const firstField = Object.keys(formattedError.fieldErrors || {})[0];
      const firstError = firstField ? formattedError.fieldErrors[firstField][0] : 'Validation error';
      
      return firstError as string;
    }
  }
  
  // For other types of errors, use the general error handler
  return showErrorMessage(error, { title: 'Validation Error', fallbackMessage: 'Please check your input and try again.' });
};

// Function to create a safe async function that catches errors
export const createSafeAsyncFunction = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: unknown) => void
) => {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        showErrorMessage(error);
      }
      return undefined;
    }
  };
};