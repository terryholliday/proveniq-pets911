/**
 * Test Harness for Support Companion
 * Runs the real pipeline and validates against structured expectations
 */

import {
  processPipelineV2,
  createVolatilityTrackerV2,
  createSimpleFacts,
} from '../../src/components/support/pipeline-v2';

import {
  createIntentLedger,
} from '../../src/components/support/intent-ledger';

import type {
  RiskTier,
  ResponseMode,
  SimpleFacts,
  QuestionIntent,
  PipelineOutput,
  PipelineInput,
  VolatilityTracker,
  IntentLedger,
  Region,
} from '../../src/components/support/types';

// ============================================================================
// TYPES
// ============================================================================

export interface TurnExpectation {
  // Tier expectations
  tier?: RiskTier;
  tierAtLeast?: RiskTier;
  tierAtMost?: RiskTier;
  
  // Mode expectations
  mode?: ResponseMode;
  modeOneOf?: ResponseMode[];
  
  // Marker expectations
  markersPresent?: string[];
  markersAbsent?: string[];
  
  // Facts expectations
  facts?: Partial<SimpleFacts>;
  factsMustExist?: Array<keyof SimpleFacts>;
  factsMustNotExist?: Array<keyof SimpleFacts>;
  
  // UI directive expectations (STRUCTURED - not text-based)
  ui?: {
    showLowCognition?: boolean;
    showHotlineCTA?: boolean;
    hotlineType?: string;
    showGroundingTool?: string | null;
    showScamWarning?: boolean;
    showWaitingRoom?: boolean;
    requiresConfirmation?: boolean;
  };
  
  // Anti-repetition expectations
  mustNotRequestFacts?: Array<keyof SimpleFacts>;
  mustNotRequestIntents?: QuestionIntent[];
  maxQuestions?: number;
  
  // Bystander expectations
  bystanderDetected?: boolean;
  bystanderIsMinor?: boolean;
  
  // Region expectations
  regionDetected?: Region;
  
  // Response text checks (use sparingly - prefer structured checks)
  responseContains?: string[];
  responseNotContains?: string[];
  maxResponseLength?: number;
  
  // Safety checks
  requiresHumanHandoff?: boolean;
  modeTransitionLegal?: boolean;
}

export interface TranscriptTurn {
  user: string;
  expect: TurnExpectation;
  note?: string;
}

export interface GoldenTranscript {
  id: string;
  name: string;
  description: string;
  tags: string[];
  configRefs?: string[];
  turns: TranscriptTurn[];
}

export interface TurnResult {
  turnIndex: number;
  userMessage: string;
  passed: boolean;
  violations: string[];
  pipelineOutput: PipelineOutput;
  expected: TurnExpectation;
  confusion: ConfusionResult;
}

export interface TranscriptResult {
  transcript: GoldenTranscript;
  passed: boolean;
  turnResults: TurnResult[];
  allViolations: string[];
  confusionSummary: {
    falseNegatives: number;
    falsePositives: number;
  };
  duration: number;
}

// ============================================================================
// CONFUSION MATRIX
// ============================================================================

export interface ConfusionResult {
  isFalseNegative: boolean;
  isFalsePositive: boolean;
  expectedSeverity: 'crisis' | 'concern' | 'normal';
  actualSeverity: 'crisis' | 'concern' | 'normal';
}

function classifyTier(tier: RiskTier): 'crisis' | 'concern' | 'normal' {
  if (tier === 'CRITICAL' || tier === 'HIGH') return 'crisis';
  if (tier === 'MEDIUM') return 'concern';
  return 'normal';
}

export function computeConfusion(expected: TurnExpectation, actual: PipelineOutput): ConfusionResult {
  let expectedSeverity: 'crisis' | 'concern' | 'normal' = 'normal';
  
  if (expected.tier) {
    expectedSeverity = classifyTier(expected.tier);
  } else if (expected.tierAtLeast) {
    if (expected.tierAtLeast === 'CRITICAL' || expected.tierAtLeast === 'HIGH') {
      expectedSeverity = 'crisis';
    } else if (expected.tierAtLeast === 'MEDIUM') {
      expectedSeverity = 'concern';
    }
  }
  
  const actualSeverity = classifyTier(actual.tier);
  
  const isFalseNegative = expectedSeverity === 'crisis' && actualSeverity !== 'crisis';
  const isFalsePositive = expectedSeverity === 'normal' && actualSeverity === 'crisis';
  
  return {
    isFalseNegative,
    isFalsePositive,
    expectedSeverity,
    actualSeverity,
  };
}

// ============================================================================
// TIER COMPARISON
// ============================================================================

const TIER_ORDER: Record<RiskTier, number> = {
  'STANDARD': 0,
  'MEDIUM': 1,
  'HIGH': 2,
  'CRITICAL': 3,
};

function tierAtLeast(actual: RiskTier, minimum: RiskTier): boolean {
  return TIER_ORDER[actual] >= TIER_ORDER[minimum];
}

function tierAtMost(actual: RiskTier, maximum: RiskTier): boolean {
  return TIER_ORDER[actual] <= TIER_ORDER[maximum];
}

// ============================================================================
// EXPECTATION VALIDATION
// ============================================================================

export function validateExpectation(
  output: PipelineOutput,
  expected: TurnExpectation
): string[] {
  const violations: string[] = [];
  
  // Tier checks
  if (expected.tier && output.tier !== expected.tier) {
    violations.push(`Expected tier ${expected.tier}, got ${output.tier}`);
  }
  
  if (expected.tierAtLeast && !tierAtLeast(output.tier, expected.tierAtLeast)) {
    violations.push(`Expected tier at least ${expected.tierAtLeast}, got ${output.tier}`);
  }
  
  if (expected.tierAtMost && !tierAtMost(output.tier, expected.tierAtMost)) {
    violations.push(`Expected tier at most ${expected.tierAtMost}, got ${output.tier}`);
  }
  
  // Mode checks
  if (expected.mode && output.mode !== expected.mode) {
    violations.push(`Expected mode ${expected.mode}, got ${output.mode}`);
  }
  
  if (expected.modeOneOf && !expected.modeOneOf.includes(output.mode)) {
    violations.push(`Expected mode one of [${expected.modeOneOf.join(', ')}], got ${output.mode}`);
  }
  
  // Marker checks
  if (expected.markersPresent) {
    for (const marker of expected.markersPresent) {
      if (!output.markers.some(m => m.toLowerCase().includes(marker.toLowerCase()))) {
        violations.push(`Expected marker "${marker}" not found in [${output.markers.join(', ')}]`);
      }
    }
  }
  
  if (expected.markersAbsent) {
    for (const marker of expected.markersAbsent) {
      if (output.markers.some(m => m.toLowerCase().includes(marker.toLowerCase()))) {
        violations.push(`Unexpected marker "${marker}" found in output`);
      }
    }
  }
  
  // Facts checks
  if (expected.facts) {
    for (const [key, value] of Object.entries(expected.facts)) {
      const actualValue = (output.facts as any)[key];
      if (actualValue !== value) {
        violations.push(`Expected fact ${key}="${value}", got "${actualValue}"`);
      }
    }
  }
  
  if (expected.factsMustExist) {
    for (const key of expected.factsMustExist) {
      const value = output.facts[key];
      if (value === undefined || value === null || value === '') {
        violations.push(`Expected fact ${key} to exist, but it doesn't`);
      }
    }
  }
  
  if (expected.factsMustNotExist) {
    for (const key of expected.factsMustNotExist) {
      const value = output.facts[key];
      if (value !== undefined && value !== null && value !== '') {
        violations.push(`Expected fact ${key} to NOT exist, but it has value "${value}"`);
      }
    }
  }
  
  // UI directive checks
  if (expected.ui) {
    if (expected.ui.showLowCognition !== undefined && output.ui.showLowCognition !== expected.ui.showLowCognition) {
      violations.push(`Expected showLowCognition=${expected.ui.showLowCognition}, got ${output.ui.showLowCognition}`);
    }
    
    if (expected.ui.showHotlineCTA !== undefined && output.ui.showHotlineCTA !== expected.ui.showHotlineCTA) {
      violations.push(`Expected showHotlineCTA=${expected.ui.showHotlineCTA}, got ${output.ui.showHotlineCTA}`);
    }
    
    if (expected.ui.showScamWarning !== undefined && output.ui.showScamWarning !== expected.ui.showScamWarning) {
      violations.push(`Expected showScamWarning=${expected.ui.showScamWarning}, got ${output.ui.showScamWarning}`);
    }
    
    if (expected.ui.showWaitingRoom !== undefined && output.ui.showWaitingRoom !== expected.ui.showWaitingRoom) {
      violations.push(`Expected showWaitingRoom=${expected.ui.showWaitingRoom}, got ${output.ui.showWaitingRoom}`);
    }
    
    if (expected.ui.requiresConfirmation !== undefined && output.ui.requiresConfirmation !== expected.ui.requiresConfirmation) {
      violations.push(`Expected requiresConfirmation=${expected.ui.requiresConfirmation}, got ${output.ui.requiresConfirmation}`);
    }
  }
  
  // Anti-repetition checks
  if (expected.mustNotRequestFacts) {
    for (const fact of expected.mustNotRequestFacts) {
      if (output.requestedInfo.requestedFacts.includes(fact)) {
        violations.push(`Should NOT request fact ${fact}, but it was requested`);
      }
    }
  }
  
  if (expected.mustNotRequestIntents) {
    for (const intent of expected.mustNotRequestIntents) {
      if (output.requestedInfo.questionIntents.includes(intent)) {
        violations.push(`Should NOT request intent ${intent}, but it was requested`);
      }
    }
  }
  
  if (expected.maxQuestions !== undefined && output.requestedInfo.questionCount > expected.maxQuestions) {
    violations.push(`Expected max ${expected.maxQuestions} questions, got ${output.requestedInfo.questionCount}`);
  }
  
  // Bystander checks
  if (expected.bystanderDetected !== undefined && output.isBystander !== expected.bystanderDetected) {
    violations.push(`Expected bystanderDetected=${expected.bystanderDetected}, got ${output.isBystander}`);
  }
  
  if (expected.bystanderIsMinor !== undefined && output.bystanderIsMinor !== expected.bystanderIsMinor) {
    violations.push(`Expected bystanderIsMinor=${expected.bystanderIsMinor}, got ${output.bystanderIsMinor}`);
  }
  
  // Region checks
  if (expected.regionDetected && output.region !== expected.regionDetected) {
    violations.push(`Expected region ${expected.regionDetected}, got ${output.region}`);
  }
  
  // Response text checks (use sparingly)
  if (output.responseTemplate) {
    if (expected.responseContains) {
      for (const text of expected.responseContains) {
        if (!output.responseTemplate.toLowerCase().includes(text.toLowerCase())) {
          violations.push(`Expected response to contain "${text}"`);
        }
      }
    }
    
    if (expected.responseNotContains) {
      for (const text of expected.responseNotContains) {
        if (output.responseTemplate.toLowerCase().includes(text.toLowerCase())) {
          violations.push(`Expected response to NOT contain "${text}"`);
        }
      }
    }
    
    if (expected.maxResponseLength && output.responseTemplate.length > expected.maxResponseLength) {
      violations.push(`Expected response max length ${expected.maxResponseLength}, got ${output.responseTemplate.length}`);
    }
  }
  
  // Safety checks
  if (expected.requiresHumanHandoff !== undefined && output.requiresHumanHandoff !== expected.requiresHumanHandoff) {
    violations.push(`Expected requiresHumanHandoff=${expected.requiresHumanHandoff}, got ${output.requiresHumanHandoff}`);
  }
  
  if (expected.modeTransitionLegal !== undefined && output.modeTransitionLegal !== expected.modeTransitionLegal) {
    violations.push(`Expected modeTransitionLegal=${expected.modeTransitionLegal}, got ${output.modeTransitionLegal}`);
  }
  
  return violations;
}

// ============================================================================
// TRANSCRIPT RUNNER
// ============================================================================

export function runTranscript(transcript: GoldenTranscript): TranscriptResult {
  const startTime = performance.now();
  const turnResults: TurnResult[] = [];
  const allViolations: string[] = [];
  let falseNegatives = 0;
  let falsePositives = 0;
  
  // Initialize state
  let facts: SimpleFacts = createSimpleFacts();
  let volatilityTracker: VolatilityTracker = createVolatilityTrackerV2();
  let intentLedger: IntentLedger = createIntentLedger();
  let currentMode: ResponseMode = 'normal';
  const messageHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let crisisConfirmed = false;
  let isPostCrisis = false;
  
  for (let i = 0; i < transcript.turns.length; i++) {
    const turn = transcript.turns[i];
    
    // Build pipeline input
    const input: PipelineInput = {
      userMessage: turn.user,
      messageHistory: [...messageHistory],
      currentFacts: facts,
      currentMode,
      volatilityTracker,
      intentLedger,
      crisisConfirmed,
      isPostCrisis,
    };
    
    // Run pipeline
    const output = processPipelineV2(input);
    
    // Validate expectations
    const violations = validateExpectation(output, turn.expect);
    
    // Compute confusion
    const confusion = computeConfusion(turn.expect, output);
    if (confusion.isFalseNegative) falseNegatives++;
    if (confusion.isFalsePositive) falsePositives++;
    
    // Record result
    const turnResult: TurnResult = {
      turnIndex: i,
      userMessage: turn.user,
      passed: violations.length === 0,
      violations,
      pipelineOutput: output,
      expected: turn.expect,
      confusion,
    };
    turnResults.push(turnResult);
    allViolations.push(...violations.map(v => `Turn ${i}: ${v}`));
    
    // Update state for next turn
    facts = output.facts;
    volatilityTracker = output.volatilityTracker;
    intentLedger = output.intentLedger;
    currentMode = output.mode;
    
    // Add to message history
    messageHistory.push({ role: 'user', content: turn.user });
    if (output.responseTemplate) {
      messageHistory.push({ role: 'assistant', content: output.responseTemplate });
    }
    
    // Update crisis state
    if (output.tier === 'CRITICAL' && output.ui.requiresConfirmation) {
      // In real app, user would confirm - for testing, auto-confirm
      crisisConfirmed = true;
    }
    if (output.ui.enterPostCrisis) {
      isPostCrisis = true;
    }
  }
  
  const duration = performance.now() - startTime;
  
  return {
    transcript,
    passed: allViolations.length === 0,
    turnResults,
    allViolations,
    confusionSummary: {
      falseNegatives,
      falsePositives,
    },
    duration,
  };
}

// ============================================================================
// BATCH RUNNER
// ============================================================================

export interface BatchResult {
  totalTranscripts: number;
  passed: number;
  failed: number;
  totalFalseNegatives: number;
  totalFalsePositives: number;
  results: TranscriptResult[];
  deploymentBlocked: boolean;
  blockingReasons: string[];
}

export function runBatch(transcripts: GoldenTranscript[]): BatchResult {
  const results = transcripts.map(runTranscript);
  
  const totalFalseNegatives = results.reduce((sum, r) => sum + r.confusionSummary.falseNegatives, 0);
  const totalFalsePositives = results.reduce((sum, r) => sum + r.confusionSummary.falsePositives, 0);
  
  const blockingReasons: string[] = [];
  
  // FALSE NEGATIVES BLOCK DEPLOYMENT
  if (totalFalseNegatives > 0) {
    blockingReasons.push(`${totalFalseNegatives} false negatives detected (missed crises)`);
  }
  
  // Check for P0 failures
  for (const result of results) {
    if (!result.passed && result.transcript.tags.includes('P0')) {
      blockingReasons.push(`P0 test "${result.transcript.name}" failed`);
    }
  }
  
  return {
    totalTranscripts: transcripts.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    totalFalseNegatives,
    totalFalsePositives,
    results,
    deploymentBlocked: blockingReasons.length > 0,
    blockingReasons,
  };
}

// ============================================================================
// INVARIANT CHECKER
// ============================================================================

export interface InvariantResult {
  passed: boolean;
  violations: string[];
}

export function checkSafetyInvariants(output: PipelineOutput): InvariantResult {
  const violations: string[] = [];
  
  // INVARIANT 1: If tier is CRITICAL/HIGH, response MUST show hotline CTA
  if ((output.tier === 'CRITICAL' || output.tier === 'HIGH') && !output.ui.showHotlineCTA) {
    violations.push('CRITICAL/HIGH tier must show hotline CTA');
  }
  
  // INVARIANT 2: If tier is CRITICAL/HIGH, max 1 question (low-cognition mode)
  if ((output.tier === 'CRITICAL' || output.tier === 'HIGH') && output.requestedInfo.questionCount > 1) {
    violations.push('CRITICAL/HIGH tier must ask at most 1 question');
  }
  
  // INVARIANT 3: Response MUST NOT contain authority claims
  if (output.responseTemplate) {
    const authorityPatterns = [
      /i called 911/i,
      /i've contacted/i,
      /i alerted/i,
      /authorities have been/i,
    ];
    for (const pattern of authorityPatterns) {
      if (pattern.test(output.responseTemplate)) {
        violations.push('Response contains prohibited authority claim');
      }
    }
  }
  
  // INVARIANT 4: Response MUST NOT contain prohibited phrases
  if (output.responseTemplate) {
    const prohibitedPatterns = [
      /time heals/i,
      /rainbow bridge/i,
      /everything happens for a reason/i,
      /at least/i,
      /others have it worse/i,
    ];
    for (const pattern of prohibitedPatterns) {
      if (pattern.test(output.responseTemplate)) {
        violations.push(`Response contains prohibited phrase matching ${pattern}`);
      }
    }
  }
  
  // INVARIANT 5: Mode cannot change illegally
  if (!output.modeTransitionLegal && output.mode !== output.previousMode) {
    violations.push(`Illegal mode transition from ${output.previousMode} to ${output.mode}`);
  }
  
  return {
    passed: violations.length === 0,
    violations,
  };
}

export function checkMemoryInvariants(
  output: PipelineOutput,
  previousFacts: SimpleFacts
): InvariantResult {
  const violations: string[] = [];
  
  // INVARIANT: If a fact exists in SessionFacts, assistant MUST NOT ask for it again
  for (const factKey of Object.keys(previousFacts) as Array<keyof SimpleFacts>) {
    const value = previousFacts[factKey];
    if (value !== undefined && value !== null && value !== '') {
      if (output.requestedInfo.requestedFacts.includes(factKey)) {
        violations.push(`Re-asked for known fact: ${factKey}`);
      }
    }
  }
  
  return {
    passed: violations.length === 0,
    violations,
  };
}
