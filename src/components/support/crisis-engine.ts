/**
 * Crisis Detection Engine
 * Handles crisis assessment, marker detection, compound crisis identification,
 * volatility tracking, and risk tier scoring
 */

import {
  MARKERS,
  MARKERS_ES,
  MARKERS_FR,
  SCORING,
  BYSTANDER_TRIGGERS,
  WAITING_TRIGGERS,
  type RiskTier,
  type MarkerCategory,
} from './companion-config';

// ============================================================================
// TYPES
// ============================================================================

export interface CrisisAssessment {
  tier: RiskTier;
  score: number;
  markers: string[];
  primaryCrisis: string | null;
  requiresHumanHandoff: boolean;
  requiresGrounding: boolean;
  isCompoundCrisis: boolean;
  compoundTypes: string[];
  volatility: 'STABLE' | 'ESCALATING' | 'DE_ESCALATING';
  cognitiveLoad: 'NORMAL' | 'IMPAIRED';
  bystander: BystanderInfo | null;
  waitingRoom: boolean;
  language: SupportedLang;
}

export interface BystanderInfo {
  isBystander: boolean;
  isRemote: boolean;
  isMinor: boolean;
  relationship: string | null;
}

export interface VolatilityTracker {
  scores: number[];
  timestamps: number[];
  trend: 'STABLE' | 'ESCALATING' | 'DE_ESCALATING';
}

export type SupportedLang = 'en' | 'es' | 'fr';

// ============================================================================
// LANGUAGE DETECTION
// ============================================================================

const LANG_SIGNALS: Record<SupportedLang, string[]> = {
  es: ['hola', 'ayuda', 'perdido', 'perdida', 'emergencia', 'por favor', 'gracias', '¿', '¡', 'necesito', 'estoy'],
  fr: ['bonjour', 'aide', 'perdu', 'urgence', "s'il vous plaît", 'merci', 'je suis', 'besoin', "j'ai"],
  en: [], // default
};

export function detectLanguage(text: string): SupportedLang {
  const lower = text.toLowerCase();
  
  let maxScore = 0;
  let detected: SupportedLang = 'en';
  
  for (const [lang, signals] of Object.entries(LANG_SIGNALS)) {
    if (lang === 'en') continue;
    const score = signals.filter(s => lower.includes(s)).length;
    if (score > maxScore) {
      maxScore = score;
      detected = lang as SupportedLang;
    }
  }
  
  return detected;
}

// ============================================================================
// MARKER DETECTION
// ============================================================================

function getMarkersForLanguage(lang: SupportedLang) {
  switch (lang) {
    case 'es':
      return MARKERS_ES || MARKERS;
    case 'fr':
      return MARKERS_FR || MARKERS;
    default:
      return MARKERS;
  }
}

export function detectMarkers(text: string, lang: SupportedLang = 'en'): string[] {
  const markers = getMarkersForLanguage(lang);
  const lower = text.toLowerCase();
  const detected: string[] = [];
  
  for (const [category, subcategories] of Object.entries(markers)) {
    if (!subcategories) continue;
    
    for (const [subcat, phrases] of Object.entries(subcategories)) {
      if (!Array.isArray(phrases)) continue;
      
      for (const phrase of phrases) {
        // Use word boundary matching to avoid false positives
        // But be careful with regex - use simple includes for safety
        if (lower.includes(phrase.toLowerCase())) {
          detected.push(`${category}_${subcat.toUpperCase()}`);
          break; // Only count each subcategory once
        }
      }
    }
  }
  
  return Array.from(new Set(detected)); // Deduplicate
}

// =========================================================================
// VOLATILITY DETECTION (simple baseline)
// =========================================================================

export function detectVolatilitySignals(messages: Array<{ content: string }>): boolean {
  const recent = messages.slice(-5).map(m => m.content.toLowerCase()).join(' ');
  return (
    recent.includes('actually') ||
    recent.includes('wait') ||
    recent.includes("no i mean") ||
    recent.includes("that's not what") ||
    recent.includes('forget that') ||
    recent.includes('never mind') ||
    recent.includes('scratch that')
  );
}

// =========================================================================
// TIME CONTEXT
// =========================================================================

export function isNighttimeLocal(): boolean {
  if (typeof Date === 'undefined') return false;
  const hour = new Date().getHours();
  return hour >= 22 || hour <= 5;
}

// ============================================================================
// RISK SCORING
// ============================================================================

export function calculateRiskScore(markers: string[]): number {
  let score = 0;
  
  for (const marker of markers) {
    const weight = SCORING.weights[marker] || 0;
    score += weight;
  }
  
  // Cap at 100
  return Math.min(score, 100);
}

export function determineRiskTier(score: number): RiskTier {
  if (score >= SCORING.thresholds.CRITICAL) return 'CRITICAL';
  if (score >= SCORING.thresholds.HIGH) return 'HIGH';
  if (score >= SCORING.thresholds.MEDIUM) return 'MEDIUM';
  return 'STANDARD';
}

// ============================================================================
// COMPOUND CRISIS DETECTION
// ============================================================================

export function detectCompoundCrisis(markers: string[]): { isCompound: boolean; types: string[] } {
  const categories = new Set<string>();
  
  for (const marker of markers) {
    const category = marker.split('_')[0];
    categories.add(category);
  }
  
  const crisisTypes = Array.from(categories);
  
  // Compound if multiple crisis types present
  const isCompound = crisisTypes.length >= 2;
  
  return { isCompound, types: crisisTypes };
}

export function detectPetLossSuicideCoupling(markers: string[]): boolean {
  const hasLoss = markers.some(m => m.startsWith('DEATH') || m.startsWith('ANTICIPATORY'));
  const hasSuicide = markers.some(m => m.startsWith('SUICIDE'));
  return hasLoss && hasSuicide;
}

// ============================================================================
// VOLATILITY TRACKING
// ============================================================================

export function createVolatilityTracker(): VolatilityTracker {
  return {
    scores: [],
    timestamps: [],
    trend: 'STABLE',
  };
}

export function updateVolatility(
  tracker: VolatilityTracker,
  newScore: number
): VolatilityTracker {
  const now = Date.now();
  
  // Keep last 5 scores
  const scores = [...tracker.scores, newScore].slice(-5);
  const timestamps = [...tracker.timestamps, now].slice(-5);
  
  // Determine trend
  let trend: VolatilityTracker['trend'] = 'STABLE';
  
  if (scores.length >= 3) {
    const recent = scores.slice(-3);
    const isEscalating = recent[2] > recent[1] && recent[1] > recent[0];
    const isDeescalating = recent[2] < recent[1] && recent[1] < recent[0];
    
    if (isEscalating) {
      trend = 'ESCALATING';
    } else if (isDeescalating) {
      trend = 'DE_ESCALATING';
    }
  }
  
  return { scores, timestamps, trend };
}

// ============================================================================
// BYSTANDER DETECTION
// ============================================================================

export function detectBystanderMode(text: string): BystanderInfo | null {
  const lower = text.toLowerCase();
  
  const isBystander = BYSTANDER_TRIGGERS?.some(t => lower.includes(t)) || false;
  
  if (!isBystander) return null;
  
  const isRemote = ['not with them', 'different location', 'over the phone', 'on the phone', 'texting'].some(
    t => lower.includes(t)
  );
  
  const isMinor = [
    "i'm 16", "i'm 15", "i'm 14", "i'm 13", "i'm 12",
    "im 16", "im 15", "im 14", "im 13", "im 12",
    "i'm a kid", "i'm a teenager", "im a kid", "im a teenager",
    "i'm in high school", "i'm in middle school"
  ].some(t => lower.includes(t));
  
  // Try to detect relationship
  let relationship: string | null = null;
  const relationshipMatches = [
    { trigger: 'my friend', rel: 'friend' },
    { trigger: 'my partner', rel: 'partner' },
    { trigger: 'my husband', rel: 'husband' },
    { trigger: 'my wife', rel: 'wife' },
    { trigger: 'my child', rel: 'child' },
    { trigger: 'my son', rel: 'son' },
    { trigger: 'my daughter', rel: 'daughter' },
    { trigger: 'my parent', rel: 'parent' },
    { trigger: 'my mom', rel: 'mother' },
    { trigger: 'my dad', rel: 'father' },
    { trigger: 'my sibling', rel: 'sibling' },
    { trigger: 'my brother', rel: 'brother' },
    { trigger: 'my sister', rel: 'sister' },
    { trigger: 'coworker', rel: 'coworker' },
    { trigger: 'roommate', rel: 'roommate' },
  ];
  
  for (const { trigger, rel } of relationshipMatches) {
    if (lower.includes(trigger)) {
      relationship = rel;
      break;
    }
  }
  
  return { isBystander, isRemote, isMinor, relationship };
}

// ============================================================================
// WAITING ROOM DETECTION
// ============================================================================

export function detectWaitingRoom(text: string): boolean {
  const lower = text.toLowerCase();
  return WAITING_TRIGGERS?.some(t => lower.includes(t)) || false;
}

// ============================================================================
// COGNITIVE LOAD ASSESSMENT
// ============================================================================

export function assessCognitiveLoad(
  markers: string[],
  volatility: VolatilityTracker['trend'],
  score: number
): 'NORMAL' | 'IMPAIRED' {
  // Impaired cognition indicators:
  // - CRITICAL risk tier
  // - Active crisis with escalation
  // - Panic/crisis markers present
  
  if (score >= SCORING.thresholds.CRITICAL) return 'IMPAIRED';
  if (volatility === 'ESCALATING' && score >= SCORING.thresholds.HIGH) return 'IMPAIRED';
  if (markers.some(m => m.includes('CRISIS') || m.includes('PANIC'))) return 'IMPAIRED';
  
  return 'NORMAL';
}

// ============================================================================
// PRIMARY CRISIS DETERMINATION
// ============================================================================

function determinePrimaryCrisis(markers: string[]): string | null {
  // Priority order for primary crisis
  const priorityOrder = [
    'SUICIDE',
    'SELF_HARM',
    'ABUSE',
    'EMERGENCY',
    'CRISIS',
    'DEATH',
    'ANTICIPATORY',
    'SCAM',
    'LOST_PET',
    'FINANCIAL',
  ];
  
  for (const priority of priorityOrder) {
    if (markers.some(m => m.startsWith(priority))) {
      return priority.toLowerCase();
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ASSESSMENT FUNCTION
// ============================================================================

export function assessCrisis(
  text: string,
  volatilityTracker: VolatilityTracker
): { assessment: CrisisAssessment; updatedVolatility: VolatilityTracker } {
  // Detect language
  const language = detectLanguage(text);
  
  // Detect markers
  const markers = detectMarkers(text, language);
  
  // Calculate score and tier
  const score = calculateRiskScore(markers);
  const tier = determineRiskTier(score);
  
  // Update volatility
  const updatedVolatility = updateVolatility(volatilityTracker, score);
  
  // Detect compound crisis
  const compound = detectCompoundCrisis(markers);
  
  // Detect bystander mode
  const bystander = detectBystanderMode(text);
  
  // Detect waiting room
  const waitingRoom = detectWaitingRoom(text);
  
  // Assess cognitive load
  const cognitiveLoad = assessCognitiveLoad(markers, updatedVolatility.trend, score);
  
  // Determine primary crisis
  const primaryCrisis = determinePrimaryCrisis(markers);
  
  // Determine if human handoff needed
  const requiresHumanHandoff = tier === 'CRITICAL' || tier === 'HIGH';
  
  // Determine if grounding needed
  const requiresGrounding = markers.some(m => 
    m.includes('CRISIS') || m.includes('PANIC')
  ) && tier !== 'CRITICAL';
  
  const assessment: CrisisAssessment = {
    tier,
    score,
    markers,
    primaryCrisis,
    requiresHumanHandoff,
    requiresGrounding,
    isCompoundCrisis: compound.isCompound,
    compoundTypes: compound.types,
    volatility: updatedVolatility.trend,
    cognitiveLoad,
    bystander,
    waitingRoom,
    language,
  };
  
  return { assessment, updatedVolatility };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function isPetLossSuicideCoupling(assessment: CrisisAssessment): boolean {
  return detectPetLossSuicideCoupling(assessment.markers);
}

export function shouldUseLowCognitionMode(assessment: CrisisAssessment): boolean {
  return assessment.cognitiveLoad === 'IMPAIRED' || assessment.tier === 'CRITICAL';
}

export function getEscalationLevel(
  current: CrisisAssessment,
  previous: CrisisAssessment | null
): 'SAME' | 'ESCALATED' | 'DE_ESCALATED' {
  if (!previous) return 'SAME';
  
  const tierOrder: RiskTier[] = ['STANDARD', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const currentIdx = tierOrder.indexOf(current.tier);
  const previousIdx = tierOrder.indexOf(previous.tier);
  
  if (currentIdx > previousIdx) return 'ESCALATED';
  if (currentIdx < previousIdx) return 'DE_ESCALATED';
  return 'SAME';
}
