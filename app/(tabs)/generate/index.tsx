import { router } from 'expo-router';
import { Cloud, Plus, Settings } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { OutfitCard } from '../../../components/outfits/OutfitCard';
import { OutfitDetailModal } from '../../../components/outfits/OutfitDetailModal';
import { OutfitEditModal } from '../../../components/outfits/OutfitEditModal';
import { OutfitFiltersBar } from '../../../components/outfits/OutfitFiltersBar';
import {
  OutfitFilters,
  OutfitFiltersModal,
} from '../../../components/outfits/OutfitFiltersModal';
import { OutfitStatsDisplay } from '../../../components/outfits/OutfitStatsDisplay';
import { QuickFilters } from '../../../components/outfits/QuickFilters';
import { BodyMedium, Button, H1, H3 } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useOutfitRecommendation } from '../../../hooks/useOutfitRecommendation';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { Occasion } from '../../../types/wardrobe';

// Mock weather data for demonstration
const MOCK_WEATHER = {
  temperature: 22,
  conditions: 'clear' as const,
  precipitation: 0,
  humidity: 0.4,
  windSpeed: 5,
};

export default function GenerateScreen() {
  const { filteredItems } = useWardrobe();
  const {
    loading,
    outfits,
    selectedOutfitIndex,
    saveCurrentOutfit,
    nextOutfit,
    previousOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
  } = useOutfitRecommendation();

  const [selectedOutfit, setSelectedOutfit] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [outfitToEdit, setOutfitToEdit] = useState<any>(null);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [showQuickFilters, setShowQuickFilters] = useState(true);

  const [currentFilters, setCurrentFilters] = useState<OutfitFilters>({
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

  // Debug logging
  React.useEffect(() => {
    if (__DEV__) {
      console.log(
        '📱 Generate Screen - Items:',
        filteredItems.length,
        'Outfits:',
        outfits.length
      );
    }
  }, [filteredItems.length, outfits.length]);

  const handleFiltersApply = useCallback(
    async (filters: OutfitFilters) => {
      setCurrentFilters(filters);
      setShowQuickFilters(false);

      if (filters.includeWeather) {
        await getWeatherBasedRecommendation(MOCK_WEATHER);
      } else if (filters.occasion) {
        await getOccasionBasedRecommendation(filters.occasion);
      } else {
        console.log('Generating outfit with filters:', filters);
      }
    },
    [getWeatherBasedRecommendation, getOccasionBasedRecommendation]
  );

  const handleQuickOccasionSelect = useCallback(
    async (occasion: Occasion) => {
      const newFilters = { ...currentFilters, occasion };
      setCurrentFilters(newFilters);
      await getOccasionBasedRecommendation(occasion);
      setShowQuickFilters(false);
    },
    [currentFilters, getOccasionBasedRecommendation]
  );

  const handleQuickStyleSelect = useCallback(
    (style: string) => {
      const newFilters = { ...currentFilters, style };
      setCurrentFilters(newFilters);
      setShowQuickFilters(false);
    },
    [currentFilters]
  );

  const handleClearFilter = useCallback(
    (filterType: keyof OutfitFilters, value?: string) => {
      setCurrentFilters(prev => {
        const newFilters = { ...prev };

        if (filterType === 'colors' && value) {
          newFilters.colors = prev.colors.filter(c => c !== value);
        } else if (filterType === 'stylePreferences' && value) {
          if (value === 'bodyType') {
            newFilters.stylePreferences.bodyType = undefined;
          } else if (value === 'preferredFit') {
            newFilters.stylePreferences.preferredFit = undefined;
          } else if (value === 'prioritizeComfort') {
            newFilters.stylePreferences.prioritizeComfort = false;
          } else {
            newFilters.stylePreferences.avoidPatterns =
              prev.stylePreferences.avoidPatterns?.filter(p => p !== value) ||
              [];
          }
        } else if (filterType === 'weatherIntegration' && value === 'enabled') {
          newFilters.weatherIntegration.enabled = false;
        } else {
          (newFilters as any)[filterType] =
            filterType === 'colors'
              ? []
              : filterType === 'includeWeather'
                ? false
                : null;

          if (filterType === 'includeWeather') {
            newFilters.weatherConditions = null;
          }
        }

        const hasActiveFilters =
          newFilters.occasion ||
          newFilters.style ||
          newFilters.formality ||
          newFilters.colors.length > 0 ||
          newFilters.includeWeather ||
          newFilters.stylePreferences.bodyType ||
          newFilters.stylePreferences.preferredFit ||
          (newFilters.stylePreferences.avoidPatterns?.length || 0) > 0 ||
          newFilters.stylePreferences.prioritizeComfort ||
          newFilters.weatherIntegration.enabled;

        if (!hasActiveFilters) {
          setShowQuickFilters(true);
        }

        return newFilters;
      });
    },
    []
  );

  const handleClearAllFilters = useCallback(() => {
    setCurrentFilters({
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
    setShowQuickFilters(true);
  }, []);

  const handleGenerateOutfit = useCallback(async () => {
    await handleFiltersApply(currentFilters);
  }, [currentFilters, handleFiltersApply]);

  const handleSaveOutfit = useCallback(() => {
    const outfitId = saveCurrentOutfit();
    if (outfitId) {
      router.push({
        pathname: '/profile/saved' as any,
        params: { highlight: outfitId },
      });
    }
  }, [saveCurrentOutfit]);

  const handlePreferences = useCallback(() => {
    router.push('/generate/preferences');
  }, []);

  const handleWeatherSettings = useCallback(() => {
    router.push('/generate/weather');
  }, []);

  const handleOutfitPress = useCallback(
    (outfitIndex: number) => {
      const outfit = outfits[outfitIndex];
      if (outfit) {
        const outfitWithMetadata = {
          id: `outfit-${outfitIndex}`,
          name: `Generated Outfit ${outfitIndex + 1}`,
          items: outfit.items,
          score: {
            total: outfit.score.total,
            color: outfit.score.breakdown.colorHarmony,
            style: outfit.score.breakdown.styleMatching,
            season: outfit.score.breakdown.seasonSuitability,
            occasion: outfit.score.breakdown.occasionSuitability,
          },
        };
        setSelectedOutfit(outfitWithMetadata);
        setModalVisible(true);
      }
    },
    [outfits]
  );

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedOutfit(null);
  }, []);

  const handleOutfitSave = useCallback(
    (outfitId: string) => {
      const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
      if (!isNaN(outfitIndex) && outfits[outfitIndex]) {
        const savedOutfitId = saveCurrentOutfit(
          `Generated Outfit ${outfitIndex + 1}`
        );
        if (savedOutfitId) {
          router.push({
            pathname: '/profile/saved' as any,
            params: { highlight: savedOutfitId },
          });
        }
      }
    },
    [outfits, saveCurrentOutfit]
  );

  const handleOutfitEdit = useCallback(
    (outfitId: string) => {
      const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
      const outfit = outfits[outfitIndex];
      if (outfit) {
        const outfitWithMetadata = {
          id: `outfit-${outfitIndex}`,
          name: `Generated Outfit ${outfitIndex + 1}`,
          items: outfit.items,
          score: {
            total: outfit.score.total,
            color: outfit.score.breakdown.colorHarmony,
            style: outfit.score.breakdown.styleMatching,
            season: outfit.score.breakdown.seasonSuitability,
            occasion: outfit.score.breakdown.occasionSuitability,
          },
        };
        setOutfitToEdit(outfitWithMetadata);
        setEditModalVisible(true);
      }
    },
    [outfits]
  );

  const handleEditModalClose = useCallback(() => {
    setEditModalVisible(false);
    setOutfitToEdit(null);
  }, []);

  const handleOutfitUpdate = useCallback(
    (updatedOutfit: any) => {
      console.log('Updated outfit:', updatedOutfit);
      const outfitIndex = parseInt(updatedOutfit.id.replace('outfit-', ''), 10);
      if (!isNaN(outfitIndex)) {
        const savedOutfitId = saveCurrentOutfit(updatedOutfit.name);
        if (savedOutfitId) {
          router.push({
            pathname: '/profile/saved' as any,
            params: { highlight: savedOutfitId },
          });
        }
      }
    },
    [saveCurrentOutfit]
  );

  const handleManualOutfitBuilder = useCallback(() => {
    router.push('/outfit-builder');
  }, []);

  const hasActiveFilters =
    currentFilters.occasion ||
    currentFilters.style ||
    currentFilters.formality ||
    currentFilters.colors.length > 0 ||
    currentFilters.includeWeather ||
    currentFilters.stylePreferences.bodyType ||
    currentFilters.stylePreferences.preferredFit ||
    (currentFilters.stylePreferences.avoidPatterns?.length || 0) > 0 ||
    currentFilters.stylePreferences.prioritizeComfort ||
    currentFilters.weatherIntegration.enabled;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <H1>Generate Outfits</H1>
        <BodyMedium color="secondary">
          Let AI create perfect outfits from your wardrobe
        </BodyMedium>
      </View>

      {/* Conditional Filters Display */}
      {showQuickFilters && !hasActiveFilters ? (
        <QuickFilters
          onOccasionSelect={handleQuickOccasionSelect}
          onStyleSelect={handleQuickStyleSelect}
          onOpenAdvancedFilters={() => setFiltersModalVisible(true)}
          selectedOccasion={currentFilters.occasion}
          selectedStyle={currentFilters.style}
        />
      ) : (
        <OutfitFiltersBar
          filters={currentFilters}
          onOpenFilters={() => setFiltersModalVisible(true)}
          onClearFilter={handleClearFilter}
          onClearAllFilters={handleClearAllFilters}
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Generate Button - Only show if filters are applied */}
        {hasActiveFilters && (
          <View style={styles.generateSection}>
            <Button
              title="Generate Outfit"
              onPress={handleGenerateOutfit}
              loading={loading}
              style={styles.generateButton}
            />
          </View>
        )}

        {/* Outfit Generation Statistics */}
        <OutfitStatsDisplay
          totalItems={filteredItems.length}
          generatedOutfits={outfits.length}
          averageScore={
            outfits.length > 0
              ? (outfits.reduce((sum, outfit) => sum + outfit.score.total, 0) /
                  outfits.length) *
                100
              : 0
          }
          highScoreOutfits={
            outfits.filter(outfit => outfit.score.total >= 0.8).length
          }
          utilizationRate={
            filteredItems.length > 0
              ? (outfits
                  .flatMap(outfit => outfit.items)
                  .filter(
                    (item, index, arr) =>
                      arr.findIndex(i => i.id === item.id) === index
                  ).length /
                  filteredItems.length) *
                100
              : 0
          }
        />

        {/* Generated Outfits Display */}
        {loading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>
              Generating perfect outfits for you...
            </Text>
          </View>
        ) : outfits.length > 0 ? (
          <View style={styles.outfitsSection}>
            <H3 style={styles.sectionTitle}>Your AI-Generated Outfits</H3>
            <OutfitCard
              outfits={outfits.map((outfit, index) => ({
                id: `outfit-${index}`,
                name: `Generated Outfit ${index + 1}`,
                items: outfit.items,
                score: {
                  total: outfit.score.total,
                  color: outfit.score.breakdown.colorHarmony,
                  style: outfit.score.breakdown.styleMatching,
                  season: outfit.score.breakdown.seasonSuitability,
                  occasion: outfit.score.breakdown.occasionSuitability,
                },
              }))}
              onOutfitPress={(outfitId: string) => {
                const index = parseInt(outfitId.replace('outfit-', ''), 10);
                handleOutfitPress(index);
              }}
              onSaveOutfit={handleOutfitSave}
              onEditOutfit={handleOutfitEdit}
            />
          </View>
        ) : showQuickFilters && !hasActiveFilters ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Choose Your Style</Text>
            <Text style={styles.emptyStateDescription}>
              Select an occasion and style above to get started with AI-powered
              outfit recommendations.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              Ready to Generate Outfits?
            </Text>
            <Text style={styles.emptyStateDescription}>
              Click Generate Outfit to get AI-powered outfit recommendations
              based on your selected filters.
            </Text>
          </View>
        )}

        {/* Manual Outfit Builder */}
        <View style={styles.manualBuilderContainer}>
          <TouchableOpacity
            style={styles.manualBuilderCard}
            onPress={handleManualOutfitBuilder}
          >
            <View style={styles.manualBuilderIcon}>
              <Plus size={28} color={Colors.primary[500]} />
            </View>
            <View style={styles.manualBuilderContent}>
              <Text style={styles.manualBuilderTitle}>
                Create Manual Outfit
              </Text>
              <Text style={styles.manualBuilderDescription}>
                Build your own outfit combinations to train our AI
              </Text>
            </View>
            <View style={styles.optionArrow}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <H3 style={styles.sectionTitle}>Customize Generation</H3>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={handlePreferences}
          >
            <View style={styles.optionIcon}>
              <Settings size={24} color={Colors.secondary[400]} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Style Preferences</Text>
              <Text style={styles.optionDescription}>
                Set your style preferences and occasion settings
              </Text>
            </View>
            <View style={styles.optionArrow}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleWeatherSettings}
          >
            <View style={styles.optionIcon}>
              <Cloud size={24} color={Colors.info[500]} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Weather Integration</Text>
              <Text style={styles.optionDescription}>
                Configure weather-based outfit recommendations
              </Text>
            </View>
            <View style={styles.optionArrow}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <OutfitFiltersModal
        visible={filtersModalVisible}
        onClose={() => setFiltersModalVisible(false)}
        onApplyFilters={handleFiltersApply}
        currentFilters={currentFilters}
        weatherData={MOCK_WEATHER}
      />

      {/* Detail Modal */}
      <OutfitDetailModal
        visible={modalVisible}
        onClose={handleModalClose}
        outfit={selectedOutfit}
        onSave={handleOutfitSave}
      />

      {/* Edit Modal */}
      <OutfitEditModal
        visible={editModalVisible}
        onClose={handleEditModalClose}
        outfit={outfitToEdit}
        onSave={handleOutfitUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  generateSection: {
    marginBottom: Spacing.lg,
  },
  generateButton: {
    marginHorizontal: 0,
  },
  outfitsSection: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyStateDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    color: Colors.text.primary,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  optionArrow: {
    marginLeft: Spacing.sm,
  },
  arrow: {
    fontSize: 20,
    color: Colors.text.tertiary,
    fontWeight: '300',
  },
  manualBuilderContainer: {
    marginBottom: Spacing.lg,
  },
  manualBuilderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  manualBuilderIcon: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  manualBuilderContent: {
    flex: 1,
  },
  manualBuilderTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  manualBuilderDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
});
