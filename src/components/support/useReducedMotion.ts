/**
 * useReducedMotion Hook
 * Detects user's motion preference for accessibility
 */

import { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if user has set prefers-reduced-motion: reduce
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }
    
    // Create media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);
  
  return prefersReducedMotion;
}

/**
 * Hook variant that returns both the preference and a function to override it
 */
export function useReducedMotionWithOverride(): {
  prefersReducedMotion: boolean;
  forceReducedMotion: boolean;
  setForceReducedMotion: (force: boolean) => void;
  shouldReduceMotion: boolean;
} {
  const prefersReducedMotion = useReducedMotion();
  const [forceReducedMotion, setForceReducedMotion] = useState(false);
  
  return {
    prefersReducedMotion,
    forceReducedMotion,
    setForceReducedMotion,
    shouldReduceMotion: prefersReducedMotion || forceReducedMotion,
  };
}

export default useReducedMotion;
