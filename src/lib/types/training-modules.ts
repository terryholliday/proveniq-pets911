/**
 * TRAINING MODULE REGISTRY
 * 
 * Aligned with pet911 Academy Training Framework v1.0
 * 
 * All training modules required for certification tracks.
 * Includes simulation scenarios and assessment criteria.
 */

import type { CertificationTrack, VolunteerTier } from './certification-tracks';

// ═══════════════════════════════════════════════════════════════════
// MODULE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export interface TrainingModule {
  id: string;
  code: string;
  name: string;
  description: string;
  track: CertificationTrack;
  tier: VolunteerTier;
  
  // Content
  estimatedMinutes: number;
  lessons: TrainingLesson[];
  
  // Assessment
  hasAssessment: boolean;
  passingScore: number;
  maxAttempts: number;
  
  // Certification
  ceCredits: number;
  validityMonths: number;
  prerequisiteModules: string[];
  
  // Metadata
  version: string;
  lastUpdated: string;
  author: string;
}

export interface TrainingLesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'INTERACTIVE' | 'SIMULATION' | 'QUIZ';
  estimatedMinutes: number;
  content: string;
  resources?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// MODERATOR TRAINING MODULES
// ═══════════════════════════════════════════════════════════════════

export const MODERATOR_MODULES: TrainingModule[] = [
  {
    id: 'mod-001',
    code: 'TRIAGE_FUNDAMENTALS',
    name: 'Triage Fundamentals',
    description: 'Introduction to the 3-Tier Triage System adapted from EMS MPDS protocols.',
    track: 'MODERATOR',
    tier: 'NOVICE',
    estimatedMinutes: 45,
    lessons: [
      {
        id: 'mod-001-01',
        title: 'The Evolution of Digital Triage',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'History of MPDS and its adaptation for animal emergency response.',
      },
      {
        id: 'mod-001-02',
        title: 'The 3-Tier Hierarchy',
        type: 'VIDEO',
        estimatedMinutes: 15,
        content: 'Understanding ECHO/DELTA (Tier 1), BRAVO/CHARLIE (Tier 2), ALPHA/OMEGA (Tier 3).',
      },
      {
        id: 'mod-001-03',
        title: 'Clinical Indicators Overview',
        type: 'INTERACTIVE',
        estimatedMinutes: 20,
        content: 'Recognizing life-threatening vs non-urgent conditions from photos/videos.',
      },
    ],
    hasAssessment: true,
    passingScore: 80,
    maxAttempts: 3,
    ceCredits: 1,
    validityMonths: 12,
    prerequisiteModules: [],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'mod-002',
    code: 'ABC_PROTOCOL',
    name: 'The ABCs of Digital Triage',
    description: 'Master the Airway/Behavior/Context assessment protocol for remote triage.',
    track: 'MODERATOR',
    tier: 'NOVICE',
    estimatedMinutes: 60,
    lessons: [
      {
        id: 'mod-002-01',
        title: 'A - Airway/Appearance Assessment',
        type: 'VIDEO',
        estimatedMinutes: 15,
        content: 'Identifying respiratory distress from visual evidence.',
        resources: ['open_mouth_breathing_examples.pdf', 'cyanotic_gums_reference.jpg'],
      },
      {
        id: 'mod-002-02',
        title: 'B - Behavior/Body Language',
        type: 'VIDEO',
        estimatedMinutes: 15,
        content: 'Recognizing lateral recumbency, seizing, star-gazing, and other critical signs.',
      },
      {
        id: 'mod-002-03',
        title: 'C - Context/Conditions',
        type: 'INTERACTIVE',
        estimatedMinutes: 15,
        content: 'Environmental risk assessment - when the environment is the killer.',
      },
      {
        id: 'mod-002-04',
        title: 'Triage Decision Matrix Practice',
        type: 'SIMULATION',
        estimatedMinutes: 15,
        content: 'Practice applying ABC protocol to real scenarios.',
      },
    ],
    hasAssessment: true,
    passingScore: 85,
    maxAttempts: 3,
    ceCredits: 1.5,
    validityMonths: 12,
    prerequisiteModules: ['TRIAGE_FUNDAMENTALS'],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'mod-003',
    code: 'FRAUD_DETECTION',
    name: 'Fraud Detection & Verification',
    description: 'Identify donation scams, fake rescue posts, and implement verification protocols.',
    track: 'MODERATOR',
    tier: 'APPRENTICE',
    estimatedMinutes: 45,
    lessons: [
      {
        id: 'mod-003-01',
        title: 'Common Scam Patterns',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'Identifying stolen photos, fake surgery claims, and cash-grab patterns.',
      },
      {
        id: 'mod-003-02',
        title: 'Reverse Image Search',
        type: 'INTERACTIVE',
        estimatedMinutes: 15,
        content: 'Using TinEye, Google Lens to verify image authenticity.',
      },
      {
        id: 'mod-003-03',
        title: 'The Paper Test',
        type: 'VIDEO',
        estimatedMinutes: 10,
        content: 'Requesting verification photos with date and username.',
      },
      {
        id: 'mod-003-04',
        title: 'Trusted Reporter System',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'Understanding Grey/Blue/Gold badge verification levels.',
      },
    ],
    hasAssessment: true,
    passingScore: 90,
    maxAttempts: 2,
    ceCredits: 1,
    validityMonths: 12,
    prerequisiteModules: ['ABC_PROTOCOL'],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'mod-004',
    code: 'ANTI_VIGILANTISM',
    name: 'Anti-Vigilantism & Governance',
    description: 'Prevent doxxing, manage mob justice, redirect energy to legal channels.',
    track: 'MODERATOR',
    tier: 'APPRENTICE',
    estimatedMinutes: 40,
    lessons: [
      {
        id: 'mod-004-01',
        title: 'The Anti-Doxxing Protocol',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'PII scrubbing procedures and Law Enforcement Only channels.',
      },
      {
        id: 'mod-004-02',
        title: 'Justice Redirection Scripts',
        type: 'VIDEO',
        estimatedMinutes: 15,
        content: 'How to redirect vigilante energy into legal action.',
      },
      {
        id: 'mod-004-03',
        title: 'Escalation Tiers',
        type: 'TEXT',
        estimatedMinutes: 5,
        content: 'Warning → 7-day suspension → Permanent ban protocol.',
      },
      {
        id: 'mod-004-04',
        title: 'De-escalation Practice',
        type: 'SIMULATION',
        estimatedMinutes: 10,
        content: 'Practice responding to angry users demanding vigilante action.',
      },
    ],
    hasAssessment: true,
    passingScore: 85,
    maxAttempts: 2,
    ceCredits: 1,
    validityMonths: 12,
    prerequisiteModules: ['FRAUD_DETECTION'],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'mod-005',
    code: 'COMPASSION_FATIGUE_AWARENESS',
    name: 'Compassion Fatigue Awareness',
    description: 'Recognize and prevent secondary traumatic stress in digital moderation.',
    track: 'MODERATOR',
    tier: 'APPRENTICE',
    estimatedMinutes: 35,
    lessons: [
      {
        id: 'mod-005-01',
        title: 'Understanding Compassion Fatigue',
        type: 'VIDEO',
        estimatedMinutes: 15,
        content: 'The "Zealot to Withdrawal" phase transition and warning signs.',
      },
      {
        id: 'mod-005-02',
        title: 'The Compassion Fatigue Firewall',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'Greyscale default, 2-Hour Hard Stop, mandatory debrief sessions.',
      },
      {
        id: 'mod-005-03',
        title: 'Self-Care Strategies',
        type: 'INTERACTIVE',
        estimatedMinutes: 10,
        content: 'Building resilience and knowing when to step back.',
      },
    ],
    hasAssessment: true,
    passingScore: 80,
    maxAttempts: 3,
    ceCredits: 0.5,
    validityMonths: 12,
    prerequisiteModules: [],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'mod-006',
    code: 'CRISIS_INTERVENTION',
    name: 'Crisis Intervention & Incident Command',
    description: 'Advanced crisis management for Tier 1 emergencies.',
    track: 'MODERATOR',
    tier: 'EXPERT',
    estimatedMinutes: 90,
    lessons: [
      {
        id: 'mod-006-01',
        title: 'Incident Command Structure',
        type: 'VIDEO',
        estimatedMinutes: 20,
        content: 'Establishing command during multi-volunteer emergencies.',
      },
      {
        id: 'mod-006-02',
        title: 'Law Enforcement Coordination',
        type: 'TEXT',
        estimatedMinutes: 15,
        content: 'When and how to involve Animal Control and Police.',
      },
      {
        id: 'mod-006-03',
        title: 'Multi-Agency Response',
        type: 'INTERACTIVE',
        estimatedMinutes: 20,
        content: 'Coordinating between shelters, vets, and volunteers.',
      },
      {
        id: 'mod-006-04',
        title: 'Crisis Simulation',
        type: 'SIMULATION',
        estimatedMinutes: 35,
        content: 'Full Tier 1 emergency simulation with live decision points.',
      },
    ],
    hasAssessment: true,
    passingScore: 90,
    maxAttempts: 2,
    ceCredits: 2,
    validityMonths: 24,
    prerequisiteModules: ['ANTI_VIGILANTISM', 'COMPASSION_FATIGUE_AWARENESS'],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
];

// ═══════════════════════════════════════════════════════════════════
// TRANSPORT TRAINING MODULES
// ═══════════════════════════════════════════════════════════════════

export const TRANSPORT_MODULES: TrainingModule[] = [
  {
    id: 'trn-001',
    code: 'TWO_DOOR_RULE',
    name: 'The Two-Door Rule',
    description: 'The Golden Standard of animal transport safety - Double Containment.',
    track: 'TRANSPORT',
    tier: 'NOVICE',
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'trn-001-01',
        title: 'The Principle',
        type: 'VIDEO',
        estimatedMinutes: 10,
        content: 'An animal is NEVER allowed to have a direct path to the open sky.',
      },
      {
        id: 'trn-001-02',
        title: 'The Airlock Procedure',
        type: 'INTERACTIVE',
        estimatedMinutes: 15,
        content: 'Step-by-step handoff protocol between transport legs.',
      },
      {
        id: 'trn-001-03',
        title: 'Common Fail States',
        type: 'TEXT',
        estimatedMinutes: 5,
        content: 'The Collar Slip and how to prevent it.',
      },
    ],
    hasAssessment: true,
    passingScore: 100,
    maxAttempts: 5,
    ceCredits: 0.5,
    validityMonths: 12,
    prerequisiteModules: [],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'trn-002',
    code: 'CRATE_SAFETY',
    name: 'Crate Safety & Securement',
    description: 'Proper crate selection, positioning, and vehicle securement.',
    track: 'TRANSPORT',
    tier: 'NOVICE',
    estimatedMinutes: 25,
    lessons: [
      {
        id: 'trn-002-01',
        title: 'Crate Selection',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'Sizing, material (non-porous for disinfection), and ventilation.',
      },
      {
        id: 'trn-002-02',
        title: 'Vehicle Securement',
        type: 'VIDEO',
        estimatedMinutes: 10,
        content: 'Preventing crate movement during transport.',
      },
      {
        id: 'trn-002-03',
        title: 'Temperature Monitoring',
        type: 'TEXT',
        estimatedMinutes: 5,
        content: 'Thermometers in crate area, 80°F maximum threshold.',
      },
    ],
    hasAssessment: true,
    passingScore: 85,
    maxAttempts: 3,
    ceCredits: 0.5,
    validityMonths: 12,
    prerequisiteModules: [],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'trn-003',
    code: 'DISEASE_PREVENTION',
    name: 'Disease Prevention in Transport',
    description: 'Parvocidal disinfection and biosecurity between transports.',
    track: 'TRANSPORT',
    tier: 'APPRENTICE',
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'trn-003-01',
        title: 'Parvovirus Basics',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'Understanding environmental durability and transmission.',
      },
      {
        id: 'trn-003-02',
        title: 'Disinfection Protocol',
        type: 'VIDEO',
        estimatedMinutes: 15,
        content: 'Using Rescue/Accel (Accelerated Hydrogen Peroxide) between legs.',
      },
      {
        id: 'trn-003-03',
        title: 'PPE and Hand Hygiene',
        type: 'TEXT',
        estimatedMinutes: 5,
        content: 'Gloves, hand washing, clothing changes.',
      },
    ],
    hasAssessment: true,
    passingScore: 85,
    maxAttempts: 3,
    ceCredits: 0.5,
    validityMonths: 12,
    prerequisiteModules: ['CRATE_SAFETY'],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
];

// ═══════════════════════════════════════════════════════════════════
// FOSTER TRAINING MODULES
// ═══════════════════════════════════════════════════════════════════

export const FOSTER_MODULES: TrainingModule[] = [
  {
    id: 'fos-001',
    code: 'BIOSECURITY_101',
    name: 'Biosecurity Zoning',
    description: 'Hot Zone, Transition Zone, Cold Zone protocols for foster homes.',
    track: 'FOSTER_CARE',
    tier: 'NOVICE',
    estimatedMinutes: 40,
    lessons: [
      {
        id: 'fos-001-01',
        title: 'The Three Zones',
        type: 'VIDEO',
        estimatedMinutes: 15,
        content: 'Setting up Hot Zone (quarantine), Transition Zone, and Cold Zone.',
      },
      {
        id: 'fos-001-02',
        title: 'Entry/Exit Protocol',
        type: 'INTERACTIVE',
        estimatedMinutes: 15,
        content: 'Step-by-step procedure for entering and leaving quarantine.',
      },
      {
        id: 'fos-001-03',
        title: 'Disinfection Agents',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'Rescue (AHP), bleach solutions, and contact times.',
      },
    ],
    hasAssessment: true,
    passingScore: 85,
    maxAttempts: 3,
    ceCredits: 1,
    validityMonths: 12,
    prerequisiteModules: [],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'fos-002',
    code: 'FADING_KITTEN_PROTOCOL',
    name: 'Fading Kitten Protocol',
    description: 'The Sugar & Heat Rule - critical care for neonates.',
    track: 'FOSTER_CARE',
    tier: 'APPRENTICE',
    estimatedMinutes: 45,
    lessons: [
      {
        id: 'fos-002-01',
        title: 'Crash Indicators',
        type: 'VIDEO',
        estimatedMinutes: 10,
        content: 'Recognizing lethargy, bottle rejection, hypothermia, crying.',
      },
      {
        id: 'fos-002-02',
        title: 'Heat First',
        type: 'INTERACTIVE',
        estimatedMinutes: 15,
        content: 'Warming techniques to reach 98°F before any feeding.',
      },
      {
        id: 'fos-002-03',
        title: 'Sugar Second',
        type: 'VIDEO',
        estimatedMinutes: 10,
        content: 'Karo syrup/dextrose application for hypoglycemia.',
      },
      {
        id: 'fos-002-04',
        title: 'Food Last',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'When and how to safely feed after stabilization.',
      },
    ],
    hasAssessment: true,
    passingScore: 90,
    maxAttempts: 3,
    ceCredits: 1,
    validityMonths: 12,
    prerequisiteModules: ['BIOSECURITY_101'],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'fos-003',
    code: 'BRIDGE_BUILDER_MINDSET',
    name: 'The Bridge Builder Mindset',
    description: 'Emotional resilience and letting go - Teacher not Owner.',
    track: 'FOSTER_CARE',
    tier: 'APPRENTICE',
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'fos-003-01',
        title: 'Reframing Your Role',
        type: 'VIDEO',
        estimatedMinutes: 10,
        content: 'From "Owner" to "Teacher" - preparing for forever families.',
      },
      {
        id: 'fos-003-02',
        title: 'The Report Card Ceremony',
        type: 'TEXT',
        estimatedMinutes: 10,
        content: 'Writing handoff letters for adopters as closure.',
      },
      {
        id: 'fos-003-03',
        title: 'Recognizing Foster Failure Risk',
        type: 'INTERACTIVE',
        estimatedMinutes: 10,
        content: 'Understanding hoarding tendencies and capacity limits.',
      },
    ],
    hasAssessment: true,
    passingScore: 80,
    maxAttempts: 3,
    ceCredits: 0.5,
    validityMonths: 24,
    prerequisiteModules: [],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
];

// ═══════════════════════════════════════════════════════════════════
// TRAPPER TRAINING MODULES
// ═══════════════════════════════════════════════════════════════════

export const TRAPPER_MODULES: TrainingModule[] = [
  {
    id: 'trp-001',
    code: 'TNR_BASICS',
    name: 'TNR Fundamentals',
    description: 'Trap-Neuter-Return basics and colony management introduction.',
    track: 'FIELD_TRAPPER',
    tier: 'NOVICE',
    estimatedMinutes: 45,
    lessons: [
      {
        id: 'trp-001-01',
        title: 'Why TNR Works',
        type: 'VIDEO',
        estimatedMinutes: 15,
        content: 'The science behind humane population control.',
      },
      {
        id: 'trp-001-02',
        title: 'Feral vs Stray Assessment',
        type: 'INTERACTIVE',
        estimatedMinutes: 15,
        content: 'Distinguishing unsocialized ferals from lost pets.',
      },
      {
        id: 'trp-001-03',
        title: 'The Withholding Protocol',
        type: 'TEXT',
        estimatedMinutes: 15,
        content: '24-hour food withholding and feeder coordination.',
      },
    ],
    hasAssessment: true,
    passingScore: 85,
    maxAttempts: 3,
    ceCredits: 1,
    validityMonths: 12,
    prerequisiteModules: [],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'trp-002',
    code: 'BOX_TRAP_MASTERY',
    name: 'Box Trap Mastery',
    description: 'Tru-Catch/Tomahawk mechanics and sensitivity adjustment.',
    track: 'FIELD_TRAPPER',
    tier: 'APPRENTICE',
    estimatedMinutes: 40,
    lessons: [
      {
        id: 'trp-002-01',
        title: 'Trap Mechanics',
        type: 'VIDEO',
        estimatedMinutes: 15,
        content: 'Trip plate sensitivity for kittens vs adults.',
      },
      {
        id: 'trp-002-02',
        title: 'Placement Strategy',
        type: 'INTERACTIVE',
        estimatedMinutes: 15,
        content: 'Location selection and camouflage techniques.',
      },
      {
        id: 'trp-002-03',
        title: 'Transfer Procedures',
        type: 'VIDEO',
        estimatedMinutes: 10,
        content: 'Moving cats safely to transfer cages using trap forks.',
      },
    ],
    hasAssessment: true,
    passingScore: 85,
    maxAttempts: 3,
    ceCredits: 1,
    validityMonths: 12,
    prerequisiteModules: ['TNR_BASICS'],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
  {
    id: 'trp-003',
    code: 'WILDLIFE_PROTOCOL',
    name: 'Wildlife Encounter Protocol',
    description: 'Safe release procedures for non-target wildlife captures.',
    track: 'FIELD_TRAPPER',
    tier: 'APPRENTICE',
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'trp-003-01',
        title: 'The Panicked Release Fail State',
        type: 'VIDEO',
        estimatedMinutes: 10,
        content: 'What NOT to do when you trap a skunk.',
      },
      {
        id: 'trp-003-02',
        title: 'Cover-Position-Release',
        type: 'INTERACTIVE',
        estimatedMinutes: 15,
        content: 'Safe wildlife release protocol step-by-step.',
      },
      {
        id: 'trp-003-03',
        title: 'Rabies Vector Awareness',
        type: 'TEXT',
        estimatedMinutes: 5,
        content: 'Understanding exposure risks and reporting requirements.',
      },
    ],
    hasAssessment: true,
    passingScore: 90,
    maxAttempts: 3,
    ceCredits: 0.5,
    validityMonths: 12,
    prerequisiteModules: ['BOX_TRAP_MASTERY'],
    version: '1.0',
    lastUpdated: '2026-01-12',
    author: 'pet911 Academy',
  },
];

// ═══════════════════════════════════════════════════════════════════
// SIMULATION SCENARIOS
// ═══════════════════════════════════════════════════════════════════

export interface SimulationScenario {
  id: string;
  name: string;
  track: CertificationTrack;
  tier: VolunteerTier;
  description: string;
  setup: string;
  passResponse: string;
  failResponse: string;
  learningObjective: string;
}

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'sim-mod-001',
    name: 'The "Hit By Car" False Alarm',
    track: 'MODERATOR',
    tier: 'NOVICE',
    description: 'Test ability to distinguish between emotional noise and operational signal.',
    setup: 'User posts a photo of a dog lying on the side of the road with caption "Help! Dead or dying dog on I-95!"',
    failResponse: '"Boosting! Everyone go to Main St!" - Results in 5 cars showing up, dog scares into traffic.',
    passResponse: 'Moderator zooms in on image. Notices no blood, natural sleeping posture. Requests "Verification of Life" before deploying assets, or dispatches police cruiser (safer) rather than civilian volunteer.',
    learningObjective: 'Verification before Mobilization. Sending volunteers to a highway for a false alarm risks human life and liability.',
  },
  {
    id: 'sim-mod-002',
    name: 'The "Fake Donation" Scam',
    track: 'MODERATOR',
    tier: 'APPRENTICE',
    description: 'Identify and handle donation scam attempts.',
    setup: 'A user posts a photo of a mangled dog (stolen from a 2018 news article) and asks for Venmo donations for "emergency surgery."',
    failResponse: 'Approving the post and boosting donation requests.',
    passResponse: 'Reverse image search reveals stolen photo. Request "Paper Test" (new photo with date/username). User refuses -> Immediate ban and IP report to other rescue networks.',
    learningObjective: 'Always verify before allowing donation requests. Use reverse image search and the Paper Test.',
  },
  {
    id: 'sim-trp-001',
    name: 'The "Angry Neighbor" De-Escalation',
    track: 'FIELD_TRAPPER',
    tier: 'APPRENTICE',
    description: 'Handle hostile community member during TNR operation.',
    setup: 'A trapper is setting a cage for a TNR project. An angry homeowner comes out yelling "Stop feeding these pests! I\'m calling the police!"',
    failResponse: 'Arguing with the homeowner or continuing to set traps while being confrontational.',
    passResponse: 'E.A.R. Method: E - Empathy ("I understand, sir. It sounds like these cats are really causing you a headache."), A - Ask ("What is the biggest issue? The noise? The smell?"), R - Resolve ("That\'s exactly why I\'m here. By trapping and fixing them, the spraying and fighting stops.").',
    learningObjective: 'De-escalation turns hostile neighbors into allies. Address their concerns, not your agenda.',
  },
  {
    id: 'sim-fos-001',
    name: 'Fading Kitten Emergency',
    track: 'FOSTER_CARE',
    tier: 'APPRENTICE',
    description: 'Respond to neonatal crash symptoms.',
    setup: 'A 2-week-old kitten becomes limp, cold to touch, and refuses the bottle.',
    failResponse: 'Attempting to force-feed formula to the cold kitten -> aspiration pneumonia.',
    passResponse: 'Heat First (warm to 98°F using heating pad/body heat), Sugar Second (Karo syrup on gums), Food Last (only after warm with suckle reflex).',
    learningObjective: 'Never feed a cold kitten. The Sugar & Heat Rule saves lives.',
  },
];

// ═══════════════════════════════════════════════════════════════════
// MODULE REGISTRY
// ═══════════════════════════════════════════════════════════════════

export const ALL_TRAINING_MODULES: TrainingModule[] = [
  ...MODERATOR_MODULES,
  ...TRANSPORT_MODULES,
  ...FOSTER_MODULES,
  ...TRAPPER_MODULES,
];

export function getModulesByTrack(track: CertificationTrack): TrainingModule[] {
  return ALL_TRAINING_MODULES.filter(m => m.track === track);
}

export function getModulesByTier(tier: VolunteerTier): TrainingModule[] {
  return ALL_TRAINING_MODULES.filter(m => m.tier === tier);
}

export function getModuleById(id: string): TrainingModule | undefined {
  return ALL_TRAINING_MODULES.find(m => m.id === id);
}

export function getModuleByCode(code: string): TrainingModule | undefined {
  return ALL_TRAINING_MODULES.find(m => m.code === code);
}

export function getPrerequisiteChain(moduleId: string): TrainingModule[] {
  const module = getModuleById(moduleId);
  if (!module) return [];
  
  const chain: TrainingModule[] = [];
  const visited = new Set<string>();
  
  function traverse(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    
    const mod = getModuleById(id);
    if (!mod) return;
    
    for (const prereqCode of mod.prerequisiteModules) {
      const prereq = getModuleByCode(prereqCode);
      if (prereq) {
        traverse(prereq.id);
        chain.push(prereq);
      }
    }
  }
  
  traverse(moduleId);
  return chain;
}
