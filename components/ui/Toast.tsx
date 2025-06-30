import { Heart } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';

export interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onHide: () => void;
  type?: 'success' | 'error' | 'info';
}

const { width: screenWidth } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  duration = 3000,
  onHide,
  type = 'success',
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return Colors.success[500];
      case 'error':
        return Colors.error[500];
      case 'info':
        return Colors.primary[500];
      default:
        return Colors.success[500];
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.toast}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Heart size={20} color={getIconColor()} fill={getIconColor()} />
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10000,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: Layout.borderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minWidth: screenWidth - Spacing.lg * 2,
    maxWidth: screenWidth - Spacing.lg * 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.lg,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.sm,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
});
