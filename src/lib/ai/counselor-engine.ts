/**
 * CLINICAL RESPONSE GENERATION ENGINE
 * 
 * Extracted for testability. This module contains the core response generation
 * logic for the Pet Crisis Support Companion.
 * 
 * Based on:
 * - Kenneth Doka's Disenfranchised Grief theory
 * - Pauline Boss's Ambiguous Loss framework
 * - CBT protocols for guilt restructuring
 * - Trauma-Informed Care principles
 * - SPIKES Protocol for euthanasia decision support
 * 
 * PRIORITY ORDER (CRITICAL - DO NOT REORDER):
 * 0. SUICIDE RISK TRIAGE - ALWAYS CHECK FIRST
 * 1. MDD DETECTION - Professional referral needed
 * 2. GRIEF PARALYSIS - Opposite Action technique
 * 3. NEURODIVERGENT - Special attachment acknowledgment
 * 4. DEATH/GRIEF - Pet has died
 * 5. ANTICIPATORY GRIEF - Pet is dying/terminal
 * 6. EMERGENCY - Injury, immediate danger
 * 7. SCAM WARNING - Suspicious contact
 * 8. LOST PET - Missing pet (ambiguous loss)
 * 9. FOUND PET - Living pet needs reunification
 * 10. GUILT ("IF ONLY") - CBT intervention
 * 11. DISENFRANCHISED - Society minimizing grief
 * 12. PEDIATRIC - Parent helping child
 * 13. QUALITY OF LIFE - Euthanasia decision support
 * 14. EMOTIONAL SUPPORT - General distress
 * 15. PRACTICAL GUIDANCE - Search tips, resources
 */

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
// MARKER DEFINITIONS (Exported for testing)
// ═══════════════════════════════════════════════════════════════════

export const SUICIDE_MARKERS = {
  passive: [
    'wish i hadn\'t woken up', 'don\'t want to be here',
    'what\'s the point', 'no point anymore', 'can\'t do this anymore',
    'don\'t want to go on', 'nothing matters', 'empty without',
    'can\'t live without', 'life is meaningless'
  ],
  active: [
    'want to join', 'join them', 'be with them', 'want to die',
    'want to end', 'don\'t want to live', 'rather be dead',
    'kill myself', 'end it all', 'end my life'
  ],
  intent: [
    'have pills', 'have a plan', 'tonight', 'going to do it',
    'goodbye', 'this is it', 'final', 'last message'
  ]
};

export const MDD_MARKERS = [
  'i am worthless', 'i\'m worthless', 'i destroy everything',
  'i ruin everything', 'everyone would be better off',
  'i hate myself', 'i\'m a terrible person', 'i can\'t do anything right',
  'everything i touch', 'i always fail', 'i\'m broken',
  'no one could love', 'i don\'t deserve'
];

export const PARALYSIS_MARKERS = [
  'can\'t get out of bed', 'haven\'t eaten', 'can\'t eat',
  'can\'t sleep', 'haven\'t slept', 'can\'t function',
  'can\'t do anything', 'just lay here', 'haven\'t left',
  'stopped', 'given up', 'paralyzed', 'frozen', 'stuck'
];

export const NEURODIVERGENT_MARKERS = [
  'autistic', 'autism', 'adhd', 'neurodivergent', 'on the spectrum',
  'only friend', 'only one who understood', 'didn\'t judge me',
  'sensory', 'routine', 'couldn\'t connect with people'
];

export const DEATH_KEYWORDS = [
  'dead', 'died', 'death', 'passed away', 'passed on', 'gone', 
  'killed', 'hit by', 'ran over', 'struck by',
  'put down', 'put to sleep', 'euthanize', 'euthanized', 'euthanasia',
  'had to put', // "had to put our dog down"
  'didn\'t make it', 'didn\'t survive', 'lost him', 'lost her', 'lost them',
  'no longer with us', 'crossed the rainbow bridge', 'rainbow bridge',
  'found dead', 'found deceased', 'body', 'remains',
  'murdered', 'poisoned', 'attacked and killed'
];

export const ANTICIPATORY_KEYWORDS = [
  'dying', 'terminal', 'cancer', 'tumor', 'not long',
  'vet says', 'doctor says', 'doesn\'t have long',
  'last days', 'saying goodbye', 'preparing to',
  'going to lose', 'going to put', 'have to put',
  'making the decision', 'hardest decision'
];

export const EMERGENCY_KEYWORDS = [
  'emergency', 'hurt', 'injured', 'bleeding', 'broken',
  'not breathing', 'unconscious', 'seizure', 'poisoned',
  'ate something', 'swallowed', 'choking', 'can\'t walk',
  'hit by car', 'accident', 'attacked', 'bitten'
];

export const SCAM_KEYWORDS = [
  'verification code', 'verify you', 'prove you',
  'send money first', 'shipping fee', 'transport fee',
  'different state', 'another city', 'flight nanny',
  'pay before', 'won\'t meet', 'sounds suspicious',
  'asking for money', 'wants payment', 'wire money',
  'western union', 'zelle', 'cashapp', 'gift card'
];

export const LOST_PET_KEYWORDS = [
  'lost', 'missing', 'can\'t find', 'ran away', 'escaped',
  'got out', 'slipped out', 'ran off', 'disappeared',
  'haven\'t seen', 'searching for'
];

export const FOUND_PET_KEYWORDS = ['found a', 'found this', 'there\'s a', 'stray', 'wandering'];

export const GUILT_KEYWORDS = [
  'my fault', 'blame myself', 'should have', 'shouldn\'t have',
  'feel guilty', 'if only', 'i failed', 'failed them',
  'could have prevented', 'why didn\'t i', 'i let', 'let them down',
  'bad owner', 'bad parent', 'terrible person', 'never forgive myself'
];

export const DISENFRANCHISED_KEYWORDS = [
  'just a', 'only a', 'silly', 'stupid', 'crazy',
  'people think', 'others don\'t understand', 'no one understands',
  'shouldn\'t be this upset', 'overreacting', 'too much',
  'it\'s just', 'just an animal', 'get another', 'move on'
];

export const PEDIATRIC_KEYWORDS = [
  'my child', 'my kid', 'my daughter', 'my son', 
  'tell my', 'explain to', 'how do i tell',
  'kids are', 'children', 'little one'
];

export const EUTHANASIA_DECISION_KEYWORDS = [
  'how do i know when', 'when is it time', 'quality of life',
  'is it selfish', 'am i being selfish', 'right time',
  'too soon', 'too late', 'suffering', 'in pain',
  'good days', 'bad days', 'eating', 'not eating'
];

// ═══════════════════════════════════════════════════════════════════
// RESPONSE TEMPLATES (Exported for testing validation)
// ═══════════════════════════════════════════════════════════════════

export const RESPONSE_TEMPLATES = {
  suicide_intent: {
    mustContain: ['988', 'Your life matters', '865-755-8839'],
    mustNotContain: ['just a', 'get another pet']
  },
  suicide_active: {
    mustContain: ['988', 'your life has value'],
    mustNotContain: ['calm down', 'don\'t worry']
  },
  suicide_passive: {
    mustContain: ['ASPCA Pet Loss Hotline', '988'],
    mustNotContain: ['overreacting']
  },
  mdd: {
    mustContain: ['worthlessness', 'depression', 'SAMHSA', '988'],
    mustNotContain: ['just grief']
  },
  paralysis: {
    mustContain: ['Opposite Action', 'grief shock'],
    mustNotContain: ['snap out of it', 'get over it']
  },
  neurodivergent: {
    mustContain: ['differently', 'valid', 'anchor'],
    mustNotContain: ['just a pet', 'overreacting']
  },
  death_traumatic: {
    mustContain: ['deeply sorry', 'devastating', 'grief is valid'],
    mustNotContain: ['at least', 'better place', 'get another']
  },
  death_euthanasia: {
    mustContain: ['hardest things', 'profound love', 'gift of a peaceful passing'],
    mustNotContain: ['killed', 'wrong decision']
  },
  death_general: {
    mustContain: ['deeply sorry', 'family member', 'no timeline for grief'],
    mustNotContain: ['just a', 'move on', 'get another']
  },
  anticipatory: {
    mustContain: ['Anticipatory grief', 'losing them slowly'],
    mustNotContain: ['hurry up', 'get it over with']
  },
  scam: {
    mustContain: ['SCAM ALERT', 'NEVER', 'verification code'],
    mustNotContain: []
  },
  lost_pet: {
    mustContain: ['70%', '1 mile'],
    mustNotContain: ['probably dead', 'give up']
  },
  guilt_cbt: {
    mustContain: ['Outcome vs. Intent', 'Puzzle Metaphor', 'Hindsight'],
    mustNotContain: ['your fault', 'you should have']
  },
  disenfranchised: {
    mustContain: ['NOT \'just\'', 'family member', 'biology'],
    mustNotContain: ['overreacting', 'too much']
  },
  pediatric: {
    mustContain: ['Ages 3-5', 'Ages 6-9', 'body stopped working'],
    mustNotContain: ['put to sleep']
  },
  quality_of_life: {
    mustContain: ['HHHHHMM', 'Hurt', 'Hunger', 'More good days than bad'],
    mustNotContain: ['just do it', 'hurry up']
  }
};

// ═══════════════════════════════════════════════════════════════════
// ANALYSIS FUNCTIONS (Exported for testing)
// ═══════════════════════════════════════════════════════════════════

export function analyzeSuicideRisk(input: string): { level: 'none' | 'passive' | 'active' | 'intent'; markers: string[] } {
  const lowerInput = input.toLowerCase();
  
  const intentMatches = SUICIDE_MARKERS.intent.filter(m => lowerInput.includes(m));
  if (intentMatches.length > 0) {
    return { level: 'intent', markers: intentMatches };
  }
  
  const activeMatches = SUICIDE_MARKERS.active.filter(m => lowerInput.includes(m));
  if (activeMatches.length > 0) {
    return { level: 'active', markers: activeMatches };
  }
  
  const passiveMatches = SUICIDE_MARKERS.passive.filter(m => lowerInput.includes(m));
  if (passiveMatches.length > 0) {
    return { level: 'passive', markers: passiveMatches };
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
  
  // Expanded euthanasia detection - handle "put [pet] down" pattern
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
                          lowerInput.includes('saw a dead');
  
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

// ═══════════════════════════════════════════════════════════════════
// MAIN RESPONSE GENERATOR
// ═══════════════════════════════════════════════════════════════════

export function generateCompanionResponse(
  userInput: string, 
  history: Message[] = [], 
  crisisType?: string
): { response: string; analysis: ResponseAnalysis } {
  const lowerInput = userInput.toLowerCase();
  const messageCount = history.filter(m => m.role === 'user').length;
  
  // PRIORITY 0: SUICIDE RISK TRIAGE
  const suicideRisk = analyzeSuicideRisk(userInput);
  
  if (suicideRisk.level === 'intent') {
    return {
      response: "I'm hearing something that concerns me deeply, and I need to pause our conversation about your pet.\n\n**Your life matters. You matter.**\n\nPlease reach out right now:\n\n📞 **988** - Suicide & Crisis Lifeline (call or text)\n📞 **865-755-8839** - Veterinary Social Work Helpline\n\nIf you're in immediate danger, please call 911.\n\nI know the pain of losing a pet can feel unbearable. But this crisis line has people trained specifically to help with grief that feels overwhelming. Will you call them?",
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
      response: "I'm concerned about what you just shared. The pain of losing a pet can be overwhelming—your brain is processing real trauma, and that pain is valid.\n\nBut I want you to know: **your life has value beyond this moment of grief.**\n\nPlease consider reaching out:\n📞 **988** - Suicide & Crisis Lifeline\n📞 **865-755-8839** - Veterinary Social Work Helpline (they specialize in pet loss grief)\n\nThese lines have people who understand that pet loss is real loss. You don't have to carry this alone.\n\nI'm still here. Would you like to tell me about your pet?",
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
      response: "I hear the heaviness in your words. When we lose a pet, we lose a source of daily comfort, routine, and unconditional love. It makes sense that the world feels emptier.\n\nThese feelings are a testament to how much they meant to you. But if these feelings become too heavy to carry, please know there are people trained to help:\n\n📞 **ASPCA Pet Loss Hotline: 1-877-474-3310**\n📞 **988** - If you ever feel unsafe\n\nYou're not silly for grieving this deeply. You're human.\n\nWould you like to tell me about them?",
      analysis: {
        category: 'suicide_passive',
        suicideRiskLevel: 'passive',
        requiresEscalation: false,
        detectedMarkers: suicideRisk.markers
      }
    };
  }
  
  // MDD DETECTION
  const mdd = detectMDD(userInput);
  if (mdd.detected) {
    return {
      response: "I'm noticing something important in what you've shared. The feelings you're describing—the sense of worthlessness, of being fundamentally flawed—these go beyond grief for your pet.\n\nGrief says \"I miss them.\" What you're describing sounds more like depression saying \"I am defective.\"\n\n**This distinction matters.** If these feelings of worthlessness persist even in areas unconnected to your pet, please consider speaking with a mental health professional. This isn't weakness—it's wisdom.\n\n📞 **988** - Suicide & Crisis Lifeline (also for depression)\n📞 **SAMHSA: 1-800-662-4357** - Mental health referrals\n\nYour pet loved you. Depression lies about who you are. Would you like to talk more about what you're experiencing?",
      analysis: {
        category: 'mdd',
        suicideRiskLevel: 'none',
        requiresEscalation: true,
        detectedMarkers: mdd.markers
      }
    };
  }
  
  // GRIEF PARALYSIS
  const paralysis = detectGriefParalysis(userInput);
  if (paralysis.detected) {
    return {
      response: "Your body and mind are in grief shock. What you're describing—the paralysis, the inability to function—is a physiological response to loss, not a character flaw.\n\nBut here's what we know: **grief feeds on stillness.** The emotion wants you to stay frozen.\n\n**Opposite Action** is a technique that can help:\n• If you can't eat → Take one bite of anything. Just one.\n• If you can't get up → Put your feet on the floor for 30 seconds.\n• If you can't leave → Open a window. Let air touch your face.\n\nThese aren't about \"getting over it.\" They're about reminding your nervous system that you're still here, still alive.\n\nYour pet would want you to take care of yourself. What's one tiny thing you could try right now?",
      analysis: {
        category: 'paralysis',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: paralysis.markers
      }
    };
  }
  
  // NEURODIVERGENT
  const neuro = detectNeurodivergent(userInput);
  if (neuro.detected) {
    return {
      response: "I hear you, and I want you to know: **this loss may be hitting you differently than it would others, and that's completely valid.**\n\nFor many neurodivergent people, a pet isn't just a companion—they're often the primary source of safe, regulated connection in a world that feels overwhelming. Your pet didn't require masking. They didn't judge your stims or your need for routine. They just loved you.\n\nLosing that is not \"just losing a pet.\" It's losing your anchor.\n\nYour grief may be more intense than others expect. That's not wrong—it's proportional to what you lost.\n\nWould you like to tell me about your pet? About the ways they helped you navigate the world?",
      analysis: {
        category: 'neurodivergent',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: neuro.markers
      }
    };
  }
  
  // DEATH & GRIEF
  const death = detectDeathGrief(userInput);
  if (death.detected && !death.isFoundDeceased) {
    if (death.isTraumatic) {
      return {
        response: "I am so deeply sorry. What happened to your pet is devastating, and the shock of losing them this way makes it even harder to bear. There are no words that can take away this pain.\n\nPlease know that your grief is valid. Your pet knew they were loved. That bond doesn't end - it just changes form.\n\nI'm here if you want to talk about them, share a memory, or just sit in this space together. There's no right way to grieve.",
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
        response: "I'm so sorry. Making that decision is one of the hardest things a pet parent ever has to do, and it comes from a place of profound love.\n\nYou gave them the gift of a peaceful passing. You stayed with them. You put their comfort above your own pain. That is the final, greatest act of love.\n\nGrief after euthanasia is complicated - it's loss mixed with guilt, relief, and heartbreak all at once. All of those feelings are valid.\n\nWould you like to tell me about them? Sometimes sharing memories helps.",
        analysis: {
          category: 'death_euthanasia',
          suicideRiskLevel: 'none',
          requiresEscalation: false,
          detectedMarkers: death.markers
        }
      };
    }
    
    return {
      response: "I am so deeply sorry for your loss. Losing a pet is losing a family member, a companion, a piece of your daily life. The pain you're feeling is real and valid.\n\nThere's no timeline for grief. Some days will be harder than others. You might hear their collar jingle or reach down to pet them before remembering. That's normal. That's love.\n\nI'm here with you. Would you like to tell me about them? What was their name? What made them special?",
      analysis: {
        category: 'death_general',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: death.markers
      }
    };
  }
  
  // SCAM DETECTION
  const scam = detectScam(userInput);
  if (scam.detected) {
    return {
      response: "⚠️ **SCAM ALERT** - What you're describing has red flags of a common pet scam.\n\n**NEVER:**\n• Share verification codes (Google Voice scam)\n• Pay fees before meeting the pet in person\n• Wire money or use gift cards\n• Trust \"flight nanny\" or shipping services\n\n**LEGITIMATE finders:**\n• Will meet you in person at a safe public place\n• Can video chat with the pet\n• Won't ask for money before reunion\n• Will let you verify identity (collar, microchip, behavior)\n\nDid someone contact you about your pet? Tell me what they said and I can help you assess if it's legitimate.",
      analysis: {
        category: 'scam',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: scam.markers
      }
    };
  }
  
  // GUILT (CBT)
  const guilt = detectGuilt(userInput);
  if (guilt.detected) {
    return {
      response: "I hear the weight of guilt in your words. Let me help you look at this differently.\n\n**Let's check the facts together:**\n\n1. **Outcome vs. Intent:** Guilt implies you INTENDED harm. Did you?\n2. **The Puzzle Metaphor:** What happened was a puzzle with many pieces—genetics, timing, biology, chance. Your actions were ONE piece, not the whole picture.\n3. **Hindsight isn't foresight:** You're judging yourself with information you couldn't have had.\n\nCats hide illness. Dogs bolt through doors. Bodies fail suddenly. These things happen to the most devoted pet parents.\n\n**The truth:** You loved them. You did your best with what you knew. That's not the profile of someone who deserves guilt.\n\nWould you like to talk about what specifically is weighing on you?",
      analysis: {
        category: 'guilt_cbt',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: guilt.markers
      }
    };
  }
  
  // DISENFRANCHISED
  const disenfranchised = detectDisenfranchised(userInput);
  if (disenfranchised.detected) {
    return {
      response: "Let me stop you right there: **They were NOT 'just' anything.**\n\nYour pet was a family member. A source of daily comfort. A being who loved you unconditionally and regulated your stress hormones just by being near you.\n\nWhen researchers study pet loss, they find grief responses equivalent to—and sometimes MORE intense than—human bereavement. This isn't weakness. It's biology.\n\n**The people who say 'it's just a pet' have never loved like you do.** Their inability to understand says nothing about the validity of your grief.\n\nYour brain is processing a major loss. Give yourself permission to grieve fully. I'm here to witness that grief, because it matters.\n\nWould you like to tell me about them?",
      analysis: {
        category: 'disenfranchised',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: disenfranchised.markers
      }
    };
  }
  
  // PEDIATRIC
  const pediatric = detectPediatric(userInput);
  if (pediatric.detected) {
    return {
      response: "Helping a child through pet loss is one of the most important conversations you'll have as a parent. Here's age-appropriate guidance:\n\n**Ages 3-5 (Toddlers):**\n• Use concrete, biological language: \"Their body stopped working\"\n• AVOID \"put to sleep\"—causes sleep anxiety\n• They may not grasp permanence; expect repeated questions\n\n**Ages 6-9:**\n• Understand death is final\n• May fear contagion: \"Will you die too?\"\n• Reassure their safety; offer rituals (drawing, burial)\n\n**Ages 10+ / Teens:**\n• May grieve privately or with peers\n• Don't minimize their bond—it was real\n• Validate that grief is normal, not weakness\n\n**For all ages:**\n• Let them see you cry—models healthy grief\n• Answer questions honestly\n• Don't rush replacement; let them grieve first\n\nHow old is your child, and how close were they to the pet?",
      analysis: {
        category: 'pediatric',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: pediatric.markers
      }
    };
  }
  
  // QUALITY OF LIFE / EUTHANASIA DECISION
  const qolKeywords = EUTHANASIA_DECISION_KEYWORDS.filter(k => lowerInput.includes(k));
  if (qolKeywords.length > 0) {
    return {
      response: "This is one of the hardest questions a pet parent ever faces, and there's no perfect answer—only the most loving one.\n\n**The Quality of Life Scale (HHHHHMM):**\n• **Hurt** - Can their pain be managed?\n• **Hunger** - Are they eating?\n• **Hydration** - Are they drinking?\n• **Hygiene** - Can they keep themselves clean?\n• **Happiness** - Do they still have moments of joy?\n• **Mobility** - Can they move to where they want to be?\n• **More good days than bad?**\n\n**A helpful question:** \"Am I keeping them alive for THEM, or for me?\"\n\nIf you're asking this question, it often means your heart already knows. The fact that you're thinking about their quality of life—not just your own grief—is proof of how much you love them.\n\nWould it help to talk through what you're seeing day-to-day?",
      analysis: {
        category: 'quality_of_life',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: qolKeywords
      }
    };
  }
  
  // LOST PET
  const lostKeywords = LOST_PET_KEYWORDS.filter(k => lowerInput.includes(k));
  if ((lostKeywords.length > 0 || crisisType === 'lost_pet') && !death.detected) {
    return {
      response: "I'm so sorry you're going through this. The panic and fear you're feeling right now shows how much you love them.\n\nThe good news: **70% of lost dogs are found within 1 mile of home**, often within just a few blocks. Many pets are found within 24-48 hours when owners act quickly.\n\nLet's work together to bring them home. Can you tell me:\n• Their name and what they look like?\n• When and where you last saw them?\n• Do they have a collar, tags, or microchip?",
      analysis: {
        category: 'lost_pet',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: lostKeywords
      }
    };
  }
  
  // DEFAULT
  return {
    response: "I'm here to listen. Tell me more about what you're going through, and we'll figure this out together.",
    analysis: {
      category: 'general',
      suicideRiskLevel: 'none',
      requiresEscalation: false,
      detectedMarkers: []
    }
  };
}
