import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface.primary,
        },
        headerTitleStyle: {
          ...Typography.heading.h3,
          color: Colors.text.primary,
        },
        headerTintColor: Colors.primary[700],
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
        name="analytics"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="wardrobe-analytics"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="saved"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="personal-info"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ai-settings"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="storage"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="data-export"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="delete-account"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="accessibility"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
