/**
 * Pipeline Unit Tests
 * Tests the V2 pipeline with structured output
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  processPipelineV2,
  createVolatilityTrackerV2,
  createSimpleFacts,
  extractFactsFromMessage,
  mergeFacts,
  assessCrisisMinimal,
  updateVolatility,
} from '../../src/components/support/pipeline-v2';
import {
  createIntentLedger,
  canAskQuestion,
  updateLedgerFromFacts,
} from '../../src/components/support/intent-ledger';
import type {
  PipelineInput,
  SimpleFacts,
  ResponseMode,
} from '../../src/components/support/types';

describe('Pipeline V2', () => {
  let defaultInput: PipelineInput;

  beforeEach(() => {
    defaultInput = {
      userMessage: '',
      messageHistory: [],
      currentFacts: createSimpleFacts(),
      currentMode: 'normal',
      volatilityTracker: createVolatilityTrackerV2(),
      intentLedger: createIntentLedger(),
      crisisConfirmed: false,
      isPostCrisis: false,
    };
  });

  describe('Crisis Detection', () => {
    it('should detect CRITICAL tier for active suicidal ideation', () => {
      const input = { ...defaultInput, userMessage: 'I want to kill myself' };
      const output = processPipelineV2(input);
      
      expect(output.tier).toBe('CRITICAL');
      expect(output.mode).toBe('safety');
      expect(output.ui.showHotlineCTA).toBe(true);
      expect(output.ui.showLowCognition).toBe(true);
    });

    it('should detect HIGH tier for passive suicidal ideation', () => {
      const input = { ...defaultInput, userMessage: "I don't want to be here anymore" };
      const output = processPipelineV2(input);
      
      expect(output.tier).toMatch(/CRITICAL|HIGH/);
      expect(output.ui.showHotlineCTA).toBe(true);
    });

    it('should detect STANDARD tier for normal conversation', () => {
      const input = { ...defaultInput, userMessage: 'Hello, how are you?' };
      const output = processPipelineV2(input);
      
      expect(output.tier).toBe('STANDARD');
      expect(output.mode).toBe('normal');
      expect(output.ui.showHotlineCTA).toBe(false);
    });

    it('should detect lost_pet mode for missing pet reports', () => {
      const input = { ...defaultInput, userMessage: 'My dog is missing' };
      const output = processPipelineV2(input);
      
      expect(output.mode).toBe('lost_pet');
      expect(output.facts.lossType).toBe('lost');
      expect(output.facts.petSpecies).toBe('dog');
    });

    it('should detect scam mode for wire transfer requests', () => {
      const input = { ...defaultInput, userMessage: 'They want me to send money via Western Union' };
      const output = processPipelineV2(input);
      
      expect(output.mode).toBe('scam');
      expect(output.ui.showScamWarning).toBe(true);
    });
  });

  describe('Facts Extraction', () => {
    it('should extract pet species', () => {
      const facts = extractFactsFromMessage('My dog ran away');
      expect(facts.petSpecies).toBe('dog');
    });

    it('should extract pet name', () => {
      const facts = extractFactsFromMessage('My dog named Max is missing');
      expect(facts.petName).toBe('Max');
    });

    it('should extract pet breed', () => {
      const facts = extractFactsFromMessage("He's a husky");
      expect(facts.petBreed).toBe('husky');
    });

    it('should extract loss type', () => {
      const facts = extractFactsFromMessage('My cat escaped from the house');
      expect(facts.lossType).toBe('lost');
    });

    it('should extract safety confirmation', () => {
      const facts = extractFactsFromMessage("I'm safe now");
      expect(facts.userConfirmedSafe).toBe(true);
    });

    it('should merge facts correctly', () => {
      const existing: SimpleFacts = { petName: 'Max', petSpecies: 'dog' };
      const newFacts = { petBreed: 'husky', petColor: 'gray' };
      const merged = mergeFacts(existing, newFacts);
      
      expect(merged.petName).toBe('Max');
      expect(merged.petSpecies).toBe('dog');
      expect(merged.petBreed).toBe('husky');
      expect(merged.petColor).toBe('gray');
    });
  });

  describe('Anti-Repetition (Intent Ledger)', () => {
    it('should not ask for facts already known', () => {
      const facts: SimpleFacts = { petName: 'Max' };
      const ledger = createIntentLedger();
      
      const result = canAskQuestion(ledger, 'ASK_PET_NAME', facts, 0);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Already know');
    });

    it('should allow asking for unknown facts', () => {
      const facts: SimpleFacts = {};
      const ledger = createIntentLedger();
      
      const result = canAskQuestion(ledger, 'ASK_PET_NAME', facts, 0);
      expect(result.allowed).toBe(true);
    });

    it('should not re-ask recently asked questions', () => {
      let ledger = createIntentLedger();
      const facts: SimpleFacts = {};
      
      // First ask is allowed
      const first = canAskQuestion(ledger, 'ASK_PET_SPECIES', facts, 0);
      expect(first.allowed).toBe(true);
      
      // Simulate asking the question
      ledger = updateLedgerFromFacts(ledger, { petSpecies: 'dog' });
      
      // Now should not be allowed
      const second = canAskQuestion(ledger, 'ASK_PET_SPECIES', { petSpecies: 'dog' }, 1);
      expect(second.allowed).toBe(false);
    });
  });

  describe('Mode Transitions', () => {
    it('should allow transition from normal to lost_pet', () => {
      const input = { ...defaultInput, userMessage: 'My dog is missing' };
      const output = processPipelineV2(input);
      
      expect(output.modeTransitionLegal).toBe(true);
      expect(output.mode).toBe('lost_pet');
    });

    it('should allow transition from any mode to safety', () => {
      const input = {
        ...defaultInput,
        currentMode: 'lost_pet' as ResponseMode,
        userMessage: 'I want to kill myself',
      };
      const output = processPipelineV2(input);
      
      expect(output.modeTransitionLegal).toBe(true);
      expect(output.mode).toBe('safety');
    });

    it('should track previous mode', () => {
      const input = {
        ...defaultInput,
        currentMode: 'lost_pet' as ResponseMode,
        userMessage: 'I want to kill myself',
      };
      const output = processPipelineV2(input);
      
      expect(output.previousMode).toBe('lost_pet');
      expect(output.mode).toBe('safety');
    });
  });

  describe('UI Directives', () => {
    it('should show low cognition mode for CRITICAL tier', () => {
      const input = { ...defaultInput, userMessage: 'I want to kill myself' };
      const output = processPipelineV2(input);
      
      expect(output.ui.showLowCognition).toBe(true);
    });

    it('should limit questions in CRITICAL tier', () => {
      const input = { ...defaultInput, userMessage: 'I want to kill myself' };
      const output = processPipelineV2(input);
      
      expect(output.requestedInfo.questionCount).toBeLessThanOrEqual(1);
    });

    it('should show hotline CTA for CRITICAL tier', () => {
      const input = { ...defaultInput, userMessage: 'I want to kill myself' };
      const output = processPipelineV2(input);
      
      expect(output.ui.showHotlineCTA).toBe(true);
      expect(output.ui.hotlineNumber).toBeTruthy();
    });

    it('should require confirmation for CRITICAL unconfirmed crisis', () => {
      const input = { ...defaultInput, userMessage: 'I want to kill myself' };
      const output = processPipelineV2(input);
      
      expect(output.ui.requiresConfirmation).toBe(true);
      expect(output.ui.confirmationParaphrase).toBeTruthy();
    });
  });

  describe('Volatility Tracking', () => {
    it('should track score history', () => {
      const input = { ...defaultInput, userMessage: 'I want to kill myself' };
      const output = processPipelineV2(input);
      
      expect(output.volatilityTracker.history.length).toBeGreaterThan(0);
    });

    it('should detect escalating trend', () => {
      let tracker = createVolatilityTrackerV2();
      
      // Simulate escalation - need at least 3 increasing scores for trend detection
      const scores: Array<{ score: number; tier: 'STANDARD' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> = [
        { score: 10, tier: 'STANDARD' },
        { score: 30, tier: 'MEDIUM' },
        { score: 60, tier: 'HIGH' },
        { score: 90, tier: 'CRITICAL' },
      ];
      
      for (const { score, tier } of scores) {
        tracker = updateVolatility(tracker, score, tier);
      }
      
      expect(tracker.trend).toBe('ESCALATING');
    });
  });

  describe('Bystander Detection', () => {
    it('should detect bystander reporting friend crisis', () => {
      const input = { ...defaultInput, userMessage: 'My friend texted me they want to end their life' };
      const output = processPipelineV2(input);
      
      expect(output.isBystander).toBe(true);
    });

    it('should detect minor bystander', () => {
      const input = { ...defaultInput, userMessage: 'My child said they want to hurt themselves' };
      const output = processPipelineV2(input);
      
      expect(output.isBystander).toBe(true);
      expect(output.bystanderIsMinor).toBe(true);
    });
  });

  describe('Response Generation', () => {
    it('should not require model call for CRITICAL tier', () => {
      const input = { ...defaultInput, userMessage: 'I want to kill myself' };
      const output = processPipelineV2(input);
      
      expect(output.requiresModelCall).toBe(false);
      expect(output.responseTemplate).toBeTruthy();
    });

    it('should require model call for normal conversation', () => {
      const input = { ...defaultInput, userMessage: 'Tell me about dogs' };
      const output = processPipelineV2(input);
      
      expect(output.requiresModelCall).toBe(true);
      expect(output.promptForModel).toBeTruthy();
    });
  });
});

describe('Crisis Assessment (Minimal)', () => {
  it('should return valid assessment structure', () => {
    const assessment = assessCrisisMinimal('Hello');
    
    expect(assessment).toHaveProperty('tier');
    expect(assessment).toHaveProperty('score');
    expect(assessment).toHaveProperty('markers');
    expect(assessment).toHaveProperty('primaryCrisis');
    expect(assessment).toHaveProperty('cognitiveLoad');
    expect(assessment).toHaveProperty('bystander');
    expect(assessment).toHaveProperty('disambiguation');
  });

  it('should detect negation in disambiguation', () => {
    const assessment = assessCrisisMinimal("I'm not thinking about hurting myself");
    
    expect(assessment.disambiguation.negationDetected).toBe(true);
  });

  it('should detect quoted text', () => {
    const assessment = assessCrisisMinimal('Someone said "I want to die" in a movie');
    
    expect(assessment.disambiguation.quotedTextDetected).toBe(true);
  });
});
