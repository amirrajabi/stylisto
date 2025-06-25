import { Image } from 'expo-image';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';

interface AuthLayoutProps {
  children: React.ReactNode;
  showLogo?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  showLogo = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          <View style={styles.topSection}>
            {showLogo && (
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require('../../assets/images/splash-icon.png')}
                    style={styles.logoImage}
                    contentFit="contain"
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.contentCard}>{children}</View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary[600],
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  topSection: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  contentCard: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius['2xl'],
    padding: Spacing.xl,
    minHeight: 400,
    ...Shadows.xl,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
