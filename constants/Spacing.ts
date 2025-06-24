/**
 * Design System Spacing
 * 
 * This file defines the spacing system using an 8px base unit
 * for consistent margins, paddings, and layout spacing.
 */

// Base spacing unit (8px)
const BASE_UNIT = 8;

// Spacing scale
export const Spacing = {
  none: 0,
  xs: BASE_UNIT * 0.5,    // 4px
  sm: BASE_UNIT,          // 8px
  md: BASE_UNIT * 2,      // 16px
  lg: BASE_UNIT * 3,      // 24px
  xl: BASE_UNIT * 4,      // 32px
  '2xl': BASE_UNIT * 5,   // 40px
  '3xl': BASE_UNIT * 6,   // 48px
  '4xl': BASE_UNIT * 8,   // 64px
  '5xl': BASE_UNIT * 10,  // 80px
  '6xl': BASE_UNIT * 12,  // 96px
  '7xl': BASE_UNIT * 16,  // 128px
  '8xl': BASE_UNIT * 20,  // 160px
  '9xl': BASE_UNIT * 24,  // 192px
};

// Component-specific spacing
export const ComponentSpacing = {
  // Button spacing
  button: {
    paddingHorizontal: {
      small: Spacing.md,
      medium: Spacing.lg,
      large: Spacing.xl,
    },
    paddingVertical: {
      small: Spacing.sm,
      medium: Spacing.md,
      large: Spacing.lg,
    },
    gap: Spacing.sm,
  },

  // Input spacing
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },

  // Card spacing
  card: {
    padding: Spacing.lg,
    margin: Spacing.md,
    gap: Spacing.md,
  },

  // Modal spacing
  modal: {
    padding: Spacing.lg,
    margin: Spacing.md,
  },

  // List spacing
  list: {
    itemPadding: Spacing.md,
    itemGap: Spacing.sm,
    sectionGap: Spacing.lg,
  },

  // Screen spacing
  screen: {
    horizontal: Spacing.md,
    vertical: Spacing.lg,
    safeArea: Spacing.md,
  },

  // Icon spacing
  icon: {
    small: Spacing.xs,
    medium: Spacing.sm,
    large: Spacing.md,
  },
};

// Layout spacing utilities
export const Layout = {
  // Container widths
  container: {
    small: 320,
    medium: 768,
    large: 1024,
    xlarge: 1280,
  },

  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },

  // Minimum touch targets (accessibility)
  touchTarget: {
    minimum: 44, // iOS HIG and Android Material Design minimum
    comfortable: 48,
    large: 56,
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
};

// Utility functions
export const getSpacing = (multiplier: number): number => BASE_UNIT * multiplier;

export const createSpacingStyle = (
  top?: keyof typeof Spacing,
  right?: keyof typeof Spacing,
  bottom?: keyof typeof Spacing,
  left?: keyof typeof Spacing
) => ({
  paddingTop: top ? Spacing[top] : undefined,
  paddingRight: right ? Spacing[right] : undefined,
  paddingBottom: bottom ? Spacing[bottom] : undefined,
  paddingLeft: left ? Spacing[left] : undefined,
});

export const createMarginStyle = (
  top?: keyof typeof Spacing,
  right?: keyof typeof Spacing,
  bottom?: keyof typeof Spacing,
  left?: keyof typeof Spacing
) => ({
  marginTop: top ? Spacing[top] : undefined,
  marginRight: right ? Spacing[right] : undefined,
  marginBottom: bottom ? Spacing[bottom] : undefined,
  marginLeft: left ? Spacing[left] : undefined,
});