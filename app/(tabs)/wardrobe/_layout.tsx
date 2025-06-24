import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

export default function WardrobeLayout() {
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
          title: 'My Wardrobe',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add-item"
        options={{
          title: 'Add Item',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="categories"
        options={{
          title: 'Categories',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
