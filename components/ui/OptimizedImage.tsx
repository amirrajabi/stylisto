import { Image as ExpoImage } from 'expo-image';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [processedSource, setProcessedSource] = useState<
    { uri: string } | number
  >(source);

  // Fix problematic URLs once when source changes
  useEffect(() => {
    if (typeof source === 'object' && source.uri) {
      // Fix render/image URLs to object URLs
      if (source.uri.includes('/render/image/')) {
        const fixedUri = source.uri.replace('/render/image/', '/object/');
        setProcessedSource({ uri: fixedUri });
      } else {
        setProcessedSource(source);
      }
    } else {
      setProcessedSource(source);
    }
    setLoading(true);
    setError(null);
  }, [source]);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(null);
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

  const hasValidSource =
    typeof processedSource === 'number' ||
    (typeof processedSource === 'object' &&
      processedSource.uri &&
      processedSource.uri.trim() !== '');

  return (
    <View style={[styles.container, style]}>
      {loading && placeholder && (
        <ExpoImage
          source={placeholder}
          style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
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
          {priority !== 'high' && (
            <Text style={styles.loadingText}>Loading...</Text>
          )}
        </View>
      )}

      {(!hasValidSource || error) && (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorText}>👕</Text>
          </View>
          <Text style={styles.errorMessage}>
            {!hasValidSource ? 'No image available' : 'Image not available'}
          </Text>
        </View>
      )}

      {hasValidSource && (
        <ExpoImage
          source={processedSource}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={priority === 'high' ? 150 : transition}
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
    position: 'relative',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    minHeight: 40,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderStyle: 'dashed',
    minHeight: 80,
  },
  errorIcon: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
  },
  errorText: {
    fontSize: 28,
    opacity: 0.6,
  },
  errorMessage: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default OptimizedImage;
