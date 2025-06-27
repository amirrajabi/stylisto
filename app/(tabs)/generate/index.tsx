import { router, useFocusEffect } from 'expo-router';
import { Filter, Plus, Sparkles, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
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
import {
  OutfitFilters,
  OutfitFiltersModal,
} from '../../../components/outfits/OutfitFiltersModal';
import { OutfitStatsDisplay } from '../../../components/outfits/OutfitStatsDisplay';
import { BodyMedium, H1, H3 } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useOutfitRecommendation } from '../../../hooks/useOutfitRecommendation';
import { useWardrobe } from '../../../hooks/useWardrobe';

import { OutfitGenerationProgress } from '../../../components/outfits/OutfitGenerationProgress';
import { useManualOutfits } from '../../../hooks/useManualOutfits';
import { useOutfitFavorites } from '../../../hooks/useOutfitFavorites';
import { Occasion } from '../../../types/wardrobe';

const getOccasionLabel = (occasion: Occasion): string => {
  switch (occasion) {
    case Occasion.CASUAL:
      return 'Casual';
    case Occasion.WORK:
      return 'Work';
    case Occasion.FORMAL:
      return 'Formal';
    case Occasion.DATE:
      return 'Date';
    case Occasion.SPORT:
      return 'Sport';
    case Occasion.PARTY:
      return 'Party';
    default:
      return 'Unknown';
  }
};

const getStyleLabel = (style: string): string => {
  const labels: Record<string, string> = {
    minimalist: 'Minimalist',
    bohemian: 'Bohemian',
    classic: 'Classic',
    trendy: 'Trendy',
    edgy: 'Edgy',
    romantic: 'Romantic',
    sporty: 'Sporty',
    vintage: 'Vintage',
  };
  return labels[style] || style;
};

const getFormalityLabel = (formality: string): string => {
  const labels: Record<string, string> = {
    casual: 'Casual',
    'semi-formal': 'Semi-Formal',
    formal: 'Formal',
  };
  return labels[formality] || formality;
};

const getColorLabel = (color: string): string => {
  const labels: Record<string, string> = {
    neutrals: 'Neutrals',
    blues: 'Blues',
    greens: 'Greens',
    reds: 'Reds',
    blacks: 'Blacks',
    whites: 'Whites',
    pastels: 'Pastels',
    'earth-tones': 'Earth Tones',
  };
  return labels[color] || color;
};

export default function StylistScreen() {
  const { filteredItems } = useWardrobe();

  // Use new hook for manual outfits - direct from database without cache
  const {
    manualOutfits: manualOutfitsFromDB,
    loading: manualOutfitsLoading,
    refreshManualOutfits,
  } = useManualOutfits();

  const { favoriteStatus, toggleOutfitFavorite, setOutfitFavoriteStatus } =
    useOutfitFavorites();

  const [screenReady, setScreenReady] = useState(false);

  // Ref to prevent infinite refreshing
  const hasRefreshedOnFocus = React.useRef(false);

  const {
    loading,
    error,
    outfits,
    selectedOutfitIndex,
    saveCurrentOutfit,
    nextOutfit,
    previousOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
    generateRecommendations,
    generationProgress,
    hasPersistedManualOutfits,
    clearAndRegenerateOutfits,
  } = useOutfitRecommendation(undefined, screenReady);

  const [selectedOutfit, setSelectedOutfit] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [outfitToEdit, setOutfitToEdit] = useState<any>(null);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [showQuickFilters, setShowQuickFilters] = useState(true);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);

  const [currentFilters, setCurrentFilters] = useState<OutfitFilters>({
    occasion: null,
    style: null,
    weatherConditions: null,
    formality: null,
    colors: [],
    includeWeather: false,
    temperatureRange: { min: 15, max: 25 },
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
      useCurrentLocation: false,
      location: undefined,
    },
  });

  // Skeleton animation
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const SkeletonCard = ({ index }: { index: number }) => {
    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View style={[styles.skeletonCard, { opacity }]}>
        <Animated.View style={[styles.skeletonPreview, { opacity }]} />
        <Animated.View style={[styles.skeletonText, { opacity }]} />
      </Animated.View>
    );
  };

  // Ensure screen renders before any heavy processing
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setScreenReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-generation is handled by useOutfitRecommendation hook

  // Manual trigger for initial outfit generation if needed
  React.useEffect(() => {
    if (
      screenReady &&
      filteredItems.length >= 2 &&
      outfits.length === 0 &&
      !loading
    ) {
      console.log('🎯 Manual trigger: Generating initial outfits');
      generateRecommendations({
        maxResults: Math.min(30, Math.max(8, filteredItems.length)),
        minScore: 0.45,
        useAllItems: true,
      });
    }
  }, [
    screenReady,
    filteredItems.length,
    outfits.length,
    loading,
    generateRecommendations,
  ]);

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

  // Reset current outfit index when outfits change
  React.useEffect(() => {
    if (outfits.length > 0) {
      setCurrentOutfitIndex(0);
    }
  }, [outfits.length]);

  const handleFiltersApply = useCallback(
    async (filters: OutfitFilters) => {
      setCurrentFilters(filters);
      setShowQuickFilters(false);

      console.log('🎯 Applying filters and auto-generating outfits:', filters);

      // Map formality string to number
      const mapFormalityToNumber = (formality: string | null): number => {
        switch (formality) {
          case 'casual':
            return 0.2;
          case 'semi-formal':
            return 0.5;
          case 'formal':
            return 0.8;
          default:
            return filters.stylePreferences.formality;
        }
      };

      // Map style to style preferences
      const mapStyleToPreferences = (style: string | null) => {
        const base = {
          formality: filters.formality
            ? mapFormalityToNumber(filters.formality)
            : filters.stylePreferences.formality,
          boldness: filters.stylePreferences.boldness,
          layering: filters.stylePreferences.layering,
          colorfulness: filters.stylePreferences.colorfulness,
        };

        switch (style) {
          case 'minimalist':
            return { ...base, boldness: 0.2, colorfulness: 0.3, layering: 0.2 };
          case 'bohemian':
            return { ...base, boldness: 0.7, colorfulness: 0.8, layering: 0.7 };
          case 'classic':
            return {
              ...base,
              formality: 0.6,
              boldness: 0.4,
              colorfulness: 0.4,
            };
          case 'trendy':
            return { ...base, boldness: 0.8, colorfulness: 0.7, layering: 0.6 };
          case 'edgy':
            return {
              ...base,
              boldness: 0.9,
              colorfulness: 0.5,
              formality: 0.3,
            };
          case 'romantic':
            return { ...base, boldness: 0.3, colorfulness: 0.6, layering: 0.5 };
          case 'sporty':
            return { ...base, formality: 0.2, boldness: 0.6, layering: 0.3 };
          case 'vintage':
            return { ...base, boldness: 0.5, colorfulness: 0.6, layering: 0.4 };
          default:
            return base;
        }
      };

      // Prepare comprehensive generation options
      const generationOptions = {
        occasion: filters.occasion,
        preferredColors: filters.colors.length > 0 ? filters.colors : undefined,
        stylePreference: filters.style
          ? mapStyleToPreferences(filters.style)
          : {
              formality: filters.formality
                ? mapFormalityToNumber(filters.formality)
                : filters.stylePreferences.formality,
              boldness: filters.stylePreferences.boldness,
              layering: filters.stylePreferences.layering,
              colorfulness: filters.stylePreferences.colorfulness,
            },
        maxResults: Math.min(25, Math.max(6, filteredItems.length)), // Realistic based on filters
        minScore: 0.65, // Require quality outfits
      };

      // Auto-generate outfits immediately after applying filters
      try {
        if (filters.includeWeather || filters.temperatureRange) {
          await getWeatherBasedRecommendation({
            temperature: filters.temperatureRange?.min || 20,
            conditions: 'clear' as
              | 'clear'
              | 'cloudy'
              | 'rainy'
              | 'snowy'
              | 'windy',
            precipitation: 0,
            humidity: 0.4,
            windSpeed: 5,
          });
        } else if (filters.occasion) {
          await getOccasionBasedRecommendation(filters.occasion);
        } else {
          // Generate outfit with all applied filters
          await generateRecommendations(generationOptions);
        }
      } catch (error) {
        console.error('Error generating outfits after filter apply:', error);
      }
    },
    [
      getWeatherBasedRecommendation,
      getOccasionBasedRecommendation,
      generateRecommendations,
      filteredItems.length,
    ]
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
          if (value === 'formality') {
            newFilters.stylePreferences.formality = 0.5;
          } else if (value === 'boldness') {
            newFilters.stylePreferences.boldness = 0.5;
          } else if (value === 'layering') {
            newFilters.stylePreferences.layering = 0.5;
          } else if (value === 'colorfulness') {
            newFilters.stylePreferences.colorfulness = 0.5;
          } else if (value === 'autoWeather') {
            newFilters.stylePreferences.autoWeather = true;
          } else if (value === 'saveHistory') {
            newFilters.stylePreferences.saveHistory = true;
          } else if (value === 'useColorTheory') {
            newFilters.stylePreferences.useColorTheory = true;
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
          (newFilters.temperatureRange &&
            (newFilters.temperatureRange.min !== 15 ||
              newFilters.temperatureRange.max !== 25)) ||
          newFilters.stylePreferences.formality !== 0.5 ||
          newFilters.stylePreferences.boldness !== 0.5 ||
          newFilters.stylePreferences.layering !== 0.5 ||
          newFilters.stylePreferences.colorfulness !== 0.5 ||
          !newFilters.stylePreferences.autoWeather ||
          !newFilters.stylePreferences.saveHistory ||
          !newFilters.stylePreferences.useColorTheory ||
          newFilters.weatherIntegration.enabled;

        if (!hasActiveFilters) {
          setShowQuickFilters(true);
        }

        return newFilters;
      });
    },
    []
  );

  const handleClearAllFilters = useCallback(async () => {
    console.log('🧹 Clearing all filters and regenerating outfits');

    // Reset filters to default
    const defaultFilters = {
      occasion: null,
      style: null,
      weatherConditions: null,
      formality: null,
      colors: [],
      includeWeather: false,
      temperatureRange: { min: 15, max: 25 },
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
        useCurrentLocation: false,
        location: undefined,
      },
    };

    setCurrentFilters(defaultFilters);
    setShowQuickFilters(true);

    // Auto-generate default outfits after clearing filters
    try {
      await generateRecommendations({
        maxResults: Math.min(30, Math.max(8, filteredItems.length)), // Realistic based on item count
        minScore: 0.65, // Require quality outfits
        stylePreference: {
          formality: 0.5,
          boldness: 0.5,
          layering: 0.5,
          colorfulness: 0.5,
        },
      });
    } catch (error) {
      console.error('Error generating outfits after clearing filters:', error);
    }
  }, [generateRecommendations, filteredItems.length]);

  const handleSaveOutfit = useCallback(() => {
    const outfitId = saveCurrentOutfit();
    if (outfitId) {
      router.push({
        pathname: '/profile/saved' as any,
        params: { highlight: outfitId },
      });
    }
  }, [saveCurrentOutfit]);

  const handleOutfitPress = useCallback(
    (outfitIndex: number) => {
      const outfit = outfits[outfitIndex];
      if (outfit) {
        const outfitId = `outfit-${outfitIndex}`;
        const outfitWithMetadata = {
          id: outfitId,
          name: `Generated Outfit ${outfitIndex + 1}`,
          items: outfit.items,
          score: {
            total: outfit.score.total,
            color: outfit.score.breakdown.colorHarmony,
            style: outfit.score.breakdown.styleMatching,
            season: outfit.score.breakdown.seasonSuitability,
            occasion: outfit.score.breakdown.occasionSuitability,
          },
          isFavorite: favoriteStatus[outfitId] || false,
        };
        setSelectedOutfit(outfitWithMetadata);
        setModalVisible(true);
      }
    },
    [outfits, favoriteStatus]
  );

  const handleModalClose = useCallback(() => {
    console.log('🔄 Closing outfit detail modal');
    setModalVisible(false);
    setSelectedOutfit(null);
  }, []);

  const handleOutfitSave = useCallback(
    async (outfitId: string) => {
      // Handle AI generated outfits
      if (outfitId.startsWith('outfit-')) {
        const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
        if (!isNaN(outfitIndex) && outfits[outfitIndex]) {
          const savedOutfitId = saveCurrentOutfit(
            `Generated Outfit ${outfitIndex + 1}`
          );
          if (savedOutfitId) {
            // Refresh saved outfits from database after saving
            await refreshManualOutfits();

            console.log('✅ Outfit updated successfully:', savedOutfitId);
          }
        }
      }
      // Handle manual outfits
      else if (outfitId.startsWith('manual-db-')) {
        const originalId = outfitId.replace('manual-db-', '');
        const outfit = manualOutfitsFromDB.find(o => o.id === originalId);
        if (outfit) {
          // Manual outfits are already saved, just navigate to saved page
          console.log('✅ Manual outfit already saved:', outfit.id);
        }
      }
    },
    [outfits, saveCurrentOutfit, refreshManualOutfits, manualOutfitsFromDB]
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
    async (updatedOutfit: any) => {
      console.log('Updated outfit:', updatedOutfit);
      const outfitIndex = parseInt(updatedOutfit.id.replace('outfit-', ''), 10);
      if (!isNaN(outfitIndex)) {
        const savedOutfitId = saveCurrentOutfit(updatedOutfit.name);
        if (savedOutfitId) {
          // Refresh saved outfits from database after updating
          await refreshManualOutfits();

          console.log('✅ Outfit saved successfully:', savedOutfitId);
        }
      }
    },
    [saveCurrentOutfit, refreshManualOutfits]
  );

  const handleProveOutfit = useCallback(async (outfitId: string) => {
    console.log('🚀 Prove outfit function called for outfit:', outfitId);
    // TODO: Add your custom prove outfit functionality here
    // This is where you can implement the specific action you want to perform
    // Examples:
    // - Navigate to a specific screen
    // - Call an API endpoint
    // - Show a specific modal
    // - Trigger a specific workflow
    alert(`Prove outfit functionality triggered for outfit: ${outfitId}`);
  }, []);

  const handleTryOutfit = useCallback(async (outfitId: string) => {
    console.log('👕 Try outfit function called for outfit:', outfitId);
    // TODO: Add your custom try outfit functionality here
    // This could trigger:
    // - Virtual try-on feature
    // - Outfit preview mode
    // - Camera/AR integration
    alert(`Try outfit functionality triggered for outfit: ${outfitId}`);
  }, []);

  const handleShareOutfit = useCallback(async (outfitId: string) => {
    console.log('📤 Share outfit function called for outfit:', outfitId);
    // TODO: Add your custom share functionality here
    // This could trigger:
    // - Social media sharing
    // - Export to image
    // - Share with friends
    alert(`Share outfit functionality triggered for outfit: ${outfitId}`);
  }, []);

  const handleManualOutfitBuilder = useCallback(() => {
    router.push('/outfit-builder');
  }, []);

  const hasActiveFilters =
    currentFilters.occasion ||
    currentFilters.style ||
    currentFilters.formality ||
    currentFilters.colors.length > 0 ||
    currentFilters.includeWeather ||
    (currentFilters.temperatureRange &&
      (currentFilters.temperatureRange.min !== 15 ||
        currentFilters.temperatureRange.max !== 25)) ||
    currentFilters.stylePreferences.formality !== 0.5 ||
    currentFilters.stylePreferences.boldness !== 0.5 ||
    currentFilters.stylePreferences.layering !== 0.5 ||
    currentFilters.stylePreferences.colorfulness !== 0.5 ||
    currentFilters.stylePreferences.autoWeather ||
    !currentFilters.stylePreferences.saveHistory ||
    !currentFilters.stylePreferences.useColorTheory ||
    currentFilters.weatherIntegration.enabled;

  // Add weather update handler
  const [realWeatherData, setRealWeatherData] = useState<any>(null);

  const handleWeatherUpdate = useCallback(async (weatherData: any) => {
    console.log('🌤️ Weather data received:', weatherData);

    // Store real weather data
    setRealWeatherData(weatherData);

    // Update filters
    setCurrentFilters(prev => ({
      ...prev,
      weatherIntegration: {
        ...prev.weatherIntegration,
        enabled: true,
      },
      includeWeather: true,
      weatherConditions: weatherData.conditions,
    }));
  }, []);

  // Debug manual outfits data
  useEffect(() => {
    console.log('🔍 Manual outfits updated:', {
      loading: manualOutfitsLoading,
      count: manualOutfitsFromDB.length,
      outfits: manualOutfitsFromDB.map(o => ({
        id: o.id,
        name: o.name,
        items: o.items?.length,
      })),
    });
  }, [manualOutfitsFromDB, manualOutfitsLoading]);

  // Refresh saved outfits when screen comes into focus (only once per focus)
  useFocusEffect(
    useCallback(() => {
      if (!hasRefreshedOnFocus.current) {
        console.log('🔄 Stylist screen focused, refreshing saved outfits...');
        refreshManualOutfits();
        hasRefreshedOnFocus.current = true;
      }

      return () => {
        // Reset the flag when screen loses focus
        hasRefreshedOnFocus.current = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with integrated filter button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleSection}>
            <H1 style={styles.title}>AI Stylist</H1>
            <BodyMedium style={styles.headerSubtitle}>
              Your personal AI stylist powered by advanced fashion intelligence
            </BodyMedium>
          </View>
          <TouchableOpacity
            style={[
              styles.headerFilterButton,
              hasActiveFilters && styles.headerFilterButtonActive,
            ]}
            onPress={() => setFiltersModalVisible(true)}
          >
            <Filter
              size={20}
              color={
                hasActiveFilters ? Colors.primary[600] : Colors.text.secondary
              }
            />
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {[
                    currentFilters.occasion,
                    currentFilters.style,
                    currentFilters.formality,
                    currentFilters.includeWeather,
                    currentFilters.stylePreferences.formality !== 0.5,
                    currentFilters.stylePreferences.boldness !== 0.5,
                    currentFilters.stylePreferences.layering !== 0.5,
                    currentFilters.stylePreferences.colorfulness !== 0.5,
                    !currentFilters.stylePreferences.autoWeather,
                    !currentFilters.stylePreferences.saveHistory,
                    !currentFilters.stylePreferences.useColorTheory,
                    currentFilters.weatherIntegration.enabled,
                  ].filter(Boolean).length + currentFilters.colors.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.activeFiltersScroll}
              contentContainerStyle={styles.activeFiltersContent}
            >
              {currentFilters.occasion && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {getOccasionLabel(currentFilters.occasion)}
                  </Text>
                </View>
              )}
              {currentFilters.style && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {getStyleLabel(currentFilters.style)}
                  </Text>
                </View>
              )}
              {currentFilters.formality && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {getFormalityLabel(currentFilters.formality)}
                  </Text>
                </View>
              )}
              {currentFilters.colors.map(color => (
                <View key={color} style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {getColorLabel(color)}
                  </Text>
                </View>
              ))}
              {currentFilters.includeWeather && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>Weather</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={handleClearAllFilters}
            >
              <X size={16} color={Colors.error[600]} />
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* AI Generated Outfits Section */}
        {!screenReady ? (
          <OutfitGenerationProgress
            isGenerating={true}
            progress={0.05}
            onComplete={() => {}}
          />
        ) : loading ? (
          <OutfitGenerationProgress
            isGenerating={loading}
            progress={generationProgress}
            onComplete={() => {}}
          />
        ) : outfits.length > 0 ? (
          <View style={styles.outfitsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleWithIcon}>
                  <Sparkles size={20} color={Colors.primary[600]} />
                  <H3 style={styles.sectionTitle}>AI Generated Outfits</H3>
                </View>
                <Text style={styles.outfitCount}>({outfits.length})</Text>
              </View>
              {hasPersistedManualOutfits && (
                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={clearAndRegenerateOutfits}
                  disabled={loading}
                >
                  <X size={16} color={Colors.primary[600]} />
                  <Text style={styles.regenerateButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.sectionDescription}>
              Fresh outfit suggestions generated by AI based on your preferences
              and wardrobe
            </Text>
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
                isFavorite: favoriteStatus[`outfit-${index}`] || false,
              }))}
              onOutfitPress={(outfitId: string) => {
                const index = parseInt(outfitId.replace('outfit-', ''), 10);
                handleOutfitPress(index);
              }}
              onSaveOutfit={handleOutfitSave}
              onEditOutfit={handleOutfitEdit}
              onCurrentIndexChange={setCurrentOutfitIndex}
              currentIndex={currentOutfitIndex}
              onFavoriteToggled={(outfitId: string, isFavorite: boolean) => {
                console.log(
                  `✅ Outfit ${outfitId} favorite status changed to: ${isFavorite}`
                );
              }}
            />
          </View>
        ) : showQuickFilters && !hasActiveFilters ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>AI Stylist Ready</Text>
            <Text style={styles.emptyStateDescription}>
              Your AI stylist is ready to create amazing outfit combinations.
              Choose a style above or generate general recommendations.
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() =>
                generateRecommendations({
                  maxResults: Math.min(30, Math.max(8, filteredItems.length)),
                  minScore: 0.45,
                  useAllItems: true,
                })
              }
              disabled={loading || filteredItems.length < 2}
            >
              <Sparkles size={20} color={Colors.background.primary} />
              <Text style={styles.generateButtonText}>Generate AI Outfits</Text>
            </TouchableOpacity>
            {filteredItems.length < 2 && (
              <Text style={styles.warningText}>
                Add at least 2 items to your wardrobe to generate outfits
              </Text>
            )}
          </View>
        ) : hasActiveFilters && !loading && outfits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Preparing Your Outfits</Text>
            <Text style={styles.emptyStateDescription}>
              Processing your preferences to create perfect outfit combinations.
            </Text>

            {/* Show progress indicator when preparing */}
            <View style={styles.preparingProgressContainer}>
              <OutfitGenerationProgress
                isGenerating={true}
                progress={0.15}
                onComplete={() => {}}
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Ready for Styling?</Text>
            <Text style={styles.emptyStateDescription}>
              Use the filters above to get personalized styling recommendations
              based on your preferences.
            </Text>
          </View>
        )}

        {/* Manual Outfits Section */}
        {manualOutfitsFromDB.length > 0 && (
          <View style={styles.outfitsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <H3 style={styles.sectionTitle}>Your Manual Outfits</H3>
                <Text style={styles.outfitCount}>
                  ({manualOutfitsFromDB.length})
                </Text>
              </View>
            </View>
            <Text style={styles.sectionDescription}>
              Outfits you&apos;ve manually created to train the AI
            </Text>

            {manualOutfitsLoading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.recentOutfitsContainer}
                contentContainerStyle={styles.recentOutfitsContent}
              >
                {[1, 2, 3, 4].map(item => (
                  <SkeletonCard key={item} index={item} />
                ))}
              </ScrollView>
            ) : manualOutfitsFromDB.length > 0 ? (
              <OutfitCard
                outfits={manualOutfitsFromDB.map(outfit => {
                  console.log(
                    '🔍 Mapping outfit for OutfitCard:',
                    outfit.id,
                    outfit.name,
                    'isFavorite from DB:',
                    outfit.isFavorite
                  );
                  return {
                    id: `manual-db-${outfit.id}`,
                    name: outfit.name,
                    items: outfit.items,
                    score: outfit.score,
                    type: 'manual',
                    originalData: outfit,
                    isFavorite: outfit.isFavorite || false,
                    createdAt: outfit.createdAt,
                    updatedAt: outfit.updatedAt,
                  };
                })}
                onOutfitPress={(outfitId: string) => {
                  const id = outfitId.replace('manual-db-', '');
                  const outfit = manualOutfitsFromDB.find(o => o.id === id);
                  if (outfit) {
                    console.log('🔍 Selected outfit for modal:', outfit);
                    console.log('🔍 Outfit score:', outfit.score);

                    // Ensure score structure matches OutfitDetailModal expectations
                    const normalizedScore = {
                      total: outfit.score?.total || 0.8,
                      color: outfit.score?.color || 0.8,
                      style: outfit.score?.style || 0.8,
                      season: outfit.score?.season || 0.8,
                      occasion: outfit.score?.occasion || 0.8,
                    };

                    setSelectedOutfit({
                      id: `manual-db-${outfit.id}`,
                      name: outfit.name,
                      items: outfit.items || [],
                      score: normalizedScore,
                    });
                    setModalVisible(true);
                  }
                }}
                onSaveOutfit={handleOutfitSave}
                onEditOutfit={(outfit: any) => {
                  const id = outfit.id.replace('manual-db-', '');
                  const foundOutfit = manualOutfitsFromDB.find(
                    o => o.id === id
                  );
                  if (foundOutfit) {
                    setOutfitToEdit({
                      ...outfit,
                      isManual: true,
                    });
                    setEditModalVisible(true);
                  }
                }}
                onCurrentIndexChange={setCurrentOutfitIndex}
                currentIndex={0}
                onFavoriteToggled={(outfitId: string, isFavorite: boolean) => {
                  console.log(
                    `✅ Manual outfit ${outfitId} favorite status changed to: ${isFavorite}`
                  );
                }}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.recentOutfitsContainer}
                contentContainerStyle={styles.recentOutfitsContent}
              >
                <TouchableOpacity
                  style={styles.addOutfitCard}
                  onPress={() => router.push('/outfit-builder')}
                >
                  <View style={styles.addOutfitIcon}>
                    <Plus size={20} color={Colors.primary[600]} />
                  </View>
                  <Text style={styles.addOutfitText}>
                    Create Your First Outfit
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
      </ScrollView>

      {/* Filters Modal */}
      <OutfitFiltersModal
        visible={filtersModalVisible}
        onClose={() => setFiltersModalVisible(false)}
        onApplyFilters={handleFiltersApply}
        currentFilters={currentFilters}
      />

      {/* Detail Modal */}
      <OutfitDetailModal
        visible={modalVisible}
        onClose={handleModalClose}
        outfit={selectedOutfit}
        onSave={handleOutfitSave}
        onShare={handleShareOutfit}
        onProve={handleProveOutfit}
        onTry={handleTryOutfit}
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
  headerSubtitle: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },

  outfitsSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  outfitCount: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
    fontWeight: '500',
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  title: {
    color: Colors.text.primary,
  },
  headerFilterButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    position: 'relative',
  },
  headerFilterButtonActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface.primary,
  },
  filterBadgeText: {
    ...Typography.caption.small,
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: 10,
  },
  activeFiltersContainer: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFiltersScroll: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  activeFiltersContent: {
    paddingRight: Spacing.sm,
    gap: Spacing.xs,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary[100],
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  activeFilterText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
    fontWeight: '500',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[200],
    borderRadius: 20,
    marginLeft: Spacing.sm,
    ...Shadows.sm,
  },
  clearFiltersText: {
    ...Typography.body.small,
    color: Colors.error[700],
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  preparingProgressContainer: {
    marginTop: Spacing.lg,
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: 20,
    ...Shadows.sm,
  },
  regenerateButtonText: {
    ...Typography.body.small,
    color: Colors.primary[700],
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  recentOutfitsSection: {
    marginBottom: Spacing.xl,
  },
  viewAllButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  viewAllText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  recentOutfitsContainer: {
    flex: 1,
  },
  recentOutfitsContent: {
    paddingRight: Spacing.sm,
    gap: Spacing.xs,
  },
  recentOutfitCard: {
    width: 120,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    ...Shadows.sm,
    position: 'relative',
  },
  recentOutfitPreview: {
    width: '100%',
    height: 80,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  outfitItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitItemMini: {
    width: 16,
    height: 16,
    borderRadius: Layout.borderRadius.sm,
    margin: 1,
  },
  outfitPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitPlaceholderText: {
    ...Typography.heading.h4,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  recentOutfitName: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.error[500],
    borderRadius: Layout.borderRadius.full,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 12,
    color: Colors.white,
  },
  addOutfitCard: {
    width: 120,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    ...Shadows.sm,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  addOutfitIcon: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  addOutfitText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  skeletonCard: {
    width: 120,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    ...Shadows.sm,
    position: 'relative',
  },
  skeletonPreview: {
    width: '100%',
    height: 80,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  skeletonText: {
    width: '100%',
    height: 16,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.full,
  },
  sectionDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  generateButtonText: {
    ...Typography.body.medium,
    color: Colors.background.primary,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  warningText: {
    ...Typography.body.small,
    color: Colors.warning[600],
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
