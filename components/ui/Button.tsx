/**
 * Button Component
 *
 * A comprehensive button component with multiple variants, sizes,
 * and accessibility features built into the design system.
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';

export interface ButtonProps {
  // Content
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // Behavior
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;

  // Appearance
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;

  // Style overrides
  style?: any;
  textStyle?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title = '',
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      styles[`${variant}Button`],
      styles[`${size}Button`],
      fullWidth && styles.fullWidth,
      isDisabled && styles.disabled,
      isDisabled && styles[`${variant}Disabled`],
    ];

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [
      styles.text,
      styles[`${size}Text`],
      styles[`${variant}Text`], // Move variant text styles after size to ensure color precedence
      isDisabled && styles.disabledText,
      isDisabled && styles[`${variant}DisabledText`],
    ];

    return baseStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'small'}
            color={variant === 'primary' ? Colors.white : Colors.primary[700]}
          />
          <Text style={[getTextStyle(), styles.loadingText]}>Loading...</Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <View style={styles.textContainer}>
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, styles[`${size}Subtitle`]]}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base button styles
  button: {
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Shadows.sm,
  },

  // Size variants
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
    minHeight: 56,
  },

  // Width variants
  fullWidth: {
    width: '100%',
  },

  // Variant styles
  primaryButton: {
    backgroundColor: Colors.primary[700],
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary[400],
    borderWidth: 0,
  },
  outlineButton: {
    backgroundColor: Colors.transparent,
    borderWidth: 2,
    borderColor: Colors.border.primary,
  },
  ghostButton: {
    backgroundColor: Colors.transparent,
    borderWidth: 0,
  },
  destructiveButton: {
    backgroundColor: Colors.error[500],
    borderWidth: 0,
  },

  // Disabled states
  disabled: {
    opacity: 0.6,
  },
  primaryDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  secondaryDisabled: {
    backgroundColor: Colors.neutral[200],
  },
  outlineDisabled: {
    borderColor: Colors.neutral[300],
  },
  ghostDisabled: {
    backgroundColor: Colors.transparent,
  },
  destructiveDisabled: {
    backgroundColor: Colors.neutral[300],
  },

  // Text styles
  text: {
    textAlign: 'center',
    fontWeight: '600',
    color: Colors.white,
  },
  smallText: {
    ...Typography.button.small,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18, // Fix lineHeight issue
  },
  mediumText: {
    ...Typography.button.medium,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20, // Fix lineHeight issue
  },
  largeText: {
    ...Typography.button.large,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22, // Fix lineHeight issue from Typography.button.large
  },

  // Text color variants
  primaryText: {
    color: Colors.white,
    fontWeight: '600',
  },
  secondaryText: {
    color: Colors.white,
    fontWeight: '600',
  },
  outlineText: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  ghostText: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  destructiveText: {
    color: Colors.white,
    fontWeight: '600',
  },

  // Disabled text colors
  disabledText: {
    opacity: 0.8,
  },
  primaryDisabledText: {
    color: Colors.neutral[500],
  },
  secondaryDisabledText: {
    color: Colors.neutral[500],
  },
  outlineDisabledText: {
    color: Colors.neutral[400],
  },
  ghostDisabledText: {
    color: Colors.neutral[400],
  },
  destructiveDisabledText: {
    color: Colors.neutral[500],
  },

  // Content layout
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },

  // Loading state
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: Spacing.sm,
  },

  // Subtitle
  subtitle: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
  },
  smallSubtitle: {
    ...Typography.caption.small,
  },
  mediumSubtitle: {
    ...Typography.caption.medium,
  },
  largeSubtitle: {
    ...Typography.caption.large,
  },
});
