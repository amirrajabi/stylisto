import React from 'react';
import { View, StyleSheet, Switch, Platform } from 'react-native';
import { Sun, Moon, ZoomIn, ZoomOut, Minus, Plus, Eye } from 'lucide-react-native';
import { useAccessibility } from './AccessibilityProvider';
import { H3, Body, Caption } from './AccessibleText';
import { AccessibleButton } from './AccessibleButton';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface AccessibilitySettingsProps {
  onClose?: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ onClose }) => {
  const { 
    fontScale, 
    increaseFontScale, 
    decreaseFontScale, 
    resetFontScale,
    isHighContrastEnabled,
    toggleHighContrast,
    isReducedMotionEnabled,
    toggleReducedMotion,
    colors,
  } = useAccessibility();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface.primary }]}>
      <H3 
        style={[styles.title, { color: colors.text.primary }]}
        accessibilityRole="header"
      >
        Accessibility Settings
      </H3>
      
      {/* Font Size Section */}
      <View style={[styles.section, { borderBottomColor: colors.border.primary }]}>
        <Body 
          weight="semibold" 
          style={{ color: colors.text.primary }}
          accessibilityRole="header"
          accessibilityLevel={4}
        >
          Text Size
        </Body>
        
        <Caption style={{ color: colors.text.secondary }}>
          Adjust the size of text throughout the app
        </Caption>
        
        <View style={styles.fontSizeControls}>
          <AccessibleButton
            title=""
            variant="outline"
            size="small"
            leftIcon={<ZoomOut size={20} color={colors.text.primary} />}
            onPress={decreaseFontScale}
            disabled={fontScale <= 0.8}
            accessibilityLabel="Decrease text size"
            accessibilityHint="Makes text smaller throughout the app"
            style={styles.fontSizeButton}
          />
          
          <View style={styles.fontSizeValueContainer}>
            <Body 
              weight="medium" 
              style={{ color: colors.text.primary }}
              accessibilityLabel={`Current text size scale: ${Math.round(fontScale * 100)}%`}
            >
              {Math.round(fontScale * 100)}%
            </Body>
          </View>
          
          <AccessibleButton
            title=""
            variant="outline"
            size="small"
            leftIcon={<ZoomIn size={20} color={colors.text.primary} />}
            onPress={increaseFontScale}
            disabled={fontScale >= 1.5}
            accessibilityLabel="Increase text size"
            accessibilityHint="Makes text larger throughout the app"
            style={styles.fontSizeButton}
          />
          
          <AccessibleButton
            title="Reset"
            variant="ghost"
            size="small"
            onPress={resetFontScale}
            disabled={fontScale === 1}
            accessibilityLabel="Reset text size"
            accessibilityHint="Returns text size to default"
          />
        </View>
      </View>
      
      {/* High Contrast Mode */}
      <View style={[styles.section, { borderBottomColor: colors.border.primary }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Body 
              weight="semibold" 
              style={{ color: colors.text.primary }}
              accessibilityRole="text"
            >
              High Contrast Mode
            </Body>
            <Caption style={{ color: colors.text.secondary }}>
              Increases contrast for better readability
            </Caption>
          </View>
          
          <Switch
            value={isHighContrastEnabled}
            onValueChange={toggleHighContrast}
            trackColor={{ 
              false: colors.neutral[300], 
              true: colors.primary[500] 
            }}
            thumbColor={Platform.OS === 'ios' ? undefined : colors.white}
            ios_backgroundColor={colors.neutral[300]}
            accessibilityLabel="High contrast mode"
            accessibilityHint={isHighContrastEnabled ? 
              "Double tap to turn off high contrast mode" : 
              "Double tap to turn on high contrast mode"
            }
            accessibilityRole="switch"
            accessibilityState={{ checked: isHighContrastEnabled }}
          />
        </View>
        
        <View style={styles.contrastPreview}>
          <View style={[
            styles.contrastSample, 
            { 
              backgroundColor: isHighContrastEnabled ? '#000000' : colors.primary[700],
            }
          ]}>
            <Caption 
              style={{ 
                color: '#FFFFFF',
                fontWeight: '600',
              }}
            >
              Sample Text
            </Caption>
          </View>
          
          <View style={[
            styles.contrastSample, 
            { 
              backgroundColor: isHighContrastEnabled ? '#FFFFFF' : colors.surface.secondary,
              borderWidth: 1,
              borderColor: isHighContrastEnabled ? '#000000' : colors.border.primary,
            }
          ]}>
            <Caption 
              style={{ 
                color: isHighContrastEnabled ? '#000000' : colors.text.secondary,
                fontWeight: '600',
              }}
            >
              Sample Text
            </Caption>
          </View>
        </View>
      </View>
      
      {/* Reduced Motion */}
      <View style={[styles.section, { borderBottomColor: colors.border.primary }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Body 
              weight="semibold" 
              style={{ color: colors.text.primary }}
              accessibilityRole="text"
            >
              Reduced Motion
            </Body>
            <Caption style={{ color: colors.text.secondary }}>
              Minimizes animated effects
            </Caption>
          </View>
          
          <Switch
            value={isReducedMotionEnabled}
            onValueChange={toggleReducedMotion}
            trackColor={{ 
              false: colors.neutral[300], 
              true: colors.primary[500] 
            }}
            thumbColor={Platform.OS === 'ios' ? undefined : colors.white}
            ios_backgroundColor={colors.neutral[300]}
            accessibilityLabel="Reduced motion"
            accessibilityHint={isReducedMotionEnabled ? 
              "Double tap to turn off reduced motion" : 
              "Double tap to turn on reduced motion"
            }
            accessibilityRole="switch"
            accessibilityState={{ checked: isReducedMotionEnabled }}
          />
        </View>
      </View>
      
      {/* Screen Reader Information */}
      <View style={styles.section}>
        <Body 
          weight="semibold" 
          style={{ color: colors.text.primary }}
          accessibilityRole="header"
          accessibilityLevel={4}
        >
          Screen Reader Support
        </Body>
        
        <Caption style={{ color: colors.text.secondary }}>
          This app is fully compatible with screen readers. Use VoiceOver on iOS or TalkBack on Android to navigate.
        </Caption>
        
        <View style={styles.screenReaderTips}>
          <View style={[styles.tipItem, { borderBottomColor: colors.border.primary }]}>
            <Eye size={16} color={colors.primary[700]} />
            <Caption style={{ color: colors.text.secondary }}>
              All buttons, images, and interactive elements have descriptive labels
            </Caption>
          </View>
          
          <View style={[styles.tipItem, { borderBottomColor: colors.border.primary }]}>
            <Eye size={16} color={colors.primary[700]} />
            <Caption style={{ color: colors.text.secondary }}>
              Headings are properly marked for easy navigation
            </Caption>
          </View>
          
          <View style={styles.tipItem}>
            <Eye size={16} color={colors.primary[700]} />
            <Caption style={{ color: colors.text.secondary }}>
              Form fields include clear labels and error messages
            </Caption>
          </View>
        </View>
      </View>
      
      {/* Close Button */}
      {onClose && (
        <AccessibleButton
          title="Close Settings"
          onPress={onClose}
          variant="primary"
          accessibilityLabel="Close accessibility settings"
          accessibilityHint="Returns to the previous screen"
          style={styles.closeButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Shadows.md,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  fontSizeButton: {
    width: 40,
    height: 40,
    padding: 0,
  },
  fontSizeValueContainer: {
    marginHorizontal: Spacing.md,
    minWidth: 50,
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  contrastPreview: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  contrastSample: {
    flex: 1,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenReaderTips: {
    marginTop: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  closeButton: {
    marginTop: Spacing.lg,
  },
});