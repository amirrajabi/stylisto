import React, { useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';
import { announceForAccessibility } from '../../utils/accessibilityUtils';

interface AccessibilityAnnouncerProps {
  message: string;
  assertive?: boolean;
}

/**
 * Component to announce messages to screen readers
 * This is useful for dynamic content changes, form submissions, etc.
 */
export const AccessibilityAnnouncer: React.FC<AccessibilityAnnouncerProps> = ({
  message,
  assertive = true,
}) => {
  const prevMessageRef = useRef<string>('');
  
  useEffect(() => {
    // Only announce if the message has changed
    if (message && message !== prevMessageRef.current) {
      announceForAccessibility(message);
      prevMessageRef.current = message;
    }
  }, [message]);
  
  // For web, we need to render an ARIA live region
  if (Platform.OS === 'web') {
    return (
      <View 
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}
        aria-live={assertive ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        {message}
      </View>
    );
  }
  
  // For native platforms, we don't need to render anything
  return null;
};