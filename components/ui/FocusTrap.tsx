import React, { useRef, useEffect } from 'react';
import { View, ViewProps, Platform } from 'react-native';

interface FocusTrapProps extends ViewProps {
  active?: boolean;
  autoFocus?: boolean;
  children: React.ReactNode;
}

/**
 * FocusTrap component for web - traps focus within a container
 * This is useful for modals, dialogs, and other components that should trap focus
 * Note: This only works on web platforms
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
  active = true,
  autoFocus = true,
  children,
  style,
  ...props
}) => {
  const containerRef = useRef<View>(null);
  
  // Only implement focus trapping on web
  useEffect(() => {
    if (Platform.OS !== 'web' || !active) return;
    
    const container = containerRef.current as unknown as HTMLElement;
    if (!container) return;
    
    // Find all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Auto-focus the first element
    if (autoFocus) {
      firstElement.focus();
    }
    
    // Handle tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } 
      // Tab
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus when unmounted
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [active, autoFocus]);
  
  return (
    <View ref={containerRef} style={style} {...props}>
      {children}
    </View>
  );
};