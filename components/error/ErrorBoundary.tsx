import * as Sentry from '@sentry/react-native';
import { router } from 'expo-router';
import {
  CircleAlert as AlertCircle,
  ArrowLeft,
  Home,
  RefreshCw,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import {
  ErrorCategory,
  errorHandling,
  ErrorSeverity,
} from '../../lib/errorHandling';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentStack?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentStack,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleGoHome = () => {
    router.replace('/(tabs)');
    resetErrorBoundary();
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
    resetErrorBoundary();
  };

  const handleRetry = () => {
    resetErrorBoundary();
  };

  const handleReportError = () => {
    // Send additional feedback to Sentry
    Sentry.captureUserFeedback({
      email: 'user@example.com', // In a real app, get this from the user
      name: 'User', // In a real app, get this from the user
      comments: `Error: ${error.message}\nUser reported this error manually.`,
    });

    // Show confirmation to user
    alert('Thank you for reporting this error. Our team has been notified.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertCircle size={64} color={Colors.error[500]} />
      </View>

      <Text style={styles.title}>Something went wrong</Text>

      <Text style={styles.message}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </Text>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
          <RefreshCw size={20} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoBack}
          >
            <ArrowLeft size={18} color={Colors.text.primary} />
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
          >
            <Home size={18} color={Colors.text.primary} />
            <Text style={styles.secondaryButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.detailsToggle}
        onPress={() => setShowDetails(!showDetails)}
      >
        <Text style={styles.detailsToggleText}>
          {showDetails ? 'Hide Error Details' : 'Show Error Details'}
        </Text>
      </TouchableOpacity>

      {showDetails && (
        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Error Details</Text>
          <Text style={styles.detailsText}>Name: {error.name}</Text>
          <Text style={styles.detailsText}>Message: {error.message}</Text>
          {error.stack && (
            <>
              <Text style={styles.detailsSubtitle}>Stack Trace:</Text>
              <Text style={styles.stackTrace}>{error.stack}</Text>
            </>
          )}
          {componentStack && (
            <>
              <Text style={styles.detailsSubtitle}>Component Stack:</Text>
              <Text style={styles.stackTrace}>{componentStack}</Text>
            </>
          )}

          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleReportError}
          >
            <Text style={styles.reportButtonText}>Report This Error</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, componentStack: string) => void;
  resetKeys?: any[];
}

export const AppErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback = ErrorFallback,
  onError,
  resetKeys,
}) => {
  const handleError = (error: Error, info: { componentStack: string }) => {
    // Report error to Sentry
    errorHandling.captureError(error, {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.UI,
      context: {
        componentStack: info.componentStack,
      },
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, info.componentStack);
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onError={handleError}
      resetKeys={resetKeys}
    >
      {children}
    </ReactErrorBoundary>
  );
};

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
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  primaryButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.secondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    flex: 0.48,
    ...Shadows.sm,
  },
  secondaryButtonText: {
    ...Typography.button.small,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  detailsToggle: {
    marginBottom: Spacing.md,
  },
  detailsToggleText: {
    ...Typography.body.small,
    color: Colors.primary[700],
    textDecorationLine: 'underline',
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
  detailsSubtitle: {
    ...Typography.body.small,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  detailsText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
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
