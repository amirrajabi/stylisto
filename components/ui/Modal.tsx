/**
 * Modal Component
 * 
 * A comprehensive modal component with backdrop, animations,
 * and accessibility features for the design system.
 */

import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

const { height: screenHeight } = Dimensions.get('window');

export interface ModalProps {
  // Content
  children: React.ReactNode;
  title?: string;
  subtitle?: string;

  // Behavior
  visible: boolean;
  onClose: () => void;
  onBackdropPress?: () => void;
  dismissible?: boolean;

  // Appearance
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  position?: 'center' | 'bottom' | 'top';
  showCloseButton?: boolean;

  // Accessibility
  accessibilityLabel?: string;
  testID?: string;

  // Style overrides
  containerStyle?: any;
  contentStyle?: any;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  title,
  subtitle,
  visible,
  onClose,
  onBackdropPress,
  dismissible = true,
  size = 'medium',
  position = 'center',
  showCloseButton = true,
  accessibilityLabel,
  testID,
  containerStyle,
  contentStyle,
}) => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(
        visible ? Colors.background.overlay : Colors.background.primary,
        true
      );
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (dismissible) {
      onBackdropPress ? onBackdropPress() : onClose();
    }
  };

  const getModalStyle = () => [
    styles.modal,
    styles[`${position}Modal`],
  ];

  const getContentStyle = () => [
    styles.content,
    styles[`${size}Content`],
    styles[`${position}Content`],
    contentStyle,
  ];

  const renderHeader = () => {
    if (!title && !showCloseButton) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {title && (
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}
        </View>
        
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      accessibilityViewIsModal
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      <SafeAreaView style={[styles.overlay, containerStyle]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <View style={getModalStyle()}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}} // Prevent backdrop press when touching content
            >
              <View style={getContentStyle()}>
                {renderHeader()}
                <View style={styles.body}>
                  {children}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  // Overlay and backdrop
  overlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal positioning
  modal: {
    width: '100%',
    maxWidth: '100%',
  },
  centerModal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomModal: {
    justifyContent: 'flex-end',
  },
  topModal: {
    justifyContent: 'flex-start',
    paddingTop: Spacing['4xl'],
  },

  // Content sizing
  content: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.xl,
    ...Shadows.xl,
    maxHeight: screenHeight * 0.9,
  },
  smallContent: {
    width: '80%',
    maxWidth: 400,
  },
  mediumContent: {
    width: '90%',
    maxWidth: 600,
  },
  largeContent: {
    width: '95%',
    maxWidth: 800,
  },
  fullscreenContent: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    maxHeight: '100%',
  },

  // Position-specific content styles
  centerContent: {
    margin: Spacing.md,
  },
  bottomContent: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginTop: Spacing.lg,
  },
  topContent: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginBottom: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: title || subtitle ? Spacing.md : 0,
    borderBottomWidth: title || subtitle ? 1 : 0,
    borderBottomColor: Colors.border.primary,
  },
  headerContent: {
    flex: 1,
  },
  titleContainer: {
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: subtitle ? Spacing.xs : 0,
  },
  subtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  closeButton: {
    padding: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.surface.secondary,
  },

  // Body
  body: {
    padding: Spacing.lg,
  },
});