import { act, render } from '@testing-library/react-native';
import { PerformanceObserver, performance } from 'perf_hooks';
import React from 'react';
import { Provider } from 'react-redux';
import WardrobeScreen from '../../app/(tabs)/index';
import { store } from '../../store/store';

// Mock router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock hooks
jest.mock('../../hooks/useWardrobe', () => ({
  useWardrobe: () => ({
    filteredItems: Array(100)
      .fill(0)
      .map((_, i) => ({
        id: `item-${i}`,
        name: `Test Item ${i}`,
        category: 'tops',
        subcategory: '',
        color: '#000000',
        season: ['summer'],
        occasion: ['casual'],
        imageUrl: `https://example.com/image-${i}.jpg`,
        tags: [],
        isFavorite: false,
        timesWorn: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    selectedItems: [],
    filters: {
      categories: [],
      seasons: [],
      occasions: [],
      colors: [],
      brands: [],
      tags: [],
      favorites: false,
    },
    sortOptions: {
      field: 'createdAt',
      direction: 'desc',
    },
    searchQuery: '',
    actions: {
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      toggleFavorite: jest.fn(),
      addOutfit: jest.fn(),
      updateOutfit: jest.fn(),
      deleteOutfit: jest.fn(),
      toggleOutfitFavorite: jest.fn(),
      selectItem: jest.fn(),
      deselectItem: jest.fn(),
      clearSelection: jest.fn(),
      setFilters: jest.fn(),
      clearFilters: jest.fn(),
      setSortOptions: jest.fn(),
      setSearchQuery: jest.fn(),
    },
  }),
}));

// Mock performance hooks
jest.mock('../../hooks/useWardrobePerformance', () => ({
  useWardrobePerformance: () => ({
    startRenderMeasurement: jest.fn(),
    endRenderMeasurement: jest.fn(),
    scheduleAfterInteractions: (callback: () => void) =>
      setTimeout(callback, 0),
    optimizeForLargeList: () => ({
      removeClippedSubviews: true,
      maxToRenderPerBatch: 5,
      windowSize: 5,
      initialNumToRender: 8,
      updateCellsBatchingPeriod: 100,
    }),
  }),
}));

describe('App Performance Tests', () => {
  // Set up performance observer
  let perfObserver: PerformanceObserver;
  let entries: PerformanceEntry[] = [];

  beforeAll(() => {
    perfObserver = new PerformanceObserver(list => {
      entries = entries.concat(list.getEntries());
    });
    perfObserver.observe({ entryTypes: ['measure'] });
  });

  afterAll(() => {
    perfObserver.disconnect();
  });

  beforeEach(() => {
    entries = [];
    performance.clearMarks();
    performance.clearMeasures();
  });

  test('WardrobeScreen renders within performance budget', async () => {
    performance.mark('render-start');

    const { getByTestId } = render(
      <Provider store={store}>
        <WardrobeScreen />
      </Provider>
    );

    // Wait for any async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    performance.mark('render-end');
    performance.measure('render-time', 'render-start', 'render-end');

    // Find the render time measurement
    const renderMeasure = entries.find(entry => entry.name === 'render-time');

    // Verify component rendered
    expect(getByTestId('wardrobe-container')).toBeTruthy();

    // Check render time is within budget
    expect(renderMeasure).toBeDefined();
    if (renderMeasure) {
      expect(renderMeasure.duration).toBeLessThan(1000); // 1 second budget
    }
  });

  test('Search functionality performs efficiently', async () => {
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <WardrobeScreen />
      </Provider>
    );

    // Wait for initial render
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Find search input
    const searchInput = getByPlaceholderText('Search your wardrobe...');

    // Measure search performance
    performance.mark('search-start');

    // Type in search input
    act(() => {
      searchInput.props.onChangeText('test');
    });

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    performance.mark('search-end');
    performance.measure('search-time', 'search-start', 'search-end');

    // Find the search time measurement
    const searchMeasure = entries.find(entry => entry.name === 'search-time');

    // Check search time is within budget
    expect(searchMeasure).toBeDefined();
    if (searchMeasure) {
      expect(searchMeasure.duration).toBeLessThan(500); // 500ms budget
    }
  });

  test('View mode toggle performs efficiently', async () => {
    const { getByLabelText } = render(
      <Provider store={store}>
        <WardrobeScreen />
      </Provider>
    );

    // Wait for initial render
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Find view mode toggle button
    const toggleButton = getByLabelText('Switch to list view');

    // Measure toggle performance
    performance.mark('toggle-start');

    // Press toggle button
    act(() => {
      toggleButton.props.onPress();
    });

    // Wait for animation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    performance.mark('toggle-end');
    performance.measure('toggle-time', 'toggle-start', 'toggle-end');

    // Find the toggle time measurement
    const toggleMeasure = entries.find(entry => entry.name === 'toggle-time');

    // Check toggle time is within budget
    expect(toggleMeasure).toBeDefined();
    if (toggleMeasure) {
      expect(toggleMeasure.duration).toBeLessThan(500); // 500ms budget
    }
  });
});
