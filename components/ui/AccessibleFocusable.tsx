import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, Pressable, ViewProps } from 'react-native';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibleFocusableProps extends ViewProps {
  children: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  isFocusable?: boolean;
}

export const AccessibleFocusable: React.FC<AccessibleFocusableProps> = ({
  children,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'none',
  isFocusable = true,
  style,
  ...props
}) => {
  const { colors } = useAccessibility();
  const [isFocused, setIsFocused] = useState(false);
  const viewRef = useRef<View>(null);
  
  // Focus handling for web
  useEffect(() => {
    if (Platform.OS === 'web' && viewRef.current) {
      const element = viewRef.current as unknown as HTMLElement;
      
      const handleFocus = () => {
        setIsFocused(true);
        onFocus?.();
      };
      
      const handleBlur = () => {
        setIsFocused(false);
        onBlur?.();
      };
      
      element.addEventListener('focus', handleFocus);
      element.addEventListener('blur', handleBlur);
      
      return () => {
        element.removeEventListener('focus', handleFocus);
        element.removeEventListener('blur', handleBlur);
      };
    }
  }, [onFocus, onBlur]);
  
  // Use Pressable on web for keyboard focus
  if (Platform.OS === 'web') {
    return (
      <Pressable
        ref={viewRef as any}
        style={[
          styles.container,
          isFocused && [styles.focused, { borderColor: colors.primary[700] }],
          style,
        ]}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole as any}
        tabIndex={isFocusable ? 0 : -1}
        {...props}
      >
        {children}
      </Pressable>
    );
  }
  
  // Use View for native platforms
  return (
    <View
      style={[style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole as any}
      accessible={isFocusable}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    outlineStyle: 'none',
  },
  focused: {
    borderWidth: 2,
    borderRadius: 4,
  },
});