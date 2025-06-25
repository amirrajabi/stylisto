export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subcategory: string;
  color: string;
  brand?: string;
  size?: string;
  season: Season[];
  occasion: Occasion[];
  imageUrl: string;
  tags: string[];
  isFavorite: boolean;
  lastWorn?: string;
  timesWorn: number;
  purchaseDate?: string;
  price?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Outfit {
  id: string;
  name: string;
  items: ClothingItem[];
  occasion: Occasion[];
  season: Season[];
  tags: string[];
  isFavorite: boolean;
  timesWorn: number;
  lastWorn?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const enum ClothingCategory {
  TOPS = 'tops',
  BOTTOMS = 'bottoms',
  DRESSES = 'dresses',
  OUTERWEAR = 'outerwear',
  SHOES = 'shoes',
  ACCESSORIES = 'accessories',
  UNDERWEAR = 'underwear',
  ACTIVEWEAR = 'activewear',
  SLEEPWEAR = 'sleepwear',
  SWIMWEAR = 'swimwear',
}

export const enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter',
}

export const enum Occasion {
  CASUAL = 'casual',
  WORK = 'work',
  FORMAL = 'formal',
  PARTY = 'party',
  SPORT = 'sport',
  TRAVEL = 'travel',
  DATE = 'date',
  SPECIAL = 'special',
}

export interface WardrobeStats {
  totalItems: number;
  itemsByCategory: Record<ClothingCategory, number>;
  itemsBySeason: Record<Season, number>;
  itemsByOccasion: Record<Occasion, number>;
  favoriteItems: number;
  totalOutfits: number;
  mostWornItems: ClothingItem[];
  leastWornItems: ClothingItem[];
  recentlyAdded: ClothingItem[];
}

export interface FilterOptions {
  categories: ClothingCategory[];
  seasons: Season[];
  occasions: Occasion[];
  colors: string[];
  brands: string[];
  tags: string[];
  favorites: boolean;
  priceRange?: [number, number];
}

export interface SortOptions {
  field:
    | 'name'
    | 'category'
    | 'color'
    | 'brand'
    | 'lastWorn'
    | 'timesWorn'
    | 'createdAt'
    | 'price';
  direction: 'asc' | 'desc';
}
