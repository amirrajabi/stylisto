import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout, Spacing } from '../../constants/Spacing';
import { BodySmall } from './Typography';

interface CheckBoxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  children?: React.ReactNode;
}

export const CheckBox: React.FC<CheckBoxProps> = ({
  checked,
  onToggle,
  label,
  disabled = false,
  error = false,
  children,
}) => {
  const getCheckboxStyle = () => [
    styles.checkbox,
    checked && styles.checkboxChecked,
    error && styles.checkboxError,
    disabled && styles.checkboxDisabled,
  ];

  const getCheckmarkColor = () => {
    if (disabled) return Colors.text.disabled;
    return Colors.white;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.containerDisabled,
      ]}
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
    >
      <View style={getCheckboxStyle()}>
        {checked && (
          <Check size={16} color={getCheckmarkColor()} strokeWidth={2.5} />
        )}
      </View>
      {(label || children) && (
        <View style={styles.labelContainer}>
          {label ? (
            <BodySmall
              style={[
                styles.label,
                error && styles.labelError,
                disabled && styles.labelDisabled,
              ]}
            >
              {label}
            </BodySmall>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2, // Align with text baseline
  },
  checkboxChecked: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  checkboxError: {
    borderColor: Colors.error[500],
  },
  checkboxDisabled: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[300],
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    lineHeight: 20,
    color: Colors.text.primary,
  },
  labelError: {
    color: Colors.error[600],
  },
  labelDisabled: {
    color: Colors.text.disabled,
  },
});
