import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import React from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface FloatingActionButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  iconSize?: number;
  gradientColors?: readonly [string, string, ...string[]];
}

export function FloatingActionButton({
  onPress,
  disabled = false,
  style,
  size = 56,
  backgroundColor = '#ff4757',
  iconColor = '#ffffff',
  iconSize = 24,
  gradientColors = ['#ff6b6b', '#ff4757', '#ff3742'],
}: FloatingActionButtonProps) {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: scaleValue }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.touchable,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        onPress={onPress}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={disabled ? ['#d1d5db', '#9ca3af'] : gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Plus
            size={iconSize}
            color={disabled ? '#6b7280' : iconColor}
            strokeWidth={2.5}
          />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 25,
    right: 20,
    zIndex: 1000,
  },
  touchable: {
    elevation: 12,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
