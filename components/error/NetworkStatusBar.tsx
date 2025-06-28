import * as Network from 'expo-network';
import { CloudOff, Wifi, WifiOff } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  AppStateStatus,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import {
  ErrorCategory,
  errorHandling,
  ErrorSeverity,
} from '../../lib/errorHandling';

interface NetworkStatusBarProps {
  onNetworkStatusChange?: (isConnected: boolean) => void;
}

export const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({
  onNetworkStatusChange,
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isServerReachable, setIsServerReachable] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const translateY = useRef(new Animated.Value(-50)).current;
  const appState = useRef(AppState.currentState);

  // Check if we're in web development environment
  const isWebDevelopment = () => {
    return (
      typeof window !== 'undefined' &&
      window.location?.hostname === 'localhost' &&
      process.env.NODE_ENV === 'development'
    );
  };

  // Check network status
  const checkNetworkStatus = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const connected = networkState.isConnected ?? false;
      const type = networkState.type ?? null;

      setIsConnected(connected);
      setConnectionType(type);
      setLastChecked(new Date());

      // In web development mode, assume server is reachable if network is connected
      // This avoids unnecessary API calls that might fail due to CORS or missing keys
      if (isWebDevelopment()) {
        setIsServerReachable(connected);
        onNetworkStatusChange?.(connected);

        // Animate the status bar
        Animated.timing(translateY, {
          toValue: !connected ? 0 : -50,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }).start();

        return; // Skip server health check in web development
      }

      // Check server reachability if connected
      if (connected) {
        try {
          // Use a lightweight endpoint to check server connectivity
          const apiUrl =
            process.env.EXPO_PUBLIC_SUPABASE_URL ||
            'https://ywbbsdqdkucrvyowukcs.supabase.co';

          // Create AbortController for timeout instead of AbortSignal.timeout which is not supported in React Native
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 3000);

          // Use the REST API endpoint instead of /health which doesn't exist
          // This endpoint exists and will return 200 or a proper HTTP status
          const response = await fetch(`${apiUrl}/rest/v1/`, {
            method: 'HEAD',
            headers: {
              'Cache-Control': 'no-cache',
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
            },
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          // Consider 401 as server reachable (just not authenticated)
          // Consider 200, 401, 403 as server reachable
          const isReachable =
            response.status === 200 ||
            response.status === 401 ||
            response.status === 403;
          setIsServerReachable(isReachable);
        } catch (error) {
          // Only set unreachable for actual network errors, not auth errors
          const isNetworkError =
            error instanceof TypeError ||
            (error instanceof Error && error.name === 'AbortError');

          if (isNetworkError) {
            setIsServerReachable(false);

            // Log only actual network connectivity issues
            errorHandling.captureMessage('Server connectivity issue', {
              severity: ErrorSeverity.WARNING,
              category: ErrorCategory.NETWORK,
              context: {
                action: 'server_reachability_check',
                additionalData: {
                  isConnected: connected,
                  connectionType: type,
                  error: error instanceof Error ? error.message : String(error),
                },
              },
            });
          } else {
            // Auth errors mean server is reachable
            setIsServerReachable(true);
          }
        }
      } else {
        setIsServerReachable(false);
      }

      // Notify parent component
      onNetworkStatusChange?.(connected && isServerReachable);

      // Update error handling service
      errorHandling.updateNetworkStatus();

      // Animate the status bar
      Animated.timing(translateY, {
        toValue: !connected || !isServerReachable ? 0 : -50,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
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
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground, check network status
      checkNetworkStatus();
    }

    appState.current = nextAppState;
  };

  // Set up network status monitoring
  useEffect(() => {
    // Initial check
    checkNetworkStatus();

    // Set up app state change listener
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Set up periodic checks instead of network listener (which is unreliable)
    const intervalId = setInterval(checkNetworkStatus, 30000); // Check every 30 seconds

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  // Get status message and icon
  const getStatusInfo = () => {
    if (!isConnected) {
      return {
        message: 'No internet connection',
        icon: <WifiOff size={16} color={Colors.white} />,
        style: styles.offlineBar,
      };
    } else if (!isServerReachable) {
      return {
        message: 'Server unreachable',
        icon: <CloudOff size={16} color={Colors.white} />,
        style: styles.serverErrorBar,
      };
    } else {
      return {
        message: 'Connected',
        icon: <Wifi size={16} color={Colors.white} />,
        style: styles.onlineBar,
      };
    }
  };

  const { message, icon, style } = getStatusInfo();

  return (
    <Animated.View
      style={[styles.container, style, { transform: [{ translateY }] }]}
    >
      <View style={styles.content}>
        {icon}
        <Text style={styles.statusText}>{message}</Text>
        {connectionType && isConnected && (
          <Text style={styles.typeText}>({connectionType})</Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 1000,
  },
  offlineBar: {
    backgroundColor: Colors.error[600],
  },
  serverErrorBar: {
    backgroundColor: Colors.warning[600],
  },
  onlineBar: {
    backgroundColor: Colors.success[600],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  statusText: {
    ...Typography.body.small,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
  typeText: {
    ...Typography.caption.small,
    color: Colors.white,
    marginLeft: Spacing.xs,
    opacity: 0.8,
  },
});
