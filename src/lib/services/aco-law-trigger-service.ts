/**
 * ACO Law Trigger Evaluation Service
 * 
 * Evaluates intake data against WV statutes and county ordinances
 * to determine if ACO notification is required.
 * 
 * Legal Basis:
 * - §7-1-14 (County authority - nuisance, public safety)
 * - §7-10-4 (Magistrate authority - cruelty, neglect)
 * - §19-20-20 (Vicious dogs)
 * - Local ordinances (county-specific overrides)
 */

import { createServiceRoleClient } from '@/lib/api/server-auth';

// Law trigger categories (matches DB enum)
export type LawTriggerCategory =
  | 'CRUELTY_SUSPECTED'
  | 'NEGLECT_SUSPECTED'
  | 'ABANDONMENT'
  | 'HOARDING_SITUATION'
  | 'INADEQUATE_SHELTER'
  | 'NO_FOOD_WATER'
  | 'MEDICAL_NEGLECT'
  | 'BITE_INCIDENT'
  | 'ATTACK_ON_HUMAN'
  | 'ATTACK_ON_ANIMAL'
  | 'AGGRESSIVE_BEHAVIOR'
  | 'VICIOUS_ANIMAL'
  | 'UNPROVOKED_AGGRESSION'
  | 'AT_LARGE_HAZARD'
  | 'PUBLIC_NUISANCE'
  | 'TRAFFIC_HAZARD'
  | 'PACK_BEHAVIOR'
  | 'REPEATED_ESCAPE'
  | 'INJURED_SEVERE'
  | 'INJURED_MODERATE'
  | 'SICK_CONTAGIOUS'
  | 'DECEASED_ANIMAL'
  | 'RABIES_EXPOSURE'
  | 'TETHERING_VIOLATION'
  | 'INADEQUATE_CONFINEMENT'
  | 'EXTREME_WEATHER_EXPOSURE'
  | 'ILLEGAL_BREEDING'
  | 'EXOTIC_ANIMAL'
  | 'LIVESTOCK_AT_LARGE'
  | 'WILDLIFE_CONFLICT'
  | 'OTHER_LAW_CONCERN';

export type County = 'GREENBRIER' | 'KANAWHA';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface LawRule {
  rule_id: string;
  rule_code: string;
  rule_name: string;
  legal_basis: 'STATE_LAW' | 'COUNTY_ORDINANCE';
  priority: Priority;
  response_sla_minutes: number | null;
  requires_immediate_response: boolean;
  statute_citations: string[];
}

export interface LawTriggerResult {
  triggers_aco: boolean;
  rules: LawRule[];
  highest_priority: Priority | null;
  requires_immediate: boolean;
  primary_rule: LawRule | null;
  all_citations: string[];
}

/**
 * Evaluate law triggers for a given county and set of trigger categories
 * Returns matching rules in priority order (CRITICAL first)
 */
export async function evaluateLawTriggers(
  county: County,
  triggers: LawTriggerCategory[]
): Promise<LawTriggerResult> {
  if (!triggers || triggers.length === 0) {
    return {
      triggers_aco: false,
      rules: [],
      highest_priority: null,
      requires_immediate: false,
      primary_rule: null,
      all_citations: [],
    };
  }

  const supabase = createServiceRoleClient();

  // Call the database function that handles precedence logic
  const { data: rules, error } = await supabase.rpc('evaluate_law_triggers', {
    p_county: county,
    p_triggers: triggers,
  });

  if (error) {
    console.error('Law trigger evaluation error:', error);
    // Fail-open: if we can't evaluate, don't block the flow
    // but log for audit
    return {
      triggers_aco: false,
      rules: [],
      highest_priority: null,
      requires_immediate: false,
      primary_rule: null,
      all_citations: [],
    };
  }

  const matchedRules: LawRule[] = (rules || []).map((r: any) => ({
    rule_id: r.rule_id,
    rule_code: r.rule_code,
    rule_name: r.rule_name,
    legal_basis: r.legal_basis,
    priority: r.priority,
    response_sla_minutes: r.response_sla_minutes,
    requires_immediate_response: r.requires_immediate_response,
    statute_citations: r.statute_citations || [],
  }));

  const triggersAco = matchedRules.length > 0;
  const primaryRule = matchedRules[0] || null;
  const requiresImmediate = matchedRules.some((r) => r.requires_immediate_response);
  
  // Collect all unique citations
  const allCitations = Array.from(new Set(matchedRules.flatMap((r) => r.statute_citations)));

  // Determine highest priority
  let highestPriority: Priority | null = null;
  if (matchedRules.some((r) => r.priority === 'CRITICAL')) highestPriority = 'CRITICAL';
  else if (matchedRules.some((r) => r.priority === 'HIGH')) highestPriority = 'HIGH';
  else if (matchedRules.some((r) => r.priority === 'MEDIUM')) highestPriority = 'MEDIUM';
  else if (matchedRules.some((r) => r.priority === 'LOW')) highestPriority = 'LOW';

  return {
    triggers_aco: triggersAco,
    rules: matchedRules,
    highest_priority: highestPriority,
    requires_immediate: requiresImmediate,
    primary_rule: primaryRule,
    all_citations: allCitations,
  };
}

/**
 * Get display labels for trigger categories (for UI)
 */
export const TRIGGER_CATEGORY_LABELS: Record<LawTriggerCategory, string> = {
  // Cruelty & Neglect
  CRUELTY_SUSPECTED: 'Suspected animal cruelty',
  NEGLECT_SUSPECTED: 'Suspected neglect',
  ABANDONMENT: 'Animal appears abandoned',
  HOARDING_SITUATION: 'Hoarding situation',
  INADEQUATE_SHELTER: 'Inadequate shelter/housing',
  NO_FOOD_WATER: 'No access to food/water',
  MEDICAL_NEGLECT: 'Untreated medical condition',

  // Dangerous Animals
  BITE_INCIDENT: 'Bite incident occurred',
  ATTACK_ON_HUMAN: 'Attack on human',
  ATTACK_ON_ANIMAL: 'Attack on another animal',
  AGGRESSIVE_BEHAVIOR: 'Aggressive/threatening behavior',
  VICIOUS_ANIMAL: 'Vicious animal',
  UNPROVOKED_AGGRESSION: 'Unprovoked aggression',

  // Public Safety
  AT_LARGE_HAZARD: 'At-large creating hazard',
  PUBLIC_NUISANCE: 'Public nuisance',
  TRAFFIC_HAZARD: 'Traffic hazard',
  PACK_BEHAVIOR: 'Pack/group behavior',
  REPEATED_ESCAPE: 'Repeated escape history',

  // Health & Welfare
  INJURED_SEVERE: 'Severely injured (life-threatening)',
  INJURED_MODERATE: 'Moderately injured',
  SICK_CONTAGIOUS: 'Appears sick/contagious',
  DECEASED_ANIMAL: 'Deceased animal',
  RABIES_EXPOSURE: 'Possible rabies exposure',

  // Tethering & Confinement
  TETHERING_VIOLATION: 'Improper tethering',
  INADEQUATE_CONFINEMENT: 'Inadequate confinement',
  EXTREME_WEATHER_EXPOSURE: 'Exposed to extreme weather',

  // Other
  ILLEGAL_BREEDING: 'Suspected illegal breeding',
  EXOTIC_ANIMAL: 'Exotic/prohibited animal',
  LIVESTOCK_AT_LARGE: 'Livestock at large',
  WILDLIFE_CONFLICT: 'Wildlife conflict',
  OTHER_LAW_CONCERN: 'Other legal concern',
};

/**
 * Group trigger categories by type (for UI organization)
 */
export const TRIGGER_CATEGORY_GROUPS = {
  'Cruelty & Neglect': [
    'CRUELTY_SUSPECTED',
    'NEGLECT_SUSPECTED',
    'ABANDONMENT',
    'HOARDING_SITUATION',
    'INADEQUATE_SHELTER',
    'NO_FOOD_WATER',
    'MEDICAL_NEGLECT',
  ] as LawTriggerCategory[],

  'Dangerous Animals': [
    'BITE_INCIDENT',
    'ATTACK_ON_HUMAN',
    'ATTACK_ON_ANIMAL',
    'AGGRESSIVE_BEHAVIOR',
    'VICIOUS_ANIMAL',
    'UNPROVOKED_AGGRESSION',
  ] as LawTriggerCategory[],

  'Public Safety': [
    'AT_LARGE_HAZARD',
    'PUBLIC_NUISANCE',
    'TRAFFIC_HAZARD',
    'PACK_BEHAVIOR',
    'REPEATED_ESCAPE',
  ] as LawTriggerCategory[],

  'Health & Condition': [
    'INJURED_SEVERE',
    'INJURED_MODERATE',
    'SICK_CONTAGIOUS',
    'DECEASED_ANIMAL',
    'RABIES_EXPOSURE',
  ] as LawTriggerCategory[],

  'Tethering & Confinement': [
    'TETHERING_VIOLATION',
    'INADEQUATE_CONFINEMENT',
    'EXTREME_WEATHER_EXPOSURE',
  ] as LawTriggerCategory[],

  'Other': [
    'ILLEGAL_BREEDING',
    'EXOTIC_ANIMAL',
    'LIVESTOCK_AT_LARGE',
    'WILDLIFE_CONFLICT',
    'OTHER_LAW_CONCERN',
  ] as LawTriggerCategory[],
};
