import { createClient } from '@supabase/supabase-js';
import { wardrobeService } from '../lib/wardrobeService';
import {
  ClothingCategory,
  ItemCondition,
  Occasion,
  Season,
} from '../types/wardrobe';

interface WardrobeItemData {
  name: string;
  category: ClothingCategory;
  subcategory: string;
  color: string;
  brand?: string;
  size?: string;
  seasons: Season[];
  occasions: Occasion[];
  imageUri: string;
  tags: string[];
  notes?: string;
  price?: number;
  purchaseDate?: string;
  isForSale?: boolean;
  condition: ItemCondition;
}

// Curated wardrobe items for a 32-year-old woman based on 2025 fashion trends
const wardrobeItems: WardrobeItemData[] = [
  // TOPS & BLOUSES (8 items)
  {
    name: 'Classic White Button-Down Shirt',
    category: ClothingCategory.TOPS,
    subcategory: 'blouse',
    color: '#FFFFFF',
    brand: 'Everlane',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.WORK, Occasion.CASUAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1541840031508-326b77c9a17e?w=400&h=500&fit=crop',
    tags: ['classic', 'essential', 'versatile', 'professional'],
    notes: 'Timeless wardrobe staple, perfect for layering or wearing alone',
    price: 78,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Black Silk Camisole',
    category: ClothingCategory.TOPS,
    subcategory: 'camisole',
    color: '#000000',
    brand: 'Equipment',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [Occasion.WORK, Occasion.PARTY, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    tags: ['silk', 'elegant', 'layering', 'luxurious'],
    notes: 'Perfect for layering under blazers or wearing alone',
    price: 145,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Oversized White Cotton T-Shirt',
    category: ClothingCategory.TOPS,
    subcategory: 't-shirt',
    color: '#FFFFFF',
    brand: 'Leset',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [Occasion.CASUAL, Occasion.SPORT],
    imageUri:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
    tags: ['casual', 'comfortable', 'oversized', 'basic'],
    notes: 'Essential casual piece, great for layering or solo wear',
    price: 68,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Navy Blue Cashmere Sweater',
    category: ClothingCategory.TOPS,
    subcategory: 'sweater',
    color: '#1e3a8a',
    brand: 'Éterne',
    size: 'M',
    seasons: [Season.FALL, Season.WINTER],
    occasions: [Occasion.WORK, Occasion.CASUAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop',
    tags: ['cashmere', 'luxury', 'navy', 'elegant'],
    notes: 'Luxurious cashmere sweater in sophisticated navy',
    price: 295,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Striped Long-Sleeve Tee',
    category: ClothingCategory.TOPS,
    subcategory: 't-shirt',
    color: '#000080',
    brand: 'La Ligne',
    size: 'M',
    seasons: [Season.SPRING, Season.FALL],
    occasions: [Occasion.CASUAL, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=500&fit=crop',
    tags: ['stripes', 'nautical', 'casual', 'french-girl'],
    notes: 'Classic striped tee with French girl chic',
    price: 85,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Cream Silk Blouse',
    category: ClothingCategory.TOPS,
    subcategory: 'blouse',
    color: '#F5F5DC',
    brand: 'Róhe',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.WORK, Occasion.FORMAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    tags: ['silk', 'professional', 'elegant', 'neutral'],
    notes: 'Sophisticated silk blouse perfect for professional settings',
    price: 195,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Black Turtleneck',
    category: ClothingCategory.TOPS,
    subcategory: 'sweater',
    color: '#000000',
    brand: 'Everlane',
    size: 'M',
    seasons: [Season.FALL, Season.WINTER],
    occasions: [Occasion.WORK, Occasion.CASUAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
    tags: ['classic', 'minimal', 'versatile', 'timeless'],
    notes: 'Timeless black turtleneck, endlessly versatile',
    price: 50,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Floral Print Blouse',
    category: ClothingCategory.TOPS,
    subcategory: 'blouse',
    color: '#FFB6C1',
    brand: 'Zimmermann',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [Occasion.CASUAL, Occasion.DATE, Occasion.PARTY],
    imageUri:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    tags: ['floral', 'feminine', 'romantic', 'spring'],
    notes: 'Beautiful floral blouse perfect for spring occasions',
    price: 180,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },

  // BOTTOMS (7 items)
  {
    name: 'High-Waist Dark Wash Jeans',
    category: ClothingCategory.BOTTOMS,
    subcategory: 'jeans',
    color: '#1a237e',
    brand: 'Agolde',
    size: '29',
    seasons: [Season.SPRING, Season.FALL, Season.WINTER],
    occasions: [Occasion.CASUAL, Occasion.DATE, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop',
    tags: ['denim', 'high-waist', 'dark-wash', 'versatile'],
    notes: 'Perfect-fitting high-waist jeans in dark wash',
    price: 240,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Black Tailored Trousers',
    category: ClothingCategory.BOTTOMS,
    subcategory: 'trousers',
    color: '#000000',
    brand: 'The Frankie Shop',
    size: 'M',
    seasons: [Season.SPRING, Season.FALL, Season.WINTER],
    occasions: [Occasion.WORK, Occasion.FORMAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    tags: ['tailored', 'professional', 'black', 'sophisticated'],
    notes: 'Sophisticated tailored trousers for professional wear',
    price: 200,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'White Wide-Leg Jeans',
    category: ClothingCategory.BOTTOMS,
    subcategory: 'jeans',
    color: '#FFFFFF',
    brand: 'Frame',
    size: '29',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [Occasion.CASUAL, Occasion.DATE, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop',
    tags: ['white-denim', 'wide-leg', 'summer', 'trending'],
    notes: 'Trending white wide-leg jeans for summer 2025',
    price: 258,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Navy Pencil Skirt',
    category: ClothingCategory.BOTTOMS,
    subcategory: 'skirt',
    color: '#1e3a8a',
    brand: 'Toteme',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.WORK, Occasion.FORMAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    tags: ['pencil-skirt', 'professional', 'navy', 'classic'],
    notes: 'Classic navy pencil skirt for professional looks',
    price: 180,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Pleated Midi Skirt',
    category: ClothingCategory.BOTTOMS,
    subcategory: 'skirt',
    color: '#DEB887',
    brand: 'Ganni',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.CASUAL, Occasion.DATE, Occasion.PARTY],
    imageUri:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    tags: ['pleated', 'midi-length', 'feminine', 'versatile'],
    notes: 'Feminine pleated midi skirt in beautiful beige',
    price: 195,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Black Leather Mini Skirt',
    category: ClothingCategory.BOTTOMS,
    subcategory: 'skirt',
    color: '#000000',
    brand: 'Khaite',
    size: 'M',
    seasons: [Season.FALL, Season.WINTER],
    occasions: [Occasion.PARTY, Occasion.DATE, Occasion.SPECIAL],
    imageUri:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    tags: ['leather', 'mini', 'edgy', 'statement'],
    notes: 'Edgy leather mini skirt for special occasions',
    price: 450,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Beige Linen Pants',
    category: ClothingCategory.BOTTOMS,
    subcategory: 'trousers',
    color: '#F5F5DC',
    brand: 'Toteme',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [Occasion.CASUAL, Occasion.TRAVEL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    tags: ['linen', 'summer', 'comfortable', 'neutral'],
    notes: 'Comfortable linen pants perfect for summer',
    price: 165,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },

  // DRESSES (6 items)
  {
    name: 'Little Black Dress',
    category: ClothingCategory.DRESSES,
    subcategory: 'midi',
    color: '#000000',
    brand: 'Another Tomorrow',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER],
    occasions: [Occasion.WORK, Occasion.PARTY, Occasion.DATE, Occasion.FORMAL],
    imageUri:
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=500&fit=crop',
    tags: ['LBD', 'classic', 'versatile', 'timeless'],
    notes: 'The perfect little black dress for any occasion',
    price: 295,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'White Shirt Dress',
    category: ClothingCategory.DRESSES,
    subcategory: 'midi',
    color: '#FFFFFF',
    brand: 'Proenza Schouler',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [Occasion.CASUAL, Occasion.WORK, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
    tags: ['shirt-dress', 'versatile', 'clean', 'effortless'],
    notes: 'Effortless white shirt dress for easy elegance',
    price: 450,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Floral Maxi Dress',
    category: ClothingCategory.DRESSES,
    subcategory: 'maxi',
    color: '#FFB6C1',
    brand: 'Zimmermann',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [
      Occasion.CASUAL,
      Occasion.DATE,
      Occasion.PARTY,
      Occasion.TRAVEL,
    ],
    imageUri:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
    tags: ['floral', 'maxi', 'romantic', 'boho'],
    notes: 'Beautiful floral maxi dress with bohemian vibes',
    price: 385,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Navy Blazer Dress',
    category: ClothingCategory.DRESSES,
    subcategory: 'mini',
    color: '#1e3a8a',
    brand: 'Toteme',
    size: 'M',
    seasons: [Season.SPRING, Season.FALL],
    occasions: [Occasion.WORK, Occasion.FORMAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
    tags: ['blazer-dress', 'professional', 'structured', 'power'],
    notes: 'Powerful blazer dress for professional settings',
    price: 320,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Emerald Green Cocktail Dress',
    category: ClothingCategory.DRESSES,
    subcategory: 'midi',
    color: '#50C878',
    brand: 'Bottega Veneta',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [
      Occasion.PARTY,
      Occasion.FORMAL,
      Occasion.SPECIAL,
      Occasion.DATE,
    ],
    imageUri:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
    tags: ['green', 'cocktail', '2025-trend', 'elegant'],
    notes: 'Stunning emerald green dress following 2025 color trends',
    price: 780,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Knit Sweater Dress',
    category: ClothingCategory.DRESSES,
    subcategory: 'midi',
    color: '#D2B48C',
    brand: 'Éterne',
    size: 'M',
    seasons: [Season.FALL, Season.WINTER],
    occasions: [Occasion.CASUAL, Occasion.WORK, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
    tags: ['knit', 'cozy', 'comfortable', 'neutral'],
    notes: 'Cozy knit sweater dress in warm neutral tone',
    price: 165,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },

  // OUTERWEAR (5 items)
  {
    name: 'Beige Trench Coat',
    category: ClothingCategory.OUTERWEAR,
    subcategory: 'coat',
    color: '#F5F5DC',
    brand: 'Mango',
    size: 'M',
    seasons: [Season.SPRING, Season.FALL],
    occasions: [Occasion.WORK, Occasion.CASUAL, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=500&fit=crop',
    tags: ['trench', 'classic', 'timeless', 'neutral'],
    notes: 'Classic beige trench coat, a timeless investment piece',
    price: 140,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Black Leather Jacket',
    category: ClothingCategory.OUTERWEAR,
    subcategory: 'jacket',
    color: '#000000',
    brand: 'Nour Hammour',
    size: 'M',
    seasons: [Season.SPRING, Season.FALL, Season.WINTER],
    occasions: [Occasion.CASUAL, Occasion.DATE, Occasion.PARTY],
    imageUri:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
    tags: ['leather', 'edgy', 'statement', 'versatile'],
    notes: 'High-quality leather jacket that improves with age',
    price: 1655,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Navy Blazer',
    category: ClothingCategory.OUTERWEAR,
    subcategory: 'blazer',
    color: '#1e3a8a',
    brand: 'Toteme',
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.WORK, Occasion.FORMAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    tags: ['blazer', 'professional', 'navy', 'structured'],
    notes: 'Perfectly tailored navy blazer for professional looks',
    price: 810,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Camel Wool Coat',
    category: ClothingCategory.OUTERWEAR,
    subcategory: 'coat',
    color: '#C19A6B',
    brand: 'The Frankie Shop',
    size: 'M',
    seasons: [Season.FALL, Season.WINTER],
    occasions: [Occasion.WORK, Occasion.FORMAL, Occasion.CASUAL],
    imageUri:
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=500&fit=crop',
    tags: ['wool', 'camel', 'luxury', 'winter'],
    notes: 'Luxurious camel wool coat for sophisticated winter looks',
    price: 495,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Denim Jacket',
    category: ClothingCategory.OUTERWEAR,
    subcategory: 'jacket',
    color: '#4682B4',
    brand: "Levi's",
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.CASUAL, Occasion.TRAVEL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
    tags: ['denim', 'casual', 'versatile', 'classic'],
    notes: 'Classic denim jacket for casual layering',
    price: 89,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },

  // SHOES (8 items)
  {
    name: 'Black Leather Ankle Boots',
    category: ClothingCategory.SHOES,
    subcategory: 'boots',
    color: '#000000',
    brand: 'Reformation',
    size: '8',
    seasons: [Season.FALL, Season.WINTER, Season.SPRING],
    occasions: [Occasion.WORK, Occasion.CASUAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop',
    tags: ['ankle-boots', 'versatile', 'black', 'classic'],
    notes: 'Versatile black ankle boots that go with everything',
    price: 478,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'White Sneakers',
    category: ClothingCategory.SHOES,
    subcategory: 'sneakers',
    color: '#FFFFFF',
    brand: 'Adidas Originals',
    size: '8',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.CASUAL, Occasion.SPORT, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop',
    tags: ['sneakers', 'white', 'comfortable', 'casual'],
    notes: 'Clean white sneakers for casual and athletic wear',
    price: 90,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Nude Pointed-Toe Pumps',
    category: ClothingCategory.SHOES,
    subcategory: 'heels',
    color: '#DEB887',
    brand: 'Cos',
    size: '8',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.WORK, Occasion.FORMAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop',
    tags: ['pumps', 'nude', 'professional', 'elegant'],
    notes: 'Classic nude pumps that elongate the legs',
    price: 190,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Ballet Flats in Beige',
    category: ClothingCategory.SHOES,
    subcategory: 'flats',
    color: '#F5F5DC',
    brand: 'Gucci',
    size: '8',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.CASUAL, Occasion.WORK, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop',
    tags: ['ballet-flats', 'comfortable', 'neutral', 'classic'],
    notes: 'Comfortable beige ballet flats with signature horsebit detail',
    price: 990,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Black Strappy Sandals',
    category: ClothingCategory.SHOES,
    subcategory: 'sandals',
    color: '#000000',
    brand: 'Saint Laurent',
    size: '8',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [Occasion.PARTY, Occasion.DATE, Occasion.FORMAL],
    imageUri:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop',
    tags: ['sandals', 'strappy', 'black', 'evening'],
    notes: 'Elegant black strappy sandals for summer evenings',
    price: 485,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Knee-High Brown Boots',
    category: ClothingCategory.SHOES,
    subcategory: 'boots',
    color: '#8B4513',
    brand: 'Cos',
    size: '8',
    seasons: [Season.FALL, Season.WINTER],
    occasions: [Occasion.CASUAL, Occasion.WORK, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop',
    tags: ['knee-high', 'brown', 'boots', 'fall'],
    notes: 'Stylish brown knee-high boots for fall and winter',
    price: 390,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Espadrille Wedges',
    category: ClothingCategory.SHOES,
    subcategory: 'sandals',
    color: '#DEB887',
    brand: 'Viscata',
    size: '8',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [Occasion.CASUAL, Occasion.TRAVEL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop',
    tags: ['espadrilles', 'wedges', 'summer', 'vacation'],
    notes: 'Comfortable espadrille wedges perfect for vacation',
    price: 125,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Cognac Leather Loafers',
    category: ClothingCategory.SHOES,
    subcategory: 'flats',
    color: '#D2B48C',
    brand: 'G.H. Bass',
    size: '8',
    seasons: [Season.SPRING, Season.FALL, Season.WINTER],
    occasions: [Occasion.WORK, Occasion.CASUAL, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop',
    tags: ['loafers', 'cognac', 'preppy', 'comfortable'],
    notes: 'Classic cognac leather loafers with preppy charm',
    price: 175,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },

  // BAGS & ACCESSORIES (11 items)
  {
    name: 'Black Leather Tote Bag',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'bag',
    color: '#000000',
    brand: 'The Row',
    size: 'Large',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER],
    occasions: [Occasion.WORK, Occasion.CASUAL, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
    tags: ['tote', 'leather', 'work', 'essential'],
    notes: 'Spacious black leather tote perfect for work and travel',
    price: 2600,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Cognac Brown Crossbody',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'bag',
    color: '#D2B48C',
    brand: 'Coach',
    size: 'Medium',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER],
    occasions: [Occasion.CASUAL, Occasion.TRAVEL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
    tags: ['crossbody', 'brown', 'versatile', 'everyday'],
    notes: 'Perfect everyday crossbody bag in rich cognac leather',
    price: 295,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Emerald Green Handbag',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'bag',
    color: '#50C878',
    brand: 'Bottega Veneta',
    size: 'Medium',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.WORK, Occasion.DATE, Occasion.PARTY],
    imageUri:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
    tags: ['green', '2025-trend', 'statement', 'luxury'],
    notes: 'Stunning emerald green bag following 2025 color trends',
    price: 4900,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Raffia Market Tote',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'bag',
    color: '#DEB887',
    brand: 'Banana Republic',
    size: 'Large',
    seasons: [Season.SPRING, Season.SUMMER],
    occasions: [Occasion.CASUAL, Occasion.TRAVEL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
    tags: ['raffia', 'market-tote', 'summer', 'vacation'],
    notes: 'Natural raffia market tote perfect for summer and beach days',
    price: 140,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Black Evening Clutch',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'bag',
    color: '#000000',
    brand: 'Loewe',
    size: 'Small',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER],
    occasions: [Occasion.FORMAL, Occasion.PARTY, Occasion.SPECIAL],
    imageUri:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
    tags: ['clutch', 'evening', 'formal', 'elegant'],
    notes: 'Sophisticated black clutch for evening events',
    price: 3900,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Statement Gold Necklace',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'jewelry',
    color: '#FFD700',
    brand: 'Lié Studio',
    size: 'One Size',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER],
    occasions: [Occasion.WORK, Occasion.PARTY, Occasion.DATE, Occasion.FORMAL],
    imageUri:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
    tags: ['gold', 'statement', 'jewelry', 'elegant'],
    notes: 'Bold gold statement necklace to elevate any outfit',
    price: 210,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Pearl Earrings',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'jewelry',
    color: '#FFFFFF',
    brand: 'Mikimoto',
    size: 'One Size',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER],
    occasions: [
      Occasion.WORK,
      Occasion.FORMAL,
      Occasion.SPECIAL,
      Occasion.DATE,
    ],
    imageUri:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
    tags: ['pearls', 'classic', 'elegant', 'timeless'],
    notes: 'Classic pearl earrings for timeless elegance',
    price: 450,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Black Leather Belt',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'belt',
    color: '#000000',
    brand: "Anderson's",
    size: 'M',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER],
    occasions: [Occasion.WORK, Occasion.CASUAL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
    tags: ['belt', 'leather', 'black', 'essential'],
    notes: 'Essential black leather belt with elegant buckle',
    price: 245,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Silk Scarf',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'scarf',
    color: '#4169E1',
    brand: 'Toteme',
    size: 'One Size',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.CASUAL, Occasion.WORK, Occasion.TRAVEL],
    imageUri:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
    tags: ['silk', 'scarf', 'french-style', 'versatile'],
    notes: 'Versatile silk scarf for French girl chic styling',
    price: 220,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Oversized Sunglasses',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'sunglasses',
    color: '#000000',
    brand: 'Saint Laurent',
    size: 'One Size',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL],
    occasions: [Occasion.CASUAL, Occasion.TRAVEL, Occasion.DATE],
    imageUri:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
    tags: ['sunglasses', 'oversized', 'chic', 'statement'],
    notes: 'Chic oversized sunglasses for effortless glamour',
    price: 420,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
  {
    name: 'Gold Chain Bracelet',
    category: ClothingCategory.ACCESSORIES,
    subcategory: 'jewelry',
    color: '#FFD700',
    brand: 'David Yurman',
    size: 'One Size',
    seasons: [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER],
    occasions: [Occasion.CASUAL, Occasion.WORK, Occasion.DATE, Occasion.PARTY],
    imageUri:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
    tags: ['gold', 'bracelet', 'chain', 'layering'],
    notes: 'Beautiful gold chain bracelet perfect for layering',
    price: 395,
    condition: ItemCondition.EXCELLENT,
    isForSale: false,
  },
];

// Supabase configuration
const supabaseUrl = 'https://ywbbsdqdkucrvyowukcs.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3YmJzZHFka3VjcnZ5b3d1a2NzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzkwMzQ5MiwiZXhwIjoyMDQ5NDc5NDkyfQ.fEWFOB_kS7i9FH8m2Sw31eoFEp2EvYKSgKgzF8D9V5Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  color: string;
  brand: string;
  image_url: string;
  tags: string[];
  occasions: string;
  seasons: string;
}

// Specific high-quality Unsplash URLs for each item based on exact details
const SPECIFIC_IMAGE_URLS: Record<string, string> = {
  // TOPS
  'Black Silk Camisole':
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&h=1600&fit=crop&q=85',
  'Black Turtleneck':
    'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=1200&h=1600&fit=crop&q=85',
  'Classic White Button-Down Shirt':
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&h=1600&fit=crop&q=85',
  'Cream Silk Blouse':
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=1600&fit=crop&q=85',
  'Floral Print Blouse':
    'https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=1200&h=1600&fit=crop&q=85',
  'Navy Blue Cashmere Sweater':
    'https://images.unsplash.com/photo-1556821840-3a9fbc86ea14?w=1200&h=1600&fit=crop&q=85',
  'Oversized White Cotton T-Shirt':
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=1600&fit=crop&q=85',
  'Striped Long-Sleeve Tee':
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&h=1600&fit=crop&q=85',

  // BOTTOMS
  'Beige Linen Pants':
    'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=1200&h=1600&fit=crop&q=85',
  'Black Leather Mini Skirt':
    'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=1200&h=1600&fit=crop&q=85',
  'Black Tailored Trousers':
    'https://images.unsplash.com/photo-1506629905607-45c24a02b7c0?w=1200&h=1600&fit=crop&q=85',
  'High-Waist Dark Wash Jeans':
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&h=1600&fit=crop&q=85',
  'Navy Pencil Skirt':
    'https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=1200&h=1600&fit=crop&q=85',
  'Pleated Midi Skirt':
    'https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=1200&h=1600&fit=crop&q=85',
  'White Wide-Leg Jeans':
    'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=1200&h=1600&fit=crop&q=85',

  // DRESSES
  'Emerald Green Cocktail Dress':
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&h=1600&fit=crop&q=85',
  'Floral Maxi Dress':
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&h=1600&fit=crop&q=85',
  'Knit Sweater Dress':
    'https://images.unsplash.com/photo-1566479179817-c2b6d2e98e25?w=1200&h=1600&fit=crop&q=85',
  'Little Black Dress':
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=1600&fit=crop&q=85',
  'Navy Blazer Dress':
    'https://images.unsplash.com/photo-1580219817503-25c561c3b5e4?w=1200&h=1600&fit=crop&q=85',
  'White Shirt Dress':
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=1600&fit=crop&q=85',

  // OUTERWEAR
  'Beige Trench Coat':
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=1600&fit=crop&q=85',
  'Black Leather Jacket':
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=1600&fit=crop&q=85',
  'Camel Wool Coat':
    'https://images.unsplash.com/photo-1578164842884-d8b1fd76c0d7?w=1200&h=1600&fit=crop&q=85',
  'Denim Jacket':
    'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=1200&h=1600&fit=crop&q=85',
  'Navy Blazer':
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1600&fit=crop&q=85',

  // SHOES
  'Beige Ballet Flats':
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&h=800&fit=crop&q=85',
  'Black Leather Ankle Boots':
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=1200&h=800&fit=crop&q=85',
  'Black Strappy Sandals':
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&h=800&fit=crop&q=85',
  'Brown Knee-High Boots':
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=1200&h=800&fit=crop&q=85',
  'Cognac Leather Loafers':
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&h=800&fit=crop&q=85',
  'Espadrille Wedges':
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&h=800&fit=crop&q=85',
  'Nude Pointed-Toe Pumps':
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&h=800&fit=crop&q=85',
  'White Sneakers':
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&h=800&fit=crop&q=85',

  // ACCESSORIES
  'Black Evening Clutch':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Black Leather Belt':
    'https://images.unsplash.com/photo-1571019613540-996a1b4ffbec?w=1200&h=800&fit=crop&q=85',
  'Black Leather Tote Bag':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Cognac Brown Crossbody Bag':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Emerald Green Handbag':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Gold Chain Bracelet':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=800&fit=crop&q=85',
  'Oversized Sunglasses':
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200&h=800&fit=crop&q=85',
  'Pearl Earrings':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=800&fit=crop&q=85',
  'Raffia Market Tote':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Silk Scarf':
    'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=1200&h=800&fit=crop&q=85',
  'Statement Gold Necklace':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=800&fit=crop&q=85',
};

async function downloadImage(url: string): Promise<Buffer> {
  console.log(`📥 Downloading from: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`✅ Downloaded ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error(`❌ Download failed:`, error);
    throw error as Error;
  }
}

async function uploadToSupabaseStorage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    console.log(`📤 Uploading ${filename} to Supabase Storage...`);

    const { data, error } = await supabase.storage
      .from('wardrobe-images')
      .upload(`items/${filename}`, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('wardrobe-images')
      .getPublicUrl(`items/${filename}`);

    console.log(`✅ Uploaded to: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Upload failed for ${filename}:`, error);
    throw error as Error;
  }
}

async function updateItemImageUrl(
  itemId: string,
  newImageUrl: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('clothing_items')
      .update({ image_url: newImageUrl })
      .eq('id', itemId);

    if (error) {
      throw new Error(`Database update error: ${error.message}`);
    }

    console.log(`✅ Updated database for item ${itemId}`);
  } catch (error) {
    console.error(`❌ Database update failed for ${itemId}:`, error);
    throw error as Error;
  }
}

async function processAllItems() {
  console.log('🚀 Starting image download and upload process...\n');

  // Get all items from database
  const { data: items, error } = await supabase
    .from('clothing_items')
    .select('id, name, category, subcategory')
    .eq('user_id', 'f65547d7-6b51-4606-8a15-f292f6453f34')
    .order('category', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch items:', error);
    return;
  }

  console.log(`📋 Found ${items.length} items to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    try {
      console.log(`\n🔄 Processing: ${item.name} (${item.category})`);

      const imageUrl = SPECIFIC_IMAGE_URLS[item.name];
      if (!imageUrl) {
        console.log(`⚠️  No specific image URL found for: ${item.name}`);
        continue;
      }

      // Download image
      const imageBuffer = await downloadImage(imageUrl);

      // Generate filename
      const filename = `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${item.id.substring(0, 8)}.jpg`;

      // Upload to Supabase Storage
      const supabaseUrl = await uploadToSupabaseStorage(imageBuffer, filename);

      // Update database
      await updateItemImageUrl(item.id, supabaseUrl);

      successCount++;
      console.log(`✅ Successfully processed: ${item.name}`);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to process ${item.name}:`, error);
      errorCount++;
    }
  }

  console.log(`\n🎉 Process completed!`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${items.length}`);
}

// Run the process
processAllItems().catch(console.error);

// Function to add all items to the wardrobe
export async function addWardrobeItems() {
  console.log('Starting to add wardrobe items...');

  const results = [];

  for (let i = 0; i < wardrobeItems.length; i++) {
    const item = wardrobeItems[i];
    console.log(`Adding item ${i + 1}/${wardrobeItems.length}: ${item.name}`);

    try {
      const result = await wardrobeService.createClothingItem(item);

      if (result.error) {
        console.error(`Failed to add ${item.name}:`, result.error);
        results.push({ success: false, item: item.name, error: result.error });
      } else {
        console.log(`Successfully added: ${item.name}`);
        results.push({ success: true, item: item.name, data: result.data });
      }
    } catch (error) {
      console.error(`Error adding ${item.name}:`, error);
      results.push({ success: false, item: item.name, error: error.message });
    }

    // Add a small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('Finished adding wardrobe items');
  console.log('Results summary:');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successfully added: ${successful} items`);
  console.log(`❌ Failed to add: ${failed} items`);

  if (failed > 0) {
    console.log('Failed items:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`- ${r.item}: ${r.error}`);
      });
  }

  return results;
}

// Function to add a single item (for testing)
export async function addSingleItem(index: number = 0) {
  if (index >= wardrobeItems.length) {
    console.error('Index out of range');
    return;
  }

  const item = wardrobeItems[index];
  console.log(`Adding: ${item.name}`);

  try {
    const result = await wardrobeService.createClothingItem(item);

    if (result.error) {
      console.error(`Failed to add ${item.name}:`, result.error);
      return { success: false, error: result.error };
    } else {
      console.log(`Successfully added: ${item.name}`);
      return { success: true, data: result.data };
    }
  } catch (error) {
    console.error(`Error adding ${item.name}:`, error);
    return { success: false, error: error.message };
  }
}

export { wardrobeItems };
