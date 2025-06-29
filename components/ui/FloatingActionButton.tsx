import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants';

interface FloatingActionButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  iconSize?: number;
  gradientColors?: readonly [string, string, ...string[]];
  icon?: 'plus' | 'stylisto-logo';
}

const StylistoLogoIcon = ({
  size = 24,
  color = '#ffffff',
}: {
  size?: number;
  color?: string;
}) => {
  const strokeWidth = size >= 32 ? 4 : 3.5;
  const adjustedSize = size * 0.85;

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          position: 'relative',
          width: adjustedSize,
          height: adjustedSize,
        }}
      >
        {/* First diagonal line (top-left to bottom-right) */}
        <View
          style={{
            position: 'absolute',
            top: adjustedSize * 0.12,
            left: adjustedSize * 0.12,
            width: adjustedSize * 0.76,
            height: strokeWidth,
            backgroundColor: color,
            transform: [{ rotate: '45deg' }],
            borderRadius: strokeWidth / 2,
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        />
        {/* Second diagonal line (top-right to bottom-left) */}
        <View
          style={{
            position: 'absolute',
            top: adjustedSize * 0.12,
            right: adjustedSize * 0.12,
            width: adjustedSize * 0.76,
            height: strokeWidth,
            backgroundColor: color,
            transform: [{ rotate: '-45deg' }],
            borderRadius: strokeWidth / 2,
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        />
      </View>
    </View>
  );
};

const CustomPlusIcon = ({
  size = 24,
  color = '#ffffff',
}: {
  size?: number;
  color?: string;
}) => {
  const strokeWidth = size >= 32 ? 4.5 : 4;
  const adjustedSize = size * 0.8;

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          position: 'relative',
          width: adjustedSize,
          height: adjustedSize,
        }}
      >
        {/* Horizontal line */}
        <View
          style={{
            position: 'absolute',
            top: (adjustedSize - strokeWidth) / 2,
            left: adjustedSize * 0.15,
            width: adjustedSize * 0.7,
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
          }}
        />
        {/* Vertical line */}
        <View
          style={{
            position: 'absolute',
            left: (adjustedSize - strokeWidth) / 2,
            top: adjustedSize * 0.15,
            width: strokeWidth,
            height: adjustedSize * 0.7,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
          }}
        />
      </View>
    </View>
  );
};

export function FloatingActionButton({
  onPress,
  disabled = false,
  style,
  size = 56,
  backgroundColor = '#ff4757',
  iconColor = '#ffffff',
  iconSize = 24,
  gradientColors = [Colors.primary[500], Colors.secondary[500]], // Default to Stylisto brand colors
  icon = 'plus',
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

  const renderIcon = () => {
    if (icon === 'stylisto-logo') {
      return (
        <StylistoLogoIcon
          size={iconSize}
          color={disabled ? '#6b7280' : iconColor}
        />
      );
    }

    return (
      <CustomPlusIcon
        size={iconSize}
        color={disabled ? '#6b7280' : iconColor}
      />
    );
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
          {renderIcon()}
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
    shadowColor: Colors.primary[500],
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
