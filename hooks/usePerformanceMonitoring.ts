import { useEffect, useRef, useCallback } from 'react';
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import { errorHandling } from '../lib/errorHandling';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number | null;
  renderTime: number;
  networkRequests: {
    count: number;
    totalTime: number;
    averageTime: number;
    failedCount: number;
  };
}

interface UsePerformanceMonitoringOptions {
  enabled?: boolean;
  sampleRate?: number;
  thresholds?: {
    minFps?: number;
    maxRenderTime?: number;
    maxMemoryUsage?: number;
    maxNetworkTime?: number;
  };
  onThresholdExceeded?: (metrics: PerformanceMetrics) => void;
}

export const usePerformanceMonitoring = (options: UsePerformanceMonitoringOptions = {}) => {
  const {
    enabled = process.env.NODE_ENV === 'production',
    sampleRate = 0.1, // Only monitor 10% of sessions in production
    thresholds = {
      minFps: 30,
      maxRenderTime: 16, // 16ms = 60fps
      maxMemoryUsage: 200, // 200MB
      maxNetworkTime: 3000, // 3 seconds
    },
    onThresholdExceeded,
  } = options;
  
  // Metrics state
  const metrics = useRef<PerformanceMetrics>({
    fps: 60,
    memoryUsage: null,
    renderTime: 0,
    networkRequests: {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      failedCount: 0,
    },
  });
  
  // Performance monitoring references
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const transaction = useRef<Sentry.Transaction | null>(null);
  const isMonitoring = useRef(false);
  const networkRequests = useRef<Map<string, { startTime: number; url: string }>>(new Map());
  
  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring.current) return;
    
    // Determine if we should monitor this session based on sample rate
    if (process.env.NODE_ENV === 'production' && Math.random() > sampleRate) {
      return;
    }
    
    isMonitoring.current = true;
    
    // Start Sentry transaction
    transaction.current = Sentry.startTransaction({
      name: 'app-performance',
      op: 'performance',
    });
    
    // Set up FPS monitoring
    const originalRAF = global.requestAnimationFrame;
    global.requestAnimationFrame = (callback: FrameRequestCallback) => {
      const start = performance.now();
      
      return originalRAF(() => {
        // Measure frame time
        const now = Date.now();
        frameCount.current += 1;
        
        // Calculate FPS every second
        const elapsed = now - lastFrameTime.current;
        if (elapsed >= 1000) {
          const fps = Math.round((frameCount.current * 1000) / elapsed);
          metrics.current.fps = fps;
          
          // Add FPS to Sentry transaction
          transaction.current?.setMeasurement('fps', fps, 'fps');
          
          // Check if FPS is below threshold
          if (fps < thresholds.minFps!) {
            // Report low FPS to Sentry
            Sentry.captureMessage(`Low FPS detected: ${fps}`, {
              level: 'warning',
              tags: { category: 'performance' },
            });
            
            // Notify callback if provided
            onThresholdExceeded?.(metrics.current);
          }
          
          // Reset counters
          frameCount.current = 0;
          lastFrameTime.current = now;
        }
        
        // Call original callback
        callback(start);
        
        // Measure render time
        const renderTime = performance.now() - start;
        metrics.current.renderTime = renderTime;
        
        // Check if render time exceeds threshold
        if (renderTime > thresholds.maxRenderTime!) {
          // Report slow render to Sentry
          Sentry.captureMessage(`Slow render detected: ${renderTime.toFixed(2)}ms`, {
            level: 'warning',
            tags: { category: 'performance' },
          });
          
          // Notify callback if provided
          onThresholdExceeded?.(metrics.current);
        }
      });
    };
    
    // Set up memory usage monitoring
    if (Platform.OS === 'web' && window.performance && window.performance.memory) {
      const memoryInterval = setInterval(() => {
        const memory = window.performance.memory;
        const usedMemory = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
        metrics.current.memoryUsage = usedMemory;
        
        // Add memory usage to Sentry transaction
        transaction.current?.setMeasurement('memory_usage', usedMemory, 'byte');
        
        // Check if memory usage exceeds threshold
        if (usedMemory > thresholds.maxMemoryUsage!) {
          // Report high memory usage to Sentry
          Sentry.captureMessage(`High memory usage detected: ${usedMemory.toFixed(2)}MB`, {
            level: 'warning',
            tags: { category: 'performance' },
          });
          
          // Notify callback if provided
          onThresholdExceeded?.(metrics.current);
        }
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(memoryInterval);
    }
    
    // Set up network request monitoring
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      const requestId = `${url}-${Date.now()}`;
      const startTime = Date.now();
      
      // Store request start time
      networkRequests.current.set(requestId, { startTime, url });
      
      try {
        const response = await originalFetch(input, init);
        
        // Calculate request time
        const endTime = Date.now();
        const requestTime = endTime - startTime;
        
        // Update metrics
        metrics.current.networkRequests.count += 1;
        metrics.current.networkRequests.totalTime += requestTime;
        metrics.current.networkRequests.averageTime = 
          metrics.current.networkRequests.totalTime / metrics.current.networkRequests.count;
        
        // Remove from tracking
        networkRequests.current.delete(requestId);
        
        // Check if request time exceeds threshold
        if (requestTime > thresholds.maxNetworkTime!) {
          // Report slow network request to Sentry
          Sentry.captureMessage(`Slow network request: ${url} (${requestTime}ms)`, {
            level: 'warning',
            tags: { category: 'performance' },
          });
          
          // Notify callback if provided
          onThresholdExceeded?.(metrics.current);
        }
        
        return response;
      } catch (error) {
        // Update failed request count
        metrics.current.networkRequests.failedCount += 1;
        
        // Remove from tracking
        networkRequests.current.delete(requestId);
        
        // Re-throw the error
        throw error;
      }
    };
    
    return () => {
      // Clean up
      global.requestAnimationFrame = originalRAF;
      global.fetch = originalFetch;
      
      // Finish transaction
      if (transaction.current) {
        transaction.current.finish();
        transaction.current = null;
      }
      
      isMonitoring.current = false;
    };
  }, [sampleRate, thresholds, onThresholdExceeded]);
  
  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring.current) return;
    
    // Finish transaction
    if (transaction.current) {
      transaction.current.finish();
      transaction.current = null;
    }
    
    isMonitoring.current = false;
  }, []);
  
  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metrics.current };
  }, []);
  
  // Start monitoring on mount if enabled
  useEffect(() => {
    if (enabled) {
      const cleanup = startMonitoring();
      
      return () => {
        stopMonitoring();
        if (cleanup) cleanup();
      };
    }
  }, [enabled, startMonitoring, stopMonitoring]);
  
  return {
    startMonitoring,
    stopMonitoring,
    getMetrics,
    isMonitoring: isMonitoring.current,
  };
};