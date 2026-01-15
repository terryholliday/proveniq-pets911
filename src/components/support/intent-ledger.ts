/**
 * Intent Ledger - Anti-Repetition System
 * Tracks what questions have been asked to prevent re-asking
 */

import type {
  QuestionIntent,
  SimpleFacts,
  IntentLedger,
  AskedQuestion,
} from './types';

// ============================================================================
// FACTORY
// ============================================================================

export function createIntentLedger(): IntentLedger {
  return {
    asked: [],
    doNotAskFacts: [],
    doNotAskIntents: [],
  };
}

// ============================================================================
// RECORD QUESTIONS
// ============================================================================

export function recordAskedQuestion(
  ledger: IntentLedger,
  intent: QuestionIntent,
  turn: number,
  targetsFacts: Array<keyof SimpleFacts>,
  whyNeeded?: string
): IntentLedger {
  return {
    ...ledger,
    asked: [
      ...ledger.asked,
      { intent, turn, targetsFacts, whyNeeded, wasAnswered: false }
    ],
  };
}

export function markQuestionAnswered(
  ledger: IntentLedger,
  intent: QuestionIntent
): IntentLedger {
  return {
    ...ledger,
    asked: ledger.asked.map(q => 
      q.intent === intent ? { ...q, wasAnswered: true } : q
    ),
    doNotAskIntents: [...ledger.doNotAskIntents, intent],
  };
}

export function addFactToDoNotAsk(
  ledger: IntentLedger,
  fact: keyof SimpleFacts
): IntentLedger {
  if (ledger.doNotAskFacts.includes(fact)) {
    return ledger;
  }
  return {
    ...ledger,
    doNotAskFacts: [...ledger.doNotAskFacts, fact],
  };
}

// ============================================================================
// INTENT TO FACTS MAPPING
// ============================================================================

export const INTENT_TO_FACTS: Record<QuestionIntent, Array<keyof SimpleFacts>> = {
  'ASK_PET_NAME': ['petName'],
  'ASK_PET_SPECIES': ['petSpecies'],
  'ASK_PET_BREED': ['petBreed'],
  'ASK_PET_COLOR': ['petColor'],
  'ASK_LAST_SEEN_LOCATION': ['lastSeenLocation'],
  'ASK_LAST_SEEN_TIME': ['lastSeenTime'],
  'ASK_SAFE_NOW': ['userConfirmedSafe'],
  'ASK_NEED_HELP': [],
  'ASK_WITH_SOMEONE': [],
  'ASK_SYMPTOM': ['symptom'],
  'ASK_DURATION': ['duration'],
  'CONFIRM_UNDERSTANDING': [],
};

// ============================================================================
// CAN ASK QUESTION
// ============================================================================

export interface CanAskResult {
  allowed: boolean;
  reason?: string;
}

export function canAskQuestion(
  ledger: IntentLedger,
  intent: QuestionIntent,
  facts: SimpleFacts,
  currentTurn: number,
  windowSize: number = 5
): CanAskResult {
  // Check if intent is in do-not-ask list
  if (ledger.doNotAskIntents.includes(intent)) {
    return { allowed: false, reason: 'Intent already in do-not-ask list' };
  }
  
  // Check if recently asked (within window)
  const recentAsk = ledger.asked.find(
    q => q.intent === intent && (currentTurn - q.turn) < windowSize
  );
  
  if (recentAsk) {
    return { 
      allowed: false, 
      reason: `Already asked ${intent} on turn ${recentAsk.turn}` 
    };
  }
  
  // Check if targeting facts we already know
  const targetFacts = INTENT_TO_FACTS[intent] || [];
  for (const factKey of targetFacts) {
    const factValue = facts[factKey];
    if (factValue !== undefined && factValue !== null && factValue !== '') {
      return { 
        allowed: false, 
        reason: `Already know ${factKey}: ${String(factValue)}` 
      };
    }
  }
  
  return { allowed: true };
}

// ============================================================================
// UPDATE LEDGER FROM FACTS
// ============================================================================

/**
 * When new facts are extracted, update the ledger to mark relevant questions as answered
 * and add facts to do-not-ask list
 */
export function updateLedgerFromFacts(
  ledger: IntentLedger,
  newFacts: Partial<SimpleFacts>
): IntentLedger {
  let updated = { ...ledger };
  
  // For each new fact, find and mark corresponding intents as answered
  for (const [key, value] of Object.entries(newFacts)) {
    if (value === undefined || value === null || value === '') continue;
    
    const factKey = key as keyof SimpleFacts;
    
    // Add to do-not-ask facts
    if (!updated.doNotAskFacts.includes(factKey)) {
      updated.doNotAskFacts = [...updated.doNotAskFacts, factKey];
    }
    
    // Find intents that target this fact and mark them answered
    for (const [intent, targetFacts] of Object.entries(INTENT_TO_FACTS)) {
      if (targetFacts.includes(factKey)) {
        const questionIntent = intent as QuestionIntent;
        if (!updated.doNotAskIntents.includes(questionIntent)) {
          updated.doNotAskIntents = [...updated.doNotAskIntents, questionIntent];
        }
        // Mark any pending questions as answered
        updated.asked = updated.asked.map(q =>
          q.intent === questionIntent && !q.wasAnswered
            ? { ...q, wasAnswered: true }
            : q
        );
      }
    }
  }
  
  return updated;
}

// ============================================================================
// GET UNANSWERED QUESTIONS
// ============================================================================

export function getUnansweredQuestions(ledger: IntentLedger): AskedQuestion[] {
  return ledger.asked.filter(q => !q.wasAnswered);
}

// ============================================================================
// BUILD ANTI-REPETITION CONTEXT
// ============================================================================

export function buildAntiRepetitionContext(
  facts: SimpleFacts,
  ledger: IntentLedger
): { doNotAskFacts: Array<keyof SimpleFacts>; doNotAskIntents: QuestionIntent[] } {
  // Facts we already know
  const doNotAskFacts = Object.entries(facts)
    .filter(([_, v]) => v != null && v !== undefined && v !== '')
    .map(([k]) => k as keyof SimpleFacts);
  
  // Combine with ledger's do-not-ask lists
  const allDoNotAskFacts = Array.from(new Set([...doNotAskFacts, ...ledger.doNotAskFacts]));
  const doNotAskIntents = [...ledger.doNotAskIntents];
  
  return {
    doNotAskFacts: allDoNotAskFacts,
    doNotAskIntents,
  };
}
