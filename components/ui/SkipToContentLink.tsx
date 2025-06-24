import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useAccessibility } from './AccessibilityProvider';
import { Spacing, Layout } from '../../constants/Spacing';

interface SkipToContentLinkProps {
  contentId: string;
  label?: string;
}

export const SkipToContentLink: React.FC<SkipToContentLinkProps> = ({
  contentId,
  label = 'Skip to content',
}) => {
  const { colors } = useAccessibility();
  const [isFocused, setIsFocused] = useState(false);
  
  // Skip link only works on web
  if (Platform.OS !== 'web') {
    return null;
  }
  
  const handlePress = () => {
    // Find the content element and focus it
    const contentElement = document.getElementById(contentId);
    if (contentElement) {
      contentElement.setAttribute('tabindex', '-1');
      contentElement.focus();
      
      // Remove tabindex after focus to prevent keyboard trap
      setTimeout(() => {
        contentElement.removeAttribute('tabindex');
      }, 100);
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.primary[700] },
        isFocused ? styles.visible : styles.hidden,
      ]}
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint="Skips to main content"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      // Web-specific props
      {...(Platform.OS === 'web' ? {
        tabIndex: 0,
        role: 'link',
        'aria-label': label,
      } : {})}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  hidden: {
    transform: [{ translateY: -100 }],
  },
  visible: {
    transform: [{ translateY: 0 }],
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});