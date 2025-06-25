import { Image as ExpoImage } from 'expo-image';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { storageService } from '../../lib/storage';
import { useImageCache } from '../../utils/imageCache';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: { uri: string } | number;
  blurhash?: string;
  transition?: number;
  onLoad?: () => void;
  onError?: (error: any) => void;
  accessibilityLabel?: string;
  testID?: string;
  priority?: 'low' | 'normal' | 'high';
  recyclingKey?: string;
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
}

const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  blurhash,
  transition = 300,
  onLoad,
  onError,
  accessibilityLabel,
  testID,
  priority = 'normal',
  recyclingKey,
  cachePolicy = 'memory-disk',
}) => {
  const { getCachedImageUri, getOptimizedUrl } = useImageCache();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [retryCount, setRetryCount] = useState(0);

  // Validate URL
  const isValidUrl = useCallback((url: string): boolean => {
    if (!url || url.trim() === '') return false;

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Check if URL is a Supabase storage URL
  const isSupabaseStorageUrl = useCallback((url: string): boolean => {
    return (
      url.includes('supabase.co/storage') ||
      url.includes('/storage/v1/object/public/')
    );
  }, []);

  // Extract path from Supabase storage URL
  const extractStoragePath = useCallback((url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(
        part => part === 'wardrobe-images'
      );

      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }

      return null;
    } catch {
      return null;
    }
  }, []);

  // Debug utility to test URL accessibility
  const debugUrl = useCallback(async (url: string) => {
    if (!__DEV__) return false;

    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        console.warn(
          `URL check failed: ${response.status} ${response.statusText}`
        );
      }
      return response.ok;
    } catch (error) {
      console.warn(
        'URL not accessible:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return false;
    }
  }, []);

  // Try to get a signed URL for Supabase storage files
  const trySignedUrl = useCallback(
    async (originalUrl: string): Promise<string | null> => {
      if (!isSupabaseStorageUrl(originalUrl)) {
        return null;
      }

      const path = extractStoragePath(originalUrl);
      if (!path) {
        if (__DEV__) {
          console.warn('Could not extract storage path from URL');
        }
        return null;
      }

      try {
        await debugUrl(originalUrl);

        const { data, error } = await storageService.createSignedUrl(
          path,
          3600
        );
        if (error || !data) {
          if (__DEV__) {
            console.warn(
              'Failed to create signed URL:',
              error?.message || 'Unknown error'
            );
          }
          return null;
        }

        await debugUrl(data.signedUrl);
        return data.signedUrl;
      } catch (error) {
        if (__DEV__) {
          console.warn(
            'Error creating signed URL:',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        return null;
      }
    },
    [isSupabaseStorageUrl, extractStoragePath, debugUrl]
  );

  // Try to repair common URL issues
  const tryRepairUrl = useCallback(
    (originalUrl: string): string[] => {
      const variations: string[] = [originalUrl];

      if (isSupabaseStorageUrl(originalUrl)) {
        try {
          const urlObj = new URL(originalUrl);

          // Remove transform parameters that might be causing issues
          const cleanParams = new URLSearchParams();
          urlObj.searchParams.forEach((value, key) => {
            // Keep essential parameters, remove transform ones that might fail
            if (
              ![
                'width',
                'height',
                'resize',
                'format',
                'quality',
                'auto',
                'cs',
                'w',
                'h',
                'dpr',
              ].includes(key)
            ) {
              cleanParams.append(key, value);
            }
          });

          urlObj.search = cleanParams.toString();
          const cleanUrl = urlObj.toString();
          if (cleanUrl !== originalUrl) {
            variations.push(cleanUrl);
          }

          // Try without any query parameters
          urlObj.search = '';
          const baseUrl = urlObj.toString();
          if (baseUrl !== originalUrl && baseUrl !== cleanUrl) {
            variations.push(baseUrl);
          }

          if (__DEV__) {
            console.log('Trying URL variations:', variations.length);
          }
        } catch (error) {
          if (__DEV__) {
            console.warn(
              'Error creating URL variations:',
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        }
      }

      return variations;
    },
    [isSupabaseStorageUrl]
  );

  useEffect(() => {
    if (style) {
      const flatStyle = StyleSheet.flatten(style);
      const width = typeof flatStyle.width === 'number' ? flatStyle.width : 0;
      const height =
        typeof flatStyle.height === 'number' ? flatStyle.height : 0;
      setDimensions({ width, height });
    }
  }, [style]);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        if (typeof source === 'number') {
          setImageUri(null);
          setLoading(false);
          return;
        }

        if (typeof source === 'object' && source.uri) {
          // Validate URL first
          if (!isValidUrl(source.uri)) {
            if (isMounted) {
              setError(new Error('Invalid image URL'));
              setLoading(false);
              if (onError) {
                onError(new Error('Invalid image URL'));
              }
            }
            return;
          }

          let urlToTry = source.uri;

          // If this is a retry and it's a Supabase storage URL, try different approaches
          if (retryCount > 0 && isSupabaseStorageUrl(source.uri)) {
            if (__DEV__) {
              console.log(`Retry attempt: ${retryCount}`);
            }

            if (retryCount === 1) {
              // First retry: try signed URL
              if (__DEV__) {
                console.log('Trying signed URL approach...');
              }
              const signedUrl = await trySignedUrl(source.uri);
              if (signedUrl) {
                urlToTry = signedUrl;
                if (__DEV__) {
                  console.log('Using signed URL');
                }
              }
            } else if (retryCount === 2) {
              // Second retry: try URL variations
              if (__DEV__) {
                console.log('Trying URL repair approaches...');
              }
              const variations = tryRepairUrl(source.uri);

              // Try the first alternative (usually the cleanest)
              if (variations.length > 1) {
                urlToTry = variations[1];
                if (__DEV__) {
                  console.log('Trying URL variation');
                }
              }
            }
          }

          const optimizedUrl = getOptimizedUrl(
            urlToTry,
            dimensions.width > 0 ? dimensions.width : undefined,
            dimensions.height > 0 ? dimensions.height : undefined
          );

          const cachedUri = await getCachedImageUri(optimizedUrl, {
            prefetch: priority === 'high',
          });

          if (isMounted) {
            setImageUri(cachedUri);
            setLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (__DEV__) {
            console.warn(
              'Error loading image:',
              err instanceof Error ? err.message : 'Unknown error'
            );
          }

          // If it's a Supabase storage URL and we haven't exhausted retries, try again
          if (
            retryCount < 2 &&
            typeof source === 'object' &&
            source.uri &&
            isSupabaseStorageUrl(source.uri)
          ) {
            if (__DEV__) {
              console.log(`Retrying image load (${retryCount + 1}/2)`);
            }
            setRetryCount(prev => prev + 1);
            return; // This will trigger the effect to run again
          }

          setError(
            err instanceof Error ? err : new Error('Failed to load image')
          );
          setLoading(false);

          if (
            typeof source === 'object' &&
            source.uri &&
            isValidUrl(source.uri)
          ) {
            setImageUri(source.uri);
          }

          if (onError) {
            onError(err);
          }
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [
    source,
    dimensions.width,
    dimensions.height,
    priority,
    isValidUrl,
    retryCount,
    isSupabaseStorageUrl,
    trySignedUrl,
    tryRepairUrl,
  ]);

  const handleLoad = useCallback(() => {
    setLoading(false);
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  const handleError = useCallback(
    (err: any) => {
      const sourceUri = typeof source === 'object' ? source.uri : source;
      const isSupabaseUrl =
        typeof sourceUri === 'string' && isSupabaseStorageUrl(sourceUri);

      // More concise error logging
      if (__DEV__) {
        console.warn('Image load failed:', {
          url:
            typeof sourceUri === 'string'
              ? sourceUri.substring(0, 100) + '...'
              : sourceUri,
          retry: retryCount,
          isSupabase: isSupabaseUrl,
          errorType: err?.message || 'Unknown error',
        });
      }

      // If it's a Supabase storage URL and we haven't exhausted retries, try again
      if (
        retryCount < 2 &&
        typeof source === 'object' &&
        source.uri &&
        isSupabaseStorageUrl(source.uri)
      ) {
        if (__DEV__) {
          console.log(`Retrying image load (${retryCount + 1}/2)...`);
        }
        setRetryCount(prev => prev + 1);
        return; // Don't set error state yet, let it retry
      }

      // If all retries failed or it's not a Supabase URL, set error state
      if (__DEV__) {
        console.warn('Image load failed permanently, showing error state');
      }
      setLoading(false);
      setError(err instanceof Error ? err : new Error('Failed to load image'));

      if (onError) {
        onError(err);
      }
    },
    [onError, retryCount, source, isSupabaseStorageUrl]
  );

  const getExpoImagePriority = () => {
    switch (priority) {
      case 'low':
        return 'low' as const;
      case 'high':
        return 'high' as const;
      default:
        return 'normal' as const;
    }
  };

  const getExpoImageCachePolicy = () => {
    switch (cachePolicy) {
      case 'none':
        return 'none' as const;
      case 'disk':
        return 'disk' as const;
      case 'memory':
        return 'memory' as const;
      case 'memory-disk':
        return 'memory-disk' as const;
      default:
        return 'memory-disk' as const;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {loading && placeholder && (
        <ExpoImage
          source={placeholder}
          style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
          contentFit={contentFit}
          cachePolicy={getExpoImageCachePolicy()}
        />
      )}

      {loading && !placeholder && blurhash && (
        <ExpoImage
          style={StyleSheet.absoluteFill}
          placeholder={blurhash}
          contentFit={contentFit}
          cachePolicy={getExpoImageCachePolicy()}
        />
      )}

      {loading && !placeholder && !blurhash && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Colors.primary[500]} />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorText}>📷</Text>
          </View>
          <Text style={styles.errorMessage}>Image not available</Text>
          {__DEV__ &&
            typeof source === 'object' &&
            source.uri &&
            isSupabaseStorageUrl(source.uri) && (
              <Text style={styles.debugText}>Storage access issue</Text>
            )}
        </View>
      )}

      {!error && (
        <ExpoImage
          source={
            typeof source === 'number'
              ? source
              : {
                  uri:
                    imageUri || (typeof source === 'object' ? source.uri : ''),
                }
          }
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={transition}
          onLoad={handleLoad}
          onError={handleError}
          accessible={!!accessibilityLabel}
          accessibilityLabel={accessibilityLabel}
          testID={testID}
          priority={getExpoImagePriority()}
          cachePolicy={getExpoImageCachePolicy()}
          recyclingKey={recyclingKey}
        />
      )}
    </View>
  );
};

const OptimizedImage = memo(OptimizedImageComponent);
OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.neutral[100],
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderStyle: 'dashed',
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 32,
    opacity: 0.5,
  },
  errorMessage: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  debugText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default OptimizedImage;
