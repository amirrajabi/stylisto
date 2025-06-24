import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry {
  url: string;
  timestamp: number;
  size?: number;
}

class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_KEY = '@wardrobe_image_cache';
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_ENTRIES = 500;

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  async initialize() {
    try {
      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const entries: CacheEntry[] = JSON.parse(cachedData);
        entries.forEach(entry => {
          this.cache.set(entry.url, entry);
        });
        
        // Clean expired entries
        await this.cleanExpiredEntries();
      }
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  async addToCache(url: string, size?: number) {
    const entry: CacheEntry = {
      url,
      timestamp: Date.now(),
      size,
    };

    this.cache.set(url, entry);
    
    // Check cache limits
    await this.enforceCacheLimits();
    await this.persistCache();
  }

  isCached(url: string): boolean {
    const entry = this.cache.get(url);
    if (!entry) return false;
    
    // Check if entry is expired
    const isExpired = Date.now() - entry.timestamp > this.MAX_CACHE_AGE;
    if (isExpired) {
      this.cache.delete(url);
      return false;
    }
    
    return true;
  }

  getCacheInfo() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
    
    return {
      entryCount: this.cache.size,
      totalSize,
      maxSize: this.MAX_CACHE_SIZE,
      maxEntries: this.MAX_ENTRIES,
      utilizationPercent: (totalSize / this.MAX_CACHE_SIZE) * 100,
    };
  }

  async clearCache() {
    this.cache.clear();
    await AsyncStorage.removeItem(this.CACHE_KEY);
  }

  async clearExpiredEntries() {
    const now = Date.now();
    const expiredUrls: string[] = [];
    
    this.cache.forEach((entry, url) => {
      if (now - entry.timestamp > this.MAX_CACHE_AGE) {
        expiredUrls.push(url);
      }
    });
    
    expiredUrls.forEach(url => this.cache.delete(url));
    
    if (expiredUrls.length > 0) {
      await this.persistCache();
    }
    
    return expiredUrls.length;
  }

  private async enforceCacheLimits() {
    // Remove oldest entries if we exceed max entries
    if (this.cache.size > this.MAX_ENTRIES) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const entriesToRemove = entries.slice(0, this.cache.size - this.MAX_ENTRIES);
      entriesToRemove.forEach(([url]) => this.cache.delete(url));
    }
    
    // Remove oldest entries if we exceed max size
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + (entry.size || 0), 0);
    
    if (totalSize > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      let currentSize = totalSize;
      for (const [url, entry] of entries) {
        if (currentSize <= this.MAX_CACHE_SIZE * 0.8) break; // Remove until 80% capacity
        
        this.cache.delete(url);
        currentSize -= entry.size || 0;
      }
    }
  }

  private async persistCache() {
    try {
      const entries = Array.from(this.cache.values());
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to persist image cache:', error);
    }
  }

  // Preload images for better performance
  async preloadImages(urls: string[]) {
    const preloadPromises = urls.map(async (url) => {
      if (this.isCached(url)) return;
      
      try {
        // For React Native, we can't actually preload images like in web
        // But we can mark them as "seen" in our cache
        await this.addToCache(url);
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  // Get optimized image URL based on device capabilities
  getOptimizedImageUrl(originalUrl: string, targetWidth?: number, targetHeight?: number): string {
    if (!originalUrl) return originalUrl;
    
    // For Pexels images, we can use their resize API
    if (originalUrl.includes('pexels.com')) {
      const url = new URL(originalUrl);
      
      if (targetWidth && targetHeight) {
        // Add resize parameters
        url.searchParams.set('w', targetWidth.toString());
        url.searchParams.set('h', targetHeight.toString());
        url.searchParams.set('fit', 'crop');
      }
      
      return url.toString();
    }
    
    return originalUrl;
  }
}

export const imageCache = ImageCacheManager.getInstance();

// Hook for using image cache in components
export const useImageCache = () => {
  const addToCache = (url: string, size?: number) => {
    imageCache.addToCache(url, size);
  };

  const isCached = (url: string) => {
    return imageCache.isCached(url);
  };

  const getOptimizedUrl = (url: string, width?: number, height?: number) => {
    return imageCache.getOptimizedImageUrl(url, width, height);
  };

  const preloadImages = (urls: string[]) => {
    return imageCache.preloadImages(urls);
  };

  const getCacheInfo = () => {
    return imageCache.getCacheInfo();
  };

  const clearCache = () => {
    return imageCache.clearCache();
  };

  return {
    addToCache,
    isCached,
    getOptimizedUrl,
    preloadImages,
    getCacheInfo,
    clearCache,
  };
};