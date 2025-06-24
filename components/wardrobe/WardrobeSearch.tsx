import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Search, X, Mic } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface WardrobeSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const WardrobeSearch: React.FC<WardrobeSearchProps> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder = "Search your wardrobe...",
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnimation = useSharedValue(0);
  const clearButtonScale = useSharedValue(0);

  React.useEffect(() => {
    clearButtonScale.value = withSpring(value.length > 0 ? 1 : 0);
  }, [value]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusAnimation.value = withSpring(1);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusAnimation.value = withSpring(0);
    onBlur?.();
  }, [onBlur]);

  const handleClear = useCallback(() => {
    onChangeText('');
    Keyboard.dismiss();
  }, [onChangeText]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolate(
      focusAnimation.value,
      [0, 1],
      [0, 1]
    );

    return {
      borderColor: borderColor === 1 ? Colors.primary[700] : Colors.border.primary,
      borderWidth: borderColor === 1 ? 2 : 1,
    };
  });

  const clearButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clearButtonScale.value }],
    opacity: clearButtonScale.value,
  }));

  const searchIconAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      focusAnimation.value,
      [0, 1],
      [1, 1.1]
    );

    return {
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Animated.View style={[styles.searchIcon, searchIconAnimatedStyle]}>
        <Search 
          size={20} 
          color={isFocused ? Colors.primary[700] : Colors.text.tertiary} 
        />
      </Animated.View>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        selectionColor={Colors.primary[700]}
      />

      {value.length > 0 && (
        <AnimatedTouchableOpacity
          style={[styles.clearButton, clearButtonAnimatedStyle]}
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color={Colors.text.tertiary} />
        </AnimatedTouchableOpacity>
      )}

      {/* Voice search button - placeholder for future implementation */}
      {!isFocused && value.length === 0 && (
        <TouchableOpacity
          style={styles.micButton}
          onPress={() => {
            // TODO: Implement voice search
            console.log('Voice search not implemented yet');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Mic size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: Layout.touchTarget.minimum,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.text.primary,
    paddingVertical: 0, // Remove default padding
  },
  clearButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  micButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});