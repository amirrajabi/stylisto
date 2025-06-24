import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

export default function RecommendationsLayout() {
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
          title: 'Recommendations',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: 'Recommendation Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Recommendation Settings',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
