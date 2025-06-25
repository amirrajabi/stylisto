/**
 * Design System Typography
 *
 * This file defines the typography system including font families,
 * sizes, weights, and line heights for consistent text styling.
 */

import { Platform } from 'react-native';

// Font Families
export const FontFamily = {
  // System fonts for optimal performance and native feel
  primary: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'Inter', // Fallback for web
  }),

  secondary: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'Inter',
  }),

  mono: Platform.select({
    ios: 'SF Mono',
    android: 'Roboto Mono',
    default: 'Menlo',
  }),
};

// Font Weights
export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Font Sizes (using a modular scale)
export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
  '9xl': 128,
};

// Line Heights (relative to font size)
export const LineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

// Letter Spacing
export const LetterSpacing = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
};

// Typography Styles
export const Typography = {
  // Display styles (for large headings)
  display: {
    large: {
      fontFamily: FontFamily.primary,
      fontSize: FontSize['6xl'],
      fontWeight: FontWeight.bold,
      lineHeight: 75, // 60px * 1.25
      letterSpacing: LetterSpacing.tight,
    },
    medium: {
      fontFamily: FontFamily.primary,
      fontSize: FontSize['5xl'],
      fontWeight: FontWeight.bold,
      lineHeight: 60, // 48px * 1.25
      letterSpacing: LetterSpacing.tight,
    },
    small: {
      fontFamily: FontFamily.primary,
      fontSize: FontSize['4xl'],
      fontWeight: FontWeight.bold,
      lineHeight: 45, // 36px * 1.25
      letterSpacing: LetterSpacing.normal,
    },
  },

  // Heading styles
  heading: {
    h1: {
      fontFamily: FontFamily.primary,
      fontSize: FontSize['3xl'],
      fontWeight: FontWeight.bold,
      lineHeight: 38, // 30px * 1.27
      letterSpacing: LetterSpacing.normal,
    },
    h2: {
      fontFamily: FontFamily.primary,
      fontSize: FontSize['2xl'],
      fontWeight: FontWeight.semibold,
      lineHeight: 32, // 24px * 1.33
      letterSpacing: LetterSpacing.normal,
    },
    h3: {
      fontFamily: FontFamily.primary,
      fontSize: FontSize.xl,
      fontWeight: FontWeight.semibold,
      lineHeight: 28, // 20px * 1.4
      letterSpacing: LetterSpacing.normal,
    },
    h4: {
      fontFamily: FontFamily.primary,
      fontSize: FontSize.lg,
      fontWeight: FontWeight.medium,
      lineHeight: 26, // 18px * 1.44
      letterSpacing: LetterSpacing.normal,
    },
    h5: {
      fontFamily: FontFamily.primary,
      fontSize: FontSize.base,
      fontWeight: FontWeight.medium,
      lineHeight: 24, // 16px * 1.5
      letterSpacing: LetterSpacing.normal,
    },
    h6: {
      fontFamily: FontFamily.primary,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
      lineHeight: 20, // 14px * 1.43
      letterSpacing: LetterSpacing.wide,
    },
  },

  // Body text styles
  body: {
    large: {
      fontFamily: FontFamily.secondary,
      fontSize: FontSize.lg,
      fontWeight: FontWeight.regular,
      lineHeight: 28, // 18px * 1.56
      letterSpacing: LetterSpacing.normal,
    },
    medium: {
      fontFamily: FontFamily.secondary,
      fontSize: FontSize.base,
      fontWeight: FontWeight.regular,
      lineHeight: 24, // 16px * 1.5
      letterSpacing: LetterSpacing.normal,
    },
    small: {
      fontFamily: FontFamily.secondary,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.regular,
      lineHeight: 20, // 14px * 1.43
      letterSpacing: LetterSpacing.normal,
    },
  },

  // Caption and label styles
  caption: {
    large: {
      fontFamily: FontFamily.secondary,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
      lineHeight: 20, // 14px * 1.43 for better text visibility
      letterSpacing: LetterSpacing.wide,
    },
    medium: {
      fontFamily: FontFamily.secondary,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.medium,
      lineHeight: 18, // 12px * 1.5 for better text visibility
      letterSpacing: LetterSpacing.wide,
    },
    small: {
      fontFamily: FontFamily.secondary,
      fontSize: 10,
      fontWeight: FontWeight.medium,
      lineHeight: 15, // 10px * 1.5 for better text visibility
      letterSpacing: LetterSpacing.wider,
    },
  },

  // Button text styles
  button: {
    large: {
      fontFamily: FontFamily.secondary,
      fontSize: FontSize.base,
      fontWeight: FontWeight.semibold,
      lineHeight: 24, // 16px * 1.5 for better text visibility
      letterSpacing: LetterSpacing.normal,
    },
    medium: {
      fontFamily: FontFamily.secondary,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      lineHeight: 20, // 14px * 1.43 for better text visibility
      letterSpacing: LetterSpacing.normal,
    },
    small: {
      fontFamily: FontFamily.secondary,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      lineHeight: 18, // 12px * 1.5 for better text visibility
      letterSpacing: LetterSpacing.wide,
    },
  },

  // Link styles
  link: {
    fontFamily: FontFamily.secondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: 24, // 16px * 1.5
    letterSpacing: LetterSpacing.normal,
    textDecorationLine: 'underline' as const,
  },

  // Code styles
  code: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: 20, // 14px * 1.43
    letterSpacing: LetterSpacing.normal,
  },
};

// Utility function to create text styles
export const createTextStyle = (
  size: keyof typeof FontSize,
  weight: keyof typeof FontWeight,
  family: keyof typeof FontFamily = 'secondary'
) => ({
  fontFamily: FontFamily[family],
  fontSize: FontSize[size],
  fontWeight: FontWeight[weight],
  lineHeight: LineHeight.normal,
  letterSpacing: LetterSpacing.normal,
});
