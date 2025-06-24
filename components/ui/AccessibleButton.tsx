import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  StyleSheet, 
  View, 
  ActivityIndicator,
  Platform,
  Pressable
} from 'react-native';
import { useAccessibility } from './AccessibilityProvider';
import { ButtonText } from './AccessibleText';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface AccessibleButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title = '',
  variant = 'primary',
  size = 'medium',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  onPress,
  ...props
}) => {
  const { colors, isReducedMotionEnabled } = useAccessibility();
  const isDisabled = disabled || loading;
  
  // Determine button styles based on variant and size
  const getButtonStyle = () => {
    const baseStyles = [
      styles.button,
      styles[`${size}Button`],
      fullWidth && styles.fullWidth,
    ];
    
    // Add variant-specific styles
    switch (variant) {
      case 'primary':
        baseStyles.push({
          backgroundColor: isDisabled ? colors.neutral[300] : colors.primary[700],
        });
        break;
      case 'secondary':
        baseStyles.push({
          backgroundColor: isDisabled ? colors.neutral[200] : colors.secondary[400],
        });
        break;
      case 'outline':
        baseStyles.push({
          backgroundColor: colors.transparent,
          borderWidth: 1,
          borderColor: isDisabled ? colors.neutral[300] : colors.border.primary,
        });
        break;
      case 'ghost':
        baseStyles.push({
          backgroundColor: colors.transparent,
        });
        break;
      case 'destructive':
        baseStyles.push({
          backgroundColor: isDisabled ? colors.neutral[300] : colors.error[500],
        });
        break;
    }
    
    return baseStyles;
  };
  
  // Determine text color based on variant
  const getTextColor = () => {
    if (isDisabled) {
      return variant === 'outline' || variant === 'ghost' 
        ? colors.text.disabled 
        : colors.white;
    }
    
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'destructive':
        return colors.white;
      case 'outline':
      case 'ghost':
        return variant === 'destructive' ? colors.error[500] : colors.primary[700];
      default:
        return colors.text.primary;
    }
  };
  
  // Use Pressable on web for better keyboard accessibility
  const ButtonComponent = Platform.OS === 'web' ? Pressable : TouchableOpacity;
  
  return (
    <ButtonComponent
      style={({ pressed }) => [
        ...getButtonStyle(),
        // Add pressed state styles if not disabled and motion is not reduced
        pressed && !isDisabled && !isReducedMotionEnabled && {
          transform: [{ scale: 0.98 }],
          opacity: 0.9,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ 
        disabled: isDisabled,
        busy: loading,
      }}
      // Web-specific props for keyboard accessibility
      {...(Platform.OS === 'web' ? {
        tabIndex: isDisabled ? -1 : 0,
        role: 'button',
        'aria-disabled': isDisabled,
        'aria-busy': loading,
      } : {})}
      {...props}
    >
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={getTextColor()} 
            accessibilityLabel="Loading"
          />
        ) : (
          <>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <ButtonText 
              size={size} 
              weight={variant === 'ghost' ? 'medium' : 'semibold'} 
              color={getTextColor()}
            >
              {title}
            </ButtonText>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </>
        )}
      </View>
    </ButtonComponent>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Shadows.sm,
  },
  smallButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: Layout.touchTarget.minimum,
  },
  mediumButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: Layout.touchTarget.comfortable,
  },
  largeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    minHeight: Layout.touchTarget.large,
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});