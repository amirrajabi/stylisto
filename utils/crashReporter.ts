import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { errorHandling, ErrorSeverity, ErrorCategory } from '../lib/errorHandling';

// Interface for crash report data
interface CrashReportData {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: {
    screen?: string;
    action?: string;
    [key: string]: any;
  };
  device: {
    platform: string;
    osVersion?: string;
    model?: string;
    brand?: string;
    appVersion: string;
    timestamp: string;
  };
  user?: {
    id?: string;
    email?: string;
  };
}

// Crash reporter class
class CrashReporter {
  private static instance: CrashReporter;
  private readonly CRASH_LOGS_DIR = `${FileSystem.documentDirectory}crash_logs/`;
  private readonly MAX_STORED_LOGS = 10;
  
  static getInstance(): CrashReporter {
    if (!CrashReporter.instance) {
      CrashReporter.instance = new CrashReporter();
    }
    return CrashReporter.instance;
  }
  
  // Initialize crash reporter
  async initialize() {
    try {
      // Create crash logs directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.CRASH_LOGS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CRASH_LOGS_DIR, { intermediates: true });
      }
      
      // Check for unsent crash reports and send them
      await this.sendStoredCrashReports();
    } catch (error) {
      console.error('Failed to initialize crash reporter:', error);
    }
  }
  
  // Report a crash
  async reportCrash(error: Error, context?: Record<string, any>) {
    try {
      // Create crash report data
      const crashReport: CrashReportData = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context,
        device: {
          platform: Platform.OS,
          osVersion: Platform.OS === 'web' ? navigator.userAgent : Platform.Version.toString(),
          model: await Device.getModelNameAsync(),
          brand: Device.brand,
          appVersion: Constants.expoConfig?.version || '1.0.0',
          timestamp: new Date().toISOString(),
        },
      };
      
      // Try to send crash report immediately
      const sentSuccessfully = await this.sendCrashReport(crashReport);
      
      // If sending failed, store the crash report for later
      if (!sentSuccessfully) {
        await this.storeCrashReport(crashReport);
      }
      
      return sentSuccessfully;
    } catch (reportError) {
      console.error('Failed to report crash:', reportError);
      return false;
    }
  }
  
  // Send a crash report to Sentry
  private async sendCrashReport(crashReport: CrashReportData): Promise<boolean> {
    try {
      // Send to Sentry
      Sentry.withScope(scope => {
        // Set tags
        scope.setTag('platform', crashReport.device.platform);
        scope.setTag('app_version', crashReport.device.appVersion);
        
        // Set user context if available
        if (crashReport.user) {
          scope.setUser({
            id: crashReport.user.id,
            email: crashReport.user.email,
          });
        }
        
        // Set additional context
        if (crashReport.context) {
          scope.setContext('crash_context', crashReport.context);
        }
        
        scope.setContext('device_info', {
          model: crashReport.device.model,
          brand: crashReport.device.brand,
          osVersion: crashReport.device.osVersion,
        });
        
        // Create error object
        const error = new Error(crashReport.error.message);
        error.name = crashReport.error.name;
        if (crashReport.error.stack) {
          error.stack = crashReport.error.stack;
        }
        
        // Capture the exception
        Sentry.captureException(error);
      });
      
      // Also report using our error handling service
      errorHandling.captureError(new Error(crashReport.error.message), {
        severity: ErrorSeverity.FATAL,
        category: ErrorCategory.UNKNOWN,
        context: crashReport.context,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send crash report to Sentry:', error);
      return false;
    }
  }
  
  // Store crash report for later sending
  private async storeCrashReport(crashReport: CrashReportData) {
    try {
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const filename = `${this.CRASH_LOGS_DIR}crash_${timestamp}.json`;
      
      // Write crash report to file
      await FileSystem.writeAsStringAsync(
        filename,
        JSON.stringify(crashReport),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      
      // Limit the number of stored crash reports
      await this.limitStoredCrashReports();
    } catch (error) {
      console.error('Failed to store crash report:', error);
    }
  }
  
  // Send stored crash reports
  async sendStoredCrashReports() {
    try {
      // Get list of crash report files
      const files = await FileSystem.readDirectoryAsync(this.CRASH_LOGS_DIR);
      const crashFiles = files.filter(file => file.startsWith('crash_'));
      
      if (crashFiles.length === 0) {
        return;
      }
      
      // Try to send each crash report
      for (const file of crashFiles) {
        try {
          // Read crash report
          const filePath = `${this.CRASH_LOGS_DIR}${file}`;
          const content = await FileSystem.readAsStringAsync(filePath);
          const crashReport = JSON.parse(content) as CrashReportData;
          
          // Try to send the crash report
          const sentSuccessfully = await this.sendCrashReport(crashReport);
          
          // Delete the file if sent successfully
          if (sentSuccessfully) {
            await FileSystem.deleteAsync(filePath);
          }
        } catch (fileError) {
          console.error(`Failed to process crash report file ${file}:`, fileError);
        }
      }
    } catch (error) {
      console.error('Failed to send stored crash reports:', error);
    }
  }
  
  // Limit the number of stored crash reports
  private async limitStoredCrashReports() {
    try {
      // Get list of crash report files
      const files = await FileSystem.readDirectoryAsync(this.CRASH_LOGS_DIR);
      const crashFiles = files
        .filter(file => file.startsWith('crash_'))
        .sort((a, b) => {
          // Sort by timestamp (newest first)
          const timestampA = parseInt(a.split('_')[1].split('.')[0]);
          const timestampB = parseInt(b.split('_')[1].split('.')[0]);
          return timestampB - timestampA;
        });
      
      // Delete oldest files if we have too many
      if (crashFiles.length > this.MAX_STORED_LOGS) {
        const filesToDelete = crashFiles.slice(this.MAX_STORED_LOGS);
        for (const file of filesToDelete) {
          await FileSystem.deleteAsync(`${this.CRASH_LOGS_DIR}${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to limit stored crash reports:', error);
    }
  }
}

export const crashReporter = CrashReporter.getInstance();