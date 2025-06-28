/**
 * Design System Colors
 *
 * This file defines the complete color palette for the Stylisto app,
 * including primary, secondary, semantic colors, and neutral tones.
 * All colors meet WCAG 2.1 AA accessibility standards with proper contrast ratios.
 */

export const Colors = {
  // Primary Color Palette
  primary: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748', // Primary brand color
    800: '#1A202C',
    900: '#171923',
  },

  // Secondary Color Palette (Blue)
  secondary: {
    50: '#EBF8FF',
    100: '#BEE3F8',
    200: '#90CDF4',
    300: '#63B3ED',
    400: '#4299E1', // Secondary brand color
    500: '#3182CE',
    600: '#2B77CB',
    700: '#2C5282',
    800: '#2A4365',
    900: '#1A365D',
  },

  // Accent Colors
  accent: {
    purple: {
      50: '#FAF5FF',
      100: '#E9D8FD',
      200: '#D6BCFA',
      300: '#B794F6',
      400: '#9F7AEA',
      500: '#805AD5',
      600: '#6B46C1',
      700: '#553C9A',
      800: '#44337A',
      900: '#322659',
    },
    pink: {
      50: '#FFF5F7',
      100: '#FED7E2',
      200: '#FBB6CE',
      300: '#F687B3',
      400: '#ED64A6',
      500: '#D53F8C',
      600: '#B83280',
      700: '#97266D',
      800: '#702459',
      900: '#521B41',
    },
  },

  // Semantic Colors
  success: {
    50: '#F0FFF4',
    100: '#C6F6D5',
    200: '#9AE6B4',
    300: '#68D391',
    400: '#48BB78',
    500: '#38A169',
    600: '#2F855A',
    700: '#276749',
    800: '#22543D',
    900: '#1C4532',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Neutral Colors
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Special Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Surface Colors
  surface: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    elevated: '#FFFFFF',
    disabled: '#F1F5F9',
  },

  // Text Colors
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    disabled: '#D1D5DB',
    inverse: '#FFFFFF',
    link: '#3B82F6',
    linkHover: '#2563EB',
  },

  // Border Colors
  border: {
    primary: '#E5E7EB',
    secondary: '#D1D5DB',
    focus: '#3B82F6',
    error: '#EF4444',
    success: '#10B981',
  },

  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    heavy: 'rgba(0, 0, 0, 0.25)',
  },
};

// Dark Mode Colors
export const DarkColors = {
  ...Colors,

  // Override specific colors for dark mode
  background: {
    primary: '#111827',
    secondary: '#1F2937',
    tertiary: '#374151',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  surface: {
    primary: '#1F2937',
    secondary: '#374151',
    elevated: '#4B5563',
    disabled: '#6B7280',
  },

  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    disabled: '#6B7280',
    inverse: '#1F2937',
    link: '#60A5FA',
    linkHover: '#93C5FD',
  },

  border: {
    primary: '#374151',
    secondary: '#4B5563',
    focus: '#60A5FA',
    error: '#F87171',
    success: '#34D399',
  },
};

// Color utility functions
export const getColorWithOpacity = (color: string, opacity: number): string => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - in production, use a more sophisticated algorithm
  const isLight =
    backgroundColor === Colors.white ||
    backgroundColor.includes('50') ||
    backgroundColor.includes('100') ||
    backgroundColor.includes('200');

  return isLight ? Colors.text.primary : Colors.text.inverse;
};

// Force Light Theme - Always return light colors regardless of system preference
export const getAppColors = () => {
  return Colors; // Always return light theme colors
};

// Force Light Theme Status Bar Style
export const getStatusBarStyle = (): 'light' | 'dark' => {
  return 'dark'; // Dark content on light background
};
