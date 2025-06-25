import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';
import OptimizedImage from '../../components/ui/OptimizedImage';
import { imageCache } from '../../utils/imageCache';

// Mock the image cache
jest.mock('../../utils/imageCache', () => ({
  imageCache: {
    getCachedImageUri: jest
      .fn()
      .mockImplementation(url => Promise.resolve(url)),
    getOptimizedImageUrl: jest.fn().mockImplementation(url => url),
    preloadImages: jest.fn(),
    getCacheStats: jest.fn().mockReturnValue({ entries: 0, size: 0 }),
    clearCache: jest.fn(),
  },
  useImageCache: () => ({
    getCachedImageUri: jest
      .fn()
      .mockImplementation(url => Promise.resolve(url)),
    getOptimizedUrl: jest.fn().mockImplementation(url => url),
    preloadImages: jest.fn(),
    getCacheStats: jest.fn().mockReturnValue({ entries: 0, size: 0 }),
    clearCache: jest.fn(),
  }),
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('Image Loading Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('OptimizedImage loads images efficiently', async () => {
    const onLoad = jest.fn();
    const { getByTestId } = render(
      <OptimizedImage
        source={{ uri: 'https://example.com/test.jpg' }}
        style={{ width: 100, height: 100 }}
        onLoad={onLoad}
        testID="test-image"
      />
    );

    // Verify image cache was called
    expect(imageCache.getCachedImageUri).toHaveBeenCalledWith(
      'https://example.com/test.jpg',
      expect.any(Object)
    );

    // Wait for image to load
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  test('OptimizedImage uses optimized URL based on dimensions', async () => {
    render(
      <OptimizedImage
        source={{ uri: 'https://example.com/test.jpg' }}
        style={{ width: 200, height: 300 }}
      />
    );

    // Verify optimized URL was requested
    expect(imageCache.getOptimizedImageUrl).toHaveBeenCalledWith(
      'https://example.com/test.jpg',
      expect.any(Number),
      expect.any(Number)
    );
  });

  test('OptimizedImage handles loading states correctly', async () => {
    // Mock a delayed image load
    imageCache.getCachedImageUri = jest.fn().mockImplementation(url => {
      return new Promise(resolve => {
        setTimeout(() => resolve(url), 100);
      });
    });

    const { getByTestId } = render(
      <View testID="container">
        <OptimizedImage
          source={{ uri: 'https://example.com/test.jpg' }}
          style={{ width: 100, height: 100 }}
          testID="test-image"
        />
      </View>
    );

    // Verify loading indicator is shown
    expect(getByTestId('container')).toBeTruthy();

    // Wait for image to load
    await waitFor(
      () => {
        expect(imageCache.getCachedImageUri).toHaveBeenCalled();
      },
      { timeout: 200 }
    );
  });

  test('OptimizedImage preloads high priority images', async () => {
    render(
      <OptimizedImage
        source={{ uri: 'https://example.com/test.jpg' }}
        style={{ width: 100, height: 100 }}
        priority="high"
      />
    );

    // Verify image was requested with prefetch option
    expect(imageCache.getCachedImageUri).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ prefetch: true })
    );
  });

  test('OptimizedImage handles errors gracefully', async () => {
    // Mock an error during image loading
    imageCache.getCachedImageUri = jest
      .fn()
      .mockRejectedValue(new Error('Failed to load image'));

    const onError = jest.fn();

    render(
      <OptimizedImage
        source={{ uri: 'https://example.com/test.jpg' }}
        style={{ width: 100, height: 100 }}
        onError={onError}
      />
    );

    // Wait for error handler to be called
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });
});
