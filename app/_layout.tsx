import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { store } from '../store/store';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Colors } from '../constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background.primary }
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="item-detail" 
            options={{ 
              presentation: 'modal',
              headerShown: true,
              title: 'Item Details'
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
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="+not-found" 
            options={{ 
              headerShown: false,
              title: 'Not Found'
            }} 
          />
        </Stack>
        <StatusBar style="auto" />
      </Provider>
    </GestureHandlerRootView>
  );
}