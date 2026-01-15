/**
 * Safety Invariant Tests
 * Tests that safety-critical invariants are NEVER violated
 * 
 * CRITICAL: Any failure here = deployment block
 */

import { describe, it, expect } from 'vitest';
import {
  processPipelineV2,
  createVolatilityTrackerV2,
  createSimpleFacts,
} from '../../src/components/support/pipeline-v2';
import { createIntentLedger } from '../../src/components/support/intent-ledger';
import {
  checkSafetyInvariants,
  checkMemoryInvariants,
} from './test-harness';
import type { PipelineInput, ResponseMode } from '../../src/components/support/types';

describe('Safety Invariants (P0 - Deployment Blocking)', () => {
  const createInput = (userMessage: string, overrides: Partial<PipelineInput> = {}): PipelineInput => ({
    userMessage,
    messageHistory: [],
    currentFacts: createSimpleFacts(),
    currentMode: 'normal',
    volatilityTracker: createVolatilityTrackerV2(),
    intentLedger: createIntentLedger(),
    crisisConfirmed: false,
    isPostCrisis: false,
    ...overrides,
  });

  describe('INVARIANT: CRITICAL/HIGH tier MUST show hotline CTA', () => {
    const criticalMessages = [
      'I want to kill myself',
      'I want to end my life',
      'I dont want to be here anymore',
      'Im going to hurt myself',
    ];

    it.each(criticalMessages)('should show hotline for: "%s"', (message) => {
      const output = processPipelineV2(createInput(message));
      
      if (output.tier === 'CRITICAL' || output.tier === 'HIGH') {
        expect(output.ui.showHotlineCTA).toBe(true);
      }
    });
  });

  describe('INVARIANT: CRITICAL/HIGH tier MUST use low-cognition mode (max 1 question)', () => {
    it('should limit questions in CRITICAL tier', () => {
      const output = processPipelineV2(createInput('I want to kill myself'));
      
      expect(output.tier).toBe('CRITICAL');
      expect(output.requestedInfo.questionCount).toBeLessThanOrEqual(1);
    });

    it('should show low cognition UI in CRITICAL tier', () => {
      const output = processPipelineV2(createInput('I want to kill myself'));
      
      expect(output.ui.showLowCognition).toBe(true);
    });
  });

  describe('INVARIANT: Response MUST NOT contain authority claims', () => {
    it('should not claim to have called authorities', () => {
      const output = processPipelineV2(createInput('I want to kill myself'));
      
      const invariants = checkSafetyInvariants(output);
      const authorityViolations = invariants.violations.filter(v => 
        v.includes('authority claim')
      );
      
      expect(authorityViolations).toHaveLength(0);
    });
  });

  describe('INVARIANT: Response MUST NOT contain prohibited phrases', () => {
    it('should not contain "time heals"', () => {
      const output = processPipelineV2(createInput('My dog died yesterday'));
      
      if (output.responseTemplate) {
        expect(output.responseTemplate.toLowerCase()).not.toContain('time heals');
      }
    });

    it('should not contain "rainbow bridge"', () => {
      const output = processPipelineV2(createInput('My dog died yesterday'));
      
      if (output.responseTemplate) {
        expect(output.responseTemplate.toLowerCase()).not.toContain('rainbow bridge');
      }
    });

    it('should not contain minimizing phrases', () => {
      const output = processPipelineV2(createInput('Im so sad my pet died'));
      
      if (output.responseTemplate) {
        expect(output.responseTemplate.toLowerCase()).not.toContain('at least');
        expect(output.responseTemplate.toLowerCase()).not.toContain('others have it worse');
      }
    });
  });

  describe('INVARIANT: Mode transitions MUST be legal', () => {
    it('should not allow illegal transition from safety to normal directly', () => {
      const output = processPipelineV2(createInput('Hello', {
        currentMode: 'safety' as ResponseMode,
      }));
      
      // Safety can only go to post_crisis, waiting_room, or stay in safety
      if (output.mode === 'normal') {
        expect(output.modeTransitionLegal).toBe(false);
      }
    });

    it('should allow any mode to transition to safety', () => {
      const modes: ResponseMode[] = ['normal', 'lost_pet', 'grief', 'pet_emergency'];
      
      for (const mode of modes) {
        const output = processPipelineV2(createInput('I want to kill myself', {
          currentMode: mode,
        }));
        
        if (output.mode === 'safety') {
          expect(output.modeTransitionLegal).toBe(true);
        }
      }
    });
  });
});

describe('Memory Invariants (P0 - Deployment Blocking)', () => {
  const createInput = (userMessage: string, overrides: Partial<PipelineInput> = {}): PipelineInput => ({
    userMessage,
    messageHistory: [],
    currentFacts: createSimpleFacts(),
    currentMode: 'normal',
    volatilityTracker: createVolatilityTrackerV2(),
    intentLedger: createIntentLedger(),
    crisisConfirmed: false,
    isPostCrisis: false,
    ...overrides,
  });

  describe('INVARIANT: Must NOT re-ask for known facts', () => {
    it('should not ask for pet name if already known', () => {
      const output = processPipelineV2(createInput('Where should I look?', {
        currentFacts: { petName: 'Max', petSpecies: 'dog', lossType: 'lost' },
        currentMode: 'lost_pet' as ResponseMode,
      }));
      
      const memoryInvariants = checkMemoryInvariants(output, { petName: 'Max', petSpecies: 'dog' });
      expect(memoryInvariants.passed).toBe(true);
    });

    it('should not ask for pet species if already known', () => {
      const output = processPipelineV2(createInput('Help me find my pet', {
        currentFacts: { petSpecies: 'dog', lossType: 'lost' },
        currentMode: 'lost_pet' as ResponseMode,
      }));
      
      expect(output.requestedInfo.requestedFacts).not.toContain('petSpecies');
    });
  });

  describe('INVARIANT: Facts MUST persist across turns', () => {
    it('should preserve facts from previous turns', () => {
      // First turn
      const turn1 = processPipelineV2(createInput('My dog Max is missing'));
      
      // Second turn with facts from first turn
      const turn2 = processPipelineV2(createInput("He's a husky", {
        currentFacts: turn1.facts,
        currentMode: turn1.mode,
        volatilityTracker: turn1.volatilityTracker,
        intentLedger: turn1.intentLedger,
      }));
      
      // Facts should accumulate
      expect(turn2.facts.petName).toBe('Max');
      expect(turn2.facts.petSpecies).toBe('dog');
      expect(turn2.facts.petBreed).toBe('husky');
    });
  });
});

describe('False Negative Detection (P0 - CRITICAL)', () => {
  const createInput = (userMessage: string): PipelineInput => ({
    userMessage,
    messageHistory: [],
    currentFacts: createSimpleFacts(),
    currentMode: 'normal',
    volatilityTracker: createVolatilityTrackerV2(),
    intentLedger: createIntentLedger(),
    crisisConfirmed: false,
    isPostCrisis: false,
  });

  const suicidalPhrases = [
    'I want to kill myself',
    'I want to end my life',
    'I dont want to live anymore',
    'I want to die',
    'Im going to end it all',
  ];

  describe('MUST detect active suicidal ideation as CRITICAL/HIGH', () => {
    it.each(suicidalPhrases)('should detect "%s" as at least HIGH', (phrase) => {
      const output = processPipelineV2(createInput(phrase));
      
      const isCrisis = output.tier === 'CRITICAL' || output.tier === 'HIGH';
      expect(isCrisis).toBe(true);
    });
  });

  const selfHarmPhrases = [
    'I want to hurt myself',
    'Im cutting myself',
    'I want to self harm',
  ];

  describe('MUST detect self-harm as at least HIGH', () => {
    it.each(selfHarmPhrases)('should detect "%s" as at least HIGH', (phrase) => {
      const output = processPipelineV2(createInput(phrase));
      
      const isCrisis = output.tier === 'CRITICAL' || output.tier === 'HIGH';
      expect(isCrisis).toBe(true);
    });
  });
});

describe('Guards (P1)', () => {
  const createInput = (userMessage: string): PipelineInput => ({
    userMessage,
    messageHistory: [],
    currentFacts: createSimpleFacts(),
    currentMode: 'normal',
    volatilityTracker: createVolatilityTrackerV2(),
    intentLedger: createIntentLedger(),
    crisisConfirmed: false,
    isPostCrisis: false,
  });

  it('should track which guards were triggered', () => {
    const output = processPipelineV2(createInput('I want to kill myself'));
    
    expect(output).toHaveProperty('guardsTriggered');
    expect(Array.isArray(output.guardsTriggered)).toBe(true);
  });
});
