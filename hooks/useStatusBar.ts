import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Colors } from '../constants/Colors';

export type StatusBarStyle = 'auto' | 'light' | 'dark';

interface UseStatusBarOptions {
  style?: StatusBarStyle;
  backgroundColor?: string;
  translucent?: boolean;
  hidden?: boolean;
}

export function useStatusBar(options: UseStatusBarOptions = {}) {
  const {
    style = 'auto',
    backgroundColor = 'transparent',
    translucent = true,
    hidden = false,
  } = options;

  useEffect(() => {
    if (Platform.OS === 'android' && backgroundColor !== 'transparent') {
      SystemUI.setBackgroundColorAsync(backgroundColor);
    }
  }, [backgroundColor]);

  return {
    style,
    backgroundColor: translucent ? 'transparent' : backgroundColor,
    translucent,
    hidden,
  };
}

export function useStatusBarForScreen(
  screenType: 'light' | 'dark' | 'camera' | 'modal'
) {
  const getOptionsForScreenType = (
    type: typeof screenType
  ): UseStatusBarOptions => {
    switch (type) {
      case 'camera':
        return {
          style: 'light',
          backgroundColor: '#000000',
          translucent: false,
          hidden: false,
        };
      case 'modal':
        return {
          style: 'dark',
          backgroundColor: '#ffffff',
          translucent: false,
          hidden: false,
        };
      case 'light':
        return {
          style: 'dark',
          backgroundColor: '#ffffff',
          translucent: true,
          hidden: false,
        };
      case 'dark':
      default:
        return {
          style: 'dark',
          backgroundColor: Colors.background.primary,
          translucent: true,
          hidden: false,
        };
    }
  };

  return useStatusBar(getOptionsForScreenType(screenType));
}

export function useForceLightMode() {
  useEffect(() => {
    const setupLightMode = async () => {
      try {
        await SystemUI.setBackgroundColorAsync(Colors.background.primary);
      } catch (error) {
        console.error('Failed to set system UI background:', error);
      }
    };

    setupLightMode();
  }, []);
}
