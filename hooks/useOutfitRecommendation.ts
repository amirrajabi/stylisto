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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  aiGeneratedOutfits: GeneratedOutfitRecord[];
  selectedOutfitIndex: number;
  generationProgress: number;
  hasPersistedManualOutfits: boolean;
  hasPersistedAIOutfits: boolean;
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
    aiGeneratedOutfits: [],
    selectedOutfitIndex: 0,
    generationProgress: 0,
    hasPersistedManualOutfits: false,
    hasPersistedAIOutfits: false,
    isLoadedFromDatabase: false,
  });

  // Filter out items that are already liked in favorite outfits (both manual and AI-generated)
  const availableItemsForGeneration = useMemo(() => {
    // Get all item IDs that are in favorite outfits (both manual and AI-generated)
    const favoriteItemIds = new Set<string>();

    // Add items from favorite manual outfits
    state.manualOutfits.forEach(outfit => {
      if (outfit.isFavorite) {
        outfit.items.forEach(item => {
          favoriteItemIds.add(item.id);
        });
      }
    });

    // Add items from favorite AI-generated outfits
    state.aiGeneratedOutfits.forEach(outfit => {
      if (outfit.isFavorite) {
        outfit.items.forEach(item => {
          favoriteItemIds.add(item.id);
        });
      }
    });

    // Filter out favorite items from the available items
    const filteredForGeneration = filteredItems.filter(
      item => !favoriteItemIds.has(item.id)
    );

    console.log(
      `🎯 Filtered out ${favoriteItemIds.size} favorite items from ${filteredItems.length} total items`
    );
    console.log(
      `📊 Available items for generation: ${filteredForGeneration.length}`
    );

    return filteredForGeneration;
  }, [filteredItems, state.manualOutfits, state.aiGeneratedOutfits]);

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
      console.log('🔍 Checking for existing outfits for current user...');

      // Check for both manual and AI-generated outfits
      const [hasManualOutfits, hasAIOutfits] = await Promise.all([
        OutfitService.hasManualOutfits(),
        OutfitService.hasAIGeneratedOutfits(),
      ]);

      console.log(
        `📊 User outfits status: Manual=${hasManualOutfits}, AI=${hasAIOutfits}`
      );

      setState(prev => ({
        ...prev,
        hasPersistedManualOutfits: hasManualOutfits,
        hasPersistedAIOutfits: hasAIOutfits,
      }));

      // Load existing outfits in parallel
      const loadPromises = [];
      if (hasManualOutfits) {
        loadPromises.push(OutfitService.loadManualOutfits());
      }
      if (hasAIOutfits) {
        loadPromises.push(OutfitService.loadAIGeneratedOutfits());
      }

      if (loadPromises.length > 0) {
        console.log('📥 Loading existing outfits from database...');

        const results = await Promise.all(loadPromises);
        let manualOutfits: any[] = [];
        let aiGeneratedOutfits: any[] = [];

        if (hasManualOutfits && hasAIOutfits) {
          [manualOutfits, aiGeneratedOutfits] = results;
        } else if (hasManualOutfits) {
          [manualOutfits] = results;
        } else if (hasAIOutfits) {
          [aiGeneratedOutfits] = results;
        }

        setState(prev => ({
          ...prev,
          manualOutfits: manualOutfits || [],
          aiGeneratedOutfits: aiGeneratedOutfits || [],
          isLoadedFromDatabase: true,
        }));

        console.log(
          '✅ Loaded from database:',
          manualOutfits.length,
          'manual outfits,',
          aiGeneratedOutfits.length,
          'AI-generated outfits'
        );
      }

      // Auto-generate fresh AI outfits if needed (in addition to existing ones)
      console.log('🎯 Will auto-generate fresh AI outfits if needed');
    } catch (error) {
      console.error('❌ Error checking for existing outfits:', error);
    }
  }, []);

  const refreshOutfits = useCallback(async () => {
    try {
      console.log('🔄 Refreshing outfits from database...');

      const [hasManualOutfits, hasAIOutfits] = await Promise.all([
        OutfitService.hasManualOutfits(),
        OutfitService.hasAIGeneratedOutfits(),
      ]);

      setState(prev => ({
        ...prev,
        hasPersistedManualOutfits: hasManualOutfits,
        hasPersistedAIOutfits: hasAIOutfits,
      }));

      // Load existing outfits in parallel
      const loadPromises = [];
      if (hasManualOutfits) {
        loadPromises.push(OutfitService.loadManualOutfits());
      }
      if (hasAIOutfits) {
        loadPromises.push(OutfitService.loadAIGeneratedOutfits());
      }

      if (loadPromises.length > 0) {
        const results = await Promise.all(loadPromises);
        let manualOutfits: any[] = [];
        let aiGeneratedOutfits: any[] = [];

        if (hasManualOutfits && hasAIOutfits) {
          [manualOutfits, aiGeneratedOutfits] = results;
        } else if (hasManualOutfits) {
          [manualOutfits] = results;
          aiGeneratedOutfits = [];
        } else if (hasAIOutfits) {
          manualOutfits = [];
          [aiGeneratedOutfits] = results;
        }

        setState(prev => ({
          ...prev,
          manualOutfits: manualOutfits,
          aiGeneratedOutfits: aiGeneratedOutfits,
          isLoadedFromDatabase: true,
        }));

        console.log(
          '✅ Refreshed outfits:',
          manualOutfits.length,
          'manual outfits,',
          aiGeneratedOutfits.length,
          'AI-generated outfits'
        );
      } else {
        setState(prev => ({
          ...prev,
          manualOutfits: [],
          aiGeneratedOutfits: [],
        }));
      }
    } catch (error) {
      console.error('❌ Error refreshing outfits:', error);
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
        availableItemsForGeneration.length,
        'items (filtered out favorite items from manual and AI outfits)'
      );

      if (availableItemsForGeneration.length < 2) {
        console.warn(
          '⚠️ Not enough items for generation after filtering favorite items'
        );
        setState(prev => ({
          ...prev,
          error:
            'Not enough items available for outfit generation (excluding favorite items from manual and AI outfits)',
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
            Math.max(15, Math.floor(availableItemsForGeneration.length * 1.5))
          ),
          minScore: 0.45,
          ...initialOptions,
          ...options,
        };

        console.log('🔄 Generating outfits with options:', mergedOptions);

        setState(prev => ({ ...prev, generationProgress: 0.5 }));

        // Generate outfits using filtered items (excluding favorite items from manual and AI outfits)
        const generatedOutfits = generateOutfits(
          availableItemsForGeneration,
          mergedOptions
        );

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
    [availableItemsForGeneration, generateOutfits, initialOptions]
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
        availableItemsForGeneration.length >= 2 &&
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
    availableItemsForGeneration.length,
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
        maxResults: Math.min(
          30,
          Math.max(8, availableItemsForGeneration.length)
        ),
        minScore: 0.4,
      });
    },
    [generateRecommendations, availableItemsForGeneration.length]
  );

  const getOccasionBasedRecommendation = useCallback(
    async (occasion: Occasion) => {
      // Generate occasion-based outfits
      return generateRecommendations({
        occasion,
        maxResults: Math.min(
          20,
          Math.max(6, availableItemsForGeneration.length)
        ),
        minScore: 0.5,
      });
    },
    [generateRecommendations, availableItemsForGeneration.length]
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

      console.log(
        `🎯 Manual outfit ${outfitId} favorite status changed to: ${result.isFavorite}`
      );
      console.log(
        '🔄 Regenerating AI outfit recommendations due to liked items change...'
      );

      // Regenerate AI outfit recommendations since available items for generation have changed
      // We need to delay this slightly to allow the state update to propagate
      setTimeout(() => {
        clearAndRegenerateOutfits();
      }, 100);

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

  // Add method to remove AI-generated outfit from memory when favorited
  const removeOutfitFromMemory = useCallback(
    (outfitIndex: number) => {
      setState(prev => {
        const newOutfits = prev.outfits.filter(
          (_, index) => index !== outfitIndex
        );
        let newSelectedIndex = prev.selectedOutfitIndex;

        // Adjust selected index if needed
        if (outfitIndex < prev.selectedOutfitIndex) {
          newSelectedIndex = Math.max(0, prev.selectedOutfitIndex - 1);
        } else if (outfitIndex === prev.selectedOutfitIndex) {
          newSelectedIndex = Math.min(
            prev.selectedOutfitIndex,
            newOutfits.length - 1
          );
        }

        // Ensure index is within bounds
        newSelectedIndex = Math.max(
          0,
          Math.min(newSelectedIndex, newOutfits.length - 1)
        );

        return {
          ...prev,
          outfits: newOutfits,
          selectedOutfitIndex: newOutfits.length > 0 ? newSelectedIndex : 0,
        };
      });

      console.log(
        `🗑️ Removed AI-generated outfit at index ${outfitIndex} from memory`
      );

      // If no more AI outfits remain and we have enough items, generate new ones
      setTimeout(() => {
        setState(current => {
          if (
            current.outfits.length === 0 &&
            availableItemsForGeneration.length >= 2
          ) {
            console.log('📦 No AI outfits remaining, generating new ones...');
            generateRecommendations();
          }
          return current;
        });
      }, 100);
    },
    [availableItemsForGeneration.length, generateRecommendations]
  );

  // Add method to refresh all outfits (for when unfavoriting)
  const refreshAllOutfits = useCallback(async () => {
    console.log('🔄 Refreshing all outfits after unfavorite...');
    await refreshOutfits();
    // AI outfits are already in memory, no need to regenerate unless empty
    if (state.outfits.length === 0) {
      await generateRecommendations();
    }
  }, [state.outfits.length]);

  return {
    loading: state.loading,
    error: state.error,
    outfits: state.outfits,
    manualOutfits: state.manualOutfits,
    aiGeneratedOutfits: state.aiGeneratedOutfits,
    selectedOutfitIndex: state.selectedOutfitIndex,
    generationProgress: state.generationProgress,
    hasPersistedManualOutfits: state.hasPersistedManualOutfits,
    hasPersistedAIOutfits: state.hasPersistedAIOutfits,
    isLoadedFromDatabase: state.isLoadedFromDatabase,
    generateRecommendations,
    clearAndRegenerateOutfits,
    nextOutfit,
    previousOutfit,
    saveCurrentOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
    checkForExistingOutfits,
    refreshOutfits,
    toggleOutfitFavorite,
    loadOutfits,
    removeOutfitFromMemory,
    refreshAllOutfits,
  };
};
