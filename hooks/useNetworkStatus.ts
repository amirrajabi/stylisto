import * as Network from 'expo-network';
import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import {
  ErrorCategory,
  errorHandling,
  ErrorSeverity,
} from '../lib/errorHandling';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: Network.NetworkStateType | null;
  isServerReachable: boolean | null;
  lastChecked: Date;
}

interface UseNetworkStatusOptions {
  checkServerUrl?: string;
  checkInterval?: number;
  onStatusChange?: (status: NetworkStatus) => void;
}

export const useNetworkStatus = (options: UseNetworkStatusOptions = {}) => {
  const {
    checkServerUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ||
      'https://ywbbsdqdkucrvyowukcs.supabase.co',
    checkInterval = 30000, // 30 seconds
    onStatusChange,
  } = options;

  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
    isServerReachable: null,
    lastChecked: new Date(),
  });

  const checkNetworkStatus = useCallback(async () => {
    try {
      // Get network state
      const networkState = await Network.getNetworkStateAsync();

      // Check server reachability if connected
      let isServerReachable = null;
      if (
        networkState.isConnected &&
        networkState.isInternetReachable !== false
      ) {
        try {
          // Use a lightweight endpoint to check server connectivity
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(
            `${checkServerUrl}/rest/v1/health_checks?select=status&limit=1`,
            {
              method: 'HEAD',
              headers: {
                'Cache-Control': 'no-cache',
                apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
              },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);
          isServerReachable = response.ok;
        } catch (error) {
          isServerReachable = false;

          // Log server connectivity issue
          errorHandling.captureMessage('Server connectivity issue', {
            severity: ErrorSeverity.WARNING,
            category: ErrorCategory.NETWORK,
            context: {
              action: 'server_reachability_check',
              additionalData: {
                isConnected: networkState.isConnected,
                connectionType: networkState.type,
                error: error instanceof Error ? error.message : String(error),
              },
            },
          });
        }
      }

      // Update status
      const newStatus = {
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
        type: networkState.type,
        isServerReachable,
        lastChecked: new Date(),
      };

      setStatus(newStatus);

      // Notify callback if provided
      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      // Update error handling service
      errorHandling.updateNetworkStatus();
    } catch (error) {
      console.error('Failed to check network status:', error);

      // Log network check error
      errorHandling.captureError(
        error instanceof Error
          ? error
          : new Error('Failed to check network status'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.NETWORK,
        }
      );
    }
  }, [checkServerUrl, onStatusChange]);

  // Handle app state changes
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to the foreground, check network status
        checkNetworkStatus();
      }
    },
    [checkNetworkStatus]
  );

  // Set up network status monitoring
  useEffect(() => {
    let networkListener: any;
    let intervalId: NodeJS.Timeout;

    // Initial check
    checkNetworkStatus();

    // Set up app state change listener
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Set up network change listener
    if (Platform.OS !== 'web') {
      // For native platforms, use event listener
      if (Network.addNetworkStateListener) {
        networkListener = Network.addNetworkStateListener(() => {
          checkNetworkStatus();
        });
      }
    } else {
      // For web, use window events
      window.addEventListener('online', checkNetworkStatus);
      window.addEventListener('offline', checkNetworkStatus);
    }

    // Set up periodic checks
    intervalId = setInterval(checkNetworkStatus, checkInterval);

    return () => {
      subscription.remove();
      clearInterval(intervalId);

      if (Platform.OS !== 'web') {
        if (networkListener && Network.removeNetworkStateListener) {
          Network.removeNetworkStateListener(networkListener);
        }
      } else {
        window.removeEventListener('online', checkNetworkStatus);
        window.removeEventListener('offline', checkNetworkStatus);
      }
    };
  }, [checkNetworkStatus, checkInterval, handleAppStateChange]);

  return {
    ...status,
    checkNetworkStatus,
    isOnline: status.isConnected && status.isInternetReachable !== false,
    isOffline: !status.isConnected || status.isInternetReachable === false,
    hasServerConnection: status.isServerReachable === true,
  };
};
