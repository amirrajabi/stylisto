import { analytics, EventCategory, ConsentStatus } from '../../lib/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Amplitude from '@amplitude/analytics-react-native';

// Mock dependencies
jest.mock('@amplitude/analytics-react-native', () => ({
  init: jest.fn(),
  track: jest.fn(),
  setUserId: jest.fn(),
  reset: jest.fn(),
  identify: jest.fn(),
  Identify: jest.fn().mockImplementation(() => ({
    set: jest.fn().mockReturnThis(),
  })),
  setTrackingOptions: jest.fn(),
  setSessionId: jest.fn(),
  flush: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock AsyncStorage to return null for consent status
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  test('initializes with correct configuration', async () => {
    await analytics.initialize();
    
    expect(Amplitude.init).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        trackingOptions: expect.any(Object),
        logLevel: expect.any(Number),
        storageProvider: expect.any(Object),
      })
    );
  });

  test('respects consent status for tracking', async () => {
    // Mock consent status as denied
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(ConsentStatus.DENIED);
    
    await analytics.initialize();
    await analytics.setConsentStatus(ConsentStatus.DENIED);
    
    // Track an event
    analytics.trackEvent('test_event');
    
    // Should not track events when consent is denied
    expect(Amplitude.track).not.toHaveBeenCalled();
    
    // Change consent to granted
    await analytics.setConsentStatus(ConsentStatus.GRANTED);
    
    // Track another event
    analytics.trackEvent('test_event_2');
    
    // Should track events when consent is granted
    expect(Amplitude.track).toHaveBeenCalledWith('test_event_2', expect.any(Object));
  });

  test('sets user ID correctly', async () => {
    await analytics.initialize();
    await analytics.setConsentStatus(ConsentStatus.GRANTED);
    
    // Set user ID
    analytics.setUserId('test-user-id');
    
    expect(Amplitude.setUserId).toHaveBeenCalledWith('test-user-id');
    
    // Reset user ID
    analytics.setUserId(null);
    
    expect(Amplitude.reset).toHaveBeenCalled();
  });

  test('sets user properties correctly', async () => {
    await analytics.initialize();
    await analytics.setConsentStatus(ConsentStatus.GRANTED);
    
    // Set user properties
    analytics.setUserProperties({
      total_items: 10,
      favorite_items: 5,
    });
    
    expect(Amplitude.identify).toHaveBeenCalled();
  });

  test('tracks screen views correctly', async () => {
    await analytics.initialize();
    await analytics.setConsentStatus(ConsentStatus.GRANTED);
    
    // Track screen view
    analytics.trackScreenView('Home');
    
    expect(Amplitude.track).toHaveBeenCalledWith('screen_view', expect.objectContaining({
      screen_name: 'Home',
      category: EventCategory.NAVIGATION,
    }));
  });

  test('tracks funnel steps correctly', async () => {
    await analytics.initialize();
    await analytics.setConsentStatus(ConsentStatus.GRANTED);
    
    // Track funnel step
    analytics.trackFunnelStep(
      'registration_funnel',
      'registration_start',
      { source: 'direct' }
    );
    
    expect(Amplitude.track).toHaveBeenCalledWith('funnel_step_registration_start', expect.objectContaining({
      funnel_name: 'registration_funnel',
      funnel_step: 'registration_start',
      source: 'direct',
    }));
  });

  test('persists consent status', async () => {
    await analytics.initialize();
    
    // Set consent status
    await analytics.setConsentStatus(ConsentStatus.GRANTED);
    
    // Check if consent status was saved
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      ConsentStatus.GRANTED
    );
    
    // Get consent status
    const status = analytics.getConsentStatus();
    expect(status).toBe(ConsentStatus.GRANTED);
  });

  test('handles session tracking', async () => {
    await analytics.initialize();
    await analytics.setConsentStatus(ConsentStatus.GRANTED);
    
    // Start session
    analytics.startSession();
    
    expect(Amplitude.setSessionId).toHaveBeenCalled();
    expect(Amplitude.track).toHaveBeenCalledWith('session_start', expect.any(Object), expect.any(Object));
    
    // End session
    analytics.endSession();
    
    expect(Amplitude.track).toHaveBeenCalledWith('session_end', expect.any(Object), expect.any(Object));
  });

  test('flushes events', async () => {
    await analytics.initialize();
    
    await analytics.flushEvents();
    
    expect(Amplitude.flush).toHaveBeenCalled();
  });
});