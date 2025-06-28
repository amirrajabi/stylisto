import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  ClothingCategory,
  ClothingItem,
  Occasion,
  Season,
} from '../types/wardrobe';

export const generateId = (): string => {
  return uuidv4();
};

export const getCategoryIcon = (category: ClothingCategory): string => {
  const iconMap = {
    [ClothingCategory.TOPS]: 'shirt',
    [ClothingCategory.BOTTOMS]: 'pants',
    [ClothingCategory.DRESSES]: 'dress',
    [ClothingCategory.OUTERWEAR]: 'jacket',
    [ClothingCategory.SHOES]: 'shoe',
    [ClothingCategory.ACCESSORIES]: 'watch',
    [ClothingCategory.UNDERWEAR]: 'underwear',
    [ClothingCategory.ACTIVEWEAR]: 'dumbbell',
    [ClothingCategory.SLEEPWEAR]: 'moon',
    [ClothingCategory.SWIMWEAR]: 'waves',
  };
  return iconMap[category] || 'shirt';
};

export const getSeasonColor = (season: Season): string => {
  const colorMap = {
    [Season.SPRING]: '#4ade80',
    [Season.SUMMER]: '#fbbf24',
    [Season.FALL]: '#f97316',
    [Season.WINTER]: '#60a5fa',
  };
  return colorMap[season];
};

export const getOccasionColor = (occasion: Occasion): string => {
  const colorMap = {
    [Occasion.CASUAL]: '#6b7280',
    [Occasion.WORK]: '#1f2937',
    [Occasion.FORMAL]: '#000000',
    [Occasion.PARTY]: '#ec4899',
    [Occasion.SPORT]: '#10b981',
    [Occasion.TRAVEL]: '#A428FC',
    [Occasion.DATE]: '#ef4444',
    [Occasion.SPECIAL]: '#8b5cf6',
  };
  return colorMap[occasion];
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: Date | string | null | undefined): string => {
  try {
    if (!date) {
      return 'Unknown';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    return 'Invalid Date';
  }
};

export const getColorName = (hex: string): string => {
  const colorNames: Record<string, string> = {
    '#000000': 'Black',
    '#ffffff': 'White',
    '#808080': 'Gray',
    '#ff0000': 'Red',
    '#00ff00': 'Green',
    '#0000ff': 'Blue',
    '#ffff00': 'Yellow',
    '#ff00ff': 'Magenta',
    '#00ffff': 'Cyan',
    '#ffa500': 'Orange',
    '#800080': 'Purple',
    '#ffc0cb': 'Pink',
    '#a52a2a': 'Brown',
    '#000080': 'Navy',
    '#008000': 'Dark Green',
    '#800000': 'Maroon',
  };
  return colorNames[hex.toLowerCase()] || hex;
};

export const validateOutfit = (
  items: ClothingItem[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Outfit must contain at least one item');
    return { isValid: false, errors };
  }

  const categories = items.map(item => item.category);
  const hasTop =
    categories.includes(ClothingCategory.TOPS) ||
    categories.includes(ClothingCategory.DRESSES);
  const hasBottom =
    categories.includes(ClothingCategory.BOTTOMS) ||
    categories.includes(ClothingCategory.DRESSES);

  if (!hasTop) {
    errors.push('Outfit should include a top or dress');
  }

  if (!hasBottom) {
    errors.push('Outfit should include bottoms or a dress');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const suggestOutfitItems = (
  selectedItems: ClothingItem[],
  allItems: ClothingItem[]
): ClothingItem[] => {
  if (selectedItems.length === 0) return [];

  const selectedCategories = selectedItems.map(item => item.category);
  const selectedSeasons = selectedItems.flatMap(item => item.season);
  const selectedOccasions = selectedItems.flatMap(item => item.occasion);

  const suggestions = allItems.filter(item => {
    // Don't suggest already selected items
    if (selectedItems.some(selected => selected.id === item.id)) return false;

    // Suggest items that match seasons and occasions
    const hasMatchingSeason = item.season.some(season =>
      selectedSeasons.includes(season)
    );
    const hasMatchingOccasion = item.occasion.some(occasion =>
      selectedOccasions.includes(occasion)
    );

    return hasMatchingSeason && hasMatchingOccasion;
  });

  // Prioritize complementary categories
  const complementaryCategories: Record<ClothingCategory, ClothingCategory[]> =
    {
      [ClothingCategory.TOPS]: [
        ClothingCategory.BOTTOMS,
        ClothingCategory.SHOES,
        ClothingCategory.ACCESSORIES,
      ],
      [ClothingCategory.BOTTOMS]: [
        ClothingCategory.TOPS,
        ClothingCategory.SHOES,
        ClothingCategory.ACCESSORIES,
      ],
      [ClothingCategory.DRESSES]: [
        ClothingCategory.SHOES,
        ClothingCategory.ACCESSORIES,
        ClothingCategory.OUTERWEAR,
      ],
      [ClothingCategory.SHOES]: [
        ClothingCategory.TOPS,
        ClothingCategory.BOTTOMS,
        ClothingCategory.DRESSES,
      ],
      [ClothingCategory.OUTERWEAR]: [
        ClothingCategory.TOPS,
        ClothingCategory.BOTTOMS,
        ClothingCategory.DRESSES,
      ],
      [ClothingCategory.ACCESSORIES]: [
        ClothingCategory.TOPS,
        ClothingCategory.BOTTOMS,
        ClothingCategory.DRESSES,
      ],
      [ClothingCategory.UNDERWEAR]: [],
      [ClothingCategory.ACTIVEWEAR]: [ClothingCategory.SHOES],
      [ClothingCategory.SLEEPWEAR]: [],
      [ClothingCategory.SWIMWEAR]: [ClothingCategory.ACCESSORIES],
    };

  const neededCategories = selectedCategories.flatMap(
    cat => complementaryCategories[cat]
  );

  return suggestions
    .filter(item => neededCategories.includes(item.category))
    .slice(0, 10);
};

export const calculateWardrobeValue = (items: ClothingItem[]): number => {
  return items.reduce((total, item) => total + (item.price || 0), 0);
};

export const getWardrobeInsights = (items: ClothingItem[]): string[] => {
  const insights: string[] = [];

  if (items.length === 0) return insights;

  // Most worn category
  const categoryCount = items.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.timesWorn;
      return acc;
    },
    {} as Record<ClothingCategory, number>
  );

  const mostWornCategory = Object.entries(categoryCount).reduce((a, b) =>
    categoryCount[a[0] as ClothingCategory] >
    categoryCount[b[0] as ClothingCategory]
      ? a
      : b
  )[0];

  insights.push(`Your most worn category is ${mostWornCategory}`);

  // Underutilized items
  const unwornItems = items.filter(item => item.timesWorn === 0);
  if (unwornItems.length > 0) {
    insights.push(
      `You have ${unwornItems.length} items that haven't been worn yet`
    );
  }

  // Seasonal distribution
  const seasonCount = items.reduce(
    (acc, item) => {
      item.season.forEach(season => {
        acc[season] = (acc[season] || 0) + 1;
      });
      return acc;
    },
    {} as Record<Season, number>
  );

  const leastRepresentedSeason = Object.entries(seasonCount).reduce((a, b) =>
    seasonCount[a[0] as Season] < seasonCount[b[0] as Season] ? a : b
  )[0];

  insights.push(
    `Consider adding more ${leastRepresentedSeason} items to your wardrobe`
  );

  return insights;
};
