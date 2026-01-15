/**
 * Pipeline V2 - Structured Output Pipeline
 * Aligned with testing framework for testable, structured output
 * 
 * This is the heart of the system—a pure function that returns structured, testable output.
 */

import {
  type RiskTier,
  type ResponseMode,
  type GroundingType,
  type VisualAidType,
  type TakeawayCardType,
  type HotlineType,
  type Region,
  type CognitiveLoad,
  type QuestionIntent,
  type SimpleFacts,
  type VolatilityTracker,
  type CrisisAssessment,
  type UIDirectives,
  type RequestedInfo,
  type AntiRepetition,
  type PipelineOutput,
  type PipelineInput,
  type IntentLedger,
  type HandoffPacket,
  isLegalTransition,
} from './types';

import {
  createIntentLedger,
  recordAskedQuestion,
  canAskQuestion,
  updateLedgerFromFacts,
  buildAntiRepetitionContext,
  INTENT_TO_FACTS,
} from './intent-ledger';

import {
  TEMPLATES,
  HOTLINES,
  PROHIBITED_RESPONSES,
} from './companion-config';

import { resolveHotlines, detectRegion } from './hotline-resolver';
import { runAllGuards } from './guards';

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createVolatilityTrackerV2(): VolatilityTracker {
  return {
    history: [],
    trend: 'STABLE',
    lastTier: 'STANDARD',
    suddenCalm: false,
    turnsSinceCrisis: 0,
  };
}

export function createSimpleFacts(): SimpleFacts {
  return {};
}

// ============================================================================
// VOLATILITY TRACKING
// ============================================================================

export function updateVolatility(
  tracker: VolatilityTracker, 
  newScore: number, 
  newTier: RiskTier
): VolatilityTracker {
  const updated = { ...tracker };
  
  // Add to history (keep last 10)
  updated.history = [...tracker.history.slice(-9), newScore];
  
  // Detect trend
  if (updated.history.length >= 3) {
    const recent = updated.history.slice(-3);
    const isEscalating = recent[2] > recent[1] && recent[1] > recent[0];
    const isDeEscalating = recent[2] < recent[1] && recent[1] < recent[0];
    
    if (isEscalating) {
      updated.trend = 'ESCALATING';
    } else if (isDeEscalating) {
      updated.trend = 'DE_ESCALATING';
    } else {
      updated.trend = 'STABLE';
    }
  }
  
  // Detect sudden calm (CRITICAL/HIGH -> STANDARD in one turn)
  const wasCrisis = tracker.lastTier === 'CRITICAL' || tracker.lastTier === 'HIGH';
  const isNowCalm = newTier === 'STANDARD';
  updated.suddenCalm = wasCrisis && isNowCalm;
  
  // Track turns since crisis
  if (newTier === 'CRITICAL' || newTier === 'HIGH') {
    updated.turnsSinceCrisis = 0;
  } else {
    updated.turnsSinceCrisis = tracker.turnsSinceCrisis + 1;
  }
  
  updated.lastTier = newTier;
  
  return updated;
}

// ============================================================================
// FACTS EXTRACTION (Simplified)
// ============================================================================

export function extractFactsFromMessage(text: string): Partial<SimpleFacts> {
  const facts: Partial<SimpleFacts> = {};
  const lower = text.toLowerCase();
  
  // Pet species detection
  if (lower.includes('dog') || lower.includes('puppy')) {
    facts.petSpecies = 'dog';
  } else if (lower.includes('cat') || lower.includes('kitten')) {
    facts.petSpecies = 'cat';
  } else if (lower.includes('bird') || lower.includes('parrot') || lower.includes('parakeet')) {
    facts.petSpecies = 'bird';
  }
  
  // Pet name extraction
  const namePatterns = [
    /my (?:dog|cat|pet|bird) (?:named |called )?(\w+)/i,
    /(\w+),? (?:is )?my (?:dog|cat|pet|bird)/i,
    /(?:named|called) (\w+)/i,
    /his name (?:is|was) (\w+)/i,
    /her name (?:is|was) (\w+)/i,
    /name (?:is|was) (\w+)/i,
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1];
      const excludeWords = ['is', 'was', 'has', 'the', 'a', 'an', 'my', 'our', 'their'];
      if (!excludeWords.includes(name.toLowerCase())) {
        facts.petName = name;
        break;
      }
    }
  }
  
  // Breed extraction
  const breeds = [
    'husky', 'labrador', 'golden retriever', 'german shepherd', 'bulldog',
    'beagle', 'poodle', 'rottweiler', 'boxer', 'dachshund', 'shih tzu',
    'chihuahua', 'yorkie', 'corgi', 'pitbull', 'border collie',
    'siamese', 'persian', 'maine coon', 'ragdoll', 'bengal', 'sphynx'
  ];
  
  for (const breed of breeds) {
    if (lower.includes(breed)) {
      facts.petBreed = breed;
      break;
    }
  }
  
  // Color extraction
  const colors = ['black', 'white', 'brown', 'golden', 'gray', 'grey', 'orange', 'tan', 'spotted', 'striped'];
  for (const color of colors) {
    if (lower.includes(color)) {
      facts.petColor = color;
      break;
    }
  }
  
  // Loss type detection
  if (lower.includes('lost') || lower.includes('missing') || lower.includes('got out') || lower.includes('ran away') || lower.includes('escaped')) {
    facts.lossType = 'lost';
  } else if (lower.includes('died') || lower.includes('passed away') || lower.includes('put down') || lower.includes('euthan')) {
    facts.lossType = 'death';
  } else if (lower.includes('terminal') || lower.includes('cancer') || lower.includes('going to die')) {
    facts.lossType = 'anticipatory';
  } else if (lower.includes('stolen') || lower.includes('took my')) {
    facts.lossType = 'stolen';
  }
  
  // Location extraction
  const locationMatch = text.match(/(?:near|at|around|from) (?:the )?([A-Z][a-z]+(?: [A-Z][a-z]+)*(?:\s+(?:park|street|avenue|road|area|neighborhood))?)/);
  if (locationMatch) {
    facts.lastSeenLocation = locationMatch[1];
  }
  
  // Safety confirmation
  if (lower.includes("i'm safe") || lower.includes('i am safe') || lower.includes("i'm okay") || lower.includes('i am okay')) {
    facts.userConfirmedSafe = true;
  }
  
  // Symptom extraction
  const symptoms = ['vomiting', 'not eating', 'lethargic', 'limping', 'bleeding', 'shaking', 'seizure', 'collapsed', 'not breathing', 'diarrhea'];
  for (const symptom of symptoms) {
    if (lower.includes(symptom)) {
      facts.symptom = symptom;
      break;
    }
  }
  
  return facts;
}

export function mergeFacts(existing: SimpleFacts, newFacts: Partial<SimpleFacts>): SimpleFacts {
  const merged = { ...existing };
  
  for (const [key, value] of Object.entries(newFacts)) {
    if (value !== undefined && value !== null && value !== '') {
      (merged as any)[key] = value;
    }
  }
  
  return merged;
}

// ============================================================================
// MODE DETERMINATION
// ============================================================================

function determineMode(
  assessment: CrisisAssessment,
  text: string,
  facts: SimpleFacts,
  currentMode: ResponseMode,
  isPostCrisis: boolean
): ResponseMode {
  const lower = text.toLowerCase();
  
  // Scam detection takes priority - scams are not safety crises
  if (assessment.primaryCrisis === 'scam' || assessment.markers.some(m => m.includes('SCAM'))) {
    return 'scam';
  }
  
  // Pet emergency takes priority over generic safety mode
  if (assessment.primaryCrisis === 'emergency') {
    return 'pet_emergency';
  }
  
  // Safety mode for human crisis (CRITICAL/HIGH with non-pet crisis)
  if (assessment.tier === 'CRITICAL' || assessment.tier === 'HIGH') {
    if (assessment.bystander) {
      return 'bystander';
    }
    return 'safety';
  }
  
  // Post-crisis mode persists until explicitly exited
  if (isPostCrisis && facts.userConfirmedSafe) {
    return 'post_crisis';
  }
  
  // Waiting room mode
  if (assessment.waitingRoom) {
    return 'waiting_room';
  }
  
  // Scam detection
  if (assessment.markers.some(m => m.toLowerCase().includes('scam'))) {
    return 'scam';
  }
  
  // Pet emergency
  if (assessment.primaryCrisis === 'emergency') {
    return 'pet_emergency';
  }
  
  // Lost pet
  if (lower.includes('lost') || lower.includes('missing') || facts.lossType === 'lost') {
    return 'lost_pet';
  }
  
  // Grief
  if (
    lower.includes('died') || 
    lower.includes('passed away') || 
    lower.includes('put down') ||
    facts.lossType === 'death' ||
    facts.lossType === 'anticipatory'
  ) {
    return 'grief';
  }
  
  return 'normal';
}

// ============================================================================
// UI DIRECTIVES
// ============================================================================

function getHotlineForCrisis(
  assessment: CrisisAssessment, 
  mode: ResponseMode, 
  region: Region
): { number: string | null; type: HotlineType } {
  // Scam mode does not show hotline CTA
  if (mode === 'scam') {
    return { number: null, type: null };
  }
  
  const isCriticalOrHigh = assessment.tier === 'CRITICAL' || assessment.tier === 'HIGH';
  
  if (!isCriticalOrHigh && mode !== 'pet_emergency') {
    return { number: null, type: null };
  }
  
  const hotlines = (HOTLINES as any)?.[region] || (HOTLINES as any)?.US || {};
  
  if (assessment.markers.some(m => m.toLowerCase().includes('dv') || m.toLowerCase().includes('abuse'))) {
    return { number: hotlines.domestic_violence || '1-800-799-7233', type: 'dv' };
  }
  
  if (assessment.markers.some(m => m.toLowerCase().includes('child'))) {
    return { number: hotlines.child_abuse || '1-800-422-4453', type: 'child' };
  }
  
  if (mode === 'pet_emergency') {
    return { number: hotlines.pet_poison || '888-426-4435', type: 'pet_poison' };
  }
  
  return { number: hotlines.crisis_988 || '988', type: 'crisis_988' };
}

function determineVisualAid(assessment: CrisisAssessment, mode: ResponseMode): VisualAidType {
  if (mode !== 'pet_emergency') return null;
  
  const markers = assessment.markers.join(' ').toLowerCase();
  if (markers.includes('choking')) return 'heimlich';
  if (markers.includes('not breathing') || markers.includes('cpr')) return 'cpr';
  if (markers.includes('gum') || markers.includes('shock')) return 'gum_color';
  
  return null;
}

function determineTakeawayCard(mode: ResponseMode, facts: SimpleFacts): TakeawayCardType {
  if (mode === 'pet_emergency' && facts.petName) return 'vet_er';
  if (mode === 'lost_pet' && facts.petName) return 'lost_pet_flyer';
  if (mode === 'safety' || mode === 'post_crisis') return 'safety_plan';
  return null;
}

function generateParaphrase(assessment: CrisisAssessment): string {
  const primary = assessment.primaryCrisis;
  
  if (primary === 'suicide') {
    return "It sounds like you might be thinking about ending your life. Did I understand that correctly?";
  }
  if (primary === 'self_harm') {
    return "It sounds like you might be thinking about hurting yourself. Did I understand that correctly?";
  }
  if (primary === 'abuse' || primary === 'dv') {
    return "It sounds like you might be in danger from someone. Did I understand that correctly?";
  }
  
  return "It sounds like you might be in crisis. Did I understand that correctly?";
}

function buildUIDirectives(
  assessment: CrisisAssessment,
  mode: ResponseMode,
  region: Region,
  crisisConfirmed: boolean,
  facts: SimpleFacts
): UIDirectives {
  const isCriticalOrHigh = assessment.tier === 'CRITICAL' || assessment.tier === 'HIGH';
  
  const hotlineInfo = getHotlineForCrisis(assessment, mode, region);
  
  let showGroundingTool: GroundingType = null;
  if (assessment.requiresGrounding && assessment.tier !== 'CRITICAL') {
    showGroundingTool = 'box_breathing';
  }
  
  const requiresConfirmation = 
    assessment.tier === 'CRITICAL' && 
    !crisisConfirmed &&
    !facts.userConfirmedSafe;
  
  let confirmationParaphrase: string | null = null;
  if (requiresConfirmation) {
    confirmationParaphrase = generateParaphrase(assessment);
  }
  
  return {
    showLowCognition: isCriticalOrHigh,
    showHotlineCTA: hotlineInfo.number !== null,
    hotlineNumber: hotlineInfo.number,
    hotlineType: hotlineInfo.type,
    showGroundingTool,
    showScamWarning: mode === 'scam',
    showWaitingRoom: mode === 'waiting_room',
    showVisualAid: determineVisualAid(assessment, mode),
    showTakeawayCard: determineTakeawayCard(mode, facts),
    requiresConfirmation,
    confirmationParaphrase,
    enterPostCrisis: facts.userConfirmedSafe === true && assessment.tier === 'STANDARD',
    triggerSafetyExit: false,
  };
}

// ============================================================================
// REQUESTED INFO (Anti-Repetition)
// ============================================================================

function determineRequestedInfo(
  mode: ResponseMode,
  facts: SimpleFacts,
  assessment: CrisisAssessment,
  ledger: IntentLedger,
  currentTurn: number
): RequestedInfo {
  const requestedFacts: Array<keyof SimpleFacts> = [];
  const questionIntents: QuestionIntent[] = [];
  const questionPlan: RequestedInfo['questionPlan'] = [];
  
  // In CRITICAL/HIGH, we don't ask questions - we provide resources
  if (assessment.tier === 'CRITICAL' || assessment.tier === 'HIGH') {
    // At most one safety check question
    const safetyCheck = canAskQuestion(ledger, 'ASK_SAFE_NOW', facts, currentTurn);
    if (safetyCheck.allowed && !facts.userConfirmedSafe) {
      questionIntents.push('ASK_SAFE_NOW');
      questionPlan.push({
        intent: 'ASK_SAFE_NOW',
        targetsFacts: ['userConfirmedSafe'],
        priority: 1,
        whyNeeded: 'Safety check required for CRITICAL tier',
      });
    }
    
    return { 
      requestedFacts: [], 
      questionCount: Math.min(questionIntents.length, 1),
      questionIntents: questionIntents.slice(0, 1),
      questionPlan: questionPlan.slice(0, 1),
    };
  }
  
  // For lost pet, we need certain info
  if (mode === 'lost_pet') {
    if (!facts.petSpecies) {
      const check = canAskQuestion(ledger, 'ASK_PET_SPECIES', facts, currentTurn);
      if (check.allowed) {
        requestedFacts.push('petSpecies');
        questionIntents.push('ASK_PET_SPECIES');
        questionPlan.push({
          intent: 'ASK_PET_SPECIES',
          targetsFacts: ['petSpecies'],
          priority: 1,
          whyNeeded: 'Need species for breed-specific search advice',
        });
      }
    }
    
    if (!facts.petName) {
      const check = canAskQuestion(ledger, 'ASK_PET_NAME', facts, currentTurn);
      if (check.allowed) {
        requestedFacts.push('petName');
        questionIntents.push('ASK_PET_NAME');
        questionPlan.push({
          intent: 'ASK_PET_NAME',
          targetsFacts: ['petName'],
          priority: 2,
          whyNeeded: 'Name needed for flyers and calling',
        });
      }
    }
    
    if (!facts.lastSeenLocation && facts.petSpecies) {
      const check = canAskQuestion(ledger, 'ASK_LAST_SEEN_LOCATION', facts, currentTurn);
      if (check.allowed) {
        requestedFacts.push('lastSeenLocation');
        questionIntents.push('ASK_LAST_SEEN_LOCATION');
        questionPlan.push({
          intent: 'ASK_LAST_SEEN_LOCATION',
          targetsFacts: ['lastSeenLocation'],
          priority: 3,
          whyNeeded: 'Location needed for search radius',
        });
      }
    }
    
    if (!facts.petColor && facts.petName) {
      const check = canAskQuestion(ledger, 'ASK_PET_COLOR', facts, currentTurn);
      if (check.allowed) {
        requestedFacts.push('petColor');
        questionIntents.push('ASK_PET_COLOR');
        questionPlan.push({
          intent: 'ASK_PET_COLOR',
          targetsFacts: ['petColor'],
          priority: 4,
          whyNeeded: 'Color needed for identification',
        });
      }
    }
  }
  
  // For pet emergency, we need symptoms
  if (mode === 'pet_emergency') {
    if (!facts.symptom) {
      const check = canAskQuestion(ledger, 'ASK_SYMPTOM', facts, currentTurn);
      if (check.allowed) {
        requestedFacts.push('symptom');
        questionIntents.push('ASK_SYMPTOM');
        questionPlan.push({
          intent: 'ASK_SYMPTOM',
          targetsFacts: ['symptom'],
          priority: 1,
          whyNeeded: 'Need to understand the emergency',
        });
      }
    }
  }
  
  // Cap questions based on cognitive load
  const maxQuestions = assessment.cognitiveLoad === 'IMPAIRED' ? 1 : 2;
  
  return {
    requestedFacts: requestedFacts.slice(0, maxQuestions),
    questionCount: Math.min(questionIntents.length, maxQuestions),
    questionIntents: questionIntents.slice(0, maxQuestions),
    questionPlan: questionPlan.slice(0, maxQuestions),
  };
}

// ============================================================================
// RESPONSE BUILDING
// ============================================================================

function buildResponse(
  assessment: CrisisAssessment,
  mode: ResponseMode,
  facts: SimpleFacts,
  history: Array<{ role: string; content: string }>,
  region: Region,
  ui: UIDirectives,
  requestedInfo: RequestedInfo,
  antiRepetition: AntiRepetition
): { responseTemplate: string | null; requiresModelCall: boolean; promptForModel: string | null } {
  
  // CRITICAL/HIGH: Use templates, no model call
  if (assessment.tier === 'CRITICAL' || assessment.tier === 'HIGH') {
    const templates = TEMPLATES as any;
    const templateKey = assessment.primaryCrisis === 'suicide' ? 'suicide_active' : 
                        assessment.primaryCrisis === 'self_harm' ? 'suicide_passive' :
                        assessment.primaryCrisis === 'abuse' ? 'abuse' :
                        'suicide_active';
    const template = templates[templateKey];
    let response = template?.response || 
      "I hear you. If you're in immediate danger, please call 988 now. Are you safe right now?";
    
    if (ui.hotlineNumber) {
      response = response.replace(/\{HOTLINE\}/g, ui.hotlineNumber);
      response = response.replace(/988/g, ui.hotlineNumber);
    }
    
    return {
      responseTemplate: response,
      requiresModelCall: false,
      promptForModel: null,
    };
  }
  
  // Waiting room: Use template
  if (mode === 'waiting_room') {
    return {
      responseTemplate: "Help is on the way. I'm here with you. Take slow breaths if you can.",
      requiresModelCall: false,
      promptForModel: null,
    };
  }
  
  // Scam: Use template
  if (mode === 'scam') {
    return {
      responseTemplate: "⚠️ This has warning signs of a common pet scam. Never send money via wire transfer, Western Union, or gift cards before meeting a pet in person. Legitimate breeders and rescues will never ask for payment this way.",
      requiresModelCall: false,
      promptForModel: null,
    };
  }
  
  // Otherwise, we need a model call with proper context
  const promptForModel = buildModelPrompt(facts, history, requestedInfo, antiRepetition, mode);
  
  return {
    responseTemplate: null,
    requiresModelCall: true,
    promptForModel,
  };
}

function buildModelPrompt(
  facts: SimpleFacts,
  history: Array<{ role: string; content: string }>,
  requestedInfo: RequestedInfo,
  antiRepetition: AntiRepetition,
  mode: ResponseMode
): string {
  const lines: string[] = [];
  
  // Facts block
  const knownFacts = Object.entries(facts)
    .filter(([_, v]) => v != null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ');
  
  lines.push(`KNOWN FACTS: ${knownFacts || 'None'}`);
  lines.push('');
  
  // Anti-repetition rules
  if (antiRepetition.doNotAskFacts.length > 0) {
    lines.push(`RULE: Do NOT ask about these facts (already known): ${antiRepetition.doNotAskFacts.join(', ')}`);
  }
  if (antiRepetition.doNotAskIntents.length > 0) {
    lines.push(`RULE: Do NOT ask these questions again: ${antiRepetition.doNotAskIntents.join(', ')}`);
  }
  
  // Question limits
  lines.push(`RULE: Ask at most ${requestedInfo.questionCount} question(s) this turn`);
  lines.push(`RULE: Keep response under 200 characters`);
  lines.push('');
  
  // Banned content
  lines.push('BANNED CONTENT:');
  lines.push('- Do NOT claim professional credentials (therapist, counselor, doctor)');
  lines.push('- Do NOT say "I called 911" or claim to contact authorities');
  lines.push('- Do NOT use platitudes like "time heals" or "everything happens for a reason"');
  lines.push('- Do NOT minimize: "others have it worse", "at least..."');
  lines.push('');
  
  // Mode context
  lines.push(`MODE: ${mode}`);
  lines.push('');
  
  // History window (last 10 messages)
  const historyWindow = history
    .slice(-10)
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');
  
  if (historyWindow) {
    lines.push('CONVERSATION HISTORY:');
    lines.push(historyWindow);
    lines.push('');
  }
  
  // Final instruction
  lines.push('Respond with empathy. If you need information, ask ONE question at a time. Use the pet\'s name if known.');
  
  return lines.join('\n');
}

// ============================================================================
// MAIN PIPELINE FUNCTION (Structured Output)
// ============================================================================

export function processPipelineV2(input: PipelineInput): PipelineOutput {
  const {
    userMessage,
    messageHistory,
    currentFacts,
    currentMode,
    volatilityTracker,
    intentLedger,
    crisisConfirmed,
    isPostCrisis,
    userTimezone,
    region: inputRegion,
    now = Date.now,
  } = input;
  
  // 1. Run crisis assessment (import from crisis-engine or create minimal version)
  const assessment = assessCrisisMinimal(userMessage);
  
  // 2. Update volatility tracker
  const updatedVolatility = updateVolatility(
    volatilityTracker, 
    assessment.score, 
    assessment.tier
  );
  
  // 3. Extract new facts
  const newFacts = extractFactsFromMessage(userMessage);
  const mergedFacts = mergeFacts(currentFacts, newFacts);
  
  // 4. Detect region (normalize to supported Region type)
  const detectedRegion = inputRegion || detectRegion([...messageHistory, { role: 'user' as const, content: userMessage }]);
  const region: Region = (detectedRegion === 'US' || detectedRegion === 'UK' || detectedRegion === 'CA' || detectedRegion === 'AU') 
    ? detectedRegion 
    : 'US';
  
  // 5. Determine mode (with legal transition check)
  const proposedMode = determineMode(assessment, userMessage, mergedFacts, currentMode, isPostCrisis);
  const modeTransitionLegal = isLegalTransition(currentMode, proposedMode);
  const mode = modeTransitionLegal ? proposedMode : currentMode;
  
  // 6. Build UI directives
  const ui = buildUIDirectives(assessment, mode, region, crisisConfirmed, mergedFacts);
  
  // 7. Update intent ledger from new facts
  let updatedLedger = updateLedgerFromFacts(intentLedger, newFacts);
  
  // 8. Build anti-repetition context
  const antiRepetition = buildAntiRepetitionContext(mergedFacts, updatedLedger);
  
  // 9. Determine what info we need to request
  const requestedInfo = determineRequestedInfo(
    mode, 
    mergedFacts, 
    assessment, 
    updatedLedger,
    messageHistory.length
  );
  
  // 10. Update intent ledger with new questions
  for (const intent of requestedInfo.questionIntents) {
    const plan = requestedInfo.questionPlan.find(p => p.intent === intent);
    updatedLedger = recordAskedQuestion(
      updatedLedger,
      intent,
      messageHistory.length,
      plan?.targetsFacts || [],
      plan?.whyNeeded
    );
  }
  
  // 11. Build response template or prompt
  const { responseTemplate, requiresModelCall, promptForModel } = buildResponse(
    assessment,
    mode,
    mergedFacts,
    messageHistory,
    region,
    ui,
    requestedInfo,
    antiRepetition
  );
  
  // 12. Apply guards to template if we have one
  let guardsTriggered: string[] = [];
  let finalTemplate = responseTemplate;
  if (responseTemplate) {
    const guardResult = runAllGuards(responseTemplate);
    finalTemplate = guardResult.clean;
    guardsTriggered = guardResult.violations || [];
  }
  
  return {
    tier: assessment.tier,
    score: assessment.score,
    markers: assessment.markers,
    primaryCrisis: assessment.primaryCrisis,
    prioritizedMarkers: assessment.prioritizedMarkers,
    cognitiveLoad: assessment.cognitiveLoad,
    
    mode,
    previousMode: currentMode,
    modeTransitionLegal,
    
    isBystander: assessment.bystander !== null,
    bystanderIsRemote: assessment.bystander?.isRemote ?? false,
    bystanderIsMinor: assessment.bystander?.isMinor ?? false,
    
    ui,
    requestedInfo,
    antiRepetition,
    
    facts: mergedFacts,
    factsExtractedThisTurn: newFacts,
    intentLedger: updatedLedger,
    
    region,
    
    responseTemplate: finalTemplate,
    requiresModelCall,
    promptForModel,
    
    requiresHumanHandoff: assessment.requiresHumanHandoff,
    volatility: updatedVolatility.trend,
    volatilityTracker: updatedVolatility,
    
    guardsTriggered,
    
    disambiguationApplied: assessment.disambiguation,
  };
}

// ============================================================================
// MINIMAL CRISIS ASSESSMENT (for V2 pipeline)
// ============================================================================

function assessCrisisMinimal(text: string): CrisisAssessment {
  const lower = text.toLowerCase();
  const markers: string[] = [];
  let score = 0;
  let primaryCrisis: string | null = null;
  let tier: RiskTier = 'STANDARD';
  
  // Critical markers - includes third-party reports (bystander)
  const criticalPatterns = [
    { pattern: /kill myself|end my life|suicide|want to die/i, marker: 'SUICIDE_ACTIVE', points: 100, crisis: 'suicide' },
    { pattern: /kill (them|him|her)self|end (their|his|her) life|they want to die|wants? to die/i, marker: 'SUICIDE_BYSTANDER', points: 100, crisis: 'suicide' },
    { pattern: /don'?t want to live|end it all|end it$/i, marker: 'SUICIDE_INTENT', points: 90, crisis: 'suicide' },
    { pattern: /hurt myself|self.?harm|cutting myself/i, marker: 'SELF_HARM', points: 80, crisis: 'self_harm' },
    { pattern: /hurt (them|him|her)self|they('re| are) (cutting|harming)/i, marker: 'SELF_HARM_BYSTANDER', points: 80, crisis: 'self_harm' },
    { pattern: /abusing|hitting me|domestic violence/i, marker: 'ABUSE', points: 90, crisis: 'abuse' },
    { pattern: /i'?m not safe|not safe right now|in danger/i, marker: 'UNSAFE', points: 90, crisis: 'crisis' },
  ];
  
  // High markers
  const highPatterns = [
    { pattern: /don'?t want to be here|can'?t go on|give up/i, marker: 'PASSIVE_SUICIDAL', points: 60, crisis: 'suicide' },
    { pattern: /no point|hopeless|worthless/i, marker: 'HOPELESSNESS', points: 40, crisis: 'crisis' },
    { pattern: /only reason to (keep going|live|stay)|nothing (left )?to live for|can'?t live without/i, marker: 'PASSIVE_SUICIDAL', points: 60, crisis: 'suicide' },
    { pattern: /they sound (really )?bad|worried about (them|him|her)|scared for/i, marker: 'BYSTANDER_CONCERN', points: 50, crisis: 'crisis' },
  ];
  
  // Emergency markers - pet emergencies
  const emergencyPatterns = [
    { pattern: /not breathing|choking|seizure|collapsed|unconscious/i, marker: 'PET_EMERGENCY', points: 70, crisis: 'emergency' },
    { pattern: /bleeding|poison|toxic|ate something/i, marker: 'PET_MEDICAL', points: 50, crisis: 'emergency' },
    { pattern: /can'?t breathe/i, marker: 'BREATHING_EMERGENCY', points: 70, crisis: 'emergency' },
  ];
  
  // Lost pet markers
  const lostPetPatterns = [
    { pattern: /lost my|missing|ran away|escaped|can'?t find/i, marker: 'LOST_PET', points: 20, crisis: 'lost_pet' },
  ];
  
  // Grief markers
  const griefPatterns = [
    { pattern: /died|passed away|put down|euthan|losing|going to lose/i, marker: 'GRIEF', points: 30, crisis: 'death' },
  ];
  
  // Scam markers
  const scamPatterns = [
    { pattern: /wire transfer|western union|moneygram|gift card|upfront payment/i, marker: 'SCAM', points: 40, crisis: 'scam' },
    { pattern: /send money|pay (up ?front|before)/i, marker: 'SCAM_PAYMENT', points: 35, crisis: 'scam' },
  ];
  
  // Check all patterns
  for (const { pattern, marker, points, crisis } of criticalPatterns) {
    if (pattern.test(text)) {
      markers.push(marker);
      score += points;
      if (!primaryCrisis) primaryCrisis = crisis;
    }
  }
  
  for (const { pattern, marker, points, crisis } of highPatterns) {
    if (pattern.test(text)) {
      markers.push(marker);
      score += points;
      if (!primaryCrisis) primaryCrisis = crisis;
    }
  }
  
  for (const { pattern, marker, points, crisis } of emergencyPatterns) {
    if (pattern.test(text)) {
      markers.push(marker);
      score += points;
      if (!primaryCrisis) primaryCrisis = crisis;
    }
  }
  
  for (const { pattern, marker, points, crisis } of lostPetPatterns) {
    if (pattern.test(text)) {
      markers.push(marker);
      score += points;
      if (!primaryCrisis) primaryCrisis = crisis;
    }
  }
  
  for (const { pattern, marker, points, crisis } of griefPatterns) {
    if (pattern.test(text)) {
      markers.push(marker);
      score += points;
      if (!primaryCrisis) primaryCrisis = crisis;
    }
  }
  
  for (const { pattern, marker, points, crisis } of scamPatterns) {
    if (pattern.test(text)) {
      markers.push(marker);
      score += points;
      if (!primaryCrisis) primaryCrisis = crisis;
    }
  }
  
  // Determine tier
  if (score >= 80) tier = 'CRITICAL';
  else if (score >= 50) tier = 'HIGH';
  else if (score >= 30) tier = 'MEDIUM';
  else tier = 'STANDARD';
  
  // Bystander detection - detect when someone is reporting about another person
  let bystander = null;
  const bystanderIndicators = /my friend|my child|my partner|my sister|my brother|my mom|my dad|my parent|my spouse|my wife|my husband|someone i know|they are|they want|they('re| are)|him|her|them|she('s| is| has)|he('s| is| has)/i;
  const thirdPartyContext = /texted me|told me|said|called me|messaged|worried about|scared for|on the phone with|talking about|been saying/i;
  if (bystanderIndicators.test(text) && (thirdPartyContext.test(text) || markers.some(m => m.includes('BYSTANDER')))) {
    bystander = {
      isBystander: true,
      isRemote: /on the phone|texted|called|messaged/i.test(text),
      isMinor: /my child|kid|son|daughter|teen/i.test(text),
      relationship: null,
    };
  }
  
  // Waiting room detection
  const waitingRoom = /called 911|ambulance|on the way|help is coming/i.test(text);
  
  // Grounding needed
  const requiresGrounding = /panic|can'?t breathe|heart racing|freaking out|anxiety attack/i.test(text);
  
  return {
    tier,
    score,
    markers,
    primaryCrisis,
    prioritizedMarkers: markers,
    requiresHumanHandoff: tier === 'CRITICAL',
    requiresGrounding,
    isCompoundCrisis: markers.length > 2,
    compoundTypes: [],
    cognitiveLoad: tier === 'CRITICAL' ? 'IMPAIRED' : 'NORMAL',
    bystander,
    waitingRoom,
    language: 'en',
    disambiguation: {
      idiomDetected: false,
      negationDetected: /not|don'?t|didn'?t|never|no\s/i.test(text),
      quotedTextDetected: /"[^"]+"|'[^']+'/.test(text),
      hypotheticalDetected: /if i|what if|wondering if|thinking about/i.test(text),
      thirdPartyDetected: bystander !== null,
    },
  };
}

// ============================================================================
// HANDOFF PACKET GENERATION (Privacy-Safe)
// ============================================================================

export function generateHandoffPacketV2(
  output: PipelineOutput,
  messageCount: number,
  sessionStart: Date
): HandoffPacket {
  // Sanitize markers (remove specific means)
  const sanitizedMarkers = output.prioritizedMarkers
    .map(m => {
      if (m.includes('.means.')) {
        return m.split('.means.')[0] + '.means';
      }
      return m;
    })
    .slice(0, 8);
  
  return {
    timestamp: new Date().toISOString(),
    riskTier: output.tier,
    markersDetected: sanitizedMarkers,
    region: output.region,
    sessionDurationMinutes: Math.floor((Date.now() - sessionStart.getTime()) / 60000),
    messageCount,
    volatilityTrend: output.volatility,
    mode: output.mode,
  };
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export {
  createIntentLedger,
  determineMode,
  buildUIDirectives,
  determineRequestedInfo,
  assessCrisisMinimal,
};
