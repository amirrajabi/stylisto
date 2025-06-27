import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';

export interface SliderProps {
  style?: ViewStyle;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  disabled?: boolean;
}

export function Slider({
  style,
  minimumValue = 0,
  maximumValue = 1,
  step = 0.01,
  value,
  onValueChange,
  minimumTrackTintColor = Colors.primary[700],
  maximumTrackTintColor = Colors.neutral[300],
  thumbTintColor = Colors.primary[700],
  disabled = false,
}: SliderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const trackWidth = useRef(300);
  const thumbSize = 20;
  const trackHeight = 4;

  const clampValue = useCallback(
    (val: number) => {
      let clamped = Math.max(minimumValue, Math.min(maximumValue, val));
      if (step) {
        clamped = Math.round(clamped / step) * step;
      }
      return clamped;
    },
    [minimumValue, maximumValue, step]
  );

  const getValueFromPosition = useCallback(
    (position: number) => {
      const ratio = position / (trackWidth.current - thumbSize);
      const range = maximumValue - minimumValue;
      return minimumValue + ratio * range;
    },
    [minimumValue, maximumValue, thumbSize]
  );

  const getPositionFromValue = useCallback(
    (val: number) => {
      const ratio = (val - minimumValue) / (maximumValue - minimumValue);
      return ratio * (trackWidth.current - thumbSize);
    },
    [minimumValue, maximumValue, thumbSize]
  );

  useEffect(() => {
    const position = getPositionFromValue(value);
    animatedValue.setValue(position);
  }, [value, getPositionFromValue, animatedValue]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        animatedValue.setOffset(getPositionFromValue(value));
        animatedValue.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const currentPosition = getPositionFromValue(value) + gestureState.dx;
        const clampedPosition = Math.max(
          0,
          Math.min(trackWidth.current - thumbSize, currentPosition)
        );
        const newValue = clampValue(getValueFromPosition(clampedPosition));
        animatedValue.setValue(gestureState.dx);
        onValueChange(newValue);
      },
      onPanResponderRelease: () => {
        animatedValue.flattenOffset();
      },
    })
  ).current;

  const onTrackLayout = useCallback(
    (event: any) => {
      trackWidth.current = event.nativeEvent.layout.width;
      const position = getPositionFromValue(value);
      animatedValue.setValue(position);
    },
    [value, getPositionFromValue, animatedValue]
  );

  const valueRatio = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbLeft = valueRatio * (trackWidth.current - thumbSize);
  const activeTrackWidth = valueRatio * trackWidth.current;

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      <View
        style={[
          styles.track,
          { backgroundColor: maximumTrackTintColor, height: trackHeight },
        ]}
        onLayout={onTrackLayout}
      >
        <View
          style={[
            styles.activeTrack,
            {
              backgroundColor: minimumTrackTintColor,
              height: trackHeight,
              width: activeTrackWidth,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbTintColor,
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              left: animatedValue.interpolate({
                inputRange: [0, trackWidth.current - thumbSize || 1],
                outputRange: [thumbLeft, thumbLeft],
                extrapolate: 'clamp',
              }),
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    borderRadius: 2,
    position: 'relative',
  },
  activeTrack: {
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  thumb: {
    position: 'absolute',
    top: -8,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});
