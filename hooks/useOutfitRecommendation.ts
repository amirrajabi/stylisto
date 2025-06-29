/**
 * useOutfitRecommendation Hook
 *
 * This hook provides outfit generation with database persistence only for manual outfits.
 *
 * Key Features:
 * - AI-generated outfits: Generated fresh every time, kept only in memory
 * - Manual outfits: Saved to and loaded from database
 * - Clean separation between AI suggestions and user-created outfits
 *
 * Behavior:
 * - AI outfits are regenerated on each app launch (not persisted)
 * - Only manual outfits are checked for in database and loaded
 * - Weather/occasion recommendations are temporary (in memory only)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  GeneratedOutfit,
  OutfitGenerationOptions,
  useOutfitGenerator,
  WeatherData,
} from '../lib/outfitGenerator';
import { GeneratedOutfitRecord, OutfitService } from '../lib/outfitService';
import { Occasion, Outfit, Season } from '../types/wardrobe';
import { generateOutfitName } from '../utils/outfitNaming';
import { useWardrobe } from './useWardrobe';

export interface OutfitRecommendationState {
  loading: boolean;
  error: string | null;
  outfits: GeneratedOutfit[];
  manualOutfits: GeneratedOutfitRecord[];
  selectedOutfitIndex: number;
  generationProgress: number;
  hasPersistedManualOutfits: boolean;
  isLoadedFromDatabase: boolean;
}

export interface OutfitWithFavorite extends GeneratedOutfit {
  isFavorite?: boolean;
}

export interface OutfitRecordWithFavorite extends GeneratedOutfitRecord {
  isFavorite?: boolean;
}

export const useOutfitRecommendation = (
  initialOptions?: Partial<OutfitGenerationOptions>,
  screenReady?: boolean
) => {
  const { items: filteredItems, actions } = useWardrobe();
  const { generateOutfits, createOutfit } = useOutfitGenerator();

  // Get wardrobe state to access existing outfits
  const wardrobeState = useWardrobe();

  const [state, setState] = useState<OutfitRecommendationState>({
    loading: false,
    error: null,
    outfits: [],
    manualOutfits: [],
    selectedOutfitIndex: 0,
    generationProgress: 0,
    hasPersistedManualOutfits: false,
    isLoadedFromDatabase: false,
  });

  const isGeneratingRef = useRef(false);
  const hasInitialGeneration = useRef(false);

  // Check for existing manual outfits on load, always generate AI outfits fresh
  useEffect(() => {
    if (screenReady && !hasInitialGeneration.current) {
      checkForExistingOutfits();
      hasInitialGeneration.current = true;
    }
  }, [screenReady]);

  const checkForExistingOutfits = useCallback(async () => {
    try {
      console.log(
        '🔍 Checking for existing manual outfits for current user...'
      );

      // Only check for manual outfits, AI outfits are always generated fresh
      const hasManualOutfits = await OutfitService.hasManualOutfits();

      console.log(`📊 User manual outfits status: Manual=${hasManualOutfits}`);

      setState(prev => ({
        ...prev,
        hasPersistedManualOutfits: hasManualOutfits,
      }));

      // Load manual outfits if they exist
      if (hasManualOutfits) {
        console.log('📥 User has manual outfits, loading from database...');

        const manualOutfits = await OutfitService.loadManualOutfits();

        setState(prev => ({
          ...prev,
          manualOutfits: manualOutfits, // Use directly without converting
          isLoadedFromDatabase: true,
        }));

        console.log(
          '✅ Loaded from database:',
          manualOutfits.length,
          'manual outfits'
        );
      }

      // Always auto-generate AI outfits (they are not saved to database)
      console.log('🎯 Will auto-generate fresh AI outfits');
    } catch (error) {
      console.error('❌ Error checking for existing outfits:', error);
    }
  }, []);

  const refreshManualOutfits = useCallback(async () => {
    try {
      console.log('🔄 Refreshing manual outfits from database...');

      const hasManualOutfits = await OutfitService.hasManualOutfits();

      setState(prev => ({
        ...prev,
        hasPersistedManualOutfits: hasManualOutfits,
      }));

      if (hasManualOutfits) {
        const manualOutfits = await OutfitService.loadManualOutfits();

        setState(prev => ({
          ...prev,
          manualOutfits: manualOutfits, // Use directly without converting
          isLoadedFromDatabase: true,
        }));

        console.log(
          '✅ Refreshed manual outfits:',
          manualOutfits.length,
          'outfits'
        );
      } else {
        setState(prev => ({
          ...prev,
          manualOutfits: [],
        }));
      }
    } catch (error) {
      console.error('❌ Error refreshing manual outfits:', error);
    }
  }, []);

  const generateRecommendations = useCallback(
    async (options?: Partial<OutfitGenerationOptions>) => {
      if (isGeneratingRef.current) {
        console.log('🔄 Generation already in progress, skipping');
        return [];
      }

      console.log(
        '🎯 Starting outfit generation with',
        filteredItems.length,
        'items'
      );

      if (filteredItems.length < 2) {
        console.warn('⚠️ Not enough items for generation');
        setState(prev => ({
          ...prev,
          error: 'Not enough items in your wardrobe to generate outfits',
        }));
        return [];
      }

      isGeneratingRef.current = true;
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        generationProgress: 0,
      }));

      try {
        setState(prev => ({ ...prev, generationProgress: 0.2 }));

        const mergedOptions: OutfitGenerationOptions = {
          useAllItems: true,
          maxResults: Math.min(
            75,
            Math.max(15, Math.floor(filteredItems.length * 1.5))
          ),
          minScore: 0.45,
          ...initialOptions,
          ...options,
        };

        console.log('🔄 Generating outfits with options:', mergedOptions);

        setState(prev => ({ ...prev, generationProgress: 0.5 }));

        // Generate outfits
        const generatedOutfits = generateOutfits(filteredItems, mergedOptions);

        setState(prev => ({ ...prev, generationProgress: 0.8 }));

        console.log(
          '✅ Generated',
          generatedOutfits.length,
          'outfits with scores:',
          generatedOutfits
            .map(o => Math.round(o.score.total * 100) + '%')
            .slice(0, 10)
        );

        // Only keep in memory, no database save
        console.log(
          '📝 Keeping outfits in memory only (not saving to database)'
        );

        setState(prev => ({
          ...prev,
          outfits: generatedOutfits,
          loading: false,
          generationProgress: 1,
        }));

        console.log('✅ Generation completed successfully');
        console.log('📊 Final outfit count in state:', generatedOutfits.length);
        return generatedOutfits;
      } catch (error) {
        console.error('❌ Generation failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to generate outfit recommendations',
          generationProgress: 0,
        }));
        return [];
      } finally {
        isGeneratingRef.current = false;
      }
    },
    [filteredItems, generateOutfits, initialOptions]
  );

  const clearAndRegenerateOutfits = useCallback(async () => {
    try {
      console.log(
        '🧹 Starting clearAndRegenerateOutfits - current count:',
        state.outfits.length
      );

      // Reset generation flag to prevent race conditions
      isGeneratingRef.current = false;

      setState(prev => ({ ...prev, loading: true, generationProgress: 0.1 }));

      // Simply clear memory and regenerate (no database operations needed)
      setState(prev => ({
        ...prev,
        outfits: [],
        generationProgress: 0.3,
      }));

      console.log('🔄 Outfits cleared, regenerating AI outfits...');
      await generateRecommendations();
    } catch (error) {
      console.error('❌ Error regenerating outfits:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to regenerate outfits',
      }));
    }
  }, [generateRecommendations, state.outfits.length]);

  // Auto-generate AI outfits when screen is ready and items are available
  useEffect(() => {
    const autoGenerateIfNeeded = async () => {
      if (
        screenReady &&
        !hasInitialGeneration.current &&
        filteredItems.length >= 2 &&
        !state.loading &&
        state.outfits.length === 0
      ) {
        console.log(
          '🎯 Auto-generating AI outfits (fresh generation every time)'
        );
        hasInitialGeneration.current = true;
        await generateRecommendations();
      }
    };

    autoGenerateIfNeeded();
  }, [
    screenReady,
    filteredItems.length,
    state.loading,
    state.outfits.length,
    generateRecommendations,
  ]);

  const nextOutfit = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedOutfitIndex:
        (prev.selectedOutfitIndex + 1) % Math.max(1, prev.outfits.length),
    }));
  }, []);

  const previousOutfit = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedOutfitIndex:
        prev.selectedOutfitIndex > 0
          ? prev.selectedOutfitIndex - 1
          : Math.max(0, prev.outfits.length - 1),
    }));
  }, []);

  const saveCurrentOutfit = useCallback(
    (name?: string) => {
      if (
        state.outfits.length === 0 ||
        state.selectedOutfitIndex >= state.outfits.length
      ) {
        return null;
      }

      const selectedOutfit = state.outfits[state.selectedOutfitIndex];

      // Get existing outfit names to prevent duplicates
      const existingOutfitNames = wardrobeState.outfits.map(
        (outfit: Outfit) => outfit.name
      );
      const outfitName =
        name || generateOutfitName(selectedOutfit.items, existingOutfitNames);

      const outfit = createOutfit(selectedOutfit.items, outfitName);
      actions.addOutfit(outfit);

      return outfit.id;
    },
    [
      state.outfits,
      state.selectedOutfitIndex,
      createOutfit,
      actions,
      wardrobeState.outfits,
    ]
  );

  const getWeatherBasedRecommendation = useCallback(
    async (weatherData: WeatherData) => {
      // Determine appropriate season based on temperature
      let weatherSeason: Season;

      if (weatherData.temperature < 10) {
        weatherSeason = Season.WINTER;
      } else if (weatherData.temperature < 18) {
        weatherSeason = Season.FALL;
      } else if (weatherData.temperature < 24) {
        weatherSeason = Season.SPRING;
      } else {
        weatherSeason = Season.SUMMER;
      }

      // Generate weather-based outfits
      return generateRecommendations({
        season: weatherSeason,
        weather: weatherData,
        maxResults: Math.min(30, Math.max(8, filteredItems.length)),
        minScore: 0.4,
      });
    },
    [generateRecommendations, filteredItems.length]
  );

  const getOccasionBasedRecommendation = useCallback(
    async (occasion: Occasion) => {
      // Generate occasion-based outfits
      return generateRecommendations({
        occasion,
        maxResults: Math.min(20, Math.max(6, filteredItems.length)),
        minScore: 0.5,
      });
    },
    [generateRecommendations, filteredItems.length]
  );

  const toggleOutfitFavorite = async (outfitId: string) => {
    try {
      const result = await OutfitService.toggleOutfitFavorite(outfitId);

      if (result.error) {
        Alert.alert('Error', 'Failed to update favorite status');
        return;
      }

      // Only update manual outfits that have persistent IDs
      setState(prev => ({
        ...prev,
        manualOutfits: prev.manualOutfits.map(outfit =>
          outfit.id === outfitId
            ? { ...outfit, isFavorite: result.isFavorite }
            : outfit
        ),
      }));

      return result.isFavorite;
    } catch (error) {
      console.error('Error toggling outfit favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const loadOutfits = useCallback(async () => {
    // Only load manual outfits from database, AI outfits are generated fresh
    try {
      setState(prev => ({ ...prev, loading: true }));
      const manualOutfitsList = await OutfitService.loadManualOutfits();

      setState(prev => ({
        ...prev,
        manualOutfits: manualOutfitsList.map(outfit => ({
          ...outfit,
          isFavorite: outfit.isFavorite || false,
        })),
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading outfits:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const refreshOutfits = useCallback(async () => {
    await loadOutfits();
  }, [loadOutfits]);

  return {
    loading: state.loading,
    error: state.error,
    outfits: state.outfits,
    manualOutfits: state.manualOutfits,
    selectedOutfitIndex: state.selectedOutfitIndex,
    generationProgress: state.generationProgress,
    hasPersistedManualOutfits: state.hasPersistedManualOutfits,
    isLoadedFromDatabase: state.isLoadedFromDatabase,
    generateRecommendations,
    clearAndRegenerateOutfits,
    nextOutfit,
    previousOutfit,
    saveCurrentOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
    checkForExistingOutfits,
    refreshManualOutfits,
    toggleOutfitFavorite,
    loadOutfits,
    refreshOutfits,
  };
};
