import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

// Error severity levels
export enum ErrorSeverity {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug',
}

// Error categories for better organization
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'authentication',
  DATABASE = 'database',
  UI = 'ui',
  NAVIGATION = 'navigation',
  STORAGE = 'storage',
  CAMERA = 'camera',
  PERMISSIONS = 'permissions',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  UNKNOWN = 'unknown',
}

// Interface for error context
export interface ErrorContext {
  userId?: string;
  email?: string;
  screen?: string;
  action?: string;
  additionalData?: Record<string, any>;
}

// Interface for error options
export interface ErrorOptions {
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  context?: ErrorContext;
  shouldReport?: boolean;
  userMessage?: string;
}

// Default error options
const defaultErrorOptions: ErrorOptions = {
  severity: ErrorSeverity.ERROR,
  category: ErrorCategory.UNKNOWN,
  shouldReport: true,
};

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private isInitialized = false;
  private networkStatus: { isConnected: boolean; type?: string } = {
    isConnected: true,
  };
  private errorQueue: { error: Error; options?: ErrorOptions }[] = [];
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute
  private flushInterval: any = null;
  private readonly ERROR_STORAGE_KEY = '@stylisto_error_logs';

  // Get singleton instance
  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  // Initialize the error handling service
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Start monitoring network status
      await this.updateNetworkStatus();

      // Set up interval to flush error queue
      this.flushInterval = setInterval(
        () => this.flushErrorQueue(),
        this.FLUSH_INTERVAL
      );

      // Load any stored errors from previous sessions
      await this.loadStoredErrors();

      this.isInitialized = true;
      console.log(
        '[info][errorHandling] Error handling service initialized successfully'
      );
    } catch (error) {
      console.error('Failed to initialize error handling service:', error);
    }
  }

  // Capture and report an error
  captureError(error: Error, options?: ErrorOptions): string {
    const mergedOptions = { ...defaultErrorOptions, ...options };
    const { severity, category, context, shouldReport } = mergedOptions;

    // Log error to console in development
    if (__DEV__) {
      console.error(
        `[${severity}][${category}] ${error.message}`,
        error,
        context
      );
    }

    // Add to queue if offline or should not report immediately
    if (!this.networkStatus.isConnected || !shouldReport) {
      this.queueError(error, mergedOptions);
      return 'error-queued';
    }

    // For now, just log the error since Sentry is causing issues
    console.error(`[Error] ${category}: ${error.message}`, {
      error,
      context,
      severity,
    });

    return 'error-logged';
  }

  // Capture a message (for non-error events)
  captureMessage(message: string, options?: ErrorOptions): string {
    const mergedOptions = { ...defaultErrorOptions, ...options };
    const { severity, category, context, shouldReport } = mergedOptions;

    // Log message to console in development
    if (__DEV__) {
      console.log(`[${severity}][${category}] ${message}`, context);
    }

    return 'message-logged';
  }

  // Set user context
  setUser(id: string, email?: string, username?: string) {
    if (__DEV__) {
      console.log('[info][errorHandling] User context set', {
        id,
        email,
        username,
      });
    }
  }

  // Clear user context
  clearUser() {
    if (__DEV__) {
      console.log('[info][errorHandling] User context cleared');
    }
  }

  // Set additional context
  setContext(name: string, context: Record<string, any>) {
    if (__DEV__) {
      console.log(`[info][errorHandling] Context set: ${name}`, context);
    }
  }

  // Update network status
  async updateNetworkStatus() {
    try {
      const networkState = await Network.getNetworkStateAsync();
      this.networkStatus = {
        isConnected: networkState.isConnected ?? true,
        type: networkState.type,
      };
    } catch (error) {
      console.warn('Failed to get network status:', error);
      this.networkStatus = { isConnected: true };
    }
  }

  // Check if device is online
  isOnline(): boolean {
    return this.networkStatus.isConnected;
  }

  // Cleanup resources
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  private queueError(error: Error, options?: ErrorOptions) {
    // Prevent queue from growing too large
    if (this.errorQueue.length >= this.MAX_QUEUE_SIZE) {
      this.errorQueue.shift(); // Remove oldest error
    }

    this.errorQueue.push({ error, options });

    // Store in AsyncStorage
    this.storeErrorQueue();
  }

  private async flushErrorQueue() {
    // Skip if no connection or empty queue
    if (!this.networkStatus.isConnected || this.errorQueue.length === 0) {
      return;
    }

    // Process each error in the queue
    const errorQueue = [...this.errorQueue];
    this.errorQueue = [];

    for (const { error, options } of errorQueue) {
      try {
        this.captureError(error, { ...options, shouldReport: true });
      } catch (reportingError) {
        console.error('Failed to report queued error:', reportingError);
        // Re-queue the error if reporting fails
        this.queueError(error, options);
      }
    }

    // Update stored queue
    await this.storeErrorQueue();
  }

  private async storeErrorQueue() {
    try {
      // Only store if there are errors
      if (this.errorQueue.length > 0) {
        // Convert errors to a serializable format
        const serializableErrors = this.errorQueue.map(
          ({ error, options }) => ({
            message: error.message,
            stack: error.stack,
            name: error.name,
            options,
          })
        );

        await AsyncStorage.setItem(
          this.ERROR_STORAGE_KEY,
          JSON.stringify(serializableErrors)
        );
      } else {
        // Clear stored errors if queue is empty
        await AsyncStorage.removeItem(this.ERROR_STORAGE_KEY);
      }
    } catch (storageError) {
      console.error('Failed to store error queue:', storageError);
    }
  }

  private async loadStoredErrors() {
    try {
      const storedErrors = await AsyncStorage.getItem(this.ERROR_STORAGE_KEY);

      if (storedErrors) {
        const parsedErrors = JSON.parse(storedErrors);

        // Convert serialized errors back to Error objects
        parsedErrors.forEach((item: any) => {
          const error = new Error(item.message);
          error.stack = item.stack;
          error.name = item.name;

          this.queueError(error, item.options);
        });

        // Try to flush immediately if we're online
        if (this.networkStatus.isConnected) {
          this.flushErrorQueue();
        }
      }
    } catch (loadError) {
      console.error('Failed to load stored errors:', loadError);
    }
  }
}

export const errorHandling = ErrorHandlingService.getInstance();

// Custom error classes
export class AppError extends Error {
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: ErrorContext;
  userMessage?: string;

  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.name = 'AppError';
    const { severity, category, context, userMessage } = {
      ...defaultErrorOptions,
      ...options,
    };
    this.severity = severity!;
    this.category = category!;
    this.context = context;
    this.userMessage = userMessage;
  }
}

export class NetworkError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      category: ErrorCategory.NETWORK,
      ...options,
    });
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      category: ErrorCategory.AUTH,
      ...options,
    });
    this.name = 'AuthError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      category: ErrorCategory.DATABASE,
      ...options,
    });
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.WARNING,
      ...options,
    });
    this.name = 'ValidationError';
  }
}

// Helper function to handle API errors
export const handleApiError = (
  error: any,
  defaultMessage = 'An unexpected error occurred'
): AppError => {
  // Network errors
  if (
    error.message?.includes('Network request failed') ||
    error.message?.includes('Failed to fetch')
  ) {
    return new NetworkError(
      'Network connection error. Please check your internet connection and try again.',
      {
        severity: ErrorSeverity.ERROR,
        userMessage:
          'Unable to connect to the server. Please check your internet connection and try again.',
      }
    );
  }

  // Timeout errors
  if (
    error.message?.includes('timeout') ||
    error.message?.includes('timed out')
  ) {
    return new NetworkError('Request timed out. Please try again later.', {
      severity: ErrorSeverity.ERROR,
      userMessage:
        'The server is taking too long to respond. Please try again later.',
    });
  }

  // Authentication errors
  if (
    error.status === 401 ||
    error.message?.includes('Unauthorized') ||
    error.message?.includes('Invalid credentials')
  ) {
    return new AuthError('Authentication failed. Please sign in again.', {
      severity: ErrorSeverity.ERROR,
      userMessage: 'Your session has expired. Please sign in again.',
    });
  }

  // Permission errors
  if (
    error.status === 403 ||
    error.message?.includes('Forbidden') ||
    error.message?.includes('Permission denied')
  ) {
    return new AuthError('Permission denied.', {
      severity: ErrorSeverity.ERROR,
      userMessage: "You don't have permission to perform this action.",
    });
  }

  // Not found errors
  if (error.status === 404 || error.message?.includes('Not found')) {
    return new AppError('Resource not found.', {
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.BUSINESS_LOGIC,
      userMessage: 'The requested resource could not be found.',
    });
  }

  // Validation errors
  if (error.status === 422 || error.message?.includes('Validation')) {
    return new ValidationError(error.message || 'Validation error.', {
      userMessage: error.message || 'Please check your input and try again.',
    });
  }

  // Server errors
  if (error.status >= 500 || error.message?.includes('Server error')) {
    return new AppError('Server error. Please try again later.', {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.EXTERNAL_SERVICE,
      userMessage:
        "We're experiencing technical difficulties. Please try again later.",
    });
  }

  // Default error
  return new AppError(error.message || defaultMessage, {
    userMessage: defaultMessage,
  });
};
