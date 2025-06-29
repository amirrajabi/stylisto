import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Animated,
  Image,
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
  icon?: 'plus' | 'stylisto-logo' | 'safour-logo' | 'none' | 'app-icon';
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

const SafourIcon = ({
  size = 24,
  disabled = false,
}: {
  size?: number;
  disabled?: boolean;
}) => {
  const strokeWidth = size >= 32 ? 6 : 4;
  const adjustedSize = size * 0.9;

  if (disabled) {
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
          <View
            style={{
              position: 'absolute',
              top: adjustedSize * 0.1,
              left: adjustedSize * 0.1,
              width: adjustedSize * 0.8,
              height: strokeWidth,
              backgroundColor: '#6b7280',
              transform: [{ rotate: '45deg' }],
              borderRadius: strokeWidth / 2,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: adjustedSize * 0.1,
              right: adjustedSize * 0.1,
              width: adjustedSize * 0.8,
              height: strokeWidth,
              backgroundColor: '#6b7280',
              transform: [{ rotate: '-45deg' }],
              borderRadius: strokeWidth / 2,
            }}
          />
        </View>
      </View>
    );
  }

  // For better visibility on background image, use white color with shadow
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
        <View
          style={{
            position: 'absolute',
            top: adjustedSize * 0.1,
            left: adjustedSize * 0.1,
            width: adjustedSize * 0.8,
            height: strokeWidth,
            backgroundColor: '#ffffff',
            transform: [{ rotate: '45deg' }],
            borderRadius: strokeWidth / 2,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: adjustedSize * 0.1,
            right: adjustedSize * 0.1,
            width: adjustedSize * 0.8,
            height: strokeWidth,
            backgroundColor: '#ffffff',
            transform: [{ rotate: '-45deg' }],
            borderRadius: strokeWidth / 2,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        />
      </View>
    </View>
  );
};

const AppIcon = ({ size = 24 }: { size?: number }) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Image
        source={require('../../assets/images/icon.png')}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        resizeMode="cover"
      />
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
    if (icon === 'none') {
      return null;
    }

    if (icon === 'stylisto-logo') {
      return (
        <StylistoLogoIcon
          size={iconSize}
          color={disabled ? '#6b7280' : iconColor}
        />
      );
    }

    if (icon === 'safour-logo') {
      return <SafourIcon size={iconSize} disabled={disabled} />;
    }

    if (icon === 'app-icon') {
      return <AppIcon size={iconSize} />;
    }

    return (
      <CustomPlusIcon
        size={iconSize}
        color={disabled ? '#6b7280' : iconColor}
      />
    );
  };

  // Check if gradient colors are white/transparent for glassy effect
  const isGlassyStyle = gradientColors.some(
    color =>
      color.includes('rgba(255, 255, 255') || color.includes('rgba(255,255,255')
  );

  const renderBackground = () => {
    // Use app icon as background for safour-logo
    if (icon === 'safour-logo' && !disabled) {
      return (
        <View
          style={[
            styles.gradient,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              overflow: 'hidden',
            },
          ]}
        >
          <Image
            source={require('../../assets/images/icon.png')}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
            resizeMode="cover"
          />
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            {renderIcon()}
          </View>
        </View>
      );
    }

    if (isGlassyStyle && !disabled) {
      return (
        <BlurView
          intensity={20}
          tint="light"
          style={[
            styles.gradient,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.4)',
              overflow: 'hidden',
            },
          ]}
        >
          {renderIcon()}
        </BlurView>
      );
    }

    return (
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
            overflow: 'hidden',
          },
        ]}
      >
        {renderIcon()}
      </LinearGradient>
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
            overflow: 'hidden',
          },
          isGlassyStyle && styles.glassyTouchable,
          icon === 'safour-logo' && styles.iconBackgroundTouchable,
        ]}
        onPress={onPress}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {renderBackground()}
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
  glassyTouchable: {
    // Add any additional styles for the glassy touchable if needed
  },
  iconBackgroundTouchable: {
    // Add any additional styles for the icon background touchable if needed
  },
});
