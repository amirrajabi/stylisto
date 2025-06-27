import { useCallback } from 'react';
import { useOutfitGenerator, WeatherData } from '../lib/outfitGenerator';
import {
  ClothingCategory,
  ClothingItem,
  Occasion,
  Season,
} from '../types/wardrobe';

export interface OutfitScoreContext {
  occasion?: Occasion;
  season?: Season;
  weather?: WeatherData;
  userPreferences?: string[];
}

export interface DetailedOutfitScore {
  total: number;
  styleHarmony: number;
  colorMatch: number;
  seasonFit: number;
  occasion: number;
  weather?: number;
  userPreference?: number;
  variety?: number;
}

export const useOutfitScoring = () => {
  const { calculateOutfitScore, calculateManualOutfitScore } =
    useOutfitGenerator();

  const calculateDetailedScore = useCallback(
    (
      items: ClothingItem[],
      context?: OutfitScoreContext
    ): DetailedOutfitScore => {
      if (items.length === 0) {
        return {
          total: 0,
          styleHarmony: 0,
          colorMatch: 0,
          seasonFit: 0,
          occasion: 0,
          weather: undefined,
          userPreference: undefined,
          variety: undefined,
        };
      }

      try {
        let scoreResult;

        if (context) {
          scoreResult = calculateManualOutfitScore(items, context);
        } else {
          scoreResult = calculateOutfitScore(items);
        }

        return {
          total: scoreResult.total,
          styleHarmony: scoreResult.breakdown.styleMatching,
          colorMatch: scoreResult.breakdown.colorHarmony,
          seasonFit: scoreResult.breakdown.seasonSuitability,
          occasion: scoreResult.breakdown.occasionSuitability,
          weather: scoreResult.breakdown.weatherSuitability,
          userPreference: scoreResult.breakdown.userPreference,
          variety: scoreResult.breakdown.variety,
        };
      } catch (error) {
        console.warn('Error calculating outfit score:', error);

        return {
          total: 0.75,
          styleHarmony: 0.75,
          colorMatch: 0.75,
          seasonFit: 0.75,
          occasion: 0.75,
          weather: undefined,
          userPreference: undefined,
          variety: undefined,
        };
      }
    },
    [calculateOutfitScore, calculateManualOutfitScore]
  );

  const formatScoreForDatabase = useCallback((score: DetailedOutfitScore) => {
    return {
      total: score.total,
      color: score.colorMatch,
      style: score.styleHarmony,
      season: score.seasonFit,
      occasion: score.occasion,
      weather: score.weather,
      userPreference: score.userPreference,
      variety: score.variety,
    };
  }, []);

  const getScoreDisplay = useCallback((score: number): string => {
    return `${Math.round(score * 100)}%`;
  }, []);

  const getScoreColor = useCallback((score: number): string => {
    if (score >= 0.85) return '#10B981'; // Success
    if (score >= 0.7) return '#F59E0B'; // Warning
    if (score >= 0.5) return '#EF4444'; // Error
    return '#6B7280'; // Neutral
  }, []);

  const analyzeOutfitCompleteness = useCallback(
    (
      items: ClothingItem[]
    ): {
      isComplete: boolean;
      missingCategories: string[];
      suggestions: string[];
    } => {
      const hasTop = items.some(
        item =>
          item.category === ClothingCategory.TOPS ||
          item.category === ClothingCategory.DRESSES
      );
      const hasBottom = items.some(
        item =>
          item.category === ClothingCategory.BOTTOMS ||
          item.category === ClothingCategory.DRESSES
      );
      const hasShoes = items.some(
        item => item.category === ClothingCategory.SHOES
      );

      const missingCategories: string[] = [];
      const suggestions: string[] = [];

      if (
        !hasTop &&
        !items.some(item => item.category === ClothingCategory.DRESSES)
      ) {
        missingCategories.push('Top');
        suggestions.push('Add a shirt, blouse, or sweater');
      }

      if (
        !hasBottom &&
        !items.some(item => item.category === ClothingCategory.DRESSES)
      ) {
        missingCategories.push('Bottom');
        suggestions.push('Add pants, skirt, or shorts');
      }

      if (!hasShoes) {
        missingCategories.push('Shoes');
        suggestions.push('Add appropriate footwear');
      }

      return {
        isComplete: missingCategories.length === 0,
        missingCategories,
        suggestions,
      };
    },
    []
  );

  return {
    calculateDetailedScore,
    formatScoreForDatabase,
    getScoreDisplay,
    getScoreColor,
    analyzeOutfitCompleteness,
  };
};
