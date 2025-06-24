import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { AccessibilitySettings } from '../../../components/ui/AccessibilitySettings';
import { useAccessibility } from '../../../components/ui/AccessibilityProvider';
import { H1 } from '../../../components/ui/AccessibleText';
import { ContrastChecker } from '../../../components/ui/ContrastChecker';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';

export default function AccessibilityScreen() {
  const { colors } = useAccessibility();
  
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
      accessibilityRole="none"
    >
      <View 
        style={[
          styles.header, 
          { 
            backgroundColor: colors.surface.primary,
            borderBottomColor: colors.border.primary,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <H1 accessibilityRole="header">Accessibility</H1>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        accessibilityRole="scrollView"
        id="main-content"
      >
        <AccessibilitySettings />
        
        <View 
          style={[
            styles.section, 
            { 
              backgroundColor: colors.surface.primary,
              ...Shadows.sm,
            }
          ]}
        >
          <H1 
            size="medium" 
            accessibilityRole="header"
            style={{ marginBottom: Spacing.md }}
          >
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
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