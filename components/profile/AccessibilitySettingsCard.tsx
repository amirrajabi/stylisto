import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Eye, ChevronRight } from 'lucide-react-native';
import { useAccessibility } from '../ui/AccessibilityProvider';
import { Body } from '../ui/AccessibleText';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

export const AccessibilitySettingsCard: React.FC = () => {
  const { colors, isHighContrastEnabled, fontScale } = useAccessibility();
  
  const handlePress = () => {
    router.push('/profile/accessibility');
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.surface.primary,
          borderColor: colors.border.primary,
          ...Shadows.sm,
        }
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Accessibility settings"
      accessibilityHint="Navigate to accessibility settings screen"
    >
      <View style={styles.iconContainer}>
        <View style={[
          styles.iconBackground,
          { backgroundColor: colors.primary[50] }
        ]}>
          <Eye size={24} color={colors.primary[700]} />
        </View>
      </View>
      
      <View style={styles.content}>
        <Body 
          weight="semibold" 
          style={{ color: colors.text.primary }}
        >
          Accessibility Settings
        </Body>
        
        <View style={styles.settingsPreview}>
          {isHighContrastEnabled && (
            <View style={[
              styles.settingBadge,
              { backgroundColor: colors.primary[100] }
            ]}>
              <Body 
                size="small" 
                style={{ color: colors.primary[700] }}
              >
                High Contrast
              </Body>
            </View>
          )}
          
          {fontScale !== 1 && (
            <View style={[
              styles.settingBadge,
              { backgroundColor: colors.primary[100] }
            ]}>
              <Body 
                size="small" 
                style={{ color: colors.primary[700] }}
              >
                Text Size: {Math.round(fontScale * 100)}%
              </Body>
            </View>
          )}
        </View>
      </View>
      
      <ChevronRight size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  settingsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  settingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.full,
  },
});