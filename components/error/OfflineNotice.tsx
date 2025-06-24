import * as Network from 'expo-network';
import { WifiOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';

export const OfflineNotice: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    let isMounted = true;
    let networkSubscription: any;
    let onlineListener: (() => void) | undefined;
    let offlineListener: (() => void) | undefined;

    // Check network status initially and set up listener
    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        if (isMounted) {
          const isConnected = networkState.isConnected;
          setIsOffline(!isConnected);

          if (isConnected) {
            setLastOnlineTime(new Date());
          }

          // Animate based on connection status
          Animated.timing(slideAnim, {
            toValue: !isConnected ? 0 : -100,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Failed to check network status:', error);
      }
    };

    // Set up network change listener
    if (Platform.OS !== 'web') {
      // For native platforms, use event listener
      networkSubscription = Network.addNetworkStateListener(
        ({ isConnected }) => {
          if (isMounted) {
            setIsOffline(!isConnected);

            if (isConnected) {
              setLastOnlineTime(new Date());
            }

            // Animate based on connection status
            Animated.timing(slideAnim, {
              toValue: !isConnected ? 0 : -100,
              duration: 300,
              easing: Easing.ease,
              useNativeDriver: true,
            }).start();
          }
        }
      );
    } else {
      // For web, use window events
      onlineListener = () => {
        if (isMounted) {
          setIsOffline(false);
          setLastOnlineTime(new Date());

          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }).start();
        }
      };

      offlineListener = () => {
        if (isMounted) {
          setIsOffline(true);

          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }).start();
        }
      };

      window.addEventListener('online', onlineListener);
      window.addEventListener('offline', offlineListener);
    }

    // Initial check
    checkNetworkStatus();

    // Set up periodic checks
    const intervalId = setInterval(checkNetworkStatus, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);

      // Clean up listeners
      if (Platform.OS !== 'web' && networkSubscription) {
        networkSubscription.remove();
      } else if (Platform.OS === 'web') {
        if (onlineListener) {
          window.removeEventListener('online', onlineListener);
        }
        if (offlineListener) {
          window.removeEventListener('offline', offlineListener);
        }
      }
    };
  }, [slideAnim]);

  // Format time since last online
  const getTimeSinceLastOnline = () => {
    if (!lastOnlineTime) return '';

    const now = new Date();
    const diffMs = now.getTime() - lastOnlineTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins === 1) {
      return '1 minute ago';
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) {
        return '1 hour ago';
      } else {
        return `${diffHours} hours ago`;
      }
    }
  };

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <WifiOff size={16} color={Colors.white} />
        <Text style={styles.text}>
          You&apos;re offline
          {lastOnlineTime && ` • Last online ${getTimeSinceLastOnline()}`}
        </Text>
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
    backgroundColor: Colors.error[600],
    zIndex: 1000,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  text: {
    ...Typography.body.small,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
});
