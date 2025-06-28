import AsyncStorage from '@react-native-async-storage/async-storage';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Database, Key, Sparkles, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useVisionAI } from '../../lib/visionAI';
import { BodySmall } from '../ui';

interface AISettingsPanelProps {
  onClose?: () => void;
}

export const AISettingsPanel: React.FC<AISettingsPanelProps> = ({
  onClose,
}) => {
  const { setApiKey, clearCache, getCacheStats } = useVisionAI();

  const [apiKey, setApiKeyState] = useState('');
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [highQualityAnalysis, setHighQualityAnalysis] = useState(false);
  const [cacheStats, setCacheStats] = useState({ entries: 0, size: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedApiKey = await AsyncStorage.getItem('@vision_api_key');
        if (storedApiKey) {
          setApiKeyState(storedApiKey);
          setApiKey(storedApiKey);
        }

        const autoAnalyzeSetting = await AsyncStorage.getItem('@auto_analyze');
        setAutoAnalyze(autoAnalyzeSetting !== 'false');

        const highQualitySetting = await AsyncStorage.getItem(
          '@high_quality_analysis'
        );
        setHighQualityAnalysis(highQualitySetting === 'true');

        // Get cache stats
        const stats = getCacheStats();
        setCacheStats(stats);
      } catch (error) {
        console.error('Failed to load AI settings:', error);
      }
    };

    loadSettings();
  }, [setApiKey, getCacheStats]);

  const handleSaveApiKey = async () => {
    try {
      setIsLoading(true);

      if (!apiKey.trim()) {
        Alert.alert('Error', 'Please enter a valid API key');
        return;
      }

      // Save API key to storage
      await AsyncStorage.setItem('@vision_api_key', apiKey);

      // Set API key in service
      setApiKey(apiKey);

      Alert.alert('Success', 'API key saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
      console.error('Failed to save API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoAnalyze = async (value: boolean) => {
    setAutoAnalyze(value);
    await AsyncStorage.setItem('@auto_analyze', value ? 'true' : 'false');
  };

  const handleToggleHighQuality = async (value: boolean) => {
    setHighQualityAnalysis(value);
    await AsyncStorage.setItem(
      '@high_quality_analysis',
      value ? 'true' : 'false'
    );
  };

  const handleClearCache = async () => {
    try {
      setIsLoading(true);

      await clearCache();

      // Update cache stats
      const stats = getCacheStats();
      setCacheStats(stats);

      Alert.alert('Success', 'Analysis cache cleared successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear cache');
      console.error('Failed to clear cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={24} color={Colors.primary[700]} />
          <Text style={styles.title}>AI Analysis Settings</Text>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* API Key Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Key size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Google Cloud Vision API Key</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Enter your Google Cloud Vision API key to enable AI clothing
            analysis. You can get an API key from the Google Cloud Console.
          </Text>

          <View style={styles.apiKeyContainer}>
            <TextInput
              style={styles.apiKeyInput}
              value={apiKey}
              onChangeText={setApiKeyState}
              placeholder="Enter your API key"
              placeholderTextColor={Colors.text.tertiary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveApiKey}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.apiKeyHelp}>
            Your API key is stored securely on your device and is never shared.
          </Text>
        </View>

        {/* Analysis Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Analysis Settings</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-Analyze Images</Text>
              <Text style={styles.settingDescription}>
                Automatically analyze images when adding new items
              </Text>
            </View>
            <Switch
              value={autoAnalyze}
              onValueChange={handleToggleAutoAnalyze}
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[500],
              }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>High Quality Analysis</Text>
              <Text style={styles.settingDescription}>
                Use more detailed analysis (uses more API quota)
              </Text>
            </View>
            <Switch
              value={highQualityAnalysis}
              onValueChange={handleToggleHighQuality}
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[500],
              }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Cache Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Cache Management</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Analysis results are cached to reduce API usage and improve
            performance.
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{cacheStats.entries}</Text>
              <Text style={styles.statLabel}>Cached Items</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatBytes(cacheStats.size)}
              </Text>
              <Text style={styles.statLabel}>Cache Size</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearCacheButton}
            onPress={handleClearCache}
            disabled={isLoading || cacheStats.entries === 0}
          >
            <Trash2 size={16} color={Colors.white} />
            <Text style={styles.clearCacheButtonText}>
              Clear Analysis Cache
            </Text>
          </TouchableOpacity>
        </View>

        {/* About AI Analysis */}
        <View style={styles.section}>
          <Text style={styles.aboutTitle}>About AI Clothing Analysis</Text>

          <Text style={styles.aboutText}>
            <MaskedView
              style={{ flexDirection: 'row' }}
              maskElement={
                <BodySmall
                  style={[styles.aboutText, { backgroundColor: 'transparent' }]}
                >
                  Stylisto
                </BodySmall>
              }
            >
              <LinearGradient
                colors={[Colors.primary[500], Colors.secondary[500]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, height: 16 }}
              />
            </MaskedView>{' '}
            uses Google Cloud Vision AI to automatically analyze your clothing
            items. The AI can detect:
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.featureItem}>
              • Clothing categories and types
            </Text>
            <Text style={styles.featureItem}>• Dominant colors</Text>
            <Text style={styles.featureItem}>• Appropriate seasons</Text>
            <Text style={styles.featureItem}>• Suitable occasions</Text>
            <Text style={styles.featureItem}>• Descriptive tags</Text>
          </View>

          <Text style={styles.aboutText}>
            All analysis is performed securely, and your images are never stored
            on our servers. Analysis results are cached locally on your device
            to improve performance and reduce API usage.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
  },
  closeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButtonText: {
    ...Typography.body.medium,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  sectionDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
    backgroundColor: Colors.surface.secondary,
  },
  saveButton: {
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  saveButtonText: {
    ...Typography.button.small,
    color: Colors.white,
  },
  apiKeyHelp: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
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
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: Spacing.md,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
  },
  statLabel: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error[500],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  clearCacheButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  aboutTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  aboutText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  featureList: {
    marginBottom: Spacing.md,
  },
  featureItem: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
});
