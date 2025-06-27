import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GeneratedOutfit,
  OutfitGenerationOptions,
  useOutfitGenerator,
  WeatherData,
} from '../lib/outfitGenerator';
import { Occasion, Season } from '../types/wardrobe';
import { useWardrobe } from './useWardrobe';

export interface OutfitRecommendationState {
  loading: boolean;
  error: string | null;
  outfits: GeneratedOutfit[];
  selectedOutfitIndex: number;
  generationProgress: number;
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
    selectedOutfitIndex: 0,
    generationProgress: 0,
  });

  const isGeneratingRef = useRef(false);
  const hasInitialGeneration = useRef(false);

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

        // Debug: Log first few outfit details
        if (__DEV__ && generatedOutfits.length > 0) {
          console.log('🔍 Score breakdown for first outfit:');
          const firstOutfit = generatedOutfits[0];
          console.log(
            `  Total: ${(firstOutfit.score.total * 100).toFixed(1)}%`
          );
          console.log(
            `  Color Harmony: ${(firstOutfit.score.breakdown.colorHarmony * 100).toFixed(1)}%`
          );
          console.log(
            `  Style Matching: ${(firstOutfit.score.breakdown.styleMatching * 100).toFixed(1)}%`
          );
          console.log(
            `  Occasion: ${(firstOutfit.score.breakdown.occasionSuitability * 100).toFixed(1)}%`
          );
          console.log(
            `  Season: ${(firstOutfit.score.breakdown.seasonSuitability * 100).toFixed(1)}%`
          );
        }

        // Clear progress updates and finalize

        setState(prev => ({
          ...prev,
          loading: false,
          outfits: generatedOutfits,
          selectedOutfitIndex: 0,
          generationProgress: 1.0,
        }));

        return generatedOutfits;
      } catch (error) {
        console.error(
          '❌ useOutfitRecommendation: Error during generation:',
          error
        );

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to generate outfits';

        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          generationProgress: 0,
        }));

        return [];
      } finally {
        isGeneratingRef.current = false;
      }
    },
    [filteredItems, generateOutfits, initialOptions]
  );

  const selectOutfit = useCallback(
    (index: number) => {
      if (index >= 0 && index < state.outfits.length) {
        setState(prev => ({ ...prev, selectedOutfitIndex: index }));
      }
    },
    [state.outfits]
  );

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
      // Generate outfits for specific occasion
      return generateRecommendations({
        occasion,
        maxResults: Math.min(25, Math.max(6, filteredItems.length)), // Occasion-specific realistic count
        minScore: 0.4, // Slightly lower for occasion-specific outfits
      });
    },
    [generateRecommendations, filteredItems.length]
  );

  const resetAutoGeneration = useCallback(() => {
    hasInitialGeneration.current = false;
  }, []);

  // Generate initial recommendations on mount with delay for screen render
  useEffect(() => {
    console.log(
      '🚀 useOutfitRecommendation: Effect triggered, filteredItems.length:',
      filteredItems.length,
      'screenReady:',
      screenReady
    );

    if (
      screenReady &&
      filteredItems.length >= 2 &&
      state.outfits.length === 0 &&
      !hasInitialGeneration.current &&
      !isGeneratingRef.current
    ) {
      console.log(
        '✨ useOutfitRecommendation: Auto-generating initial outfits with delay'
      );
      hasInitialGeneration.current = true;

      // Delay generation to allow screen to render first
      setTimeout(() => {
        generateRecommendations();
      }, 200); // Slightly longer delay to ensure smooth screen render
    } else {
      console.log(
        '⏸️ useOutfitRecommendation: Not ready for auto-generation:',
        {
          screenReady,
          hasEnoughItems: filteredItems.length >= 2,
          hasNoOutfits: state.outfits.length === 0,
          notAlreadyGenerated: !hasInitialGeneration.current,
          notCurrentlyGenerating: !isGeneratingRef.current,
        }
      );
    }
  }, [
    filteredItems.length,
    state.outfits.length,
    generateRecommendations,
    screenReady,
  ]);

  return {
    ...state,
    generateRecommendations,
    selectOutfit,
    nextOutfit,
    previousOutfit,
    saveCurrentOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
    resetAutoGeneration,
  };
};
