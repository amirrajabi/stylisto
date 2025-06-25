import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { Typography } from '../../constants/Typography';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibleTextProps extends TextProps {
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'body'
    | 'caption'
    | 'button';
  size?: 'small' | 'medium' | 'large';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'disabled'
    | 'error'
    | 'success'
    | 'warning'
    | string;
  children: React.ReactNode;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  variant = 'body',
  size = 'medium',
  weight = 'regular',
  color = 'primary',
  style,
  children,
  ...props
}) => {
  const { fontScale, colors } = useAccessibility();

  // Determine base style based on variant and size
  let baseStyle: any = Typography.body.medium;

  if (variant.startsWith('h')) {
    const level = parseInt(variant.substring(1)) as 1 | 2 | 3 | 4 | 5 | 6;
    baseStyle = Typography.heading[`h${level}`];

    // Set appropriate accessibility properties for headings
    if (!props.accessibilityRole) {
      props.accessibilityRole = 'header';
    }
  } else if (variant === 'body') {
    baseStyle = Typography.body[size];
  } else if (variant === 'caption') {
    baseStyle = Typography.caption[size];
  } else if (variant === 'button') {
    baseStyle = Typography.button[size];

    // Set appropriate accessibility role for buttons
    if (!props.accessibilityRole) {
      props.accessibilityRole = 'button';
    }
  }

  // Apply font weight
  let fontWeight: TextStyle['fontWeight'] = '400';
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

  // Determine text color
  let textColor;
  if (typeof color === 'string' && color.startsWith('#')) {
    textColor = color;
  } else {
    switch (color) {
      case 'primary':
        textColor = colors.text.primary;
        break;
      case 'secondary':
        textColor = colors.text.secondary;
        break;
      case 'tertiary':
        textColor = colors.text.tertiary;
        break;
      case 'disabled':
        textColor = colors.text.disabled;
        break;
      case 'error':
        textColor = colors.error?.[500] || '#EF4444';
        break;
      case 'success':
        textColor = colors.success?.[500] || '#10B981';
        break;
      case 'warning':
        textColor = colors.warning?.[500] || '#F59E0B';
        break;
      default:
        textColor = color || colors.text.primary;
    }
  }

  // Apply font scaling
  const scaledStyle: TextStyle = {
    ...baseStyle,
    fontSize: baseStyle.fontSize * fontScale,
    fontWeight,
    color: textColor,
  };

  return (
    <Text style={[scaledStyle, style]} {...props}>
      {children}
    </Text>
  );
};

export const H1: React.FC<Omit<AccessibleTextProps, 'variant'>> = props => (
  <AccessibleText variant="h1" {...props} />
);

export const H2: React.FC<Omit<AccessibleTextProps, 'variant'>> = props => (
  <AccessibleText variant="h2" {...props} />
);

export const H3: React.FC<Omit<AccessibleTextProps, 'variant'>> = props => (
  <AccessibleText variant="h3" {...props} />
);

export const H4: React.FC<Omit<AccessibleTextProps, 'variant'>> = props => (
  <AccessibleText variant="h4" {...props} />
);

export const H5: React.FC<Omit<AccessibleTextProps, 'variant'>> = props => (
  <AccessibleText variant="h5" {...props} />
);

export const H6: React.FC<Omit<AccessibleTextProps, 'variant'>> = props => (
  <AccessibleText variant="h6" {...props} />
);

export const Body: React.FC<Omit<AccessibleTextProps, 'variant'>> = props => (
  <AccessibleText variant="body" {...props} />
);

export const BodyMedium: React.FC<
  Omit<AccessibleTextProps, 'variant' | 'size'>
> = props => <AccessibleText variant="body" size="medium" {...props} />;

export const BodySmall: React.FC<
  Omit<AccessibleTextProps, 'variant' | 'size'>
> = props => <AccessibleText variant="body" size="small" {...props} />;

export const Caption: React.FC<
  Omit<AccessibleTextProps, 'variant'>
> = props => <AccessibleText variant="caption" {...props} />;

export const ButtonText: React.FC<
  Omit<AccessibleTextProps, 'variant'>
> = props => <AccessibleText variant="button" {...props} />;
