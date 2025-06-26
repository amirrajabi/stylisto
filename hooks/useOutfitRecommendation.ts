import { useCallback, useEffect, useState } from 'react';
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
}

export const useOutfitRecommendation = (
  initialOptions?: Partial<OutfitGenerationOptions>
) => {
  const { filteredItems, outfits: savedOutfits, actions } = useWardrobe();
  const { generateOutfits, createOutfit } = useOutfitGenerator();

  const [state, setState] = useState<OutfitRecommendationState>({
    loading: false,
    error: null,
    outfits: [],
    selectedOutfitIndex: 0,
  });

  const generateRecommendations = useCallback(
    async (options?: Partial<OutfitGenerationOptions>) => {
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

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Merge initial options with provided options
        const mergedOptions: OutfitGenerationOptions = {
          ...initialOptions,
          ...options,
        };

        console.log(
          '🔄 useOutfitRecommendation: Generating outfits with options:',
          mergedOptions
        );

        // Generate outfits
        const generatedOutfits = generateOutfits(filteredItems, mergedOptions);

        console.log(
          '✅ useOutfitRecommendation: Generated',
          generatedOutfits.length,
          'outfits'
        );

        setState(prev => ({
          ...prev,
          loading: false,
          outfits: generatedOutfits,
          selectedOutfitIndex: 0,
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
        }));

        return [];
      }
    },
    [filteredItems, initialOptions, generateOutfits]
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
        maxResults: 3,
      });
    },
    [generateRecommendations]
  );

  const getOccasionBasedRecommendation = useCallback(
    async (occasion: Occasion) => {
      // Generate outfits for specific occasion
      return generateRecommendations({
        occasion,
        maxResults: 3,
      });
    },
    [generateRecommendations]
  );

  // Generate initial recommendations on mount
  useEffect(() => {
    console.log(
      '🚀 useOutfitRecommendation: Effect triggered, filteredItems.length:',
      filteredItems.length
    );

    if (filteredItems.length >= 2) {
      console.log(
        '✨ useOutfitRecommendation: Auto-generating initial outfits'
      );
      generateRecommendations();
    } else {
      console.log(
        '⏸️ useOutfitRecommendation: Not enough items for auto-generation'
      );
    }
  }, [filteredItems.length]);

  return {
    ...state,
    generateRecommendations,
    selectOutfit,
    nextOutfit,
    previousOutfit,
    saveCurrentOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
  };
};
