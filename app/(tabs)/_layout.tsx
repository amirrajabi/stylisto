import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Shirt, Sparkles, Heart, User } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary[700],
        tabBarInactiveTintColor: Colors.text.tertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface.primary,
          borderTopWidth: 1,
          borderTopColor: Colors.border.primary,
          paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.sm,
          paddingTop: Spacing.sm,
          height: Platform.OS === 'ios' ? 85 : 65,
          elevation: 8,
          shadowColor: Colors.shadow.medium,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: Typography.caption.medium.fontSize,
          fontWeight: Typography.caption.medium.fontWeight,
          fontFamily: Typography.caption.medium.fontFamily,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color, size, focused }) => (
            <Shirt 
              size={size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'Wardrobe tab',
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Outfits',
          tabBarIcon: ({ color, size, focused }) => (
            <Sparkles 
              size={size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'Outfit recommendations tab',
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size, focused }) => (
            <Heart 
              size={size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
              fill={focused ? color : 'transparent'}
            />
          ),
          tabBarAccessibilityLabel: 'Saved outfits tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <User 
              size={size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tabs>
  );
}