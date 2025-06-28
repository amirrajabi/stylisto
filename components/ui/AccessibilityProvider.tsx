import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, DarkColors } from '../../constants/Colors';

// Define the accessibility context type
interface AccessibilityContextType {
  // Font size scaling
  fontScale: number;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  resetFontScale: () => void;

  // High contrast mode
  isHighContrastEnabled: boolean;
  toggleHighContrast: () => void;

  // Reduced motion
  isReducedMotionEnabled: boolean;
  toggleReducedMotion: () => void;

  // Screen reader announcement
  announceForAccessibility: (message: string) => void;

  // Current theme and colors
  theme: 'light' | 'dark' | 'high-contrast';
  colors: typeof Colors | typeof DarkColors;
}

// Create the context with default values
const AccessibilityContext = createContext<AccessibilityContextType>({
  fontScale: 1,
  increaseFontScale: () => {},
  decreaseFontScale: () => {},
  resetFontScale: () => {},

  isHighContrastEnabled: false,
  toggleHighContrast: () => {},

  isReducedMotionEnabled: false,
  toggleReducedMotion: () => {},

  announceForAccessibility: () => {},

  theme: 'light',
  colors: Colors,
});

// Storage keys
const FONT_SCALE_KEY = '@stylisto_font_scale';
const HIGH_CONTRAST_KEY = '@stylisto_high_contrast';
const REDUCED_MOTION_KEY = '@stylisto_reduced_motion';

// High contrast color overrides
const HighContrastColors = {
  ...Colors,
  text: {
    primary: '#000000',
    secondary: '#000000',
    tertiary: '#000000',
    disabled: '#6B7280',
    inverse: '#FFFFFF',
    link: '#0000EE',
    linkHover: '#0000CC',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F0F0F0',
    tertiary: '#E0E0E0',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  border: {
    primary: '#000000',
    secondary: '#000000',
    focus: '#0000EE',
    error: '#FF0000',
    success: '#008000',
  },
};

const HighContrastDarkColors = {
  ...DarkColors,
  text: {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    tertiary: '#FFFFFF',
    disabled: '#A0A0A0',
    inverse: '#000000',
    link: '#6699FF',
    linkHover: '#99CCFF',
  },
  background: {
    primary: '#000000',
    secondary: '#101010',
    tertiary: '#202020',
    overlay: 'rgba(0, 0, 0, 0.9)',
  },
  border: {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    focus: '#6699FF',
    error: '#FF6666',
    success: '#66FF66',
  },
};

// Provider component
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();

  // State
  const [fontScale, setFontScale] = useState<number>(1);
  const [isHighContrastEnabled, setIsHighContrastEnabled] =
    useState<boolean>(false);
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] =
    useState<boolean>(false);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load font scale
        const savedFontScale = await AsyncStorage.getItem(FONT_SCALE_KEY);
        if (savedFontScale) {
          setFontScale(parseFloat(savedFontScale));
        }

        // Load high contrast setting
        const savedHighContrast = await AsyncStorage.getItem(HIGH_CONTRAST_KEY);
        if (savedHighContrast) {
          setIsHighContrastEnabled(savedHighContrast === 'true');
        }

        // Load reduced motion setting
        const savedReducedMotion =
          await AsyncStorage.getItem(REDUCED_MOTION_KEY);
        if (savedReducedMotion) {
          setIsReducedMotionEnabled(savedReducedMotion === 'true');
        }
      } catch (error) {
        console.error('Failed to load accessibility preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem(FONT_SCALE_KEY, fontScale.toString());
        await AsyncStorage.setItem(
          HIGH_CONTRAST_KEY,
          isHighContrastEnabled.toString()
        );
        await AsyncStorage.setItem(
          REDUCED_MOTION_KEY,
          isReducedMotionEnabled.toString()
        );
      } catch (error) {
        console.error('Failed to save accessibility preferences:', error);
      }
    };

    savePreferences();
  }, [fontScale, isHighContrastEnabled, isReducedMotionEnabled]);

  // Font scale functions
  const increaseFontScale = () => {
    setFontScale(prev => Math.min(prev + 0.1, 1.5));
  };

  const decreaseFontScale = () => {
    setFontScale(prev => Math.max(prev - 0.1, 0.8));
  };

  const resetFontScale = () => {
    setFontScale(1);
  };

  // Toggle high contrast mode
  const toggleHighContrast = () => {
    setIsHighContrastEnabled(prev => !prev);
  };

  // Toggle reduced motion
  const toggleReducedMotion = () => {
    setIsReducedMotionEnabled(prev => !prev);
  };

  // Screen reader announcement
  const announceForAccessibility = (message: string) => {
    // This is a placeholder - in a real app, you would use
    // AccessibilityInfo.announceForAccessibility from react-native
    console.log('Accessibility announcement:', message);
  };

  // Determine current theme and colors - Force Light Mode Always
  const isDarkMode = false; // Force light mode - ignore system preference
  let theme: 'light' | 'dark' | 'high-contrast' = 'light'; // Always light
  let colors = Colors; // Always use light colors

  if (isHighContrastEnabled) {
    theme = 'high-contrast';
    colors = HighContrastColors; // Always use light high contrast colors
  }

  // Context value
  const contextValue: AccessibilityContextType = {
    fontScale,
    increaseFontScale,
    decreaseFontScale,
    resetFontScale,

    isHighContrastEnabled,
    toggleHighContrast,

    isReducedMotionEnabled,
    toggleReducedMotion,

    announceForAccessibility,

    theme,
    colors,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook for using accessibility context
export const useAccessibility = () => useContext(AccessibilityContext);
