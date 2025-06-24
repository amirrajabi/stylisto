import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibleImageProps extends Omit<ImageProps, 'alt'> {
  accessibilityLabel: string;
  fallbackText?: string;
  showBorder?: boolean;
}

export const AccessibleImage: React.FC<AccessibleImageProps> = ({
  accessibilityLabel,
  fallbackText,
  showBorder = false,
  style,
  ...props
}) => {
  const { colors } = useAccessibility();
  
  // Generate proper accessibility props based on platform
  const getAccessibilityProps = () => {
    if (Platform.OS === 'web') {
      return {
        alt: accessibilityLabel,
        role: 'img',
        'aria-label': accessibilityLabel,
      };
    } else {
      return {
        accessible: true,
        accessibilityLabel: accessibilityLabel,
        accessibilityRole: 'image',
      };
    }
  };
  
  return (
    <View style={[
      showBorder && styles.borderContainer,
      showBorder && { borderColor: colors.border.primary },
    ]}>
      <Image
        {...props}
        style={[
          styles.image,
          style,
        ]}
        {...getAccessibilityProps()}
        // Add fallback for when image fails to load
        onError={({ nativeEvent: { error } }) => {
          console.warn('Image failed to load:', error);
          props.onError?.({ nativeEvent: { error } });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    overflow: 'hidden',
  },
  borderContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
});