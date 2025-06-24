import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import * as Network from 'expo-network';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export const OfflineNotice: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  
  useEffect(() => {
    let isMounted = true;
    let networkListener: any;
    
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
      networkListener = Network.addNetworkStateListener(({ isConnected }) => {
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
      });
    } else {
      // For web, use window events
      window.addEventListener('online', () => {
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
      });
      
      window.addEventListener('offline', () => {
        if (isMounted) {
          setIsOffline(true);
          
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }).start();
        }
      });
    }
    
    // Initial check
    checkNetworkStatus();
    
    // Set up periodic checks
    const intervalId = setInterval(checkNetworkStatus, 10000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      
      // Clean up listeners
      if (Platform.OS !== 'web' && networkListener) {
        Network.removeNetworkStateListener(networkListener);
      } else {
        window.removeEventListener('online', () => {});
        window.removeEventListener('offline', () => {});
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
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <WifiOff size={16} color={Colors.white} />
        <Text style={styles.text}>
          You're offline
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