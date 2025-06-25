import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  ArrowLeft,
  BarChart,
  Eye,
  EyeOff,
  Save,
  Share2,
  Shield,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { H1 } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';

interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  shareOutfits: boolean;
  analyticsTracking: boolean;
}

export default function PrivacyScreen() {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'private',
    shareOutfits: false,
    analyticsTracking: true,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Load privacy settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('@privacy_settings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    const checkForChanges = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('@privacy_settings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          const changed =
            parsedSettings.profileVisibility !== settings.profileVisibility ||
            parsedSettings.shareOutfits !== settings.shareOutfits ||
            parsedSettings.analyticsTracking !== settings.analyticsTracking;

          setHasChanges(changed);
        } else {
          // If no stored settings, check against defaults
          const changed =
            settings.profileVisibility !== 'private' ||
            settings.shareOutfits !== false ||
            settings.analyticsTracking !== true;

          setHasChanges(changed);
        }
      } catch (error) {
        console.error('Error checking for changes:', error);
      }
    };

    checkForChanges();
  }, [settings]);

  const handleToggle = (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('@privacy_settings', JSON.stringify(settings));

      // In a real app, you would also update the server
      // await supabase.from('user_preferences').upsert({
      //   user_id: user.id,
      //   privacy_settings: settings
      // });

      Alert.alert(
        'Settings Saved',
        'Your privacy settings have been updated.',
        [{ text: 'OK' }]
      );

      setHasChanges(false);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert(
        'Error',
        'Failed to save privacy settings. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <H1>Privacy & Security</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Control how your information is used and who can see your profile
            and outfits.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Eye
                  size={18}
                  color={
                    settings.profileVisibility === 'public'
                      ? Colors.success[500]
                      : Colors.error[500]
                  }
                />
                <Text style={styles.settingTitle}>Profile Visibility</Text>
              </View>
              <Text style={styles.settingDescription}>
                {settings.profileVisibility === 'public'
                  ? 'Your profile is visible to other users'
                  : 'Your profile is private and only visible to you'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.visibilityButton,
                settings.profileVisibility === 'public'
                  ? styles.visibilityPublic
                  : styles.visibilityPrivate,
              ]}
              onPress={() =>
                handleToggle(
                  'profileVisibility',
                  settings.profileVisibility === 'public' ? 'private' : 'public'
                )
              }
            >
              <Text style={styles.visibilityButtonText}>
                {settings.profileVisibility === 'public' ? 'Public' : 'Private'}
              </Text>
              {settings.profileVisibility === 'public' ? (
                <Eye size={16} color={Colors.success[500]} />
              ) : (
                <EyeOff size={16} color={Colors.error[500]} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Share2 size={18} color={Colors.primary[700]} />
                <Text style={styles.settingTitle}>Share Outfits</Text>
              </View>
              <Text style={styles.settingDescription}>
                Allow your outfits to be shared with the Stylisto community
              </Text>
            </View>
            <Switch
              value={settings.shareOutfits}
              onValueChange={value => handleToggle('shareOutfits', value)}
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[500],
              }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <BarChart size={18} color={Colors.primary[700]} />
                <Text style={styles.settingTitle}>Analytics Tracking</Text>
              </View>
              <Text style={styles.settingDescription}>
                Allow anonymous usage data collection to help improve the app
              </Text>
            </View>
            <Switch
              value={settings.analyticsTracking}
              onValueChange={value => handleToggle('analyticsTracking', value)}
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[500],
              }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Data & Privacy</Text>
          </View>

          <TouchableOpacity
            style={styles.dataButton}
            onPress={() => router.push('/profile/data-export')}
          >
            <Text style={styles.dataButtonText}>Export Your Data</Text>
            <Text style={styles.dataButtonDescription}>
              Download a copy of all your personal data (GDPR compliant)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataButton, styles.deleteDataButton]}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => router.push('/profile/delete-account'),
                  },
                ]
              );
            }}
          >
            <Text style={styles.deleteDataButtonText}>Delete Your Account</Text>
            <Text style={styles.deleteDataButtonDescription}>
              Permanently delete your account and all associated data
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Privacy Information</Text>
          <Text style={styles.infoText}>
            Stylisto is committed to protecting your privacy and personal data.
            We only collect information that's necessary to provide you with the
            best experience.
          </Text>
          <Text style={styles.infoText}>
            You can read our full privacy policy and terms of service for more
            details on how we handle your data.
          </Text>

          <TouchableOpacity
            style={styles.policyButton}
            onPress={() => {
              setShowPrivacyModal(true);
            }}
          >
            <Text style={styles.policyButtonText}>View Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.policyButton}
            onPress={() => {
              setShowTermsModal(true);
            }}
          >
            <Text style={styles.policyButtonText}>View Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {hasChanges && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color={Colors.white} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  sectionDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  settingTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  settingDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    gap: Spacing.xs,
  },
  visibilityPublic: {
    backgroundColor: Colors.success[50],
  },
  visibilityPrivate: {
    backgroundColor: Colors.error[50],
  },
  visibilityButtonText: {
    ...Typography.caption.medium,
    fontWeight: '500',
  },
  dataButton: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  dataButtonText: {
    ...Typography.body.medium,
    color: Colors.primary[700],
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  dataButtonDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  deleteDataButton: {
    backgroundColor: Colors.error[50],
  },
  deleteDataButtonText: {
    ...Typography.body.medium,
    color: Colors.error[700],
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  deleteDataButtonDescription: {
    ...Typography.body.small,
    color: Colors.error[600],
  },
  infoSection: {
    backgroundColor: Colors.info[50],
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    ...Typography.body.medium,
    color: Colors.info[700],
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  infoText: {
    ...Typography.body.small,
    color: Colors.info[700],
    marginBottom: Spacing.md,
  },
  policyButton: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  policyButtonText: {
    ...Typography.body.medium,
    color: Colors.info[700],
    fontWeight: '500',
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  saveButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
});
