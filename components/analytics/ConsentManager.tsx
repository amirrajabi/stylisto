import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { analytics, ConsentStatus } from '../../lib/analytics';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConsentManagerProps {
  onConsentChange?: (status: ConsentStatus) => void;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({
  onConsentChange,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(ConsentStatus.UNKNOWN);
  const [hasShownInitialPrompt, setHasShownInitialPrompt] = useState(false);

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        // Check if we've shown the initial prompt before
        const hasShown = await AsyncStorage.getItem('@stylisto_consent_prompted');
        setHasShownInitialPrompt(!!hasShown);
        
        // Get current consent status
        const status = analytics.getConsentStatus();
        setConsentStatus(status);
        
        // Show consent modal if we haven't shown it before and consent is unknown
        if (!hasShown && status === ConsentStatus.UNKNOWN) {
          setShowModal(true);
          await AsyncStorage.setItem('@stylisto_consent_prompted', 'true');
        }
      } catch (error) {
        console.error('Failed to load consent state:', error);
      }
    };
    
    loadInitialState();
  }, []);

  // Handle consent change
  const handleConsentChange = async (status: ConsentStatus) => {
    setConsentStatus(status);
    await analytics.setConsentStatus(status);
    onConsentChange?.(status);
    setShowModal(false);
  };

  // Open consent settings
  const openConsentSettings = () => {
    setShowModal(true);
  };

  return (
    <>
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Privacy Settings</Text>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.sectionTitle}>Analytics Data Collection</Text>
              <Text style={styles.description}>
                We collect anonymous usage data to improve your experience with Stylisto. This helps us understand how you use the app and make it better.
              </Text>
              
              <View style={styles.consentSection}>
                <View style={styles.consentOption}>
                  <View style={styles.consentInfo}>
                    <Text style={styles.optionTitle}>Analytics</Text>
                    <Text style={styles.optionDescription}>
                      Collect anonymous usage data to improve the app experience
                    </Text>
                  </View>
                  <Switch
                    value={consentStatus === ConsentStatus.GRANTED}
                    onValueChange={(value) => 
                      handleConsentChange(value ? ConsentStatus.GRANTED : ConsentStatus.DENIED)
                    }
                    trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
                    thumbColor={Platform.OS === 'ios' ? undefined : Colors.white}
                  />
                </View>
              </View>
              
              <Text style={styles.sectionTitle}>Data We Collect</Text>
              <View style={styles.dataList}>
                <Text style={styles.dataItem}>• App usage patterns</Text>
                <Text style={styles.dataItem}>• Feature engagement</Text>
                <Text style={styles.dataItem}>• Device information (type, OS)</Text>
                <Text style={styles.dataItem}>• App performance metrics</Text>
                <Text style={styles.dataItem}>• Crash reports</Text>
              </View>
              
              <Text style={styles.sectionTitle}>How We Use Your Data</Text>
              <Text style={styles.description}>
                We use this information to:
              </Text>
              <View style={styles.dataList}>
                <Text style={styles.dataItem}>• Improve app features and usability</Text>
                <Text style={styles.dataItem}>• Fix bugs and performance issues</Text>
                <Text style={styles.dataItem}>• Develop new features based on usage patterns</Text>
                <Text style={styles.dataItem}>• Understand how users interact with the app</Text>
              </View>
              
              <Text style={styles.sectionTitle}>Your Privacy Rights</Text>
              <Text style={styles.description}>
                You can change your privacy settings at any time from the Profile tab. You can also request deletion of your data by contacting us.
              </Text>
              <Text style={styles.description}>
                We do not sell your personal data to third parties. All analytics data is anonymized and securely stored.
              </Text>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => handleConsentChange(ConsentStatus.DENIED)}
              >
                <Text style={styles.secondaryButtonText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => handleConsentChange(ConsentStatus.GRANTED)}
              >
                <Text style={styles.primaryButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Component to render a button to open consent settings
export const ConsentSettingsButton: React.FC<{
  onPress: () => void;
  style?: any;
}> = ({ onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.settingsButton, style]}
      onPress={onPress}
    >
      <Text style={styles.settingsButtonText}>Privacy Settings</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    ...Shadows.lg,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    textAlign: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  consentSection: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    marginVertical: Spacing.md,
  },
  consentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  consentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  optionTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  dataList: {
    marginBottom: Spacing.md,
  },
  dataItem: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary[700],
    marginLeft: Spacing.sm,
  },
  primaryButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: Colors.surface.secondary,
    marginRight: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.button.medium,
    color: Colors.text.primary,
  },
  settingsButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
  },
  settingsButtonText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
});