import { Platform } from 'react-native';

/**
 * Utility functions for accessibility
 */

/**
 * Calculate contrast ratio between two colors
 * @param foreground Foreground color in hex format (e.g., '#FFFFFF')
 * @param background Background color in hex format (e.g., '#000000')
 * @returns Contrast ratio as a number
 */
export const calculateContrastRatio = (foreground: string, background: string): number => {
  const foregroundLuminance = calculateRelativeLuminance(foreground);
  const backgroundLuminance = calculateRelativeLuminance(background);
  
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Calculate relative luminance of a color
 * @param color Color in hex format (e.g., '#FFFFFF')
 * @returns Relative luminance value
 */
export const calculateRelativeLuminance = (color: string): number => {
  // Remove # if present
  color = color.replace('#', '');
  
  // Convert hex to RGB
  let r, g, b;
  if (color.length === 3) {
    r = parseInt(color.charAt(0) + color.charAt(0), 16) / 255;
    g = parseInt(color.charAt(1) + color.charAt(1), 16) / 255;
    b = parseInt(color.charAt(2) + color.charAt(2), 16) / 255;
  } else {
    r = parseInt(color.substring(0, 2), 16) / 255;
    g = parseInt(color.substring(2, 4), 16) / 255;
    b = parseInt(color.substring(4, 6), 16) / 255;
  }
  
  // Convert RGB to luminance
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Check if a color combination meets WCAG contrast requirements
 * @param foreground Foreground color in hex format
 * @param background Background color in hex format
 * @param level 'AA' or 'AAA'
 * @param isLargeText Whether the text is considered large (>=18pt or >=14pt bold)
 * @returns Boolean indicating if the contrast meets the requirements
 */
export const meetsContrastRequirements = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  } else {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
};

/**
 * Generate accessibility props based on platform
 * @param props Object containing accessibility properties
 * @returns Platform-specific accessibility props
 */
export const getAccessibilityProps = (props: {
  label?: string;
  hint?: string;
  role?: string;
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
}) => {
  const { label, hint, role, state } = props;
  
  if (Platform.OS === 'web') {
    return {
      'aria-label': label,
      'aria-describedby': hint,
      role,
      'aria-disabled': state?.disabled,
      'aria-selected': state?.selected,
      'aria-checked': state?.checked,
      'aria-busy': state?.busy,
      'aria-expanded': state?.expanded,
      tabIndex: state?.disabled ? -1 : 0,
    };
  } else {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: role,
      accessibilityState: {
        disabled: state?.disabled,
        selected: state?.selected,
        checked: state?.checked,
        busy: state?.busy,
        expanded: state?.expanded,
      },
    };
  }
};

/**
 * Generate a unique ID for accessibility purposes
 * @param prefix Optional prefix for the ID
 * @returns Unique ID string
 */
export const generateAccessibilityId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Check if the device has a screen reader enabled
 * @returns Promise that resolves to a boolean
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    // For web, we can't reliably detect screen readers
    return false;
  }
  
  try {
    const { AccessibilityInfo } = require('react-native');
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.error('Error checking screen reader status:', error);
    return false;
  }
};

/**
 * Announce a message to screen readers
 * @param message Message to announce
 */
export const announceForAccessibility = (message: string): void => {
  if (Platform.OS === 'web') {
    // For web, create an ARIA live region
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.classList.add('sr-only');
    document.body.appendChild(liveRegion);
    
    // Set the message
    setTimeout(() => {
      liveRegion.textContent = message;
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, 1000);
    }, 100);
  } else {
    try {
      const { AccessibilityInfo } = require('react-native');
      AccessibilityInfo.announceForAccessibility(message);
    } catch (error) {
      console.error('Error announcing for accessibility:', error);
    }
  }
};