/**
 * TRIAGE SYSTEM TYPES
 * 
 * Aligned with EMS Medical Priority Dispatch System (MPDS)
 * Reference: pet911 Academy Training Framework v1.0
 * 
 * The 3-Tier Triage System adapted from EMS protocols to standardize response urgency.
 * Moderators tag every incoming "incident report" with one of these codes within 5 minutes.
 */

// ═══════════════════════════════════════════════════════════════════
// TRIAGE TIER SYSTEM (EMS-Aligned)
// ═══════════════════════════════════════════════════════════════════

/**
 * EMS-style triage codes mapped to pet911 emergency response
 * 
 * ECHO/DELTA = Code 3 (Lights & Sirens) - Imminent threat to life
 * BRAVO/CHARLIE = Code 2 (Rapid Response) - Serious but stable
 * ALPHA/OMEGA = Code 1 (Non-Urgent) - Routine/informational
 */
export type TriageCode = 
  | 'ECHO'    // Critical - Death imminent without intervention (<1 hour)
  | 'DELTA'   // Critical - Life-threatening, requires immediate response
  | 'CHARLIE' // Urgent - Serious condition, stable, 12-24 hour window
  | 'BRAVO'   // Urgent - Moderate concern, requires attention within 24h
  | 'ALPHA'   // Routine - Non-life-threatening, can wait
  | 'OMEGA';  // Informational - No emergency, resource sharing only

/**
 * Simplified 3-Tier system for UI display and dispatch logic
 */
export type TriageTier = 1 | 2 | 3;

/**
 * Maps triage codes to tiers
 */
export const TRIAGE_CODE_TO_TIER: Record<TriageCode, TriageTier> = {
  ECHO: 1,
  DELTA: 1,
  CHARLIE: 2,
  BRAVO: 2,
  ALPHA: 3,
  OMEGA: 3,
};

/**
 * EMS equivalent descriptions
 */
export const TRIAGE_TIER_DESCRIPTIONS: Record<TriageTier, {
  emsEquivalent: string;
  name: string;
  description: string;
  responseWindow: string;
  color: string;
}> = {
  1: {
    emsEquivalent: 'Code 3 (Lights & Sirens)',
    name: 'CRITICAL',
    description: 'Imminent threat to life or severe suffering. Death likely without immediate intervention.',
    responseWindow: '< 1 hour',
    color: 'red',
  },
  2: {
    emsEquivalent: 'Code 2 (Rapid Response)',
    name: 'URGENT',
    description: 'Serious condition but stable; requires intervention within 12-24 hours.',
    responseWindow: '12-24 hours',
    color: 'orange',
  },
  3: {
    emsEquivalent: 'Code 1 (Non-Urgent)',
    name: 'ROUTINE',
    description: 'Non-life-threatening; informational or long-term need.',
    responseWindow: '24+ hours',
    color: 'green',
  },
};

// ═══════════════════════════════════════════════════════════════════
// CLINICAL INDICATORS (ABCs of Digital Triage)
// ═══════════════════════════════════════════════════════════════════

/**
 * Airway/Appearance indicators - Does the photo/video show respiratory distress?
 */
export type AirwayIndicator =
  | 'OPEN_MOUTH_BREATHING_CAT'    // Near-death respiratory compromise in cats
  | 'EXAGGERATED_ABDOMINAL'       // Labored breathing with visible effort
  | 'CYANOTIC_GUMS'               // Blue gums indicating oxygen deprivation
  | 'NORMAL_BREATHING'
  | 'UNKNOWN';

/**
 * Behavior/Body Language indicators
 */
export type BehaviorIndicator =
  | 'LATERAL_RECUMBENCY'          // Lying on side, unresponsive
  | 'SEIZING'                     // Active seizure
  | 'STAR_GAZING'                 // Neurological sign
  | 'UNCONSCIOUS'
  | 'COWERING'                    // Fearful but responsive
  | 'AGGRESSIVE'                  // Requires specialist handler
  | 'ALERT_RESPONSIVE'
  | 'UNKNOWN';

/**
 * Context/Conditions - Is the environment the killer?
 */
export type ContextIndicator =
  | 'HOT_CAR'                     // Trapped in vehicle, extreme heat
  | 'HIGHWAY_MEDIAN'              // Active traffic danger
  | 'FLOODWATERS'                 // Drowning risk
  | 'EXTREME_COLD'                // Hypothermia risk (<40°F)
  | 'EXTREME_HEAT'                // Heatstroke risk (>90°F)
  | 'PREDATOR_PROXIMITY'          // Wild animal threat
  | 'ACTIVE_ABUSE'                // Cruelty in progress
  | 'SAFE_ENVIRONMENT'
  | 'UNKNOWN';

/**
 * Digital triage assessment following the ABCs protocol
 */
export interface TriageAssessment {
  assessedAt: string;
  assessedBy: string;
  
  // The ABCs
  airway: AirwayIndicator;
  behavior: BehaviorIndicator;
  context: ContextIndicator;
  
  // Calculated results
  triageCode: TriageCode;
  triageTier: TriageTier;
  
  // Additional clinical notes
  clinicalIndicators: string[];
  environmentalRisks: string[];
  
  // Confidence and verification
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresVerification: boolean;
  verificationRequested?: string;
  
  // Override tracking (for audit)
  wasOverridden: boolean;
  overrideReason?: string;
  overriddenBy?: string;
}

// ═══════════════════════════════════════════════════════════════════
// TIER 1 CLINICAL INDICATORS (Critical)
// ═══════════════════════════════════════════════════════════════════

export const TIER_1_INDICATORS: string[] = [
  // Hit-by-car (HBC)
  'Hit by car with visible injuries',
  'Open fractures or exposed bone',
  'Profuse arterial bleeding (pulsing/bright red)',
  
  // Active cruelty
  'Active animal cruelty in progress',
  'Animal being attacked by human or animal',
  
  // Environmental emergencies
  'Dog trapped in hot car (any temperature)',
  'Animal in floodwaters',
  'Animal on highway/active roadway',
  
  // Neonatal emergencies
  'Neonate kittens found without mother in extreme weather (<40°F or >90°F)',
  'Fading kitten/puppy (limp, cold, refusing food)',
  
  // Respiratory distress
  'Open-mouth breathing in cats',
  'Labored breathing with exaggerated abdominal effort',
  'Cyanotic (blue) gums',
  
  // Neurological
  'Active seizure',
  'Lateral recumbency (lying on side) without response',
  'Star-gazing (neurological sign)',
];

// ═══════════════════════════════════════════════════════════════════
// TIER 2 CLINICAL INDICATORS (Urgent)
// ═══════════════════════════════════════════════════════════════════

export const TIER_2_INDICATORS: string[] = [
  // Skin/infection
  'Severe skin infection or sarcoptic mange',
  'Visible abscesses or infected wounds',
  
  // Mobility issues
  'Limping stray (mobile but injured)',
  'Non-weight-bearing on limb',
  
  // Colony/surrender situations
  'Cat colony identification',
  'Owner surrender threats ("will dump tomorrow")',
  'Pregnant stray in distress',
  
  // Minor injuries
  'Minor wounds requiring veterinary attention',
  'Eye injuries or discharge',
  'Possible broken limb (non-compound)',
];

// ═══════════════════════════════════════════════════════════════════
// TIER 3 INDICATORS (Routine)
// ═══════════════════════════════════════════════════════════════════

export const TIER_3_INDICATORS: string[] = [
  'Lost pet sighting (older than 24h)',
  'Blurry photos of potential strays',
  'Behavioral advice requests',
  'Resource sharing (food banks, low-cost clinics)',
  'Generic rehoming requests (non-urgent)',
  'Community cat feeding coordination',
  'Spay/neuter program inquiries',
];

// ═══════════════════════════════════════════════════════════════════
// TRIAGE DECISION ENGINE
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate triage code based on ABC assessment
 * Rule: A high-risk environment elevates a Tier 2 injury to Tier 1
 */
export function calculateTriageCode(assessment: {
  airway: AirwayIndicator;
  behavior: BehaviorIndicator;
  context: ContextIndicator;
}): TriageCode {
  const { airway, behavior, context } = assessment;
  
  // ECHO - Immediate death risk
  if (
    airway === 'OPEN_MOUTH_BREATHING_CAT' ||
    airway === 'CYANOTIC_GUMS' ||
    behavior === 'SEIZING' ||
    behavior === 'UNCONSCIOUS' ||
    context === 'HOT_CAR' ||
    context === 'ACTIVE_ABUSE'
  ) {
    return 'ECHO';
  }
  
  // DELTA - Critical but not immediately dying
  if (
    airway === 'EXAGGERATED_ABDOMINAL' ||
    behavior === 'LATERAL_RECUMBENCY' ||
    behavior === 'STAR_GAZING' ||
    context === 'HIGHWAY_MEDIAN' ||
    context === 'FLOODWATERS'
  ) {
    return 'DELTA';
  }
  
  // Environment can elevate tier
  const dangerousEnvironment = 
    context === 'EXTREME_COLD' ||
    context === 'EXTREME_HEAT' ||
    context === 'PREDATOR_PROXIMITY';
  
  // CHARLIE - Urgent, requires specialist
  if (
    behavior === 'AGGRESSIVE' ||
    (behavior === 'COWERING' && dangerousEnvironment)
  ) {
    return 'CHARLIE';
  }
  
  // BRAVO - Urgent but stable
  if (
    behavior === 'COWERING' ||
    dangerousEnvironment
  ) {
    return 'BRAVO';
  }
  
  // ALPHA - Routine
  if (
    airway === 'NORMAL_BREATHING' &&
    behavior === 'ALERT_RESPONSIVE' &&
    context === 'SAFE_ENVIRONMENT'
  ) {
    return 'ALPHA';
  }
  
  // OMEGA - Informational only
  if (
    airway === 'UNKNOWN' &&
    behavior === 'UNKNOWN' &&
    context === 'UNKNOWN'
  ) {
    return 'OMEGA';
  }
  
  // Default to BRAVO if unclear (err on side of caution)
  return 'BRAVO';
}

/**
 * Get action protocol for a triage tier
 */
export function getActionProtocol(tier: TriageTier): {
  notification: string;
  visibility: string;
  commentPolicy: string;
  escalation: string;
} {
  switch (tier) {
    case 1:
      return {
        notification: 'Immediate push notification to local Tier-3 Volunteers',
        visibility: 'Pinned globally for geofenced area',
        commentPolicy: 'Restricted to verified rescuers only',
        escalation: 'Coordinate with Animal Control or Police if legal authority required',
      };
    case 2:
      return {
        notification: 'Alert sent to Tier-2 Volunteers via in-app notification',
        visibility: 'Highlighted but not pinned',
        commentPolicy: 'Open but monitored for bad advice',
        escalation: 'Community crowdsourcing for supplies/fosters enabled',
      };
    case 3:
      return {
        notification: 'Standard feed visibility, no push notifications',
        visibility: 'Normal feed placement',
        commentPolicy: 'Open to general public',
        escalation: 'Automated bot response with local resources',
      };
  }
}
