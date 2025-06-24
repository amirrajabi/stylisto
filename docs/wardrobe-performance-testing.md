# Wardrobe Management Performance Testing Guide

## Overview

This document outlines comprehensive performance testing strategies for the Stylisto wardrobe management UI, covering large dataset handling, responsive design validation, and optimization techniques.

## Performance Testing Categories

### 1. Large Dataset Performance Tests

#### Test Data Generation
```typescript
// Generate test wardrobe data
const generateTestWardrobeData = (itemCount: number) => {
  const categories = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes'];
  const brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Gap'];
  const colors = ['black', 'white', 'blue', 'red', 'green', 'gray'];
  const seasons = ['spring', 'summer', 'fall', 'winter'];
  
  return Array.from({ length: itemCount }, (_, index) => ({
    id: `item-${index}`,
    name: `Test Item ${index + 1}`,
    category: categories[index % categories.length],
    brand: brands[index % brands.length],
    color: colors[index % colors.length],
    image_url: `https://images.pexels.com/photos/${1000000 + index}/pexels-photo-${1000000 + index}.jpeg?auto=compress&cs=tinysrgb&w=400`,
    seasons: [seasons[index % seasons.length]],
    occasions: ['casual'],
    times_worn: Math.floor(Math.random() * 20),
    price: Math.floor(Math.random() * 200) + 20,
    is_favorite: Math.random() > 0.8,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [`tag-${index % 10}`],
  }));
};
```

#### Performance Benchmarks
```typescript
// Performance test suite
describe('Wardrobe Performance Tests', () => {
  const testSizes = [100, 500, 1000, 2000, 5000];
  
  testSizes.forEach(size => {
    test(`renders ${size} items within performance budget`, async () => {
      const testData = generateTestWardrobeData(size);
      const startTime = performance.now();
      
      const { getByTestId } = render(
        <WardrobeScreen testData={testData} />
      );
      
      // Wait for initial render
      await waitFor(() => {
        expect(getByTestId('wardrobe-list')).toBeTruthy();
      });
      
      const renderTime = performance.now() - startTime;
      
      // Performance budgets
      const budgets = {
        100: 100,   // 100ms for 100 items
        500: 200,   // 200ms for 500 items
        1000: 400,  // 400ms for 1000 items
        2000: 600,  // 600ms for 2000 items
        5000: 1000, // 1000ms for 5000 items
      };
      
      expect(renderTime).toBeLessThan(budgets[size]);
    });
  });
});
```

#### Memory Usage Tests
```typescript
// Memory usage monitoring
const measureMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
    };
  }
  return null;
};

test('memory usage stays within limits for large datasets', async () => {
  const initialMemory = measureMemoryUsage();
  const testData = generateTestWardrobeData(5000);
  
  const { unmount } = render(<WardrobeScreen testData={testData} />);
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const peakMemory = measureMemoryUsage();
  unmount();
  
  // Allow time for cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = measureMemoryUsage();
  
  if (initialMemory && peakMemory && finalMemory) {
    const memoryIncrease = peakMemory.used - initialMemory.used;
    const memoryLeak = finalMemory.used - initialMemory.used;
    
    // Memory increase should be reasonable (< 50MB for 5000 items)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    
    // Memory leak should be minimal (< 5MB)
    expect(memoryLeak).toBeLessThan(5 * 1024 * 1024);
  }
});
```

### 2. Scroll Performance Tests

#### FlatList Optimization Tests
```typescript
// Test FlatList performance optimizations
test('FlatList optimizations work correctly', () => {
  const testData = generateTestWardrobeData(1000);
  const { getByTestId } = render(<WardrobeScreen testData={testData} />);
  
  const flatList = getByTestId('wardrobe-list');
  
  // Verify optimization props are set correctly
  expect(flatList.props.removeClippedSubviews).toBe(true);
  expect(flatList.props.maxToRenderPerBatch).toBeLessThanOrEqual(10);
  expect(flatList.props.windowSize).toBeLessThanOrEqual(10);
  expect(flatList.props.initialNumToRender).toBeLessThanOrEqual(8);
});
```

#### Scroll Performance Measurement
```typescript
// Measure scroll performance
const measureScrollPerformance = async (component: any) => {
  const scrollTimes: number[] = [];
  
  for (let i = 0; i < 10; i++) {
    const startTime = performance.now();
    
    // Simulate scroll
    fireEvent.scroll(component, {
      nativeEvent: {
        contentOffset: { y: i * 100 },
        contentSize: { height: 10000 },
        layoutMeasurement: { height: 800 },
      },
    });
    
    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, 16));
    
    const scrollTime = performance.now() - startTime;
    scrollTimes.push(scrollTime);
  }
  
  return {
    average: scrollTimes.reduce((a, b) => a + b) / scrollTimes.length,
    max: Math.max(...scrollTimes),
    min: Math.min(...scrollTimes),
  };
};

test('scroll performance meets 60fps target', async () => {
  const testData = generateTestWardrobeData(1000);
  const { getByTestId } = render(<WardrobeScreen testData={testData} />);
  
  const flatList = getByTestId('wardrobe-list');
  const scrollMetrics = await measureScrollPerformance(flatList);
  
  // 60fps = 16.67ms per frame
  expect(scrollMetrics.average).toBeLessThan(16);
  expect(scrollMetrics.max).toBeLessThan(32); // Allow some variance
});
```

### 3. Image Loading Performance Tests

#### Image Cache Tests
```typescript
// Test image caching performance
test('image cache improves loading performance', async () => {
  const imageUrls = Array.from({ length: 100 }, (_, i) => 
    `https://images.pexels.com/photos/${1000000 + i}/test.jpg`
  );
  
  // First load (cold cache)
  const coldStartTime = performance.now();
  await imageCache.preloadImages(imageUrls);
  const coldLoadTime = performance.now() - coldStartTime;
  
  // Second load (warm cache)
  const warmStartTime = performance.now();
  await imageCache.preloadImages(imageUrls);
  const warmLoadTime = performance.now() - warmStartTime;
  
  // Warm cache should be significantly faster
  expect(warmLoadTime).toBeLessThan(coldLoadTime * 0.1);
});
```

#### Image Optimization Tests
```typescript
// Test image URL optimization
test('image URLs are optimized for device', () => {
  const originalUrl = 'https://images.pexels.com/photos/1000000/test.jpg';
  const optimizedUrl = imageCache.getOptimizedImageUrl(originalUrl, 400, 600);
  
  expect(optimizedUrl).toContain('w=400');
  expect(optimizedUrl).toContain('h=600');
  expect(optimizedUrl).toContain('fit=crop');
});
```

### 4. Search and Filter Performance Tests

#### Search Performance
```typescript
// Test search performance with large datasets
test('search performs well with large datasets', async () => {
  const testData = generateTestWardrobeData(5000);
  const { getByPlaceholderText, getByTestId } = render(
    <WardrobeScreen testData={testData} />
  );
  
  const searchInput = getByPlaceholderText('Search your wardrobe...');
  
  const searchTerms = ['shirt', 'blue', 'nike', 'casual'];
  
  for (const term of searchTerms) {
    const startTime = performance.now();
    
    fireEvent.changeText(searchInput, term);
    
    // Wait for search results
    await waitFor(() => {
      expect(getByTestId('wardrobe-list')).toBeTruthy();
    });
    
    const searchTime = performance.now() - startTime;
    
    // Search should complete within 100ms
    expect(searchTime).toBeLessThan(100);
  }
});
```

#### Filter Performance
```typescript
// Test filter performance
test('filters apply quickly with large datasets', async () => {
  const testData = generateTestWardrobeData(2000);
  const { getByText, getByTestId } = render(
    <WardrobeScreen testData={testData} />
  );
  
  // Open filter modal
  fireEvent.press(getByTestId('filter-button'));
  
  const startTime = performance.now();
  
  // Apply multiple filters
  fireEvent.press(getByText('tops'));
  fireEvent.press(getByText('summer'));
  fireEvent.press(getByText('casual'));
  fireEvent.press(getByText('Apply Filters'));
  
  // Wait for filters to apply
  await waitFor(() => {
    expect(getByTestId('wardrobe-list')).toBeTruthy();
  });
  
  const filterTime = performance.now() - startTime;
  
  // Filtering should complete within 200ms
  expect(filterTime).toBeLessThan(200);
});
```

### 5. Responsive Design Tests

#### Device Size Tests
```typescript
// Test responsive behavior across device sizes
describe('Responsive Design Tests', () => {
  const deviceSizes = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
  ];

  deviceSizes.forEach(device => {
    test(`renders correctly on ${device.name}`, () => {
      // Mock device dimensions
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: device.width,
        height: device.height,
        scale: 2,
        fontScale: 1,
      });

      const { getByTestId } = render(<WardrobeScreen />);
      const container = getByTestId('wardrobe-container');
      
      // Verify layout adapts to screen size
      expect(container).toBeTruthy();
      
      // Check grid columns for different screen sizes
      const expectedColumns = device.width < 400 ? 2 : device.width < 768 ? 2 : 3;
      // Add specific assertions based on your grid logic
    });
  });
});
```

#### Orientation Tests
```typescript
// Test orientation changes
test('handles orientation changes gracefully', async () => {
  const { getByTestId, rerender } = render(<WardrobeScreen />);
  
  // Portrait mode
  jest.spyOn(Dimensions, 'get').mockReturnValue({
    width: 375,
    height: 667,
    scale: 2,
    fontScale: 1,
  });
  
  rerender(<WardrobeScreen />);
  
  // Landscape mode
  jest.spyOn(Dimensions, 'get').mockReturnValue({
    width: 667,
    height: 375,
    scale: 2,
    fontScale: 1,
  });
  
  rerender(<WardrobeScreen />);
  
  // Verify layout still works
  expect(getByTestId('wardrobe-list')).toBeTruthy();
});
```

### 6. Animation Performance Tests

#### Animation Smoothness Tests
```typescript
// Test animation performance
test('animations run smoothly', async () => {
  const { getByTestId } = render(<WardrobeScreen />);
  
  const animationTimes: number[] = [];
  
  // Mock requestAnimationFrame to measure animation performance
  const originalRAF = global.requestAnimationFrame;
  global.requestAnimationFrame = jest.fn((callback) => {
    const startTime = performance.now();
    const result = originalRAF(callback);
    const frameTime = performance.now() - startTime;
    animationTimes.push(frameTime);
    return result;
  });
  
  // Trigger animations (e.g., view mode toggle)
  fireEvent.press(getByTestId('view-mode-toggle'));
  
  // Wait for animations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Restore original RAF
  global.requestAnimationFrame = originalRAF;
  
  // Check animation performance
  const averageFrameTime = animationTimes.reduce((a, b) => a + b) / animationTimes.length;
  expect(averageFrameTime).toBeLessThan(16.67); // 60fps target
});
```

## Performance Monitoring in Production

### Real-time Performance Monitoring
```typescript
// Performance monitoring service
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startMeasurement(key: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      
      this.metrics.get(key)!.push(duration);
      
      // Log slow operations
      if (duration > 100) {
        console.warn(`Slow operation detected: ${key} took ${duration.toFixed(2)}ms`);
      }
    };
  }
  
  getMetrics(key: string) {
    const measurements = this.metrics.get(key) || [];
    
    if (measurements.length === 0) {
      return null;
    }
    
    return {
      count: measurements.length,
      average: measurements.reduce((a, b) => a + b) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      p95: measurements.sort((a, b) => a - b)[Math.floor(measurements.length * 0.95)],
    };
  }
  
  clearMetrics() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### Usage in Components
```typescript
// Example usage in wardrobe component
const WardrobeScreen = () => {
  const { startRenderMeasurement, endRenderMeasurement } = useWardrobePerformance();
  
  useEffect(() => {
    startRenderMeasurement();
    
    return () => {
      endRenderMeasurement('WardrobeScreen');
    };
  }, []);
  
  // Component implementation...
};
```

## Performance Optimization Strategies

### 1. List Virtualization
- Use FlatList with proper optimization props
- Implement getItemLayout for consistent item heights
- Use removeClippedSubviews for large lists
- Optimize windowSize and maxToRenderPerBatch

### 2. Image Optimization
- Implement progressive image loading
- Use appropriate image sizes for different screen densities
- Cache frequently accessed images
- Lazy load images outside viewport

### 3. Search and Filter Optimization
- Debounce search input
- Use memoization for filter results
- Implement efficient search algorithms
- Cache filter combinations

### 4. Memory Management
- Clean up event listeners and subscriptions
- Use React.memo for expensive components
- Implement proper key props for list items
- Monitor memory usage in development

### 5. Animation Optimization
- Use native driver for animations when possible
- Avoid animating layout properties
- Use transform and opacity for smooth animations
- Implement proper animation cleanup

## Continuous Performance Testing

### CI/CD Integration
```yaml
# Performance test pipeline
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:performance
      - run: npm run test:memory
      - run: npm run test:responsive
      
      # Upload performance reports
      - uses: actions/upload-artifact@v2
        with:
          name: performance-reports
          path: performance-reports/
```

### Performance Budgets
```json
{
  "performanceBudgets": {
    "initialRender": "200ms",
    "searchResponse": "100ms",
    "filterApplication": "150ms",
    "scrollFrameTime": "16ms",
    "memoryUsage": "50MB",
    "imageLoadTime": "1000ms"
  }
}
```

This comprehensive performance testing strategy ensures the Stylisto wardrobe management UI maintains excellent performance across all device sizes and usage scenarios, providing users with a smooth and responsive experience even with large wardrobes.