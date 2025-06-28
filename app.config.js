import { version } from './package.json';

export default {
  expo: {
    name: 'STYLISTO',
    slug: 'stylisto',
    version,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'stylisto',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.stylisto.app',
      infoPlist: {
        UIViewControllerBasedStatusBarAppearance: false,
        UIUserInterfaceStyle: 'Light',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      package: 'com.stylisto.app',
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: 'metro',
      output: 'server',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-system-ui',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#FFFFFF',
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          organization: 'stylisto',
          project: 'stylisto-app',
          url: process.env.EXPO_PUBLIC_SENTRY_URL,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },

    extra: {
      eas: {
        projectId: 'your-project-id',
      },
      errorHandling: {
        sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        enableInDev: false,
        logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      },
      weatherApiKey:
        process.env.WEATHER_API_KEY || process.env.EXPO_PUBLIC_WEATHER_API_KEY,
    },
  },
};
