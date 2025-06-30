import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { useAccessibility } from '../../../components/ui/AccessibilityProvider';
import { AccessibilitySettings } from '../../../components/ui/AccessibilitySettings';
import { H1 } from '../../../components/ui/AccessibleText';
import { ContrastChecker } from '../../../components/ui/ContrastChecker';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';

export default function AccessibilityScreen() {
  const { colors } = useAccessibility();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <ProfileHeader title="Accessibility" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <AccessibilitySettings />

        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface.primary,
              ...Shadows.sm,
            },
          ]}
        >
          <H1 size="medium" style={{ marginBottom: Spacing.md }}>
            Color Contrast Checker
          </H1>

          <ContrastChecker
            foregroundColor={colors.text.primary}
            backgroundColor={colors.surface.primary}
            fontSize={16}
          />

          <ContrastChecker
            foregroundColor={colors.text.secondary}
            backgroundColor={colors.surface.primary}
            fontSize={14}
          />

          <ContrastChecker
            foregroundColor={colors.primary[700]}
            backgroundColor={colors.surface.primary}
            fontSize={16}
            isBold={true}
          />

          <ContrastChecker
            foregroundColor="#FFFFFF"
            backgroundColor={colors.primary[700]}
            fontSize={16}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
});
