/**
 * useSingleFlight Hook
 * Request deduplication to prevent stale responses
 * Ensures only the most recent request's response is rendered
 */

import { useRef, useCallback } from 'react';

interface SingleFlightReturn {
  /** Start a new request, returns unique ID */
  start: () => number;
  /** Check if a request ID is still the active request */
  isActive: (id: number) => boolean;
  /** Mark a request as complete */
  finish: (id: number) => void;
  /** Cancel all pending requests */
  cancel: () => void;
  /** Get current active request ID (or null) */
  getActiveId: () => number | null;
}

/**
 * Hook for single-flight request management
 * Prevents race conditions and stale closures in async operations
 */
export function useSingleFlight(): SingleFlightReturn {
  const requestIdRef = useRef(0);
  const activeRef = useRef<number | null>(null);

  /**
   * Start a new request
   * Automatically invalidates any previous active request
   */
  const start = useCallback((): number => {
    const id = ++requestIdRef.current;
    activeRef.current = id;
    return id;
  }, []);

  /**
   * Check if a specific request is still active
   * Used to prevent rendering stale responses
   */
  const isActive = useCallback((id: number): boolean => {
    return activeRef.current === id;
  }, []);

  /**
   * Mark a request as complete
   * Only clears active state if it matches the completing request
   */
  const finish = useCallback((id: number): void => {
    if (activeRef.current === id) {
      activeRef.current = null;
    }
  }, []);

  /**
   * Cancel all pending requests
   * Sets active to -1 to invalidate everything
   */
  const cancel = useCallback((): void => {
    activeRef.current = -1;
  }, []);

  /**
   * Get current active request ID
   */
  const getActiveId = useCallback((): number | null => {
    return activeRef.current;
  }, []);

  return {
    start,
    isActive,
    finish,
    cancel,
    getActiveId,
  };
}

export default useSingleFlight;
