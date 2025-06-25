import { Image as ExpoImage } from 'expo-image';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
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
          const optimizedUrl = getOptimizedUrl(
            source.uri,
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
          console.error('Error loading image:', err);
          setError(
            err instanceof Error ? err : new Error('Failed to load image')
          );
          setLoading(false);

          if (typeof source === 'object' && source.uri) {
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
  }, [source, dimensions.width, dimensions.height, priority]);

  const handleLoad = useCallback(() => {
    setLoading(false);
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  const handleError = useCallback(
    (err: any) => {
      setLoading(false);
      setError(err instanceof Error ? err : new Error('Failed to load image'));
      if (onError) {
        onError(err);
      }
    },
    [onError]
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

      <ExpoImage
        source={
          typeof source === 'number'
            ? source
            : {
                uri: imageUri || (typeof source === 'object' ? source.uri : ''),
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
  },
});

export default OptimizedImage;
