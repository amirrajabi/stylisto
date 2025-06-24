import { useCallback, useMemo, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { errorHandling, ErrorSeverity, ErrorCategory } from '../lib/errorHandling';

interface PerformanceMetrics {
  renderTime: number;
  scrollPerformance: number;
  memoryUsage: number;
  frameDrops: number;
}

interface UseWardrobePerformanceOptions {
  enableMetrics?: boolean;
  logThreshold?: number;
  reportToSentry?: boolean;
}

export const useWardrobePerformance = (options: UseWardrobePerformanceOptions = {}) => {
  const { 
    enableMetrics = __DEV__ || process.env.NODE_ENV === 'development', 
    logThreshold = 16,
    reportToSentry = !__DEV__,
  } = options;
  
  const renderStartTime = useRef<number>(0);
  const scrollStartTime = useRef<number>(0);
  const frameDrops = useRef<number>(0);
  const lastFrameTimestamp = useRef<number>(0);
  const metrics = useRef<PerformanceMetrics>({
    renderTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
    frameDrops: 0,
  });

  // Start render time measurement
  const startRenderMeasurement = useCallback(() => {
    if (!enableMetrics) return;
    renderStartTime.current = performance.now();
    
    // Start a performance transaction
    if (reportToSentry) {
      const transaction = Sentry.startTransaction({
        name: 'wardrobe-render',
        op: 'ui.render',
      });
      
      // Store transaction in ref for later use
      (window as any).__wardrobeTransaction = transaction;
    }
  }, [enableMetrics, reportToSentry]);

  // End render time measurement
  const endRenderMeasurement = useCallback((componentName: string) => {
    if (!enableMetrics || !renderStartTime.current) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    metrics.current.renderTime = renderTime;
    
    // Log slow renders
    if (renderTime > logThreshold) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      
      // Report to error handling service
      errorHandling.captureMessage(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`, {
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.PERFORMANCE,
        context: {
          component: componentName,
          renderTime,
          threshold: logThreshold,
        },
      });
    }
    
    // Finish Sentry transaction
    if (reportToSentry && (window as any).__wardrobeTransaction) {
      const transaction = (window as any).__wardrobeTransaction;
      transaction.setMeasurement('render_time', renderTime, 'millisecond');
      transaction.finish();
      delete (window as any).__wardrobeTransaction;
    }
    
    renderStartTime.current = 0;
  }, [enableMetrics, logThreshold, reportToSentry]);

  // Measure scroll performance
  const measureScrollPerformance = useCallback(() => {
    if (!enableMetrics) return () => {};
    
    scrollStartTime.current = performance.now();
    lastFrameTimestamp.current = performance.now();
    frameDrops.current = 0;
    
    // Set up frame callback to detect dropped frames
    const frameCallback = () => {
      const now = performance.now();
      const frameDuration = now - lastFrameTimestamp.current;
      
      // If frame took longer than 16.67ms (60fps), count as dropped
      if (frameDuration > 16.67) {
        const droppedFrames = Math.floor(frameDuration / 16.67) - 1;
        frameDrops.current += droppedFrames;
      }
      
      lastFrameTimestamp.current = now;
      
      // Continue measuring if still scrolling
      if (scrollStartTime.current > 0) {
        requestAnimationFrame(frameCallback);
      }
    };
    
    // Start frame callback
    if (Platform.OS === 'web') {
      requestAnimationFrame(frameCallback);
    }
    
    return () => {
      const scrollTime = performance.now() - scrollStartTime.current;
      metrics.current.scrollPerformance = scrollTime;
      
      if (scrollTime > 0) {
        const fps = 1000 / (scrollTime / (60 - frameDrops.current));
        
        if (fps < 45) {
          console.warn(`Slow scroll detected: ${fps.toFixed(2)} FPS with ${frameDrops.current} dropped frames`);
          
          // Report to error handling service
          errorHandling.captureMessage(`Slow scroll performance: ${fps.toFixed(2)} FPS`, {
            severity: ErrorSeverity.WARNING,
            category: ErrorCategory.PERFORMANCE,
            context: {
              fps,
              droppedFrames: frameDrops.current,
              scrollDuration: scrollTime,
            },
          });
        }
      }
      
      scrollStartTime.current = 0;
    };
  }, [enableMetrics]);

  // Optimize FlatList for large lists
  const optimizeForLargeList = useCallback((itemCount: number) => {
    return {
      removeClippedSubviews: itemCount > 50,
      maxToRenderPerBatch: itemCount > 100 ? 5 : 10,
      windowSize: itemCount > 200 ? 5 : 10,
      initialNumToRender: Math.min(itemCount, 8),
      updateCellsBatchingPeriod: itemCount > 100 ? 100 : 50,
      disableRecycling: false,
      extendedState: { selectedItems: true },
    };
  }, []);

  // Schedule operations after interactions
  const scheduleAfterInteractions = useCallback((callback: () => void) => {
    InteractionManager.runAfterInteractions(callback);
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
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
  const totalLoadTime = useRef<number>(0);
  const loadedImages = useRef<number>(0);

  const trackImageLoad = useCallback((imageUrl: string) => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      imageLoadTimes.current.set(imageUrl, loadTime);
      
      totalLoadTime.current += loadTime;
      loadedImages.current += 1;
      
      if (loadTime > 1000) {
        console.warn(`Slow image load: ${imageUrl} took ${loadTime.toFixed(2)}ms`);
        
        // Report to error handling service
        errorHandling.captureMessage(`Slow image load: ${loadTime.toFixed(2)}ms`, {
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.PERFORMANCE,
          context: {
            imageUrl,
            loadTime,
          },
        });
      }
    };
  }, []);

  const getAverageLoadTime = useCallback(() => {
    if (loadedImages.current === 0) return 0;
    return totalLoadTime.current / loadedImages.current;
  }, []);

  const clearMetrics = useCallback(() => {
    imageLoadTimes.current.clear();
    totalLoadTime.current = 0;
    loadedImages.current = 0;
  }, []);

  return {
    trackImageLoad,
    getAverageLoadTime,
    clearMetrics,
    totalImagesTracked: loadedImages.current,
  };
};