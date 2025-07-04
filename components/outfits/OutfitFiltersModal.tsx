import { Filter, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { Occasion } from '../../types/wardrobe';
import { Button, H2, H3, Slider } from '../ui';

export interface OutfitFilters {
  occasion: Occasion | null;
  style: string | null;
  weatherConditions: string | null;
  formality: 'casual' | 'semi-formal' | 'formal' | null;
  colors: string[];
  includeWeather: boolean;
  temperatureRange?: { min: number; max: number };
  stylePreferences: {
    formality: number;
    boldness: number;
    layering: number;
    colorfulness: number;
    autoWeather: boolean;
    saveHistory: boolean;
    useColorTheory: boolean;
  };
  weatherIntegration: {
    enabled: boolean;
    useCurrentLocation: boolean;
    location?: string;
  };
}

interface OutfitFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: OutfitFilters) => void;
  currentFilters: OutfitFilters;
  weatherData?: {
    temperature: number;
    conditions: string;
    precipitation: number;
    humidity: number;
    windSpeed: number;
  };
}

const STYLE_OPTIONS = [
  { id: 'minimalist', label: 'Minimalist', description: 'Clean and simple' },
  {
    id: 'bohemian',
    label: 'Bohemian',
    description: 'Free-spirited and artistic',
  },
  { id: 'classic', label: 'Classic', description: 'Timeless and elegant' },
  { id: 'trendy', label: 'Trendy', description: 'Current fashion trends' },
  { id: 'edgy', label: 'Edgy', description: 'Bold and unconventional' },
  { id: 'romantic', label: 'Romantic', description: 'Soft and feminine' },
  { id: 'sporty', label: 'Sporty', description: 'Athletic and comfortable' },
  { id: 'vintage', label: 'Vintage', description: 'Retro-inspired looks' },
];

const OCCASION_OPTIONS = [
  { value: Occasion.CASUAL, label: 'Casual', description: 'Everyday comfort' },
  { value: Occasion.WORK, label: 'Work', description: 'Professional setting' },
  { value: Occasion.FORMAL, label: 'Formal', description: 'Special events' },
  { value: Occasion.DATE, label: 'Date', description: 'Romantic occasions' },
  { value: Occasion.SPORT, label: 'Sport', description: 'Active wear' },
  { value: Occasion.PARTY, label: 'Party', description: 'Social gatherings' },
];

const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual', description: 'Relaxed and comfortable' },
  { value: 'semi-formal', label: 'Semi-Formal', description: 'Smart casual' },
  { value: 'formal', label: 'Formal', description: 'Elegant and refined' },
];

const COLOR_OPTIONS = [
  { id: 'neutrals', label: 'Neutrals', color: '#8B7355' },
  { id: 'blues', label: 'Blues', color: '#17BDF8' },
  { id: 'greens', label: 'Greens', color: '#10B981' },
  { id: 'reds', label: 'Reds', color: '#EF4444' },
  { id: 'blacks', label: 'Blacks', color: '#1F2937' },
  { id: 'whites', label: 'Whites', color: '#F9FAFB' },
  { id: 'pastels', label: 'Pastels', color: '#F3E8FF' },
  { id: 'earth-tones', label: 'Earth Tones', color: '#92400E' },
];

const BODY_TYPE_OPTIONS = [
  {
    value: 'petite',
    label: 'Petite',
    description: 'Under 5\'4" with proportional frame',
  },
  { value: 'tall', label: 'Tall', description: 'Over 5\'8" with longer limbs' },
  {
    value: 'curvy',
    label: 'Curvy',
    description: 'Defined waist with fuller bust/hips',
  },
  {
    value: 'athletic',
    label: 'Athletic',
    description: 'Muscular build with broad shoulders',
  },
  {
    value: 'plus-size',
    label: 'Plus Size',
    description: 'Fuller figure, size 14+',
  },
  {
    value: 'straight',
    label: 'Straight',
    description: 'Similar bust, waist, and hip measurements',
  },
];

const FIT_PREFERENCE_OPTIONS = [
  {
    value: 'loose',
    label: 'Loose Fit',
    description: 'Relaxed, flowing silhouettes',
  },
  {
    value: 'fitted',
    label: 'Fitted',
    description: 'Close to body, showing shape',
  },
  {
    value: 'tailored',
    label: 'Tailored',
    description: 'Structured, professional fit',
  },
  {
    value: 'oversized',
    label: 'Oversized',
    description: 'Deliberately large, trendy fit',
  },
];

const PATTERN_OPTIONS = [
  { id: 'stripes', label: 'Stripes' },
  { id: 'florals', label: 'Florals' },
  { id: 'polka-dots', label: 'Polka Dots' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'animal-print', label: 'Animal Print' },
  { id: 'paisley', label: 'Paisley' },
];

const getStyleLabel = (
  key: keyof OutfitFilters['stylePreferences'],
  value: number
): string => {
  if (typeof value !== 'number') return 'Unknown';

  const labels: Record<string, [string, string]> = {
    formality: ['Casual', 'Formal'],
    boldness: ['Conservative', 'Bold'],
    layering: ['Minimal', 'Maximal'],
    colorfulness: ['Monochrome', 'Colorful'],
  };

  const [min, max] = labels[key] || ['Low', 'High'];
  return value < 0.33 ? min : value > 0.66 ? max : 'Balanced';
};

export function OutfitFiltersModal({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
  weatherData,
}: OutfitFiltersModalProps) {
  const [filters, setFilters] = useState<OutfitFilters>(currentFilters);

  const handleOccasionSelect = useCallback((occasion: Occasion | null) => {
    setFilters(prev => ({ ...prev, occasion }));
  }, []);

  const handleStyleSelect = useCallback((style: string | null) => {
    setFilters(prev => ({ ...prev, style }));
  }, []);

  const handleFormalitySelect = useCallback(
    (formality: 'casual' | 'semi-formal' | 'formal' | null) => {
      setFilters(prev => ({ ...prev, formality }));
    },
    []
  );

  const handleColorToggle = useCallback((colorId: string) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(colorId)
        ? prev.colors.filter(c => c !== colorId)
        : [...prev.colors, colorId],
    }));
  }, []);

  const handleWeatherToggle = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      includeWeather: !prev.includeWeather,
      weatherConditions:
        !prev.includeWeather && weatherData ? weatherData.conditions : null,
    }));
  }, [weatherData]);

  const handleSliderChange = useCallback(
    (key: keyof OutfitFilters['stylePreferences'], value: number) => {
      if (typeof value === 'number') {
        setFilters(prev => ({
          ...prev,
          stylePreferences: {
            ...prev.stylePreferences,
            [key]: value,
          },
        }));
      }
    },
    []
  );

  const handleStyleToggle = useCallback(
    (key: keyof OutfitFilters['stylePreferences']) => {
      if (typeof filters.stylePreferences[key] === 'boolean') {
        setFilters(prev => ({
          ...prev,
          stylePreferences: {
            ...prev.stylePreferences,
            [key]: !prev.stylePreferences[key],
          },
        }));
      }
    },
    [filters.stylePreferences]
  );

  const handleWeatherIntegrationToggle = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      weatherIntegration: {
        ...prev.weatherIntegration,
        enabled: !prev.weatherIntegration.enabled,
      },
    }));
  }, []);

  const handleLocationToggle = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      weatherIntegration: {
        ...prev.weatherIntegration,
        useCurrentLocation: !prev.weatherIntegration.useCurrentLocation,
      },
    }));
  }, []);

  const handleLocationChange = useCallback((location: string) => {
    setFilters(prev => ({
      ...prev,
      weatherIntegration: {
        ...prev.weatherIntegration,
        location,
      },
    }));
  }, []);

  const handleStylePreferenceChange = useCallback(
    (key: keyof OutfitFilters['stylePreferences'], value: number | boolean) => {
      setFilters(prev => ({
        ...prev,
        stylePreferences: {
          ...prev.stylePreferences,
          [key]: value,
        },
      }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setFilters({
      occasion: null,
      style: null,
      weatherConditions: null,
      formality: null,
      colors: [],
      includeWeather: false,
      stylePreferences: {
        formality: 0.5,
        boldness: 0.5,
        layering: 0.5,
        colorfulness: 0.5,
        autoWeather: true,
        saveHistory: true,
        useColorTheory: true,
      },
      weatherIntegration: {
        enabled: false,
        useCurrentLocation: true,
        location: undefined,
      },
    });
  }, []);

  const handleApply = useCallback(() => {
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  const hasActiveFilters =
    filters.occasion ||
    filters.style ||
    filters.formality ||
    filters.colors.length > 0 ||
    filters.includeWeather ||
    (filters.temperatureRange &&
      (filters.temperatureRange.min !== 15 ||
        filters.temperatureRange.max !== 25)) ||
    filters.stylePreferences.formality !== 0.5 ||
    filters.stylePreferences.boldness !== 0.5 ||
    filters.stylePreferences.layering !== 0.5 ||
    filters.stylePreferences.colorfulness !== 0.5 ||
    filters.stylePreferences.autoWeather ||
    !filters.stylePreferences.saveHistory ||
    !filters.stylePreferences.useColorTheory ||
    filters.weatherIntegration.enabled;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Filter size={24} color={Colors.primary[500]} />
            <H2 style={styles.headerTitle}>Outfit Filters</H2>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Occasion Section */}
          <View style={styles.section}>
            <H3 style={styles.sectionTitle}>Occasion</H3>
            <Text style={styles.sectionDescription}>
              What type of event or activity is this outfit for?
            </Text>
            <View style={styles.optionsGrid}>
              {OCCASION_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    filters.occasion === option.value &&
                      styles.optionCardSelected,
                  ]}
                  onPress={() =>
                    handleOccasionSelect(
                      filters.occasion === option.value ? null : option.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      filters.occasion === option.value &&
                        styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      filters.occasion === option.value &&
                        styles.optionDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Style Section */}
          <View style={styles.section}>
            <H3 style={styles.sectionTitle}>Style Preference</H3>
            <Text style={styles.sectionDescription}>
              Choose your preferred aesthetic style
            </Text>
            <View style={styles.optionsGrid}>
              {STYLE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    filters.style === option.id && styles.optionCardSelected,
                  ]}
                  onPress={() =>
                    handleStyleSelect(
                      filters.style === option.id ? null : option.id
                    )
                  }
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      filters.style === option.id && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      filters.style === option.id &&
                        styles.optionDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Formality Section */}
          <View style={styles.section}>
            <H3 style={styles.sectionTitle}>Formality Level</H3>
            <Text style={styles.sectionDescription}>
              How formal should this outfit be?
            </Text>
            <View style={styles.optionsRow}>
              {FORMALITY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.formalityCard,
                    filters.formality === option.value &&
                      styles.optionCardSelected,
                  ]}
                  onPress={() =>
                    handleFormalitySelect(
                      filters.formality === option.value
                        ? null
                        : (option.value as any)
                    )
                  }
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      filters.formality === option.value &&
                        styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      filters.formality === option.value &&
                        styles.optionDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color Preferences Section */}
          <View style={styles.section}>
            <H3 style={styles.sectionTitle}>Color Preferences</H3>
            <Text style={styles.sectionDescription}>
              Select color palettes you&apos;d like to include (optional)
            </Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: option.color,
                      borderColor:
                        option.id === 'whites'
                          ? Colors.border.primary
                          : 'transparent',
                    },
                    filters.colors.includes(option.id) &&
                      styles.colorSwatchSelected,
                  ]}
                  onPress={() => handleColorToggle(option.id)}
                />
              ))}
            </View>
          </View>

          {/* Style Preferences Section */}
          <View style={styles.section}>
            <H3 style={styles.sectionTitle}>Style Preferences</H3>
            <Text style={styles.sectionDescription}>
              Adjust these sliders to customize the style of your generated
              outfits
            </Text>

            {/* Formality Slider */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Formality</Text>
                <Text style={styles.sliderValue}>
                  {getStyleLabel(
                    'formality',
                    filters.stylePreferences.formality
                  )}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={filters.stylePreferences.formality}
                onValueChange={value => handleSliderChange('formality', value)}
                minimumTrackTintColor={Colors.primary[700]}
                maximumTrackTintColor={Colors.neutral[300]}
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
                  {getStyleLabel('boldness', filters.stylePreferences.boldness)}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={filters.stylePreferences.boldness}
                onValueChange={value => handleSliderChange('boldness', value)}
                minimumTrackTintColor={Colors.primary[700]}
                maximumTrackTintColor={Colors.neutral[300]}
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
                  {getStyleLabel('layering', filters.stylePreferences.layering)}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={filters.stylePreferences.layering}
                onValueChange={value => handleSliderChange('layering', value)}
                minimumTrackTintColor={Colors.primary[700]}
                maximumTrackTintColor={Colors.neutral[300]}
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
                  {getStyleLabel(
                    'colorfulness',
                    filters.stylePreferences.colorfulness
                  )}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={filters.stylePreferences.colorfulness}
                onValueChange={value =>
                  handleSliderChange('colorfulness', value)
                }
                minimumTrackTintColor={Colors.primary[700]}
                maximumTrackTintColor={Colors.neutral[300]}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderMinLabel}>Monochrome</Text>
                <Text style={styles.sliderMaxLabel}>Colorful</Text>
              </View>
            </View>

            {/* Algorithm Settings */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Algorithm Settings</Text>
              <Text style={styles.subsectionDescription}>
                Configure how the outfit generation algorithm works
              </Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Use Weather Data</Text>
                  <Text style={styles.settingDescription}>
                    Automatically consider weather when generating outfits
                  </Text>
                </View>
                <Switch
                  value={filters.stylePreferences.autoWeather}
                  onValueChange={() => handleStyleToggle('autoWeather')}
                  trackColor={{
                    false: Colors.neutral[300],
                    true: Colors.primary[500],
                  }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>
                    Save Generation History
                  </Text>
                  <Text style={styles.settingDescription}>
                    Remember previously generated outfits to ensure variety
                  </Text>
                </View>
                <Switch
                  value={filters.stylePreferences.saveHistory}
                  onValueChange={() => handleStyleToggle('saveHistory')}
                  trackColor={{
                    false: Colors.neutral[300],
                    true: Colors.primary[500],
                  }}
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
                  value={filters.stylePreferences.useColorTheory}
                  onValueChange={() => handleStyleToggle('useColorTheory')}
                  trackColor={{
                    false: Colors.neutral[300],
                    true: Colors.primary[500],
                  }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          </View>

          {/* Temperature Range Section */}
          <View style={styles.section}>
            <H3 style={styles.sectionTitle}>Temperature Range</H3>
            <Text style={styles.sectionDescription}>
              Set temperature range for outfit recommendations
            </Text>

            <View style={styles.subsection}>
              <View style={styles.temperatureRangeContainer}>
                <View style={styles.temperatureLabels}>
                  <Text style={styles.temperatureLabel}>
                    Min: {filters.temperatureRange?.min || 15}°C
                  </Text>
                  <Text style={styles.temperatureLabel}>
                    Max: {filters.temperatureRange?.max || 25}°C
                  </Text>
                </View>

                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Minimum Temperature</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={-20}
                    maximumValue={40}
                    step={1}
                    value={filters.temperatureRange?.min || 15}
                    onValueChange={value =>
                      setFilters(prev => ({
                        ...prev,
                        temperatureRange: {
                          min: value,
                          max: prev.temperatureRange?.max || 25,
                        },
                      }))
                    }
                    minimumTrackTintColor={Colors.primary[500]}
                    maximumTrackTintColor={Colors.neutral[300]}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>-20°C</Text>
                    <Text style={styles.sliderLabelText}>40°C</Text>
                  </View>
                </View>

                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Maximum Temperature</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={-20}
                    maximumValue={40}
                    step={1}
                    value={filters.temperatureRange?.max || 25}
                    onValueChange={value =>
                      setFilters(prev => ({
                        ...prev,
                        temperatureRange: {
                          min: prev.temperatureRange?.min || 15,
                          max: value,
                        },
                      }))
                    }
                    minimumTrackTintColor={Colors.primary[500]}
                    maximumTrackTintColor={Colors.neutral[300]}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>-20°C</Text>
                    <Text style={styles.sliderLabelText}>40°C</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            <Button
              title="Reset All"
              variant="outline"
              onPress={handleReset}
              disabled={!hasActiveFilters}
              style={styles.resetButton}
            />
            <Button
              title="Apply Filters"
              onPress={handleApply}
              style={styles.applyButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: Spacing.sm,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minWidth: '48%',
    flex: 1,
  },
  optionCardSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  formalityCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    flex: 1,
  },
  optionLabel: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  optionLabelSelected: {
    color: Colors.primary[700],
  },
  optionDescription: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  optionDescriptionSelected: {
    color: Colors.primary[600],
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderColor: Colors.primary[500],
    borderWidth: 3,
  },
  colorLabel: {
    ...Typography.caption.medium,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  colorLabelSelected: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  weatherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  weatherCardSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  weatherTemp: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  weatherCondition: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  weatherToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
  },
  weatherToggleSelected: {
    backgroundColor: Colors.primary[500],
  },
  weatherToggleText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  weatherToggleTextSelected: {
    color: Colors.surface.primary,
  },
  footer: {
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
  subsection: {
    marginBottom: Spacing.lg,
  },
  subsectionTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  subsectionDescription: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  patternChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  patternChipSelected: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[500],
  },
  patternLabel: {
    ...Typography.caption.medium,
    color: Colors.text.primary,
  },
  patternLabelSelected: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  toggleOptionSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  toggleContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  toggleLabelSelected: {
    color: Colors.primary[700],
  },
  toggleDescription: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  toggleDescriptionSelected: {
    color: Colors.primary[600],
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  checkmarkText: {
    ...Typography.caption.small,
    color: Colors.surface.primary,
    fontWeight: 'bold',
  },
  weatherDisplay: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginTop: Spacing.md,
  },
  weatherDisplayTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherStat: {
    alignItems: 'center',
    flex: 1,
  },
  weatherValue: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  weatherLabel: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    textAlign: 'center',
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
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
  },
  sliderMaxLabel: {
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
  apiNote: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  temperatureRangeContainer: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  temperatureLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  temperatureLabel: {
    ...Typography.body.medium,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  sliderLabelText: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
  },
});
