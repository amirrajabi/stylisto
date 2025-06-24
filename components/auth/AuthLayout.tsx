import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface AuthLayoutProps {
  children: React.ReactNode;
  showLogo?: boolean;
}

const { width, height } = Dimensions.get('window');

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  showLogo = true 
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background Image */}
          <View style={styles.backgroundContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
              style={styles.backgroundImage}
              contentFit="cover"
            />
            <View style={styles.overlay} />
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {showLogo && (
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Image
                    source={{ uri: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=200' }}
                    style={styles.logoImage}
                    contentFit="cover"
                  />
                </View>
              </View>
            )}

            <View style={styles.formContainer}>
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  contentContainer: {
    flex: 1,
    paddingTop: height * 0.15,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.white,
    padding: 4,
    ...Shadows.lg,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: Layout.borderRadius.full,
  },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderTopLeftRadius: Layout.borderRadius['3xl'],
    borderTopRightRadius: Layout.borderRadius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    minHeight: height * 0.6,
    ...Shadows.xl,
  },
});