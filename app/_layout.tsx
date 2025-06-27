import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { ConsentManager } from '../components/analytics/ConsentManager';
import { AppErrorBoundary } from '../components/error/ErrorBoundary';
import { NetworkStatusBar } from '../components/error/NetworkStatusBar';
import { OfflineNotice } from '../components/error/OfflineNotice';
import { AccessibilityProvider } from '../components/ui/AccessibilityProvider';
import { SkipToContentLink } from '../components/ui/SkipToContentLink';
import { Colors } from '../constants/Colors';

import { analytics, ConsentStatus } from '../lib/analytics';
import { errorHandling } from '../lib/errorHandling';
import { store } from '../store/store';
import { imageCache } from '../utils/imageCache';

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        await errorHandling.initialize();
        await imageCache.initialize();
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }

    // If there was a font loading error, report it
    if (fontError) {
      errorHandling.captureError(fontError);
    }

    // Configure system UI for proper status bar behavior
    SystemUI.setBackgroundColorAsync(Colors.background.primary);
  }, [fontsLoaded, fontError]);

  // Handle analytics consent change
  const handleConsentChange = (status: ConsentStatus) => {
    if (status === ConsentStatus.GRANTED) {
      // Track app first open or return
      analytics.trackEvent('app_opened', {
        is_first_open: true, // You would determine this based on storage
      });
    }
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: Colors.background.primary }}
    >
      <Provider store={store}>
        <AccessibilityProvider>
          <AppErrorBoundary>
            <SkipToContentLink contentId="main-content" />
            <NetworkStatusBar />
            <OfflineNotice />
            <ConsentManager onConsentChange={handleConsentChange} />

            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background.primary },
                animation: 'fade_from_bottom',
                animationDuration: 200,
              }}
            >
              <Stack.Screen
                name="(auth)"
                options={{ headerShown: false, title: 'Authentication' }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false, title: 'Main App' }}
              />
              <Stack.Screen
                name="item-detail"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="item-tag-editor"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="outfit-builder"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="camera"
                options={{
                  presentation: 'fullScreenModal',
                  headerShown: false,
                  title: 'Camera',
                }}
              />
              <Stack.Screen
                name="error"
                options={{
                  headerShown: false,
                  title: 'Error',
                }}
              />
            </Stack>
            <StatusBar
              style="auto"
              backgroundColor="transparent"
              translucent={true}
            />
          </AppErrorBoundary>
        </AccessibilityProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
