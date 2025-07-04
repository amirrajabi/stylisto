import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

export default function StylistLayout() {
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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Stylist',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="preferences"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="weather"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
