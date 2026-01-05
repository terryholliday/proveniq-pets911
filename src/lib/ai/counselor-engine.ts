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
  'making the decision', 'hardest decision',
  'slowly', 'losing them slowly', 'anticipating', 'anticipatory'
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

 export const DV_COERCIVE_CONTROL_KEYWORDS = [
  'domestic violence', 'abuser', 'abusive', 'he hit me', 'she hit me',
  'i am not safe', 'i don\'t feel safe', 'restraining order',
  'shelter', 'dv shelter', 'safe house',
  'he took my dog', 'she took my dog', 'he took my cat', 'she took my cat',
  'threatened my pet', 'threatened to kill my', 'hurt my pet',
  'won\'t let me leave', 'keeps me from leaving'
 ];

 export function detectDvCoerciveControl(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = DV_COERCIVE_CONTROL_KEYWORDS.filter(k => lowerInput.includes(k));

  return {
    detected: matches.length > 0,
    markers: matches
  };
 }

// ═══════════════════════════════════════════════════════════════════
// RESPONSE TEMPLATES (Exported for testing validation)
// ═══════════════════════════════════════════════════════════════════

export const RESPONSE_TEMPLATES = {
  suicide_intent: {
    response: "I'm really glad you told me. **Your life matters, and you deserve support right now.**\n\nIf you might act on these thoughts, please contact help immediately:\n\n📞 **988** (US) — call or text\n📞 **Veterinary Social Work Helpline (UT Knoxville): 865-755-8839**\n\nIf you're in immediate danger, call **911** (or your local emergency number).\n\nYou don't have to carry this alone. Are you safe right now?",
    mustContain: ['988', 'Your life matters', '865-755-8839'],
    mustNotContain: ['just a', 'get another pet']
  },
  dv_coercive_control: {
    response: "I'm really glad you told me. **If you are in immediate danger, call 911 (or your local emergency number) now.**\n\nIf you can do so safely, you can also contact the **National Domestic Violence Hotline**:\n• Call **1-800-799-7233**\n• Text **START** to **88788**\n\n**Safety + privacy note:** please **do not share your exact location, shelter address, or identifying details** here. If it is safe to share only your **state**, I can help you think through safer next steps (like who to call and what questions to ask) without revealing where you are.\n\nIf your pet is being used to control or threaten you, you are not alone — and you deserve support that keeps both you and your pet safe.",
    mustContain: ['Domestic Violence Hotline', 'If you are in immediate danger', 'do not share your exact location'],
    mustNotContain: ['what is your address', 'share your address']
  },
  suicide_active: {
    response: "I hear you, and I want you to know **your life has value**. I can't keep you safe by myself, but I can help you reach people who can.\n\n📞 **988** — call or text now\n📞 **Veterinary Social Work Helpline (UT Knoxville): 865-755-8839**\n\nIf you feel like you might act on this, call **911** (or your local emergency number).\n\nAre you alone right now?",
    mustContain: ['988', 'your life has value', '865-755-8839'],
    mustNotContain: ['calm down', 'don\'t worry']
  },
  suicide_passive: {
    response: "I hear the heaviness in your words. When we lose a pet, we lose a source of daily comfort, routine, and unconditional love. It makes sense that the world feels emptier.\n\nThese feelings are a testament to how much they meant to you. But if these feelings become too heavy to carry, please know there are people trained to help:\n\n📞 **ASPCA Pet Loss Hotline: 1-877-474-3310**\n📞 **988** - If you ever feel unsafe\n\nIf you can, tell me what happened with your pet. I'm here with you.",
    mustContain: ['ASPCA Pet Loss Hotline', '988'],
    mustNotContain: ['overreacting']
  },
  mdd: {
    response: "I'm noticing something important in what you've shared. The feelings you're describing—the sense of worthlessness, of being fundamentally flawed—these go beyond grief for your pet.\n\nGrief says \"I miss them.\" What you're describing sounds more like depression saying \"I am defective.\"\n\n**This distinction matters.** If these feelings of worthlessness persist even in areas unconnected to your pet, please consider speaking with a mental health professional. This isn't weakness—it's wisdom.\n\n📞 **988** - Suicide & Crisis Lifeline (also for depression)\n📞 **SAMHSA: 1-800-662-4357** - Mental health referrals\n\nYour pet loved you. Depression lies about who you are. Would you like to talk more about what you're experiencing?",
    mustContain: ['worthlessness', 'depression', 'SAMHSA', '988'],
    mustNotContain: ['just grief']
  },
  paralysis: {
    response: "Your body and mind are in grief shock. What you're describing—the paralysis, the inability to function—is a physiological response to loss, not a character flaw.\n\nBut here's what we know: **grief feeds on stillness.** The emotion wants you to stay frozen.\n\n**Opposite Action** is a technique that can help:\n• If you can't eat → Take one bite of anything. Just one.\n• If you can't get up → Put your feet on the floor for 30 seconds.\n• If you can't leave → Open a window. Let air touch your face.\n\nThese aren't about \"getting over it.\" They're about reminding your nervous system that you're still here, still alive.\n\nYour pet would want you to take care of yourself. What's one tiny thing you could try right now?",
    mustContain: ['Opposite Action', 'grief shock'],
    mustNotContain: ['snap out of it', 'get over it']
  },
  neurodivergent: {
    response: "I hear you, and I want you to know: **this loss may be hitting you differently than it would others, and that's completely valid.**\n\nFor many neurodivergent people, a pet isn't just a companion—they're often the primary source of safe, regulated connection in a world that feels overwhelming. Your pet didn't require masking. They didn't judge your stims or your need for routine. They just loved you.\n\nLosing that is not \"just losing a pet.\" It's losing your anchor.\n\nYour grief may be more intense than others expect. That's not wrong—it's proportional to what you lost.\n\nWould you like to tell me about your pet? About the ways they helped you navigate the world?",
    mustContain: ['differently', 'valid', 'anchor'],
    mustNotContain: ['just a pet', 'overreacting']
  },
  death_traumatic: {
    response: "I am so deeply sorry. What happened to your pet is devastating, and the shock of losing them this way makes it even harder to bear. There are no words that can take away this pain.\n\nPlease know that your grief is valid. Your pet knew they were loved. That bond doesn't end - it just changes form.\n\nI'm here if you want to talk about them, share a memory, or just sit in this space together. There's no right way to grieve.",
    mustContain: ['deeply sorry', 'devastating', 'grief is valid'],
    mustNotContain: ['at least', 'better place', 'get another']
  },
  death_euthanasia: {
    response: "I'm so sorry. Making that decision is one of the hardest things a pet parent ever has to do, and it comes from a place of profound love.\n\nYou gave them the gift of a peaceful passing. You stayed with them. You put their comfort above your own pain. That is the final, greatest act of love.\n\nGrief after euthanasia is complicated - it's loss mixed with guilt, relief, and heartbreak all at once. All of those feelings are valid.\n\nWould you like to tell me about them? Sometimes sharing memories helps.",
    mustContain: ['hardest things', 'profound love', 'gift of a peaceful passing'],
    mustNotContain: ['killed', 'wrong decision']
  },
  death_general: {
    response: "I am so deeply sorry for your loss. Losing a pet is losing a family member, a companion, a piece of your daily life. The pain you're feeling is real and valid.\n\nThere's no timeline for grief. Some days will be harder than others. You might hear their collar jingle or reach down to pet them before remembering. That's normal. That's love.\n\nI'm here with you. Would you like to tell me about them? What was their name? What made them special?",
    mustContain: ['deeply sorry', 'family member', 'no timeline for grief'],
    mustNotContain: ['just a', 'move on', 'get another']
  },
  anticipatory: {
    response: "I hear you navigating the painful space of anticipatory grief. Losing them slowly is its own kind of heartbreak—living in the space between hope and reality.\n\nThis is **Anticipatory Grief**, and it's real. You're grieving before the actual loss, which means you're doing emotional work twice. That's exhausting.\n\n**What helps:**\n• Focus on quality time, not quantity\n• Create memories while you can\n• Allow yourself to feel both hope and sadness\n• Consider memorial projects (photos, paw prints)\n\nYou're not giving up on them by preparing. You're loving them through their final chapter.\n\nHow are they doing today? What moments matter most right now?",
    mustContain: ['Anticipatory grief', 'losing them slowly'],
    mustNotContain: ['hurry up', 'get it over with']
  },
  scam: {
    response: "⚠️ **SCAM ALERT** - What you're describing has red flags of a common pet scam.\n\n**NEVER:**\n• Share verification codes (Google Voice scam)\n• Pay fees before meeting the pet in person\n• Wire money or use gift cards\n• Trust \"flight nanny\" or shipping services\n\n**LEGITIMATE finders:**\n• Will meet you in person at a safe public place\n• Can video chat with the pet\n• Won't ask for money before reunion\n• Will let you verify identity (collar, microchip, behavior)\n\nDid someone contact you about your pet? Tell me what they said and I can help you assess if it's legitimate.",
    mustContain: ['SCAM ALERT', 'NEVER', 'verification code'],
    mustNotContain: []
  },
  lost_pet: {
    response: "I'm so sorry you're going through this. The panic and fear you're feeling right now shows how much you love them.\n\nI can't predict outcomes, but we *can* focus on the steps that give you the best chance of getting them home:\n\n**Right now (next 30–60 minutes):**\n• Re-check the last-seen area slowly (quiet voice, treat bag, favorite squeaky toy).\n• Ask a neighbor to help so you can cover more ground.\n• If it is safe, leave a familiar-smelling item (blanket/shirt) near the point they got out.\n\n**Next:**\n• Call **local shelters/animal control** and ask them to scan for a **microchip** if anyone brings them in.\n• Post a clear photo + contact method, but **do not share your home address** publicly.\n\nIf you want, tell me:\n• Their name and what they look like\n• When/where you last saw them\n• Collar/tags/microchip",
    mustContain: ['do not share your address', 'microchip', 'local shelter'],
    mustNotContain: ['probably dead', 'give up']
  },
  guilt_cbt: {
    response: "I hear the weight of guilt in your words. Let me help you look at this differently.\n\n**Let's check the facts together:**\n\n1. **Outcome vs. Intent:** Guilt implies you INTENDED harm. Did you?\n2. **The Puzzle Metaphor:** What happened was a puzzle with many pieces—genetics, timing, biology, chance. Your actions were ONE piece, not the whole picture.\n3. **Hindsight isn't foresight:** You're judging yourself with information you couldn't have had.\n\nCats hide illness. Dogs bolt through doors. Bodies fail suddenly. These things happen to the most devoted pet parents.\n\n**The truth:** You loved them. You did your best with what you knew. That's not the profile of someone who deserves guilt.\n\nWould you like to talk about what specifically is weighing on you?",
    mustContain: ['Outcome vs. Intent', 'Puzzle Metaphor', 'Hindsight'],
    mustNotContain: ['your fault', 'you should have']
  },
  disenfranchised: {
    response: "Let me stop you right there: **They were NOT 'just' anything.**\n\nYour pet was a family member. A source of daily comfort. A being who loved you unconditionally and regulated your stress hormones just by being near you.\n\nWhen researchers study pet loss, they find grief responses equivalent to—and sometimes MORE intense than—human bereavement. This isn't weakness. It's biology.\n\n**The people who say 'it's just a pet' have never loved like you do.** Their inability to understand says nothing about the validity of your grief.\n\nYour brain is processing a major loss. Give yourself permission to grieve fully. I'm here to witness that grief, because it matters.\n\nWould you like to tell me about them?",
    mustContain: ['NOT \'just\'', 'family member', 'biology'],
    mustNotContain: ['overreacting', 'too much']
  },
  pediatric: {
    response: "Helping a child through pet loss is one of the most important conversations you'll have as a parent. Here's age-appropriate guidance:\n\n**Ages 3-5 (Toddlers):**\n• Use concrete, biological language: \"Their body stopped working\"\n• AVOID \"put to sleep\"—causes sleep anxiety\n• They may not grasp permanence; expect repeated questions\n\n**Ages 6-9:**\n• Understand death is final\n• May fear contagion: \"Will you die too?\"\n• Reassure their safety; offer rituals (drawing, burial)\n\n**Ages 10+ / Teens:**\n• May grieve privately or with peers\n• Don't minimize their bond—it was real\n• Validate that grief is normal, not weakness\n\n**For all ages:**\n• Let them see you cry—models healthy grief\n• Answer questions honestly\n• Don't rush replacement; let them grieve first\n\nHow old is your child, and how close were they to the pet?",
    mustContain: ['Ages 3-5', 'Ages 6-9', 'body stopped working'],
    mustNotContain: ['put to sleep']
  },
  quality_of_life: {
    response: "This is one of the hardest questions a pet parent ever faces, and there's no perfect answer—only the most loving one.\n\n**The Quality of Life Scale (HHHHHMM):**\n• **Hurt** - Can their pain be managed?\n• **Hunger** - Are they eating?\n• **Hydration** - Are they drinking?\n• **Hygiene** - Can they keep themselves clean?\n• **Happiness** - Do they still have moments of joy?\n• **Mobility** - Can they move to where they want to be?\n• **More good days than bad?**\n\n**A helpful question:** \"Am I keeping them alive for THEM, or for me?\"\n\nIf you're asking this question, it often means your heart already knows. The fact that you're thinking about their quality of life—not just your own grief—is proof of how much you love them.\n\nWould it help to talk through what you're seeing day-to-day?",
    mustContain: ['HHHHHMM', 'Hurt', 'Hunger', 'More good days than bad'],
    mustNotContain: ['just do it', 'hurry up']
  },
  death_found_deceased: {
    response: "I am so deeply sorry for your devastating discovery. Finding your pet deceased is a traumatic experience, and it's normal to feel shock, disbelief, and overwhelming grief.\n\n**Immediate steps:**\n• Take a moment to breathe. This is a shock to your system.\n• If you need to move them, do so gently with a blanket.\n• Contact your vet for guidance on aftercare options.\n\nThere's no right way to process this. Your grief is valid, and the bond you shared was real. I'm here to listen if you need to talk about what happened or share memories.",
    mustContain: ['found deceased', 'devastating discovery', 'immediate steps'],
    mustNotContain: ['at least', 'better place']
  },
  emergency: {
    response: "🚨 **This sounds like a veterinary emergency.** Please act immediately.\n\n**Call your vet or emergency vet NOW.**\n\nIf it's after hours:\n• Search \"24 hour emergency vet near me\"\n• Call the ASPCA Animal Poison Control: 888-426-4435\n\n**Do not wait to see what happens.** Minutes matter in emergencies.\n\nAfter they're safe, please come back and tell me what happened. I'll be here to support you through whatever comes next.\n\n**Your pet needs you to act fast right now.**",
    mustContain: ['emergency', 'immediate', 'veterinary emergency'],
    mustNotContain: ['wait', 'see what happens']
  },
  found_pet: {
    response: "Thank you for helping a found pet! Your compassion could reunite them with their family.\n\n**Immediate steps:**\n1. **Check for identification:** Look for collar, tags, or microchip\n2. **Safety first:** Keep them secure and separate from your pets\n3. **Alert local resources:**\n   • Post on Nextdoor/neighborhood apps\n   • Contact local shelters and vets\n   • Check lost pet posts in your area\n\n**Important:** Don't assume they're abandoned. Many pets escape from loving homes.\n\nCan you tell me more about the pet? What do they look like, and where did you find them?",
    mustContain: ['found a pet', 'check for', 'microchip'],
    mustNotContain: ['keep it', 'it\'s yours now']
  },
  general: {
    response: "I'm here to listen. Tell me more about what you're going through, and we'll figure this out together.",
    mustContain: [],
    mustNotContain: []
  }
};

// ═══════════════════════════════════════════════════════════════════
// ANALYSIS FUNCTIONS (Exported for testing)
// ═══════════════════════════════════════════════════════════════════

export function analyzeSuicideRisk(input: string): { level: 'none' | 'passive' | 'active' | 'intent'; markers: string[] } {
  const lowerInput = input.toLowerCase();
  
  // 4A) Negation Guard
  const negationPattern = /\b(don't|do not|never|won't|doesn't|didn't)\s+(\w+\s+){0,3}(want to die|kill myself|end it|hurt myself)/i;
  const hasNegation = negationPattern.test(input);
  
  // 4B) Attribution Guard - check for quoted speech or someone else's statements
  const attributionPattern = /["']([^"']*(?:want to die|kill myself|end it|hurt myself)[^"']*)["']/i;
  const someoneElsePattern = /\b(he|she|they|said|told me|my friend|someone)\s+(wants to|wants|is going to|is trying to)\s+(die|kill|end it)/i;
  const hasAttribution = attributionPattern.test(input) || someoneElsePattern.test(input);
  
  // 4C) Intent Override - explicit intent always wins
  const intentMatches = SUICIDE_MARKERS.intent.filter(m => lowerInput.includes(m));
  if (intentMatches.length > 0) {
    // Check if intent is negated or attributed
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
    // Check if active is negated or attributed
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
    // Check if passive is negated or attributed
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
  // Anticipatory requires ≥2 markers
  return { detected: matches.length >= 2, markers: matches };
}

export function detectEmergency(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = EMERGENCY_KEYWORDS.filter(m => lowerInput.includes(m));
  // Emergency requires immediate-danger language
  return { detected: matches.length > 0, markers: matches };
}

export function detectFoundPet(input: string): { detected: boolean; markers: string[] } {
  const lowerInput = input.toLowerCase();
  const matches = FOUND_PET_KEYWORDS.filter(m => lowerInput.includes(m));
  return { detected: matches.length > 0, markers: matches };
}

// ═══════════════════════════════════════════════════════════════════

export function generateCompanionResponse(userInput: string): { response: string; analysis: ResponseAnalysis } {
  const lowerInput = userInput.toLowerCase();

  // SUICIDE RISK TRIAGE - ALWAYS CHECK FIRST
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

  // DV / COERCIVE CONTROL - Safety (immediately after suicide triage)
  const dv = detectDvCoerciveControl(userInput);
  if (dv.detected) {
    return {
      response: RESPONSE_TEMPLATES.dv_coercive_control.response,
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
      response: RESPONSE_TEMPLATES.mdd.response,
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
      response: RESPONSE_TEMPLATES.paralysis.response,
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
      response: RESPONSE_TEMPLATES.neurodivergent.response,
      analysis: {
        category: 'neurodivergent',
        suicideRiskLevel: 'none',
        requiresEscalation: false,
        detectedMarkers: neuro.markers
      }
    };
  }
  
  // DEATH & GRIEF - Priority 5-8
  const death = detectDeathGrief(userInput);
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
  
  // ANTICIPATORY GRIEF - Priority 9
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
  
  // EMERGENCY - Priority 10 (check before death detection)
  const emergency = detectEmergency(userInput);
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
  
    
  // SCAM DETECTION - Priority 11
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
  
  // FOUND PET - Priority 12
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
  
  // LOST PET - Priority 13
  const lostKeywords = LOST_PET_KEYWORDS.filter(k => lowerInput.includes(k));
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
  
  // GUILT (CBT) - Priority 14
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
  
  // DISENFRANCHISED - Priority 15
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
  
  // PEDIATRIC - Priority 16
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
  
  // QUALITY OF LIFE / EUTHANASIA DECISION - Priority 17
  const qolKeywords = EUTHANASIA_DECISION_KEYWORDS.filter(k => lowerInput.includes(k));
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
  
  // DEFAULT
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
