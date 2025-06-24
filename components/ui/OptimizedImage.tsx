import { Image as ExpoImage } from 'expo-image';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useImageCache } from '../../utils/imageCache';

// Conditionally import FastImage only for native platforms
let FastImage: any = null;
if (Platform.OS !== 'web') {
  FastImage = require('react-native-fast-image').default;
}

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
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
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
  resizeMode,
}) => {
  const { getCachedImageUri, getOptimizedUrl } = useImageCache();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get image dimensions from style
  useEffect(() => {
    if (style) {
      const flatStyle = StyleSheet.flatten(style);
      const width = typeof flatStyle.width === 'number' ? flatStyle.width : 0;
      const height =
        typeof flatStyle.height === 'number' ? flatStyle.height : 0;
      setDimensions({ width, height });
    }
  }, [style]);

  // Load and cache image
  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle number sources (static assets)
        if (typeof source === 'number') {
          setImageUri(null); // Use source directly
          setLoading(false);
          return;
        }

        // Handle URI sources
        if (typeof source === 'object' && source.uri) {
          // Get optimized URL based on dimensions
          const optimizedUrl = getOptimizedUrl(
            source.uri,
            dimensions.width > 0 ? dimensions.width : undefined,
            dimensions.height > 0 ? dimensions.height : undefined
          );

          // Get cached URI
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

          // Fall back to original source
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

  // Use appropriate image component based on platform
  if (Platform.OS === 'web') {
    // Use Expo Image for web
    return (
      <View style={[styles.container, style]}>
        {loading && placeholder && (
          <ExpoImage
            source={placeholder}
            style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
            contentFit={contentFit}
          />
        )}

        {loading && !placeholder && blurhash && (
          <ExpoImage
            style={StyleSheet.absoluteFill}
            placeholder={blurhash}
            contentFit={contentFit}
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
        />
      </View>
    );
  } else {
    // Use FastImage for native platforms
    const fastImageResizeMode = (() => {
      switch (contentFit || resizeMode) {
        case 'cover':
          return FastImage.resizeMode.cover;
        case 'contain':
          return FastImage.resizeMode.contain;
        case 'fill':
          return FastImage.resizeMode.stretch;
        case 'none':
          return FastImage.resizeMode.center;
        default:
          return FastImage.resizeMode.cover;
      }
    })();

    const fastImagePriority = (() => {
      switch (priority) {
        case 'low':
          return FastImage.priority.low;
        case 'high':
          return FastImage.priority.high;
        default:
          return FastImage.priority.normal;
      }
    })();

    return (
      <View style={[styles.container, style]}>
        {loading && placeholder && (
          <FastImage
            source={placeholder}
            style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
            resizeMode={fastImageResizeMode}
          />
        )}

        {loading && !placeholder && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          </View>
        )}

        <FastImage
          source={
            typeof source === 'number'
              ? source
              : {
                  uri: imageUri || source.uri,
                  priority: fastImagePriority,
                  cache: FastImage.cacheControl.immutable,
                }
          }
          style={StyleSheet.absoluteFill}
          resizeMode={fastImageResizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      </View>
    );
  }
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
