import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { LRUCache } from 'lru-cache';
import { Platform } from 'react-native';
import {
  ErrorCategory,
  errorHandling,
  ErrorSeverity,
} from '../lib/errorHandling';

interface CacheEntry {
  url: string;
  timestamp: number;
  size?: number;
  localUri?: string;
  width?: number;
  height?: number;
}

interface CacheOptions {
  maxAge?: number;
  maxEntries?: number;
  maxSize?: number;
  prefetch?: boolean;
}

class ImageCacheManager {
  private static instance: ImageCacheManager;
  private memoryCache: LRUCache<string, CacheEntry>;
  private readonly CACHE_KEY = '@wardrobe_image_cache';
  private readonly CACHE_DIR = `${FileSystem.cacheDirectory}image-cache/`;
  private readonly MAX_CACHE_SIZE = 200 * 1024 * 1024; // 200MB
  private readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_ENTRIES = 1000;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private pendingDownloads = new Map<string, Promise<string>>();

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  constructor() {
    // Initialize LRU cache for in-memory caching
    this.memoryCache = new LRUCache<string, CacheEntry>({
      max: 200, // Maximum number of items in memory
      ttl: 30 * 60 * 1000, // 30 minutes
      updateAgeOnGet: true,
      allowStale: false,
    });

    // Start initialization
    this.initPromise = this.initialize();
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, {
          intermediates: true,
        });
      }

      // Load cache metadata
      await this.loadCacheMetadata();

      // Clean expired entries
      await this.cleanExpiredEntries();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
      errorHandling.captureError(
        error instanceof Error
          ? error
          : new Error('Failed to initialize image cache'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.STORAGE,
        }
      );
    }
  }

  private async loadCacheMetadata() {
    try {
      // Load from AsyncStorage
      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const entries: CacheEntry[] = JSON.parse(cachedData);
        entries.forEach(entry => {
          this.memoryCache.set(entry.url, entry);
        });
      }
    } catch (error) {
      console.error('Failed to load cache metadata:', error);
    }
  }

  async getCachedImageUri(
    url: string,
    options: CacheOptions = {}
  ): Promise<string> {
    // Wait for initialization if needed
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }

    // Check if URL is already being downloaded
    if (this.pendingDownloads.has(url)) {
      return this.pendingDownloads.get(url)!;
    }

    // Check memory cache first
    const cachedEntry = this.memoryCache.get(url);
    if (cachedEntry && cachedEntry.localUri) {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(cachedEntry.localUri);
      if (fileInfo.exists) {
        // Check if expired
        const isExpired =
          Date.now() - cachedEntry.timestamp >
          (options.maxAge || this.MAX_CACHE_AGE);
        if (!isExpired) {
          return cachedEntry.localUri;
        }
      }
    }

    // Download and cache the image
    const downloadPromise = this.downloadAndCacheImage(url, options);
    this.pendingDownloads.set(url, downloadPromise);

    try {
      const localUri = await downloadPromise;
      return localUri;
    } finally {
      this.pendingDownloads.delete(url);
    }
  }

  private async downloadAndCacheImage(
    url: string,
    options: CacheOptions = {}
  ): Promise<string> {
    try {
      // Generate a filename based on URL
      const filename = this.getFilenameFromUrl(url);
      const localUri = `${this.CACHE_DIR}${filename}`;

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(url, localUri);

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(localUri);

      // Create cache entry
      const entry: CacheEntry = {
        url,
        timestamp: Date.now(),
        localUri,
        size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : undefined,
      };

      // Add to memory cache
      this.memoryCache.set(url, entry);

      // Update persistent cache metadata
      await this.persistCacheMetadata();

      // Check cache limits
      await this.enforceCacheLimits();

      return localUri;
    } catch (error) {
      console.error(`Failed to download and cache image: ${url}`, error);
      // Return original URL as fallback
      return url;
    }
  }

  private getFilenameFromUrl(url: string): string {
    // Create a hash of the URL to use as filename
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = (hash << 5) - hash + url.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    // Extract extension from URL or default to jpg
    const extension =
      url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    return `${Math.abs(hash)}.${extension}`;
  }

  private async persistCacheMetadata() {
    try {
      const entries = Array.from(this.memoryCache.values());
      const data = JSON.stringify(entries);

      // Store in AsyncStorage
      await AsyncStorage.setItem(this.CACHE_KEY, data);
    } catch (error) {
      console.error('Failed to persist cache metadata:', error);
    }
  }

  private async enforceCacheLimits() {
    try {
      // Check number of entries
      if (this.memoryCache.size > this.MAX_ENTRIES) {
        // LRU cache will automatically handle eviction
        // We just need to delete the files for evicted entries
        const entriesToRemove = this.memoryCache.size - this.MAX_ENTRIES;
        const entries = Array.from(this.memoryCache.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)
          .slice(0, entriesToRemove);

        for (const [url, entry] of entries) {
          this.memoryCache.delete(url);
          if (entry.localUri) {
            await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
          }
        }
      }

      // Check total size
      const entries = Array.from(this.memoryCache.values());
      const totalSize = entries.reduce(
        (sum, entry) => sum + (entry.size || 0),
        0
      );

      if (totalSize > this.MAX_CACHE_SIZE) {
        // Remove oldest entries until we're under the limit
        const sortedEntries = [...entries].sort(
          (a, b) => a.timestamp - b.timestamp
        );
        let currentSize = totalSize;

        for (const entry of sortedEntries) {
          if (currentSize <= this.MAX_CACHE_SIZE * 0.8) break; // Stop when we reach 80% capacity

          this.memoryCache.delete(entry.url);
          if (entry.localUri) {
            await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
          }

          currentSize -= entry.size || 0;
        }

        // Update persistent cache
        await this.persistCacheMetadata();
      }
    } catch (error) {
      console.error('Failed to enforce cache limits:', error);
    }
  }

  async cleanExpiredEntries(): Promise<number> {
    try {
      const now = Date.now();
      const expiredUrls: string[] = [];

      this.memoryCache.forEach((entry, url) => {
        if (now - entry.timestamp > this.MAX_CACHE_AGE) {
          expiredUrls.push(url);
        }
      });

      // Delete expired entries
      for (const url of expiredUrls) {
        const entry = this.memoryCache.get(url);
        this.memoryCache.delete(url);

        if (entry?.localUri) {
          await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
        }
      }

      if (expiredUrls.length > 0) {
        await this.persistCacheMetadata();
      }

      return expiredUrls.length;
    } catch (error) {
      console.error('Failed to clean expired entries:', error);
      return 0;
    }
  }

  async clearCache(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear persistent metadata
      await AsyncStorage.removeItem(this.CACHE_KEY);

      // Delete all cached files
      await FileSystem.deleteAsync(this.CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.CACHE_DIR, {
        intermediates: true,
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  getCacheStats() {
    const entries = Array.from(this.memoryCache.values());
    const totalSize = entries.reduce(
      (sum, entry) => sum + (entry.size || 0),
      0
    );

    return {
      entries: this.memoryCache.size,
      size: totalSize,
      maxEntries: this.MAX_ENTRIES,
      maxSize: this.MAX_CACHE_SIZE,
      utilizationPercent: (totalSize / this.MAX_CACHE_SIZE) * 100,
    };
  }

  // Preload images for better performance
  async preloadImages(urls: string[], options: CacheOptions = {}) {
    // Wait for initialization if needed
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }

    const preloadPromises = urls.map(url =>
      this.getCachedImageUri(url, options)
    );
    return Promise.allSettled(preloadPromises);
  }

  // Get optimized image URL based on device capabilities
  getOptimizedImageUrl(
    originalUrl: string,
    targetWidth?: number,
    targetHeight?: number
  ): string {
    if (!originalUrl) return originalUrl;

    // For Pexels images, we can use their resize API
    if (originalUrl.includes('pexels.com')) {
      try {
        const url = new URL(originalUrl);

        if (targetWidth && targetHeight) {
          // Add resize parameters
          url.searchParams.set('auto', 'compress');
          url.searchParams.set('cs', 'tinysrgb');
          url.searchParams.set('w', targetWidth.toString());
          url.searchParams.set('h', targetHeight.toString());
          url.searchParams.set(
            'dpr',
            (Platform.OS === 'web' ? window.devicePixelRatio : 2).toString()
          );
        }

        return url.toString();
      } catch (error) {
        // If URL parsing fails, return original URL
        return originalUrl;
      }
    }

    return originalUrl;
  }
}

export const imageCache = ImageCacheManager.getInstance();

// Hook for using image cache in components
export const useImageCache = () => {
  const getCachedImageUri = (url: string, options?: CacheOptions) => {
    return imageCache.getCachedImageUri(url, options);
  };

  const getOptimizedUrl = (url: string, width?: number, height?: number) => {
    return imageCache.getOptimizedImageUrl(url, width, height);
  };

  const preloadImages = (urls: string[], options?: CacheOptions) => {
    return imageCache.preloadImages(urls, options);
  };

  const getCacheStats = () => {
    return imageCache.getCacheStats();
  };

  const clearCache = () => {
    return imageCache.clearCache();
  };

  return {
    getCachedImageUri,
    getOptimizedUrl,
    preloadImages,
    getCacheStats,
    clearCache,
  };
};
