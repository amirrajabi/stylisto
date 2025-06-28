import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Platform } from 'react-native';

export interface NavigationOptions {
  hapticFeedback?: boolean;
  delay?: number;
  replace?: boolean;
}

const DEFAULT_OPTIONS: NavigationOptions = {
  hapticFeedback: true,
  delay: 0,
  replace: false,
};

export const smoothNavigate = async (
  path: string,
  options: NavigationOptions = {}
) => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (config.hapticFeedback && Platform.OS === 'ios') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  if (config.delay && config.delay > 0) {
    await new Promise(resolve => setTimeout(resolve, config.delay));
  }

  if (config.replace) {
    router.replace(path as any);
  } else {
    router.push(path as any);
  }
};

export const smoothNavigateWithParams = async (
  pathname: string,
  params: Record<string, any>,
  options: NavigationOptions = {}
) => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (config.hapticFeedback && Platform.OS === 'ios') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  if (config.delay && config.delay > 0) {
    await new Promise(resolve => setTimeout(resolve, config.delay));
  }

  const navigation = { pathname, params };

  if (config.replace) {
    router.replace(navigation as any);
  } else {
    router.push(navigation as any);
  }
};

export const authNavigation = {
  toLogin: (email?: string, options?: NavigationOptions) => {
    if (email) {
      return smoothNavigateWithParams('/(auth)/login', { email }, options);
    }
    return smoothNavigate('/(auth)/login', options);
  },

  toRegister: (options?: NavigationOptions) => {
    return smoothNavigate('/(auth)/register', options);
  },

  toForgotPassword: (email?: string, options?: NavigationOptions) => {
    if (email) {
      return smoothNavigateWithParams(
        '/(auth)/forgot-password',
        { email },
        options
      );
    }
    return smoothNavigate('/(auth)/forgot-password', options);
  },

  toResetPassword: (token?: string, options?: NavigationOptions) => {
    if (token) {
      return smoothNavigateWithParams(
        '/(auth)/reset-password',
        { token },
        options
      );
    }
    return smoothNavigate('/(auth)/reset-password', options);
  },

  toMainApp: (options?: NavigationOptions) => {
    return smoothNavigate('/(tabs)', { ...options, replace: true });
  },

  goBack: async (options?: NavigationOptions) => {
    const config = { ...DEFAULT_OPTIONS, ...options };

    if (config.hapticFeedback && Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (config.delay && config.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  },
};
