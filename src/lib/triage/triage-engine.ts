// ============================================================
// TRIAGE ENGINE — 3-TIER EMERGENCY RESPONSE SYSTEM
// Source: "Pet Rescue Training Protocol" Research Document (2026)
// Adapted from EMS Medical Priority Dispatch System (MPDS)
// ============================================================

import type { TriageTier, TriageCode, TriageAssessment, ConditionTriage } from '../types';

/**
 * Triage Tier Definitions (from Pet Rescue Protocol):
 * 
 * TIER 1 (ECHO/DELTA - Critical): Imminent threat to life. Death likely without
 * immediate intervention (<1 hour). Examples: HBC with open fractures, animal in
 * hot car, profuse arterial bleeding, respiratory distress.
 * 
 * TIER 2 (BRAVO/CHARLIE - Urgent): Serious but stable. Requires intervention
 * within 12-24 hours. Examples: Severe mange, limping stray, owner surrender
 * threats, pregnant stray, minor wounds.
 * 
 * TIER 3 (ALPHA/OMEGA - Routine): Non-life-threatening. Informational or
 * long-term need. Examples: Lost pet sightings >24h, blurry photos, behavioral
 * advice, rehoming requests.
 */

export interface TriageInput {
  // Visual Assessment (ABCs)
  respiratory_distress: boolean;
  open_mouth_breathing_cat: boolean;
  unconscious_or_seizing: boolean;
  lateral_recumbency: boolean;
  visible_blood_arterial: boolean;
  visible_fractures: boolean;
  
  // Environmental Risk Factors
  in_hot_vehicle: boolean;
  on_highway_or_road: boolean;
  extreme_weather: boolean; // <40°F or >90°F
  flood_or_water_hazard: boolean;
  predator_proximity: boolean;
  
  // Animal Status
  condition: ConditionTriage;
  is_neonate: boolean; // Bottle baby
  is_mobile: boolean;
  has_visible_injuries: boolean;
  
  // Context
  reporter_can_secure: boolean;
  time_since_sighting_hours: number;
  is_active_cruelty: boolean;
}

export interface TriageResult {
  assessment: TriageAssessment;
  action_protocol: string[];
  notification_level: 'PUSH_IMMEDIATE' | 'ALERT_VOLUNTEERS' | 'STANDARD_FEED';
  restrict_comments: boolean;
  requires_law_enforcement: boolean;
  clinical_reasoning: string;
}

/**
 * The "ABCs" of Digital Triage
 * Adapted from veterinary emergency assessment for digital interface
 */
function assessAirwayAppearance(input: TriageInput): { critical: boolean; indicators: string[] } {
  const indicators: string[] = [];
  let critical = false;

  if (input.open_mouth_breathing_cat) {
    indicators.push('Open mouth breathing in cat (near-death respiratory compromise)');
    critical = true;
  }
  if (input.respiratory_distress) {
    indicators.push('Respiratory distress observed');
    critical = true;
  }

  return { critical, indicators };
}

function assessBehaviorBodyLanguage(input: TriageInput): { critical: boolean; urgent: boolean; indicators: string[] } {
  const indicators: string[] = [];
  let critical = false;
  let urgent = false;

  if (input.unconscious_or_seizing) {
    indicators.push('Unconscious or seizing');
    critical = true;
  }
  if (input.lateral_recumbency) {
    indicators.push('Lateral recumbency without response');
    critical = true;
  }
  if (!input.is_mobile && input.has_visible_injuries) {
    indicators.push('Immobile with visible injuries');
    urgent = true;
  }

  return { critical, urgent, indicators };
}

function assessContextConditions(input: TriageInput): { elevates_to_critical: boolean; indicators: string[] } {
  const indicators: string[] = [];
  let elevates_to_critical = false;

  if (input.in_hot_vehicle) {
    indicators.push('Animal trapped in hot vehicle');
    elevates_to_critical = true;
  }
  if (input.on_highway_or_road) {
    indicators.push('Highway/road median - lethal environment');
    elevates_to_critical = true;
  }
  if (input.flood_or_water_hazard) {
    indicators.push('Flood/water hazard present');
    elevates_to_critical = true;
  }
  if (input.extreme_weather && input.is_neonate) {
    indicators.push('Neonate in extreme weather conditions');
    elevates_to_critical = true;
  }
  if (input.predator_proximity) {
    indicators.push('Predator proximity risk');
    elevates_to_critical = true;
  }
  if (input.is_active_cruelty) {
    indicators.push('Active animal cruelty in progress');
    elevates_to_critical = true;
  }

  return { elevates_to_critical, indicators };
}

/**
 * Main triage function implementing the 3-Tier system
 */
export function performTriage(input: TriageInput, assessedBy: string): TriageResult {
  const allIndicators: string[] = [];
  
  // Run ABC Assessment
  const airway = assessAirwayAppearance(input);
  const behavior = assessBehaviorBodyLanguage(input);
  const context = assessContextConditions(input);
  
  allIndicators.push(...airway.indicators, ...behavior.indicators, ...context.indicators);

  // Determine tier based on assessment
  let tier: TriageTier;
  let code: TriageCode;
  let interventionHours: number;
  let requiresDispatch: boolean;
  let environmentalRisk: 'HIGH' | 'MEDIUM' | 'LOW';

  // TIER 1: Critical (ECHO/DELTA)
  if (
    input.condition === 'CRITICAL' ||
    input.condition === 'DECEASED' ||
    airway.critical ||
    behavior.critical ||
    context.elevates_to_critical ||
    input.visible_blood_arterial ||
    input.visible_fractures
  ) {
    tier = 'TIER_1_CRITICAL';
    code = airway.critical || input.condition === 'DECEASED' ? 'ECHO' : 'DELTA';
    interventionHours = 1;
    requiresDispatch = true;
    environmentalRisk = 'HIGH';
  }
  // TIER 2: Urgent (BRAVO/CHARLIE)
  else if (
    input.condition === 'INJURED_STABLE' ||
    behavior.urgent ||
    input.has_visible_injuries ||
    input.is_neonate ||
    (input.extreme_weather && !input.reporter_can_secure)
  ) {
    tier = 'TIER_2_URGENT';
    code = input.has_visible_injuries ? 'CHARLIE' : 'BRAVO';
    interventionHours = 24;
    requiresDispatch = false;
    environmentalRisk = 'MEDIUM';
  }
  // TIER 3: Routine (ALPHA/OMEGA)
  else {
    tier = 'TIER_3_ROUTINE';
    code = input.time_since_sighting_hours > 24 ? 'OMEGA' : 'ALPHA';
    interventionHours = 72;
    requiresDispatch = false;
    environmentalRisk = 'LOW';
  }

  // Build action protocol
  const actionProtocol = buildActionProtocol(tier, code, input);

  // Build clinical reasoning
  const clinicalReasoning = buildClinicalReasoning(tier, allIndicators, input);

  const assessment: TriageAssessment = {
    tier,
    code,
    clinical_indicators: allIndicators,
    environmental_risk: environmentalRisk,
    requires_immediate_dispatch: requiresDispatch,
    estimated_intervention_window_hours: interventionHours,
    assessed_by: assessedBy,
    assessed_at: new Date().toISOString(),
  };

  return {
    assessment,
    action_protocol: actionProtocol,
    notification_level: tier === 'TIER_1_CRITICAL' ? 'PUSH_IMMEDIATE' : 
                        tier === 'TIER_2_URGENT' ? 'ALERT_VOLUNTEERS' : 'STANDARD_FEED',
    restrict_comments: tier === 'TIER_1_CRITICAL',
    requires_law_enforcement: input.is_active_cruelty || input.in_hot_vehicle,
    clinical_reasoning: clinicalReasoning,
  };
}

function buildActionProtocol(tier: TriageTier, code: TriageCode, input: TriageInput): string[] {
  const actions: string[] = [];

  switch (tier) {
    case 'TIER_1_CRITICAL':
      actions.push('IMMEDIATE: Push notification to local Tier-3 volunteers');
      actions.push('Pin post globally for geofenced area');
      actions.push('Restrict comments to verified rescuers only');
      if (input.is_active_cruelty || input.in_hot_vehicle) {
        actions.push('COORDINATE: Initiate contact with local Animal Control or Police Dispatch');
      }
      if (input.visible_blood_arterial || input.visible_fractures) {
        actions.push('MEDICAL: Alert nearest ER vet facility');
      }
      break;

    case 'TIER_2_URGENT':
      actions.push('Alert Tier-2 volunteers via in-app notification');
      actions.push('Highlight post in feed (not pinned)');
      actions.push('Enable community crowdsourcing for supplies/fosters');
      actions.push('Monitor comments for misinformation');
      if (input.is_neonate) {
        actions.push('NEONATAL: Alert certified Kitten Nurse volunteers');
      }
      break;

    case 'TIER_3_ROUTINE':
      actions.push('Standard feed visibility');
      actions.push('No push notifications');
      actions.push('Trigger automated bot response with local resources');
      actions.push('Open comments to general public');
      break;
  }

  return actions;
}

function buildClinicalReasoning(tier: TriageTier, indicators: string[], input: TriageInput): string {
  if (indicators.length === 0) {
    return `${tier}: No critical indicators. Animal appears ${input.condition.toLowerCase().replace('_', ' ')}.`;
  }

  const tierLabel = tier === 'TIER_1_CRITICAL' ? 'CRITICAL' :
                    tier === 'TIER_2_URGENT' ? 'URGENT' : 'ROUTINE';

  return `${tierLabel}: ${indicators.join('; ')}. ` +
         `Intervention window: ${tier === 'TIER_1_CRITICAL' ? '<1 hour' : tier === 'TIER_2_URGENT' ? '12-24 hours' : '72+ hours'}.`;
}

/**
 * Quick triage from condition alone (for simpler cases)
 */
export function quickTriageFromCondition(condition: ConditionTriage): TriageTier {
  switch (condition) {
    case 'CRITICAL':
    case 'DECEASED':
      return 'TIER_1_CRITICAL';
    case 'INJURED_STABLE':
      return 'TIER_2_URGENT';
    case 'HEALTHY':
    default:
      return 'TIER_3_ROUTINE';
  }
}

/**
 * Get triage code description for UI display
 */
export function getTriageCodeDescription(code: TriageCode): { label: string; description: string; color: string } {
  const descriptions: Record<TriageCode, { label: string; description: string; color: string }> = {
    ECHO: {
      label: 'ECHO - Imminent Death',
      description: 'Death is imminent without immediate intervention. Respiratory failure, cardiac arrest, or severe trauma.',
      color: '#DC2626', // red-600
    },
    DELTA: {
      label: 'DELTA - Critical',
      description: 'Life-threatening condition requiring immediate intervention within 1 hour.',
      color: '#EA580C', // orange-600
    },
    CHARLIE: {
      label: 'CHARLIE - Serious',
      description: 'Serious condition but currently stable. Requires intervention within 12 hours.',
      color: '#D97706', // amber-600
    },
    BRAVO: {
      label: 'BRAVO - Urgent',
      description: 'Urgent but not immediately life-threatening. Intervention within 24 hours.',
      color: '#CA8A04', // yellow-600
    },
    ALPHA: {
      label: 'ALPHA - Non-Urgent',
      description: 'Non-life-threatening. Standard response time acceptable.',
      color: '#16A34A', // green-600
    },
    OMEGA: {
      label: 'OMEGA - Informational',
      description: 'Informational only. No immediate action required.',
      color: '#2563EB', // blue-600
    },
  };

  return descriptions[code];
}

/**
 * Validate that triage was performed correctly (for moderator review)
 */
export function validateTriageAssessment(assessment: TriageAssessment, input: TriageInput): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for obvious mismatches
  if (input.condition === 'CRITICAL' && assessment.tier !== 'TIER_1_CRITICAL') {
    issues.push('Critical condition should be Tier 1');
  }

  if (input.in_hot_vehicle && assessment.tier !== 'TIER_1_CRITICAL') {
    issues.push('Hot vehicle scenario should always be Tier 1');
  }

  if (input.is_active_cruelty && assessment.tier !== 'TIER_1_CRITICAL') {
    issues.push('Active cruelty should always be Tier 1');
  }

  if (assessment.tier === 'TIER_1_CRITICAL' && !assessment.requires_immediate_dispatch) {
    issues.push('Tier 1 should require immediate dispatch');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
