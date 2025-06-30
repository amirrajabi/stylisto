import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Globe,
  Moon,
  Save,
  Settings as SettingsIcon,
  Smartphone,
  Sun,
  Trash2,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';

// Import ChevronRight
import { ChevronRight } from 'lucide-react-native';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  autoSave: boolean;
  cacheImages: boolean;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    fontSize: 'medium',
    language: 'en',
    autoSave: true,
    cacheImages: true,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [cacheSize, setCacheSize] = useState('0 KB');

  // Load app settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('@app_settings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }

        // Calculate cache size
        calculateCacheSize();
      } catch (error) {
        console.error('Failed to load app settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    const checkForChanges = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('@app_settings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          const changed =
            JSON.stringify(parsedSettings) !== JSON.stringify(settings);
          setHasChanges(changed);
        } else {
          // If no stored settings, check against defaults
          const defaultSettings: AppSettings = {
            theme: 'system',
            fontSize: 'medium',
            language: 'en',
            autoSave: true,
            cacheImages: true,
          };

          const changed =
            JSON.stringify(defaultSettings) !== JSON.stringify(settings);
          setHasChanges(changed);
        }
      } catch (error) {
        console.error('Error checking for changes:', error);
      }
    };

    checkForChanges();
  }, [settings]);

  const calculateCacheSize = async () => {
    try {
      // In a real app, you would calculate the actual cache size
      // For this demo, we'll use a mock value
      const mockCacheSize = Math.floor(Math.random() * 50) + 10; // 10-60 MB
      setCacheSize(`${mockCacheSize} MB`);
    } catch (error) {
      console.error('Error calculating cache size:', error);
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({
      ...prev,
      theme,
    }));
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    setSettings(prev => ({
      ...prev,
      fontSize,
    }));
  };

  const handleToggle = (key: keyof AppSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('@app_settings', JSON.stringify(settings));

      Alert.alert('Settings Saved', 'Your app settings have been updated.', [
        { text: 'OK' },
      ]);

      setHasChanges(false);

      // In a real app, you would apply the settings here
      // For example, update the theme, font size, etc.
    } catch (error) {
      console.error('Error saving app settings:', error);
      Alert.alert('Error', 'Failed to save app settings. Please try again.');
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will remove all cached images and data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would clear the actual cache
              // For this demo, we'll just show a success message

              // Clear image cache
              await AsyncStorage.removeItem('@wardrobe_image_cache');

              // Clear other caches
              const cacheKeys = [
                '@outfit_recommendations_cache',
                '@weather_data_cache',
                '@clothing_analysis_cache',
              ];

              await Promise.all(
                cacheKeys.map(key => AsyncStorage.removeItem(key))
              );

              // Update cache size
              setCacheSize('0 KB');

              Alert.alert(
                'Cache Cleared',
                'App cache has been successfully cleared.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader title="Settings" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>App Settings</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Customize your app experience with these settings.
          </Text>

          {/* Theme Selection */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingGroupTitle}>Theme</Text>
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  settings.theme === 'light' && styles.selectedThemeOption,
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <Sun
                  size={24}
                  color={
                    settings.theme === 'light'
                      ? Colors.primary[700]
                      : Colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    settings.theme === 'light' &&
                      styles.selectedThemeOptionText,
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  settings.theme === 'dark' && styles.selectedThemeOption,
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <Moon
                  size={24}
                  color={
                    settings.theme === 'dark'
                      ? Colors.primary[700]
                      : Colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    settings.theme === 'dark' && styles.selectedThemeOptionText,
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  settings.theme === 'system' && styles.selectedThemeOption,
                ]}
                onPress={() => handleThemeChange('system')}
              >
                <Smartphone
                  size={24}
                  color={
                    settings.theme === 'system'
                      ? Colors.primary[700]
                      : Colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    settings.theme === 'system' &&
                      styles.selectedThemeOptionText,
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Font Size Selection */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingGroupTitle}>Font Size</Text>
            <View style={styles.fontSizeOptions}>
              <TouchableOpacity
                style={[
                  styles.fontSizeOption,
                  settings.fontSize === 'small' &&
                    styles.selectedFontSizeOption,
                ]}
                onPress={() => handleFontSizeChange('small')}
              >
                <Text
                  style={[
                    styles.fontSizeOptionText,
                    { fontSize: 14 },
                    settings.fontSize === 'small' &&
                      styles.selectedFontSizeOptionText,
                  ]}
                >
                  Small
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fontSizeOption,
                  settings.fontSize === 'medium' &&
                    styles.selectedFontSizeOption,
                ]}
                onPress={() => handleFontSizeChange('medium')}
              >
                <Text
                  style={[
                    styles.fontSizeOptionText,
                    { fontSize: 16 },
                    settings.fontSize === 'medium' &&
                      styles.selectedFontSizeOptionText,
                  ]}
                >
                  Medium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fontSizeOption,
                  settings.fontSize === 'large' &&
                    styles.selectedFontSizeOption,
                ]}
                onPress={() => handleFontSizeChange('large')}
              >
                <Text
                  style={[
                    styles.fontSizeOptionText,
                    { fontSize: 18 },
                    settings.fontSize === 'large' &&
                      styles.selectedFontSizeOptionText,
                  ]}
                >
                  Large
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Language Selection */}
          <TouchableOpacity
            style={styles.languageSelector}
            onPress={() => {
              // In a real app, this would open a language selector
              Alert.alert('Language', 'Select your preferred language', [
                {
                  text: 'English',
                  onPress: () =>
                    setSettings(prev => ({ ...prev, language: 'en' })),
                },
                {
                  text: 'Spanish',
                  onPress: () =>
                    setSettings(prev => ({ ...prev, language: 'es' })),
                },
                {
                  text: 'French',
                  onPress: () =>
                    setSettings(prev => ({ ...prev, language: 'fr' })),
                },
                {
                  text: 'German',
                  onPress: () =>
                    setSettings(prev => ({ ...prev, language: 'de' })),
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            <View style={styles.languageSelectorLeft}>
              <Globe size={20} color={Colors.text.secondary} />
              <Text style={styles.languageSelectorText}>Language</Text>
            </View>
            <View style={styles.languageSelectorRight}>
              <Text style={styles.languageValue}>
                {settings.language === 'en'
                  ? 'English'
                  : settings.language === 'es'
                    ? 'Spanish'
                    : settings.language === 'fr'
                      ? 'French'
                      : settings.language === 'de'
                        ? 'German'
                        : 'English'}
              </Text>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </View>
          </TouchableOpacity>

          {/* Other Settings */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-Save Changes</Text>
              <Text style={styles.settingDescription}>
                Automatically save changes to outfits and wardrobe items
              </Text>
            </View>
            <Switch
              value={settings.autoSave}
              onValueChange={() => handleToggle('autoSave')}
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[500],
              }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Cache Images</Text>
              <Text style={styles.settingDescription}>
                Store images locally for faster loading (uses more storage)
              </Text>
            </View>
            <Switch
              value={settings.cacheImages}
              onValueChange={() => handleToggle('cacheImages')}
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
            <Trash2 size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Storage & Cache</Text>
          </View>

          <View style={styles.storageInfo}>
            <Text style={styles.storageInfoTitle}>Cache Size</Text>
            <Text style={styles.storageInfoValue}>{cacheSize}</Text>
          </View>

          <TouchableOpacity
            style={styles.clearCacheButton}
            onPress={handleClearCache}
          >
            <Trash2 size={20} color={Colors.white} />
            <Text style={styles.clearCacheButtonText}>Clear Cache</Text>
          </TouchableOpacity>

          <Text style={styles.cacheDescription}>
            Clearing the cache will remove all temporarily stored images and
            data. This will not delete any of your wardrobe items or outfits.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>2025.06.24</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Platform</Text>
            <Text style={styles.aboutValue}>{Platform.OS}</Text>
          </View>

          <TouchableOpacity
            style={styles.aboutButton}
            onPress={() => {
              // In a real app, this would open the about screen
              Alert.alert(
                'About',
                'This would open the about screen in a real app.'
              );
            }}
          >
            <Text style={styles.aboutButtonText}>About Stylisto</Text>
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
  settingGroup: {
    marginBottom: Spacing.lg,
  },
  settingGroupTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThemeOption: {
    borderColor: Colors.primary[700],
    backgroundColor: Colors.primary[50],
  },
  themeOptionText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  selectedThemeOptionText: {
    color: Colors.primary[700],
    fontWeight: '500',
  },
  fontSizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  fontSizeOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFontSizeOption: {
    borderColor: Colors.primary[700],
    backgroundColor: Colors.primary[50],
  },
  fontSizeOptionText: {
    color: Colors.text.secondary,
  },
  selectedFontSizeOptionText: {
    color: Colors.primary[700],
    fontWeight: '500',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    marginBottom: Spacing.md,
  },
  languageSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  languageSelectorText: {
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  languageSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  languageValue: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
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
  settingTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  storageInfoTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  storageInfoValue: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error[500],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  clearCacheButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  cacheDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  aboutLabel: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  aboutValue: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  aboutButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  aboutButtonText: {
    ...Typography.body.medium,
    color: Colors.primary[700],
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
