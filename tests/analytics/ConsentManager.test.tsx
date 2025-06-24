import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ConsentManager } from '../../components/analytics/ConsentManager';
import { analytics, ConsentStatus } from '../../lib/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../lib/analytics', () => ({
  analytics: {
    getConsentStatus: jest.fn(),
    setConsentStatus: jest.fn(),
  },
  ConsentStatus: {
    UNKNOWN: 'unknown',
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('ConsentManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (analytics.getConsentStatus as jest.Mock).mockReturnValue(ConsentStatus.UNKNOWN);
  });

  test('shows consent modal on first visit', async () => {
    // Mock AsyncStorage to return null (first visit)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    
    const { getByText } = render(<ConsentManager />);
    
    await waitFor(() => {
      expect(getByText('Privacy Settings')).toBeTruthy();
      expect(getByText('Analytics Data Collection')).toBeTruthy();
    });
  });

  test('does not show consent modal if already prompted', async () => {
    // Mock AsyncStorage to return true (already prompted)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    
    const { queryByText } = render(<ConsentManager />);
    
    await waitFor(() => {
      expect(queryByText('Privacy Settings')).toBeNull();
    });
  });

  test('handles accept consent', async () => {
    // Mock AsyncStorage to return null (first visit)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    
    const onConsentChange = jest.fn();
    const { getByText } = render(<ConsentManager onConsentChange={onConsentChange} />);
    
    await waitFor(() => {
      expect(getByText('Accept')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Accept'));
    
    expect(analytics.setConsentStatus).toHaveBeenCalledWith(ConsentStatus.GRANTED);
    expect(onConsentChange).toHaveBeenCalledWith(ConsentStatus.GRANTED);
  });

  test('handles decline consent', async () => {
    // Mock AsyncStorage to return null (first visit)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    
    const onConsentChange = jest.fn();
    const { getByText } = render(<ConsentManager onConsentChange={onConsentChange} />);
    
    await waitFor(() => {
      expect(getByText('Decline')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Decline'));
    
    expect(analytics.setConsentStatus).toHaveBeenCalledWith(ConsentStatus.DENIED);
    expect(onConsentChange).toHaveBeenCalledWith(ConsentStatus.DENIED);
  });

  test('toggles consent status with switch', async () => {
    // Mock AsyncStorage to return null (first visit)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    
    const { getByRole } = render(<ConsentManager />);
    
    await waitFor(() => {
      const switchElement = getByRole('switch');
      expect(switchElement).toBeTruthy();
      
      // Initially off
      expect(switchElement.props.value).toBe(false);
      
      // Toggle on
      fireEvent(switchElement, 'valueChange', true);
      expect(analytics.setConsentStatus).toHaveBeenCalledWith(ConsentStatus.GRANTED);
      
      // Toggle off
      fireEvent(switchElement, 'valueChange', false);
      expect(analytics.setConsentStatus).toHaveBeenCalledWith(ConsentStatus.DENIED);
    });
  });

  test('saves consent prompt status', async () => {
    // Mock AsyncStorage to return null (first visit)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    
    render(<ConsentManager />);
    
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stylisto_consent_prompted', 'true');
    });
  });
});