# AI Clothing Analysis Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Stylisto AI clothing analysis service, covering accuracy validation, performance optimization, error handling, and integration testing.

## Testing Categories

### 1. Analysis Accuracy Testing

#### Category Detection Testing
```typescript
describe('Clothing Category Detection', () => {
  const testCases = [
    { image: 'test-tshirt.jpg', expectedCategory: 'tops', minConfidence: 0.7 },
    { image: 'test-jeans.jpg', expectedCategory: 'bottoms', minConfidence: 0.7 },
    { image: 'test-dress.jpg', expectedCategory: 'dresses', minConfidence: 0.7 },
    { image: 'test-jacket.jpg', expectedCategory: 'outerwear', minConfidence: 0.7 },
    { image: 'test-sneakers.jpg', expectedCategory: 'shoes', minConfidence: 0.7 },
    { image: 'test-hat.jpg', expectedCategory: 'accessories', minConfidence: 0.7 },
    { image: 'test-swimsuit.jpg', expectedCategory: 'swimwear', minConfidence: 0.7 },
  ];

  testCases.forEach(({ image, expectedCategory, minConfidence }) => {
    test(`correctly identifies ${expectedCategory} from ${image}`, async () => {
      const imageUri = await loadTestImage(image);
      const result = await visionAIService.analyzeClothing(imageUri);
      
      expect(result.category).toBe(expectedCategory);
      expect(result.confidence.category).toBeGreaterThanOrEqual(minConfidence);
    });
  });

  test('handles ambiguous items with reasonable confidence scores', async () => {
    // Test with an image that could be in multiple categories
    const imageUri = await loadTestImage('test-cardigan.jpg'); // Could be tops or outerwear
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should pick one category but with lower confidence
    expect(['tops', 'outerwear']).toContain(result.category);
    expect(result.confidence.category).toBeLessThan(0.9);
  });
});
```

#### Color Detection Testing
```typescript
describe('Color Detection', () => {
  const colorTestCases = [
    { image: 'red-shirt.jpg', expectedColor: 'red', rgbRange: [180, 255, 0, 100, 0, 100] },
    { image: 'blue-jeans.jpg', expectedColor: 'blue', rgbRange: [0, 100, 0, 100, 180, 255] },
    { image: 'black-dress.jpg', expectedColor: 'black', rgbRange: [0, 50, 0, 50, 0, 50] },
    { image: 'white-tshirt.jpg', expectedColor: 'white', rgbRange: [200, 255, 200, 255, 200, 255] },
  ];

  colorTestCases.forEach(({ image, expectedColor, rgbRange }) => {
    test(`correctly identifies ${expectedColor} from ${image}`, async () => {
      const imageUri = await loadTestImage(image);
      const result = await visionAIService.analyzeClothing(imageUri);
      
      // Check if color name is correct
      expect(result.color.toLowerCase()).toContain(expectedColor);
      
      // If it's a hex color, check RGB values are in expected range
      if (result.color.startsWith('#')) {
        const r = parseInt(result.color.slice(1, 3), 16);
        const g = parseInt(result.color.slice(3, 5), 16);
        const b = parseInt(result.color.slice(5, 7), 16);
        
        const [rMin, rMax, gMin, gMax, bMin, bMax] = rgbRange;
        
        expect(r).toBeGreaterThanOrEqual(rMin);
        expect(r).toBeLessThanOrEqual(rMax);
        expect(g).toBeGreaterThanOrEqual(gMin);
        expect(g).toBeLessThanOrEqual(gMax);
        expect(b).toBeGreaterThanOrEqual(bMin);
        expect(b).toBeLessThanOrEqual(bMax);
      }
    });
  });

  test('handles multi-colored items by identifying dominant color', async () => {
    const imageUri = await loadTestImage('multicolor-shirt.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should identify a dominant color with reasonable confidence
    expect(result.color).toBeTruthy();
    expect(result.confidence.color).toBeGreaterThanOrEqual(0.5);
  });
});
```

#### Season and Occasion Testing
```typescript
describe('Season and Occasion Detection', () => {
  test('correctly identifies winter clothing', async () => {
    const imageUri = await loadTestImage('winter-coat.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    expect(result.seasons).toContain('winter');
    expect(result.confidence.seasons).toBeGreaterThanOrEqual(0.6);
  });

  test('correctly identifies summer clothing', async () => {
    const imageUri = await loadTestImage('summer-dress.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    expect(result.seasons).toContain('summer');
    expect(result.confidence.seasons).toBeGreaterThanOrEqual(0.6);
  });

  test('correctly identifies formal wear', async () => {
    const imageUri = await loadTestImage('formal-suit.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    expect(result.occasions).toContain('formal');
    expect(result.confidence.occasions).toBeGreaterThanOrEqual(0.6);
  });

  test('correctly identifies casual wear', async () => {
    const imageUri = await loadTestImage('casual-tshirt.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    expect(result.occasions).toContain('casual');
    expect(result.confidence.occasions).toBeGreaterThanOrEqual(0.6);
  });

  test('handles items suitable for multiple seasons', async () => {
    const imageUri = await loadTestImage('all-season-shirt.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should identify multiple seasons
    expect(result.seasons.length).toBeGreaterThan(1);
  });
});
```

#### Tag Generation Testing
```typescript
describe('Tag Generation', () => {
  test('generates relevant tags for clothing items', async () => {
    const imageUri = await loadTestImage('striped-polo-shirt.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should generate relevant tags
    expect(result.tags.length).toBeGreaterThan(0);
    expect(result.tags).toContain('polo');
    expect(result.tags).toContain('striped');
  });

  test('generates brand tags when brand is visible', async () => {
    const imageUri = await loadTestImage('nike-sneakers.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should identify brand
    expect(result.tags).toContain('nike');
  });

  test('generates material tags when detectable', async () => {
    const imageUri = await loadTestImage('leather-jacket.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should identify material
    expect(result.tags).toContain('leather');
  });
});
```

### 2. Performance Testing

#### API Call Optimization Testing
```typescript
describe('API Call Optimization', () => {
  test('caches analysis results to avoid redundant API calls', async () => {
    // Clear cache first
    await visionAIService.clearCache();
    
    const imageUri = await loadTestImage('test-shirt.jpg');
    
    // First call should hit the API
    const apiSpy = jest.spyOn(global, 'fetch');
    await visionAIService.analyzeClothing(imageUri);
    expect(apiSpy).toHaveBeenCalledTimes(1);
    
    // Reset spy
    apiSpy.mockClear();
    
    // Second call with same image should use cache
    await visionAIService.analyzeClothing(imageUri);
    expect(apiSpy).not.toHaveBeenCalled();
  });

  test('batch processing reduces API calls', async () => {
    // Clear cache first
    await visionAIService.clearCache();
    
    const imageUris = [
      await loadTestImage('test-shirt.jpg'),
      await loadTestImage('test-pants.jpg'),
      await loadTestImage('test-shoes.jpg'),
    ];
    
    // Spy on API calls
    const apiSpy = jest.spyOn(global, 'fetch');
    
    // Process batch
    await visionAIService.analyzeBatch(imageUris);
    
    // Should make exactly 3 API calls (one per image)
    expect(apiSpy).toHaveBeenCalledTimes(3);
  });

  test('cache expiration works correctly', async () => {
    // Mock Date.now to control time
    const realDateNow = Date.now;
    const mockDateNow = jest.fn();
    global.Date.now = mockDateNow;
    
    // Set initial time
    mockDateNow.mockReturnValue(1000);
    
    // Clear cache first
    await visionAIService.clearCache();
    
    const imageUri = await loadTestImage('test-shirt.jpg');
    
    // First call should hit the API
    const apiSpy = jest.spyOn(global, 'fetch');
    await visionAIService.analyzeClothing(imageUri);
    expect(apiSpy).toHaveBeenCalledTimes(1);
    
    // Reset spy
    apiSpy.mockClear();
    
    // Advance time past cache expiry (30 days)
    mockDateNow.mockReturnValue(1000 + 31 * 24 * 60 * 60 * 1000);
    
    // Call should hit API again due to expired cache
    await visionAIService.analyzeClothing(imageUri);
    expect(apiSpy).toHaveBeenCalledTimes(1);
    
    // Restore Date.now
    global.Date.now = realDateNow;
  });
});
```

#### Memory Usage Testing
```typescript
describe('Memory Usage', () => {
  test('cache size remains reasonable after multiple analyses', async () => {
    // Clear cache first
    await visionAIService.clearCache();
    
    // Analyze 20 different images
    const imageUris = [];
    for (let i = 0; i < 20; i++) {
      imageUris.push(await loadTestImage(`test-image-${i}.jpg`));
    }
    
    await visionAIService.analyzeBatch(imageUris);
    
    // Check cache stats
    const stats = visionAIService.getCacheStats();
    
    // Cache should contain 20 entries
    expect(stats.entries).toBe(20);
    
    // Cache size should be reasonable (< 1MB)
    expect(stats.size).toBeLessThan(1024 * 1024);
  });

  test('cache cleanup removes oldest entries when limit reached', async () => {
    // This would require modifying the service to have a smaller cache limit for testing
    // or mocking the implementation
    
    // Mock implementation with smaller cache limit
    const originalCache = visionAIService.cache;
    const mockCache = { ...originalCache };
    visionAIService.cache = mockCache;
    visionAIService.CACHE_LIMIT = 5; // Set small limit for testing
    
    // Clear cache first
    await visionAIService.clearCache();
    
    // Analyze 10 different images (exceeding cache limit)
    const imageUris = [];
    for (let i = 0; i < 10; i++) {
      imageUris.push(await loadTestImage(`test-image-${i}.jpg`));
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    await visionAIService.analyzeBatch(imageUris);
    
    // Check cache stats
    const stats = visionAIService.getCacheStats();
    
    // Cache should be limited to 5 entries (the most recent ones)
    expect(stats.entries).toBe(5);
    
    // Restore original implementation
    visionAIService.cache = originalCache;
    delete visionAIService.CACHE_LIMIT;
  });
});
```

### 3. Error Handling Testing

#### API Error Testing
```typescript
describe('API Error Handling', () => {
  test('handles invalid API key gracefully', async () => {
    // Set invalid API key
    visionAIService.setApiKey('invalid-key');
    
    const imageUri = await loadTestImage('test-shirt.jpg');
    
    // Should return fallback result instead of throwing
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Verify fallback result structure
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('seasons');
    expect(result).toHaveProperty('occasions');
    expect(result).toHaveProperty('confidence');
  });

  test('handles network errors gracefully', async () => {
    // Mock fetch to simulate network error
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const imageUri = await loadTestImage('test-shirt.jpg');
    
    // Should return fallback result instead of throwing
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Verify fallback result
    expect(result).toHaveProperty('category');
    
    // Restore original fetch
    global.fetch = originalFetch;
  });

  test('handles API rate limiting', async () => {
    // Mock fetch to simulate rate limiting
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
    });
    
    const imageUri = await loadTestImage('test-shirt.jpg');
    
    // Should return fallback result instead of throwing
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Verify fallback result
    expect(result).toHaveProperty('category');
    
    // Restore original fetch
    global.fetch = originalFetch;
  });
});
```

#### Image Processing Error Testing
```typescript
describe('Image Processing Error Handling', () => {
  test('handles invalid image format gracefully', async () => {
    // Create an invalid "image" (text file with image extension)
    const invalidImageUri = await createInvalidTestImage('invalid.jpg');
    
    // Should return fallback result instead of throwing
    const result = await visionAIService.analyzeClothing(invalidImageUri);
    
    // Verify fallback result
    expect(result).toHaveProperty('category');
  });

  test('handles corrupted image data', async () => {
    // Create a corrupted image (partial image data)
    const corruptedImageUri = await createCorruptedTestImage('corrupted.jpg');
    
    // Should return fallback result instead of throwing
    const result = await visionAIService.analyzeClothing(corruptedImageUri);
    
    // Verify fallback result
    expect(result).toHaveProperty('category');
  });

  test('handles extremely large images', async () => {
    // Create a very large test image
    const largeImageUri = await createLargeTestImage('large.jpg', 5000, 5000);
    
    // Should process without error
    const result = await visionAIService.analyzeClothing(largeImageUri);
    
    // Verify result
    expect(result).toHaveProperty('category');
  });
});
```

### 4. Confidence Scoring Testing

#### Confidence Threshold Testing
```typescript
describe('Confidence Scoring', () => {
  test('assigns appropriate confidence scores for clear images', async () => {
    // Test with a clear, well-lit image of a distinct item
    const imageUri = await loadTestImage('clear-tshirt.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should have high confidence
    expect(result.confidence.category).toBeGreaterThanOrEqual(0.8);
    expect(result.confidence.color).toBeGreaterThanOrEqual(0.8);
  });

  test('assigns lower confidence scores for ambiguous images', async () => {
    // Test with an ambiguous or unclear image
    const imageUri = await loadTestImage('ambiguous-clothing.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should have lower confidence
    expect(result.confidence.category).toBeLessThan(0.8);
  });

  test('confidence scores correlate with accuracy', async () => {
    // Test multiple images and verify correlation between confidence and accuracy
    const testCases = [
      { image: 'clear-shirt.jpg', expectedCategory: 'tops' },
      { image: 'blurry-shirt.jpg', expectedCategory: 'tops' },
      { image: 'dark-shirt.jpg', expectedCategory: 'tops' },
    ];
    
    const results = [];
    
    for (const { image, expectedCategory } of testCases) {
      const imageUri = await loadTestImage(image);
      const result = await visionAIService.analyzeClothing(imageUri);
      
      results.push({
        image,
        expectedCategory,
        actualCategory: result.category,
        confidence: result.confidence.category,
        correct: result.category === expectedCategory,
      });
    }
    
    // Calculate correlation between confidence and correctness
    const confidenceValues = results.map(r => r.confidence);
    const correctnessValues = results.map(r => r.correct ? 1 : 0);
    
    const correlation = calculateCorrelation(confidenceValues, correctnessValues);
    
    // Should have positive correlation
    expect(correlation).toBeGreaterThan(0);
  });
});
```

### 5. Lighting and Background Testing

#### Lighting Condition Testing
```typescript
describe('Lighting Condition Handling', () => {
  const lightingTestCases = [
    { condition: 'bright', image: 'bright-lighting.jpg' },
    { condition: 'normal', image: 'normal-lighting.jpg' },
    { condition: 'dim', image: 'dim-lighting.jpg' },
    { condition: 'backlit', image: 'backlit.jpg' },
  ];

  lightingTestCases.forEach(({ condition, image }) => {
    test(`handles ${condition} lighting conditions`, async () => {
      const imageUri = await loadTestImage(image);
      const result = await visionAIService.analyzeClothing(imageUri);
      
      // Should return a result with reasonable confidence
      expect(result).toHaveProperty('category');
      
      // For dim lighting, confidence may be lower but should still be reasonable
      if (condition === 'dim' || condition === 'backlit') {
        expect(result.confidence.category).toBeGreaterThanOrEqual(0.5);
      } else {
        expect(result.confidence.category).toBeGreaterThanOrEqual(0.7);
      }
    });
  });
});
```

#### Background Complexity Testing
```typescript
describe('Background Complexity Handling', () => {
  const backgroundTestCases = [
    { background: 'plain', image: 'plain-background.jpg', expectedConfidence: 0.8 },
    { background: 'textured', image: 'textured-background.jpg', expectedConfidence: 0.7 },
    { background: 'cluttered', image: 'cluttered-background.jpg', expectedConfidence: 0.6 },
    { background: 'similar color', image: 'similar-color-background.jpg', expectedConfidence: 0.6 },
  ];

  backgroundTestCases.forEach(({ background, image, expectedConfidence }) => {
    test(`handles ${background} backgrounds`, async () => {
      const imageUri = await loadTestImage(image);
      const result = await visionAIService.analyzeClothing(imageUri);
      
      // Should return a result with reasonable confidence
      expect(result).toHaveProperty('category');
      expect(result.confidence.category).toBeGreaterThanOrEqual(expectedConfidence);
    });
  });
});
```

### 6. Integration Testing

#### Component Integration Testing
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ClothingAnalyzer } from '../components/ai/ClothingAnalyzer';

describe('ClothingAnalyzer Component', () => {
  test('renders correctly with image', () => {
    const { getByText } = render(
      <ClothingAnalyzer
        imageUri="test-image.jpg"
        autoAnalyze={false}
      />
    );
    
    expect(getByText('Analyze Item')).toBeTruthy();
  });

  test('shows loading state during analysis', async () => {
    // Mock the analyze function to delay
    jest.mock('../../lib/visionAI', () => ({
      useVisionAI: () => ({
        analyzeClothing: () => new Promise(resolve => setTimeout(resolve, 100)),
      }),
    }));
    
    const { getByText } = render(
      <ClothingAnalyzer
        imageUri="test-image.jpg"
        autoAnalyze={true}
      />
    );
    
    expect(getByText('Analyzing clothing item...')).toBeTruthy();
  });

  test('displays analysis results when complete', async () => {
    // Mock the analyze function to return test data
    const mockResult = {
      category: 'tops',
      subcategory: 't-shirt',
      color: 'blue',
      seasons: ['summer', 'spring'],
      occasions: ['casual'],
      tags: ['cotton', 'short-sleeve'],
      confidence: {
        category: 0.9,
        color: 0.8,
        seasons: 0.7,
        occasions: 0.8,
      },
    };
    
    jest.mock('../../lib/visionAI', () => ({
      useVisionAI: () => ({
        analyzeClothing: () => Promise.resolve(mockResult),
      }),
    }));
    
    const { getByText } = render(
      <ClothingAnalyzer
        imageUri="test-image.jpg"
        autoAnalyze={true}
      />
    );
    
    await waitFor(() => {
      expect(getByText('AI Analysis Results')).toBeTruthy();
      expect(getByText('tops')).toBeTruthy();
      expect(getByText('blue')).toBeTruthy();
    });
  });

  test('handles analysis errors gracefully', async () => {
    // Mock the analyze function to throw an error
    jest.mock('../../lib/visionAI', () => ({
      useVisionAI: () => ({
        analyzeClothing: () => Promise.reject(new Error('Analysis failed')),
      }),
    }));
    
    const { getByText } = render(
      <ClothingAnalyzer
        imageUri="test-image.jpg"
        autoAnalyze={true}
      />
    );
    
    await waitFor(() => {
      expect(getByText(/Analysis failed/)).toBeTruthy();
      expect(getByText('Retry Analysis')).toBeTruthy();
    });
  });

  test('calls onAnalysisComplete callback with results', async () => {
    // Mock the analyze function to return test data
    const mockResult = {
      category: 'tops',
      subcategory: 't-shirt',
      color: 'blue',
      seasons: ['summer', 'spring'],
      occasions: ['casual'],
      tags: ['cotton', 'short-sleeve'],
      confidence: {
        category: 0.9,
        color: 0.8,
        seasons: 0.7,
        occasions: 0.8,
      },
    };
    
    jest.mock('../../lib/visionAI', () => ({
      useVisionAI: () => ({
        analyzeClothing: () => Promise.resolve(mockResult),
      }),
    }));
    
    const mockCallback = jest.fn();
    
    render(
      <ClothingAnalyzer
        imageUri="test-image.jpg"
        autoAnalyze={true}
        onAnalysisComplete={mockCallback}
      />
    );
    
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(mockResult);
    });
  });
});
```

#### Form Integration Testing
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddItemScreen } from '../app/(tabs)/wardrobe/add-item';

describe('Add Item Screen with AI Integration', () => {
  test('auto-populates form fields from analysis results', async () => {
    // Mock the analyze function to return test data
    const mockResult = {
      category: 'tops',
      subcategory: 't-shirt',
      color: 'blue',
      seasons: ['summer', 'spring'],
      occasions: ['casual'],
      tags: ['cotton', 'short-sleeve'],
      confidence: {
        category: 0.9,
        color: 0.8,
        seasons: 0.7,
        occasions: 0.8,
      },
    };
    
    jest.mock('../../hooks/useClothingAnalysis', () => ({
      useClothingAnalysis: () => ({
        loading: false,
        error: null,
        result: mockResult,
        analyzeImage: () => Promise.resolve(mockResult),
      }),
    }));
    
    // Mock route params to include a photo URI
    jest.mock('expo-router', () => ({
      useLocalSearchParams: () => ({ photoUri: 'test-image.jpg' }),
      router: { back: jest.fn() },
    }));
    
    const { getByText, getByDisplayValue } = render(<AddItemScreen />);
    
    // Wait for analysis to complete and form to update
    await waitFor(() => {
      // Category should be selected
      expect(getByText('tops')).toBeTruthy();
      
      // Color should be set
      const colorOption = getByText('blue');
      expect(colorOption).toBeTruthy();
      
      // Seasons should be selected
      expect(getByText('summer')).toBeTruthy();
      expect(getByText('spring')).toBeTruthy();
      
      // Occasions should be selected
      expect(getByText('casual')).toBeTruthy();
      
      // Tags should be added
      expect(getByText('cotton')).toBeTruthy();
      expect(getByText('short-sleeve')).toBeTruthy();
    });
  });

  test('allows manual override of AI suggestions', async () => {
    // Mock the analyze function to return test data
    const mockResult = {
      category: 'tops',
      subcategory: 't-shirt',
      color: 'blue',
      seasons: ['summer'],
      occasions: ['casual'],
      tags: ['cotton'],
      confidence: {
        category: 0.9,
        color: 0.8,
        seasons: 0.7,
        occasions: 0.8,
      },
    };
    
    jest.mock('../../hooks/useClothingAnalysis', () => ({
      useClothingAnalysis: () => ({
        loading: false,
        error: null,
        result: mockResult,
        analyzeImage: () => Promise.resolve(mockResult),
      }),
    }));
    
    // Mock route params to include a photo URI
    jest.mock('expo-router', () => ({
      useLocalSearchParams: () => ({ photoUri: 'test-image.jpg' }),
      router: { back: jest.fn() },
    }));
    
    const { getByText, getByDisplayValue } = render(<AddItemScreen />);
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(getByText('tops')).toBeTruthy();
    });
    
    // Change category to 'bottoms'
    fireEvent.press(getByText('bottoms'));
    
    // Verify category was changed
    await waitFor(() => {
      expect(getByText('bottoms')).toBeTruthy();
    });
    
    // Add a season
    fireEvent.press(getByText('winter'));
    
    // Verify season was added
    await waitFor(() => {
      expect(getByText('winter')).toBeTruthy();
    });
  });
});
```

### 7. Fallback Mechanism Testing

#### Fallback Testing
```typescript
describe('Fallback Mechanism', () => {
  test('provides reasonable defaults when analysis fails', async () => {
    // Mock the Vision API to fail
    jest.mock('../../lib/visionAI', () => ({
      ...jest.requireActual('../../lib/visionAI'),
      processVisionResponse: () => {
        throw new Error('Processing failed');
      },
    }));
    
    const imageUri = await loadTestImage('test-shirt.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should return fallback values
    expect(result.category).toBe('tops'); // Default category
    expect(result.color).toBe('#000000'); // Default color
    expect(result.seasons).toContain('summer'); // Default season
    expect(result.occasions).toContain('casual'); // Default occasion
  });

  test('handles missing API key gracefully', async () => {
    // Clear API key
    visionAIService.setApiKey('');
    
    const imageUri = await loadTestImage('test-shirt.jpg');
    const result = await visionAIService.analyzeClothing(imageUri);
    
    // Should return fallback result
    expect(result.category).toBe('tops');
    expect(result.confidence.category).toBe(0.5); // Default confidence
  });

  test('handles invalid image URI gracefully', async () => {
    const result = await visionAIService.analyzeClothing('invalid-uri');
    
    // Should return fallback result
    expect(result.category).toBe('tops');
    expect(result.confidence.category).toBe(0.5);
  });
});
```

### 8. Batch Processing Testing

#### Batch Analysis Testing
```typescript
describe('Batch Processing', () => {
  test('processes multiple images efficiently', async () => {
    // Clear cache first
    await visionAIService.clearCache();
    
    const imageUris = [
      await loadTestImage('test-shirt.jpg'),
      await loadTestImage('test-pants.jpg'),
      await loadTestImage('test-shoes.jpg'),
    ];
    
    const startTime = performance.now();
    
    const results = await visionAIService.analyzeBatch(imageUris);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Verify all images were processed
    expect(results).toHaveLength(3);
    
    // Verify reasonable processing time (adjust based on requirements)
    // Should be less than processing each image sequentially
    expect(processingTime).toBeLessThan(15000); // 15 seconds for 3 images
  });

  test('reports progress during batch processing', async () => {
    const imageUris = [
      await loadTestImage('test-shirt.jpg'),
      await loadTestImage('test-pants.jpg'),
      await loadTestImage('test-shoes.jpg'),
    ];
    
    const progressUpdates: { completed: number; total: number }[] = [];
    
    await visionAIService.analyzeBatch(imageUris, (completed, total) => {
      progressUpdates.push({ completed, total });
    });
    
    // Should report progress for each image
    expect(progressUpdates).toHaveLength(3);
    expect(progressUpdates[0]).toEqual({ completed: 1, total: 3 });
    expect(progressUpdates[1]).toEqual({ completed: 2, total: 3 });
    expect(progressUpdates[2]).toEqual({ completed: 3, total: 3 });
  });

  test('handles partial failures in batch processing', async () => {
    // Create a mix of valid and invalid images
    const imageUris = [
      await loadTestImage('test-shirt.jpg'),
      'invalid-uri',
      await loadTestImage('test-shoes.jpg'),
    ];
    
    const results = await visionAIService.analyzeBatch(imageUris);
    
    // Should return results for all images
    expect(results).toHaveLength(3);
    
    // Valid images should have proper results
    expect(results[0].confidence.category).toBeGreaterThan(0.5);
    expect(results[2].confidence.category).toBeGreaterThan(0.5);
    
    // Invalid image should have fallback result
    expect(results[1].confidence.category).toBe(0.5);
  });
});
```

## Automated Testing Pipeline

### Continuous Integration
```yaml
name: AI Analysis Tests
on: [push, pull_request]

jobs:
  test-ai-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:ai-analysis
      
  test-accuracy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:ai-accuracy
      
  test-performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:ai-performance
```

### Performance Monitoring
```typescript
// Performance benchmarks
const aiAnalysisBenchmarks = {
  singleImage: {
    processingTime: 3000, // 3 seconds max
    apiCallTime: 2000, // 2 seconds max for API call
  },
  batchProcessing: {
    processingTime: 10000, // 10 seconds for 5 images
    perImageTime: 2500, // 2.5 seconds per image average
  },
  memory: {
    cacheSize: 5 * 1024 * 1024, // 5MB max cache size
  },
};
```

## Manual Testing Checklist

### Accuracy Testing
- [ ] Test with high-quality, well-lit clothing photos
- [ ] Test with different clothing categories (tops, bottoms, dresses, etc.)
- [ ] Test with solid color items
- [ ] Test with patterned and multi-colored items
- [ ] Test with items from different seasons
- [ ] Test with items for different occasions
- [ ] Test with branded items
- [ ] Test with items of different materials

### Lighting and Background Testing
- [ ] Test with bright lighting
- [ ] Test with normal indoor lighting
- [ ] Test with dim lighting
- [ ] Test with backlit items
- [ ] Test with plain backgrounds
- [ ] Test with textured backgrounds
- [ ] Test with cluttered backgrounds
- [ ] Test with backgrounds similar in color to the item

### Performance Testing
- [ ] Test analysis speed for single items
- [ ] Test batch analysis with multiple items
- [ ] Test cache effectiveness for repeated analyses
- [ ] Monitor memory usage during extended use
- [ ] Test with very large images
- [ ] Test with very small images

### Error Handling Testing
- [ ] Test with invalid API key
- [ ] Test with network connection disabled
- [ ] Test with corrupted image files
- [ ] Test with non-clothing images
- [ ] Test with extremely low-quality images
- [ ] Test recovery after API errors

### Integration Testing
- [ ] Test auto-population of form fields from analysis
- [ ] Test manual override of AI suggestions
- [ ] Test analysis during item addition workflow
- [ ] Test analysis during batch upload
- [ ] Test UI feedback during analysis
- [ ] Test error messaging in UI

This comprehensive testing strategy ensures the AI clothing analysis service provides accurate, reliable results while maintaining good performance and gracefully handling error conditions.