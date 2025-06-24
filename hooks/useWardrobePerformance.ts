import { useCallback, useMemo, useRef } from 'react';
import { InteractionManager } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  scrollPerformance: number;
  memoryUsage: number;
}

interface UseWardrobePerformanceOptions {
  enableMetrics?: boolean;
  logThreshold?: number;
}

export const useWardrobePerformance = (options: UseWardrobePerformanceOptions = {}) => {
  const { enableMetrics = __DEV__, logThreshold = 16 } = options;
  
  const renderStartTime = useRef<number>(0);
  const scrollStartTime = useRef<number>(0);
  const metrics = useRef<PerformanceMetrics>({
    renderTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
  });

  const startRenderMeasurement = useCallback(() => {
    if (!enableMetrics) return;
    renderStartTime.current = performance.now();
  }, [enableMetrics]);

  const endRenderMeasurement = useCallback((componentName: string) => {
    if (!enableMetrics || !renderStartTime.current) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    metrics.current.renderTime = renderTime;
    
    if (renderTime > logThreshold) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
    
    renderStartTime.current = 0;
  }, [enableMetrics, logThreshold]);

  const measureScrollPerformance = useCallback(() => {
    if (!enableMetrics) return () => {};
    
    scrollStartTime.current = performance.now();
    
    return () => {
      const scrollTime = performance.now() - scrollStartTime.current;
      metrics.current.scrollPerformance = scrollTime;
      
      if (scrollTime > logThreshold) {
        console.warn(`Slow scroll detected: ${scrollTime.toFixed(2)}ms`);
      }
    };
  }, [enableMetrics, logThreshold]);

  const optimizeForLargeList = useCallback((itemCount: number) => {
    return {
      removeClippedSubviews: itemCount > 50,
      maxToRenderPerBatch: itemCount > 100 ? 5 : 10,
      windowSize: itemCount > 200 ? 5 : 10,
      initialNumToRender: Math.min(itemCount, 8),
      updateCellsBatchingPeriod: itemCount > 100 ? 100 : 50,
    };
  }, []);

  const scheduleAfterInteractions = useCallback((callback: () => void) => {
    InteractionManager.runAfterInteractions(callback);
  }, []);

  const memoizedValue = useMemo(() => ({
    startRenderMeasurement,
    endRenderMeasurement,
    measureScrollPerformance,
    optimizeForLargeList,
    scheduleAfterInteractions,
    metrics: metrics.current,
  }), [
    startRenderMeasurement,
    endRenderMeasurement,
    measureScrollPerformance,
    optimizeForLargeList,
    scheduleAfterInteractions,
  ]);

  return memoizedValue;
};

// Performance monitoring hook for image loading
export const useImagePerformance = () => {
  const imageLoadTimes = useRef<Map<string, number>>(new Map());

  const trackImageLoad = useCallback((imageUrl: string) => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      imageLoadTimes.current.set(imageUrl, loadTime);
      
      if (loadTime > 1000) {
        console.warn(`Slow image load: ${imageUrl} took ${loadTime.toFixed(2)}ms`);
      }
    };
  }, []);

  const getAverageLoadTime = useCallback(() => {
    const times = Array.from(imageLoadTimes.current.values());
    if (times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }, []);

  const clearMetrics = useCallback(() => {
    imageLoadTimes.current.clear();
  }, []);

  return {
    trackImageLoad,
    getAverageLoadTime,
    clearMetrics,
    totalImagesTracked: imageLoadTimes.current.size,
  };
};