import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Shadows } from '../../constants/Shadows';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useAccessibility } from '../ui/AccessibilityProvider';

interface ProfileHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
}) => {
  const { colors } = useAccessibility();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background.primary,
          borderBottomColor: colors.border.secondary,
        },
      ]}
    >
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
      )}
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    ...Shadows.sm,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  title: {
    ...Typography.heading.h2,
    fontWeight: 'bold',
    flex: 1,
  },
});
