import { ClothingItem } from '../types/wardrobe';

// Cache to track generated names and prevent duplicates
const usedNames = new Set<string>();

// Simple hash function to create a consistent seed from outfit content
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Seeded random number generator
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Get a deterministic random item from array based on seed
function getSeededRandomItem<T>(array: T[], seed: number): T {
  const index = Math.floor(seededRandom(seed) * array.length);
  return array[index];
}

// Generate a unique name by adding suffixes if needed
function ensureUniqueName(
  baseName: string,
  usedNamesSet?: Set<string>
): string {
  const namesToCheck = usedNamesSet || usedNames;

  if (!namesToCheck.has(baseName)) {
    namesToCheck.add(baseName);
    return baseName;
  }

  // If base name is taken, try with Roman numerals first (more elegant)
  const romanNumerals = [
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
  ];

  for (const numeral of romanNumerals) {
    const nameWithNumeral = `${baseName} ${numeral}`;
    if (!namesToCheck.has(nameWithNumeral)) {
      namesToCheck.add(nameWithNumeral);
      return nameWithNumeral;
    }
  }

  // If all Roman numerals are taken, use regular numbers
  let counter = 2;
  while (counter <= 99) {
    const nameWithNumber = `${baseName} ${counter}`;
    if (!namesToCheck.has(nameWithNumber)) {
      namesToCheck.add(nameWithNumber);
      return nameWithNumber;
    }
    counter++;
  }

  // Fallback with timestamp (should never reach here in normal usage)
  const fallbackName = `${baseName} ${Date.now() % 10000}`;
  namesToCheck.add(fallbackName);
  return fallbackName;
}

// Name templates for different styles and occasions
const NAME_TEMPLATES = {
  casual: [
    'Weekend Vibes',
    'Chill Mode',
    'Easy Breeze',
    'Laid Back',
    'Sunday Stroll',
    'Coffee Run',
    'Comfort Zone',
    'Relax & Roll',
    'Casual Cool',
    'Everyday Style',
    'Simple Chic',
    'Effortless Look',
  ],
  work: [
    'Boss Mode',
    'Power Play',
    'Office Chic',
    'Meeting Ready',
    'Pro Status',
    'Work Flow',
    'Business Edge',
    'Sharp Focus',
    'Executive Style',
    'Corporate Chic',
    'Professional Power',
    'Boardroom Ready',
  ],
  formal: [
    'Elegance',
    'Refined',
    'Sophisticated',
    'Classic Grace',
    'Timeless',
    'Polished',
    'Distinguished',
    'Luxe Appeal',
    'Formal Finesse',
    'Evening Elegance',
    'Black Tie Ready',
    'Gala Glamour',
  ],
  party: [
    'Night Out',
    'Party Ready',
    'Celebration',
    'Dance Floor',
    'Show Stopper',
    'Glamour',
    'Statement',
    'Sparkle',
    'Party Perfect',
    'Night Magic',
    'Festive Fun',
    'Club Ready',
  ],
  sport: [
    'Active Mode',
    'Workout Ready',
    'Sporty Edge',
    'Fitness Focus',
    'Athletic',
    'Power Move',
    'Dynamic',
    'Energy Boost',
    'Gym Ready',
    'Sports Star',
    'Active Lifestyle',
    'Fitness First',
  ],
  travel: [
    'Wanderlust',
    'Journey Ready',
    'Explorer',
    'Adventure',
    'On the Go',
    'Traveler',
    'Discovery',
    'Roam Free',
    'Vacation Vibes',
    'Travel Style',
    'Adventure Ready',
    'Jet Set',
  ],
  date: [
    'Date Night',
    'Romance',
    'Sweet Spot',
    'Charming',
    'Flirty',
    'Enchanting',
    'Dreamy',
    'Heart Skip',
    'Love Story',
    'Romantic Rendezvous',
    'Sweet Romance',
    'Date Perfect',
  ],
  special: [
    'Special Moment',
    'Occasion',
    'Memorable',
    'Milestone',
    'Celebration',
    'Unforgettable',
    'Unique',
    'Distinctive',
    'Once in a Lifetime',
    'Grand Occasion',
    'Special Event',
    'Milestone Magic',
  ],
};

// Season-based modifiers (expanded for more variety)
const SEASON_MODIFIERS = {
  spring: [
    'Fresh',
    'Bloom',
    'Renewal',
    'Garden',
    'Awakening',
    'Breezy',
    'Flourishing',
    'Vibrant',
  ],
  summer: [
    'Sunny',
    'Bright',
    'Tropical',
    'Radiant',
    'Golden',
    'Vibrant',
    'Warm',
    'Luminous',
  ],
  fall: [
    'Cozy',
    'Warm',
    'Autumn',
    'Rustic',
    'Harvest',
    'Earthy',
    'Crisp',
    'Rich',
  ],
  winter: [
    'Crisp',
    'Cool',
    'Frost',
    'Snow',
    'Arctic',
    'Ice',
    'Chilly',
    'Frosty',
  ],
};

// Color-based adjectives (expanded for more variety)
const COLOR_ADJECTIVES = {
  black: [
    'Midnight',
    'Shadow',
    'Obsidian',
    'Onyx',
    'Noir',
    'Eclipse',
    'Charcoal',
    'Raven',
  ],
  white: [
    'Pure',
    'Snow',
    'Pearl',
    'Cloud',
    'Ivory',
    'Crystal',
    'Pristine',
    'Angelic',
  ],
  gray: ['Storm', 'Steel', 'Ash', 'Slate', 'Fog', 'Stone', 'Silver', 'Misty'],
  red: [
    'Fire',
    'Cherry',
    'Crimson',
    'Rose',
    'Ruby',
    'Flame',
    'Scarlet',
    'Burgundy',
  ],
  blue: [
    'Ocean',
    'Sky',
    'Sapphire',
    'Navy',
    'Azure',
    'Denim',
    'Cobalt',
    'Royal',
  ],
  green: ['Forest', 'Emerald', 'Mint', 'Sage', 'Olive', 'Jade', 'Moss', 'Pine'],
  yellow: [
    'Sunshine',
    'Gold',
    'Lemon',
    'Honey',
    'Amber',
    'Citrus',
    'Butter',
    'Canary',
  ],
  orange: [
    'Sunset',
    'Tangerine',
    'Copper',
    'Coral',
    'Peach',
    'Flame',
    'Papaya',
    'Ginger',
  ],
  pink: [
    'Blush',
    'Rose',
    'Petal',
    'Soft',
    'Candy',
    'Ballet',
    'Blossom',
    'Rosy',
  ],
  purple: [
    'Lavender',
    'Plum',
    'Violet',
    'Amethyst',
    'Mauve',
    'Grape',
    'Orchid',
    'Lilac',
  ],
  brown: [
    'Chocolate',
    'Caramel',
    'Coffee',
    'Mocha',
    'Toffee',
    'Espresso',
    'Cocoa',
    'Mahogany',
  ],
};

// Style-based descriptors (expanded for more variety)
const STYLE_DESCRIPTORS = [
  'Chic',
  'Sleek',
  'Modern',
  'Classic',
  'Edgy',
  'Soft',
  'Bold',
  'Minimal',
  'Statement',
  'Effortless',
  'Polished',
  'Trendy',
  'Sophisticated',
  'Playful',
  'Elegant',
  'Sharp',
];

export function generateOutfitName(
  items: ClothingItem[],
  existingNames?: string[]
): string {
  if (!items || items.length === 0) {
    return ensureUniqueName('Mystery Look');
  }

  // Create a set of existing names to check against
  const existingNamesSet = existingNames ? new Set(existingNames) : undefined;

  // Create a consistent seed based on outfit content
  const outfitSignature = items
    .map(item => `${item.id}-${item.category}-${item.color}`)
    .sort() // Sort to ensure consistent order
    .join('|');

  const baseSeed = hashString(outfitSignature);

  // Determine the primary occasion
  const occasions = items.flatMap(item => item.occasion);
  const primaryOccasion = getMostFrequent(occasions) || 'casual';

  // Determine the primary season
  const seasons = items.flatMap(item => item.season);
  const primarySeason = getMostFrequent(seasons);

  // Get dominant colors
  const colors = items.map(item => item.color.toLowerCase());
  const dominantColor = getMostFrequent(colors);

  // Get a base name from the occasion using seeded random
  const baseNames =
    NAME_TEMPLATES[primaryOccasion as keyof typeof NAME_TEMPLATES] ||
    NAME_TEMPLATES.casual;
  const baseName = getSeededRandomItem(baseNames, baseSeed);

  // Use different parts of the seed for different decisions
  const modifierSeed = baseSeed + 1;
  const colorSeed = baseSeed + 2;
  const styleSeed = baseSeed + 3;
  const orderSeed = baseSeed + 4;

  // 40% chance to add a season modifier
  let modifier = '';
  if (primarySeason && seededRandom(modifierSeed) < 0.4) {
    const seasonMods =
      SEASON_MODIFIERS[primarySeason as keyof typeof SEASON_MODIFIERS];
    if (seasonMods) {
      modifier = getSeededRandomItem(seasonMods, modifierSeed);
    }
  }

  // 30% chance to add a color adjective
  if (!modifier && dominantColor && seededRandom(colorSeed) < 0.3) {
    const colorAdjs =
      COLOR_ADJECTIVES[dominantColor as keyof typeof COLOR_ADJECTIVES];
    if (colorAdjs) {
      modifier = getSeededRandomItem(colorAdjs, colorSeed);
    }
  }

  // 20% chance to add a style descriptor
  if (!modifier && seededRandom(styleSeed) < 0.2) {
    modifier = getSeededRandomItem(STYLE_DESCRIPTORS, styleSeed);
  }

  // Combine the parts
  let finalName: string;
  if (modifier && seededRandom(orderSeed) < 0.7) {
    // 70% chance to put modifier first, 30% to put it after
    finalName =
      seededRandom(orderSeed + 1) < 0.7
        ? `${modifier} ${baseName}`
        : `${baseName} ${modifier}`;
  } else {
    finalName = baseName;
  }

  // Ensure the name is unique
  return ensureUniqueName(finalName, existingNamesSet);
}

function getMostFrequent<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;

  const frequency = array.reduce(
    (acc, item) => {
      acc[item as string] = (acc[item as string] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.keys(frequency).reduce((a, b) =>
    frequency[a] > frequency[b] ? a : b
  ) as T;
}

// Helper function to get a name with a specific style preference
export function generateStyledOutfitName(
  items: ClothingItem[],
  style: 'modern' | 'classic' | 'edgy' | 'minimal' | 'bold' = 'modern',
  existingNames?: string[]
): string {
  const baseName = generateOutfitName(items, existingNames);

  // Create seed based on outfit content for consistency
  const outfitSignature = items
    .map(item => `${item.id}-${item.category}`)
    .sort()
    .join('|');
  const seed = hashString(outfitSignature + style);

  const styleModifiers = {
    modern: ['Sleek', 'Contemporary', 'Fresh', 'Current'],
    classic: ['Timeless', 'Traditional', 'Elegant', 'Refined'],
    edgy: ['Bold', 'Fierce', 'Statement', 'Dramatic'],
    minimal: ['Clean', 'Simple', 'Pure', 'Essential'],
    bold: ['Striking', 'Vibrant', 'Dynamic', 'Powerful'],
  };

  const modifier = getSeededRandomItem(styleModifiers[style], seed);

  // 50% chance to add the style modifier
  if (seededRandom(seed) < 0.5) {
    const styledName = `${modifier} ${baseName}`;
    return ensureUniqueName(
      styledName,
      existingNames ? new Set(existingNames) : undefined
    );
  }

  return baseName;
}

// Utility function to clear the cache (useful for testing or when starting fresh)
export function clearNamesCache(): void {
  usedNames.clear();
}

// Utility function to get current cache size (for debugging)
export function getCacheSize(): number {
  return usedNames.size;
}
