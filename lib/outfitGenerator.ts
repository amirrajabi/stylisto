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
  useAllItems?: boolean;
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
  colorHarmony: 0.25,
  styleMatching: 0.25,
  occasionSuitability: 0.2,
  seasonSuitability: 0.15,
  weatherSuitability: 0.1,
  userPreference: 0.03,
  variety: 0.02,
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

    // Calculate realistic max results based on available items
    const itemCount = items.length;
    const realisticMaxResults = Math.min(
      100,
      Math.max(5, Math.floor(itemCount * 1.5)) // Max 1.5x the number of items, minimum 5
    );

    // Apply default options with realistic constraints
    const defaultOptions: OutfitGenerationOptions = {
      maxResults: realisticMaxResults,
      minScore: 0.45, // Lower threshold for more variety
      useAllItems: false,
      stylePreference: {
        formality: 0.5,
        boldness: 0.5,
        layering: 0.5,
        colorfulness: 0.5,
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // If useAllItems is enabled, use special algorithm
    if (mergedOptions.useAllItems) {
      return this.generateOutfitsUsingAllItems(items, mergedOptions);
    }

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

    // Filter outfits by minimum score
    const qualifyingOutfits = scoredOutfits.filter(
      outfit => outfit.score.total >= mergedOptions.minScore!
    );

    // Sort by score (descending)
    qualifyingOutfits.sort((a, b) => b.score.total - a.score.total);

    // Apply variety filter to avoid similar outfits
    const diverseOutfits = this.ensureOutfitVariety(qualifyingOutfits);

    // Limit results
    const finalOutfits = diverseOutfits.slice(0, mergedOptions.maxResults);

    // Clean up recent outfits
    this.cleanupRecentOutfits();

    // Store generated outfits
    finalOutfits.forEach(outfit => {
      const key = this.getOutfitKey(outfit.items);
      this.recentlyGeneratedOutfits.set(key, new Date());
    });

    const endTime = performance.now();
    console.log(
      `✅ Generated ${finalOutfits.length} outfits in ${(endTime - startTime).toFixed(0)}ms`
    );

    return finalOutfits;
  }

  /**
   * Generate outfits ensuring ALL items are used at least once
   */
  private generateOutfitsUsingAllItems(
    items: ClothingItem[],
    options: OutfitGenerationOptions
  ): GeneratedOutfit[] {
    console.log(`🌟 Using ALL ITEMS strategy`);

    const allOutfits: GeneratedOutfit[] = [];
    const usedItems = new Set<string>();
    const itemsByCategory = this.groupItemsByCategory(items);

    // Strategy 1: Create outfits with each item as the "star" piece
    for (const starItem of items) {
      const outfitsWithStarItem = this.generateOutfitsAroundStarItem(
        starItem,
        items,
        options
      );

      outfitsWithStarItem.forEach(outfit => {
        outfit.items.forEach(item => usedItems.add(item.id));
      });

      allOutfits.push(...outfitsWithStarItem);
    }

    // Strategy 2: Create additional outfits for any remaining unused items
    const unusedItems = items.filter(item => !usedItems.has(item.id));

    if (unusedItems.length > 0) {
      for (const unusedItem of unusedItems) {
        const additionalOutfits = this.generateOutfitsAroundStarItem(
          unusedItem,
          items,
          { ...options, minScore: Math.max(0.35, options.minScore || 0.45) } // Lower threshold for unused items
        );

        allOutfits.push(...additionalOutfits);
        usedItems.add(unusedItem.id);
      }
    }

    // Strategy 3: Create "challenge" outfits with hard-to-match items
    const challengeOutfits = this.generateChallengeOutfits(items, options);
    allOutfits.push(...challengeOutfits);

    // Remove duplicates and sort by score
    const uniqueOutfits = this.removeDuplicateOutfits(allOutfits);
    uniqueOutfits.sort((a, b) => b.score.total - a.score.total);

    // Calculate final statistics
    const finalUsedItems = new Set<string>();
    uniqueOutfits.forEach(outfit => {
      outfit.items.forEach(item => finalUsedItems.add(item.id));
    });

    const utilizationRate = (finalUsedItems.size / items.length) * 100;
    console.log(
      `📊 Utilized ${finalUsedItems.size}/${items.length} items (${utilizationRate.toFixed(0)}%)`
    );

    // Return the best outfits, but ensure we have enough to showcase all items
    const targetCount = Math.max(
      options.maxResults || 100,
      Math.ceil(items.length / 2)
    );
    return uniqueOutfits.slice(0, targetCount);
  }

  /**
   * Generate outfits with a specific item as the focal point
   */
  private generateOutfitsAroundStarItem(
    starItem: ClothingItem,
    allItems: ClothingItem[],
    options: OutfitGenerationOptions
  ): GeneratedOutfit[] {
    const outfits: GeneratedOutfit[] = [];
    const itemsByCategory = this.groupItemsByCategory(allItems);

    // Remove the star item from its category to avoid duplicates
    const availableItems = allItems.filter(item => item.id !== starItem.id);
    const availableByCategory = this.groupItemsByCategory(availableItems);

    // Determine required categories based on star item
    let requiredCategories: ClothingCategory[] = [];
    let recommendedCategories: ClothingCategory[] = [];

    if (starItem.category === ClothingCategory.DRESSES) {
      // Dress-based outfit - add complementary items
      requiredCategories = [];
      recommendedCategories = [
        ClothingCategory.SHOES,
        ClothingCategory.ACCESSORIES,
        ClothingCategory.JEWELRY,
        ClothingCategory.BAGS,
        ClothingCategory.OUTERWEAR,
      ];
    } else if (starItem.category === ClothingCategory.TOPS) {
      // Need bottom + accessories
      requiredCategories = [ClothingCategory.BOTTOMS];
      recommendedCategories = [
        ClothingCategory.SHOES,
        ClothingCategory.ACCESSORIES,
        ClothingCategory.JEWELRY,
        ClothingCategory.BAGS,
        ClothingCategory.BELTS,
        ClothingCategory.OUTERWEAR,
      ];
    } else if (starItem.category === ClothingCategory.BOTTOMS) {
      // Need top + accessories
      requiredCategories = [ClothingCategory.TOPS];
      recommendedCategories = [
        ClothingCategory.SHOES,
        ClothingCategory.ACCESSORIES,
        ClothingCategory.JEWELRY,
        ClothingCategory.BAGS,
        ClothingCategory.BELTS,
        ClothingCategory.OUTERWEAR,
      ];
    } else {
      // Accessory/shoes/outerwear - need top and bottom
      requiredCategories = [ClothingCategory.TOPS, ClothingCategory.BOTTOMS];
      recommendedCategories = [
        ClothingCategory.SHOES,
        ClothingCategory.ACCESSORIES,
        ClothingCategory.JEWELRY,
        ClothingCategory.BAGS,
        ClothingCategory.OUTERWEAR,
      ].filter(cat => cat !== starItem.category); // Don't duplicate the star item category
    }

    // Generate base outfits
    if (requiredCategories.length === 0) {
      // Star item is sufficient alone (dress)
      const outfit = [starItem];

      // Add recommended items systematically
      for (const recommendedCategory of recommendedCategories) {
        const categoryItems = availableByCategory[recommendedCategory] || [];
        if (categoryItems.length > 0) {
          const bestItem = this.findBestItemInCategory(
            categoryItems,
            outfit,
            recommendedCategory
          );
          if (
            bestItem &&
            this.calculateItemCompatibilityScore(bestItem, outfit) > 0.3
          ) {
            outfit.push(bestItem);
          }
        }
      }

      const score = this.scoreOutfit(outfit, options);
      if (score.total >= (options.minScore || 0.45)) {
        outfits.push({ items: outfit, score });
      }
    } else {
      // Need to add required items first
      this.generateCombinationsWithStarItem(
        [starItem],
        requiredCategories,
        recommendedCategories,
        availableByCategory,
        options,
        outfits
      );
    }

    return outfits;
  }

  /**
   * Recursively generate outfit combinations with a star item
   */
  private generateCombinationsWithStarItem(
    currentOutfit: ClothingItem[],
    remainingCategories: ClothingCategory[],
    recommendedCategories: ClothingCategory[],
    availableByCategory: Record<ClothingCategory, ClothingItem[]>,
    options: OutfitGenerationOptions,
    outfits: GeneratedOutfit[]
  ): void {
    if (remainingCategories.length === 0) {
      // Add recommended items and finalize outfit
      const finalOutfit = [...currentOutfit];

      // Add recommended categories systematically
      for (const recommendedCategory of recommendedCategories) {
        // Skip if already have this category
        if (finalOutfit.some(item => item.category === recommendedCategory))
          continue;

        const categoryItems = availableByCategory[recommendedCategory] || [];
        if (categoryItems.length > 0) {
          const bestItem = this.findBestItemInCategory(
            categoryItems,
            finalOutfit,
            recommendedCategory
          );
          if (
            bestItem &&
            this.calculateItemCompatibilityScore(bestItem, finalOutfit) > 0.3
          ) {
            finalOutfit.push(bestItem);
          }
        }
      }

      const score = this.scoreOutfit(finalOutfit, options);
      if (score.total >= (options.minScore || 0.45)) {
        outfits.push({ items: finalOutfit, score });
      }
      return;
    }

    const nextCategory = remainingCategories[0];
    const categoryItems = availableByCategory[nextCategory] || [];

    // Try each item in this category
    for (const item of categoryItems) {
      if (this.isItemCompatible(item, currentOutfit)) {
        const newOutfit = [...currentOutfit, item];
        const newRemainingCategories = remainingCategories.slice(1);

        this.generateCombinationsWithStarItem(
          newOutfit,
          newRemainingCategories,
          recommendedCategories,
          availableByCategory,
          options,
          outfits
        );
      }
    }

    // If no compatible items found, try with relaxed compatibility
    if (categoryItems.length > 0) {
      const bestItem = categoryItems[0]; // Take first available item as fallback
      const newOutfit = [...currentOutfit, bestItem];
      const newRemainingCategories = remainingCategories.slice(1);

      this.generateCombinationsWithStarItem(
        newOutfit,
        newRemainingCategories,
        recommendedCategories,
        availableByCategory,
        options,
        outfits
      );
    }
  }

  /**
   * Add the best optional items to an outfit
   */
  private addBestOptionalItems(
    outfit: ClothingItem[],
    availableByCategory: Record<ClothingCategory, ClothingItem[]>,
    optionalCategories: string[]
  ): void {
    for (const categoryStr of optionalCategories) {
      const category = categoryStr as ClothingCategory;

      // Skip if outfit already has this category
      if (outfit.some(item => item.category === category)) continue;

      const categoryItems = availableByCategory[category] || [];
      if (categoryItems.length === 0) continue;

      // Find best matching item
      let bestItem: ClothingItem | null = null;
      let bestScore = -1;

      for (const item of categoryItems) {
        const score = this.calculateItemCompatibilityScore(item, outfit);
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
      }

      // Add item if it has decent compatibility
      if (bestItem && bestScore > 0.1) {
        outfit.push(bestItem);
      }
    }
  }

  /**
   * Generate challenge outfits that pair difficult items together
   */
  private generateChallengeOutfits(
    items: ClothingItem[],
    options: OutfitGenerationOptions
  ): GeneratedOutfit[] {
    const challengeOutfits: GeneratedOutfit[] = [];
    const itemsByCategory = this.groupItemsByCategory(items);

    // Create a few "wild" combinations that push boundaries
    const topItems = itemsByCategory[ClothingCategory.TOPS] || [];
    const bottomItems = itemsByCategory[ClothingCategory.BOTTOMS] || [];

    if (topItems.length > 0 && bottomItems.length > 0) {
      // Create unexpected color combinations
      for (let i = 0; i < Math.min(3, topItems.length); i++) {
        for (let j = 0; j < Math.min(2, bottomItems.length); j++) {
          const challengeOutfit = [topItems[i], bottomItems[j]];

          // Add accessories for fun
          this.addBestOptionalItems(challengeOutfit, itemsByCategory, [
            'SHOES',
            'ACCESSORIES',
          ]);

          const score = this.scoreOutfit(challengeOutfit, options);
          challengeOutfits.push({ items: challengeOutfit, score });
        }
      }
    }

    return challengeOutfits;
  }

  /**
   * Remove duplicate outfits based on item composition
   */
  private removeDuplicateOutfits(
    outfits: GeneratedOutfit[]
  ): GeneratedOutfit[] {
    const seen = new Set<string>();
    const unique: GeneratedOutfit[] = [];

    for (const outfit of outfits) {
      const key = this.getOutfitKey(outfit.items);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(outfit);
      }
    }

    return unique;
  }

  /**
   * Generate all valid outfit combinations from available items
   */
  private generateOutfitCombinations(
    items: ClothingItem[],
    forceIncludeItems: string[] = []
  ): ClothingItem[][] {
    if (items.length > 100) {
      console.warn(
        '🚫 Too many items for outfit generation, limiting to first 100'
      );
      items = items.slice(0, 100);
    }

    console.log('🔧 Starting outfit generation with', items.length, 'items');

    // Group items by category
    const itemsByCategory = this.groupItemsByCategory(items);

    // Get items that must be included
    const forcedItems = items.filter(item =>
      forceIncludeItems.includes(item.id)
    );
    const forcedCategories = new Set(forcedItems.map(item => item.category));

    // Define comprehensive body coverage categories
    const essentialCategories = new Set<ClothingCategory>();
    const undergarmentCategories = new Set<ClothingCategory>([
      ClothingCategory.UNDERWEAR,
      ClothingCategory.SHORTS_UNDERWEAR,
      ClothingCategory.BRAS,
      ClothingCategory.UNDERSHIRTS,
      ClothingCategory.SOCKS,
    ]);

    // Determine main outfit structure
    if (itemsByCategory[ClothingCategory.DRESSES]?.length > 0) {
      essentialCategories.add(ClothingCategory.DRESSES);
    } else {
      essentialCategories.add(ClothingCategory.TOPS);
      essentialCategories.add(ClothingCategory.BOTTOMS);
    }

    // Essential categories that complete the outfit (REQUIRED FOR EVERY OUTFIT)
    const completingCategories = new Set<ClothingCategory>([
      ClothingCategory.SHOES,
      ClothingCategory.ACCESSORIES, // Make accessories mandatory
    ]);

    // Additional coordinating accessories (added based on compatibility)
    const coordinatingCategories = [
      ClothingCategory.JEWELRY,
      ClothingCategory.BAGS,
      ClothingCategory.BELTS,
      ClothingCategory.HATS,
      ClothingCategory.SCARVES,
      ClothingCategory.OUTERWEAR,
    ];

    // Fallback categories if primary accessories are not available
    const accessoryFallbackCategories = [
      ClothingCategory.JEWELRY,
      ClothingCategory.BAGS,
      ClothingCategory.BELTS,
      ClothingCategory.HATS,
      ClothingCategory.SCARVES,
    ];

    // Reduced logging for performance

    // Check if accessories are available, if not use fallback
    let hasAccessories =
      (itemsByCategory[ClothingCategory.ACCESSORIES] || []).length > 0;
    if (!hasAccessories) {
      // Find the first available fallback category and add it to completing categories
      for (const fallbackCategory of accessoryFallbackCategories) {
        if ((itemsByCategory[fallbackCategory] || []).length > 0) {
          completingCategories.delete(ClothingCategory.ACCESSORIES);
          completingCategories.add(fallbackCategory);
          hasAccessories = true;
          break;
        }
      }
    }

    // Check if shoes are available
    const hasShoes = (itemsByCategory[ClothingCategory.SHOES] || []).length > 0;
    if (!hasShoes) {
      completingCategories.delete(ClothingCategory.SHOES);
    }

    // If no accessories available, remove from completing categories
    if (!hasAccessories) {
      completingCategories.delete(ClothingCategory.ACCESSORIES);
      // Remove all accessory fallback categories
      for (const fallbackCategory of accessoryFallbackCategories) {
        completingCategories.delete(fallbackCategory);
      }
    }

    // Validate that we have enough items for essential categories
    for (const category of essentialCategories) {
      if (
        !forcedCategories.has(category) &&
        (!itemsByCategory[category] || itemsByCategory[category].length === 0)
      ) {
        console.warn(
          `❌ Essential category ${category} has no items. Cannot create complete outfits.`
        );
        return [];
      }
    }

    // Validate that we have enough items for completing categories (only for what's actually in the set now)
    for (const category of completingCategories) {
      if (
        !forcedCategories.has(category) &&
        (!itemsByCategory[category] || itemsByCategory[category].length === 0)
      ) {
        console.warn(
          `❌ Completing category ${category} has no items. Cannot create complete outfits.`
        );
        return [];
      }
    }

    // Generate combinations with comprehensive coverage
    const outfits: ClothingItem[][] = [];

    // Helper function to build complete outfits with strict limits
    const buildCompleteOutfit = (
      currentOutfit: ClothingItem[],
      remainingEssential: Set<ClothingCategory>,
      remainingCompleting: Set<ClothingCategory>,
      remainingUndergarments: Set<ClothingCategory>,
      depth: number = 0
    ) => {
      // Strict limits to prevent infinite loops
      if (depth > 10 || outfits.length >= 50) {
        return;
      }

      // If all essential categories are satisfied, proceed to completing categories
      if (remainingEssential.size === 0) {
        // If no more completing categories, finalize the outfit
        if (remainingCompleting.size === 0) {
          // Add coordinated undergarments
          const outfitWithUndergarments = this.addCoordinatedUndergarments(
            currentOutfit,
            remainingUndergarments,
            itemsByCategory,
            forcedCategories
          );

          // Add additional coordinating accessories (beyond the mandatory one)
          const finalOutfit = this.addCoordinatingAccessories(
            outfitWithUndergarments,
            coordinatingCategories,
            itemsByCategory,
            forcedCategories
          );

          // Validate outfit completeness
          const hasTop = finalOutfit.some(
            item =>
              item.category === ClothingCategory.TOPS ||
              item.category === ClothingCategory.DRESSES
          );
          const hasBottom = finalOutfit.some(
            item =>
              item.category === ClothingCategory.BOTTOMS ||
              item.category === ClothingCategory.DRESSES
          );
          const hasShoes = finalOutfit.some(
            item => item.category === ClothingCategory.SHOES
          );
          const hasAccessory = finalOutfit.some(
            item =>
              item.category === ClothingCategory.ACCESSORIES ||
              item.category === ClothingCategory.JEWELRY ||
              item.category === ClothingCategory.BAGS ||
              item.category === ClothingCategory.BELTS ||
              item.category === ClothingCategory.HATS ||
              item.category === ClothingCategory.SCARVES
          );

          // Check if shoes and accessories are available in wardrobe
          const shoesAvailable =
            (itemsByCategory[ClothingCategory.SHOES] || []).length > 0;
          const accessoriesAvailable =
            (itemsByCategory[ClothingCategory.ACCESSORIES] || []).length > 0 ||
            (itemsByCategory[ClothingCategory.JEWELRY] || []).length > 0 ||
            (itemsByCategory[ClothingCategory.BAGS] || []).length > 0 ||
            (itemsByCategory[ClothingCategory.BELTS] || []).length > 0 ||
            (itemsByCategory[ClothingCategory.HATS] || []).length > 0 ||
            (itemsByCategory[ClothingCategory.SCARVES] || []).length > 0;

          // Essential requirements: TOP and BOTTOM always required
          // Shoes: required only if available in wardrobe
          // Accessories: required only if available in wardrobe
          const meetsRequirements =
            hasTop &&
            hasBottom &&
            (!shoesAvailable || hasShoes) &&
            (!accessoriesAvailable || hasAccessory);

          // Only add outfit if it meets the flexible requirements
          if (meetsRequirements) {
            // Check for uniqueness
            const outfitKey = this.getOutfitKey(finalOutfit);
            if (
              !outfits.some(outfit => this.getOutfitKey(outfit) === outfitKey)
            ) {
              outfits.push(finalOutfit);

              // Add outfit without detailed logging
            }
          }
          return;
        }

        // Process next completing category (SHOES, ACCESSORIES)
        const nextCategory = Array.from(remainingCompleting)[0];

        // If this category is forced (item already selected), skip it
        if (forcedCategories.has(nextCategory)) {
          const newCompleting = new Set(remainingCompleting);
          newCompleting.delete(nextCategory);
          buildCompleteOutfit(
            currentOutfit,
            remainingEssential,
            newCompleting,
            remainingUndergarments,
            depth + 1
          );
          return;
        }

        const categoryItems = itemsByCategory[nextCategory] || [];

        // If no items available in this category, skip it but continue
        if (categoryItems.length === 0) {
          const newCompleting = new Set(remainingCompleting);
          newCompleting.delete(nextCategory);
          buildCompleteOutfit(
            currentOutfit,
            remainingEssential,
            newCompleting,
            remainingUndergarments,
            depth + 1
          );
          return;
        }

        // Find the best item in this category (even if not perfect match)
        const bestItem = this.findBestItemInCategory(
          categoryItems,
          currentOutfit,
          nextCategory
        );

        if (bestItem) {
          const newOutfit = [...currentOutfit, bestItem];
          const newCompleting = new Set(remainingCompleting);
          newCompleting.delete(nextCategory);

          buildCompleteOutfit(
            newOutfit,
            remainingEssential,
            newCompleting,
            remainingUndergarments,
            depth + 1
          );

          // Limit for performance
          if (outfits.length >= 50) {
            return;
          }
        } else {
          // Only skip if truly no items available
          const newCompleting = new Set(remainingCompleting);
          newCompleting.delete(nextCategory);
          buildCompleteOutfit(
            currentOutfit,
            remainingEssential,
            newCompleting,
            remainingUndergarments,
            depth + 1
          );
        }

        return;
      }

      // Process next essential category (TOP, BOTTOM)
      const nextCategory = Array.from(remainingEssential)[0];
      const categoryItems = itemsByCategory[nextCategory] || [];

      if (forcedCategories.has(nextCategory)) {
        const newRemaining = new Set(remainingEssential);
        newRemaining.delete(nextCategory);
        buildCompleteOutfit(
          currentOutfit,
          newRemaining,
          remainingCompleting,
          remainingUndergarments,
          depth + 1
        );
        return;
      }

      // Try each item in this category (limited for performance)
      for (let i = 0; i < Math.min(categoryItems.length, 10); i++) {
        const item = categoryItems[i];
        if (this.isItemCompatible(item, currentOutfit)) {
          const newOutfit = [...currentOutfit, item];
          const newRemaining = new Set(remainingEssential);
          newRemaining.delete(nextCategory);

          buildCompleteOutfit(
            newOutfit,
            newRemaining,
            remainingCompleting,
            remainingUndergarments,
            depth + 1
          );

          // Limit for performance
          if (outfits.length >= 50) {
            return;
          }
        }
      }
    };

    // Start with forced items
    const startingOutfit = forcedItems;
    buildCompleteOutfit(
      startingOutfit,
      new Set(
        Array.from(essentialCategories).filter(
          cat => !forcedCategories.has(cat)
        )
      ),
      new Set(
        Array.from(completingCategories).filter(
          cat => !forcedCategories.has(cat)
        )
      ),
      undergarmentCategories
    );

    console.log(`✅ Generated ${outfits.length} outfits successfully`);

    return outfits;
  }

  /**
   * Add coordinated undergarments to outfit
   */
  private addCoordinatedUndergarments(
    outfit: ClothingItem[],
    undergarmentCategories: Set<ClothingCategory>,
    itemsByCategory: Record<ClothingCategory, ClothingItem[]>,
    forcedCategories: Set<ClothingCategory>
  ): ClothingItem[] {
    let result = [...outfit];

    // Get the main clothing colors for coordination
    const mainColors = this.extractOutfitColors(outfit);

    // Add coordinated undergarments
    for (const category of undergarmentCategories) {
      if (forcedCategories.has(category)) continue;
      if (result.some(item => item.category === category)) continue;

      const categoryItems = itemsByCategory[category] || [];
      let bestItem: ClothingItem | null = null;
      let bestScore = -1;

      for (const item of categoryItems) {
        if (this.isItemCompatible(item, result)) {
          const colorScore = this.calculateUndergarmentColorScore(
            item,
            mainColors
          );
          const compatibilityScore = this.calculateItemCompatibilityScore(
            item,
            result
          );
          const totalScore = (colorScore + compatibilityScore) / 2;

          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestItem = item;
          }
        }
      }

      // Add if good enough match (lower threshold for undergarments)
      if (bestItem && bestScore > 0.2) {
        result.push(bestItem);
      }
    }

    return result;
  }

  /**
   * Add coordinating accessories to complete the outfit
   */
  private addCoordinatingAccessories(
    outfit: ClothingItem[],
    coordinatingCategories: ClothingCategory[],
    itemsByCategory: Record<ClothingCategory, ClothingItem[]>,
    forcedCategories: Set<ClothingCategory>
  ): ClothingItem[] {
    let result = [...outfit];
    const outfitColors = this.extractOutfitColors(outfit);
    const outfitStyle = this.determineOutfitStyle(outfit);

    // Check if we already have a mandatory accessory (from completing categories)
    const hasMandatoryAccessory = result.some(
      item =>
        item.category === ClothingCategory.ACCESSORIES ||
        item.category === ClothingCategory.JEWELRY ||
        item.category === ClothingCategory.BAGS ||
        item.category === ClothingCategory.BELTS ||
        item.category === ClothingCategory.HATS ||
        item.category === ClothingCategory.SCARVES
    );

    console.log(
      `🔍 Mandatory accessory check: ${hasMandatoryAccessory ? 'Found' : 'Missing'}`
    );

    // Sort categories by importance for this outfit type
    const sortedCategories = this.prioritizeAccessoriesForOutfit(
      coordinatingCategories,
      outfitStyle
    );

    // Add up to 2 additional coordinating accessories (since we already have one mandatory)
    let accessoriesAdded = 0;
    const maxAdditionalAccessories = hasMandatoryAccessory ? 2 : 3;

    for (const category of sortedCategories) {
      if (accessoriesAdded >= maxAdditionalAccessories) break;
      if (forcedCategories.has(category)) continue;
      if (result.some(item => item.category === category)) continue;

      const categoryItems = itemsByCategory[category] || [];
      let bestItem: ClothingItem | null = null;
      let bestScore = -1;

      for (const item of categoryItems) {
        if (this.isItemCompatible(item, result)) {
          const colorScore = this.calculateAccessoryColorScore(
            item,
            outfitColors
          );
          const styleScore = this.calculateAccessoryStyleScore(
            item,
            outfitStyle
          );
          const compatibilityScore = this.calculateItemCompatibilityScore(
            item,
            result
          );

          // Boost score if this is the first accessory and we need one
          const urgencyBoost =
            !hasMandatoryAccessory && accessoriesAdded === 0 ? 0.2 : 0;

          const totalScore =
            colorScore * 0.4 +
            styleScore * 0.3 +
            compatibilityScore * 0.3 +
            urgencyBoost;

          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestItem = item;
          }
        }
      }

      // Lower threshold if we need an accessory urgently
      const minScoreThreshold =
        !hasMandatoryAccessory && accessoriesAdded === 0 ? 0.3 : 0.4;

      // Add if high enough coordination score
      if (bestItem && bestScore > minScoreThreshold) {
        result.push(bestItem);
        accessoriesAdded++;
        console.log(
          `✅ Added ${category}: ${bestItem.name} (score: ${bestScore.toFixed(2)})`
        );
      } else if (!hasMandatoryAccessory && accessoriesAdded === 0) {
        console.log(
          `⚠️ Could not find suitable ${category} accessory (best score: ${bestScore.toFixed(2)})`
        );
      }
    }

    return result;
  }

  /**
   * Extract dominant colors from outfit for coordination
   */
  private extractOutfitColors(outfit: ClothingItem[]): string[] {
    const colors = outfit.map(item => item.color);
    const uniqueColors = [...new Set(colors)];
    return uniqueColors;
  }

  /**
   * Calculate color coordination score for undergarments
   */
  private calculateUndergarmentColorScore(
    item: ClothingItem,
    outfitColors: string[]
  ): number {
    // Neutral colors work well with everything
    const neutralColors = ['white', 'black', 'nude', 'beige', 'gray', 'grey'];

    if (
      neutralColors.some(neutral =>
        item.color.toLowerCase().includes(neutral.toLowerCase())
      )
    ) {
      return 0.9;
    }

    // Match with outfit colors
    for (const outfitColor of outfitColors) {
      if (this.areColorsClose(item.color, outfitColor)) {
        return 0.8;
      }
    }

    return 0.5; // Acceptable but not ideal
  }

  /**
   * Calculate color coordination score for accessories
   */
  private calculateAccessoryColorScore(
    item: ClothingItem,
    outfitColors: string[]
  ): number {
    // Check for direct color matches
    for (const outfitColor of outfitColors) {
      if (this.areColorsClose(item.color, outfitColor)) {
        return 1.0;
      }
    }

    // Check for complementary colors
    const itemHSL = this.hexToHSL(item.color);
    for (const outfitColor of outfitColors) {
      const outfitHSL = this.hexToHSL(outfitColor);
      const hueDiff = Math.abs(itemHSL.h - outfitHSL.h);

      // Complementary colors (opposite on color wheel)
      if (Math.abs(hueDiff - 180) < 30) {
        return 0.9;
      }

      // Analogous colors (close on color wheel)
      if (hueDiff < 60) {
        return 0.8;
      }
    }

    // Neutral accessories work with most outfits
    const neutralColors = ['black', 'white', 'brown', 'tan', 'gold', 'silver'];
    if (
      neutralColors.some(neutral =>
        item.color.toLowerCase().includes(neutral.toLowerCase())
      )
    ) {
      return 0.7;
    }

    return 0.3;
  }

  /**
   * Determine outfit style for accessory coordination
   */
  private determineOutfitStyle(outfit: ClothingItem[]): string {
    const tags = outfit.flatMap(item => item.tags);
    const occasions = outfit.flatMap(item => item.occasion);

    if (occasions.includes(Occasion.FORMAL) || tags.includes('formal')) {
      return 'formal';
    }
    if (occasions.includes(Occasion.WORK) || tags.includes('business')) {
      return 'business';
    }
    if (occasions.includes(Occasion.PARTY) || tags.includes('party')) {
      return 'party';
    }
    if (occasions.includes(Occasion.SPORT) || tags.includes('athletic')) {
      return 'athletic';
    }

    return 'casual';
  }

  /**
   * Calculate style coordination score for accessories
   */
  private calculateAccessoryStyleScore(
    item: ClothingItem,
    outfitStyle: string
  ): number {
    const itemTags = item.tags.map(tag => tag.toLowerCase());
    const itemOccasions = item.occasion.map(occ => occ.toLowerCase());

    switch (outfitStyle) {
      case 'formal':
        if (
          itemTags.includes('formal') ||
          itemTags.includes('elegant') ||
          itemOccasions.includes('formal')
        ) {
          return 1.0;
        }
        break;
      case 'business':
        if (
          itemTags.includes('business') ||
          itemTags.includes('professional') ||
          itemOccasions.includes('work')
        ) {
          return 1.0;
        }
        break;
      case 'party':
        if (
          itemTags.includes('party') ||
          itemTags.includes('fun') ||
          itemOccasions.includes('party')
        ) {
          return 1.0;
        }
        break;
      case 'athletic':
        if (
          itemTags.includes('athletic') ||
          itemTags.includes('sport') ||
          itemOccasions.includes('sport')
        ) {
          return 1.0;
        }
        break;
      default: // casual
        if (itemTags.includes('casual') || itemOccasions.includes('casual')) {
          return 1.0;
        }
    }

    // Neutral accessories work reasonably well with any style
    if (itemTags.includes('versatile') || itemTags.includes('classic')) {
      return 0.7;
    }

    return 0.4;
  }

  /**
   * Prioritize accessory categories based on outfit style
   */
  private prioritizeAccessoriesForOutfit(
    categories: ClothingCategory[],
    outfitStyle: string
  ): ClothingCategory[] {
    const priorities: Record<string, ClothingCategory[]> = {
      formal: [
        ClothingCategory.JEWELRY,
        ClothingCategory.BAGS,
        ClothingCategory.BELTS,
        ClothingCategory.SCARVES,
        ClothingCategory.ACCESSORIES,
        ClothingCategory.HATS,
        ClothingCategory.OUTERWEAR,
      ],
      business: [
        ClothingCategory.BELTS,
        ClothingCategory.BAGS,
        ClothingCategory.JEWELRY,
        ClothingCategory.ACCESSORIES,
        ClothingCategory.SCARVES,
        ClothingCategory.OUTERWEAR,
        ClothingCategory.HATS,
      ],
      party: [
        ClothingCategory.JEWELRY,
        ClothingCategory.ACCESSORIES,
        ClothingCategory.BAGS,
        ClothingCategory.SCARVES,
        ClothingCategory.BELTS,
        ClothingCategory.HATS,
        ClothingCategory.OUTERWEAR,
      ],
      athletic: [
        ClothingCategory.ACCESSORIES,
        ClothingCategory.BAGS,
        ClothingCategory.HATS,
        ClothingCategory.OUTERWEAR,
        ClothingCategory.BELTS,
        ClothingCategory.JEWELRY,
        ClothingCategory.SCARVES,
      ],
      casual: [
        ClothingCategory.ACCESSORIES,
        ClothingCategory.BAGS,
        ClothingCategory.JEWELRY,
        ClothingCategory.HATS,
        ClothingCategory.BELTS,
        ClothingCategory.SCARVES,
        ClothingCategory.OUTERWEAR,
      ],
    };

    const prioritized = priorities[outfitStyle] || priorities.casual;
    return prioritized.filter(cat => categories.includes(cat));
  }

  /**
   * Check if an item is compatible with the current outfit (optimized)
   */
  private isItemCompatible(
    item: ClothingItem,
    outfit: ClothingItem[]
  ): boolean {
    // Can't have multiple items from the same category (except for multi-item categories)
    const multiItemCategories = [
      ClothingCategory.ACCESSORIES,
      ClothingCategory.JEWELRY,
      ClothingCategory.SCARVES,
    ];

    if (!multiItemCategories.includes(item.category)) {
      const hasConflictingCategory = outfit.some(
        outfitItem => outfitItem.category === item.category
      );
      if (hasConflictingCategory) {
        console.log(
          `      ❌ ${item.name} conflicts with existing ${item.category} in outfit`
        );
        return false;
      }
    }

    // For multi-item categories, limit to reasonable numbers
    if (multiItemCategories.includes(item.category)) {
      const sameCategories = outfit.filter(
        outfitItem => outfitItem.category === item.category
      );
      if (sameCategories.length >= 3) {
        console.log(
          `      ❌ ${item.name} would exceed limit of 3 items for ${item.category}`
        );
        return false;
      }
    }

    // Removed excessive logging for performance
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
   * Score an outfit based on various factors with realistic distribution
   */
  private scoreOutfit(
    items: ClothingItem[],
    options: OutfitGenerationOptions
  ): OutfitScore {
    // Calculate raw component scores
    const rawScores = {
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
        : 0.8, // Neutral score when no weather specified
      userPreference: this.calculateUserPreferenceScore(
        items,
        options.preferredColors
      ),
      variety: this.calculateVarietyScore(items),
    };

    // Apply realistic variance to create score diversity
    const scoreBreakdown = {
      colorHarmony: this.applyRealisticVariance(rawScores.colorHarmony, 0.2),
      styleMatching: this.applyRealisticVariance(rawScores.styleMatching, 0.2),
      occasionSuitability: this.applyRealisticVariance(
        rawScores.occasionSuitability,
        0.15
      ),
      seasonSuitability: this.applyRealisticVariance(
        rawScores.seasonSuitability,
        0.15
      ),
      weatherSuitability: this.applyRealisticVariance(
        rawScores.weatherSuitability,
        0.15
      ),
      userPreference: this.applyRealisticVariance(
        rawScores.userPreference,
        0.1
      ),
      variety: this.applyRealisticVariance(rawScores.variety, 0.1),
    };

    // Calculate completeness score (penalty for incomplete outfits)
    const completenessScore = this.calculateCompletenessScore(items);

    // Calculate weighted total score
    let totalScore = Object.entries(scoreBreakdown).reduce(
      (total, [key, score]) =>
        total + score * SCORE_WEIGHTS[key as keyof typeof SCORE_WEIGHTS],
      0
    );

    // Apply completeness multiplier
    totalScore = totalScore * completenessScore;

    // Apply realistic distribution curve for 60-100% range with natural variation
    totalScore = this.applyDistributionCurve(totalScore);

    // Add realistic score variation based on outfit complexity
    const outfitComplexity = items.length;
    const variationFactor = Math.sin(outfitComplexity * 1.618) * 0.15; // Golden ratio for variation
    totalScore = totalScore + variationFactor;

    // Penalize recently generated similar outfits
    const outfitKey = this.getOutfitKey(items);
    if (this.recentlyGeneratedOutfits.has(outfitKey)) {
      const daysSinceLastGenerated =
        (Date.now() - this.recentlyGeneratedOutfits.get(outfitKey)!.getTime()) /
        (24 * 60 * 60 * 1000);

      // Apply penalty that decreases over time
      const recencyPenalty = Math.max(
        0,
        0.3 * (1 - daysSinceLastGenerated / 7)
      );
      totalScore = totalScore * (1 - recencyPenalty);
    }

    // Debug logging for score analysis
    if (__DEV__) {
      console.log('🔍 Score Debug:', {
        rawTotal: Object.entries(scoreBreakdown).reduce(
          (total, [key, score]) =>
            total + score * SCORE_WEIGHTS[key as keyof typeof SCORE_WEIGHTS],
          0
        ),
        completeness: completenessScore,
        afterCompleteness:
          Object.entries(scoreBreakdown).reduce(
            (total, [key, score]) =>
              total + score * SCORE_WEIGHTS[key as keyof typeof SCORE_WEIGHTS],
            0
          ) * completenessScore,
        afterCurve: totalScore,
        final: Math.max(0.6, Math.min(1.0, totalScore)),
        breakdown: scoreBreakdown,
      });
    }

    return {
      total: Math.max(0.6, Math.min(1.0, totalScore)), // Enhanced range: 60%-100%
      breakdown: scoreBreakdown,
    };
  }

  /**
   * Apply realistic variance to scores based on item properties
   */
  private applyRealisticVariance(score: number, variance: number): number {
    // Create more aggressive variation to ensure score diversity
    const baseVariation = Math.sin(score * 23.47) * variance * 0.8;
    const additionalVariation = Math.cos(score * 13.21) * variance * 0.4;
    const finalVariation = baseVariation + additionalVariation;

    const adjustedScore = score + finalVariation;
    return Math.max(0.3, Math.min(1.0, adjustedScore));
  }

  /**
   * Apply distribution curve to make scores more realistic and varied
   */
  private applyDistributionCurve(score: number): number {
    // Apply natural distribution curve for 60-100% range
    // Use sigmoid-like curve to spread scores more evenly
    const normalizedInput = (score - 0.5) * 2; // -1 to 1 range
    const sigmoid = 1 / (1 + Math.exp(-normalizedInput * 2));
    const distributedScore = 0.6 + 0.4 * sigmoid;

    return Math.max(0.6, Math.min(1.0, distributedScore));
  }

  /**
   * Calculate completeness score based on outfit categories
   */
  private calculateCompletenessScore(items: ClothingItem[]): number {
    const categories = new Set(items.map(item => item.category));
    let score = 1.0;

    // Check for essential categories (major penalty if missing)
    const hasDress = categories.has(ClothingCategory.DRESSES);
    const hasTop = categories.has(ClothingCategory.TOPS);
    const hasBottom = categories.has(ClothingCategory.BOTTOMS);

    if (!hasDress && (!hasTop || !hasBottom)) {
      score *= 0.5; // Major penalty for incomplete base outfit
    }

    // Penalties for missing recommended categories
    if (!categories.has(ClothingCategory.SHOES)) {
      score *= 0.85; // Moderate penalty for no shoes
    }

    if (items.length < 4 && !categories.has(ClothingCategory.ACCESSORIES)) {
      score *= 0.95; // Small penalty for very basic outfits without accessories
    }

    // Smaller bonus for complete outfits
    if (categories.size >= 4) score *= 1.02;
    if (categories.size >= 5) score *= 1.03;
    if (categories.size >= 6) score *= 1.05;

    return Math.max(0.4, Math.min(1.05, score));
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

    // Score based on harmony type with more balanced distribution
    const baseScores = {
      [COLOR_HARMONY.MONOCHROMATIC]: 0.85,
      [COLOR_HARMONY.ANALOGOUS]: 0.8,
      [COLOR_HARMONY.COMPLEMENTARY]: 0.75,
      [COLOR_HARMONY.TRIADIC]: 0.7,
      [COLOR_HARMONY.NEUTRAL]: 0.65,
    };

    const baseScore = baseScores[harmonyType as keyof typeof baseScores];
    if (!baseScore) {
      return this.calculateColorDistanceScore(hslColors);
    }

    // Create deterministic variation based on outfit colors
    const colorVariation =
      items.reduce((sum, item, index) => {
        return sum + ((item.color.length * (index + 1)) % 10);
      }, 0) / 100;

    const finalScore = baseScore + colorVariation * 0.2 - 0.1;
    return Math.max(0.6, Math.min(0.95, finalScore));
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
      [ClothingCategory.SOCKS]: { formality: 0.3, boldness: 0.4 },
      [ClothingCategory.UNDERSHIRTS]: { formality: 0.3, boldness: 0.3 },
      [ClothingCategory.BRAS]: { formality: 0.3, boldness: 0.4 },
      [ClothingCategory.SHORTS_UNDERWEAR]: { formality: 0.3, boldness: 0.4 },
      [ClothingCategory.JEWELRY]: { formality: 0.6, boldness: 0.8 },
      [ClothingCategory.BAGS]: { formality: 0.5, boldness: 0.5 },
      [ClothingCategory.BELTS]: { formality: 0.5, boldness: 0.5 },
      [ClothingCategory.HATS]: { formality: 0.4, boldness: 0.7 },
      [ClothingCategory.SCARVES]: { formality: 0.6, boldness: 0.6 },
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

  /**
   * Find the best matching item in a category, even if no perfect compatibility exists
   */
  private findBestItemInCategory(
    categoryItems: ClothingItem[],
    currentOutfit: ClothingItem[],
    category: ClothingCategory
  ): ClothingItem | null {
    if (categoryItems.length === 0) {
      return null;
    }

    // First, try to find perfectly compatible items
    const compatibleItems = categoryItems.filter(item =>
      this.isItemCompatible(item, currentOutfit)
    );

    if (compatibleItems.length > 0) {
      // Sort by compatibility score and return the best one
      const scored = compatibleItems.map(item => ({
        item,
        score: this.calculateItemCompatibilityScore(item, currentOutfit),
      }));
      scored.sort((a, b) => b.score - a.score);
      console.log(
        `      ✅ Found ${compatibleItems.length} compatible items, best: ${scored[0].item.name} (score: ${scored[0].score.toFixed(2)})`
      );
      return scored[0].item;
    }

    // If no perfectly compatible items, find the best available option
    // For shoes and accessories, we should always include something if available
    console.log(
      `      ⚠️ No perfectly compatible items in ${category}, finding best available option...`
    );

    // Skip category conflict check for shoes and accessories when no perfect match exists
    const availableItems = categoryItems.filter(item => {
      // For multi-item categories, still check limits
      const multiItemCategories = [
        ClothingCategory.ACCESSORIES,
        ClothingCategory.JEWELRY,
        ClothingCategory.SCARVES,
      ];

      if (multiItemCategories.includes(item.category)) {
        const sameCategories = currentOutfit.filter(
          outfitItem => outfitItem.category === item.category
        );
        return sameCategories.length < 3;
      }

      // For shoes and other single-item categories, check if there's already an item
      const hasConflictingCategory = currentOutfit.some(
        outfitItem => outfitItem.category === item.category
      );

      // If there's already an item in this category, skip
      if (hasConflictingCategory) {
        return false;
      }

      return true;
    });

    if (availableItems.length > 0) {
      // Calculate compatibility scores for all available items
      const scored = availableItems.map(item => ({
        item,
        score: this.calculateItemCompatibilityScore(item, currentOutfit),
      }));
      scored.sort((a, b) => b.score - a.score);

      console.log(
        `      ✅ Selected best available ${category}: ${scored[0].item.name} (score: ${scored[0].score.toFixed(2)})`
      );
      return scored[0].item;
    }

    console.log(`      ❌ No items available in ${category} category`);
    return null;
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
