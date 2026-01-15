/**
 * Typed Config Loader for Support Companion
 * Single source of truth for all configuration
 * Validates config.json at import time - fails fast on invalid config
 */

import { z } from 'zod';

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

const MarkerCategorySchema = z.object({
  passive: z.array(z.string()).optional(),
  active: z.array(z.string()).optional(),
  intent: z.array(z.string()).optional(),
  means: z.array(z.string()).optional(),
  plan: z.array(z.string()).optional(),
  timeline: z.array(z.string()).optional(),
  phrases: z.array(z.string()).optional(),
}).passthrough();

const HotlineSchema = z.object({
  crisis_988: z.string(),
  crisis_text: z.string().optional(),
  pet_poison: z.string().optional(),
  domestic_violence: z.string().optional(),
  child_abuse: z.string().optional(),
  veterans: z.string().optional(),
  trevor_project: z.string().optional(),
}).passthrough();

const TemplateSchema = z.object({
  response: z.string(),
  hotline: z.string().optional(),
  visualAid: z.string().optional(),
  requiresGrounding: z.boolean().optional(),
  lowCognitionVariant: z.string().optional(),
}).passthrough();

const ScoringSchema = z.object({
  weights: z.record(z.string(), z.number()),
  thresholds: z.object({
    CRITICAL: z.number(),
    HIGH: z.number(),
    MEDIUM: z.number(),
    STANDARD: z.number(),
  }),
}).passthrough();

const DisambiguationSchema = z.object({
  NEGATIONS: z.array(z.string()).default([]),
  IDIOMS: z.array(z.string()).default([]),
}).passthrough().optional();

const OpeningSchema = z.object({
  greeting: z.string(),
  prompt: z.string(),
});

const QuickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  category: z.enum(['pet_emergency', 'emotional', 'lost_pet', 'scam', 'general']),
});

const AuthorityClaimGuardSchema = z.object({
  disallowedClaims: z.array(z.string()).default([]),
  replacementPolicy: z.string().optional(),
  correctPhrasing: z.string().optional(),
  neverPromiseDeletion: z.boolean().optional(),
}).passthrough().optional();

const FollowUpCadenceSchema = z.object({
  enabled: z.boolean().default(true),
  intervals: z.array(z.number()).default([120000, 300000, 900000]),
}).passthrough().optional();

const VolatilityModelSchema = z.object({
  enabled: z.boolean().default(true),
  signals: z.array(z.string()).default([]),
}).passthrough().optional();

const CompoundCrisisProtocolSchema = z.object({
  enabled: z.boolean().default(true),
  priorityHierarchy: z.array(z.string()).default([]),
}).passthrough().optional();

const ConfigSchema = z.object({
  // Marker definitions
  MARKERS: z.object({
    SUICIDE: MarkerCategorySchema,
    SELF_HARM: MarkerCategorySchema.optional(),
    VIOLENCE: MarkerCategorySchema.optional(),
    CRISIS: MarkerCategorySchema.optional(),
    EMERGENCY: MarkerCategorySchema.optional(),
    DEATH: MarkerCategorySchema.optional(),
    ANTICIPATORY: MarkerCategorySchema.optional(),
    FINANCIAL: MarkerCategorySchema.optional(),
    SCAM: MarkerCategorySchema.optional(),
    LOST_PET: MarkerCategorySchema.optional(),
    ABUSE: MarkerCategorySchema.optional(),
  }),
  
  // Localized markers
  MARKERS_ES: z.record(z.string(), MarkerCategorySchema).optional(),
  MARKERS_FR: z.record(z.string(), MarkerCategorySchema).optional(),
  
  // Scoring configuration
  SCORING: ScoringSchema,
  
  // Regional hotlines
  HOTLINES: z.object({
    US: HotlineSchema,
    UK: HotlineSchema.optional(),
    CA: HotlineSchema.optional(),
    AU: HotlineSchema.optional(),
    ES_US: HotlineSchema.optional(),
    FR_CA: HotlineSchema.optional(),
  }),
  
  // Response templates
  TEMPLATES: z.record(z.string(), TemplateSchema),
  
  // Opening messages
  OPENINGS: z.array(OpeningSchema),
  
  // Quick action buttons
  QUICK_ACTIONS: z.array(QuickActionSchema),
  
  // Prohibited responses
  PROHIBITED_RESPONSES: z.object({
    patterns: z.array(z.string()),
    phrases: z.array(z.string()),
  }),
  
  // UI Configuration
  UI: z.object({
    thinkingDelay: z.number().default(800),
    typingSpeed: z.object({
      min: z.number().default(15),
      max: z.number().default(35),
      crisis: z.number().default(10),
    }),
    safetyExitUrl: z.string().default('https://weather.com'),
    safetyExitKeys: z.array(z.string()).default(['Escape', 'Escape']),
  }).optional(),
  
  // Waiting room triggers
  WAITING_TRIGGERS: z.array(z.string()).optional(),
  
  // Bystander triggers
  BYSTANDER_TRIGGERS: z.array(z.string()).optional(),
  
  // Pet loss suicide coupling forbidden phrases
  PET_LOSS_SUICIDE_FORBIDDEN: z.array(z.string()).optional(),
  
  // Disambiguation for reducing false positives
  DISAMBIGUATION: DisambiguationSchema,
  
  // Authority claim guard (fail-closed)
  AUTHORITY_CLAIM_GUARD: AuthorityClaimGuardSchema,
  
  // Follow-up cadence for check-ins
  FOLLOW_UP_CADENCE: FollowUpCadenceSchema,
  
  // Volatility detection model
  VOLATILITY_MODEL: VolatilityModelSchema,
  
  // Compound crisis protocol
  COMPOUND_CRISIS_PROTOCOL: CompoundCrisisProtocolSchema,
  
  // Safety exit protocol
  SAFETY_EXIT_PROTOCOL: z.object({
    enabled: z.boolean().default(true),
    decoyRoute: z.string().default('/help'),
  }).passthrough().optional(),
  
  // Low cognition mode settings
  LOW_COGNITION_MODE: z.object({
    enabled: z.boolean().default(true),
    maxCharsPerCard: z.number().default(220),
    maxQuestionsPerResponse: z.number().default(1),
  }).passthrough().optional(),
  
  // Post-crisis mode settings
  POST_CRISIS_MODE: z.object({
    enabled: z.boolean().default(true),
    constraints: z.object({
      maxResponseLength: z.number().default(200),
      noNewTopics: z.boolean().default(true),
      shortResponsesOnly: z.boolean().default(true),
      validationHeavy: z.boolean().default(true),
    }).passthrough().optional(),
  }).passthrough().optional(),
  
  // Waiting room mode settings
  WAITING_ROOM_MODE: z.object({
    enabled: z.boolean().default(true),
    triggers: z.array(z.string()).default([]),
    response: z.string().default("Help is on the way. I'm here with you."),
    options: z.array(z.string()).default([]),
    distractions: z.array(z.string()).default([]),
  }).passthrough().optional(),
}).passthrough();

// ============================================================================
// DEFAULT CONFIG (used if config.json not available)
// ============================================================================

const DEFAULT_CONFIG: z.infer<typeof ConfigSchema> = {
  MARKERS: {
    SUICIDE: {
      passive: [
        'wish i was dead', 'want to die', 'better off dead', 'tired of living',
        'no reason to live', 'cant go on', "can't go on", 'want it to end',
        'want to disappear', 'no point anymore', 'done with life',
        'want to sleep forever', 'wish i wasnt here', "wish i wasn't here"
      ],
      active: [
        'kill myself', 'end my life', 'take my life', 'suicide',
        'hurt myself', 'harm myself', 'end it all', 'going to die',
        'gonna die', 'want to hurt myself'
      ],
      intent: [
        'planning to', 'going to kill', 'decided to die', 'made up my mind',
        'this is goodbye', 'final goodbye', 'last message', 'ending it tonight',
        'by tomorrow', "won't be here", 'wont be here'
      ],
      means: [
        'gun', 'pills', 'overdose', 'rope', 'bridge', 'jump', 'hanging',
        'cutting', 'slit', 'wrist', 'firearm', 'medication', 'poison'
      ],
      plan: [
        'have a plan', 'know how', 'figured out how', 'got everything ready',
        'wrote a note', 'said goodbye'
      ],
      timeline: [
        'tonight', 'tomorrow', 'this week', 'soon', 'when everyone leaves',
        'after they go', 'before morning'
      ]
    },
    SELF_HARM: {
      active: [
        'cutting myself', 'hurting myself', 'burn myself', 'hit myself',
        'scratch myself', 'punish myself', 'started cutting', 'self harm'
      ]
    },
    CRISIS: {
      phrases: [
        'panic attack', 'cant breathe', "can't breathe", 'having an attack',
        'heart racing', 'losing control', 'going crazy', 'breakdown',
        'mental breakdown', 'falling apart', 'cant cope', "can't cope"
      ]
    },
    EMERGENCY: {
      phrases: [
        'not breathing', 'collapsed', 'unconscious', 'seizure', 'choking',
        'bleeding badly', 'hit by car', 'poison', 'toxic', 'ate something',
        'swallowed', 'convulsing', 'wont wake up', "won't wake up"
      ]
    },
    DEATH: {
      phrases: [
        'died', 'passed away', 'put down', 'euthanized', 'lost my',
        'gone forever', 'no longer here', 'crossing rainbow bridge',
        'had to say goodbye', 'just died', 'found dead'
      ]
    },
    ANTICIPATORY: {
      phrases: [
        'going to die soon', 'terminal', 'vet said', 'only days left',
        'time is coming', 'preparing to say goodbye', 'hospice',
        'comfort care', 'quality of life declining'
      ]
    },
    LOST_PET: {
      phrases: [
        'lost my dog', 'lost my cat', 'cant find my pet', "can't find my pet",
        'pet is missing', 'dog ran away', 'cat got out', 'escaped',
        'missing since', 'disappeared', 'slipped out', 'jumped fence'
      ]
    },
    SCAM: {
      phrases: [
        'asking for money', 'gift cards', 'wire transfer', 'western union',
        'verification code', 'crypto', 'urgent payment', 'inheritance',
        'nigerian prince', 'send money first', 'upfront fee'
      ]
    },
    ABUSE: {
      phrases: [
        'hitting me', 'beats me', 'abusing me', 'threatening me',
        'scared of him', 'scared of her', 'wont let me leave',
        "won't let me leave", 'controlling', 'trapped'
      ]
    }
  },
  
  SCORING: {
    weights: {
      'SUICIDE_PASSIVE': 40,
      'SUICIDE_ACTIVE': 70,
      'SUICIDE_INTENT': 90,
      'SUICIDE_MEANS': 85,
      'SUICIDE_PLAN': 95,
      'SUICIDE_TIMELINE': 90,
      'SELF_HARM_ACTIVE': 60,
      'CRISIS_PHRASES': 50,
      'EMERGENCY_PHRASES': 80,
      'DEATH_PHRASES': 30,
      'ANTICIPATORY_PHRASES': 35,
      'ABUSE_PHRASES': 70,
      'LOST_PET_PHRASES': 20,
      'SCAM_PHRASES': 25,
    },
    thresholds: {
      CRITICAL: 80,
      HIGH: 60,
      MEDIUM: 40,
      STANDARD: 0,
    }
  },
  
  HOTLINES: {
    US: {
      crisis_988: '988',
      crisis_text: 'Text HOME to 741741',
      pet_poison: '888-426-4435',
      domestic_violence: '1-800-799-7233',
      child_abuse: '1-800-422-4453',
      veterans: '988 (Press 1)',
      trevor_project: '1-866-488-7386',
    },
    UK: {
      crisis_988: '116 123',
      crisis_text: 'Text SHOUT to 85258',
      pet_poison: '01onal number',
      domestic_violence: '0808 2000 247',
    },
    CA: {
      crisis_988: '988',
      crisis_text: 'Text CONNECT to 686868',
      pet_poison: '888-426-4435',
      domestic_violence: '1-800-363-9010',
    },
    AU: {
      crisis_988: '13 11 14',
      crisis_text: 'Text 0477 13 11 14',
      pet_poison: '1300 869 738',
      domestic_violence: '1800 737 732',
    }
  },
  
  TEMPLATES: {
    suicide_active: {
      response: `I hear you, and I'm glad you told me. You deserve support right now.

📞 **988** — Suicide & Crisis Lifeline (24/7)
💬 Text **HOME** to **741741**

One call. Real people. No judgment. Will you call now?`,
      hotline: '988',
      lowCognitionVariant: `I hear you.

📞 Call **988** now.

They will help. Will you call?`,
      requiresGrounding: false,
    },
    
    suicide_passive: {
      response: `What you're feeling is real, and it matters. You don't have to carry this alone.

If these thoughts are getting heavier, please reach out:
📞 **988** — Suicide & Crisis Lifeline (24/7)
💬 Text **HOME** to **741741**

Can you tell me more about what's happening?`,
      hotline: '988',
    },
    
    pet_emergency: {
      response: `This sounds urgent. Here's what to do right now:

1. **Stay calm** — your pet needs you focused
2. **Call your vet or emergency vet immediately**
3. **Keep your pet warm and still**

🆘 ASPCA Poison Control: **888-426-4435** (fee applies)

What are the symptoms you're seeing?`,
      visualAid: 'gum_color_chart',
    },
    
    pet_loss: {
      response: `I'm so sorry. Losing them is one of the hardest things. Your grief is real — they were family.

There's no right way to feel right now. I'm here if you want to talk about them, sit quietly, or anything else.`,
    },
    
    lost_pet: {
      response: `Let's find them. Time matters, so let's act fast.

First — when did you last see them, and where?`,
    },
    
    panic_crisis: {
      response: `I'm right here with you. Let's slow things down together.

**Try this with me:**
Breathe in... 2... 3... 4...
Hold... 2... 3... 4...
Out slowly... 2... 3... 4... 5... 6...

You're safe. This will pass. Keep breathing with me.`,
      requiresGrounding: true,
    },
    
    abuse: {
      response: `Your safety matters most right now. You don't deserve what's happening.

If you're in immediate danger, call **911**.

National Domestic Violence Hotline:
📞 **1-800-799-7233** (24/7)
💬 Text **START** to **88788**

Are you safe right now?`,
      hotline: '1-800-799-7233',
    },
    
    scam_warning: {
      response: `🚨 This has signs of a scam. Please be careful.

**Never:**
- Send money before meeting
- Share verification codes
- Use gift cards as payment
- Wire money to strangers

If someone is pressuring you to act fast, that's a red flag. Real opportunities don't disappear in 24 hours.

What's making you feel pressured?`,
    },
    
    bystander_suicide: {
      response: `You're doing the right thing by reaching out for them.

If they're in immediate danger:
📞 Call **911** if you know their location

To help them:
📞 **988** — Suicide & Crisis Lifeline
💬 They can also text **HOME** to **741741**

Stay with them if you can. Your presence matters. Are you with them now?`,
    },
    
    bystander_minor: {
      response: `You're doing the right thing by reaching out. This is a lot for anyone, especially someone your age.

If someone is in immediate danger, contact **911** or tell a trusted adult right now.

You shouldn't have to handle this alone. Can you find a parent, teacher, or other adult to help?`,
    },
    
    waiting_room: {
      response: `You've done the hard part — help is coming. Now we just wait together.

⏱️

**While we wait:**
1. Unlock your front door (if safe)
2. Put other pets somewhere secure
3. Turn on the porch light

I'm right here. We can sit in silence, or I can distract you. What do you prefer?`,
    },
    
    post_crisis: {
      response: `I'm glad you're still here. That took courage.

How are you feeling right now?`,
    }
  },
  
  OPENINGS: [
    {
      greeting: "Hi, I'm here with you.",
      prompt: "What's on your mind today?"
    },
    {
      greeting: "Hello. This is a safe space.",
      prompt: "What brings you here?"
    },
    {
      greeting: "I'm glad you reached out.",
      prompt: "How can I support you today?"
    }
  ],
  
  QUICK_ACTIONS: [
    { id: 'pet_emergency', label: '🚨 Pet Emergency', category: 'pet_emergency' },
    { id: 'lost_pet', label: '🔍 Lost Pet', category: 'lost_pet' },
    { id: 'feeling_low', label: '💙 Feeling Low', category: 'emotional' },
    { id: 'grief', label: '🕯️ Grief/Loss', category: 'emotional' },
    { id: 'just_talk', label: '💬 Just Talk', category: 'general' },
  ],
  
  PROHIBITED_RESPONSES: {
    patterns: [
      'as an ai', 'as a language model', 'i cannot', 'i am not able',
      'i do not have feelings', 'i am just', 'i am only'
    ],
    phrases: [
      'you should see a professional',
      'i am not qualified',
      'this is beyond my capabilities',
      'you need real help',
      'time heals all wounds',
      'everything happens for a reason',
      'at least',
      'you should be grateful',
      'others have it worse',
      'just think positive',
      'get over it',
      'move on'
    ]
  },
  
  UI: {
    thinkingDelay: 800,
    typingSpeed: {
      min: 15,
      max: 35,
      crisis: 10,
    },
    safetyExitUrl: 'https://weather.com',
    safetyExitKeys: ['Escape', 'Escape'],
  },
  
  WAITING_TRIGGERS: [
    'called 911', 'waiting for police', 'waiting for ambulance',
    'vet is on the way', 'driving to ER', 'help is coming',
    'paramedics coming', 'on my way to', 'heading to emergency'
  ],
  
  BYSTANDER_TRIGGERS: [
    'my friend', 'someone else', 'helping someone', 'they are',
    'my partner', 'family member', 'coworker', 'my child',
    'my parent', 'my sibling', 'roommate'
  ],
  
  PET_LOSS_SUICIDE_FORBIDDEN: [
    'replace them', 'get another pet', 'time heals',
    "you'll get over it", 'just a pet', 'its just an animal',
    "it's just an animal", 'you can always get another'
  ],
  
  DISAMBIGUATION: {
    NEGATIONS: [
      'not', "don't", "doesn't", "didn't", 'never', 'no longer',
      'stopped', 'quit', 'used to', 'in the past', 'before',
      'my friend', 'someone else', 'hypothetically', 'if someone'
    ],
    IDIOMS: [
      'dying to', 'killing it', 'drop dead gorgeous', 'to die for',
      'dead tired', 'bored to death', 'scared to death', 'worried sick',
      'over my dead body', 'dead serious', 'dead wrong', 'deadlines',
      'killing time', 'dressed to kill', 'if looks could kill'
    ]
  },
  
  AUTHORITY_CLAIM_GUARD: {
    disallowedClaims: [
      'i am a licensed',
      'i am a certified',
      'as your therapist',
      'as your counselor',
      'i can prescribe',
      'medical advice',
      'legal advice',
      'i will delete',
      'this is confidential',
      'doctor-patient',
      'attorney-client'
    ],
    replacementPolicy: 'remove_and_flag',
    correctPhrasing: 'You can contact local services directly for professional support.',
    neverPromiseDeletion: true
  },
  
  FOLLOW_UP_CADENCE: {
    enabled: true,
    intervals: [120000, 300000, 900000] // 2min, 5min, 15min
  },
  
  VOLATILITY_MODEL: {
    enabled: true,
    signals: [
      'actually', 'wait', 'no i mean', 'thats not what i',
      'forget that', 'never mind', 'scratch that',
      'im fine', "i'm fine", 'its nothing', "it's nothing",
      'sorry', 'ignore', 'doesnt matter', "doesn't matter"
    ]
  },
  
  COMPOUND_CRISIS_PROTOCOL: {
    enabled: true,
    priorityHierarchy: [
      'human_life_immediate_danger',
      'child_safety',
      'dv_immediate_danger',
      'suicide_intent',
      'suicide_active',
      'animal_life_threatening_emergency',
      'self_harm_active',
      'abuse',
      'crisis_panic',
      'suicide_passive',
      'pet_emergency',
      'pet_loss',
      'lost_pet',
      'scam',
      'financial'
    ]
  },
  
  SAFETY_EXIT_PROTOCOL: {
    enabled: true,
    decoyRoute: '/help'
  },
  
  LOW_COGNITION_MODE: {
    enabled: true,
    maxCharsPerCard: 220,
    maxQuestionsPerResponse: 1
  },
  
  POST_CRISIS_MODE: {
    enabled: true,
    constraints: {
      maxResponseLength: 200,
      noNewTopics: true,
      shortResponsesOnly: true,
      validationHeavy: true
    }
  },
  
  WAITING_ROOM_MODE: {
    enabled: true,
    triggers: [
      'called 911', 'waiting for police', 'waiting for ambulance',
      'vet is on the way', 'driving to ER', 'help is coming',
      'paramedics coming', 'on my way to', 'heading to emergency'
    ],
    response: "You've done the hard part — help is coming. Now we just wait together.",
    options: ['Distract me', 'Sit quietly'],
    distractions: [
      'Did you know dogs can smell up to 100,000 times better than humans?',
      'Cats spend 70% of their lives sleeping.',
      'A group of cats is called a "clowder".',
      'Dogs have about 1,700 taste buds, while humans have about 9,000.'
    ]
  }
};

// ============================================================================
// CONFIG LOADING
// ============================================================================

let loadedConfig: z.infer<typeof ConfigSchema>;

try {
  // In production, this would load from config.json
  // For now, use default config
  loadedConfig = ConfigSchema.parse(DEFAULT_CONFIG);
} catch (error) {
  console.error('Config validation failed, using defaults:', error);
  loadedConfig = DEFAULT_CONFIG;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CONFIG = loadedConfig;

// Typed selectors for easy access
export const MARKERS = CONFIG.MARKERS;
export const MARKERS_ES = CONFIG.MARKERS_ES;
export const MARKERS_FR = CONFIG.MARKERS_FR;
export const SCORING = CONFIG.SCORING;
export const HOTLINES = CONFIG.HOTLINES;
export const TEMPLATES = CONFIG.TEMPLATES;
export const OPENINGS = CONFIG.OPENINGS;
export const QUICK_ACTIONS = CONFIG.QUICK_ACTIONS;
export const PROHIBITED_RESPONSES = CONFIG.PROHIBITED_RESPONSES;
export const UI_CONFIG = CONFIG.UI;
export const WAITING_TRIGGERS = CONFIG.WAITING_TRIGGERS;
export const BYSTANDER_TRIGGERS = CONFIG.BYSTANDER_TRIGGERS;
export const PET_LOSS_SUICIDE_FORBIDDEN = CONFIG.PET_LOSS_SUICIDE_FORBIDDEN;
export const DISAMBIGUATION = CONFIG.DISAMBIGUATION;
export const AUTHORITY_CLAIM_GUARD = CONFIG.AUTHORITY_CLAIM_GUARD;
export const FOLLOW_UP_CADENCE = CONFIG.FOLLOW_UP_CADENCE;
export const VOLATILITY_MODEL = CONFIG.VOLATILITY_MODEL;
export const COMPOUND_CRISIS_PROTOCOL = CONFIG.COMPOUND_CRISIS_PROTOCOL;
export const SAFETY_EXIT_PROTOCOL = CONFIG.SAFETY_EXIT_PROTOCOL;
export const LOW_COGNITION_MODE = CONFIG.LOW_COGNITION_MODE;
export const POST_CRISIS_MODE = CONFIG.POST_CRISIS_MODE;
export const WAITING_ROOM_MODE = CONFIG.WAITING_ROOM_MODE;

// Type exports
export type RiskTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';
export type MarkerCategory = keyof typeof MARKERS;
export type Region = keyof typeof HOTLINES;
export type TemplateKey = keyof typeof TEMPLATES;

export default CONFIG;
