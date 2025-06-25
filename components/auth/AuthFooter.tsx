import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { BodySmall } from '../ui';

interface AuthFooterProps {
  currentPage: 'login' | 'register';
}

export function AuthFooter({ currentPage }: AuthFooterProps) {
  const currentYear = new Date().getFullYear();

  const handleTermsPress = () => {
    // For now, open a web link. Later this can be replaced with an in-app modal or screen
    Linking.openURL('https://stylisto.app/terms-and-conditions');
  };

  const handlePrivacyPress = () => {
    // For now, open a web link. Later this can be replaced with an in-app modal or screen
    Linking.openURL('https://stylisto.app/privacy-policy');
  };

  const handleNavigationPress = () => {
    if (currentPage === 'login') {
      router.push('/(auth)/register');
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      {/* Navigation Links */}
      <View style={styles.navigationContainer}>
        <Pressable
          onPress={handleNavigationPress}
          style={({ pressed }) => [
            styles.navigationPressable,
            pressed && styles.pressedState,
          ]}
        >
          <BodySmall color="secondary" style={styles.navigationText}>
            {currentPage === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <BodySmall color="primary" style={styles.linkText}>
              {currentPage === 'login' ? 'Sign Up' : 'Sign In'}
            </BodySmall>
          </BodySmall>
        </Pressable>
      </View>

      {/* Legal Links */}
      <View style={styles.legalContainer}>
        <View style={styles.legalLinksRow}>
          <Pressable
            onPress={handleTermsPress}
            style={({ pressed }) => [
              styles.legalPressable,
              pressed && styles.pressedState,
            ]}
          >
            <BodySmall color="secondary" style={styles.legalLink}>
              Terms & Conditions
            </BodySmall>
          </Pressable>

          <BodySmall color="secondary" style={styles.separator}>
            •
          </BodySmall>

          <Pressable
            onPress={handlePrivacyPress}
            style={({ pressed }) => [
              styles.legalPressable,
              pressed && styles.pressedState,
            ]}
          >
            <BodySmall color="secondary" style={styles.legalLink}>
              Privacy Policy
            </BodySmall>
          </Pressable>
        </View>

        {/* Dynamic Copyright */}
        <BodySmall color="secondary" style={styles.copyrightText}>
          © {currentYear} Stylisto. All rights reserved.
        </BodySmall>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 100, // Ensure minimum height for better layout
  },
  navigationContainer: {
    alignItems: 'center',
    width: '100%',
  },
  navigationPressable: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    minHeight: 32, // Ensure touchable area
  },
  navigationText: {
    textAlign: 'center',
    lineHeight: 20, // Explicit line height for better text visibility
  },
  linkText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 20, // Explicit line height for better text visibility
  },
  legalContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  legalPressable: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: 6,
    minHeight: 28, // Ensure touchable area
  },
  legalLink: {
    textDecorationLine: 'underline',
    fontWeight: '500',
    lineHeight: 18, // Explicit line height for better text visibility
  },
  separator: {
    fontSize: 12,
    lineHeight: 18, // Explicit line height
    opacity: 0.7,
    marginHorizontal: Spacing.xs,
  },
  copyrightText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16, // Explicit line height for better text visibility
    opacity: 0.8,
    paddingTop: Spacing.xs,
  },
  pressedState: {
    opacity: 0.7,
    backgroundColor: Colors.neutral[100],
  },
});
