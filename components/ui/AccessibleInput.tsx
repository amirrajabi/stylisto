import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { useAccessibility } from './AccessibilityProvider';
import { Body, Caption } from './AccessibleText';
import { Spacing, Layout } from '../../constants/Spacing';

interface AccessibleInputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  required?: boolean;
  containerStyle?: any;
  labelStyle?: any;
  inputContainerStyle?: any;
}

export const AccessibleInput = forwardRef<TextInput, AccessibleInputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  required = false,
  secureTextEntry = false,
  value,
  onChangeText,
  placeholder,
  containerStyle,
  labelStyle,
  inputContainerStyle,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...props
}, ref) => {
  const { colors, fontScale } = useAccessibility();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // Determine if the input is in an error state
  const hasError = !!error;
  
  // Determine border color based on state
  const getBorderColor = () => {
    if (hasError) return colors.error[500];
    if (isFocused) return colors.primary[700];
    return colors.border.primary;
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => !prev);
  };
  
  // Generate accessibility props
  const getAccessibilityProps = () => {
    const baseProps = {
      accessibilityLabel: accessibilityLabel || `${label}${required ? ', required' : ''}`,
      accessibilityHint: accessibilityHint || helperText,
      accessibilityState: {
        disabled: props.editable === false,
        required,
        invalid: hasError,
      },
    };
    
    // Add web-specific accessibility attributes
    if (Platform.OS === 'web') {
      return {
        ...baseProps,
        'aria-required': required,
        'aria-invalid': hasError,
        'aria-errormessage': hasError ? error : undefined,
        'aria-describedby': helperText ? `${label}-helper` : undefined,
      };
    }
    
    return baseProps;
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Body 
        weight="medium" 
        style={[
          styles.label, 
          { color: hasError ? colors.error[600] : colors.text.primary },
          labelStyle
        ]}
        accessibilityRole="text"
      >
        {label}
        {required && <Body color={colors.error[500]}> *</Body>}
      </Body>
      
      {/* Input container */}
      <View 
        style={[
          styles.inputContainer,
          { 
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 2 : 1,
          },
          inputContainerStyle
        ]}
      >
        {/* Left icon */}
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        {/* Text input */}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            { 
              color: colors.text.primary,
              fontSize: 16 * fontScale,
            },
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || showPasswordToggle) && styles.inputWithRightIcon,
            style
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...getAccessibilityProps()}
          {...props}
        />
        
        {/* Password toggle */}
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={togglePasswordVisibility}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
            accessibilityHint={isPasswordVisible ? "Double tap to hide password" : "Double tap to show password"}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={colors.text.secondary} />
            ) : (
              <Eye size={20} color={colors.text.secondary} />
            )}
          </TouchableOpacity>
        )}
        
        {/* Right icon */}
        {!showPasswordToggle && rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {/* Error message or helper text */}
      {(error || helperText) && (
        <View style={styles.messageContainer}>
          {hasError && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={colors.error[500]} />
              <Caption 
                style={[styles.errorText, { color: colors.error[600] }]}
                accessibilityRole="text"
                accessibilityLabel={`Error: ${error}`}
              >
                {error}
              </Caption>
            </View>
          )}
          
          {!hasError && helperText && (
            <Caption 
              style={[styles.helperText, { color: colors.text.secondary }]}
              accessibilityRole="text"
              id={Platform.OS === 'web' ? `${label}-helper` : undefined}
            >
              {helperText}
            </Caption>
          )}
        </View>
      )}
    </View>
  );
});

AccessibleInput.displayName = 'AccessibleInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.borderRadius.md,
    backgroundColor: 'transparent',
    minHeight: Layout.touchTarget.minimum,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    paddingLeft: Spacing.md,
  },
  rightIcon: {
    paddingRight: Spacing.md,
  },
  messageContainer: {
    marginTop: Spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorText: {
    flex: 1,
  },
  helperText: {
    flex: 1,
  },
});