/**
 * Input Component
 *
 * A comprehensive input component with validation, accessibility,
 * and multiple variants for the design system.
 */

import React, { forwardRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  // Content
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // Behavior
  required?: boolean;
  disabled?: boolean;

  // Appearance
  variant?: 'default' | 'filled' | 'outline';
  size?: 'small' | 'medium' | 'large';

  // Validation
  error?: boolean;
  success?: boolean;

  // Style overrides
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      placeholder,
      helperText,
      errorText,
      leftIcon,
      rightIcon,
      required = false,
      disabled = false,
      variant = 'outline',
      size = 'medium',
      error = false,
      success = false,
      containerStyle,
      inputStyle,
      labelStyle,
      ...textInputProps
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = error || !!errorText;

    const getContainerStyle = () => [styles.container, containerStyle];

    const getInputContainerStyle = () => [
      styles.inputContainer,
      styles[`${variant}Container`],
      styles[`${size}Container`],
      isFocused && styles.focused,
      isFocused && styles[`${variant}Focused`],
      hasError && styles.error,
      hasError && styles[`${variant}Error`],
      success && styles.success,
      success && styles[`${variant}Success`],
      disabled && styles.disabled,
    ];

    const getInputStyle = () => [
      styles.input,
      styles[`${size}Input`],
      disabled && styles.disabledInput,
      inputStyle,
    ];

    const getLabelStyle = () => [
      styles.label,
      styles[`${size}Label`],
      hasError && styles.errorLabel,
      disabled && styles.disabledLabel,
      labelStyle,
    ];

    const getHelperTextStyle = () => [
      styles.helperText,
      hasError && styles.errorHelperText,
      success && styles.successHelperText,
    ];

    return (
      <View style={getContainerStyle()}>
        {label && (
          <Text style={getLabelStyle()}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        <View style={getInputContainerStyle()}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={getInputStyle()}
            placeholder={placeholder}
            placeholderTextColor={Colors.text.tertiary}
            editable={!disabled}
            onFocus={e => {
              setIsFocused(true);
              textInputProps.onFocus?.(e);
            }}
            onBlur={e => {
              setIsFocused(false);
              textInputProps.onBlur?.(e);
            }}
            accessibilityLabel={label}
            accessibilityHint={helperText || errorText}
            accessibilityState={{
              disabled,
            }}
            {...textInputProps}
          />

          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>

        {(helperText || errorText) && (
          <Text style={getHelperTextStyle()}>{errorText || helperText}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  // Container
  container: {
    marginBottom: Spacing.md,
  },

  // Label
  label: {
    marginBottom: Spacing.xs,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  smallLabel: {
    ...Typography.caption.medium,
    lineHeight: 18,
  },
  mediumLabel: {
    ...Typography.body.small,
    fontWeight: Typography.body.small.fontWeight,
    lineHeight: 20,
  },
  largeLabel: {
    ...Typography.body.medium,
    fontWeight: Typography.body.medium.fontWeight,
    lineHeight: 24,
  },
  required: {
    color: Colors.error[500],
    lineHeight: 20,
  },
  errorLabel: {
    color: Colors.error[600],
    lineHeight: 20,
  },
  disabledLabel: {
    color: Colors.text.disabled,
    lineHeight: 20,
  },

  // Input container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.borderRadius.md,
    minHeight: 44,
  },

  // Container variants
  defaultContainer: {
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  filledContainer: {
    backgroundColor: Colors.surface.secondary,
    borderWidth: 0,
  },
  outlineContainer: {
    backgroundColor: Colors.surface.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },

  // Container sizes
  smallContainer: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
  },
  mediumContainer: {
    minHeight: Layout.touchTarget.minimum,
    paddingHorizontal: Spacing.md,
  },
  largeContainer: {
    minHeight: Layout.touchTarget.comfortable,
    paddingHorizontal: Spacing.lg,
  },

  // States
  focused: {},
  defaultFocused: {
    borderBottomColor: Colors.border.focus,
  },
  filledFocused: {
    backgroundColor: Colors.surface.primary,
  },
  outlineFocused: {
    borderColor: Colors.border.focus,
    borderWidth: 2,
  },

  error: {},
  defaultError: {
    borderBottomColor: Colors.border.error,
  },
  filledError: {
    backgroundColor: Colors.error[50],
  },
  outlineError: {
    borderColor: Colors.border.error,
  },

  success: {},
  defaultSuccess: {
    borderBottomColor: Colors.border.success,
  },
  filledSuccess: {
    backgroundColor: Colors.success[50],
  },
  outlineSuccess: {
    borderColor: Colors.border.success,
  },

  disabled: {
    backgroundColor: Colors.surface.disabled,
    opacity: 0.6,
  },

  // Input
  input: {
    flex: 1,
    color: Colors.text.primary,
    lineHeight: 22,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  smallInput: {
    ...Typography.body.small,
    lineHeight: 20,
  },
  mediumInput: {
    ...Typography.body.medium,
    lineHeight: 22,
  },
  largeInput: {
    ...Typography.body.large,
    lineHeight: 26,
  },
  disabledInput: {
    color: Colors.text.disabled,
    lineHeight: 22,
  },

  // Icons
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },

  // Helper text
  helperText: {
    marginTop: Spacing.xs,
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  errorHelperText: {
    color: Colors.error[600],
    lineHeight: 18,
  },
  successHelperText: {
    color: Colors.success[600],
    lineHeight: 18,
  },
});
