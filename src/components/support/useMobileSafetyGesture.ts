/**
 * useMobileSafetyGesture Hook
 * Handles triple-tap safety exit gesture for mobile devices
 */

import { useCallback, useRef } from 'react';

interface MobileSafetyGestureOptions {
  tapCount?: number;
  tapWindow?: number; // milliseconds
  onTrigger: () => void;
}

interface MobileSafetyGestureReturn {
  handleTap: () => void;
  handleTouchStart: (event: React.TouchEvent) => void;
  resetTaps: () => void;
}

/**
 * Hook for detecting triple-tap (or custom tap count) gestures for safety exit
 */
export function useMobileSafetyGesture(
  options: MobileSafetyGestureOptions
): MobileSafetyGestureReturn {
  const {
    tapCount = 3,
    tapWindow = 500, // 500ms window for taps
    onTrigger,
  } = options;
  
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Reset tap counter
   */
  const resetTaps = useCallback(() => {
    tapCountRef.current = 0;
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
  }, []);
  
  /**
   * Handle a tap event
   */
  const handleTap = useCallback(() => {
    const now = Date.now();
    
    // Reset if too much time passed since last tap
    if (now - lastTapRef.current > tapWindow) {
      tapCountRef.current = 0;
    }
    
    // Increment tap count
    tapCountRef.current++;
    lastTapRef.current = now;
    
    // Clear any existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    // Set timeout to reset if no more taps
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, tapWindow);
    
    // Check if tap count reached
    if (tapCountRef.current >= tapCount) {
      resetTaps();
      onTrigger();
    }
  }, [tapCount, tapWindow, onTrigger, resetTaps]);
  
  /**
   * Handle touch start event (for touch devices)
   */
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      // Only trigger on single touch
      if (event.touches.length === 1) {
        handleTap();
      }
    },
    [handleTap]
  );
  
  return {
    handleTap,
    handleTouchStart,
    resetTaps,
  };
}

export default useMobileSafetyGesture;
