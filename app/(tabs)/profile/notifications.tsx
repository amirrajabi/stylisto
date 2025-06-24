import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Calendar, Cloud, Sparkles, Megaphone, Save } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { H1 } from '../../../components/ui';

interface NotificationSettings {
  outfitReminders: boolean;
  weatherAlerts: boolean;
  styleTips: boolean;
  newFeatures: boolean;
}

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    outfitReminders: true,
    weatherAlerts: true,
    styleTips: true,
    newFeatures: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load notification settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('@notification_settings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    const checkForChanges = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('@notification_settings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          const changed = 
            parsedSettings.outfitReminders !== settings.outfitReminders ||
            parsedSettings.weatherAlerts !== settings.weatherAlerts ||
            parsedSettings.styleTips !== settings.styleTips ||
            parsedSettings.newFeatures !== settings.newFeatures;
          
          setHasChanges(changed);
        } else {
          // If no stored settings, check against defaults
          const changed = 
            settings.outfitReminders !== true ||
            settings.weatherAlerts !== true ||
            settings.styleTips !== true ||
            settings.newFeatures !== true;
          
          setHasChanges(changed);
        }
      } catch (error) {
        console.error('Error checking for changes:', error);
      }
    };
    
    checkForChanges();
  }, [settings]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('@notification_settings', JSON.stringify(settings));
      
      // In a real app, you would also update the server
      // await supabase.from('user_preferences').upsert({
      //   user_id: user.id,
      //   notification_settings: settings
      // });
      
      Alert.alert(
        'Settings Saved',
        'Your notification preferences have been updated.',
        [{ text: 'OK' }]
      );
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings. Please try again.');
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
        <H1>Notifications</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Notification Preferences</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Control which notifications you receive from Stylisto. These settings affect both push notifications and in-app alerts.
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Calendar size={18} color={Colors.primary[700]} />
                <Text style={styles.settingTitle}>Outfit Reminders</Text>
              </View>
              <Text style={styles.settingDescription}>
                Get reminders to plan your outfits for upcoming events and daily wear
              </Text>
            </View>
            <Switch
              value={settings.outfitReminders}
              onValueChange={() => handleToggle('outfitReminders')}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Cloud size={18} color={Colors.info[500]} />
                <Text style={styles.settingTitle}>Weather Alerts</Text>
              </View>
              <Text style={styles.settingDescription}>
                Receive notifications about weather changes that might affect your outfit choices
              </Text>
            </View>
            <Switch
              value={settings.weatherAlerts}
              onValueChange={() => handleToggle('weatherAlerts')}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Sparkles size={18} color={Colors.secondary[500]} />
                <Text style={styles.settingTitle}>Style Tips</Text>
              </View>
              <Text style={styles.settingDescription}>
                Get personalized style recommendations and tips based on your wardrobe
              </Text>
            </View>
            <Switch
              value={settings.styleTips}
              onValueChange={() => handleToggle('styleTips')}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleContainer}>
                <Megaphone size={18} color={Colors.success[500]} />
                <Text style={styles.settingTitle}>New Features</Text>
              </View>
              <Text style={styles.settingDescription}>
                Stay updated about new app features, improvements, and updates
              </Text>
            </View>
            <Switch
              value={settings.newFeatures}
              onValueChange={() => handleToggle('newFeatures')}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Notifications</Text>
          <Text style={styles.infoText}>
            Stylisto uses notifications to enhance your experience and help you get the most out of the app. You can change these settings at any time.
          </Text>
          <Text style={styles.infoText}>
            Some notifications, such as account security alerts, cannot be disabled as they are essential to the service.
          </Text>
        </View>
      </ScrollView>
      
      {hasChanges && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
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
    marginBottom: Spacing.sm,
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