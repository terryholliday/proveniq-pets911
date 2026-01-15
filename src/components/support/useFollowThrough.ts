/**
 * useFollowThrough Hook
 * Manages follow-up check-ins after user indicates they will seek help
 * Implements the FOLLOW_UP_CADENCE from config
 */

import { useCallback, useRef, useEffect } from 'react';
import { FOLLOW_UP_CADENCE } from './companion-config';

interface FollowThroughOptions {
  /** Callback to send a check-in message */
  onCheckIn: (message: string, checkInNumber: number) => void;
  /** Reference to timeouts Set for cleanup */
  timeoutsRef?: React.MutableRefObject<Set<NodeJS.Timeout>>;
}

interface FollowThroughReturn {
  /** Start follow-through tracking with specific hotline */
  startFollowThrough: (hotline: string) => void;
  /** Stop all follow-through tracking */
  stopFollowThrough: () => void;
  /** Record user response to check-in */
  recordResponse: (response: 'yes' | 'no' | 'trying') => void;
  /** Check if follow-through is active */
  isActive: () => boolean;
}

/**
 * Hook for managing follow-through check-ins
 */
export function useFollowThrough(options: FollowThroughOptions): FollowThroughReturn {
  const { onCheckIn, timeoutsRef: externalTimeoutsRef } = options;
  
  const internalTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const timeoutsRef = externalTimeoutsRef || internalTimeoutsRef;
  
  const activeRef = useRef(false);
  const hotlineRef = useRef<string>('');
  const checkInCountRef = useRef(0);
  const responsesRef = useRef<Array<{ time: Date; response: string }>>([]);
  
  /**
   * Get check-in message based on count
   */
  const getCheckInMessage = useCallback((hotline: string, count: number): string => {
    switch (count) {
      case 1:
        return `Checking in: Did you reach out to ${hotline}? Reply YES / NO / STILL TRYING.`;
      case 2:
        return `I'm still here. Have you been able to connect with ${hotline}?`;
      case 3:
        return `Just checking in again. Are you okay? Did you reach ${hotline}?`;
      default:
        return `I'm here if you need me. Did you connect with support?`;
    }
  }, []);
  
  /**
   * Schedule all follow-through check-ins
   */
  const startFollowThrough = useCallback((hotline: string) => {
    if (!FOLLOW_UP_CADENCE?.enabled) return;
    
    // Clear any existing
    stopFollowThrough();
    
    activeRef.current = true;
    hotlineRef.current = hotline;
    checkInCountRef.current = 0;
    responsesRef.current = [];
    
    const intervals = FOLLOW_UP_CADENCE.intervals || [120000, 300000, 900000];
    
    intervals.forEach((delay, index) => {
      const timeout = setTimeout(() => {
        if (!activeRef.current) return;
        
        checkInCountRef.current = index + 1;
        const message = getCheckInMessage(hotline, checkInCountRef.current);
        onCheckIn(message, checkInCountRef.current);
      }, delay);
      
      timeoutsRef.current.add(timeout);
    });
  }, [onCheckIn, getCheckInMessage, timeoutsRef]);
  
  /**
   * Stop all follow-through tracking
   */
  const stopFollowThrough = useCallback(() => {
    activeRef.current = false;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  }, [timeoutsRef]);
  
  /**
   * Record user response to check-in
   */
  const recordResponse = useCallback((response: 'yes' | 'no' | 'trying') => {
    responsesRef.current.push({
      time: new Date(),
      response,
    });
    
    // If user says yes, they reached out - stop checking in
    if (response === 'yes') {
      stopFollowThrough();
    }
    
    // If user says no multiple times, could indicate need for different approach
    // (This would be logged for human review, not automated action)
  }, [stopFollowThrough]);
  
  /**
   * Check if follow-through is active
   */
  const isActive = useCallback(() => activeRef.current, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFollowThrough();
    };
  }, [stopFollowThrough]);
  
  return {
    startFollowThrough,
    stopFollowThrough,
    recordResponse,
    isActive,
  };
}

export default useFollowThrough;
