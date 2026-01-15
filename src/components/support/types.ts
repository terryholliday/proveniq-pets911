/**
 * Core Types for Support Companion
 * Aligned with testing framework for structured, testable output
 */

// ============================================================================
// RISK & MODE TYPES
// ============================================================================

export type RiskTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';

export type ResponseMode = 
  | 'safety'
  | 'lost_pet'
  | 'grief'
  | 'pet_emergency'
  | 'scam'
  | 'waiting_room'
  | 'post_crisis'
  | 'bystander'
  | 'normal';

export type GroundingType = 'box_breathing' | '5-4-3-2-1' | null;
export type VisualAidType = 'gum_color' | 'heimlich' | 'cpr' | null;
export type TakeawayCardType = 'vet_er' | 'lost_pet_flyer' | 'safety_plan' | null;
export type HotlineType = 'crisis_988' | 'pet_poison' | 'dv' | 'child' | null;

export type Region = 'US' | 'UK' | 'CA' | 'AU' | 'UNKNOWN';

export type VolatilityTrend = 'STABLE' | 'ESCALATING' | 'DE_ESCALATING';

export type CognitiveLoad = 'NORMAL' | 'IMPAIRED' | 'SEVERELY_IMPAIRED';

// ============================================================================
// QUESTION INTENT TYPES (Anti-Repetition)
// ============================================================================

export type QuestionIntent = 
  | 'ASK_PET_NAME'
  | 'ASK_PET_SPECIES'
  | 'ASK_PET_BREED'
  | 'ASK_PET_COLOR'
  | 'ASK_LAST_SEEN_LOCATION'
  | 'ASK_LAST_SEEN_TIME'
  | 'ASK_SAFE_NOW'
  | 'ASK_NEED_HELP'
  | 'ASK_WITH_SOMEONE'
  | 'ASK_SYMPTOM'
  | 'ASK_DURATION'
  | 'CONFIRM_UNDERSTANDING';

// ============================================================================
// SESSION FACTS WITH CONFIDENCE
// ============================================================================

export interface FactValue<T = string | boolean | number> {
  value: T;
  confidence: number;          // 0-1, threshold for re-asking
  sourceTurn: number;          // Which turn extracted this
  confirmedByUser: boolean;    // User explicitly confirmed
}

export interface SessionFactsWithConfidence {
  // Pet information
  petName?: FactValue<string>;
  petSpecies?: FactValue<string>;
  petBreed?: FactValue<string>;
  petAge?: FactValue<string>;
  petColor?: FactValue<string>;
  petWeight?: FactValue<string>;
  petMicrochipped?: FactValue<boolean>;
  
  // Medical context
  symptom?: FactValue<string>;
  symptoms?: FactValue<string[]>;
  duration?: FactValue<string>;
  severity?: FactValue<string>;
  
  // Loss context
  lossType?: FactValue<string>;        // 'lost' | 'death' | 'anticipatory' | 'stolen'
  lastSeenLocation?: FactValue<string>;
  lastSeenTime?: FactValue<string>;
  lastSeenDate?: FactValue<string>;
  wearingCollar?: FactValue<boolean>;
  
  // User context
  userName?: FactValue<string>;
  userLocation?: FactValue<string>;
  userTimezone?: FactValue<string>;
  userConfirmedSafe?: FactValue<boolean>;
  contactPhone?: FactValue<string>;
  
  // Crisis context
  crisisType?: FactValue<string>;
  bystanderRelation?: FactValue<string>;
}

// Simplified fact type for basic operations (backward compatible)
export interface SimpleFacts {
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petAge?: string;
  petColor?: string;
  petWeight?: string;
  petMicrochipped?: boolean;
  symptom?: string;
  symptoms?: string[];
  duration?: string;
  severity?: string;
  lossType?: string;
  lastSeenLocation?: string;
  lastSeenTime?: string;
  lastSeenDate?: string;
  wearingCollar?: boolean;
  userName?: string;
  userLocation?: string;
  userTimezone?: string;
  userConfirmedSafe?: boolean;
  contactPhone?: string;
  crisisType?: string;
  bystanderRelation?: string;
}

// ============================================================================
// VOLATILITY TRACKER
// ============================================================================

export interface VolatilityTracker {
  history: number[];           // Last N risk scores
  trend: VolatilityTrend;
  suddenCalm: boolean;         // Dangerous pattern
  lastTier: RiskTier;
  turnsSinceCrisis: number;
}

// ============================================================================
// BYSTANDER INFO
// ============================================================================

export interface BystanderInfo {
  isBystander: boolean;
  isRemote: boolean;
  isMinor: boolean;
  relationship: string | null;
}

// ============================================================================
// CRISIS ASSESSMENT
// ============================================================================

export interface CrisisAssessment {
  tier: RiskTier;
  score: number;
  markers: string[];
  primaryCrisis: string | null;
  prioritizedMarkers: string[];
  requiresHumanHandoff: boolean;
  requiresGrounding: boolean;
  isCompoundCrisis: boolean;
  compoundTypes: string[];
  cognitiveLoad: CognitiveLoad;
  bystander: BystanderInfo | null;
  waitingRoom: boolean;
  language: 'en' | 'es' | 'fr';
  disambiguation: {
    idiomDetected: boolean;
    negationDetected: boolean;
    quotedTextDetected: boolean;
    hypotheticalDetected: boolean;
    thirdPartyDetected: boolean;
  };
}

// ============================================================================
// UI DIRECTIVES (Testable Contracts)
// ============================================================================

export interface UIDirectives {
  showLowCognition: boolean;
  showHotlineCTA: boolean;
  hotlineNumber: string | null;
  hotlineType: HotlineType;
  showGroundingTool: GroundingType;
  showScamWarning: boolean;
  showWaitingRoom: boolean;
  showVisualAid: VisualAidType;
  showTakeawayCard: TakeawayCardType;
  requiresConfirmation: boolean;
  confirmationParaphrase: string | null;
  enterPostCrisis: boolean;
  triggerSafetyExit: boolean;
}

// ============================================================================
// REQUESTED INFO (Anti-Repetition)
// ============================================================================

export interface RequestedInfo {
  requestedFacts: Array<keyof SimpleFacts>;
  questionCount: number;
  questionIntents: QuestionIntent[];
  questionPlan: Array<{
    intent: QuestionIntent;
    targetsFacts: Array<keyof SimpleFacts>;
    priority: number;
    whyNeeded: string;
  }>;
}

export interface AntiRepetition {
  doNotAskFacts: Array<keyof SimpleFacts>;
  doNotAskIntents: QuestionIntent[];
}

// ============================================================================
// PIPELINE OUTPUT (Main Testable Contract)
// ============================================================================

export interface PipelineOutput {
  // Crisis assessment
  tier: RiskTier;
  score: number;
  markers: string[];
  primaryCrisis: string | null;
  prioritizedMarkers: string[];
  cognitiveLoad: CognitiveLoad;
  
  // Mode determination
  mode: ResponseMode;
  previousMode: ResponseMode | null;
  modeTransitionLegal: boolean;
  
  // Bystander info
  isBystander: boolean;
  bystanderIsRemote: boolean;
  bystanderIsMinor: boolean;
  
  // UI directives (testable contracts)
  ui: UIDirectives;
  
  // What the response is asking for (anti-repetition)
  requestedInfo: RequestedInfo;
  antiRepetition: AntiRepetition;
  
  // Facts state
  facts: SimpleFacts;
  factsExtractedThisTurn: Partial<SimpleFacts>;
  
  // Intent ledger state
  intentLedger: IntentLedger;
  
  // Region
  region: Region;
  
  // Response (may be template or require model call)
  responseTemplate: string | null;
  requiresModelCall: boolean;
  promptForModel: string | null;
  
  // Safety
  requiresHumanHandoff: boolean;
  volatility: VolatilityTrend;
  volatilityTracker: VolatilityTracker;
  
  // Guards applied
  guardsTriggered: string[];
  
  // Disambiguation flags
  disambiguationApplied: CrisisAssessment['disambiguation'];
}

// ============================================================================
// PIPELINE INPUT
// ============================================================================

export interface PipelineInput {
  userMessage: string;
  messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentFacts: SimpleFacts;
  currentMode: ResponseMode;
  volatilityTracker: VolatilityTracker;
  intentLedger: IntentLedger;
  crisisConfirmed: boolean;
  isPostCrisis: boolean;
  userTimezone?: string;
  region?: Region;
  /** Injectable for testing */
  now?: () => number;
}

// ============================================================================
// INTENT LEDGER
// ============================================================================

export interface AskedQuestion {
  intent: QuestionIntent;
  turn: number;
  targetsFacts: Array<keyof SimpleFacts>;
  whyNeeded?: string;
  wasAnswered: boolean;
}

export interface IntentLedger {
  asked: AskedQuestion[];
  doNotAskFacts: Array<keyof SimpleFacts>;
  doNotAskIntents: QuestionIntent[];
}

// ============================================================================
// HANDOFF PACKET (Privacy-Safe)
// ============================================================================

export interface HandoffPacket {
  timestamp: string;
  riskTier: RiskTier;
  markersDetected: string[];  // Sanitized (no means specifics)
  region: string;
  sessionDurationMinutes: number;
  messageCount: number;
  volatilityTrend: VolatilityTrend;
  mode: ResponseMode;
  // NO raw user text, NO means details
}

// ============================================================================
// LEGAL MODE TRANSITIONS
// ============================================================================

export const LEGAL_TRANSITIONS: Record<ResponseMode, ResponseMode[]> = {
  normal: ['safety', 'lost_pet', 'grief', 'pet_emergency', 'scam', 'bystander', 'normal'],
  lost_pet: ['safety', 'grief', 'waiting_room', 'normal', 'lost_pet'],
  grief: ['safety', 'post_crisis', 'normal', 'grief'],
  pet_emergency: ['safety', 'waiting_room', 'normal', 'pet_emergency'],
  scam: ['safety', 'normal', 'scam'],
  safety: ['post_crisis', 'waiting_room', 'safety'],
  waiting_room: ['safety', 'post_crisis', 'normal', 'waiting_room'],
  post_crisis: ['safety', 'normal', 'post_crisis'],
  bystander: ['safety', 'normal', 'bystander'],
};

export function isLegalTransition(from: ResponseMode, to: ResponseMode): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}
