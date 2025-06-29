/**
 * Design System Constants Index
 *
 * Central export file for all design system constants
 */

export * from './Colors';
export * from './Shadows';
export * from './Spacing';
export * from './Typography';

// UI Configuration
export const UI_CONFIG = {
  // Set to false to completely disable pull-to-refresh throughout the app
  ENABLE_PULL_TO_REFRESH: true,
  // Pull-to-refresh threshold in pixels - higher values make it less sensitive
  PULL_TO_REFRESH_OFFSET: 100,
};
