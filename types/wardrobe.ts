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
  originalPrice?: number;
  currentValue?: number;
  sellingPrice?: number;
  condition?: ItemCondition;
  isForSale?: boolean;
  saleListing?: SaleListingDetails;
  createdAt: string;
  updatedAt: string;
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
  score?: OutfitScore;
  createdAt: string;
  updatedAt: string;
}

export enum ClothingCategory {
  TOPS = 'tops',
  BOTTOMS = 'bottoms',
  DRESSES = 'dresses',
  OUTERWEAR = 'outerwear',
  SHOES = 'shoes',
  ACCESSORIES = 'accessories',
  UNDERWEAR = 'underwear',
  SOCKS = 'socks',
  UNDERSHIRTS = 'undershirts',
  BRAS = 'bras',
  SHORTS_UNDERWEAR = 'shorts_underwear',
  JEWELRY = 'jewelry',
  BAGS = 'bags',
  BELTS = 'belts',
  HATS = 'hats',
  SCARVES = 'scarves',
  ACTIVEWEAR = 'activewear',
  SLEEPWEAR = 'sleepwear',
  SWIMWEAR = 'swimwear',
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter',
}

export enum Occasion {
  CASUAL = 'casual',
  WORK = 'work',
  FORMAL = 'formal',
  PARTY = 'party',
  SPORT = 'sport',
  TRAVEL = 'travel',
  DATE = 'date',
  SPECIAL = 'special',
}

export enum ItemCondition {
  EXCELLENT = 'excellent',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged',
}

export interface SaleListingDetails {
  listedDate?: string;
  platform?: string;
  description?: string;
  negotiable?: boolean;
  reasonForSelling?: string;
  measurements?: {
    [key: string]: string;
  };
  defects?: string[];
  careInstructions?: string;
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
