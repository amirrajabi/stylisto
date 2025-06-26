import { Filter, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
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
import { Button, H2, H3 } from '../ui';

export interface OutfitFilters {
  occasion: Occasion | null;
  style: string | null;
  weatherConditions: string | null;
  formality: 'casual' | 'semi-formal' | 'formal' | null;
  colors: string[];
  includeWeather: boolean;
  stylePreferences: {
    bodyType?: string;
    preferredFit?: string;
    avoidPatterns?: string[];
    prioritizeComfort?: boolean;
  };
  weatherIntegration: {
    enabled: boolean;
    autoUpdate?: boolean;
    temperatureRange?: [number, number];
    considerHumidity?: boolean;
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
  { id: 'blues', label: 'Blues', color: '#3B82F6' },
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

  const handleBodyTypeSelect = useCallback((bodyType: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      stylePreferences: {
        ...prev.stylePreferences,
        bodyType,
      },
    }));
  }, []);

  const handleFitPreferenceSelect = useCallback(
    (preferredFit: string | undefined) => {
      setFilters(prev => ({
        ...prev,
        stylePreferences: {
          ...prev.stylePreferences,
          preferredFit,
        },
      }));
    },
    []
  );

  const handlePatternToggle = useCallback((patternId: string) => {
    setFilters(prev => ({
      ...prev,
      stylePreferences: {
        ...prev.stylePreferences,
        avoidPatterns: prev.stylePreferences.avoidPatterns?.includes(patternId)
          ? prev.stylePreferences.avoidPatterns.filter(p => p !== patternId)
          : [...(prev.stylePreferences.avoidPatterns || []), patternId],
      },
    }));
  }, []);

  const handleComfortToggle = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      stylePreferences: {
        ...prev.stylePreferences,
        prioritizeComfort: !prev.stylePreferences.prioritizeComfort,
      },
    }));
  }, []);

  const handleWeatherIntegrationToggle = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      weatherIntegration: {
        ...prev.weatherIntegration,
        enabled: !prev.weatherIntegration.enabled,
      },
    }));
  }, []);

  const handleAutoUpdateToggle = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      weatherIntegration: {
        ...prev.weatherIntegration,
        autoUpdate: !prev.weatherIntegration.autoUpdate,
      },
    }));
  }, []);

  const handleHumidityToggle = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      weatherIntegration: {
        ...prev.weatherIntegration,
        considerHumidity: !prev.weatherIntegration.considerHumidity,
      },
    }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters({
      occasion: null,
      style: null,
      weatherConditions: null,
      formality: null,
      colors: [],
      includeWeather: false,
      stylePreferences: {
        bodyType: undefined,
        preferredFit: undefined,
        avoidPatterns: [],
        prioritizeComfort: false,
      },
      weatherIntegration: {
        enabled: false,
        autoUpdate: false,
        temperatureRange: undefined,
        considerHumidity: false,
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
    filters.stylePreferences.bodyType ||
    filters.stylePreferences.preferredFit ||
    (filters.stylePreferences.avoidPatterns?.length || 0) > 0 ||
    filters.stylePreferences.prioritizeComfort ||
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
                    styles.colorCard,
                    filters.colors.includes(option.id) &&
                      styles.colorCardSelected,
                  ]}
                  onPress={() => handleColorToggle(option.id)}
                >
                  <View
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: option.color,
                        borderColor:
                          option.id === 'whites'
                            ? Colors.border.primary
                            : 'transparent',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.colorLabel,
                      filters.colors.includes(option.id) &&
                        styles.colorLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Style Preferences Section */}
          <View style={styles.section}>
            <H3 style={styles.sectionTitle}>Style Preferences</H3>
            <Text style={styles.sectionDescription}>
              Customize recommendations based on your body type and preferences
            </Text>

            {/* Body Type */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Body Type</Text>
              <View style={styles.optionsGrid}>
                {BODY_TYPE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      filters.stylePreferences.bodyType === option.value &&
                        styles.optionCardSelected,
                    ]}
                    onPress={() =>
                      handleBodyTypeSelect(
                        filters.stylePreferences.bodyType === option.value
                          ? undefined
                          : option.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        filters.stylePreferences.bodyType === option.value &&
                          styles.optionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        filters.stylePreferences.bodyType === option.value &&
                          styles.optionDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preferred Fit */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Preferred Fit</Text>
              <View style={styles.optionsGrid}>
                {FIT_PREFERENCE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      filters.stylePreferences.preferredFit === option.value &&
                        styles.optionCardSelected,
                    ]}
                    onPress={() =>
                      handleFitPreferenceSelect(
                        filters.stylePreferences.preferredFit === option.value
                          ? undefined
                          : option.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        filters.stylePreferences.preferredFit ===
                          option.value && styles.optionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        filters.stylePreferences.preferredFit ===
                          option.value && styles.optionDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Patterns to Avoid */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Patterns to Avoid</Text>
              <Text style={styles.subsectionDescription}>
                Select patterns you prefer to avoid in your outfits
              </Text>
              <View style={styles.patternGrid}>
                {PATTERN_OPTIONS.map(pattern => (
                  <TouchableOpacity
                    key={pattern.id}
                    style={[
                      styles.patternChip,
                      filters.stylePreferences.avoidPatterns?.includes(
                        pattern.id
                      ) && styles.patternChipSelected,
                    ]}
                    onPress={() => handlePatternToggle(pattern.id)}
                  >
                    <Text
                      style={[
                        styles.patternLabel,
                        filters.stylePreferences.avoidPatterns?.includes(
                          pattern.id
                        ) && styles.patternLabelSelected,
                      ]}
                    >
                      {pattern.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Comfort Priority */}
            <View style={styles.subsection}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  filters.stylePreferences.prioritizeComfort &&
                    styles.toggleOptionSelected,
                ]}
                onPress={handleComfortToggle}
              >
                <View style={styles.toggleContent}>
                  <Text
                    style={[
                      styles.toggleLabel,
                      filters.stylePreferences.prioritizeComfort &&
                        styles.toggleLabelSelected,
                    ]}
                  >
                    Prioritize Comfort
                  </Text>
                  <Text
                    style={[
                      styles.toggleDescription,
                      filters.stylePreferences.prioritizeComfort &&
                        styles.toggleDescriptionSelected,
                    ]}
                  >
                    Favor comfortable, breathable fabrics and relaxed fits
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkmark,
                    filters.stylePreferences.prioritizeComfort &&
                      styles.checkmarkSelected,
                  ]}
                >
                  {filters.stylePreferences.prioritizeComfort && (
                    <Text style={styles.checkmarkText}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weather Integration Section */}
          <View style={styles.section}>
            <H3 style={styles.sectionTitle}>Weather Integration</H3>
            <Text style={styles.sectionDescription}>
              Configure how weather affects your outfit recommendations
            </Text>

            {/* Enable Weather Integration */}
            <View style={styles.subsection}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  filters.weatherIntegration.enabled &&
                    styles.toggleOptionSelected,
                ]}
                onPress={handleWeatherIntegrationToggle}
              >
                <View style={styles.toggleContent}>
                  <Text
                    style={[
                      styles.toggleLabel,
                      filters.weatherIntegration.enabled &&
                        styles.toggleLabelSelected,
                    ]}
                  >
                    Enable Weather Integration
                  </Text>
                  <Text
                    style={[
                      styles.toggleDescription,
                      filters.weatherIntegration.enabled &&
                        styles.toggleDescriptionSelected,
                    ]}
                  >
                    Factor in current weather conditions when generating outfits
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkmark,
                    filters.weatherIntegration.enabled &&
                      styles.checkmarkSelected,
                  ]}
                >
                  {filters.weatherIntegration.enabled && (
                    <Text style={styles.checkmarkText}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Weather Options (only show if enabled) */}
            {filters.weatherIntegration.enabled && (
              <>
                <View style={styles.subsection}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      filters.weatherIntegration.autoUpdate &&
                        styles.toggleOptionSelected,
                    ]}
                    onPress={handleAutoUpdateToggle}
                  >
                    <View style={styles.toggleContent}>
                      <Text
                        style={[
                          styles.toggleLabel,
                          filters.weatherIntegration.autoUpdate &&
                            styles.toggleLabelSelected,
                        ]}
                      >
                        Auto-Update Weather
                      </Text>
                      <Text
                        style={[
                          styles.toggleDescription,
                          filters.weatherIntegration.autoUpdate &&
                            styles.toggleDescriptionSelected,
                        ]}
                      >
                        Automatically refresh weather data for recommendations
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkmark,
                        filters.weatherIntegration.autoUpdate &&
                          styles.checkmarkSelected,
                      ]}
                    >
                      {filters.weatherIntegration.autoUpdate && (
                        <Text style={styles.checkmarkText}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.subsection}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      filters.weatherIntegration.considerHumidity &&
                        styles.toggleOptionSelected,
                    ]}
                    onPress={handleHumidityToggle}
                  >
                    <View style={styles.toggleContent}>
                      <Text
                        style={[
                          styles.toggleLabel,
                          filters.weatherIntegration.considerHumidity &&
                            styles.toggleLabelSelected,
                        ]}
                      >
                        Consider Humidity
                      </Text>
                      <Text
                        style={[
                          styles.toggleDescription,
                          filters.weatherIntegration.considerHumidity &&
                            styles.toggleDescriptionSelected,
                        ]}
                      >
                        Factor in humidity levels for fabric selection
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkmark,
                        filters.weatherIntegration.considerHumidity &&
                          styles.checkmarkSelected,
                      ]}
                    >
                      {filters.weatherIntegration.considerHumidity && (
                        <Text style={styles.checkmarkText}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Current Weather Display */}
                {weatherData && (
                  <View style={styles.weatherDisplay}>
                    <Text style={styles.weatherDisplayTitle}>
                      Current Weather
                    </Text>
                    <View style={styles.weatherStats}>
                      <View style={styles.weatherStat}>
                        <Text style={styles.weatherValue}>
                          {Math.round(weatherData.temperature)}°C
                        </Text>
                        <Text style={styles.weatherLabel}>Temperature</Text>
                      </View>
                      <View style={styles.weatherStat}>
                        <Text style={styles.weatherValue}>
                          {weatherData.humidity}%
                        </Text>
                        <Text style={styles.weatherLabel}>Humidity</Text>
                      </View>
                      <View style={styles.weatherStat}>
                        <Text style={styles.weatherValue}>
                          {weatherData.conditions}
                        </Text>
                        <Text style={styles.weatherLabel}>Conditions</Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Legacy Weather Section (kept for backward compatibility) */}
          {weatherData && !filters.weatherIntegration.enabled && (
            <View style={styles.section}>
              <H3 style={styles.sectionTitle}>Weather Consideration</H3>
              <Text style={styles.sectionDescription}>
                Include current weather conditions in outfit selection
              </Text>
              <TouchableOpacity
                style={[
                  styles.weatherCard,
                  filters.includeWeather && styles.weatherCardSelected,
                ]}
                onPress={handleWeatherToggle}
              >
                <View style={styles.weatherInfo}>
                  <Text style={styles.weatherTemp}>
                    {Math.round(weatherData.temperature)}°C
                  </Text>
                  <Text style={styles.weatherCondition}>
                    {weatherData.conditions}
                  </Text>
                </View>
                <View
                  style={[
                    styles.weatherToggle,
                    filters.includeWeather && styles.weatherToggleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.weatherToggleText,
                      filters.includeWeather &&
                        styles.weatherToggleTextSelected,
                    ]}
                  >
                    {filters.includeWeather ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
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
  colorCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minWidth: '22%',
  },
  colorCardSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.full,
    marginBottom: Spacing.sm,
    borderWidth: 1,
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
});
