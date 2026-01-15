/**
 * useSafetyExit Hook
 * Handles safety exit protocol with keyboard shortcuts, cleanup, and navigation
 * 
 * Features:
 * - Shift+Esc keyboard shortcut
 * - Mobile triple-tap header support
 * - /exit command support
 * - Full interval/timeout cleanup
 * - History replacement to prevent back button
 * - Optional blur effect during transition
 */

import { useCallback, useEffect, useRef } from 'react';
import { SAFETY_EXIT_PROTOCOL, UI_CONFIG } from './companion-config';

interface SafetyExitOptions {
  /** Called before navigating away - clean up state here */
  onExit: () => void;
  /** URL to navigate to (default: /help or weather.com) */
  exitUrl?: string;
  /** Custom key sequence (default: Shift+Escape) */
  useShiftEscape?: boolean;
  /** Reference to Set of active intervals for cleanup */
  intervalsRef?: React.MutableRefObject<Set<NodeJS.Timeout>>;
  /** Reference to Set of active timeouts for cleanup */
  timeoutsRef?: React.MutableRefObject<Set<NodeJS.Timeout>>;
  /** Enable blur effect during transition */
  blurOnExit?: boolean;
}

interface SafetyExitReturn {
  /** Trigger safety exit manually */
  triggerSafetyExit: () => void;
  /** Register an interval for cleanup on exit */
  registerInterval: (interval: NodeJS.Timeout) => void;
  /** Register a timeout for cleanup on exit */
  registerTimeout: (timeout: NodeJS.Timeout) => void;
  /** Clear all registered intervals */
  clearAllIntervals: () => void;
  /** Clear all registered timeouts */
  clearAllTimeouts: () => void;
  /** Handler for triple-tap on mobile header */
  onHeaderTap: () => void;
  /** Check if text is /exit command */
  isExitCommand: (text: string) => boolean;
}

/**
 * Hook for managing safety exit functionality
 */
export function useSafetyExit(options: SafetyExitOptions): SafetyExitReturn {
  const {
    onExit,
    exitUrl = SAFETY_EXIT_PROTOCOL?.decoyRoute || UI_CONFIG?.safetyExitUrl || 'https://weather.com',
    useShiftEscape = true,
    intervalsRef: externalIntervalsRef,
    timeoutsRef: externalTimeoutsRef,
    blurOnExit = true,
  } = options;
  
  // Internal tracking if external refs not provided
  const internalIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const internalTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  const intervalsRef = externalIntervalsRef || internalIntervalsRef;
  const timeoutsRef = externalTimeoutsRef || internalTimeoutsRef;
  
  // Triple-tap tracking for mobile
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  
  /**
   * Register an interval for cleanup on exit
   */
  const registerInterval = useCallback((interval: NodeJS.Timeout) => {
    intervalsRef.current.add(interval);
  }, [intervalsRef]);
  
  /**
   * Register a timeout for cleanup on exit
   */
  const registerTimeout = useCallback((timeout: NodeJS.Timeout) => {
    timeoutsRef.current.add(timeout);
  }, [timeoutsRef]);
  
  /**
   * Clear all registered intervals
   */
  const clearAllIntervals = useCallback(() => {
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current.clear();
  }, [intervalsRef]);
  
  /**
   * Clear all registered timeouts
   */
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  }, [timeoutsRef]);
  
  /**
   * Main safety exit function
   */
  const triggerSafetyExit = useCallback(() => {
    // Check if enabled
    if (SAFETY_EXIT_PROTOCOL?.enabled === false) return;
    
    try {
      // 1. Clear all timers
      clearAllIntervals();
      clearAllTimeouts();
      
      // 2. Call the onExit callback to clear state
      onExit();
      
      // 3. Clear any sensitive data from storage
      try {
        sessionStorage.clear();
        // Don't clear localStorage - might have unrelated data
      } catch {
        // Ignore storage errors (private browsing, etc.)
      }
      
      // 4. Apply blur effect if enabled
      if (blurOnExit && typeof document !== 'undefined') {
        document.body.style.filter = 'blur(18px)';
        document.body.style.transition = 'filter 0.2s ease';
      }
      
      // 5. Replace browser history to prevent back button
      try {
        // Push multiple entries to make back button harder to use
        for (let i = 0; i < 5; i++) {
          window.history.pushState(null, '', exitUrl);
        }
        window.history.replaceState(null, '', exitUrl);
      } catch {
        // Ignore history errors
      }
      
      // 6. Navigate to exit URL
      window.location.replace(exitUrl);
      
      // 7. Clear blur after short delay (in case redirect fails)
      setTimeout(() => {
        if (typeof document !== 'undefined') {
          document.body.style.filter = '';
        }
      }, 700);
      
    } catch (error) {
      // If anything fails, still try to navigate away
      console.error('Safety exit error:', error);
      try {
        window.location.replace(exitUrl);
      } catch {
        window.location.href = exitUrl;
      }
    }
  }, [clearAllIntervals, clearAllTimeouts, onExit, exitUrl, blurOnExit]);
  
  /**
   * Handle header tap for mobile triple-tap gesture
   */
  const onHeaderTap = useCallback(() => {
    const now = Date.now();
    
    // Reset if too much time passed (500ms window)
    if (now - lastTapRef.current > 500) {
      tapCountRef.current = 0;
    }
    
    tapCountRef.current++;
    lastTapRef.current = now;
    
    // Trigger on triple tap
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      triggerSafetyExit();
    }
  }, [triggerSafetyExit]);
  
  /**
   * Check if text is /exit command
   */
  const isExitCommand = useCallback((text: string): boolean => {
    const trimmed = text.trim().toLowerCase();
    return trimmed === '/exit' || trimmed === '/quit' || trimmed === '/leave';
  }, []);
  
  /**
   * Keyboard event handler for Shift+Escape
   */
  useEffect(() => {
    if (!useShiftEscape) return;
    if (SAFETY_EXIT_PROTOCOL?.enabled === false) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Shift+Escape triggers exit
      if (event.shiftKey && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        triggerSafetyExit();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [useShiftEscape, triggerSafetyExit]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllIntervals();
      clearAllTimeouts();
    };
  }, [clearAllIntervals, clearAllTimeouts]);
  
  return {
    triggerSafetyExit,
    registerInterval,
    registerTimeout,
    clearAllIntervals,
    clearAllTimeouts,
    onHeaderTap,
    isExitCommand,
  };
}

export default useSafetyExit;
