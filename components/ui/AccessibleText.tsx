import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAccessibility } from './AccessibilityProvider';
import { Typography } from '../../constants/Typography';

interface AccessibleTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'button';
  size?: 'small' | 'medium' | 'large';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  accessibilityRole?: 'header' | 'text' | 'link' | 'button' | 'summary';
  accessibilityLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  variant = 'body',
  size = 'medium',
  weight = 'regular',
  color,
  style,
  accessibilityRole,
  accessibilityLevel,
  children,
  ...props
}) => {
  const { fontScale, colors } = useAccessibility();
  
  // Determine base style based on variant and size
  let baseStyle;
  
  if (variant.startsWith('h')) {
    const level = parseInt(variant.substring(1)) as 1 | 2 | 3 | 4 | 5 | 6;
    baseStyle = Typography.heading[`h${level}`];
    
    // Set appropriate accessibility role and level for headings
    if (!accessibilityRole) {
      props.accessibilityRole = 'header';
    }
    if (!accessibilityLevel) {
      props.accessibilityLevel = level;
    }
  } else if (variant === 'body') {
    baseStyle = Typography.body[size];
  } else if (variant === 'caption') {
    baseStyle = Typography.caption[size];
  } else if (variant === 'button') {
    baseStyle = Typography.button[size];
    
    // Set appropriate accessibility role for buttons
    if (!accessibilityRole) {
      props.accessibilityRole = 'button';
    }
  }
  
  // Apply font weight
  let fontWeight;
  switch (weight) {
    case 'regular':
      fontWeight = '400';
      break;
    case 'medium':
      fontWeight = '500';
      break;
    case 'semibold':
      fontWeight = '600';
      break;
    case 'bold':
      fontWeight = '700';
      break;
  }
  
  // Apply font scaling
  const scaledStyle = {
    ...baseStyle,
    fontSize: baseStyle.fontSize * fontScale,
    fontWeight,
    color: color || colors.text.primary,
  };
  
  return (
    <Text
      style={[scaledStyle, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const H1: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="h1" {...props} />
);

export const H2: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="h2" {...props} />
);

export const H3: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="h3" {...props} />
);

export const H4: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="h4" {...props} />
);

export const H5: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="h5" {...props} />
);

export const H6: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="h6" {...props} />
);

export const Body: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="body" {...props} />
);

export const Caption: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="caption" {...props} />
);

export const ButtonText: React.FC<Omit<AccessibleTextProps, 'variant'>> = (props) => (
  <AccessibleText variant="button" {...props} />
);