import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface SocialLoginButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onPress,
  loading = false,
  disabled = false,
}) => {
  const isGoogle = provider === 'google';
  
  const buttonStyle = [
    styles.button,
    isGoogle ? styles.googleButton : styles.appleButton,
    disabled && styles.disabledButton,
  ];

  const textStyle = [
    styles.text,
    isGoogle ? styles.googleText : styles.appleText,
    disabled && styles.disabledText,
  ];

  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={isGoogle ? Colors.text.primary : Colors.white}
        />
      );
    }

    // For production, you would use actual Google/Apple icons
    return (
      <View style={[styles.iconPlaceholder, isGoogle ? styles.googleIcon : styles.appleIcon]}>
        <Text style={styles.iconText}>
          {isGoogle ? 'G' : ''}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderIcon()}
      <Text style={textStyle}>
        {loading
          ? 'Signing in...'
          : `Continue with ${isGoogle ? 'Google' : 'Apple'}`
        }
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    minHeight: Layout.touchTarget.comfortable,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  googleButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  appleButton: {
    backgroundColor: Colors.black,
  },
  disabledButton: {
    opacity: 0.6,
  },
  text: {
    ...Typography.button.medium,
    marginLeft: Spacing.md,
  },
  googleText: {
    color: Colors.text.primary,
  },
  appleText: {
    color: Colors.white,
  },
  disabledText: {
    opacity: 0.6,
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: Layout.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    backgroundColor: Colors.primary[100],
  },
  appleIcon: {
    backgroundColor: Colors.white,
  },
  iconText: {
    ...Typography.caption.small,
    fontWeight: '700',
  },
});