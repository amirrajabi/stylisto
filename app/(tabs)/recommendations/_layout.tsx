import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

export default function RecommendationsLayout() {
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
          title: 'Outfit Recommendations',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="details" 
        options={{ 
          title: 'Outfit Details',
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