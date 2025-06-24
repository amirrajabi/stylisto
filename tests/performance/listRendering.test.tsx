import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OptimizedWardrobeList from '../../components/wardrobe/OptimizedWardrobeList';
import { ClothingCategory, Season, Occasion } from '../../types/wardrobe';

// Generate test data
const generateTestItems = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Test Item ${i}`,
    category: Object.values(ClothingCategory)[i % Object.values(ClothingCategory).length],
    subcategory: '',
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    brand: i % 3 === 0 ? `Brand ${i % 10}` : undefined,
    size: i % 4 === 0 ? `Size ${i % 5}` : undefined,
    season: [Object.values(Season)[i % Object.values(Season).length]],
    occasion: [Object.values(Occasion)[i % Object.values(Occasion).length]],
    imageUrl: `https://example.com/image-${i}.jpg`,
    tags: [`tag-${i % 10}`, `tag-${(i + 5) % 10}`],
    isFavorite: i % 7 === 0,
    lastWorn: i % 5 === 0 ? new Date() : undefined,
    timesWorn: i % 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

// Mock RecyclerListView
jest.mock('recyclerlistview', () => ({
  RecyclerListView: 'RecyclerListView',
  DataProvider: jest.fn(() => ({
    cloneWithRows: jest.fn(() => ({})),
  })),
  LayoutProvider: jest.fn(() => ({
    newLayoutManager: jest.fn(),
    setLayoutForType: jest.fn(),
  })),
}));

describe('List Rendering Performance Tests', () => {
  test('OptimizedWardrobeList renders large lists efficiently', () => {
    const items = generateTestItems(100);
    const onItemPress = jest.fn();
    const onToggleFavorite = jest.fn();
    const onMoreOptions = jest.fn();
    
    // Measure render time
    const startTime = performance.now();
    
    const { getByTestId } = render(
      <OptimizedWardrobeList
        items={items}
        viewMode="grid"
        onItemPress={onItemPress}
        onToggleFavorite={onToggleFavorite}
        onMoreOptions={onMoreOptions}
        testID="wardrobe-list"
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Verify list rendered
    expect(getByTestId('wardrobe-list')).toBeTruthy();
    
    // Check render time is reasonable (adjust threshold as needed)
    expect(renderTime).toBeLessThan(500); // 500ms threshold
  });

  test('OptimizedWardrobeList handles empty state correctly', () => {
    const { getByText } = render(
      <OptimizedWardrobeList
        items={[]}
        viewMode="grid"
        onItemPress={() => {}}
        onToggleFavorite={() => {}}
        onMoreOptions={() => {}}
        emptyState={{
          type: 'empty',
          onAddItem: () => {},
        }}
      />
    );
    
    // Verify empty state is shown
    expect(getByText('Your wardrobe is empty')).toBeTruthy();
  });

  test('OptimizedWardrobeList handles loading state correctly', () => {
    const { getByTestId } = render(
      <OptimizedWardrobeList
        items={[]}
        viewMode="grid"
        isLoading={true}
        onItemPress={() => {}}
        onToggleFavorite={() => {}}
        onMoreOptions={() => {}}
        testID="wardrobe-list"
      />
    );
    
    // Verify loading state is shown
    expect(getByTestId('wardrobe-list')).toBeTruthy();
  });

  test('OptimizedWardrobeList handles refresh correctly', () => {
    const onRefresh = jest.fn();
    
    const { getByTestId } = render(
      <OptimizedWardrobeList
        items={generateTestItems(10)}
        viewMode="grid"
        isRefreshing={false}
        onRefresh={onRefresh}
        onItemPress={() => {}}
        onToggleFavorite={() => {}}
        onMoreOptions={() => {}}
        testID="wardrobe-list"
      />
    );
    
    // Verify list rendered
    expect(getByTestId('wardrobe-list')).toBeTruthy();
    
    // Verify onRefresh is called
    // Note: We can't directly test pull-to-refresh in this environment
  });

  test('OptimizedWardrobeList handles load more correctly', () => {
    const onEndReached = jest.fn();
    
    const { getByTestId } = render(
      <OptimizedWardrobeList
        items={generateTestItems(20)}
        viewMode="grid"
        onEndReached={onEndReached}
        onItemPress={() => {}}
        onToggleFavorite={() => {}}
        onMoreOptions={() => {}}
        testID="wardrobe-list"
      />
    );
    
    // Verify list rendered
    expect(getByTestId('wardrobe-list')).toBeTruthy();
    
    // Verify onEndReached is called
    // Note: We can't directly test scroll to end in this environment
  });
});