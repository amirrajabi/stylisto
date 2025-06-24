import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FileSliders as Sliders, Sparkles, Palette, Layers, Shirt } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StylePreference } from '../../lib/outfitGenerator';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { H1, BodyMedium, Button } from '../../../components/ui';

const STYLE_PREFERENCE_KEY = '@style_preferences';

export default function PreferencesScreen() {
  const [stylePreference, setStylePreference] = useState<StylePreference>({
    formality: 0.5,
    boldness: 0.5,
    layering: 0.5,
    colorfulness: 0.5,
  });
  
  const [autoWeather, setAutoWeather] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [useColorTheory, setUseColorTheory] = useState(true);
  
  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem(STYLE_PREFERENCE_KEY);
        if (savedPreferences) {
          setStylePreference(JSON.parse(savedPreferences));
        }
        
        const autoWeatherSetting = await AsyncStorage.getItem('@auto_weather');
        setAutoWeather(autoWeatherSetting !== 'false');
        
        const saveHistorySetting = await AsyncStorage.getItem('@save_history');
        setSaveHistory(saveHistorySetting !== 'false');
        
        const useColorTheorySetting = await AsyncStorage.getItem('@use_color_theory');
        setUseColorTheory(useColorTheorySetting !== 'false');
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  const handleSavePreferences = async () => {
    try {
      await AsyncStorage.setItem(STYLE_PREFERENCE_KEY, JSON.stringify(stylePreference));
      await AsyncStorage.setItem('@auto_weather', autoWeather ? 'true' : 'false');
      await AsyncStorage.setItem('@save_history', saveHistory ? 'true' : 'false');
      await AsyncStorage.setItem('@use_color_theory', useColorTheory ? 'true' : 'false');
      
      router.back();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleSliderChange = (key: keyof StylePreference, value: number) => {
    setStylePreference(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getStyleLabel = (key: keyof StylePreference, value: number): string => {
    const labels: Record<keyof StylePreference, [string, string]> = {
      formality: ['Casual', 'Formal'],
      boldness: ['Conservative', 'Bold'],
      layering: ['Minimal', 'Maximal'],
      colorfulness: ['Monochrome', 'Colorful'],
    };
    
    const [min, max] = labels[key];
    return value < 0.33 ? min : value > 0.66 ? max : `Balanced`;
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
        <H1>Style Preferences</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Style Sliders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sliders size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Style Preferences</Text>
          </View>
          
          <BodyMedium color="secondary" style={styles.sectionDescription}>
            Adjust these sliders to customize the style of your generated outfits.
          </BodyMedium>
          
          {/* Formality Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Formality</Text>
              <Text style={styles.sliderValue}>
                {getStyleLabel('formality', stylePreference.formality)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={stylePreference.formality}
              onValueChange={(value) => handleSliderChange('formality', value)}
              minimumTrackTintColor={Colors.primary[700]}
              maximumTrackTintColor={Colors.neutral[300]}
              thumbTintColor={Colors.primary[700]}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinLabel}>Casual</Text>
              <Text style={styles.sliderMaxLabel}>Formal</Text>
            </View>
          </View>
          
          {/* Boldness Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Boldness</Text>
              <Text style={styles.sliderValue}>
                {getStyleLabel('boldness', stylePreference.boldness)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={stylePreference.boldness}
              onValueChange={(value) => handleSliderChange('boldness', value)}
              minimumTrackTintColor={Colors.primary[700]}
              maximumTrackTintColor={Colors.neutral[300]}
              thumbTintColor={Colors.primary[700]}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinLabel}>Conservative</Text>
              <Text style={styles.sliderMaxLabel}>Bold</Text>
            </View>
          </View>
          
          {/* Layering Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Layering</Text>
              <Text style={styles.sliderValue}>
                {getStyleLabel('layering', stylePreference.layering)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={stylePreference.layering}
              onValueChange={(value) => handleSliderChange('layering', value)}
              minimumTrackTintColor={Colors.primary[700]}
              maximumTrackTintColor={Colors.neutral[300]}
              thumbTintColor={Colors.primary[700]}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinLabel}>Minimal</Text>
              <Text style={styles.sliderMaxLabel}>Maximal</Text>
            </View>
          </View>
          
          {/* Colorfulness Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Colorfulness</Text>
              <Text style={styles.sliderValue}>
                {getStyleLabel('colorfulness', stylePreference.colorfulness)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={stylePreference.colorfulness}
              onValueChange={(value) => handleSliderChange('colorfulness', value)}
              minimumTrackTintColor={Colors.primary[700]}
              maximumTrackTintColor={Colors.neutral[300]}
              thumbTintColor={Colors.primary[700]}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinLabel}>Monochrome</Text>
              <Text style={styles.sliderMaxLabel}>Colorful</Text>
            </View>
          </View>
        </View>

        {/* Algorithm Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Algorithm Settings</Text>
          </View>
          
          <BodyMedium color="secondary" style={styles.sectionDescription}>
            Configure how the outfit generation algorithm works.
          </BodyMedium>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Use Weather Data</Text>
              <Text style={styles.settingDescription}>
                Automatically consider weather when generating outfits
              </Text>
            </View>
            <Switch
              value={autoWeather}
              onValueChange={setAutoWeather}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Save Generation History</Text>
              <Text style={styles.settingDescription}>
                Remember previously generated outfits to ensure variety
              </Text>
            </View>
            <Switch
              value={saveHistory}
              onValueChange={setSaveHistory}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Use Color Theory</Text>
              <Text style={styles.settingDescription}>
                Apply color harmony principles when generating outfits
              </Text>
            </View>
            <Switch
              value={useColorTheory}
              onValueChange={setUseColorTheory}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Style Guide */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shirt size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Style Guide</Text>
          </View>
          
          <View style={styles.styleGuide}>
            <View style={styles.styleGuideItem}>
              <View style={[styles.styleGuideIcon, { backgroundColor: Colors.primary[50] }]}>
                <Palette size={20} color={Colors.primary[700]} />
              </View>
              <View style={styles.styleGuideContent}>
                <Text style={styles.styleGuideTitle}>Color Harmony</Text>
                <Text style={styles.styleGuideDescription}>
                  The algorithm uses color theory to create visually pleasing outfits with complementary or analogous colors.
                </Text>
              </View>
            </View>
            
            <View style={styles.styleGuideItem}>
              <View style={[styles.styleGuideIcon, { backgroundColor: Colors.secondary[50] }]}>
                <Shirt size={20} color={Colors.secondary[700]} />
              </View>
              <View style={styles.styleGuideContent}>
                <Text style={styles.styleGuideTitle}>Style Matching</Text>
                <Text style={styles.styleGuideDescription}>
                  Items are matched based on style consistency, ensuring formal pieces aren't paired with casual ones.
                </Text>
              </View>
            </View>
            
            <View style={styles.styleGuideItem}>
              <View style={[styles.styleGuideIcon, { backgroundColor: Colors.success[50] }]}>
                <Layers size={20} color={Colors.success[700]} />
              </View>
              <View style={styles.styleGuideContent}>
                <Text style={styles.styleGuideTitle}>Layering Logic</Text>
                <Text style={styles.styleGuideDescription}>
                  The algorithm considers appropriate layering based on season and weather conditions.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Preferences"
          onPress={handleSavePreferences}
          style={styles.saveButton}
        />
      </View>
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
    marginBottom: Spacing.md,
  },
  sliderContainer: {
    marginBottom: Spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sliderLabel: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  sliderValue: {
    ...Typography.body.small,
    color: Colors.primary[700],
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.sm,
  },
  sliderMinLabel: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
  },
  sliderMaxLabel: {
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
  styleGuide: {
    gap: Spacing.md,
  },
  styleGuideItem: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  styleGuideIcon: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleGuideContent: {
    flex: 1,
  },
  styleGuideTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  styleGuideDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  saveButton: {
    width: '100%',
  },
});