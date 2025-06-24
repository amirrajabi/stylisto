/**
 * Card Component
 * 
 * A flexible card component with multiple variants and
 * consistent styling for the design system.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

export interface CardProps {
  // Content
  children: React.ReactNode;

  // Behavior
  onPress?: () => void;
  disabled?: boolean;

  // Appearance
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof Spacing;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;

  // Style overrides
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  disabled = false,
  variant = 'default',
  padding = 'lg',
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}) => {
  const getCardStyle = (): ViewStyle[] => [
    styles.card,
    styles[`${variant}Card`],
    { padding: Spacing[padding] },
    disabled && styles.disabled,
    style,
  ];

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={getCardStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.8 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={onPress ? { disabled } : undefined}
      testID={testID}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  // Base card
  card: {
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Spacing.md,
  },

  // Variants
  defaultCard: {
    backgroundColor: Colors.surface.primary,
    ...Shadows.sm,
  },
  elevatedCard: {
    backgroundColor: Colors.surface.primary,
    ...Shadows.md,
  },
  outlinedCard: {
    backgroundColor: Colors.surface.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  filledCard: {
    backgroundColor: Colors.surface.secondary,
  },

  // States
  disabled: {
    opacity: 0.6,
  },
});