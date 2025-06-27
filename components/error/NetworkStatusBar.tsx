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

  // Check network status
  const checkNetworkStatus = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const connected = networkState.isConnected ?? false;
      const type = networkState.type ?? null;

      setIsConnected(connected);
      setConnectionType(type);
      setLastChecked(new Date());

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

          const response = await fetch(`${apiUrl}/health`, {
            method: 'HEAD',
            headers: { 'Cache-Control': 'no-cache' },
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);
          setIsServerReachable(response.ok);
        } catch (error) {
          setIsServerReachable(false);

          // Log server connectivity issue
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
