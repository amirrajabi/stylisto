import { router, useFocusEffect } from 'expo-router';
import { Filter, Plus, Search, Sparkles } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { OutfitCard } from '../../../components/outfits/OutfitCard';
import { OutfitEditModal } from '../../../components/outfits/OutfitEditModal';
import {
  OutfitFilters,
  OutfitFiltersModal,
} from '../../../components/outfits/OutfitFiltersModal';
import { OutfitStatsDisplay } from '../../../components/outfits/OutfitStatsDisplay';
import { FloatingActionButton, H3 } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useAuth } from '../../../hooks/useAuth';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { supabase } from '../../../lib/supabase';
import { generateOutfitName } from '../../../utils/outfitNaming';

import { OutfitGenerationProgress } from '../../../components/outfits/OutfitGenerationProgress';
import { useManualOutfits } from '../../../hooks/useManualOutfits';
import { useOutfitFavorites } from '../../../hooks/useOutfitFavorites';
import { OutfitService } from '../../../lib/outfitService';
import { Occasion } from '../../../types/wardrobe';

import { OutfitStylistModal } from '../../../components/outfits/OutfitStylistModal';
import { Toast } from '../../../components/ui/Toast';

import { useOutfitRecommendation } from '../../../hooks/useOutfitRecommendation';

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
  const { user } = useAuth();
  const { filteredItems } = useWardrobe();

  // Use new hook for manual outfits - direct from database with global event listener
  const {
    manualOutfits: manualOutfitsFromDB,
    loading: manualOutfitsLoading,
    refreshManualOutfits,
  } = useManualOutfits();

  const { favoriteStatus } = useOutfitFavorites();

  const [screenReady, setScreenReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Ref to prevent infinite refreshing
  const hasRefreshedOnFocus = React.useRef(false);

  const {
    loading,
    outfits,
    aiGeneratedOutfits,
    saveCurrentOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
    generateRecommendations,
    generationProgress,
    removeOutfitFromMemory,
    refreshOutfits,
  } = useOutfitRecommendation(undefined, screenReady);

  // Use refs to prevent dependency issues
  const refreshManualOutfitsRef = useRef(refreshManualOutfits);
  refreshManualOutfitsRef.current = refreshManualOutfits;

  const generateRecommendationsRef = useRef(generateRecommendations);
  generateRecommendationsRef.current = generateRecommendations;

  const filterNonFavoriteOutfitsRef = useRef<(() => Promise<void>) | undefined>(
    undefined
  );

  const [selectedOutfit, setSelectedOutfit] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [outfitToEdit, setOutfitToEdit] = useState<any>(null);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [showQuickFilters, setShowQuickFilters] = useState(true);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [recentlyLikedOutfits, setRecentlyLikedOutfits] = useState<Set<string>>(
    new Set()
  );

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

  // Refresh manual outfits when screen becomes ready
  React.useEffect(() => {
    if (screenReady) {
      console.log('🔄 Screen ready, refreshing manual outfits...');
      refreshManualOutfitsRef.current();
    }
  }, [screenReady]);

  // Ref to track auto-generation attempts per focus
  const autoGenerationAttempted = React.useRef(false);

  // State for filtered outfits (only non-favorites)
  const [filteredFreshAIOutfits, setFilteredFreshAIOutfits] = useState<any[]>(
    []
  );
  const [filteredDatabaseAIOutfits, setFilteredDatabaseAIOutfits] = useState<
    any[]
  >([]);
  const [filteredManualOutfits, setFilteredManualOutfits] = useState<any[]>([]);

  // Ref to prevent multiple filtering calls
  const isFilteringRef = useRef(false);
  const filterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs to avoid dependency issues
  const outfitsRef = useRef(outfits);
  const aiGeneratedOutfitsRef = useRef(aiGeneratedOutfits);
  const manualOutfitsFromDBRef = useRef(manualOutfitsFromDB);

  // Update refs when data changes
  useEffect(() => {
    outfitsRef.current = outfits;
  }, [outfits]);

  useEffect(() => {
    aiGeneratedOutfitsRef.current = aiGeneratedOutfits;
  }, [aiGeneratedOutfits]);

  useEffect(() => {
    manualOutfitsFromDBRef.current = manualOutfitsFromDB;
  }, [manualOutfitsFromDB]);

  // Function to filter outfits based on database favorite status
  const filterNonFavoriteOutfits = useCallback(async () => {
    if (!user?.id || isFilteringRef.current) return;

    isFilteringRef.current = true;

    try {
      console.log(
        '🔍 Filtering outfits - checking database for favorite status...'
      );

      // Get all saved outfits from database to check favorite status
      const { data: savedOutfits, error } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error fetching saved outfits:', error);
        return;
      }

      console.log(
        `💾 Found ${savedOutfits?.length || 0} saved outfits in database`
      );

      // Get current data from refs to avoid dependency issues
      const currentOutfits = outfitsRef.current;
      const currentAIOutfits = aiGeneratedOutfitsRef.current;
      const currentManualOutfits = manualOutfitsFromDBRef.current;

      // Filter fresh AI-generated outfits (in memory) - show only those that are not favorited in database
      const filteredFreshAI = currentOutfits.filter(outfit => {
        // Check if this fresh outfit is saved and favorited in database
        const savedOutfit = savedOutfits?.find(
          saved =>
            saved.source_type === 'ai-generated' &&
            JSON.stringify(saved.items) === JSON.stringify(outfit.items)
        );

        // Show if not in database (not saved yet) or if saved but not favorite
        const shouldShow = !savedOutfit || !savedOutfit.is_favorite;

        if (!shouldShow) {
          console.log(
            `🚫 Fresh AI outfit filtered out (favorited in database)`
          );
        }

        return shouldShow;
      });

      // Filter database AI-generated outfits - show only non-favorites
      const filteredDatabaseAI = currentAIOutfits.filter(outfit => {
        const savedOutfit = savedOutfits?.find(saved => saved.id === outfit.id);
        const shouldShow = !savedOutfit || !savedOutfit.is_favorite;

        if (!shouldShow) {
          console.log(
            `🚫 Database AI outfit filtered out (favorited in database)`
          );
        }

        return shouldShow;
      });

      // Filter manual outfits from database - show only non-favorites
      const filteredManual = currentManualOutfits.filter(outfit => {
        const savedOutfit = savedOutfits?.find(saved => saved.id === outfit.id);
        const shouldShow = !savedOutfit || !savedOutfit.is_favorite;

        if (!shouldShow) {
          console.log(`🚫 Manual outfit filtered out (favorited in database)`);
        }

        return shouldShow;
      });

      setFilteredFreshAIOutfits(filteredFreshAI);
      setFilteredDatabaseAIOutfits(filteredDatabaseAI);
      setFilteredManualOutfits(filteredManual);

      console.log(
        `✅ Filtering complete: ${filteredFreshAI.length} fresh AI outfits, ${filteredDatabaseAI.length} database AI outfits, ${filteredManual.length} manual outfits (non-favorites only)`
      );
    } catch (error) {
      console.error('❌ Error filtering non-favorite outfits:', error);
    } finally {
      isFilteringRef.current = false;
    }
  }, [user?.id]);

  // Store function in ref to avoid dependencies
  React.useEffect(() => {
    filterNonFavoriteOutfitsRef.current = filterNonFavoriteOutfits;
  });

  // Debounced filtering to prevent excessive calls
  const debouncedFilterOutfits = useCallback(() => {
    // Clear any pending timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // Set new timeout
    filterTimeoutRef.current = setTimeout(() => {
      if (user?.id && !isFilteringRef.current && filterNonFavoriteOutfits) {
        filterNonFavoriteOutfits();
      }
    }, 300);
  }, [user?.id, filterNonFavoriteOutfits]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
        filterTimeoutRef.current = null;
      }
    };
  }, []);

  // Filter outfits whenever the data changes
  useEffect(() => {
    if (
      user?.id &&
      (outfits.length > 0 ||
        aiGeneratedOutfits.length > 0 ||
        manualOutfitsFromDB.length > 0)
    ) {
      console.log('📊 Outfit data changed, re-filtering...');
      debouncedFilterOutfits();
    }
  }, [
    user?.id,
    outfits.length,
    aiGeneratedOutfits.length,
    manualOutfitsFromDB.length,
    debouncedFilterOutfits,
  ]);

  // Refresh outfits and check for auto-generation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!screenReady) return;

      console.log('🔄 Screen focused, checking outfit status...');

      // Reset auto-generation flag on each focus
      autoGenerationAttempted.current = false;

      // Always refresh manual outfits to get latest from database
      refreshManualOutfitsRef.current();

      // Filter outfits based on database favorite status
      if (filterNonFavoriteOutfits) {
        filterNonFavoriteOutfits();
      }

      // Check if we need to auto-generate AI outfits
      const checkAndGenerateOutfits = async () => {
        // Prevent multiple generation attempts during the same focus cycle
        if (autoGenerationAttempted.current) {
          console.log('🚫 Auto-generation already attempted this focus cycle');
          return;
        }

        // Get current AI-generated outfits count from ref
        const aiOutfitsCount = outfitsRef.current.length;

        console.log(`🤖 Current AI-generated outfits count: ${aiOutfitsCount}`);

        // If no AI-generated outfits, trigger auto-generation
        if (aiOutfitsCount === 0) {
          console.log('🎯 No AI-generated outfits found, auto-generating...');
          autoGenerationAttempted.current = true;

          try {
            // Use default generation options for auto-generation
            await generateRecommendationsRef.current({
              occasion: undefined,
              preferredColors: undefined,
              stylePreference: {
                formality: 0.5,
                boldness: 0.5,
                layering: 0.5,
                colorfulness: 0.5,
              },
              maxResults: Math.min(12, Math.max(6, filteredItems.length)),
              minScore: 0.6,
            });

            console.log('✅ Auto-generation completed successfully');

            // Re-filter after generation
            if (filterNonFavoriteOutfits) {
              filterNonFavoriteOutfits();
            }
          } catch (error) {
            console.error('❌ Auto-generation failed:', error);
          }
        } else {
          console.log(
            '✅ AI-generated outfits already available, no auto-generation needed'
          );
        }
      };

      // Run auto-generation check after a short delay to ensure screen is fully ready
      setTimeout(checkAndGenerateOutfits, 300);
    }, [screenReady, filteredItems.length, filterNonFavoriteOutfits])
  );

  // Filter when any outfits data changes
  useEffect(() => {
    if (screenReady) {
      const hasAnyOutfits =
        outfits.length > 0 ||
        aiGeneratedOutfits.length > 0 ||
        manualOutfitsFromDB.length > 0;

      if (hasAnyOutfits) {
        console.log(
          `🔄 Outfits data changed: fresh:${outfits.length}, db:${aiGeneratedOutfits.length}, manual:${manualOutfitsFromDB.length}`
        );
        debouncedFilterOutfits();
      }
    }
  }, [
    screenReady,
    outfits.length,
    aiGeneratedOutfits.length,
    manualOutfitsFromDB.length,
    debouncedFilterOutfits,
  ]);

  // Auto-generation is handled by useOutfitRecommendation hook with proper filtering

  // Manual trigger is no longer needed since useOutfitRecommendation handles auto-generation
  // with proper filtering of liked items from manual outfits

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
          await generateRecommendationsRef.current(generationOptions);
        }
      } catch (error) {
        console.error('Error generating outfits after filter apply:', error);
      }
    },
    [
      getWeatherBasedRecommendation,
      getOccasionBasedRecommendation,
      generateRecommendationsRef,
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
      await generateRecommendationsRef.current({
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
  }, [generateRecommendationsRef, filteredItems.length]);

  const handleOutfitSave = useCallback(
    async (outfitId: string) => {
      console.log('💾 Saving outfit from card:', outfitId);

      try {
        // Find the outfit to save
        let outfitToSave: any;

        console.log('🔍 Looking for outfit:', outfitId);
        console.log(
          '🔍 Available aiGeneratedOutfits:',
          aiGeneratedOutfits.map(o => o.id)
        );
        console.log(
          '🔍 Available manualOutfitsFromDB:',
          manualOutfitsFromDB.map(o => o.id)
        );
        console.log(
          '🔍 Available outfits from current session:',
          outfits.length
        );

        if (outfitId.startsWith('outfit-')) {
          // AI-generated outfit from current session
          const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
          console.log('🔍 Looking for AI outfit at index:', outfitIndex);

          // Try to find in current session outfits first
          if (outfits && outfits[outfitIndex]) {
            outfitToSave = {
              id: outfitId,
              name: generateOutfitName(outfits[outfitIndex].items),
              items: outfits[outfitIndex].items,
              score: outfits[outfitIndex].score,
            };
            console.log('✅ Found outfit in current session');
          } else {
            // Fallback to aiGeneratedOutfits array
            outfitToSave = aiGeneratedOutfits.find(
              (outfit: any) => outfit.id === outfitId
            );
            console.log(
              '🔍 Searched in aiGeneratedOutfits, found:',
              !!outfitToSave
            );
          }
        } else {
          // Manual or previously saved outfit
          console.log('🔍 Looking for manual/saved outfit');
          outfitToSave =
            manualOutfitsFromDB.find((outfit: any) => outfit.id === outfitId) ||
            manualOutfitsFromDB.find(
              (outfit: any) => `manual-db-${outfit.id}` === outfitId
            ) ||
            aiGeneratedOutfits.find((outfit: any) => outfit.id === outfitId);
          console.log('🔍 Found in manual/saved outfits:', !!outfitToSave);
        }

        if (!outfitToSave) {
          console.error('❌ Outfit not found with ID:', outfitId);
          console.error('Available sources:', {
            outfitsLength: outfits.length,
            aiGeneratedOutfitsIds: aiGeneratedOutfits.map(o => o.id),
            manualOutfitsIds: manualOutfitsFromDB.map(o => o.id),
          });
          throw new Error('Outfit not found');
        }

        console.log('✅ Found outfit to save:', outfitToSave.name);

        // Check if outfit already exists in saved_outfits table
        const { data: existingOutfit, error: checkError } = await supabase
          .from('saved_outfits')
          .select('id, is_favorite')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .or(`name.eq.${outfitToSave.name},notes.ilike.%${outfitId}%`)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingOutfit) {
          // Update existing outfit to favorite
          const { error: updateError } = await supabase
            .from('saved_outfits')
            .update({ is_favorite: true })
            .eq('id', existingOutfit.id);

          if (updateError) throw updateError;
          console.log('✅ Updated existing outfit favorite status');
        } else {
          // Save new outfit to database
          const result =
            await OutfitService.saveSingleGeneratedOutfit(outfitToSave);
          if (result.error) {
            throw new Error(result.error);
          }
          console.log('✅ New outfit saved to database');
        }

        // Add to recently liked outfits to hide it temporarily
        setRecentlyLikedOutfits(prev => new Set(prev).add(outfitId));

        // Remove outfit from memory/list if it's an on-the-fly generated outfit
        if (outfitId.startsWith('outfit-')) {
          const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
          removeOutfitFromMemory(outfitIndex);
          console.log('🗑️ Outfit removed from stylist list');
        }

        // Show toast notification
        setToastMessage('Outfit added to gallery');
        setToastVisible(true);

        // Set timer for 120 seconds to make outfit likeable again
        setTimeout(() => {
          console.log('⏰ 120 seconds passed - outfit can be liked again');
          setRecentlyLikedOutfits(prev => {
            const newSet = new Set(prev);
            newSet.delete(outfitId);
            return newSet;
          });
          // Refresh outfits to show the outfit again
          if (!outfitId.startsWith('outfit-')) {
            refreshOutfits();
          }
        }, 120000); // 120 seconds = 120,000 milliseconds
      } catch (error) {
        console.error('❌ Error saving outfit:', error);
        setToastMessage('Failed to save outfit');
        setToastVisible(true);
      }
    },
    [
      outfits,
      aiGeneratedOutfits,
      manualOutfitsFromDB,
      removeOutfitFromMemory,
      refreshOutfits,
      setRecentlyLikedOutfits,
    ]
  );

  const handleOutfitPress = useCallback(
    (outfitIndex: number) => {
      const outfit = outfits[outfitIndex];
      if (outfit) {
        const outfitId = `outfit-${outfitIndex}`;
        const outfitWithMetadata = {
          id: outfitId,
          name: generateOutfitName(outfit.items),
          items: outfit.items,
          score: {
            total: outfit.score.total,
            color: outfit.score.breakdown.colorHarmony,
            style: outfit.score.breakdown.styleMatching,
            season: outfit.score.breakdown.seasonSuitability,
            occasion: outfit.score.breakdown.occasionSuitability,
          },
          isFavorite: favoriteStatus[outfitId] || false,
          source_type: 'ai_generated' as const,
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

  const handleOutfitEdit = useCallback(
    (outfitId: string) => {
      const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
      const outfit = outfits[outfitIndex];
      if (outfit) {
        const outfitWithMetadata = {
          id: `outfit-${outfitIndex}`,
          name: generateOutfitName(outfit.items),
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
        const savedOutfitId = saveCurrentOutfit(
          generateOutfitName(updatedOutfit.items)
        );
        if (savedOutfitId) {
          // Refresh saved outfits from database after updating
          await refreshOutfits();

          console.log('✅ Outfit saved successfully:', savedOutfitId);
        }
      }
    },
    [saveCurrentOutfit, refreshOutfits]
  );

  const handleProveOutfit = useCallback(async (outfitId: string) => {
    console.log('🚀 Prove outfit function called for outfit:', outfitId);

    // No additional logic needed here since OutfitDetailModal handles the virtual try-on
    // This function is called as a callback when the prove button is pressed
    console.log('Virtual try-on process initiated for outfit:', outfitId);
  }, []);

  const handleVirtualTryOnComplete = useCallback((result: any) => {
    console.log('Virtual try-on completed:', result);
  }, []);

  const handleVirtualTryOnSave = useCallback((result: any) => {
    console.log('Virtual try-on result saved:', result);
  }, []);

  const handleVirtualTryOnShare = useCallback((result: any) => {
    console.log('Virtual try-on result shared:', result);
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
    alert(`Share outfit functionality triggered for outfit: ${outfitId}`);
  }, []);

  const handleOutfitDelete = useCallback(
    async (outfitId: string) => {
      console.log('🗑️ Delete outfit function called for outfit:', outfitId);

      if (outfitId.startsWith('outfit-')) {
        // On-the-fly generated outfits - remove from memory only
        const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
        removeOutfitFromMemory(outfitIndex);
        console.log('✅ Outfit removed from memory');
      } else {
        // Saved outfits in database - delete permanently
        // Strip the manual-db- prefix if present to get the actual UUID
        let actualOutfitId = outfitId;
        if (outfitId.startsWith('manual-db-')) {
          actualOutfitId = outfitId.replace('manual-db-', '');
          console.log('🔧 Stripped prefix - actual ID:', actualOutfitId);
        }

        const result = await OutfitService.deleteOutfit(actualOutfitId);
        if (!result.error) {
          console.log('✅ Outfit permanently deleted from database');
          // Refresh both manual and AI-generated outfits lists
          await refreshOutfits();
          await refreshManualOutfits();
        } else {
          console.error('❌ Failed to delete outfit:', result.error);
          alert(`Failed to delete outfit: ${result.error}`);
        }
      }
    },
    [removeOutfitFromMemory, refreshOutfits, refreshManualOutfits]
  );

  const handleOutfitLike = useCallback(
    async (outfitId: string) => {
      console.log('❤️ Like outfit function called for outfit:', outfitId);

      // Save outfit to favorites/gallery
      try {
        // Find the outfit to save
        let outfitToSave: any;

        console.log('❤️ Looking for outfit to like:', outfitId);

        if (outfitId.startsWith('outfit-')) {
          // AI-generated outfit from current session
          const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
          console.log('❤️ Looking for AI outfit at index:', outfitIndex);

          // Try to find in current session outfits first
          if (outfits && outfits[outfitIndex]) {
            outfitToSave = {
              id: outfitId,
              name: generateOutfitName(outfits[outfitIndex].items),
              items: outfits[outfitIndex].items,
              score: outfits[outfitIndex].score,
            };
            console.log('✅ Found outfit in current session for modal');
          } else {
            // Fallback to aiGeneratedOutfits array
            outfitToSave = aiGeneratedOutfits.find(
              (outfit: any) => outfit.id === outfitId
            );
            console.log(
              '❤️ Searched in aiGeneratedOutfits, found:',
              !!outfitToSave
            );
          }
        } else {
          // Manual or previously saved outfit
          console.log('❤️ Looking for manual/saved outfit');
          outfitToSave =
            manualOutfitsFromDB.find((outfit: any) => outfit.id === outfitId) ||
            manualOutfitsFromDB.find(
              (outfit: any) => `manual-db-${outfit.id}` === outfitId
            ) ||
            aiGeneratedOutfits.find((outfit: any) => outfit.id === outfitId);
          console.log('❤️ Found in manual/saved outfits:', !!outfitToSave);
        }

        if (!outfitToSave) {
          console.error('❌ Outfit not found in modal with ID:', outfitId);
          throw new Error('Outfit not found');
        }

        console.log('✅ Found outfit to like:', outfitToSave.name);

        // Check if outfit already exists in saved_outfits table
        const { data: existingOutfit, error: checkError } = await supabase
          .from('saved_outfits')
          .select('id, is_favorite')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .or(`name.eq.${outfitToSave.name},notes.ilike.%${outfitId}%`)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingOutfit) {
          // Update existing outfit to favorite
          const { error: updateError } = await supabase
            .from('saved_outfits')
            .update({ is_favorite: true })
            .eq('id', existingOutfit.id);

          if (updateError) throw updateError;
          console.log('✅ Updated existing outfit favorite status');
        } else {
          // Save new outfit to database
          const result =
            await OutfitService.saveSingleGeneratedOutfit(outfitToSave);
          if (result.error) {
            throw new Error(result.error);
          }
          console.log('✅ New outfit saved to database');
        }

        // Add to recently liked outfits to hide it temporarily
        setRecentlyLikedOutfits(prev => new Set(prev).add(outfitId));

        // Remove outfit from memory/list if it's an on-the-fly generated outfit
        if (outfitId.startsWith('outfit-')) {
          const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
          removeOutfitFromMemory(outfitIndex);
          console.log('🗑️ Outfit removed from stylist list');
        }

        // Close modal first
        setModalVisible(false);
        setSelectedOutfit(null);

        // Show toast notification after a short delay to ensure modal is closed
        setTimeout(() => {
          setToastMessage('Outfit added to gallery');
          setToastVisible(true);
        }, 100);

        // Set timer for 120 seconds to make outfit likeable again
        setTimeout(() => {
          console.log('⏰ 120 seconds passed - outfit can be liked again');
          setRecentlyLikedOutfits(prev => {
            const newSet = new Set(prev);
            newSet.delete(outfitId);
            return newSet;
          });
          // Refresh outfits to show the outfit again
          if (!outfitId.startsWith('outfit-')) {
            refreshOutfits();
          }
        }, 120000); // 120 seconds = 120,000 milliseconds
      } catch (error) {
        console.error('❌ Error saving outfit:', error);

        // Close modal even on error
        setModalVisible(false);
        setSelectedOutfit(null);

        // Show error toast
        setTimeout(() => {
          setToastMessage('Failed to save outfit');
          setToastVisible(true);
        }, 100);
      }
    },
    [
      outfits,
      aiGeneratedOutfits,
      manualOutfitsFromDB,
      removeOutfitFromMemory,
      refreshOutfits,
      setRecentlyLikedOutfits,
    ]
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
    (currentFilters.temperatureRange &&
      (currentFilters.temperatureRange.min !== 15 ||
        currentFilters.temperatureRange.max !== 25)) ||
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Stylist</Text>
      </View>

      {/* Search and Sort */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search outfits by style, occasion..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              hasActiveFilters && styles.activeFilterButton,
            ]}
            onPress={() => setFiltersModalVisible(true)}
          >
            <Filter
              size={20}
              color={hasActiveFilters ? '#ffffff' : '#6b7280'}
            />
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {[
                    currentFilters.occasion,
                    currentFilters.style,
                    currentFilters.formality,
                    currentFilters.includeWeather,
                    currentFilters.weatherIntegration.enabled,
                    currentFilters.temperatureRange &&
                      (currentFilters.temperatureRange.min !== 15 ||
                        currentFilters.temperatureRange.max !== 25),
                  ].filter(Boolean).length + currentFilters.colors.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filters - Compact Display */}
      {hasActiveFilters && (
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
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Generate AI Outfits Button - Always Available */}
        <View style={styles.generateButtonContainer}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() =>
              generateRecommendationsRef.current({
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
        ) : filteredFreshAIOutfits.filter(
            (outfit: any, index: number) =>
              !recentlyLikedOutfits.has(`outfit-${index}`)
          ).length > 0 ||
          filteredDatabaseAIOutfits.filter(
            (outfit: any) => !recentlyLikedOutfits.has(outfit.id)
          ).length > 0 ? (
          <View style={styles.outfitsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleWithIcon}>
                  <Sparkles size={20} color={Colors.primary[600]} />
                  <H3 style={styles.sectionTitle}>AI Generated Outfits</H3>
                </View>
                <Text style={styles.outfitCount}>
                  (
                  {filteredFreshAIOutfits.filter(
                    (outfit: any, index: number) =>
                      !recentlyLikedOutfits.has(`outfit-${index}`)
                  ).length +
                    filteredDatabaseAIOutfits.filter(
                      (outfit: any) => !recentlyLikedOutfits.has(outfit.id)
                    ).length}
                  )
                </Text>
              </View>
            </View>
            <Text style={styles.sectionDescription}>
              Fresh outfit suggestions generated by AI based on your preferences
              and wardrobe
            </Text>

            {/* Fresh AI Outfits (in memory) - filtered for non-favorites */}
            {filteredFreshAIOutfits.filter(
              (outfit: any, index: number) =>
                !recentlyLikedOutfits.has(`outfit-${index}`)
            ).length > 0 && (
              <View style={styles.outfitCardContainer}>
                <OutfitCard
                  outfits={filteredFreshAIOutfits
                    .filter(
                      (outfit: any, index: number) =>
                        !recentlyLikedOutfits.has(`outfit-${index}`)
                    )
                    .map((outfit: any, index: number) => {
                      // Get existing outfit names to prevent duplicates
                      const existingNames = [
                        ...filteredFreshAIOutfits
                          .slice(0, index)
                          .map((o: any) => generateOutfitName(o.items)), // Previous outfits in this batch
                        ...filteredManualOutfits.map((o: any) => o.name), // Manual outfits
                        ...filteredDatabaseAIOutfits.map((o: any) => o.name), // AI outfits from database
                      ];

                      return {
                        id: `outfit-${index}`,
                        name: generateOutfitName(outfit.items, existingNames),
                        items: outfit.items,
                        score: {
                          total: outfit.score.total,
                          color: outfit.score.breakdown.colorHarmony,
                          style: outfit.score.breakdown.styleMatching,
                          season: outfit.score.breakdown.seasonSuitability,
                          occasion: outfit.score.breakdown.occasionSuitability,
                        },
                        isFavorite: favoriteStatus[`outfit-${index}`] || false,
                      };
                    })}
                  onOutfitPress={(outfitId: string) => {
                    const index = parseInt(outfitId.replace('outfit-', ''), 10);
                    handleOutfitPress(index);
                  }}
                  onSaveOutfit={handleOutfitSave}
                  onEditOutfit={handleOutfitEdit}
                  onCurrentIndexChange={setCurrentOutfitIndex}
                  currentIndex={currentOutfitIndex}
                  onFavoriteToggled={(
                    outfitId: string,
                    isFavorite: boolean
                  ) => {
                    console.log(
                      `✅ Outfit ${outfitId} favorite status changed to: ${isFavorite}`
                    );
                  }}
                  onAIOutfitFavorited={(outfitIndex: number) => {
                    console.log(
                      `🗑️ Removing AI outfit at index ${outfitIndex} from memory`
                    );
                    removeOutfitFromMemory(outfitIndex);
                  }}
                />
              </View>
            )}

            {/* AI Outfits from Database (unfavorited) - filtered for non-favorites */}
            {filteredDatabaseAIOutfits.filter(
              (outfit: any) => !recentlyLikedOutfits.has(outfit.id)
            ).length > 0 && (
              <View style={styles.outfitCardContainer}>
                <Text style={styles.subsectionTitle}>Previously Generated</Text>
                <OutfitCard
                  outfits={filteredDatabaseAIOutfits
                    .filter(
                      (outfit: any) => !recentlyLikedOutfits.has(outfit.id)
                    )
                    .map(outfit => ({
                      id: outfit.id,
                      name: outfit.name,
                      items: outfit.items,
                      score: outfit.score,
                      isFavorite: outfit.isFavorite || false,
                    }))}
                  onOutfitPress={(outfitId: string) => {
                    const outfit = filteredDatabaseAIOutfits.find(
                      (o: any) => o.id === outfitId
                    );
                    if (outfit) {
                      const outfitWithMetadata = {
                        id: outfit.id,
                        name: outfit.name,
                        items: outfit.items,
                        score: outfit.score,
                        isFavorite: outfit.isFavorite,
                        source_type: 'ai_generated' as const,
                      };
                      setSelectedOutfit(outfitWithMetadata);
                      setModalVisible(true);
                    }
                  }}
                  onSaveOutfit={async (outfitId: string) => {
                    try {
                      // Handle saving/favoriting AI outfit from database
                      const outfit = filteredDatabaseAIOutfits.find(
                        (o: any) => o.id === outfitId
                      );
                      if (outfit) {
                        const result = await OutfitService.toggleOutfitFavorite(
                          outfit.id
                        );
                        if (!result.error) {
                          // Add to recently liked outfits to hide it temporarily
                          setRecentlyLikedOutfits(prev =>
                            new Set(prev).add(outfitId)
                          );

                          // Show toast notification
                          setToastMessage('Outfit added to gallery');
                          setToastVisible(true);

                          // Refresh outfits to update UI
                          await refreshOutfits();

                          // Set timer for 120 seconds to make outfit likeable again
                          setTimeout(() => {
                            console.log(
                              '⏰ 120 seconds passed - outfit can be liked again'
                            );
                            setRecentlyLikedOutfits(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(outfitId);
                              return newSet;
                            });
                            refreshOutfits();
                          }, 120000);

                          console.log('✅ Database AI outfit saved to gallery');
                        } else {
                          throw new Error(result.error);
                        }
                      }
                    } catch (error) {
                      console.error(
                        '❌ Error saving database AI outfit:',
                        error
                      );
                      setToastMessage('Failed to save outfit');
                      setToastVisible(true);
                    }
                  }}
                  onEditOutfit={handleOutfitEdit}
                  onCurrentIndexChange={() => {}}
                  currentIndex={0}
                  onFavoriteToggled={async (
                    outfitId: string,
                    isFavorite: boolean
                  ) => {
                    console.log(
                      `✅ Database AI outfit ${outfitId} favorite status changed to: ${isFavorite}`
                    );
                    // Refresh outfits to update UI
                    await refreshOutfits();
                  }}
                  onAIOutfitFavorited={() => {
                    // Not needed for database outfits
                  }}
                />
              </View>
            )}
          </View>
        ) : showQuickFilters && !hasActiveFilters ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>AI Stylist Ready</Text>
            <Text style={styles.emptyStateDescription}>
              Your AI stylist is ready to create amazing outfit combinations.
              Use the Generate AI Outfits button above to get started.
            </Text>
          </View>
        ) : hasActiveFilters &&
          !loading &&
          filteredFreshAIOutfits.length === 0 &&
          filteredDatabaseAIOutfits.length === 0 ? (
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
        {manualOutfitsFromDB.filter(
          outfit =>
            !outfit.isFavorite &&
            !recentlyLikedOutfits.has(`manual-db-${outfit.id}`)
        ).length > 0 && (
          <View style={styles.outfitsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <H3 style={styles.sectionTitle}>Your Manual Outfits</H3>
                <Text style={styles.outfitCount}>
                  (
                  {
                    manualOutfitsFromDB.filter(
                      outfit =>
                        !outfit.isFavorite &&
                        !recentlyLikedOutfits.has(`manual-db-${outfit.id}`)
                    ).length
                  }
                  )
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
            ) : filteredManualOutfits.filter(
                outfit => !recentlyLikedOutfits.has(`manual-db-${outfit.id}`)
              ).length > 0 ? (
              <View style={styles.outfitCardContainer}>
                <OutfitCard
                  outfits={filteredManualOutfits
                    .filter(
                      outfit =>
                        !recentlyLikedOutfits.has(`manual-db-${outfit.id}`)
                    ) // Filter out recently liked outfits (favorites already filtered)
                    .map(outfit => {
                      return {
                        id: `manual-db-${outfit.id}`,
                        name: outfit.name,
                        items: outfit.items || [],
                        score: {
                          total: outfit.score?.total || 0.8,
                          color: outfit.score?.color || 0.8,
                          style: outfit.score?.style || 0.8,
                          season: outfit.score?.season || 0.8,
                          occasion: outfit.score?.occasion || 0.8,
                        },
                        type: 'manual',
                        originalData: outfit,
                        isFavorite: outfit.isFavorite || false,
                        createdAt: outfit.createdAt,
                        updatedAt: outfit.updatedAt,
                      };
                    })}
                  onOutfitPress={(outfitId: string) => {
                    const id = outfitId.replace('manual-db-', '');
                    const outfit = filteredManualOutfits.find(o => o.id === id);
                    if (outfit) {
                      setSelectedOutfit({
                        id: `manual-db-${outfit.id}`,
                        name: outfit.name,
                        items: outfit.items || [],
                        score: {
                          total: outfit.score?.total || 0.8,
                          color: outfit.score?.color || 0.8,
                          style: outfit.score?.style || 0.8,
                          season: outfit.score?.season || 0.8,
                          occasion: outfit.score?.occasion || 0.8,
                        },
                        source_type: 'manual' as const,
                      });
                      setModalVisible(true);
                    }
                  }}
                  onSaveOutfit={handleOutfitSave}
                  onEditOutfit={(outfit: any) => {
                    const id = outfit.id.replace('manual-db-', '');
                    const foundOutfit = filteredManualOutfits.find(
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
                  onFavoriteToggled={async (
                    outfitId: string,
                    isFavorite: boolean
                  ) => {
                    console.log(
                      `✅ Stylist Screen: Manual outfit ${outfitId} favorite status changed to: ${isFavorite}`
                    );
                    // Refresh manual outfits to apply the new filter
                    console.log(
                      '🔄 Stylist Screen: Refreshing manual outfits after favorite toggle...'
                    );
                    await refreshManualOutfits();
                    console.log(
                      '✅ Stylist Screen: Manual outfits refreshed successfully'
                    );
                  }}
                />
              </View>
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
      </ScrollView>

      {/* Floating Action Button for Manual Outfit Builder */}
      <FloatingActionButton
        onPress={handleManualOutfitBuilder}
        size={56}
        iconSize={36}
        gradientColors={['#ffffff', '#ffffff']}
        icon="app-icon"
        style={styles.fab}
      />

      {/* Filters Modal */}
      <OutfitFiltersModal
        visible={filtersModalVisible}
        onClose={() => setFiltersModalVisible(false)}
        onApplyFilters={handleFiltersApply}
        currentFilters={currentFilters}
      />

      {/* Detail Modal */}
      <OutfitStylistModal
        visible={modalVisible}
        onClose={handleModalClose}
        outfit={selectedOutfit}
        isOwner={true}
        onDelete={handleOutfitDelete}
        onEdit={handleOutfitEdit}
        onLike={handleOutfitLike}
        currentUserId={user?.id}
      />

      {/* Edit Modal */}
      <OutfitEditModal
        visible={editModalVisible}
        onClose={handleEditModalClose}
        outfit={outfitToEdit}
        onSave={handleOutfitUpdate}
      />

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="success"
        duration={3000}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface.primary,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 9998,
    position: 'relative',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Inter-Regular',
    height: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
    position: 'relative',
  },
  filterButton: {
    position: 'relative',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    height: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  activeFilterButton: {
    backgroundColor: '#A428FC',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  activeFiltersScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface.primary,
  },
  activeFiltersContent: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingRight: Spacing.sm,
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

  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  outfitCardContainer: {
    marginHorizontal: -Spacing.md,
    paddingVertical: Spacing.xs,
  },
  outfitsSection: {
    marginBottom: Spacing.xs,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text.primary,
  },
  outfitCount: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  sectionDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
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
    gap: Spacing.xs,
  },
  regenerateButtonText: {
    ...Typography.body.small,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyStateDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  generateButtonContainer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  generateButtonText: {
    ...Typography.button.medium,
    color: Colors.background.primary,
    fontWeight: '600',
  },
  warningText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  preparingProgressContainer: {
    marginTop: Spacing.lg,
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  skeletonCard: {
    width: 120,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  skeletonPreview: {
    width: '100%',
    height: 80,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.surface.secondary,
    marginBottom: Spacing.xs,
  },
  skeletonText: {
    width: '80%',
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surface.secondary,
  },
  recentOutfitsContainer: {
    flex: 1,
  },
  recentOutfitsContent: {
    paddingRight: Spacing.sm,
    gap: Spacing.xs,
  },
  addOutfitCard: {
    width: 120,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border.secondary,
    borderStyle: 'dashed',
  },
  addOutfitIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary[50],
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addOutfitText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    right: 20,
  },
  subsectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.lg,
  },
});
