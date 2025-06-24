import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

export default function ProfileLayout() {
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
        headerShown: false, // Hide the header by default for all profile screens
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="personal-info" 
        options={{ 
          title: 'Personal Information',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifications',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="privacy" 
        options={{ 
          title: 'Privacy & Security',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="help" 
        options={{ 
          title: 'Help & Support',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="ai-settings" 
        options={{ 
          title: 'AI Settings',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="storage" 
        options={{ 
          title: 'Storage Management',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}