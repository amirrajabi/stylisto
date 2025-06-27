import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GeneratedOutfit,
  OutfitGenerationOptions,
  useOutfitGenerator,
  WeatherData,
} from '../lib/outfitGenerator';
import { GeneratedOutfitRecord, OutfitService } from '../lib/outfitService';
import { Occasion, Season } from '../types/wardrobe';
import { useWardrobe } from './useWardrobe';

export interface OutfitRecommendationState {
  loading: boolean;
  error: string | null;
  outfits: GeneratedOutfit[];
  manualOutfits: GeneratedOutfit[];
  selectedOutfitIndex: number;
  generationProgress: number;
  hasPersistedOutfits: boolean;
  hasPersistedManualOutfits: boolean;
}

export const useOutfitRecommendation = (
  initialOptions?: Partial<OutfitGenerationOptions>,
  screenReady?: boolean
) => {
  const { filteredItems, outfits: savedOutfits, actions } = useWardrobe();
  const { generateOutfits, createOutfit } = useOutfitGenerator();

  const [state, setState] = useState<OutfitRecommendationState>({
    loading: false,
    error: null,
    outfits: [],
    manualOutfits: [],
    selectedOutfitIndex: 0,
    generationProgress: 0,
    hasPersistedOutfits: false,
    hasPersistedManualOutfits: false,
  });

  const isGeneratingRef = useRef(false);
  const hasInitialGeneration = useRef(false);

  // Check for existing generated outfits on load
  useEffect(() => {
    if (screenReady && !hasInitialGeneration.current) {
      checkForExistingOutfits();
    }
  }, [screenReady]);

  const checkForExistingOutfits = useCallback(async () => {
    try {
      console.log('🔍 Checking for existing outfits on app load...');
      const [hasGeneratedOutfits, hasManualOutfits] = await Promise.all([
        OutfitService.hasGeneratedOutfits(),
        OutfitService.hasManualOutfits(),
      ]);

      setState(prev => ({
        ...prev,
        hasPersistedOutfits: hasGeneratedOutfits,
        hasPersistedManualOutfits: hasManualOutfits,
      }));

      const promises = [];

      if (hasGeneratedOutfits) {
        console.log('📥 Found existing generated outfits, loading them...');
        promises.push(OutfitService.loadGeneratedOutfits());
      }

      if (hasManualOutfits) {
        console.log('📥 Found existing manual outfits, loading them...');
        promises.push(OutfitService.loadManualOutfits());
      }

      if (promises.length > 0) {
        const results = await Promise.all(promises);

        const generatedOutfits = hasGeneratedOutfits ? results[0] : [];
        const manualOutfits = hasManualOutfits
          ? hasGeneratedOutfits
            ? results[1]
            : results[0]
          : [];

        const convertedGeneratedOutfits = generatedOutfits.map(
          convertToGeneratedOutfit
        );
        const convertedManualOutfits = manualOutfits.map(
          convertToGeneratedOutfit
        );

        setState(prev => ({
          ...prev,
          outfits: convertedGeneratedOutfits,
          manualOutfits: convertedManualOutfits,
          hasPersistedOutfits: hasGeneratedOutfits,
          hasPersistedManualOutfits: hasManualOutfits,
        }));

        console.log(
          '✅ Loaded',
          convertedGeneratedOutfits.length,
          'generated outfits and',
          convertedManualOutfits.length,
          'manual outfits'
        );
        hasInitialGeneration.current = true; // Mark as loaded to prevent auto-generation
      } else {
        console.log('📭 No existing outfits found, will auto-generate');
      }
    } catch (error) {
      console.error('❌ Error checking for existing outfits:', error);
    }
  }, []);

  const convertToGeneratedOutfit = (
    record: GeneratedOutfitRecord
  ): GeneratedOutfit => ({
    items: record.items,
    score: {
      total: record.score.total,
      breakdown: {
        colorHarmony: record.score.color,
        styleMatching: record.score.style,
        occasionSuitability: record.score.occasion,
        seasonSuitability: record.score.season,
        weatherSuitability: record.score.total * 0.85,
        userPreference: record.score.total * 0.9,
        variety: record.score.total * 0.8,
      },
    },
  });

  const generateRecommendations = useCallback(
    async (options?: Partial<OutfitGenerationOptions>) => {
      if (isGeneratingRef.current) {
        console.log(
          '🔄 useOutfitRecommendation: Generation already in progress, skipping'
        );
        return [];
      }

      console.log(
        '🎯 useOutfitRecommendation: Starting generation with',
        filteredItems.length,
        'items'
      );

      if (filteredItems.length < 2) {
        console.warn(
          '⚠️ useOutfitRecommendation: Not enough items for generation'
        );
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
        // Update progress as we go through steps
        setState(prev => ({
          ...prev,
          generationProgress: 0.1,
        }));

        // Merge initial options with provided options and enable useAllItems by default
        const mergedOptions: OutfitGenerationOptions = {
          useAllItems: true,
          maxResults: Math.min(
            75,
            Math.max(15, Math.floor(filteredItems.length * 1.5))
          ), // More realistic based on item count
          minScore: 0.45, // Lower threshold for more variety in scores
          ...initialOptions,
          ...options,
        };

        console.log(
          '🔄 useOutfitRecommendation: Generating outfits with options:',
          mergedOptions
        );
        console.log(
          '🌟 useAllItems enabled - ensuring ALL wardrobe items are utilized'
        );

        setState(prev => ({
          ...prev,
          generationProgress: 0.3,
        }));

        // Generate outfits
        const generatedOutfits = generateOutfits(filteredItems, mergedOptions);

        setState(prev => ({
          ...prev,
          generationProgress: 0.7,
        }));

        console.log(
          '✅ useOutfitRecommendation: Generated',
          generatedOutfits.length,
          'outfits with scores:',
          generatedOutfits
            .map(o => Math.round(o.score.total * 100) + '%')
            .slice(0, 10)
        );

        // Save generated outfits to database
        setState(prev => ({
          ...prev,
          generationProgress: 0.9,
        }));

        await OutfitService.saveGeneratedOutfits(generatedOutfits);

        setState(prev => ({
          ...prev,
          outfits: generatedOutfits,
          loading: false,
          generationProgress: 1,
          hasPersistedOutfits: true,
        }));

        return generatedOutfits;
      } catch (error) {
        console.error('❌ useOutfitRecommendation: Generation failed:', error);
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
      setState(prev => ({ ...prev, loading: true, generationProgress: 0.1 }));

      await OutfitService.clearGeneratedOutfits();

      setState(prev => ({
        ...prev,
        outfits: [],
        hasPersistedOutfits: false,
        generationProgress: 0.3,
      }));

      await generateRecommendations();
    } catch (error) {
      console.error('❌ Error clearing and regenerating outfits:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to clear and regenerate outfits',
      }));
    }
  }, [generateRecommendations]);

  // Auto-generate outfits if none exist and conditions are met
  const autoGenerateIfNeeded = useCallback(async () => {
    if (
      screenReady &&
      !hasInitialGeneration.current &&
      filteredItems.length >= 2 &&
      !state.hasPersistedOutfits &&
      !state.loading &&
      state.outfits.length === 0
    ) {
      console.log('🎯 Auto-generating outfits - no persisted outfits found');
      hasInitialGeneration.current = true;
      await generateRecommendations();
    }
  }, [
    screenReady,
    filteredItems.length,
    state.hasPersistedOutfits,
    state.loading,
    state.outfits.length,
    generateRecommendations,
  ]);

  // Only auto-generate if no persisted outfits exist and we haven't generated yet
  useEffect(() => {
    autoGenerateIfNeeded();
  }, [autoGenerateIfNeeded]);

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
      const outfitName =
        name || `Generated Outfit ${new Date().toLocaleDateString()}`;

      const outfit = createOutfit(selectedOutfit.items, outfitName);
      actions.addOutfit(outfit);

      return outfit.id;
    },
    [state.outfits, state.selectedOutfitIndex, createOutfit, actions]
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

      // Generate outfits with weather data
      return generateRecommendations({
        season: weatherSeason,
        weather: weatherData,
        maxResults: Math.min(30, Math.max(8, filteredItems.length)), // Weather-appropriate realistic count
        minScore: 0.4, // Slightly lower for weather-specific outfits
      });
    },
    [generateRecommendations, filteredItems.length]
  );

  const getOccasionBasedRecommendation = useCallback(
    async (occasion: Occasion) => {
      return generateRecommendations({
        occasion,
        maxResults: Math.min(20, Math.max(6, filteredItems.length)), // Occasion-specific count
        minScore: 0.5, // Higher threshold for occasion-specific outfits
      });
    },
    [generateRecommendations, filteredItems.length]
  );

  return {
    loading: state.loading,
    error: state.error,
    outfits: state.outfits,
    manualOutfits: state.manualOutfits,
    selectedOutfitIndex: state.selectedOutfitIndex,
    generationProgress: state.generationProgress,
    hasPersistedOutfits: state.hasPersistedOutfits,
    hasPersistedManualOutfits: state.hasPersistedManualOutfits,
    generateRecommendations,
    clearAndRegenerateOutfits,
    nextOutfit,
    previousOutfit,
    saveCurrentOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
  };
};
