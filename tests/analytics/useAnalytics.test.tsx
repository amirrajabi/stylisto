import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useAnalytics } from '../../hooks/useAnalytics';
import { analytics, EventCategory, ConversionFunnel, FunnelStep, ConsentStatus } from '../../lib/analytics';

// Mock dependencies
jest.mock('../../lib/analytics', () => ({
  analytics: {
    initialize: jest.fn(),
    trackScreenView: jest.fn(),
    trackEvent: jest.fn(),
    trackFunnelStep: jest.fn(),
    trackError: jest.fn(),
    setUserProperties: jest.fn(),
    setConsentStatus: jest.fn(),
    getConsentStatus: jest.fn(),
    setUserId: jest.fn(),
    endSession: jest.fn(),
  },
  EventCategory: {
    AUTHENTICATION: 'Authentication',
    WARDROBE: 'Wardrobe',
    OUTFITS: 'Outfits',
    ANALYTICS: 'Analytics',
    CAMERA: 'Camera',
    NAVIGATION: 'Navigation',
    PERFORMANCE: 'Performance',
    USER_PREFERENCES: 'UserPreferences',
    ONBOARDING: 'Onboarding',
    ENGAGEMENT: 'Engagement',
    ERROR: 'Error',
  },
  ConversionFunnel: {
    REGISTRATION: 'registration_funnel',
    ITEM_UPLOAD: 'item_upload_funnel',
    OUTFIT_GENERATION: 'outfit_generation_funnel',
    ONBOARDING: 'onboarding_funnel',
  },
  FunnelStep: {
    REGISTRATION_START: 'registration_start',
  },
  ConsentStatus: {
    UNKNOWN: 'unknown',
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

describe('useAnalytics Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes analytics on mount', () => {
    renderHook(() => useAnalytics());
    
    expect(analytics.initialize).toHaveBeenCalled();
  });

  test('sets user ID when auth state changes', () => {
    renderHook(() => useAnalytics());
    
    expect(analytics.setUserId).toHaveBeenCalledWith('test-user-id');
  });

  test('tracks screen view', () => {
    const { result } = renderHook(() => useAnalytics());
    
    act(() => {
      result.current.trackScreenView('Home');
    });
    
    expect(analytics.trackScreenView).toHaveBeenCalledWith('Home', undefined);
  });

  test('tracks event with category', () => {
    const { result } = renderHook(() => useAnalytics());
    
    act(() => {
      result.current.trackEvent('button_click', { button_id: 'save' }, EventCategory.ENGAGEMENT);
    });
    
    expect(analytics.trackEvent).toHaveBeenCalledWith(
      'button_click',
      { button_id: 'save' },
      { category: EventCategory.ENGAGEMENT }
    );
  });

  test('tracks funnel step', () => {
    const { result } = renderHook(() => useAnalytics());
    
    act(() => {
      result.current.trackFunnelStep(
        ConversionFunnel.REGISTRATION,
        FunnelStep.REGISTRATION_START,
        { source: 'direct' }
      );
    });
    
    expect(analytics.trackFunnelStep).toHaveBeenCalledWith(
      ConversionFunnel.REGISTRATION,
      FunnelStep.REGISTRATION_START,
      { source: 'direct' }
    );
  });

  test('tracks error', () => {
    const { result } = renderHook(() => useAnalytics());
    
    act(() => {
      result.current.trackError('API_ERROR', 'Failed to fetch data');
    });
    
    expect(analytics.trackError).toHaveBeenCalledWith(
      'API_ERROR',
      'Failed to fetch data',
      undefined
    );
  });

  test('sets user properties', () => {
    const { result } = renderHook(() => useAnalytics());
    
    act(() => {
      result.current.setUserProperties({ total_items: 10 });
    });
    
    expect(analytics.setUserProperties).toHaveBeenCalledWith({ total_items: 10 });
  });

  test('sets consent status', () => {
    const { result } = renderHook(() => useAnalytics());
    
    act(() => {
      result.current.setConsentStatus(ConsentStatus.GRANTED);
    });
    
    expect(analytics.setConsentStatus).toHaveBeenCalledWith(ConsentStatus.GRANTED);
  });

  test('gets consent status', () => {
    (analytics.getConsentStatus as jest.Mock).mockReturnValue(ConsentStatus.GRANTED);
    
    const { result } = renderHook(() => useAnalytics());
    
    act(() => {
      const status = result.current.getConsentStatus();
      expect(status).toBe(ConsentStatus.GRANTED);
    });
    
    expect(analytics.getConsentStatus).toHaveBeenCalled();
  });

  test('ends session on unmount', () => {
    const { unmount } = renderHook(() => useAnalytics());
    
    unmount();
    
    expect(analytics.endSession).toHaveBeenCalled();
  });
});