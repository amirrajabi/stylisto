import { useCallback, useEffect } from 'react';
import { analytics, EventCategory, ConversionFunnel, FunnelStep, ConsentStatus } from '../lib/analytics';
import { useAuth } from './useAuth';

export const useAnalytics = () => {
  const { user } = useAuth();

  // Initialize analytics and set user ID when auth state changes
  useEffect(() => {
    const initializeAnalytics = async () => {
      await analytics.initialize();
      
      if (user) {
        analytics.setUserId(user.id);
        analytics.setUserProperties({
          email: user.email,
          full_name: user.full_name,
        });
      } else {
        analytics.setUserId(null);
      }
    };
    
    initializeAnalytics();
    
    return () => {
      // End session when component unmounts
      analytics.endSession();
    };
  }, [user]);

  // Track screen view
  const trackScreenView = useCallback((screenName: string, properties?: Record<string, any>) => {
    analytics.trackScreenView(screenName, properties);
  }, []);

  // Track event
  const trackEvent = useCallback((
    eventName: string,
    properties?: Record<string, any>,
    category?: EventCategory
  ) => {
    analytics.trackEvent(eventName, properties, { category });
  }, []);

  // Track funnel step
  const trackFunnelStep = useCallback((
    funnelName: ConversionFunnel,
    step: FunnelStep,
    properties?: Record<string, any>
  ) => {
    analytics.trackFunnelStep(funnelName, step, properties);
  }, []);

  // Track error
  const trackError = useCallback((
    errorName: string,
    errorMessage: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackError(errorName, errorMessage, properties);
  }, []);

  // Set user properties
  const setUserProperties = useCallback((properties: Record<string, any>) => {
    analytics.setUserProperties(properties);
  }, []);

  // Set consent status
  const setConsentStatus = useCallback((status: ConsentStatus) => {
    return analytics.setConsentStatus(status);
  }, []);

  // Get consent status
  const getConsentStatus = useCallback(() => {
    return analytics.getConsentStatus();
  }, []);

  return {
    trackScreenView,
    trackEvent,
    trackFunnelStep,
    trackError,
    setUserProperties,
    setConsentStatus,
    getConsentStatus,
  };
};