/**
 * useOfflineMode Hook
 * Detects network connectivity status
 * Shows appropriate UI when offline
 */

import { useEffect, useState, useCallback } from 'react';

interface OfflineModeReturn {
  /** True if browser is offline */
  isOffline: boolean;
  /** True if we recently reconnected */
  justReconnected: boolean;
  /** Clear the reconnection flag */
  clearReconnected: () => void;
}

/**
 * Hook for detecting offline/online status
 */
export function useOfflineMode(): OfflineModeReturn {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [justReconnected, setJustReconnected] = useState(false);

  const clearReconnected = useCallback(() => {
    setJustReconnected(false);
  }, []);

  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      const wasOffline = !navigator.onLine;
      setIsOffline(false);
      
      // Flag that we just reconnected (useful for retry logic)
      if (wasOffline) {
        setJustReconnected(true);
        
        // Auto-clear after 5 seconds
        setTimeout(() => setJustReconnected(false), 5000);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOffline,
    justReconnected,
    clearReconnected,
  };
}

export default useOfflineMode;
