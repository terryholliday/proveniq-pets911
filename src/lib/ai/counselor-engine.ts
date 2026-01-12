/**
 * CLINICAL RESPONSE GENERATION ENGINE
 * 
 * Extracted for testability. This module contains the core response generation
 * logic for the Pet Crisis Support Companion.
 * 
 * CONFIGURATION DRIVEN (Bishop Protocol):
 * All markers and templates are defined in companion-config.json.
 */

import companionConfig from '../config/companion-config.json';

const { MARKERS, TEMPLATES, HOTLINES } = companionConfig as any;

export interface Message {
  id: string;
  role: 'companion' | 'user';
  content: string;
  timestamp: Date;
}

export interface ResponseAnalysis {
  category: string;
  suicideRiskLevel: 'none' | 'passive' | 'active' | 'intent';
  requiresEscalation: boolean;
  detectedMarkers: string[];
}

// ═══════════════════════════════════════════════════════════════════
// MARKER DEFINITIONS (Extracted from config)
// ═══════════════════════════════════════════════════════════════════

export const SUICIDE_MARKERS = MARKERS.SUICIDE;
export const MDD_MARKERS = MARKERS.MDD;
export const PARALYSIS_MARKERS = MARKERS.PARALYSIS;
export const NEURODIVERGENT_MARKERS = MARKERS.NEURODIVERGENT;
export const DEATH_KEYWORDS = MARKERS.DEATH;
export const ANTICIPATORY_KEYWORDS = MARKERS.ANTICIPATORY;
export const EMERGENCY_KEYWORDS = MARKERS.EMERGENCY;
export const SCAM_KEYWORDS = MARKERS.SCAM;
export const LOST_PET_KEYWORDS = MARKERS.LOST_PET;
export const FOUND_PET_KEYWORDS = MARKERS.FOUND_PET;
export const GUILT_KEYWORDS = MARKERS.GUILT;
export const DISENFRANCHISED_KEYWORDS = MARKERS.DISENFRANCHISED;
export const PEDIATRIC_KEYWORDS = MARKERS.PEDIATRIC;
export const EUTHANASIA_DECISION_KEYWORDS = MARKERS.EUTHANASIA_DECISION;
export const DV_COERCIVE_CONTROL_KEYWORDS = MARKERS.DV_COERCIVE_CONTROL;
export const DV_IMMEDIATE_DANGER_KEYWORDS = MARKERS.DV_IMMEDIATE_DANGER;
export const VET_MED_CRISIS_KEYWORDS = MARKERS.VET_MED_CRISIS;
export const THEFT_DISPUTE_KEYWORDS = MARKERS.THEFT_DISPUTE;
export const SUBSTANCE_USE_KEYWORDS = MARKERS.SUBSTANCE_USE;
export const HOARDING_WELFARE_KEYWORDS = MARKERS.HOARDING_WELFARE;
export const PANIC_ATTACK_KEYWORDS = MARKERS.PANIC_ATTACK;

export function detectDvCoerciveControl(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = DV_COERCIVE_CONTROL_KEYWORDS.filter((k: string) => lowerInput.includes(k));

  return {
    detected: matches.length > 0,
    markers: matches
  };
}

export function detectDvImmediateDanger(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = DV_IMMEDIATE_DANGER_KEYWORDS.filter((k: string) => lowerInput.includes(k));

  return {
    detected: matches.length > 0 || lowerInput.includes('going to kill me') || lowerInput.includes('locked in'),
    markers: matches
  };
}

// ═══════════════════════════════════════════════════════════════════
// RESPONSE TEMPLATES AND INTERPOLATION
// ═══════════════════════════════════════════════════════════════════

export const RESPONSE_TEMPLATES = {
  suicide_intent: { ...TEMPLATES.suicide_intent },
  suicide_active: { ...TEMPLATES.suicide_active },
  suicide_passive: { ...TEMPLATES.suicide_passive },
  dv_coercive_control: { ...TEMPLATES.dv_coercive_control },
  mdd: { ...TEMPLATES.mdd },
  paralysis: { ...TEMPLATES.paralysis },
  neurodivergent: { ...TEMPLATES.neurodivergent },
  death_traumatic: { ...TEMPLATES.death_traumatic },
  death_euthanasia: { ...TEMPLATES.death_euthanasia },
  death_general: { ...TEMPLATES.death_general },
  death_found_deceased: { ...TEMPLATES.death_found_deceased },
  anticipatory: { ...TEMPLATES.anticipatory },
  emergency: { ...TEMPLATES.emergency_veterinary },
  scam: { ...TEMPLATES.scam_alert },
  found_pet: { ...TEMPLATES.found_pet },
  lost_pet: { ...TEMPLATES.lost_pet },
  guilt_cbt: { ...TEMPLATES.guilt_cbt },
  disenfranchised: { ...TEMPLATES.disenfranchised },
  pediatric: { ...TEMPLATES.pediatric },
  quality_of_life: { ...TEMPLATES.quality_of_life },
  general: { ...TEMPLATES.general },
};

function detectRegion(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('999') || lower.includes('112') || lower.includes('nhs') || lower.includes('rspca') || lower.includes('uk')) return 'UK';
  if (lower.includes('cad') || lower.includes('rcmp') || lower.includes('canada')) return 'CA';
  if (lower.includes('au') || lower.includes('australia') || lower.includes('lifeline')) return 'AU';
  return 'US'; // Default
}

function interpolateResponse(text: string, region: string): string {
  // First, replace {REGION} with the detected region
  let result = text.replace(/\{REGION\}/g, region);

  // Now resolve {HOTLINES.PATH} or {HOTLINES.{REGION}.PATH}
  // This handles nested paths by checking the HOTLINES object
  const hotlineRegex = /\{HOTLINES\.([a-zA-Z0-9_.]+)\}/g;

  // Basic recursive replacement for nested placeholders like {HOTLINES.{REGION}.crisis_988}
  // Since we already replaced {REGION}, it should be {HOTLINES.US.crisis_988} now.

  return result.replace(hotlineRegex, (match, path) => {
    const parts = path.split('.');
    let current = HOTLINES;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return match; // Return original if path not found
      }
    }
    return typeof current === 'string' ? current : match;
  });
}

// ═══════════════════════════════════════════════════════════════════
// ANALYSIS FUNCTIONS (Exported for testing)
// ═══════════════════════════════════════════════════════════════════

export function analyzeSuicideRisk(input: string): { level: 'none' | 'passive' | 'active' | 'intent'; markers: string[] } {
  const lowerInput = input.toLowerCase();

  // 4A) Negation Guard
  const negationPattern = /\b(don't|do not|never|won't|doesn't|didn't)\s+(\w+\s+){0,3}(want to die|kill myself|end it|hurt myself)/i;
  const hasNegation = negationPattern.test(input);

  // 4B) Attribution Guard
  const attributionPattern = /["']([^"']*(?:want to die|kill myself|end it|hurt myself)[^"']*)["']/i;
  const someoneElsePattern = /\b(he|she|they|said|told me|my friend|someone)\s+(wants to|wants|is going to|is trying to)\s+(die|kill|end it)/i;
  const hasAttribution = attributionPattern.test(input) || someoneElsePattern.test(input);

  // 4C) Intent Override - explicit intent always wins
  const intentMatches = SUICIDE_MARKERS.intent.filter((m: string) => lowerInput.includes(m));
  if (intentMatches.length > 0) {
    const intentInNegation = hasNegation && intentMatches.some((m: string) =>
      lowerInput.includes(m) && negationPattern.test(input)
    );
    const intentAttributed = hasAttribution && intentMatches.some((m: string) =>
      lowerInput.includes(m)
    );

    if (!intentInNegation && !intentAttributed) {
      return { level: 'intent', markers: intentMatches };
    }
  }

  const activeMatches = SUICIDE_MARKERS.active.filter((m: string) => lowerInput.includes(m));
  if (activeMatches.length > 0) {
    const activeInNegation = hasNegation && activeMatches.some((m: string) =>
      lowerInput.includes(m) && negationPattern.test(input)
    );
    const activeAttributed = hasAttribution && activeMatches.some((m: string) =>
      lowerInput.includes(m)
    );

    if (!activeInNegation && !activeAttributed) {
      return { level: 'active', markers: activeMatches };
    }
  }

  const passiveMatches = SUICIDE_MARKERS.passive.filter((m: string) => lowerInput.includes(m));
  if (passiveMatches.length > 0) {
    const passiveInNegation = hasNegation && passiveMatches.some((m: string) =>
      lowerInput.includes(m) && negationPattern.test(input)
    );
    const passiveAttributed = hasAttribution && passiveMatches.some((m: string) =>
      lowerInput.includes(m)
    );

    if (!passiveInNegation && !passiveAttributed) {
      return { level: 'passive', markers: passiveMatches };
    }
  }

  return { level: 'none', markers: [] };
}

export function detectMDD(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = MDD_MARKERS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectGriefParalysis(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = PARALYSIS_MARKERS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectNeurodivergent(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = NEURODIVERGENT_MARKERS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectDeathGrief(input: string): {
  detected: boolean;
  isTraumatic: boolean;
  isEuthanasia: boolean;
  isFoundDeceased: boolean;
  markers: string[]
} {
  const lowerInput = input.toLowerCase();
  const matches = DEATH_KEYWORDS.filter((m: string) => lowerInput.includes(m));

  // Expanded traumatic detection
  const isTraumatic = lowerInput.includes('hit by') ||
    lowerInput.includes('ran over') ||
    lowerInput.includes('attacked') ||
    lowerInput.includes('killed') ||
    lowerInput.includes('murdered') ||
    lowerInput.includes('poisoned') ||
    lowerInput.includes('coyote') ||
    lowerInput.includes('mauled');

  // Expanded euthanasia detection
  const isEuthanasia = lowerInput.includes('put down') ||
    lowerInput.includes('put to sleep') ||
    lowerInput.includes('euthaniz') ||
    lowerInput.includes('had to put') ||
    lowerInput.includes('putting her down') ||
    lowerInput.includes('putting him down') ||
    lowerInput.includes('putting them down') ||
    (lowerInput.includes('put') && lowerInput.includes('down') &&
      (lowerInput.includes('dog') || lowerInput.includes('cat') || lowerInput.includes('pet'))) ||
    (lowerInput.includes('put') && lowerInput.includes('sleep') &&
      (lowerInput.includes('dog') || lowerInput.includes('cat') || lowerInput.includes('pet')));

  const isFoundDeceased = lowerInput.includes('found dead') ||
    lowerInput.includes('found a dead') ||
    lowerInput.includes('there\'s a dead') ||
    lowerInput.includes('saw a dead') ||
    lowerInput.includes('found deceased') ||
    lowerInput.includes('found my') && lowerInput.includes('dead');

  return {
    detected: matches.length > 0 || isTraumatic || isEuthanasia || isFoundDeceased,
    isTraumatic,
    isEuthanasia,
    isFoundDeceased,
    markers: matches
  };
}

export function detectScam(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = SCAM_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectGuilt(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = GUILT_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectDisenfranchised(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = DISENFRANCHISED_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectPediatric(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = PEDIATRIC_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectAnticipatory(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = ANTICIPATORY_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length >= 2, markers: matches };
}

export function detectEmergency(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = EMERGENCY_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectFoundPet(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = FOUND_PET_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectVetMedCrisis(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = VET_MED_CRISIS_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0 || lowerInput.includes('vet tech burnout'), markers: matches };
}

export function detectTheftDispute(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = THEFT_DISPUTE_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0 || lowerInput.includes('stole my dog') || lowerInput.includes('stole my cat'), markers: matches };
}

export function detectSubstanceUse(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = SUBSTANCE_USE_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectHoardingWelfare(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = HOARDING_WELFARE_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectPanicAttack(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = PANIC_ATTACK_KEYWORDS.filter((m: string) => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

// ═══════════════════════════════════════════════════════════════════

export function generateCompanionResponse(userInput: string): { response: string; analysis: ResponseAnalysis } {
  const region = detectRegion(userInput);
  const result = _internalGenerateResponse(userInput);
  return {
    ...result,
    response: interpolateResponse(result.response, region)
  };
}

function _internalGenerateResponse(userInput: string): { response: string; analysis: ResponseAnalysis } {
  const suicideRisk = analyzeSuicideRisk(userInput);

  if (suicideRisk.level === 'intent') {
    return {
      response: RESPONSE_TEMPLATES.suicide_intent.response,
      analysis: {
        category: 'suicide_intent',
        suicideRiskLevel: 'intent',
        requiresEscalation: true,
        detectedMarkers: suicideRisk.markers
      }
    };
  }

  if (suicideRisk.level === 'active') {
    return {
      response: RESPONSE_TEMPLATES.suicide_active.response,
      analysis: {
        category: 'suicide_active',
        suicideRiskLevel: 'active',
        requiresEscalation: true,
        detectedMarkers: suicideRisk.markers
      }
    };
  }

  if (suicideRisk.level === 'passive') {
    return {
      response: RESPONSE_TEMPLATES.suicide_passive.response,
      analysis: {
        category: 'suicide_passive',
        suicideRiskLevel: 'passive',
        requiresEscalation: true,
        detectedMarkers: suicideRisk.markers
      }
    };
  }

  const dvid = detectDvImmediateDanger(userInput);
  const dvcc = detectDvCoerciveControl(userInput);
  if (dvid.detected || dvcc.detected) {
    const detectedMarkers = [...(dvid.markers || []), ...(dvcc.markers || [])];
    return {
      response: RESPONSE_TEMPLATES.dv_coercive_control.response,
      analysis: {
        category: 'dv_coercive_control',
        suicideRiskLevel: 'none',
        requiresEscalation: true,
        detectedMarkers
      }
    };
  }

  const death = detectDeathGrief(userInput);

  const mdd = detectMDD(userInput);
  if (mdd.detected) {
    // Avoid misclassifying euthanasia self-judgment as MDD when it is better handled as grief support.
    const euthanasiaSelfJudgmentOnly = death.isEuthanasia &&
      mdd.markers.length === 1 &&
      mdd.markers[0] === "i'm a terrible person";

    if (euthanasiaSelfJudgmentOnly) {
      // Fall through to death/euthanasia routing.
    } else {
      return {
        response: RESPONSE_TEMPLATES.mdd.response,
        analysis: {
          category: 'mdd',
          suicideRiskLevel: 'none',
          requiresEscalation: true,
          detectedMarkers: mdd.markers
        }
      };
    }
  }

  const paralysis = detectGriefParalysis(userInput);
  if (paralysis.detected) {
    return {
      response: RESPONSE_TEMPLATES.paralysis.response,
      analysis: {
        category: 'paralysis',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: paralysis.markers
      }
    };
  }

  const neuro = detectNeurodivergent(userInput);
  if (neuro.detected) {
    return {
      response: RESPONSE_TEMPLATES.neurodivergent.response,
      analysis: {
        category: 'neurodivergent',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: neuro.markers
      }
    };
  }

  if (death.detected) {
    if (death.isTraumatic) {
      return {
        response: RESPONSE_TEMPLATES.death_traumatic.response,
        analysis: {
          category: 'death_traumatic',
          suicideRiskLevel: 'none',
          requiresEscalation: false,
          detectedMarkers: death.markers
        }
      };
    }

    if (death.isEuthanasia) {
      return {
        response: RESPONSE_TEMPLATES.death_euthanasia.response,
        analysis: {
          category: 'death_euthanasia',
          suicideRiskLevel: 'none',
          requiresEscalation: false,
          detectedMarkers: death.markers
        }
      };
    }

    if (!death.isFoundDeceased) {
      return {
        response: RESPONSE_TEMPLATES.death_general.response,
        analysis: {
          category: 'death_general',
          suicideRiskLevel: 'none',
          requiresEscalation: false,
          detectedMarkers: death.markers
        }
      };
    }

    return {
      response: RESPONSE_TEMPLATES.death_found_deceased.response,
      analysis: {
        category: 'death_found_deceased',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: death.markers
      }
    };
  }

  const anticipatory = detectAnticipatory(userInput);
  if (anticipatory.detected) {
    return {
      response: RESPONSE_TEMPLATES.anticipatory.response,
      analysis: {
        category: 'anticipatory',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: anticipatory.markers
      }
    };
  }

  const emergency = detectEmergency(userInput);
  const vetMed = detectVetMedCrisis(userInput);
  if (emergency.detected) {
    return {
      response: RESPONSE_TEMPLATES.emergency.response,
      analysis: {
        category: 'emergency',
        suicideRiskLevel: 'none',
        requiresEscalation: true,
        detectedMarkers: emergency.markers
      }
    };
  }

  if (vetMed.detected) {
    return {
      response: RESPONSE_TEMPLATES.emergency.response,
      analysis: {
        category: 'emergency',
        suicideRiskLevel: 'none',
        requiresEscalation: true,
        detectedMarkers: vetMed.markers,
      },
    };
  }

  const scam = detectScam(userInput);
  if (scam.detected) {
    return {
      response: RESPONSE_TEMPLATES.scam.response,
      analysis: {
        category: 'scam',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: scam.markers
      }
    };
  }

  const foundPet = detectFoundPet(userInput);
  if (foundPet.detected) {
    return {
      response: RESPONSE_TEMPLATES.found_pet.response,
      analysis: {
        category: 'found_pet',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: foundPet.markers
      }
    };
  }

  const lowerInput = userInput.toLowerCase();
  const lostKeywords = LOST_PET_KEYWORDS.filter((k: string) => lowerInput.includes(k));
  if (lostKeywords.length > 0 && !death.detected) {
    return {
      response: RESPONSE_TEMPLATES.lost_pet.response,
      analysis: {
        category: 'lost_pet',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: lostKeywords
      }
    };
  }

  const guilt = detectGuilt(userInput);
  if (guilt.detected) {
    return {
      response: RESPONSE_TEMPLATES.guilt_cbt.response,
      analysis: {
        category: 'guilt_cbt',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: guilt.markers
      }
    };
  }

  const disenfranchised = detectDisenfranchised(userInput);
  if (disenfranchised.detected) {
    return {
      response: RESPONSE_TEMPLATES.disenfranchised.response,
      analysis: {
        category: 'disenfranchised',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: disenfranchised.markers
      }
    };
  }

  const pediatric = detectPediatric(userInput);
  if (pediatric.detected) {
    return {
      response: RESPONSE_TEMPLATES.pediatric.response,
      analysis: {
        category: 'pediatric',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: pediatric.markers
      }
    };
  }

  const qolKeywords = EUTHANASIA_DECISION_KEYWORDS.filter((k: string) => lowerInput.includes(k));
  if (qolKeywords.length > 0) {
    return {
      response: RESPONSE_TEMPLATES.quality_of_life.response,
      analysis: {
        category: 'quality_of_life',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: qolKeywords
      }
    };
  }

  return {
    response: RESPONSE_TEMPLATES.general.response,
    analysis: {
      category: 'general',
      suicideRiskLevel: 'none',
      requiresEscalation: false,
      detectedMarkers: []
    }
  };
}
