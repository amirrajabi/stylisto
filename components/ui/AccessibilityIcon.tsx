import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibilityIconProps {
  icon: React.ReactNode;
  accessibilityLabel: string;
  color?: string;
  size?: number;
  style?: any;
}

export const AccessibilityIcon: React.FC<AccessibilityIconProps> = ({
  icon,
  accessibilityLabel,
  color,
  size,
  style,
}) => {
  const { colors } = useAccessibility();
  
  // Clone the icon with the correct color and size
  const iconWithProps = React.cloneElement(icon as React.ReactElement, {
    color: color || colors.text.primary,
    size: size || 24,
    'aria-hidden': true, // Hide from screen readers since we use accessibilityLabel
  });
  
  return (
    <View 
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      {iconWithProps}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});