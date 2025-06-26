import { MapPin } from 'lucide-react-native';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { LocationPermissionStatus } from '../../lib/weatherService';
import { Button, Modal } from '../ui';

interface LocationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestPermission: () => Promise<LocationPermissionStatus>;
  permissionStatus: LocationPermissionStatus | null;
}

export function LocationPermissionModal({
  visible,
  onClose,
  onRequestPermission,
  permissionStatus,
}: LocationPermissionModalProps) {
  const handleRequestPermission = async () => {
    try {
      const status = await onRequestPermission();

      if (status.granted) {
        onClose();
      } else if (!status.canAskAgain) {
        Alert.alert(
          'Location Permission Required',
          'Location permission is required for weather features. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // For now, just close the modal
                // In a real app, you would open the device settings
                onClose();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Location Permission">
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <MapPin size={48} color={Colors.primary[500]} />
        </View>

        <Text style={styles.title}>Enable Location Access</Text>

        <Text style={styles.description}>
          We need access to your location to provide accurate weather-based
          outfit recommendations.
        </Text>

        <View style={styles.benefitsList}>
          <Text style={styles.benefitItem}>
            • Weather-appropriate outfit suggestions
          </Text>
          <Text style={styles.benefitItem}>
            • Real-time temperature adjustments
          </Text>
          <Text style={styles.benefitItem}>• Local weather conditions</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Allow Location Access"
            onPress={handleRequestPermission}
            style={styles.allowButton}
          />
          <Button
            title="Not Now"
            onPress={onClose}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>

        <Text style={styles.privacyNote}>
          Your location data is only used for weather information and is not
          stored or shared.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body.large,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: Spacing.xl,
  },
  benefitItem: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  buttonContainer: {
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
  },
  allowButton: {
    marginBottom: Spacing.md,
  },
  cancelButton: {},
  privacyNote: {
    ...Typography.body.small,
    color: Colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
