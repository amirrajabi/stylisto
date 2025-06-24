import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

export default function GenerateLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface.primary,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border.primary,
        },
        headerTitleStyle: {
          ...Typography.heading.h3,
          color: Colors.text.primary,
        },
        headerTintColor: Colors.primary[700],
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: Colors.background.secondary },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Generate Outfits',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="preferences" 
        options={{ 
          title: 'Style Preferences',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="weather" 
        options={{ 
          title: 'Weather Settings',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}