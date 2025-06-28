import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function AuthLayout() {
  const defaultScreenOptions = {
    headerShown: false,
    contentStyle: { backgroundColor: Colors.primary[600] },
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    animationDuration: 350,
    animation: Platform.select({
      ios: 'slide_from_right' as const,
      android: 'slide_from_right' as const,
      default: 'slide_from_right' as const,
    }),
    animationTypeForReplace: 'push' as const,
  };

  return (
    <Stack screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          animation: 'fade_from_bottom',
          animationDuration: 300,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Register',
          animation: 'slide_from_right',
          animationDuration: 350,
          gestureDirection: 'horizontal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Forgot Password',
          animation: 'slide_from_bottom',
          animationDuration: 400,
          gestureDirection: 'vertical',
          gestureEnabled: true,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: 'Reset Password',
          animation: 'slide_from_bottom',
          animationDuration: 400,
          gestureDirection: 'vertical',
          gestureEnabled: true,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
