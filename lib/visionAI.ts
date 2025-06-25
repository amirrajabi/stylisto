import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ClothingCategory, Occasion, Season } from '../types/wardrobe';

// Types for Google Cloud Vision API responses
interface VisionAnnotation {
  mid: string;
  description: string;
  score: number;
  topicality: number;
}

interface VisionColorInfo {
  color: {
    red: number;
    green: number;
    blue: number;
  };
  score: number;
  pixelFraction: number;
}

interface VisionResponse {
  labelAnnotations?: VisionAnnotation[];
  imagePropertiesAnnotation?: {
    dominantColors: {
      colors: VisionColorInfo[];
    };
  };
  webDetection?: {
    webEntities?: VisionAnnotation[];
    bestGuessLabels?: { label: string }[];
  };
}

export interface ClothingAnalysisResult {
  category: ClothingCategory;
  subcategory: string;
  color: string;
  seasons: Season[];
  occasions: Occasion[];
  tags: string[];
  confidence: {
    category: number;
    color: number;
    seasons: number;
    occasions: number;
  };
}

// Cache interface
interface AnalysisCache {
  [imageHash: string]: {
    result: ClothingAnalysisResult;
    timestamp: number;
  };
}

class VisionAIService {
  private static instance: VisionAIService;
  private apiKey: string | null = null;
  private cache: AnalysisCache = {};
  private readonly CACHE_KEY = '@clothing_analysis_cache';
  private readonly CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly API_ENDPOINT =
    'https://vision.googleapis.com/v1/images:annotate';

  // Category mapping with confidence thresholds
  private readonly CATEGORY_MAPPING: Record<
    string,
    { category: ClothingCategory; confidence: number }
  > = {
    // Tops
    shirt: { category: ClothingCategory.TOPS, confidence: 0.8 },
    't-shirt': { category: ClothingCategory.TOPS, confidence: 0.8 },
    blouse: { category: ClothingCategory.TOPS, confidence: 0.8 },
    sweater: { category: ClothingCategory.TOPS, confidence: 0.8 },
    hoodie: { category: ClothingCategory.TOPS, confidence: 0.8 },
    sweatshirt: { category: ClothingCategory.TOPS, confidence: 0.8 },
    'tank top': { category: ClothingCategory.TOPS, confidence: 0.8 },
    'polo shirt': { category: ClothingCategory.TOPS, confidence: 0.8 },
    jersey: { category: ClothingCategory.TOPS, confidence: 0.7 },
    cardigan: { category: ClothingCategory.TOPS, confidence: 0.7 },

    // Bottoms
    pants: { category: ClothingCategory.BOTTOMS, confidence: 0.8 },
    jeans: { category: ClothingCategory.BOTTOMS, confidence: 0.8 },
    shorts: { category: ClothingCategory.BOTTOMS, confidence: 0.8 },
    skirt: { category: ClothingCategory.BOTTOMS, confidence: 0.8 },
    trousers: { category: ClothingCategory.BOTTOMS, confidence: 0.8 },
    leggings: { category: ClothingCategory.BOTTOMS, confidence: 0.8 },
    sweatpants: { category: ClothingCategory.BOTTOMS, confidence: 0.8 },
    chinos: { category: ClothingCategory.BOTTOMS, confidence: 0.7 },

    // Dresses
    dress: { category: ClothingCategory.DRESSES, confidence: 0.8 },
    gown: { category: ClothingCategory.DRESSES, confidence: 0.8 },
    sundress: { category: ClothingCategory.DRESSES, confidence: 0.8 },
    'cocktail dress': { category: ClothingCategory.DRESSES, confidence: 0.8 },

    // Outerwear
    jacket: { category: ClothingCategory.OUTERWEAR, confidence: 0.8 },
    coat: { category: ClothingCategory.OUTERWEAR, confidence: 0.8 },
    blazer: { category: ClothingCategory.OUTERWEAR, confidence: 0.8 },
    parka: { category: ClothingCategory.OUTERWEAR, confidence: 0.8 },
    raincoat: { category: ClothingCategory.OUTERWEAR, confidence: 0.8 },
    windbreaker: { category: ClothingCategory.OUTERWEAR, confidence: 0.8 },
    vest: { category: ClothingCategory.OUTERWEAR, confidence: 0.7 },

    // Shoes
    shoes: { category: ClothingCategory.SHOES, confidence: 0.8 },
    sneakers: { category: ClothingCategory.SHOES, confidence: 0.8 },
    boots: { category: ClothingCategory.SHOES, confidence: 0.8 },
    sandals: { category: ClothingCategory.SHOES, confidence: 0.8 },
    heels: { category: ClothingCategory.SHOES, confidence: 0.8 },
    loafers: { category: ClothingCategory.SHOES, confidence: 0.8 },
    flats: { category: ClothingCategory.SHOES, confidence: 0.8 },
    slippers: { category: ClothingCategory.SHOES, confidence: 0.7 },

    // Accessories
    hat: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    cap: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    scarf: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    gloves: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    belt: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    tie: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    necklace: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    earrings: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    bracelet: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    watch: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    sunglasses: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    handbag: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    purse: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },
    backpack: { category: ClothingCategory.ACCESSORIES, confidence: 0.8 },

    // Underwear
    underwear: { category: ClothingCategory.UNDERWEAR, confidence: 0.8 },
    bra: { category: ClothingCategory.UNDERWEAR, confidence: 0.8 },
    panties: { category: ClothingCategory.UNDERWEAR, confidence: 0.8 },
    briefs: { category: ClothingCategory.UNDERWEAR, confidence: 0.8 },
    boxers: { category: ClothingCategory.UNDERWEAR, confidence: 0.8 },
    lingerie: { category: ClothingCategory.UNDERWEAR, confidence: 0.8 },

    // Activewear
    sportswear: { category: ClothingCategory.ACTIVEWEAR, confidence: 0.8 },
    'athletic wear': { category: ClothingCategory.ACTIVEWEAR, confidence: 0.8 },
    'gym clothes': { category: ClothingCategory.ACTIVEWEAR, confidence: 0.8 },
    'yoga pants': { category: ClothingCategory.ACTIVEWEAR, confidence: 0.8 },
    'sports bra': { category: ClothingCategory.ACTIVEWEAR, confidence: 0.8 },
    'running shorts': {
      category: ClothingCategory.ACTIVEWEAR,
      confidence: 0.8,
    },

    // Sleepwear
    pajamas: { category: ClothingCategory.SLEEPWEAR, confidence: 0.8 },
    nightgown: { category: ClothingCategory.SLEEPWEAR, confidence: 0.8 },
    robe: { category: ClothingCategory.SLEEPWEAR, confidence: 0.8 },
    sleepwear: { category: ClothingCategory.SLEEPWEAR, confidence: 0.8 },

    // Swimwear
    swimsuit: { category: ClothingCategory.SWIMWEAR, confidence: 0.8 },
    bikini: { category: ClothingCategory.SWIMWEAR, confidence: 0.8 },
    'swim trunks': { category: ClothingCategory.SWIMWEAR, confidence: 0.8 },
    'bathing suit': { category: ClothingCategory.SWIMWEAR, confidence: 0.8 },
    swimwear: { category: ClothingCategory.SWIMWEAR, confidence: 0.8 },
  };

  // Season mapping
  private readonly SEASON_MAPPING: Record<string, Season[]> = {
    summer: [Season.SUMMER],
    beach: [Season.SUMMER],
    tropical: [Season.SUMMER],
    hot: [Season.SUMMER],
    sun: [Season.SUMMER],
    'tank top': [Season.SUMMER],
    shorts: [Season.SUMMER],
    sandals: [Season.SUMMER],

    winter: [Season.WINTER],
    snow: [Season.WINTER],
    cold: [Season.WINTER],
    wool: [Season.WINTER, Season.FALL],
    sweater: [Season.WINTER, Season.FALL],
    coat: [Season.WINTER, Season.FALL],
    jacket: [Season.WINTER, Season.FALL, Season.SPRING],
    boots: [Season.WINTER, Season.FALL],
    scarf: [Season.WINTER, Season.FALL],
    gloves: [Season.WINTER],

    fall: [Season.FALL],
    autumn: [Season.FALL],
    cardigan: [Season.FALL, Season.SPRING],
    'light jacket': [Season.FALL, Season.SPRING],

    spring: [Season.SPRING],
    floral: [Season.SPRING, Season.SUMMER],
    light: [Season.SPRING, Season.SUMMER],
    pastel: [Season.SPRING],
  };

  // Occasion mapping
  private readonly OCCASION_MAPPING: Record<string, Occasion[]> = {
    casual: [Occasion.CASUAL],
    't-shirt': [Occasion.CASUAL],
    jeans: [Occasion.CASUAL],
    hoodie: [Occasion.CASUAL],
    sneakers: [Occasion.CASUAL, Occasion.SPORT],

    formal: [Occasion.FORMAL],
    suit: [Occasion.FORMAL, Occasion.WORK],
    tuxedo: [Occasion.FORMAL],
    'dress shirt': [Occasion.FORMAL, Occasion.WORK],
    tie: [Occasion.FORMAL, Occasion.WORK],
    gown: [Occasion.FORMAL, Occasion.PARTY],

    business: [Occasion.WORK],
    office: [Occasion.WORK],
    blazer: [Occasion.WORK, Occasion.FORMAL],
    professional: [Occasion.WORK],

    party: [Occasion.PARTY],
    club: [Occasion.PARTY],
    cocktail: [Occasion.PARTY, Occasion.FORMAL],
    sequin: [Occasion.PARTY],

    athletic: [Occasion.SPORT],
    sport: [Occasion.SPORT],
    gym: [Occasion.SPORT],
    workout: [Occasion.SPORT],
    running: [Occasion.SPORT],
    yoga: [Occasion.SPORT],

    travel: [Occasion.TRAVEL],
    vacation: [Occasion.TRAVEL],
    luggage: [Occasion.TRAVEL],
    backpack: [Occasion.TRAVEL],

    date: [Occasion.DATE],
    romantic: [Occasion.DATE],
    dinner: [Occasion.DATE, Occasion.PARTY],

    wedding: [Occasion.SPECIAL],
    ceremony: [Occasion.SPECIAL],
    costume: [Occasion.SPECIAL],
    holiday: [Occasion.SPECIAL],
  };

  // Color mapping
  private readonly COLOR_MAPPING: Record<string, string> = {
    red: '#FF0000',
    blue: '#0000FF',
    green: '#00FF00',
    yellow: '#FFFF00',
    orange: '#FFA500',
    purple: '#800080',
    pink: '#FFC0CB',
    brown: '#A52A2A',
    black: '#000000',
    white: '#FFFFFF',
    gray: '#808080',
    grey: '#808080',
    navy: '#000080',
    teal: '#008080',
    maroon: '#800000',
    olive: '#808000',
    beige: '#F5F5DC',
    tan: '#D2B48C',
    khaki: '#F0E68C',
    gold: '#FFD700',
    silver: '#C0C0C0',
  };

  static getInstance(): VisionAIService {
    if (!VisionAIService.instance) {
      VisionAIService.instance = new VisionAIService();
    }
    return VisionAIService.instance;
  }

  constructor() {
    this.loadCache();
  }

  /**
   * Set the Google Cloud Vision API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze clothing item from image
   */
  async analyzeClothing(imageUri: string): Promise<ClothingAnalysisResult> {
    try {
      if (!this.apiKey) {
        console.warn(
          'Google Cloud Vision API key not set, returning fallback result'
        );
        return this.getFallbackResult();
      }

      await this.loadCache();

      const imageHash = await this.generateImageHash(imageUri);
      const cachedResult = this.getCachedResult(imageHash);

      if (cachedResult) {
        return cachedResult;
      }

      try {
        const base64Image = await this.getBase64FromUri(imageUri);

        const requestBody = {
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 50 },
                { type: 'IMAGE_PROPERTIES', maxResults: 10 },
                { type: 'WEB_DETECTION', maxResults: 20 },
              ],
            },
          ],
        };

        const response = await fetch(
          `${this.API_ENDPOINT}?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Vision API error: ${response.status} ${errorText}`);
          return this.getFallbackResult();
        }

        const data = await response.json();
        const visionResponse = data.responses?.[0];

        if (visionResponse?.error) {
          console.error('Vision API response error:', visionResponse.error);
          return this.getFallbackResult();
        }

        const result = this.processVisionResponse(visionResponse);
        this.cacheResult(imageHash, result);

        return result;
      } catch (networkError) {
        console.error('Network error during vision analysis:', networkError);
        return this.getFallbackResult();
      }
    } catch (error) {
      console.error('Error in analyzeClothing:', error);
      return this.getFallbackResult();
    }
  }

  /**
   * Analyze multiple clothing items in batch
   */
  async analyzeBatch(
    imageUris: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<ClothingAnalysisResult[]> {
    const results: ClothingAnalysisResult[] = [];

    for (let i = 0; i < imageUris.length; i++) {
      try {
        const result = await this.analyzeClothing(imageUris[i]);
        results.push(result);

        // Report progress
        onProgress?.(i + 1, imageUris.length);
      } catch (error) {
        console.error(`Error analyzing image ${i + 1}:`, error);
        results.push(this.getFallbackResult());
      }
    }

    return results;
  }

  /**
   * Process Vision API response into clothing analysis result
   */
  private processVisionResponse(
    response: VisionResponse
  ): ClothingAnalysisResult {
    // Initialize result with defaults
    const result: ClothingAnalysisResult = {
      category: ClothingCategory.TOPS, // Default category
      subcategory: '',
      color: '#000000', // Default color
      seasons: [],
      occasions: [],
      tags: [],
      confidence: {
        category: 0,
        color: 0,
        seasons: 0,
        occasions: 0,
      },
    };

    // Process label annotations for category, seasons, and occasions
    if (response.labelAnnotations) {
      // Extract all labels with their scores
      const labels = response.labelAnnotations.map(label => ({
        label: label.description.toLowerCase(),
        score: label.score,
      }));

      // Add labels as tags
      result.tags = labels
        .filter(item => item.score > 0.7)
        .map(item => item.label);

      // Determine category
      let bestCategoryMatch = {
        category: ClothingCategory.TOPS,
        confidence: 0,
      };

      for (const { label, score } of labels) {
        const mapping = this.CATEGORY_MAPPING[label];
        if (
          mapping &&
          score >= mapping.confidence &&
          score > bestCategoryMatch.confidence
        ) {
          bestCategoryMatch = { category: mapping.category, confidence: score };

          // Use the matched label as subcategory
          result.subcategory = label;
        }
      }

      result.category = bestCategoryMatch.category;
      result.confidence.category = bestCategoryMatch.confidence;

      // Determine seasons
      const seasonMatches = new Map<Season, number>();

      for (const { label, score } of labels) {
        const seasons = this.SEASON_MAPPING[label];
        if (seasons && score > 0.6) {
          seasons.forEach(season => {
            seasonMatches.set(
              season,
              Math.max(seasonMatches.get(season) || 0, score)
            );
          });
        }
      }

      // Select seasons with confidence above threshold
      result.seasons = Array.from(seasonMatches.entries())
        .filter(([_, confidence]) => confidence > 0.6)
        .map(([season, _]) => season);

      // Calculate average season confidence
      result.confidence.seasons =
        result.seasons.length > 0
          ? Array.from(seasonMatches.values()).reduce(
              (sum, val) => sum + val,
              0
            ) / result.seasons.length
          : 0;

      // Determine occasions
      const occasionMatches = new Map<Occasion, number>();

      for (const { label, score } of labels) {
        const occasions = this.OCCASION_MAPPING[label];
        if (occasions && score > 0.6) {
          occasions.forEach(occasion => {
            occasionMatches.set(
              occasion,
              Math.max(occasionMatches.get(occasion) || 0, score)
            );
          });
        }
      }

      // Select occasions with confidence above threshold
      result.occasions = Array.from(occasionMatches.entries())
        .filter(([_, confidence]) => confidence > 0.6)
        .map(([occasion, _]) => occasion);

      // Calculate average occasion confidence
      result.confidence.occasions =
        result.occasions.length > 0
          ? Array.from(occasionMatches.values()).reduce(
              (sum, val) => sum + val,
              0
            ) / result.occasions.length
          : 0;
    }

    // Process web detection for additional context
    if (response.webDetection?.webEntities) {
      const webLabels = response.webDetection.webEntities
        .filter(entity => entity.score > 0.7)
        .map(entity => entity.description.toLowerCase());

      // Add unique web labels to tags
      webLabels.forEach(label => {
        if (!result.tags.includes(label)) {
          result.tags.push(label);
        }
      });
    }

    // Process color information
    if (response.imagePropertiesAnnotation?.dominantColors?.colors) {
      const colors = response.imagePropertiesAnnotation.dominantColors.colors;

      if (colors.length > 0) {
        // Find dominant color with highest score
        const dominantColor = colors.reduce((prev, current) =>
          current.score > prev.score ? current : prev
        );

        // Convert RGB to hex
        const { red, green, blue } = dominantColor.color;
        const hexColor = this.rgbToHex(red, green, blue);

        // Find closest named color
        const namedColor = this.findClosestNamedColor(hexColor);

        result.color = namedColor || hexColor;
        result.confidence.color = dominantColor.score;
      }
    }

    // Ensure we have at least one season if none detected
    if (result.seasons.length === 0) {
      result.seasons = [Season.SUMMER]; // Default to summer
      result.confidence.seasons = 0.5; // Medium confidence
    }

    // Ensure we have at least one occasion if none detected
    if (result.occasions.length === 0) {
      result.occasions = [Occasion.CASUAL]; // Default to casual
      result.confidence.occasions = 0.5; // Medium confidence
    }

    return result;
  }

  /**
   * Get base64 encoding of image from URI
   */
  private async getBase64FromUri(uri: string): Promise<string> {
    if (Platform.OS === 'web') {
      // For web, fetch the image and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // For native platforms, use FileSystem
      const { FileSystem } = require('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
  }

  /**
   * Generate a hash for an image to use as cache key
   */
  private async generateImageHash(uri: string): Promise<string> {
    // Simple hash function based on URI and timestamp
    // In a production app, you might want to use a more robust hashing algorithm
    return `${uri.split('/').pop()}-${Date.now()}`;
  }

  /**
   * Get cached analysis result
   */
  private getCachedResult(imageHash: string): ClothingAnalysisResult | null {
    const cached = this.cache[imageHash];

    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      return cached.result;
    }

    return null;
  }

  /**
   * Cache analysis result
   */
  private cacheResult(imageHash: string, result: ClothingAnalysisResult): void {
    this.cache[imageHash] = {
      result,
      timestamp: Date.now(),
    };

    // Save cache to persistent storage
    this.saveCache();
  }

  /**
   * Load cache from persistent storage
   */
  private async loadCache(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY);

      if (cachedData) {
        this.cache = JSON.parse(cachedData);

        // Clean expired cache entries
        this.cleanCache();
      }
    } catch (error) {
      console.error('Failed to load analysis cache:', error);
    }
  }

  /**
   * Save cache to persistent storage
   */
  private async saveCache(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Failed to save analysis cache:', error);
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    let hasChanges = false;

    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp > this.CACHE_EXPIRY) {
        delete this.cache[key];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveCache();
    }
  }

  /**
   * Get fallback result when analysis fails
   */
  private getFallbackResult(): ClothingAnalysisResult {
    try {
      return {
        category: ClothingCategory.TOPS,
        subcategory: '',
        color: '#000000',
        seasons: [Season.SUMMER, Season.SPRING],
        occasions: [Occasion.CASUAL],
        tags: [],
        confidence: {
          category: 0.5,
          color: 0.5,
          seasons: 0.5,
          occasions: 0.5,
        },
      };
    } catch (error) {
      console.error('Error in VisionAI getFallbackResult:', error);
      return {
        category: 'tops' as ClothingCategory,
        subcategory: '',
        color: '#000000',
        seasons: ['summer', 'spring'] as Season[],
        occasions: ['casual'] as Occasion[],
        tags: [],
        confidence: {
          category: 0.5,
          color: 0.5,
          seasons: 0.5,
          occasions: 0.5,
        },
      };
    }
  }

  /**
   * Convert RGB values to hex color code
   */
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => {
      const hex = Math.round(c).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Find closest named color to a hex color
   */
  private findClosestNamedColor(hexColor: string): string | null {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    let closestColor = null;
    let closestDistance = Infinity;

    // Calculate distance to each named color
    Object.entries(this.COLOR_MAPPING).forEach(([name, hex]) => {
      const nr = parseInt(hex.slice(1, 3), 16);
      const ng = parseInt(hex.slice(3, 5), 16);
      const nb = parseInt(hex.slice(5, 7), 16);

      // Simple Euclidean distance in RGB space
      const distance = Math.sqrt(
        Math.pow(r - nr, 2) + Math.pow(g - ng, 2) + Math.pow(b - nb, 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestColor = name;
      }
    });

    return closestColor;
  }

  /**
   * Clear analysis cache
   */
  async clearCache(): Promise<void> {
    this.cache = {};
    await AsyncStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; size: number } {
    const entries = Object.keys(this.cache).length;
    const size = JSON.stringify(this.cache).length;

    return { entries, size };
  }
}

export const visionAIService = VisionAIService.getInstance();

// Hook for using Vision AI in components
export const useVisionAI = () => {
  const analyzeClothing = async (imageUri: string) => {
    return visionAIService.analyzeClothing(imageUri);
  };

  const analyzeBatch = async (
    imageUris: string[],
    onProgress?: (completed: number, total: number) => void
  ) => {
    return visionAIService.analyzeBatch(imageUris, onProgress);
  };

  const setApiKey = (apiKey: string) => {
    visionAIService.setApiKey(apiKey);
  };

  const clearCache = async () => {
    await visionAIService.clearCache();
  };

  const getCacheStats = () => {
    return visionAIService.getCacheStats();
  };

  return {
    analyzeClothing,
    analyzeBatch,
    setApiKey,
    clearCache,
    getCacheStats,
  };
};
