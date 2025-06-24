import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import { store } from '../store/store';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Colors } from '../constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppErrorBoundary } from '../components/error/ErrorBoundary';
import { NetworkStatusBar } from '../components/error/NetworkStatusBar';
import { OfflineNotice } from '../components/error/OfflineNotice';
import { errorHandling } from '../lib/errorHandling';
import { AccessibilityProvider } from '../components/ui/AccessibilityProvider';
import { SkipToContentLink } from '../components/ui/SkipToContentLink';
import { imageCache } from '../utils/imageCache';

// Initialize error handling service
errorHandling.initialize();

// Initialize image cache
imageCache.initialize();

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
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
    
    // If there was a font loading error, report it
    if (fontError) {
      errorHandling.captureError(fontError);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AccessibilityProvider>
          <AppErrorBoundary>
            <SkipToContentLink contentId="main-content" />
            <NetworkStatusBar />
            <OfflineNotice />
            
            <Stack 
              screenOptions={{ 
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background.primary },
                animation: 'fade_from_bottom',
                animationDuration: 200,
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false, title: 'Authentication' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Main App' }} />
              <Stack.Screen 
                name="item-detail" 
                options={{ 
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Item Details'
                }} 
              />
              <Stack.Screen 
                name="item-tag-editor" 
                options={{ 
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Edit Tags'
                }} 
              />
              <Stack.Screen 
                name="outfit-detail" 
                options={{ 
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Outfit Details'
                }} 
              />
              <Stack.Screen 
                name="outfit-builder" 
                options={{ 
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Create Outfit'
                }} 
              />
              <Stack.Screen 
                name="camera" 
                options={{ 
                  presentation: 'fullScreenModal',
                  headerShown: false,
                  title: 'Camera'
                }} 
              />
              <Stack.Screen 
                name="error" 
                options={{ 
                  headerShown: false,
                  title: 'Error'
                }} 
              />
            </Stack>
            <StatusBar style="auto" />
          </AppErrorBoundary>
        </AccessibilityProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}