import { version } from './package.json';

export default {
  expo: {
    name: "stylisto",
    slug: "stylisto",
    version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "stylisto",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.stylisto.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.stylisto.app",
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "server",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "@sentry/react-native/expo",
        {
          organization: "stylisto",
          project: "stylisto-app",
          url: process.env.EXPO_PUBLIC_SENTRY_URL
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    hooks: {
      postPublish: [
        {
          file: "@sentry/react-native/expo/hooks/post-publish",
          config: {
            organization: "stylisto",
            project: "stylisto-app",
            authToken: process.env.SENTRY_AUTH_TOKEN
          }
        }
      ]
    },
    extra: {
      eas: {
        projectId: "your-project-id"
      },
      errorHandling: {
        sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        enableInDev: false,
        logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      }
    }
  }
};