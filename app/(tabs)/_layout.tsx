import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Heart, Shirt, Sparkles, User } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useAccessibility } from '../../components/ui/AccessibilityProvider';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';

export default function TabLayout() {
  const { colors, fontScale } = useAccessibility();

  const CustomTabBar = (props: any) => {
    return (
      <BlurView
        intensity={80}
        tint="light"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(255, 255, 255, 0.2)',
          },
        ]}
      >
        {React.cloneElement(props.children)}
      </BlurView>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[700],
        tabBarInactiveTintColor: colors.text.tertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor:
            Platform.OS === 'ios'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
          borderTopColor:
            Platform.OS === 'ios'
              ? 'rgba(255, 255, 255, 0.2)'
              : colors.border.primary,
          paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.sm,
          paddingTop: Spacing.sm,
          height: Platform.OS === 'ios' ? 85 : 65,
          elevation: 0,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          position: 'absolute',
          backdropFilter: 'blur(20px)',
        },
        tabBarBackground:
          Platform.OS === 'ios'
            ? () => (
                <BlurView
                  intensity={80}
                  tint="light"
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    borderTopWidth: 0.5,
                    borderTopColor: 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                />
              )
            : undefined,
        tabBarLabelStyle: {
          fontSize: Typography.caption.medium.fontSize * fontScale,
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
        name="index"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color, size, focused }) => (
            <Shirt
              size={size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
              accessibilityLabel=""
            />
          ),
          tabBarAccessibilityLabel: 'Wardrobe tab',
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Stylist',
          tabBarIcon: ({ color, size, focused }) => (
            <Sparkles
              size={size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
              accessibilityLabel=""
            />
          ),
          tabBarAccessibilityLabel: 'AI Stylist tab',
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, size, focused }) => (
            <Heart
              size={size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
              fill={focused ? color : 'transparent'}
              accessibilityLabel=""
            />
          ),
          tabBarAccessibilityLabel: 'Favorite outfits gallery tab',
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
              accessibilityLabel=""
            />
          ),
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tabs>
  );
}
