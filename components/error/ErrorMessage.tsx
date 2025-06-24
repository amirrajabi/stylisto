import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

export enum ErrorMessageType {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

interface ErrorMessageProps {
  message: string;
  type?: ErrorMessageType;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  testID?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = ErrorMessageType.ERROR,
  onDismiss,
  action,
  testID,
}) => {
  // Get styles based on type
  const getContainerStyle = () => {
    switch (type) {
      case ErrorMessageType.ERROR:
        return styles.errorContainer;
      case ErrorMessageType.WARNING:
        return styles.warningContainer;
      case ErrorMessageType.INFO:
        return styles.infoContainer;
      case ErrorMessageType.SUCCESS:
        return styles.successContainer;
      default:
        return styles.errorContainer;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case ErrorMessageType.ERROR:
        return Colors.error[500];
      case ErrorMessageType.WARNING:
        return Colors.warning[500];
      case ErrorMessageType.INFO:
        return Colors.info[500];
      case ErrorMessageType.SUCCESS:
        return Colors.success[500];
      default:
        return Colors.error[500];
    }
  };

  const getActionStyle = () => {
    switch (type) {
      case ErrorMessageType.ERROR:
        return styles.errorAction;
      case ErrorMessageType.WARNING:
        return styles.warningAction;
      case ErrorMessageType.INFO:
        return styles.infoAction;
      case ErrorMessageType.SUCCESS:
        return styles.successAction;
      default:
        return styles.errorAction;
    }
  };

  return (
    <View style={[styles.container, getContainerStyle()]} testID={testID}>
      <View style={styles.iconContainer}>
        <AlertCircle size={20} color={getIconColor()} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.message}>{message}</Text>
        
        {action && (
          <TouchableOpacity 
            style={[styles.actionButton, getActionStyle()]}
            onPress={action.onPress}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {onDismiss && (
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={onDismiss}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <X size={16} color={Colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  errorContainer: {
    backgroundColor: Colors.error[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.error[500],
  },
  warningContainer: {
    backgroundColor: Colors.warning[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning[500],
  },
  infoContainer: {
    backgroundColor: Colors.info[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.info[500],
  },
  successContainer: {
    backgroundColor: Colors.success[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.success[500],
  },
  iconContainer: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    ...Typography.body.small,
    color: Colors.text.primary,
    flexShrink: 1,
  },
  dismissButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
  },
  errorAction: {
    backgroundColor: Colors.error[100],
  },
  warningAction: {
    backgroundColor: Colors.warning[100],
  },
  infoAction: {
    backgroundColor: Colors.info[100],
  },
  successAction: {
    backgroundColor: Colors.success[100],
  },
  actionText: {
    ...Typography.caption.medium,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});