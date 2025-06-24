import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showOverlay?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = __DEV__,
  showOverlay = __DEV__,
  onMetricsUpdate,
}) => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
  });
  
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const memoryUsage = useRef(0);
  const renderTime = useRef(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  // Set up performance monitoring
  useEffect(() => {
    if (!enabled) return;
    
    let frameId: number;
    let intervalId: NodeJS.Timeout;
    
    // Start Sentry performance monitoring
    const transaction = Sentry.startTransaction({
      name: 'app-performance',
      op: 'performance',
    });
    
    // Set up FPS counter
    const measureFPS = () => {
      frameCount.current += 1;
      const now = Date.now();
      const elapsed = now - lastFrameTime.current;
      
      if (elapsed >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / elapsed);
        setMetrics(prev => ({ ...prev, fps }));
        
        // Add FPS to Sentry transaction
        transaction.setMeasurement('fps', fps, 'fps');
        
        // Reset counters
        frameCount.current = 0;
        lastFrameTime.current = now;
      }
      
      // Request next frame
      frameId = requestAnimationFrame(measureFPS);
    };
    
    // Start measuring FPS
    frameId = requestAnimationFrame(measureFPS);
    
    // Set up memory usage monitoring
    if (Platform.OS === 'web' && window.performance && window.performance.memory) {
      const measureMemory = () => {
        const memory = window.performance.memory;
        const usedMemory = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
        memoryUsage.current = usedMemory;
        setMetrics(prev => ({ ...prev, memoryUsage: usedMemory }));
        
        // Add memory usage to Sentry transaction
        transaction.setMeasurement('memory_usage', usedMemory, 'byte');
      };
      
      measureMemory();
      intervalId = setInterval(measureMemory, 2000);
    }
    
    // Set up render time monitoring
    const originalRender = React.Component.prototype.render;
    React.Component.prototype.render = function() {
      const start = performance.now();
      const result = originalRender.apply(this, arguments);
      const end = performance.now();
      
      renderTime.current = end - start;
      setMetrics(prev => ({ ...prev, renderTime: renderTime.current }));
      
      return result;
    };
    
    // Animate the overlay
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Notify parent component of metrics updates
    if (onMetricsUpdate) {
      const metricsInterval = setInterval(() => {
        onMetricsUpdate({
          fps: metrics.fps,
          memoryUsage: memoryUsage.current,
          renderTime: renderTime.current,
        });
      }, 1000);
      
      return () => {
        clearInterval(metricsInterval);
      };
    }
    
    return () => {
      // Clean up
      cancelAnimationFrame(frameId);
      if (intervalId) clearInterval(intervalId);
      React.Component.prototype.render = originalRender;
      transaction.finish();
    };
  }, [enabled, onMetricsUpdate]);
  
  // Don't render anything if not enabled or overlay not shown
  if (!enabled || !showOverlay) {
    return null;
  }
  
  // Get color based on FPS
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return Colors.success[500];
    if (fps >= 30) return Colors.warning[500];
    return Colors.error[500];
  };
  
  // Get color based on render time
  const getRenderTimeColor = (time: number) => {
    if (time < 16) return Colors.success[500]; // 60 FPS = 16.67ms per frame
    if (time < 33) return Colors.warning[500]; // 30 FPS = 33.33ms per frame
    return Colors.error[500];
  };
  
  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)'],
  });
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { borderColor }
      ]}
      pointerEvents="none"
    >
      <Text style={styles.title}>Performance</Text>
      
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>FPS:</Text>
        <Text style={[styles.metricValue, { color: getFPSColor(metrics.fps) }]}>
          {metrics.fps}
        </Text>
      </View>
      
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Render:</Text>
        <Text style={[styles.metricValue, { color: getRenderTimeColor(metrics.renderTime) }]}>
          {metrics.renderTime.toFixed(2)} ms
        </Text>
      </View>
      
      {Platform.OS === 'web' && (
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Memory:</Text>
          <Text style={styles.metricValue}>
            {metrics.memoryUsage.toFixed(1)} MB
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: Spacing.sm,
    minWidth: 120,
    borderWidth: 1,
  },
  title: {
    ...Typography.caption.medium,
    color: Colors.white,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  metricLabel: {
    ...Typography.caption.small,
    color: Colors.white,
  },
  metricValue: {
    ...Typography.caption.small,
    color: Colors.white,
    fontWeight: '600',
  },
});