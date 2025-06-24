# Outfit Generation Algorithm Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Stylisto outfit generation algorithm, covering accuracy validation, performance optimization, and user experience testing.

## Testing Categories

### 1. Color Theory Testing

#### Color Harmony Testing
```typescript
describe('Color Harmony', () => {
  test('identifies monochromatic color schemes correctly', () => {
    const monochromaticOutfit = [
      { color: '#000000' }, // Black
      { color: '#333333' }, // Dark gray
      { color: '#666666' }, // Medium gray
    ];
    
    const harmonyType = determineColorHarmony(monochromaticOutfit.map(item => item.color));
    expect(harmonyType).toBe(COLOR_HARMONY.MONOCHROMATIC);
  });

  test('identifies analogous color schemes correctly', () => {
    const analogousOutfit = [
      { color: '#FF0000' }, // Red
      { color: '#FF8000' }, // Orange
      { color: '#FFFF00' }, // Yellow
    ];
    
    const harmonyType = determineColorHarmony(analogousOutfit.map(item => item.color));
    expect(harmonyType).toBe(COLOR_HARMONY.ANALOGOUS);
  });

  test('identifies complementary color schemes correctly', () => {
    const complementaryOutfit = [
      { color: '#FF0000' }, // Red
      { color: '#00FFFF' }, // Cyan (complement of red)
    ];
    
    const harmonyType = determineColorHarmony(complementaryOutfit.map(item => item.color));
    expect(harmonyType).toBe(COLOR_HARMONY.COMPLEMENTARY);
  });

  test('identifies triadic color schemes correctly', () => {
    const triadicOutfit = [
      { color: '#FF0000' }, // Red
      { color: '#00FF00' }, // Green
      { color: '#0000FF' }, // Blue
    ];
    
    const harmonyType = determineColorHarmony(triadicOutfit.map(item => item.color));
    expect(harmonyType).toBe(COLOR_HARMONY.TRIADIC);
  });

  test('handles neutral colors appropriately', () => {
    const neutralOutfit = [
      { color: '#000000' }, // Black
      { color: '#FFFFFF' }, // White
      { color: '#808080' }, // Gray
    ];
    
    const harmonyType = determineColorHarmony(neutralOutfit.map(item => item.color));
    expect(harmonyType).toBe(COLOR_HARMONY.NEUTRAL);
  });

  test('calculates color harmony score correctly', () => {
    // Test with harmonious colors
    const harmonious = [
      { color: '#FF0000', category: 'tops' }, // Red
      { color: '#0000FF', category: 'bottoms' }, // Blue
    ];
    
    const harmoniousScore = calculateColorHarmonyScore(harmonious);
    expect(harmoniousScore).toBeGreaterThanOrEqual(0.7);
    
    // Test with clashing colors
    const clashing = [
      { color: '#FF00FF', category: 'tops' }, // Magenta
      { color: '#FF8000', category: 'bottoms' }, // Orange
    ];
    
    const clashingScore = calculateColorHarmonyScore(clashing);
    expect(clashingScore).toBeLessThan(0.7);
  });
});
```

#### Color Conversion Testing
```typescript
describe('Color Conversion', () => {
  test('converts hex to HSL correctly', () => {
    const testCases = [
      { hex: '#FF0000', hsl: { h: 0, s: 1, l: 0.5 } },     // Red
      { hex: '#00FF00', hsl: { h: 120, s: 1, l: 0.5 } },   // Green
      { hex: '#0000FF', hsl: { h: 240, s: 1, l: 0.5 } },   // Blue
      { hex: '#FFFF00', hsl: { h: 60, s: 1, l: 0.5 } },    // Yellow
      { hex: '#FF00FF', hsl: { h: 300, s: 1, l: 0.5 } },   // Magenta
      { hex: '#00FFFF', hsl: { h: 180, s: 1, l: 0.5 } },   // Cyan
      { hex: '#FFFFFF', hsl: { h: 0, s: 0, l: 1 } },       // White
      { hex: '#000000', hsl: { h: 0, s: 0, l: 0 } },       // Black
    ];
    
    testCases.forEach(({ hex, hsl }) => {
      const result = hexToHSL(hex);
      expect(result.h).toBeCloseTo(hsl.h, 0);
      expect(result.s).toBeCloseTo(hsl.s, 1);
      expect(result.l).toBeCloseTo(hsl.l, 1);
    });
  });

  test('converts HSL to hex correctly', () => {
    const testCases = [
      { hsl: { h: 0, s: 1, l: 0.5 }, hex: '#FF0000' },     // Red
      { hsl: { h: 120, s: 1, l: 0.5 }, hex: '#00FF00' },   // Green
      { hsl: { h: 240, s: 1, l: 0.5 }, hex: '#0000FF' },   // Blue
      { hsl: { h: 60, s: 1, l: 0.5 }, hex: '#FFFF00' },    // Yellow
      { hsl: { h: 300, s: 1, l: 0.5 }, hex: '#FF00FF' },   // Magenta
      { hsl: { h: 180, s: 1, l: 0.5 }, hex: '#00FFFF' },   // Cyan
      { hsl: { h: 0, s: 0, l: 1 }, hex: '#FFFFFF' },       // White
      { hsl: { h: 0, s: 0, l: 0 }, hex: '#000000' },       // Black
    ];
    
    testCases.forEach(({ hsl, hex }) => {
      const result = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(result.toLowerCase()).toBe(hex.toLowerCase());
    });
  });

  test('calculates color distance correctly', () => {
    // Similar colors should have small distance
    const red1 = hexToHSL('#FF0000');
    const red2 = hexToHSL('#FF3333');
    const redDistance = calculateColorDistance(red1, red2);
    
    // Different colors should have large distance
    const red = hexToHSL('#FF0000');
    const blue = hexToHSL('#0000FF');
    const redBlueDistance = calculateColorDistance(red, blue);
    
    expect(redDistance).toBeLessThan(redBlueDistance);
  });
});
```

### 2. Style Matching Testing

#### Style Compatibility Testing
```typescript
describe('Style Matching', () => {
  test('matches formal items together', () => {
    const formalTop = {
      id: '1',
      category: 'tops',
      occasion: ['formal', 'work'],
      tags: ['dress shirt', 'button-up'],
      color: '#FFFFFF',
    };
    
    const formalBottom = {
      id: '2',
      category: 'bottoms',
      occasion: ['formal', 'work'],
      tags: ['slacks', 'dress pants'],
      color: '#000000',
    };
    
    const casualBottom = {
      id: '3',
      category: 'bottoms',
      occasion: ['casual'],
      tags: ['jeans', 'distressed'],
      color: '#0000FF',
    };
    
    // Test if formal items are compatible
    expect(isItemCompatible(formalBottom, [formalTop])).toBe(true);
    
    // Test if formal and casual items are less compatible
    const formalCasualScore = calculateItemCompatibilityScore(casualBottom, [formalTop]);
    const formalFormalScore = calculateItemCompatibilityScore(formalBottom, [formalTop]);
    
    expect(formalFormalScore).toBeGreaterThan(formalCasualScore);
  });

  test('calculates style matching score correctly', () => {
    const outfit = [
      {
        id: '1',
        category: 'tops',
        occasion: ['formal', 'work'],
        tags: ['dress shirt', 'button-up'],
        color: '#FFFFFF',
      },
      {
        id: '2',
        category: 'bottoms',
        occasion: ['formal', 'work'],
        tags: ['slacks', 'dress pants'],
        color: '#000000',
      },
    ];
    
    // Test with matching style preference
    const formalPreference = {
      formality: 0.8,
      boldness: 0.3,
      layering: 0.5,
      colorfulness: 0.4,
    };
    
    const casualPreference = {
      formality: 0.2,
      boldness: 0.7,
      layering: 0.5,
      colorfulness: 0.8,
    };
    
    const formalScore = calculateStyleMatchingScore(outfit, formalPreference);
    const casualScore = calculateStyleMatchingScore(outfit, casualPreference);
    
    // Formal outfit should score higher with formal preference
    expect(formalScore).toBeGreaterThan(casualScore);
  });
});
```

### 3. Occasion and Season Testing

#### Occasion Suitability Testing
```typescript
describe('Occasion Suitability', () => {
  test('scores outfits correctly for target occasions', () => {
    const formalOutfit = [
      {
        id: '1',
        category: 'tops',
        occasion: ['formal', 'work'],
        season: ['spring', 'fall'],
        color: '#FFFFFF',
      },
      {
        id: '2',
        category: 'bottoms',
        occasion: ['formal', 'work'],
        season: ['spring', 'fall', 'winter'],
        color: '#000000',
      },
    ];
    
    const casualOutfit = [
      {
        id: '3',
        category: 'tops',
        occasion: ['casual', 'sport'],
        season: ['summer', 'spring'],
        color: '#FF0000',
      },
      {
        id: '4',
        category: 'bottoms',
        occasion: ['casual'],
        season: ['summer', 'spring'],
        color: '#0000FF',
      },
    ];
    
    // Test formal occasion
    const formalScoreForFormal = calculateOccasionSuitabilityScore(formalOutfit, 'formal');
    const casualScoreForFormal = calculateOccasionSuitabilityScore(casualOutfit, 'formal');
    
    expect(formalScoreForFormal).toBe(1); // All items suitable
    expect(casualScoreForFormal).toBe(0); // No items suitable
    
    // Test casual occasion
    const formalScoreForCasual = calculateOccasionSuitabilityScore(formalOutfit, 'casual');
    const casualScoreForCasual = calculateOccasionSuitabilityScore(casualOutfit, 'casual');
    
    expect(formalScoreForCasual).toBe(0); // No items suitable
    expect(casualScoreForCasual).toBe(1); // All items suitable
    
    // Test work occasion
    const formalScoreForWork = calculateOccasionSuitabilityScore(formalOutfit, 'work');
    const casualScoreForWork = calculateOccasionSuitabilityScore(casualOutfit, 'work');
    
    expect(formalScoreForWork).toBe(1); // All items suitable
    expect(casualScoreForWork).toBe(0); // No items suitable
  });
});
```

#### Season Suitability Testing
```typescript
describe('Season Suitability', () => {
  test('scores outfits correctly for target seasons', () => {
    const winterOutfit = [
      {
        id: '1',
        category: 'tops',
        occasion: ['casual'],
        season: ['winter', 'fall'],
        color: '#000000',
      },
      {
        id: '2',
        category: 'bottoms',
        occasion: ['casual'],
        season: ['winter', 'fall'],
        color: '#0000FF',
      },
      {
        id: '3',
        category: 'outerwear',
        occasion: ['casual'],
        season: ['winter'],
        color: '#808080',
      },
    ];
    
    const summerOutfit = [
      {
        id: '4',
        category: 'tops',
        occasion: ['casual'],
        season: ['summer', 'spring'],
        color: '#FFFFFF',
      },
      {
        id: '5',
        category: 'bottoms',
        occasion: ['casual'],
        season: ['summer', 'spring'],
        color: '#FF0000',
      },
    ];
    
    // Test winter season
    const winterScoreForWinter = calculateSeasonSuitabilityScore(winterOutfit, 'winter');
    const summerScoreForWinter = calculateSeasonSuitabilityScore(summerOutfit, 'winter');
    
    expect(winterScoreForWinter).toBe(1); // All items suitable
    expect(summerScoreForWinter).toBe(0); // No items suitable
    
    // Test summer season
    const winterScoreForSummer = calculateSeasonSuitabilityScore(winterOutfit, 'summer');
    const summerScoreForSummer = calculateSeasonSuitabilityScore(summerOutfit, 'summer');
    
    expect(winterScoreForSummer).toBe(0); // No items suitable
    expect(summerScoreForSummer).toBe(1); // All items suitable
    
    // Test fall season (partial match)
    const winterScoreForFall = calculateSeasonSuitabilityScore(winterOutfit, 'fall');
    
    expect(winterScoreForFall).toBeGreaterThan(0.6); // Most items suitable
  });
});
```

### 4. Weather Suitability Testing

#### Temperature Appropriateness Testing
```typescript
describe('Weather Suitability', () => {
  test('recommends appropriate outfits for cold weather', () => {
    const coldWeather = {
      temperature: 5,
      conditions: 'clear',
      precipitation: 0,
      humidity: 0.5,
      windSpeed: 10,
    };
    
    const winterOutfit = [
      {
        id: '1',
        category: 'tops',
        tags: ['long sleeve', 'sweater'],
        season: ['winter', 'fall'],
        color: '#000000',
      },
      {
        id: '2',
        category: 'bottoms',
        tags: ['jeans', 'thick'],
        season: ['winter', 'fall'],
        color: '#0000FF',
      },
      {
        id: '3',
        category: 'outerwear',
        tags: ['jacket', 'warm'],
        season: ['winter'],
        color: '#808080',
      },
    ];
    
    const summerOutfit = [
      {
        id: '4',
        category: 'tops',
        tags: ['t-shirt', 'short sleeve'],
        season: ['summer', 'spring'],
        color: '#FFFFFF',
      },
      {
        id: '5',
        category: 'bottoms',
        tags: ['shorts'],
        season: ['summer', 'spring'],
        color: '#FF0000',
      },
    ];
    
    const winterScore = calculateWeatherSuitabilityScore(winterOutfit, coldWeather);
    const summerScore = calculateWeatherSuitabilityScore(summerOutfit, coldWeather);
    
    expect(winterScore).toBeGreaterThan(0.8); // Very suitable
    expect(summerScore).toBeLessThan(0.4); // Not suitable
  });

  test('recommends appropriate outfits for hot weather', () => {
    const hotWeather = {
      temperature: 32,
      conditions: 'clear',
      precipitation: 0,
      humidity: 0.6,
      windSpeed: 5,
    };
    
    const winterOutfit = [
      {
        id: '1',
        category: 'tops',
        tags: ['long sleeve', 'sweater'],
        season: ['winter', 'fall'],
        color: '#000000',
      },
      {
        id: '2',
        category: 'bottoms',
        tags: ['jeans', 'thick'],
        season: ['winter', 'fall'],
        color: '#0000FF',
      },
      {
        id: '3',
        category: 'outerwear',
        tags: ['jacket', 'warm'],
        season: ['winter'],
        color: '#808080',
      },
    ];
    
    const summerOutfit = [
      {
        id: '4',
        category: 'tops',
        tags: ['t-shirt', 'short sleeve'],
        season: ['summer', 'spring'],
        color: '#FFFFFF',
      },
      {
        id: '5',
        category: 'bottoms',
        tags: ['shorts'],
        season: ['summer', 'spring'],
        color: '#FF0000',
      },
    ];
    
    const winterScore = calculateWeatherSuitabilityScore(winterOutfit, hotWeather);
    const summerScore = calculateWeatherSuitabilityScore(summerOutfit, hotWeather);
    
    expect(winterScore).toBeLessThan(0.4); // Not suitable
    expect(summerScore).toBeGreaterThan(0.8); // Very suitable
  });

  test('considers precipitation in weather suitability', () => {
    const rainyWeather = {
      temperature: 15,
      conditions: 'rainy',
      precipitation: 0.8,
      humidity: 0.9,
      windSpeed: 15,
    };
    
    const rainReadyOutfit = [
      {
        id: '1',
        category: 'tops',
        tags: ['long sleeve'],
        season: ['spring', 'fall'],
        color: '#000000',
      },
      {
        id: '2',
        category: 'bottoms',
        tags: ['jeans'],
        season: ['spring', 'fall'],
        color: '#0000FF',
      },
      {
        id: '3',
        category: 'outerwear',
        tags: ['raincoat', 'waterproof'],
        season: ['spring', 'fall'],
        color: '#808080',
      },
    ];
    
    const regularOutfit = [
      {
        id: '4',
        category: 'tops',
        tags: ['long sleeve'],
        season: ['spring', 'fall'],
        color: '#000000',
      },
      {
        id: '5',
        category: 'bottoms',
        tags: ['jeans'],
        season: ['spring', 'fall'],
        color: '#0000FF',
      },
      // No raincoat or waterproof item
    ];
    
    const rainReadyScore = calculateWeatherSuitabilityScore(rainReadyOutfit, rainyWeather);
    const regularScore = calculateWeatherSuitabilityScore(regularOutfit, rainyWeather);
    
    expect(rainReadyScore).toBeGreaterThan(regularScore);
  });
});
```

### 5. Variety Testing

#### Outfit Diversity Testing
```typescript
describe('Outfit Variety', () => {
  test('avoids generating similar outfits', () => {
    // Clear recently generated outfits
    outfitGenerator.recentlyGeneratedOutfits.clear();
    
    const items = [
      // Create a variety of tops, bottoms, etc.
      // ...
    ];
    
    // Generate first set of outfits
    const firstBatch = outfitGenerator.generateOutfits(items, { maxResults: 5 });
    
    // Generate second set of outfits
    const secondBatch = outfitGenerator.generateOutfits(items, { maxResults: 5 });
    
    // Check that outfits are different
    const firstOutfitIds = firstBatch.map(outfit => outfit.items.map(item => item.id).sort().join('|'));
    const secondOutfitIds = secondBatch.map(outfit => outfit.items.map(item => item.id).sort().join('|'));
    
    // Count common outfits
    const commonOutfits = firstOutfitIds.filter(id => secondOutfitIds.includes(id));
    
    // Should have few or no common outfits
    expect(commonOutfits.length).toBeLessThan(2);
  });

  test('calculates outfit similarity correctly', () => {
    const outfit1Key = 'item1|item2|item3';
    const outfit2Key = 'item1|item2|item4';
    const outfit3Key = 'item5|item6|item7';
    
    const similarity12 = calculateOutfitSimilarity(outfit1Key, outfit2Key);
    const similarity13 = calculateOutfitSimilarity(outfit1Key, outfit3Key);
    
    // Outfits 1 and 2 share 2 out of 3 items
    expect(similarity12).toBeCloseTo(2/3, 1);
    
    // Outfits 1 and 3 share 0 items
    expect(similarity13).toBe(0);
  });

  test('ensures variety in selected outfits', () => {
    const similarOutfits = [
      {
        items: [
          { id: 'item1', category: 'tops' },
          { id: 'item2', category: 'bottoms' },
        ],
        score: { total: 0.9, breakdown: {} },
      },
      {
        items: [
          { id: 'item1', category: 'tops' },
          { id: 'item3', category: 'bottoms' },
        ],
        score: { total: 0.85, breakdown: {} },
      },
      {
        items: [
          { id: 'item4', category: 'tops' },
          { id: 'item5', category: 'bottoms' },
        ],
        score: { total: 0.8, breakdown: {} },
      },
    ];
    
    const diverseOutfits = ensureOutfitVariety(similarOutfits);
    
    // Should select the highest scoring outfit from similar ones
    // plus the different outfit
    expect(diverseOutfits.length).toBe(2);
    expect(diverseOutfits[0].score.total).toBe(0.9);
    expect(diverseOutfits[1].items.some(item => item.id === 'item4')).toBe(true);
  });
});
```

### 6. Performance Testing

#### Generation Speed Testing
```typescript
describe('Performance', () => {
  test('generates outfits within time limit', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `item${i}`,
      category: i % 5 === 0 ? 'tops' : 
               i % 5 === 1 ? 'bottoms' : 
               i % 5 === 2 ? 'shoes' : 
               i % 5 === 3 ? 'outerwear' : 'accessories',
      occasion: ['casual', 'work'],
      season: ['spring', 'summer', 'fall', 'winter'],
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      tags: [],
    }));
    
    const startTime = performance.now();
    
    const outfits = outfitGenerator.generateOutfits(items, { maxResults: 5 });
    
    const endTime = performance.now();
    const generationTime = endTime - startTime;
    
    // Should generate outfits in under 3 seconds
    expect(generationTime).toBeLessThan(3000);
    expect(outfits.length).toBeGreaterThan(0);
  });

  test('scales well with wardrobe size', () => {
    // Test with different wardrobe sizes
    const wardrobeSizes = [10, 50, 100, 200];
    const times: number[] = [];
    
    for (const size of wardrobeSizes) {
      const items = Array.from({ length: size }, (_, i) => ({
        id: `item${i}`,
        category: i % 5 === 0 ? 'tops' : 
                 i % 5 === 1 ? 'bottoms' : 
                 i % 5 === 2 ? 'shoes' : 
                 i % 5 === 3 ? 'outerwear' : 'accessories',
        occasion: ['casual', 'work'],
        season: ['spring', 'summer', 'fall', 'winter'],
        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
        tags: [],
      }));
      
      const startTime = performance.now();
      outfitGenerator.generateOutfits(items, { maxResults: 3 });
      const endTime = performance.now();
      
      times.push(endTime - startTime);
    }
    
    // Check that time doesn't grow exponentially
    // (should be roughly linear or n*log(n))
    const ratio1 = times[1] / times[0]; // 50/10 items
    const ratio2 = times[3] / times[1]; // 200/50 items
    
    // The ratio of time increase should be less than the ratio of size increase
    expect(ratio2).toBeLessThan(ratio1 * 2);
  });
});
```

#### Memory Usage Testing
```typescript
describe('Memory Usage', () => {
  test('maintains reasonable memory usage', () => {
    // This is a simplified test - in a real environment you'd use
    // more sophisticated memory profiling tools
    
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: `item${i}`,
      category: i % 5 === 0 ? 'tops' : 
               i % 5 === 1 ? 'bottoms' : 
               i % 5 === 2 ? 'shoes' : 
               i % 5 === 3 ? 'outerwear' : 'accessories',
      occasion: ['casual', 'work'],
      season: ['spring', 'summer', 'fall', 'winter'],
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      tags: [],
    }));
    
    // Measure memory before
    const memoryBefore = process.memoryUsage().heapUsed;
    
    // Generate outfits multiple times
    for (let i = 0; i < 10; i++) {
      outfitGenerator.generateOutfits(items, { maxResults: 5 });
    }
    
    // Measure memory after
    const memoryAfter = process.memoryUsage().heapUsed;
    
    // Calculate memory increase
    const memoryIncrease = memoryAfter - memoryBefore;
    
    // Memory increase should be reasonable (adjust threshold as needed)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });

  test('cleans up expired entries in recently generated outfits', () => {
    // Clear existing entries
    outfitGenerator.recentlyGeneratedOutfits.clear();
    
    // Add some fake entries with old timestamps
    const now = Date.now();
    const oneWeekAgo = now - 8 * 24 * 60 * 60 * 1000; // 8 days ago
    const recentDate = now - 3 * 24 * 60 * 60 * 1000; // 3 days ago
    
    outfitGenerator.recentlyGeneratedOutfits.set('old-outfit-1', new Date(oneWeekAgo));
    outfitGenerator.recentlyGeneratedOutfits.set('old-outfit-2', new Date(oneWeekAgo));
    outfitGenerator.recentlyGeneratedOutfits.set('recent-outfit', new Date(recentDate));
    
    // Initial count
    const initialCount = outfitGenerator.recentlyGeneratedOutfits.size;
    expect(initialCount).toBe(3);
    
    // Trigger cleanup
    outfitGenerator.cleanupRecentOutfits();
    
    // After cleanup, old entries should be removed
    const afterCleanupCount = outfitGenerator.recentlyGeneratedOutfits.size;
    expect(afterCleanupCount).toBe(1);
    expect(outfitGenerator.recentlyGeneratedOutfits.has('recent-outfit')).toBe(true);
  });
});
```

### 7. Combination Generation Testing

#### Valid Outfit Testing
```typescript
describe('Outfit Combination Generation', () => {
  test('generates valid outfits with required categories', () => {
    const items = [
      { id: 'top1', category: 'tops', occasion: ['casual'], season: ['summer'] },
      { id: 'top2', category: 'tops', occasion: ['formal'], season: ['winter'] },
      { id: 'bottom1', category: 'bottoms', occasion: ['casual'], season: ['summer'] },
      { id: 'bottom2', category: 'bottoms', occasion: ['formal'], season: ['winter'] },
      { id: 'shoe1', category: 'shoes', occasion: ['casual'], season: ['summer'] },
      { id: 'shoe2', category: 'shoes', occasion: ['formal'], season: ['winter'] },
    ];
    
    const outfits = generateOutfitCombinations(items);
    
    // Each outfit should have at least tops and bottoms
    outfits.forEach(outfit => {
      const hasTop = outfit.some(item => item.category === 'tops');
      const hasBottom = outfit.some(item => item.category === 'bottoms');
      
      expect(hasTop).toBe(true);
      expect(hasBottom).toBe(true);
    });
  });

  test('handles dress items correctly', () => {
    const items = [
      { id: 'top1', category: 'tops', occasion: ['casual'], season: ['summer'] },
      { id: 'bottom1', category: 'bottoms', occasion: ['casual'], season: ['summer'] },
      { id: 'dress1', category: 'dresses', occasion: ['casual'], season: ['summer'] },
      { id: 'shoe1', category: 'shoes', occasion: ['casual'], season: ['summer'] },
    ];
    
    const outfits = generateOutfitCombinations(items);
    
    // Should have outfits with dress (no top+bottom)
    const dressOutfits = outfits.filter(outfit => 
      outfit.some(item => item.category === 'dresses')
    );
    
    // Dress outfits should not have tops or bottoms
    dressOutfits.forEach(outfit => {
      const hasTop = outfit.some(item => item.category === 'tops');
      const hasBottom = outfit.some(item => item.category === 'bottoms');
      
      expect(hasTop || hasBottom).toBe(false);
    });
    
    // Should also have outfits with top+bottom (no dress)
    const topBottomOutfits = outfits.filter(outfit => 
      !outfit.some(item => item.category === 'dresses')
    );
    
    expect(topBottomOutfits.length).toBeGreaterThan(0);
  });

  test('respects force include items', () => {
    const items = [
      { id: 'top1', category: 'tops', occasion: ['casual'], season: ['summer'] },
      { id: 'top2', category: 'tops', occasion: ['formal'], season: ['winter'] },
      { id: 'bottom1', category: 'bottoms', occasion: ['casual'], season: ['summer'] },
      { id: 'bottom2', category: 'bottoms', occasion: ['formal'], season: ['winter'] },
    ];
    
    const forceIncludeItems = ['top1'];
    
    const outfits = generateOutfitCombinations(items, forceIncludeItems);
    
    // All outfits should include the forced item
    outfits.forEach(outfit => {
      const hasTop1 = outfit.some(item => item.id === 'top1');
      expect(hasTop1).toBe(true);
    });
  });
});
```

#### Compatibility Testing
```typescript
describe('Item Compatibility', () => {
  test('identifies compatible items correctly', () => {
    const top = {
      id: 'top1',
      category: 'tops',
      occasion: ['casual', 'work'],
      season: ['summer', 'spring'],
      color: '#FFFFFF',
    };
    
    const compatibleBottom = {
      id: 'bottom1',
      category: 'bottoms',
      occasion: ['casual'],
      season: ['summer'],
      color: '#000000',
    };
    
    const incompatibleBottom = {
      id: 'bottom2',
      category: 'bottoms',
      occasion: ['formal'],
      season: ['winter'],
      color: '#0000FF',
    };
    
    expect(isItemCompatible(compatibleBottom, [top])).toBe(true);
    expect(isItemCompatible(incompatibleBottom, [top])).toBe(false);
  });

  test('calculates compatibility score correctly', () => {
    const top = {
      id: 'top1',
      category: 'tops',
      occasion: ['casual', 'work'],
      season: ['summer', 'spring'],
      color: '#FFFFFF',
    };
    
    const perfectMatch = {
      id: 'bottom1',
      category: 'bottoms',
      occasion: ['casual', 'work'],
      season: ['summer', 'spring'],
      color: '#000000', // Good contrast with white
    };
    
    const partialMatch = {
      id: 'bottom2',
      category: 'bottoms',
      occasion: ['casual'], // Only one matching occasion
      season: ['summer'], // Only one matching season
      color: '#000000',
    };
    
    const perfectScore = calculateItemCompatibilityScore(perfectMatch, [top]);
    const partialScore = calculateItemCompatibilityScore(partialMatch, [top]);
    
    expect(perfectScore).toBeGreaterThan(partialScore);
    expect(perfectScore).toBeGreaterThan(0.8);
    expect(partialScore).toBeGreaterThan(0.5);
  });
});
```

### 8. User Preference Testing

#### Style Preference Testing
```typescript
describe('User Preferences', () => {
  test('respects user style preferences', () => {
    const items = [
      // Formal items
      { id: 'formal-top', category: 'tops', occasion: ['formal', 'work'], season: ['all'], color: '#FFFFFF', tags: ['dress shirt', 'formal'] },
      { id: 'formal-bottom', category: 'bottoms', occasion: ['formal', 'work'], season: ['all'], color: '#000000', tags: ['slacks', 'formal'] },
      
      // Casual items
      { id: 'casual-top', category: 'tops', occasion: ['casual'], season: ['all'], color: '#FF0000', tags: ['t-shirt', 'casual'] },
      { id: 'casual-bottom', category: 'bottoms', occasion: ['casual'], season: ['all'], color: '#0000FF', tags: ['jeans', 'casual'] },
    ];
    
    // Generate with formal preference
    const formalPreference = {
      formality: 0.9,
      boldness: 0.3,
      layering: 0.5,
      colorfulness: 0.3,
    };
    
    const formalOutfits = outfitGenerator.generateOutfits(items, {
      stylePreference: formalPreference,
      maxResults: 1,
    });
    
    // Generate with casual preference
    const casualPreference = {
      formality: 0.1,
      boldness: 0.7,
      layering: 0.5,
      colorfulness: 0.7,
    };
    
    const casualOutfits = outfitGenerator.generateOutfits(items, {
      stylePreference: casualPreference,
      maxResults: 1,
    });
    
    // Formal preference should favor formal items
    const hasFormalTop = formalOutfits[0].items.some(item => item.id === 'formal-top');
    expect(hasFormalTop).toBe(true);
    
    // Casual preference should favor casual items
    const hasCasualTop = casualOutfits[0].items.some(item => item.id === 'casual-top');
    expect(hasCasualTop).toBe(true);
  });

  test('respects color preferences', () => {
    const items = [
      { id: 'red-top', category: 'tops', color: '#FF0000', occasion: ['casual'], season: ['all'] },
      { id: 'blue-top', category: 'tops', color: '#0000FF', occasion: ['casual'], season: ['all'] },
      { id: 'black-bottom', category: 'bottoms', color: '#000000', occasion: ['casual'], season: ['all'] },
      { id: 'white-bottom', category: 'bottoms', color: '#FFFFFF', occasion: ['casual'], season: ['all'] },
    ];
    
    // Generate with red color preference
    const redOutfits = outfitGenerator.generateOutfits(items, {
      preferredColors: ['#FF0000'],
      maxResults: 1,
    });
    
    // Generate with blue color preference
    const blueOutfits = outfitGenerator.generateOutfits(items, {
      preferredColors: ['#0000FF'],
      maxResults: 1,
    });
    
    // Red preference should favor red items
    const hasRedTop = redOutfits[0].items.some(item => item.id === 'red-top');
    expect(hasRedTop).toBe(true);
    
    // Blue preference should favor blue items
    const hasBlueTop = blueOutfits[0].items.some(item => item.id === 'blue-top');
    expect(hasBlueTop).toBe(true);
  });
});
```

### 9. Weather Integration Testing

#### Weather Adaptation Testing
```typescript
describe('Weather Adaptation', () => {
  test('adapts outfits for cold weather', () => {
    const items = [
      // Warm items
      { id: 'sweater', category: 'tops', tags: ['sweater', 'warm', 'long sleeve'], season: ['winter', 'fall'], color: '#000000' },
      { id: 'jacket', category: 'outerwear', tags: ['jacket', 'warm'], season: ['winter', 'fall'], color: '#808080' },
      { id: 'jeans', category: 'bottoms', tags: ['jeans', 'denim'], season: ['all'], color: '#0000FF' },
      
      // Light items
      { id: 'tshirt', category: 'tops', tags: ['t-shirt', 'short sleeve'], season: ['summer', 'spring'], color: '#FFFFFF' },
      { id: 'shorts', category: 'bottoms', tags: ['shorts'], season: ['summer'], color: '#FF0000' },
    ];
    
    const coldWeather = {
      temperature: 5,
      conditions: 'clear',
      precipitation: 0,
      humidity: 0.5,
      windSpeed: 10,
    };
    
    const outfits = outfitGenerator.generateOutfits(items, {
      weather: coldWeather,
      maxResults: 1,
    });
    
    // Should include warm items
    const hasSweater = outfits[0].items.some(item => item.id === 'sweater');
    const hasJacket = outfits[0].items.some(item => item.id === 'jacket');
    
    expect(hasSweater || hasJacket).toBe(true);
    
    // Should not include summer items
    const hasShorts = outfits[0].items.some(item => item.id === 'shorts');
    expect(hasShorts).toBe(false);
  });

  test('adapts outfits for rainy weather', () => {
    const items = [
      { id: 'raincoat', category: 'outerwear', tags: ['raincoat', 'waterproof'], season: ['spring', 'fall'], color: '#000000' },
      { id: 'jacket', category: 'outerwear', tags: ['jacket'], season: ['winter', 'fall'], color: '#808080' },
      { id: 'top1', category: 'tops', tags: ['long sleeve'], season: ['all'], color: '#FFFFFF' },
      { id: 'bottom1', category: 'bottoms', tags: ['jeans'], season: ['all'], color: '#0000FF' },
    ];
    
    const rainyWeather = {
      temperature: 15,
      conditions: 'rainy',
      precipitation: 0.8,
      humidity: 0.9,
      windSpeed: 15,
    };
    
    const outfits = outfitGenerator.generateOutfits(items, {
      weather: rainyWeather,
      maxResults: 1,
    });
    
    // Should include raincoat
    const hasRaincoat = outfits[0].items.some(item => item.id === 'raincoat');
    expect(hasRaincoat).toBe(true);
  });

  test('adapts outfits for windy weather', () => {
    const items = [
      { id: 'windbreaker', category: 'outerwear', tags: ['windbreaker', 'wind-resistant'], season: ['spring', 'fall'], color: '#000000' },
      { id: 'jacket', category: 'outerwear', tags: ['jacket'], season: ['winter', 'fall'], color: '#808080' },
      { id: 'top1', category: 'tops', tags: ['long sleeve'], season: ['all'], color: '#FFFFFF' },
      { id: 'bottom1', category: 'bottoms', tags: ['jeans'], season: ['all'], color: '#0000FF' },
    ];
    
    const windyWeather = {
      temperature: 15,
      conditions: 'windy',
      precipitation: 0,
      humidity: 0.5,
      windSpeed: 30,
    };
    
    const outfits = outfitGenerator.generateOutfits(items, {
      weather: windyWeather,
      maxResults: 1,
    });
    
    // Should include windbreaker
    const hasWindbreaker = outfits[0].items.some(item => item.id === 'windbreaker');
    expect(hasWindbreaker).toBe(true);
  });
});
```

## Automated Testing Pipeline

### Continuous Integration
```yaml
name: Outfit Algorithm Tests
on: [push, pull_request]

jobs:
  test-algorithm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:outfit-algorithm
      
  test-performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:outfit-performance
      
  test-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:outfit-integration
```

### Performance Benchmarks
```typescript
// Performance benchmarks
const outfitGenerationBenchmarks = {
  smallWardrobe: {
    itemCount: 20,
    maxTime: 500, // 500ms
  },
  mediumWardrobe: {
    itemCount: 100,
    maxTime: 1500, // 1.5s
  },
  largeWardrobe: {
    itemCount: 200,
    maxTime: 3000, // 3s
  },
};
```

## Manual Testing Checklist

### Color Harmony Testing
- [ ] Test with monochromatic outfits (variations of a single color)
- [ ] Test with complementary color outfits (opposite colors)
- [ ] Test with analogous color outfits (adjacent colors)
- [ ] Test with triadic color outfits (three evenly spaced colors)
- [ ] Test with neutral color outfits (black, white, gray, etc.)
- [ ] Test with high-contrast combinations
- [ ] Test with low-contrast combinations

### Style Matching Testing
- [ ] Test with formal items (dress shirts, slacks, etc.)
- [ ] Test with casual items (t-shirts, jeans, etc.)
- [ ] Test with mixed formality items
- [ ] Test with different style preferences (formal vs. casual)
- [ ] Test with different boldness preferences (conservative vs. bold)
- [ ] Test with different layering preferences (minimal vs. maximal)
- [ ] Test with different colorfulness preferences (monochrome vs. colorful)

### Occasion Testing
- [ ] Test generating outfits for casual occasions
- [ ] Test generating outfits for work occasions
- [ ] Test generating outfits for formal occasions
- [ ] Test generating outfits for sport occasions
- [ ] Test generating outfits for date occasions
- [ ] Test generating outfits for special occasions
- [ ] Test with items suitable for multiple occasions

### Season Testing
- [ ] Test generating outfits for summer
- [ ] Test generating outfits for winter
- [ ] Test generating outfits for spring
- [ ] Test generating outfits for fall
- [ ] Test with items suitable for multiple seasons
- [ ] Test with limited seasonal items

### Weather Testing
- [ ] Test with cold weather conditions
- [ ] Test with hot weather conditions
- [ ] Test with rainy weather conditions
- [ ] Test with windy weather conditions
- [ ] Test with snowy weather conditions
- [ ] Test with changing weather conditions

### Performance Testing
- [ ] Test with small wardrobe (20-50 items)
- [ ] Test with medium wardrobe (50-100 items)
- [ ] Test with large wardrobe (100-200+ items)
- [ ] Test generation speed with different option combinations
- [ ] Test memory usage during repeated generations
- [ ] Test with complex filtering options

### User Experience Testing
- [ ] Test with different user style preferences
- [ ] Test with different color preferences
- [ ] Test with excluded items
- [ ] Test with forced included items
- [ ] Test variety of generated outfits over time
- [ ] Test score explanations for transparency

This comprehensive testing strategy ensures the outfit generation algorithm provides accurate, efficient, and personalized recommendations while maintaining good performance and user experience.