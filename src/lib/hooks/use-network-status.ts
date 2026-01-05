'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NetworkState } from '@/lib/types';

// Detection criteria per OFFLINE_PROTOCOL.md
const DEGRADED_THRESHOLD_MS = 30000; // 30 seconds
const OFFLINE_THRESHOLD_MS = 120000; // 120 seconds

interface NetworkStatus {
  state: NetworkState;
  lastSuccessfulCall: number | null;
  latency: number | null;
}

/**
 * Hook to track network connectivity state
 * Per OFFLINE_PROTOCOL.md: ONLINE, DEGRADED, or OFFLINE
 */
export function useNetworkStatus(): NetworkStatus & {
  recordSuccessfulCall: (latency: number) => void;
  recordFailedCall: () => void;
} {
  const [status, setStatus] = useState<NetworkStatus>({
    state: typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE',
    lastSuccessfulCall: null,
    latency: null,
  });

  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  // Calculate network state based on criteria
  const calculateState = useCallback((
    isOnline: boolean,
    lastCall: number | null,
    latency: number | null,
    failures: number
  ): NetworkState => {
    // navigator.onLine is false
    if (!isOnline) {
      return 'OFFLINE';
    }

    // 3 consecutive failures
    if (failures >= 3) {
      return 'OFFLINE';
    }

    // No successful call in > 120 seconds
    if (lastCall !== null && Date.now() - lastCall > OFFLINE_THRESHOLD_MS) {
      return 'OFFLINE';
    }

    // Last successful call > 30 seconds ago OR latency > 5000ms
    if (lastCall !== null) {
      const timeSinceLastCall = Date.now() - lastCall;
      if (timeSinceLastCall > DEGRADED_THRESHOLD_MS || (latency && latency > 5000)) {
        return 'DEGRADED';
      }
    }

    return 'ONLINE';
  }, []);

  // Update state on network events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setConsecutiveFailures(0);
      setStatus(prev => ({
        ...prev,
        state: calculateState(true, prev.lastSuccessfulCall, prev.latency, 0),
      }));
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        state: 'OFFLINE',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [calculateState]);

  // Periodic state check
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        state: calculateState(
          navigator.onLine,
          prev.lastSuccessfulCall,
          prev.latency,
          consecutiveFailures
        ),
      }));
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [calculateState, consecutiveFailures]);

  // Record successful API call
  const recordSuccessfulCall = useCallback((latency: number) => {
    setConsecutiveFailures(0);
    setStatus(prev => ({
      lastSuccessfulCall: Date.now(),
      latency,
      state: calculateState(navigator.onLine, Date.now(), latency, 0),
    }));
  }, [calculateState]);

  // Record failed API call
  const recordFailedCall = useCallback(() => {
    setConsecutiveFailures(prev => {
      const newCount = prev + 1;
      setStatus(current => ({
        ...current,
        state: calculateState(
          navigator.onLine,
          current.lastSuccessfulCall,
          current.latency,
          newCount
        ),
      }));
      return newCount;
    });
  }, [calculateState]);

  return {
    ...status,
    recordSuccessfulCall,
    recordFailedCall,
  };
}

/**
 * Get color for network state indicator
 * Per OFFLINE_PROTOCOL.md visual indicators
 */
export function getNetworkStateColor(state: NetworkState): string {
  switch (state) {
    case 'ONLINE':
      return '#22C55E';
    case 'DEGRADED':
      return '#F59E0B';
    case 'OFFLINE':
      return '#EF4444';
  }
}

/**
 * Get display text for network state
 */
export function getNetworkStateText(state: NetworkState): string {
  switch (state) {
    case 'ONLINE':
      return 'Online';
    case 'DEGRADED':
      return 'Slow Connection';
    case 'OFFLINE':
      return 'Offline Mode - Changes will sync when connected';
  }
}
