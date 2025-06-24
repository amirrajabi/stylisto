/**
 * Typography Components
 * 
 * Pre-styled text components that implement the design system
 * typography scale and ensure consistent text styling.
 */

import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography as TypographyConstants } from '../../constants/Typography';

interface BaseTextProps extends TextProps {
  color?: keyof typeof Colors.text | string;
  children: React.ReactNode;
}

// Display components
export const DisplayLarge: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.displayLarge, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const DisplayMedium: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.displayMedium, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const DisplaySmall: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.displaySmall, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

// Heading components
export const H1: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.h1, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const H2: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.h2, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const H3: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.h3, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const H4: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.h4, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const H5: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.h5, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const H6: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.h6, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

// Body text components
export const BodyLarge: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.bodyLarge, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const BodyMedium: React.FC<BaseTextProps> = ({ 
  color = 'primary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.bodyMedium, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const BodySmall: React.FC<BaseTextProps> = ({ 
  color = 'secondary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.bodySmall, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

// Caption components
export const CaptionLarge: React.FC<BaseTextProps> = ({ 
  color = 'secondary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.captionLarge, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const CaptionMedium: React.FC<BaseTextProps> = ({ 
  color = 'secondary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.captionMedium, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const CaptionSmall: React.FC<BaseTextProps> = ({ 
  color = 'tertiary', 
  style, 
  children, 
  ...props 
}) => (
  <Text 
    style={[
      styles.captionSmall, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

// Link component
interface LinkProps extends BaseTextProps {
  onPress?: () => void;
}

export const Link: React.FC<LinkProps> = ({ 
  color = 'link', 
  style, 
  children, 
  onPress,
  ...props 
}) => (
  <Text 
    style={[
      styles.link, 
      { color: Colors.text[color as keyof typeof Colors.text] || color },
      style
    ]} 
    onPress={onPress}
    accessibilityRole="link"
    {...props}
  >
    {children}
  </Text>
);

const styles = StyleSheet.create({
  // Display styles
  displayLarge: TypographyConstants.display.large,
  displayMedium: TypographyConstants.display.medium,
  displaySmall: TypographyConstants.display.small,

  // Heading styles
  h1: TypographyConstants.heading.h1,
  h2: TypographyConstants.heading.h2,
  h3: TypographyConstants.heading.h3,
  h4: TypographyConstants.heading.h4,
  h5: TypographyConstants.heading.h5,
  h6: TypographyConstants.heading.h6,

  // Body styles
  bodyLarge: TypographyConstants.body.large,
  bodyMedium: TypographyConstants.body.medium,
  bodySmall: TypographyConstants.body.small,

  // Caption styles
  captionLarge: TypographyConstants.caption.large,
  captionMedium: TypographyConstants.caption.medium,
  captionSmall: TypographyConstants.caption.small,

  // Link style
  link: {
    ...TypographyConstants.link,
    textDecorationLine: 'underline',
  },
});