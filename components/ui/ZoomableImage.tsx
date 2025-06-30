import { Image, ImageContentFit } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface ZoomableImageProps {
  source: { uri: string };
  style?: ViewStyle;
  resizeMode?: ImageContentFit;
  maxZoom?: number;
  minZoom?: number;
  doubleTapZoom?: number;
}

interface PinchContext extends Record<string, unknown> {
  startScale: number;
}

interface PanContext extends Record<string, unknown> {
  startX: number;
  startY: number;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  source,
  style,
  resizeMode = 'contain',
  maxZoom = 3,
  minZoom = 1,
  doubleTapZoom = 2,
}) => {
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchHandler = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    PinchContext
  >({
    onStart: (_, context) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      const newScale = context.startScale * event.scale;

      if (newScale >= minZoom && newScale <= maxZoom) {
        scale.value = newScale;
        focalX.value = event.focalX;
        focalY.value = event.focalY;
      }
    },
    onEnd: () => {
      if (scale.value < minZoom) {
        scale.value = withSpring(minZoom);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else if (scale.value > maxZoom) {
        scale.value = withSpring(maxZoom);
      }
    },
  });

  const panHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    PanContext
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (scale.value > minZoom) {
        translateX.value = context.startX + event.translationX;
        translateY.value = context.startY + event.translationY;
      }
    },
    onEnd: () => {
      if (scale.value <= minZoom) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const resetZoom = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  };

  const handleDoubleTap = () => {
    if (scale.value > 1) {
      resetZoom();
    } else {
      scale.value = withSpring(doubleTapZoom);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <PanGestureHandler onGestureEvent={panHandler}>
        <Animated.View style={styles.gestureContainer}>
          <PinchGestureHandler onGestureEvent={pinchHandler}>
            <Animated.View style={styles.gestureContainer}>
              <Animated.View style={animatedStyle}>
                <Image
                  source={source}
                  style={styles.image}
                  contentFit={resizeMode}
                  onLoad={() => {
                    resetZoom();
                  }}
                />
              </Animated.View>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  gestureContainer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
