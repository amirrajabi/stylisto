import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  ClothingCategory,
  ClothingItem,
  Occasion,
  Outfit,
  Season,
} from '../types/wardrobe';

// Types for outfit generation
export interface OutfitGenerationOptions {
  occasion?: Occasion | null;
  season?: Season | null;
  weather?: WeatherData | null;
  preferredColors?: string[];
  excludedItems?: string[];
  stylePreference?: StylePreference;
  forceIncludeItems?: string[];
  maxResults?: number;
  minScore?: number;
}

export interface WeatherData {
  temperature: number; // in Celsius
  conditions: 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  precipitation: number; // probability 0-1
  humidity: number; // 0-1
  windSpeed: number; // in km/h
}

export interface StylePreference {
  formality: number; // 0-1 (casual to formal)
  boldness: number; // 0-1 (conservative to bold)
  layering: number; // 0-1 (minimal to maximal)
  colorfulness: number; // 0-1 (monochrome to colorful)
}

export interface OutfitScore {
  total: number;
  breakdown: {
    colorHarmony: number;
    styleMatching: number;
    occasionSuitability: number;
    seasonSuitability: number;
    weatherSuitability: number;
    userPreference: number;
    variety: number;
  };
}

export interface GeneratedOutfit {
  items: ClothingItem[];
  score: OutfitScore;
}

// Color harmony constants
const COLOR_HARMONY = {
  MONOCHROMATIC: 'monochromatic',
  ANALOGOUS: 'analogous',
  COMPLEMENTARY: 'complementary',
  TRIADIC: 'triadic',
  NEUTRAL: 'neutral',
};

// Temperature ranges for weather-based recommendations
const TEMPERATURE_RANGES = {
  VERY_COLD: { min: -Infinity, max: 0 },
  COLD: { min: 0, max: 10 },
  COOL: { min: 10, max: 18 },
  MILD: { min: 18, max: 24 },
  WARM: { min: 24, max: 30 },
  HOT: { min: 30, max: Infinity },
};

// Weights for different scoring components
const SCORE_WEIGHTS = {
  colorHarmony: 0.2,
  styleMatching: 0.2,
  occasionSuitability: 0.2,
  seasonSuitability: 0.15,
  weatherSuitability: 0.15,
  userPreference: 0.05,
  variety: 0.05,
};

class OutfitGenerator {
  private static instance: OutfitGenerator;
  private recentlyGeneratedOutfits: Map<string, Date> = new Map();
  private readonly RECENT_OUTFITS_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  static getInstance(): OutfitGenerator {
    if (!OutfitGenerator.instance) {
      OutfitGenerator.instance = new OutfitGenerator();
    }
    return OutfitGenerator.instance;
  }

  /**
   * Generate outfit recommendations based on provided options
   */
  generateOutfits(
    items: ClothingItem[],
    options: OutfitGenerationOptions = {}
  ): GeneratedOutfit[] {
    const startTime = performance.now();

    // Apply default options
    const defaultOptions: OutfitGenerationOptions = {
      maxResults: 5,
      minScore: 0.4,
      stylePreference: {
        formality: 0.5,
        boldness: 0.5,
        layering: 0.5,
        colorfulness: 0.5,
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Filter available items based on options
    let availableItems = [...items];

    // Filter out excluded items
    if (mergedOptions.excludedItems?.length) {
      availableItems = availableItems.filter(
        item => !mergedOptions.excludedItems?.includes(item.id)
      );
    }

    // Filter by season if specified
    if (mergedOptions.season) {
      availableItems = availableItems.filter(item =>
        item.season.includes(mergedOptions.season as Season)
      );
    }

    // Filter by occasion if specified
    if (mergedOptions.occasion) {
      availableItems = availableItems.filter(item =>
        item.occasion.includes(mergedOptions.occasion as Occasion)
      );
    }

    // Filter by weather if specified
    if (mergedOptions.weather) {
      availableItems = this.filterItemsByWeather(
        availableItems,
        mergedOptions.weather
      );
    }

    // Ensure we have enough items to generate outfits
    if (availableItems.length < 2) {
      console.warn('Not enough items available to generate outfits');
      return [];
    }

    // Generate all possible outfit combinations
    const outfitCombinations = this.generateOutfitCombinations(
      availableItems,
      mergedOptions.forceIncludeItems || []
    );

    // Score each outfit
    const scoredOutfits = outfitCombinations.map(items => ({
      items,
      score: this.scoreOutfit(items, mergedOptions),
    }));

    console.log(`🎯 Scored ${scoredOutfits.length} outfit combinations`);
    console.log(`📊 MinScore required: ${mergedOptions.minScore}`);

    if (scoredOutfits.length > 0) {
      const scores = scoredOutfits.map(o => o.score.total);
      console.log(
        `📈 Score range: ${Math.min(...scores).toFixed(2)} - ${Math.max(...scores).toFixed(2)}`
      );
    }

    // Filter outfits by minimum score
    const qualifyingOutfits = scoredOutfits.filter(
      outfit => outfit.score.total >= mergedOptions.minScore!
    );

    console.log(
      `✅ ${qualifyingOutfits.length} outfits qualify (score >= ${mergedOptions.minScore})`
    );

    // Sort by score (descending)
    qualifyingOutfits.sort((a, b) => b.score.total - a.score.total);

    // Apply variety filter to avoid similar outfits
    const diverseOutfits = this.ensureOutfitVariety(qualifyingOutfits);

    console.log(
      `🎨 ${diverseOutfits.length} diverse outfits after variety filter`
    );

    // Limit to requested number of results
    const results = diverseOutfits.slice(0, mergedOptions.maxResults);

    console.log(
      `🏆 Final results: ${results.length} outfits (max: ${mergedOptions.maxResults})`
    );

    // Record generated outfits to avoid repetition in future
    results.forEach(outfit => {
      const outfitKey = this.getOutfitKey(outfit.items);
      this.recentlyGeneratedOutfits.set(outfitKey, new Date());
    });

    // Clean up expired entries in recently generated outfits
    this.cleanupRecentOutfits();

    const endTime = performance.now();
    console.log(`Outfit generation completed in ${endTime - startTime}ms`);

    return results;
  }

  /**
   * Generate all valid outfit combinations from available items
   */
  private generateOutfitCombinations(
    items: ClothingItem[],
    forceIncludeItems: string[] = []
  ): ClothingItem[][] {
    console.log(
      '🔧 generateOutfitCombinations: Starting with',
      items.length,
      'items'
    );

    // Group items by category
    const itemsByCategory = this.groupItemsByCategory(items);

    console.log(
      '📋 Items by category:',
      Object.keys(itemsByCategory).map(
        cat => `${cat}: ${itemsByCategory[cat as ClothingCategory].length}`
      )
    );

    // Get items that must be included
    const forcedItems = items.filter(item =>
      forceIncludeItems.includes(item.id)
    );
    const forcedCategories = new Set(forcedItems.map(item => item.category));

    // Define required categories for a valid outfit
    const requiredCategories = new Set<ClothingCategory>([
      ClothingCategory.TOPS,
      ClothingCategory.BOTTOMS,
    ]);

    console.log('🎯 Required categories:', Array.from(requiredCategories));

    // If we have a dress, we don't need both top and bottom
    if (itemsByCategory[ClothingCategory.DRESSES]?.length > 0) {
      requiredCategories.delete(ClothingCategory.TOPS);
      requiredCategories.delete(ClothingCategory.BOTTOMS);
      requiredCategories.add(ClothingCategory.DRESSES);
      console.log('👗 Dresses available, switching to dress-based outfits');
    }

    // Optional categories that enhance outfits
    const optionalCategories = [
      ClothingCategory.SHOES,
      ClothingCategory.ACCESSORIES,
      ClothingCategory.OUTERWEAR,
    ];

    // Start with forced items
    const baseOutfit = [...forcedItems];

    // Add required categories that aren't already forced
    for (const category of requiredCategories) {
      if (!forcedCategories.has(category)) {
        const categoryItems = itemsByCategory[category] || [];
        console.log(
          `🔍 Checking category ${category}: ${categoryItems.length} items available`
        );

        if (categoryItems.length === 0) {
          // If a required category has no items, we can't create a valid outfit
          if (category === ClothingCategory.DRESSES) {
            // If no dresses, we need tops and bottoms instead
            console.log(
              '❌ No dresses available, switching back to tops + bottoms'
            );
            requiredCategories.delete(ClothingCategory.DRESSES);
            requiredCategories.add(ClothingCategory.TOPS);
            requiredCategories.add(ClothingCategory.BOTTOMS);
          } else {
            // If we can't satisfy required categories, return empty array
            console.warn(
              `❌ Required category ${category} has no items. Cannot create outfits.`
            );
            return [];
          }
        }
      }
    }

    // Generate combinations
    const outfits: ClothingItem[][] = [];

    // Helper function to recursively build outfits
    const buildOutfit = (
      currentOutfit: ClothingItem[],
      remainingRequired: Set<ClothingCategory>,
      depth: number = 0
    ) => {
      // Check if we've reached the maximum recursion depth
      if (depth > 10) {
        console.warn('🛑 Max recursion depth reached');
        return;
      }

      // If we've satisfied all required categories
      if (remainingRequired.size === 0) {
        // Add optional categories
        const outfitWithOptionals = this.addOptionalCategories(
          currentOutfit,
          optionalCategories,
          itemsByCategory,
          forcedCategories
        );

        // Check if this is a new outfit
        const outfitKey = this.getOutfitKey(outfitWithOptionals);
        if (!outfits.some(outfit => this.getOutfitKey(outfit) === outfitKey)) {
          outfits.push(outfitWithOptionals);
        }

        return;
      }

      // Get next required category
      const nextCategory = Array.from(remainingRequired)[0];
      const categoryItems = itemsByCategory[nextCategory] || [];

      // If this category is already in the forced items, skip it
      if (forcedCategories.has(nextCategory)) {
        const newRemaining = new Set(remainingRequired);
        newRemaining.delete(nextCategory);
        buildOutfit(currentOutfit, newRemaining, depth + 1);
        return;
      }

      // Try each item in this category
      for (const item of categoryItems) {
        // Skip if this item is incompatible with current outfit
        const isCompatible = this.isItemCompatible(item, currentOutfit);

        if (!isCompatible) {
          continue;
        }

        // Add item to outfit
        const newOutfit = [...currentOutfit, item];
        const newRemaining = new Set(remainingRequired);
        newRemaining.delete(nextCategory);

        buildOutfit(newOutfit, newRemaining, depth + 1);

        // Limit number of outfits to prevent excessive computation
        if (outfits.length >= 1000) {
          console.log('🛑 Maximum outfit limit reached');
          return;
        }
      }
    };

    console.log('🚀 Starting outfit building process...');
    // Start building outfits
    buildOutfit(baseOutfit, requiredCategories);

    console.log(`🏁 Final result: ${outfits.length} outfits generated`);
    return outfits;
  }

  /**
   * Add optional categories to an outfit
   */
  private addOptionalCategories(
    outfit: ClothingItem[],
    optionalCategories: ClothingCategory[],
    itemsByCategory: Record<ClothingCategory, ClothingItem[]>,
    forcedCategories: Set<ClothingCategory>
  ): ClothingItem[] {
    let result = [...outfit];

    // Add one item from each optional category if compatible
    for (const category of optionalCategories) {
      // Skip if this category is already in the forced items
      if (forcedCategories.has(category)) continue;

      // Skip if outfit already has this category
      if (result.some(item => item.category === category)) continue;

      const categoryItems = itemsByCategory[category] || [];

      // Find the most compatible item from this category
      let bestItem: ClothingItem | null = null;
      let bestScore = -1;

      for (const item of categoryItems) {
        if (this.isItemCompatible(item, result)) {
          const score = this.calculateItemCompatibilityScore(item, result);
          if (score > bestScore) {
            bestScore = score;
            bestItem = item;
          }
        }
      }

      // Add the best item if found and score is good enough
      if (bestItem && bestScore > 0.3) {
        result.push(bestItem);
      }
    }

    return result;
  }

  /**
   * Check if an item is compatible with the current outfit
   */
  private isItemCompatible(
    item: ClothingItem,
    outfit: ClothingItem[]
  ): boolean {
    // Can't have multiple items from the same category (except accessories)
    if (item.category !== ClothingCategory.ACCESSORIES) {
      const hasConflictingCategory = outfit.some(
        outfitItem => outfitItem.category === item.category
      );
      if (hasConflictingCategory) {
        return false;
      }
    }

    // For simplicity, let's be more permissive with compatibility
    // Most items should be compatible unless there's a major conflict

    return true;
  }

  /**
   * Calculate how well an item matches with the current outfit
   */
  private calculateItemCompatibilityScore(
    item: ClothingItem,
    outfit: ClothingItem[]
  ): number {
    if (outfit.length === 0) return 1;

    let totalScore = 0;

    // Color harmony score
    const colorScore = this.calculateColorHarmonyScore([...outfit, item]);
    totalScore += colorScore * 0.4;

    // Season overlap score
    const outfitSeasons = new Set(outfit.flatMap(item => item.season));
    const seasonOverlap = item.season.filter(season =>
      outfitSeasons.has(season)
    ).length;
    const seasonScore =
      outfitSeasons.size > 0 ? seasonOverlap / outfitSeasons.size : 1;
    totalScore += seasonScore * 0.3;

    // Occasion overlap score
    const outfitOccasions = new Set(outfit.flatMap(item => item.occasion));
    const occasionOverlap = item.occasion.filter(occasion =>
      outfitOccasions.has(occasion)
    ).length;
    const occasionScore =
      outfitOccasions.size > 0 ? occasionOverlap / outfitOccasions.size : 1;
    totalScore += occasionScore * 0.3;

    return totalScore;
  }

  /**
   * Score an outfit based on various factors
   */
  private scoreOutfit(
    items: ClothingItem[],
    options: OutfitGenerationOptions
  ): OutfitScore {
    // Initialize score components
    const scoreBreakdown = {
      colorHarmony: this.calculateColorHarmonyScore(items),
      styleMatching: this.calculateStyleMatchingScore(
        items,
        options.stylePreference
      ),
      occasionSuitability: this.calculateOccasionSuitabilityScore(
        items,
        options.occasion
      ),
      seasonSuitability: this.calculateSeasonSuitabilityScore(
        items,
        options.season
      ),
      weatherSuitability: options.weather
        ? this.calculateWeatherSuitabilityScore(items, options.weather)
        : 1,
      userPreference: this.calculateUserPreferenceScore(
        items,
        options.preferredColors
      ),
      variety: this.calculateVarietyScore(items),
    };

    // Calculate weighted total score
    const totalScore = Object.entries(scoreBreakdown).reduce(
      (total, [key, score]) =>
        total + score * SCORE_WEIGHTS[key as keyof typeof SCORE_WEIGHTS],
      0
    );

    // Penalize recently generated similar outfits
    const outfitKey = this.getOutfitKey(items);
    if (this.recentlyGeneratedOutfits.has(outfitKey)) {
      const daysSinceLastGenerated =
        (Date.now() - this.recentlyGeneratedOutfits.get(outfitKey)!.getTime()) /
        (24 * 60 * 60 * 1000);

      // Apply penalty that decreases over time
      const recencyPenalty = Math.max(
        0,
        0.5 * (1 - daysSinceLastGenerated / 7)
      );
      return {
        total: totalScore * (1 - recencyPenalty),
        breakdown: scoreBreakdown,
      };
    }

    return {
      total: totalScore,
      breakdown: scoreBreakdown,
    };
  }

  /**
   * Calculate color harmony score for an outfit
   */
  private calculateColorHarmonyScore(items: ClothingItem[]): number {
    if (items.length <= 1) return 1;

    // Extract colors from items
    const colors = items.map(item => item.color);

    // Convert hex colors to HSL for better color harmony analysis
    const hslColors = colors.map(this.hexToHSL);

    // Determine color harmony type
    const harmonyType = this.determineColorHarmony(hslColors);

    // Score based on harmony type
    switch (harmonyType) {
      case COLOR_HARMONY.MONOCHROMATIC:
        return 0.95;
      case COLOR_HARMONY.ANALOGOUS:
        return 0.9;
      case COLOR_HARMONY.COMPLEMENTARY:
        return 0.85;
      case COLOR_HARMONY.TRIADIC:
        return 0.8;
      case COLOR_HARMONY.NEUTRAL:
        return 0.75;
      default:
        // Calculate a score based on color distance
        return this.calculateColorDistanceScore(hslColors);
    }
  }

  /**
   * Determine the type of color harmony in an outfit
   */
  private determineColorHarmony(
    hslColors: { h: number; s: number; l: number }[]
  ): string {
    // Check for neutral colors (low saturation)
    const neutralColors = hslColors.filter(color => color.s < 0.15);
    if (neutralColors.length === hslColors.length) {
      return COLOR_HARMONY.NEUTRAL;
    }

    // If most colors are neutral, focus on the non-neutral ones
    if (neutralColors.length >= hslColors.length - 1 && hslColors.length > 2) {
      const nonNeutrals = hslColors.filter(color => color.s >= 0.15);
      if (nonNeutrals.length > 0) {
        return this.determineColorHarmony(nonNeutrals);
      }
    }

    // Check for monochromatic (same hue, different saturation/lightness)
    const hues = hslColors.map(color => color.h);
    const hueRange = Math.max(...hues) - Math.min(...hues);
    if (hueRange <= 15 || hueRange >= 345) {
      return COLOR_HARMONY.MONOCHROMATIC;
    }

    // Check for analogous (adjacent on color wheel)
    if (hueRange <= 60 || hueRange >= 300) {
      return COLOR_HARMONY.ANALOGOUS;
    }

    // Check for complementary (opposite on color wheel)
    if (hslColors.length === 2) {
      const hueDiff = Math.abs(hues[0] - hues[1]);
      if (Math.abs(hueDiff - 180) <= 30) {
        return COLOR_HARMONY.COMPLEMENTARY;
      }
    }

    // Check for triadic (three colors evenly spaced)
    if (hslColors.length === 3) {
      const sortedHues = [...hues].sort((a, b) => a - b);
      const diff1 = sortedHues[1] - sortedHues[0];
      const diff2 = sortedHues[2] - sortedHues[1];
      if (Math.abs(diff1 - 120) <= 30 && Math.abs(diff2 - 120) <= 30) {
        return COLOR_HARMONY.TRIADIC;
      }
    }

    // Default: calculate based on color distances
    return 'custom';
  }

  /**
   * Calculate a score based on color distances
   */
  private calculateColorDistanceScore(
    hslColors: { h: number; s: number; l: number }[]
  ): number {
    if (hslColors.length <= 1) return 1;

    let totalDistance = 0;
    let pairs = 0;

    // Calculate distance between each pair of colors
    for (let i = 0; i < hslColors.length; i++) {
      for (let j = i + 1; j < hslColors.length; j++) {
        totalDistance += this.calculateColorDistance(
          hslColors[i],
          hslColors[j]
        );
        pairs++;
      }
    }

    const avgDistance = totalDistance / pairs;

    // Score based on average distance
    // Too close: not enough contrast
    // Too far: clashing colors
    // Ideal: moderate distance for good contrast without clashing

    // Normalize to 0-1 range (0.3-0.7 is ideal range)
    const normalizedDistance = Math.min(1, avgDistance / 150);

    // Score peaks at 0.5 and decreases toward 0 and 1
    return 1 - Math.abs(normalizedDistance - 0.5) * 2;
  }

  /**
   * Calculate distance between two HSL colors
   */
  private calculateColorDistance(
    color1: { h: number; s: number; l: number },
    color2: { h: number; s: number; l: number }
  ): number {
    // Calculate hue distance (considering the circular nature of hue)
    const hueDiff = Math.min(
      Math.abs(color1.h - color2.h),
      360 - Math.abs(color1.h - color2.h)
    );

    // Calculate saturation and lightness differences
    const satDiff = Math.abs(color1.s - color2.s);
    const lightDiff = Math.abs(color1.l - color2.l);

    // Weight hue more heavily than saturation and lightness
    return hueDiff * 0.6 + satDiff * 0.2 + lightDiff * 0.2;
  }

  /**
   * Calculate style matching score
   */
  private calculateStyleMatchingScore(
    items: ClothingItem[],
    stylePreference?: StylePreference
  ): number {
    if (!stylePreference) return 1;

    // Default style values for each category
    const categoryStyleValues: Record<
      ClothingCategory,
      Partial<StylePreference>
    > = {
      [ClothingCategory.TOPS]: { formality: 0.5, boldness: 0.5 },
      [ClothingCategory.BOTTOMS]: { formality: 0.5, boldness: 0.4 },
      [ClothingCategory.DRESSES]: { formality: 0.7, boldness: 0.6 },
      [ClothingCategory.OUTERWEAR]: { formality: 0.6, boldness: 0.5 },
      [ClothingCategory.SHOES]: { formality: 0.5, boldness: 0.4 },
      [ClothingCategory.ACCESSORIES]: { formality: 0.5, boldness: 0.7 },
      [ClothingCategory.UNDERWEAR]: { formality: 0.3, boldness: 0.5 },
      [ClothingCategory.ACTIVEWEAR]: { formality: 0.2, boldness: 0.6 },
      [ClothingCategory.SLEEPWEAR]: { formality: 0.1, boldness: 0.4 },
      [ClothingCategory.SWIMWEAR]: { formality: 0.3, boldness: 0.7 },
    };

    // Estimate style values for each item based on tags, category, and occasions
    const itemStyleValues = items.map(item => {
      const baseStyle = categoryStyleValues[item.category] || {};

      // Adjust formality based on occasions
      let formality = baseStyle.formality || 0.5;
      if (item.occasion.includes(Occasion.FORMAL)) formality += 0.3;
      if (item.occasion.includes(Occasion.WORK)) formality += 0.2;
      if (item.occasion.includes(Occasion.CASUAL)) formality -= 0.2;
      if (item.occasion.includes(Occasion.SPORT)) formality -= 0.3;

      // Adjust boldness based on tags and color
      let boldness = baseStyle.boldness || 0.5;
      const boldTags = ['bright', 'pattern', 'print', 'colorful', 'vibrant'];
      const conservativeTags = ['plain', 'simple', 'basic', 'classic'];

      // Check tags
      for (const tag of item.tags) {
        if (boldTags.some(boldTag => tag.toLowerCase().includes(boldTag))) {
          boldness += 0.1;
        }
        if (
          conservativeTags.some(conservativeTag =>
            tag.toLowerCase().includes(conservativeTag)
          )
        ) {
          boldness -= 0.1;
        }
      }

      // Normalize values to 0-1 range
      return {
        formality: Math.max(0, Math.min(1, formality)),
        boldness: Math.max(0, Math.min(1, boldness)),
      };
    });

    // Calculate average style values for the outfit
    const outfitStyle = {
      formality:
        itemStyleValues.reduce((sum, item) => sum + item.formality, 0) /
        itemStyleValues.length,
      boldness:
        itemStyleValues.reduce((sum, item) => sum + item.boldness, 0) /
        itemStyleValues.length,
    };

    // Calculate distance from preferred style
    const formalityDiff = Math.abs(
      outfitStyle.formality - stylePreference.formality
    );
    const boldnessDiff = Math.abs(
      outfitStyle.boldness - stylePreference.boldness
    );

    // Convert to a score (closer is better)
    const formalityScore = 1 - formalityDiff;
    const boldnessScore = 1 - boldnessDiff;

    // Combine scores
    return (formalityScore + boldnessScore) / 2;
  }

  /**
   * Calculate occasion suitability score
   */
  private calculateOccasionSuitabilityScore(
    items: ClothingItem[],
    targetOccasion?: Occasion | null
  ): number {
    if (!targetOccasion) return 1;

    // Count items suitable for the target occasion
    const suitableItems = items.filter(item =>
      item.occasion.includes(targetOccasion)
    );

    // Calculate percentage of suitable items
    return suitableItems.length / items.length;
  }

  /**
   * Calculate season suitability score
   */
  private calculateSeasonSuitabilityScore(
    items: ClothingItem[],
    targetSeason?: Season | null
  ): number {
    if (!targetSeason) return 1;

    // Count items suitable for the target season
    const suitableItems = items.filter(item =>
      item.season.includes(targetSeason)
    );

    // Calculate percentage of suitable items
    return suitableItems.length / items.length;
  }

  /**
   * Calculate weather suitability score
   */
  private calculateWeatherSuitabilityScore(
    items: ClothingItem[],
    weather: WeatherData
  ): number {
    // Determine appropriate clothing based on temperature
    let temperatureScore = 0;

    // Check if outfit has appropriate layers for the temperature
    const hasOuterwear = items.some(
      item => item.category === ClothingCategory.OUTERWEAR
    );
    const hasLongSleeves = items.some(item =>
      item.tags.some(
        tag =>
          tag.toLowerCase().includes('long sleeve') ||
          tag.toLowerCase().includes('long-sleeve')
      )
    );

    if (weather.temperature < TEMPERATURE_RANGES.COLD.max) {
      // Cold weather needs outerwear
      temperatureScore = hasOuterwear ? 1 : 0.3;
    } else if (weather.temperature < TEMPERATURE_RANGES.COOL.max) {
      // Cool weather benefits from outerwear or long sleeves
      temperatureScore = hasOuterwear || hasLongSleeves ? 1 : 0.6;
    } else if (weather.temperature < TEMPERATURE_RANGES.MILD.max) {
      // Mild weather is flexible
      temperatureScore = 1;
    } else if (weather.temperature < TEMPERATURE_RANGES.WARM.max) {
      // Warm weather should avoid heavy outerwear
      temperatureScore = hasOuterwear ? 0.5 : 1;
    } else {
      // Hot weather should have minimal layers
      temperatureScore = hasOuterwear ? 0.2 : hasLongSleeves ? 0.6 : 1;
    }

    // Adjust for precipitation
    let precipitationScore = 1;
    if (
      weather.precipitation > 0.5 ||
      weather.conditions === 'rainy' ||
      weather.conditions === 'snowy'
    ) {
      // Check for water-resistant or warm items in rainy/snowy conditions
      const hasWaterResistant = items.some(item =>
        item.tags.some(
          tag =>
            tag.toLowerCase().includes('waterproof') ||
            tag.toLowerCase().includes('water-resistant') ||
            tag.toLowerCase().includes('rain')
        )
      );

      precipitationScore = hasWaterResistant ? 1 : 0.5;
    }

    // Adjust for wind
    let windScore = 1;
    if (weather.windSpeed > 20 || weather.conditions === 'windy') {
      // Check for wind-resistant items
      const hasWindResistant = items.some(
        item =>
          item.tags.some(
            tag =>
              tag.toLowerCase().includes('windproof') ||
              tag.toLowerCase().includes('wind-resistant')
          ) || item.category === ClothingCategory.OUTERWEAR
      );

      windScore = hasWindResistant ? 1 : 0.7;
    }

    // Combine scores
    return temperatureScore * 0.6 + precipitationScore * 0.3 + windScore * 0.1;
  }

  /**
   * Calculate user preference score
   */
  private calculateUserPreferenceScore(
    items: ClothingItem[],
    preferredColors?: string[]
  ): number {
    if (!preferredColors || preferredColors.length === 0) return 1;

    // Count items with preferred colors
    const matchingItems = items.filter(item =>
      preferredColors.some(
        color =>
          item.color.toLowerCase() === color.toLowerCase() ||
          this.areColorsClose(item.color, color)
      )
    );

    // Calculate percentage of matching items
    return matchingItems.length / items.length;
  }

  /**
   * Calculate variety score to prevent repetitive outfits
   */
  private calculateVarietyScore(items: ClothingItem[]): number {
    const outfitKey = this.getOutfitKey(items);

    // Check if this outfit is similar to recently generated ones
    for (const [key, date] of this.recentlyGeneratedOutfits.entries()) {
      const similarity = this.calculateOutfitSimilarity(outfitKey, key);

      // If very similar to a recent outfit, penalize based on recency
      if (similarity > 0.8) {
        const daysSinceGenerated =
          (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000);
        // Penalty decreases over time
        const penalty = Math.max(0, 1 - daysSinceGenerated / 7);
        return 1 - similarity * penalty;
      }
    }

    return 1;
  }

  /**
   * Calculate similarity between two outfits based on their keys
   */
  private calculateOutfitSimilarity(key1: string, key2: string): number {
    const items1 = key1.split('|');
    const items2 = key2.split('|');

    // Count common items
    const commonItems = items1.filter(item => items2.includes(item));

    // Calculate Jaccard similarity
    return (
      commonItems.length / (items1.length + items2.length - commonItems.length)
    );
  }

  /**
   * Filter items based on weather conditions
   */
  private filterItemsByWeather(
    items: ClothingItem[],
    weather: WeatherData
  ): ClothingItem[] {
    // Determine appropriate season based on temperature
    let weatherSeason: Season;

    if (weather.temperature < TEMPERATURE_RANGES.COLD.max) {
      weatherSeason = Season.WINTER;
    } else if (weather.temperature < TEMPERATURE_RANGES.COOL.max) {
      weatherSeason = Season.FALL;
    } else if (weather.temperature < TEMPERATURE_RANGES.WARM.max) {
      weatherSeason = Season.SPRING;
    } else {
      weatherSeason = Season.SUMMER;
    }

    // Filter items suitable for the weather season
    return items.filter(item => item.season.includes(weatherSeason));
  }

  /**
   * Group items by category
   */
  private groupItemsByCategory(
    items: ClothingItem[]
  ): Record<ClothingCategory, ClothingItem[]> {
    const result: Record<ClothingCategory, ClothingItem[]> = {} as Record<
      ClothingCategory,
      ClothingItem[]
    >;

    for (const item of items) {
      if (!result[item.category]) {
        result[item.category] = [];
      }
      result[item.category].push(item);
    }

    return result;
  }

  /**
   * Generate a unique key for an outfit based on item IDs
   */
  private getOutfitKey(items: ClothingItem[]): string {
    return items
      .map(item => item.id)
      .sort()
      .join('|');
  }

  /**
   * Clean up expired entries in recently generated outfits
   */
  private cleanupRecentOutfits(): void {
    const now = Date.now();

    for (const [key, date] of this.recentlyGeneratedOutfits.entries()) {
      if (now - date.getTime() > this.RECENT_OUTFITS_EXPIRY) {
        this.recentlyGeneratedOutfits.delete(key);
      }
    }
  }

  /**
   * Ensure variety in the selected outfits
   */
  private ensureOutfitVariety(outfits: GeneratedOutfit[]): GeneratedOutfit[] {
    if (outfits.length <= 1) return outfits;

    const result: GeneratedOutfit[] = [outfits[0]];
    const selectedKeys = new Set([this.getOutfitKey(outfits[0].items)]);

    // Add outfits that are sufficiently different from already selected ones
    for (let i = 1; i < outfits.length; i++) {
      const currentKey = this.getOutfitKey(outfits[i].items);
      let isUnique = true;

      for (const selectedKey of selectedKeys) {
        const similarity = this.calculateOutfitSimilarity(
          currentKey,
          selectedKey
        );
        if (similarity > 0.7) {
          isUnique = false;
          break;
        }
      }

      if (isUnique) {
        result.push(outfits[i]);
        selectedKeys.add(currentKey);
      }
    }

    return result;
  }

  /**
   * Convert hex color to HSL
   */
  private hexToHSL(hex: string): { h: number; s: number; l: number } {
    // Default to black if invalid hex
    if (!hex || !hex.startsWith('#')) {
      return { h: 0, s: 0, l: 0 };
    }

    // Remove # if present
    hex = hex.replace('#', '');

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return {
      h: h * 360,
      s,
      l,
    };
  }

  /**
   * Check if two colors are visually close
   */
  private areColorsClose(color1: string, color2: string): boolean {
    const hsl1 = this.hexToHSL(color1);
    const hsl2 = this.hexToHSL(color2);

    // Calculate distance between colors
    const hueDiff = Math.min(
      Math.abs(hsl1.h - hsl2.h),
      360 - Math.abs(hsl1.h - hsl2.h)
    );
    const satDiff = Math.abs(hsl1.s - hsl2.s);
    const lightDiff = Math.abs(hsl1.l - hsl2.l);

    // Colors are close if all components are within thresholds
    return hueDiff < 30 && satDiff < 0.3 && lightDiff < 0.3;
  }

  /**
   * Create an outfit object from generated items
   */
  createOutfit(
    items: ClothingItem[],
    name: string = 'Generated Outfit'
  ): Outfit {
    // Determine seasons and occasions based on items
    const seasons = this.findCommonValues(items.map(item => item.season));
    const occasions = this.findCommonValues(items.map(item => item.occasion));

    // Generate tags based on items
    const tags = Array.from(
      new Set(items.flatMap(item => item.tags).slice(0, 5))
    );

    return {
      id: uuidv4(),
      name,
      items,
      season: seasons,
      occasion: occasions,
      tags,
      isFavorite: false,
      timesWorn: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Find common values across multiple arrays
   */
  private findCommonValues<T>(arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0];

    // Start with all values from first array
    let common = [...arrays[0]];

    // Intersect with each subsequent array
    for (let i = 1; i < arrays.length; i++) {
      common = common.filter(value => arrays[i].includes(value));
    }

    return common;
  }
}

export const outfitGenerator = OutfitGenerator.getInstance();

// Hook for using outfit generator in components
export const useOutfitGenerator = () => {
  const generateOutfits = (
    items: ClothingItem[],
    options?: OutfitGenerationOptions
  ) => {
    return outfitGenerator.generateOutfits(items, options);
  };

  const createOutfit = (items: ClothingItem[], name?: string) => {
    return outfitGenerator.createOutfit(items, name);
  };

  const calculateOutfitScore = (items: ClothingItem[]): OutfitScore => {
    return outfitGenerator['scoreOutfit'](items, {});
  };

  return {
    generateOutfits,
    createOutfit,
    calculateOutfitScore,
  };
};
