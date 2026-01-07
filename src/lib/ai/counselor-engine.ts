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

const { MARKERS, TEMPLATES } = companionConfig;

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

export function detectDvCoerciveControl(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = DV_COERCIVE_CONTROL_KEYWORDS.filter(k => lowerInput.includes(k));

  return {
    detected: matches.length > 0,
    markers: matches
  };
}

// ═══════════════════════════════════════════════════════════════════
// RESPONSE TEMPLATES (Extracted from config)
// ═══════════════════════════════════════════════════════════════════

export const RESPONSE_TEMPLATES = TEMPLATES;

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
  const intentMatches = SUICIDE_MARKERS.intent.filter(m => lowerInput.includes(m));
  if (intentMatches.length > 0) {
    const intentInNegation = hasNegation && intentMatches.some(m =>
      lowerInput.includes(m) && negationPattern.test(input)
    );
    const intentAttributed = hasAttribution && intentMatches.some(m =>
      lowerInput.includes(m)
    );

    if (!intentInNegation && !intentAttributed) {
      return { level: 'intent', markers: intentMatches };
    }
  }

  const activeMatches = SUICIDE_MARKERS.active.filter(m => lowerInput.includes(m));
  if (activeMatches.length > 0) {
    const activeInNegation = hasNegation && activeMatches.some(m =>
      lowerInput.includes(m) && negationPattern.test(input)
    );
    const activeAttributed = hasAttribution && activeMatches.some(m =>
      lowerInput.includes(m)
    );

    if (!activeInNegation && !activeAttributed) {
      return { level: 'active', markers: activeMatches };
    }
  }

  const passiveMatches = SUICIDE_MARKERS.passive.filter(m => lowerInput.includes(m));
  if (passiveMatches.length > 0) {
    const passiveInNegation = hasNegation && passiveMatches.some(m =>
      lowerInput.includes(m) && negationPattern.test(input)
    );
    const passiveAttributed = hasAttribution && passiveMatches.some(m =>
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
  const matches = MDD_MARKERS.filter(m => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectGriefParalysis(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = PARALYSIS_MARKERS.filter(m => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectNeurodivergent(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = NEURODIVERGENT_MARKERS.filter(m => lowerInput.includes(m));
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
  const matches = DEATH_KEYWORDS.filter(m => lowerInput.includes(m));

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
    detected: matches.length > 0,
    isTraumatic,
    isEuthanasia,
    isFoundDeceased,
    markers: matches
  };
}

export function detectScam(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = SCAM_KEYWORDS.filter(m => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectGuilt(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = GUILT_KEYWORDS.filter(m => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectDisenfranchised(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = DISENFRANCHISED_KEYWORDS.filter(m => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectPediatric(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = PEDIATRIC_KEYWORDS.filter(m => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectAnticipatory(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = ANTICIPATORY_KEYWORDS.filter(m => lowerInput.includes(m));
  return { detected: matches.length >= 2, markers: matches };
}

export function detectEmergency(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = EMERGENCY_KEYWORDS.filter(m => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

export function detectFoundPet(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = FOUND_PET_KEYWORDS.filter(m => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

// ═══════════════════════════════════════════════════════════════════

export function generateCompanionResponse(userInput: string): { response: string; analysis: ResponseAnalysis } {
  const suicideRisk = analyzeSuicideRisk(userInput);
  if (suicideRisk.level === 'intent') {
    return {
      response: TEMPLATES.suicide_intent.response,
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
      response: TEMPLATES.suicide_active.response,
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
      response: TEMPLATES.suicide_passive.response,
      analysis: {
        category: 'suicide_passive',
        suicideRiskLevel: 'passive',
        requiresEscalation: true,
        detectedMarkers: suicideRisk.markers
      }
    };
  }

  const dv = detectDvCoerciveControl(userInput);
  if (dv.detected) {
    return {
      response: TEMPLATES.dv_coercive_control.response,
      analysis: {
        category: 'dv_coercive_control',
        suicideRiskLevel: 'none',
        requiresEscalation: true,
        detectedMarkers: dv.markers
      }
    };
  }

  const mdd = detectMDD(userInput);
  if (mdd.detected) {
    return {
      response: TEMPLATES.mdd.response,
      analysis: {
        category: 'mdd',
        suicideRiskLevel: 'none',
        requiresEscalation: true,
        detectedMarkers: mdd.markers
      }
    };
  }

  const paralysis = detectGriefParalysis(userInput);
  if (paralysis.detected) {
    return {
      response: TEMPLATES.paralysis.response,
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
      response: TEMPLATES.neurodivergent.response,
      analysis: {
        category: 'neurodivergent',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: neuro.markers
      }
    };
  }

  const death = detectDeathGrief(userInput);
  if (death.detected) {
    if (death.isTraumatic) {
      return {
        response: TEMPLATES.death_traumatic.response,
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
        response: TEMPLATES.death_euthanasia.response,
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
        response: TEMPLATES.death_general.response,
        analysis: {
          category: 'death_general',
          suicideRiskLevel: 'none',
          requiresEscalation: false,
          detectedMarkers: death.markers
        }
      };
    }

    return {
      response: TEMPLATES.death_found_deceased.response,
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
      response: TEMPLATES.anticipatory.response,
      analysis: {
        category: 'anticipatory',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: anticipatory.markers
      }
    };
  }

  const emergency = detectEmergency(userInput);
  if (emergency.detected) {
    return {
      response: TEMPLATES.emergency.response,
      analysis: {
        category: 'emergency',
        suicideRiskLevel: 'none',
        requiresEscalation: true,
        detectedMarkers: emergency.markers
      }
    };
  }

  const scam = detectScam(userInput);
  if (scam.detected) {
    return {
      response: TEMPLATES.scam.response,
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
      response: TEMPLATES.found_pet.response,
      analysis: {
        category: 'found_pet',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: foundPet.markers
      }
    };
  }

  const lowerInput = userInput.toLowerCase();
  const lostKeywords = LOST_PET_KEYWORDS.filter(k => lowerInput.includes(k));
  if (lostKeywords.length > 0 && !death.detected) {
    return {
      response: TEMPLATES.lost_pet.response,
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
      response: TEMPLATES.guilt_cbt.response,
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
      response: TEMPLATES.disenfranchised.response,
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
      response: TEMPLATES.pediatric.response,
      analysis: {
        category: 'pediatric',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: pediatric.markers
      }
    };
  }

  const qolKeywords = EUTHANASIA_DECISION_KEYWORDS.filter(k => lowerInput.includes(k));
  if (qolKeywords.length > 0) {
    return {
      response: TEMPLATES.quality_of_life.response,
      analysis: {
        category: 'quality_of_life',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: qolKeywords
      }
    };
  }

  return {
    response: TEMPLATES.general.response,
    analysis: {
      category: 'general',
      suicideRiskLevel: 'none',
      requiresEscalation: false,
      detectedMarkers: []
    }
  };
}
