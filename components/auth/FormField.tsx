import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Eye, EyeOff, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  returnKeyType = 'done',
  onSubmitEditing,
  disabled = false,
  leftIcon,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focusAnimation] = useState(new Animated.Value(0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? Colors.error[500] : Colors.border.primary,
      error ? Colors.error[500] : Colors.primary[700],
    ],
  });

  const labelColor = focusAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? Colors.error[600] : Colors.text.secondary,
      error ? Colors.error[600] : Colors.primary[700],
    ],
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.label, { color: labelColor }]}>
        {label}
      </Animated.Text>
      
      <Animated.View style={[styles.inputContainer, { borderColor }]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            secureTextEntry && styles.inputWithRightIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          selectTextOnFocus={!disabled}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={Colors.text.secondary} />
            ) : (
              <Eye size={20} color={Colors.text.secondary} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color={Colors.error[500]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body.small,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.surface.primary,
    minHeight: Layout.touchTarget.comfortable,
  },
  leftIconContainer: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  eyeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  errorText: {
    ...Typography.caption.medium,
    color: Colors.error[600],
    flex: 1,
  },
});