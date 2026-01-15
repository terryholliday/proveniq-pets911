/**
 * usePipelineV2 Hook
 * React hook wrapper for the testable pipeline-v2
 * Bridges structured output to React component state
 */

import { useCallback, useRef } from 'react';
import {
  processPipelineV2,
  createVolatilityTrackerV2,
  createSimpleFacts,
  generateHandoffPacketV2,
} from './pipeline-v2';
import { createIntentLedger } from './intent-ledger';
import type {
  PipelineInput,
  PipelineOutput,
  SimpleFacts,
  VolatilityTracker,
  IntentLedger,
  ResponseMode,
  Region,
  HandoffPacket,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineState {
  facts: SimpleFacts;
  volatilityTracker: VolatilityTracker;
  intentLedger: IntentLedger;
  currentMode: ResponseMode;
  crisisConfirmed: boolean;
  isPostCrisis: boolean;
  region: Region;
  sessionStart: Date;
  messageCount: number;
}

export interface UsePipelineV2Result {
  /** Process a user message and get structured output */
  process: (userMessage: string, messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>) => PipelineOutput;
  
  /** Get current pipeline state */
  getState: () => PipelineState;
  
  /** Confirm a crisis (after user confirms understanding) */
  confirmCrisis: () => void;
  
  /** Mark user as safe (user explicitly confirmed) */
  markUserSafe: () => void;
  
  /** Enter post-crisis mode */
  enterPostCrisis: () => void;
  
  /** Reset pipeline state */
  reset: () => void;
  
  /** Prefill facts from external source (e.g., sessionStorage) */
  prefillFacts: (facts: Partial<SimpleFacts>) => void;
  
  /** Generate handoff packet for monitoring */
  generateHandoffPacket: () => HandoffPacket;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePipelineV2(): UsePipelineV2Result {
  // Refs to maintain state across renders without causing re-renders
  const stateRef = useRef<PipelineState>({
    facts: createSimpleFacts(),
    volatilityTracker: createVolatilityTrackerV2(),
    intentLedger: createIntentLedger(),
    currentMode: 'normal',
    crisisConfirmed: false,
    isPostCrisis: false,
    region: 'US',
    sessionStart: new Date(),
    messageCount: 0,
  });
  
  const lastOutputRef = useRef<PipelineOutput | null>(null);
  
  const process = useCallback((
    userMessage: string,
    messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): PipelineOutput => {
    const state = stateRef.current;
    
    const input: PipelineInput = {
      userMessage,
      messageHistory,
      currentFacts: state.facts,
      currentMode: state.currentMode,
      volatilityTracker: state.volatilityTracker,
      intentLedger: state.intentLedger,
      crisisConfirmed: state.crisisConfirmed,
      isPostCrisis: state.isPostCrisis,
      region: state.region,
    };
    
    const output = processPipelineV2(input);
    
    // Update state from output
    stateRef.current = {
      ...state,
      facts: output.facts,
      volatilityTracker: output.volatilityTracker,
      intentLedger: output.intentLedger,
      currentMode: output.mode,
      region: output.region,
      isPostCrisis: state.isPostCrisis || output.ui.enterPostCrisis,
      messageCount: state.messageCount + 1,
    };
    
    lastOutputRef.current = output;
    
    return output;
  }, []);
  
  const getState = useCallback((): PipelineState => {
    return { ...stateRef.current };
  }, []);
  
  const confirmCrisis = useCallback(() => {
    stateRef.current.crisisConfirmed = true;
  }, []);
  
  const markUserSafe = useCallback(() => {
    stateRef.current.facts = {
      ...stateRef.current.facts,
      userConfirmedSafe: true,
    };
  }, []);
  
  const enterPostCrisis = useCallback(() => {
    stateRef.current.isPostCrisis = true;
  }, []);
  
  const reset = useCallback(() => {
    stateRef.current = {
      facts: createSimpleFacts(),
      volatilityTracker: createVolatilityTrackerV2(),
      intentLedger: createIntentLedger(),
      currentMode: 'normal',
      crisisConfirmed: false,
      isPostCrisis: false,
      region: 'US',
      sessionStart: new Date(),
      messageCount: 0,
    };
    lastOutputRef.current = null;
  }, []);
  
  const prefillFacts = useCallback((facts: Partial<SimpleFacts>) => {
    stateRef.current.facts = {
      ...stateRef.current.facts,
      ...facts,
    };
  }, []);
  
  const generateHandoffPacket = useCallback((): HandoffPacket => {
    const state = stateRef.current;
    const output = lastOutputRef.current;
    
    if (!output) {
      // Return minimal packet if no output yet
      return {
        timestamp: new Date().toISOString(),
        riskTier: 'STANDARD',
        markersDetected: [],
        region: state.region,
        sessionDurationMinutes: 0,
        messageCount: state.messageCount,
        volatilityTrend: 'STABLE',
        mode: state.currentMode,
      };
    }
    
    return generateHandoffPacketV2(output, state.messageCount, state.sessionStart);
  }, []);
  
  return {
    process,
    getState,
    confirmCrisis,
    markUserSafe,
    enterPostCrisis,
    reset,
    prefillFacts,
    generateHandoffPacket,
  };
}

export default usePipelineV2;
