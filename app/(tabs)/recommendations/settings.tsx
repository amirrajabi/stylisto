import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Sliders, Sparkles, Palette, ThermometerSun, Calendar } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';

// Define the settings interface
interface RecommendationSettings {
  stylePreference: {
    formality: number;
    boldness: number;
    layering: number;
    colorfulness: number;
  };
  useWeather: boolean;
  weatherLocation: string;
  preferredColors: string[];
  excludedCategories: string[];
  saveHistory: boolean;
}

// Default settings
const DEFAULT_SETTINGS: RecommendationSettings = {
  stylePreference: {
    formality: 0.5,
    boldness: 0.5,
    layering: 0.5,
    colorfulness: 0.5,
  },
  useWeather: true,
  weatherLocation: '',
  preferredColors: [],
  excludedCategories: [],
  saveHistory: true,
};

// Custom slider component
const Slider: React.FC<{
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  leftLabel: string;
  rightLabel: string;
}> = ({ value, onValueChange, label, leftLabel, rightLabel }) => {
  const progress = useSharedValue(value);
  const isDragging = useSharedValue(false);
  
  useEffect(() => {
    progress.value = withTiming(value, { duration: 100 });
  }, [value]);
  
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: progress.value * 200 }],
      backgroundColor: isDragging.value ? Colors.primary[600] : Colors.primary[700],
      width: isDragging.value ? 28 : 24,
      height: isDragging.value ? 28 : 24,
    };
  });
  
  const trackStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
      backgroundColor: interpolateColor(
        progress.value,
        [0, 0.5, 1],
        [Colors.error[400], Colors.primary[500], Colors.success[500]]
      ),
    };
  });
  
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      const newValue = Math.max(0, Math.min(1, (e.absoluteX - 30) / 200));
      progress.value = newValue;
      onValueChange(newValue);
    })
    .onEnd(() => {
      isDragging.value = false;
    });

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}</Text>
      
      <View style={styles.sliderTrackContainer}>
        <Animated.View style={[styles.sliderTrack, trackStyle]} />
        
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sliderThumb, thumbStyle]} />
        </GestureDetector>
      </View>
      
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderEndLabel}>{leftLabel}</Text>
        <Text style={styles.sliderEndLabel}>{rightLabel}</Text>
      </View>
    </View>
  );
};

export default function RecommendationSettingsScreen() {
  const [settings, setSettings] = useState<RecommendationSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('@recommendation_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [settings]);
  
  // Save settings
  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('@recommendation_settings', JSON.stringify(settings));
      setHasChanges(false);
      router.back();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };
  
  // Update style preference
  const updateStylePreference = (key: keyof RecommendationSettings['stylePreference'], value: number) => {
    setSettings(prev => ({
      ...prev,
      stylePreference: {
        ...prev.stylePreference,
        [key]: value,
      },
    }));
  };
  
  // Get style label based on value
  const getStyleLabel = (key: keyof RecommendationSettings['stylePreference'], value: number): string => {
    const labels: Record<keyof RecommendationSettings['stylePreference'], [string, string]> = {
      formality: ['Casual', 'Formal'],
      boldness: ['Conservative', 'Bold'],
      layering: ['Minimal', 'Maximal'],
      colorfulness: ['Monochrome', 'Colorful'],
    };
    
    const [min, max] = labels[key];
    return value < 0.33 ? min : value > 0.66 ? max : 'Balanced';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommendation Settings</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !hasChanges && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges}
        >
          <Text style={[
            styles.saveButtonText,
            !hasChanges && styles.saveButtonTextDisabled,
          ]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Style Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sliders size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Style Preferences</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Adjust these sliders to customize the style of your generated outfits.
          </Text>
          
          <Slider
            value={settings.stylePreference.formality}
            onValueChange={(value) => updateStylePreference('formality', value)}
            label={`Formality: ${getStyleLabel('formality', settings.stylePreference.formality)}`}
            leftLabel="Casual"
            rightLabel="Formal"
          />
          
          <Slider
            value={settings.stylePreference.boldness}
            onValueChange={(value) => updateStylePreference('boldness', value)}
            label={`Boldness: ${getStyleLabel('boldness', settings.stylePreference.boldness)}`}
            leftLabel="Conservative"
            rightLabel="Bold"
          />
          
          <Slider
            value={settings.stylePreference.layering}
            onValueChange={(value) => updateStylePreference('layering', value)}
            label={`Layering: ${getStyleLabel('layering', settings.stylePreference.layering)}`}
            leftLabel="Minimal"
            rightLabel="Maximal"
          />
          
          <Slider
            value={settings.stylePreference.colorfulness}
            onValueChange={(value) => updateStylePreference('colorfulness', value)}
            label={`Colorfulness: ${getStyleLabel('colorfulness', settings.stylePreference.colorfulness)}`}
            leftLabel="Monochrome"
            rightLabel="Colorful"
          />
        </View>
        
        {/* Weather Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThermometerSun size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Weather Settings</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Use Weather Data</Text>
              <Text style={styles.settingDescription}>
                Automatically consider weather when generating outfits
              </Text>
            </View>
            <Switch
              value={settings.useWeather}
              onValueChange={(value) => setSettings(prev => ({ ...prev, useWeather: value }))}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
          
          {settings.useWeather && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Weather Location</Text>
              <TextInput
                style={styles.input}
                value={settings.weatherLocation}
                onChangeText={(text) => setSettings(prev => ({ ...prev, weatherLocation: text }))}
                placeholder="Enter city name (e.g., New York, NY)"
                placeholderTextColor={Colors.text.tertiary}
              />
              <Text style={styles.inputHelp}>
                Leave blank to use your current location
              </Text>
            </View>
          )}
        </View>
        
        {/* Color Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Color Preferences</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Select colors you prefer in your outfits
          </Text>
          
          <View style={styles.colorGrid}>
            {['#000000', '#FFFFFF', '#0000FF', '#FF0000', '#00FF00', '#FFFF00', 
              '#FFA500', '#800080', '#FFC0CB', '#A52A2A'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  settings.preferredColors.includes(color) && styles.selectedColorOption,
                ]}
                onPress={() => {
                  setSettings(prev => ({
                    ...prev,
                    preferredColors: prev.preferredColors.includes(color)
                      ? prev.preferredColors.filter(c => c !== color)
                      : [...prev.preferredColors, color],
                  }));
                }}
              >
                {settings.preferredColors.includes(color) && (
                  <View style={styles.colorCheckmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Occasion Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Occasion Preferences</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Exclude categories you don't want in recommendations
          </Text>
          
          <View style={styles.categoriesContainer}>
            {['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  settings.excludedCategories.includes(category) && styles.excludedCategory,
                ]}
                onPress={() => {
                  setSettings(prev => ({
                    ...prev,
                    excludedCategories: prev.excludedCategories.includes(category)
                      ? prev.excludedCategories.filter(c => c !== category)
                      : [...prev.excludedCategories, category],
                  }));
                }}
              >
                <Text style={[
                  styles.categoryText,
                  settings.excludedCategories.includes(category) && styles.excludedCategoryText,
                ]}>
                  {category}
                </Text>
                {settings.excludedCategories.includes(category) && (
                  <Text style={styles.excludeText}>Excluded</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Other Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Other Settings</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Save Generation History</Text>
              <Text style={styles.settingDescription}>
                Remember previously generated outfits to ensure variety
              </Text>
            </View>
            <Switch
              value={settings.saveHistory}
              onValueChange={(value) => setSettings(prev => ({ ...prev, saveHistory: value }))}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Import GestureDetector from react-native-gesture-handler
import { GestureDetector } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    ...Shadows.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primary[700],
  },
  saveButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  saveButtonText: {
    ...Typography.button.small,
    color: Colors.white,
  },
  saveButtonTextDisabled: {
    color: Colors.text.disabled,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  sliderContainer: {
    marginBottom: Spacing.lg,
  },
  sliderLabel: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  sliderTrackContainer: {
    height: 24,
    width: '100%',
    backgroundColor: Colors.neutral[200],
    borderRadius: Layout.borderRadius.full,
    position: 'relative',
  },
  sliderTrack: {
    height: '100%',
    borderRadius: Layout.borderRadius.full,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    top: -2,
    left: -12,
    width: 24,
    height: 24,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.primary[700],
    ...Shadows.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  sliderEndLabel: {
    ...Typography.caption.small,
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
  inputContainer: {
    marginTop: Spacing.md,
  },
  inputLabel: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  inputHelp: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: Colors.primary[700],
  },
  colorCheckmark: {
    width: 12,
    height: 12,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary[700],
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  excludedCategory: {
    backgroundColor: Colors.error[50],
    borderColor: Colors.error[300],
  },
  categoryText: {
    ...Typography.caption.medium,
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  excludedCategoryText: {
    color: Colors.error[700],
  },
  excludeText: {
    ...Typography.caption.small,
    color: Colors.error[700],
    marginTop: 2,
  },
});