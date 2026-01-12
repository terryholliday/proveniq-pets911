/**
 * CERTIFICATION TRACKS
 * 
 * Aligned with pet911 Academy Training Framework v1.0
 * 
 * Three distinct certification tracks for Field Volunteers:
 * - Track A: Certified Field Trapper (TNR & Recovery)
 * - Track B: Emergency Transport Logistics (The Life-Line)
 * - Track C: Emergency Foster Care (The Medical Step-Down)
 * 
 * Plus Moderator track for Digital First Responders.
 */

// ═══════════════════════════════════════════════════════════════════
// CERTIFICATION TRACK DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export type CertificationTrack = 
  | 'MODERATOR'           // Digital First Responder
  | 'FIELD_TRAPPER'       // TNR & Recovery
  | 'TRANSPORT'           // Emergency Transport Logistics
  | 'FOSTER_CARE';        // Emergency Foster Care

/**
 * Volunteer tier levels aligned with badge system
 */
export type VolunteerTier = 
  | 'NOVICE'      // Grey Badge - Completed Orientation
  | 'APPRENTICE'  // Green Badge - Active with verified completions
  | 'EXPERT';     // Gold Badge - Master level with authority

/**
 * Badge types for the verification system
 */
export type VerificationBadge = 
  | 'GREY'    // Unverified - Posts enter moderation queue, cannot request donations
  | 'BLUE'    // Verified Reporter - Phone verified, posts go live, supplies only
  | 'GOLD';   // Certified Rescuer - 501c3 or background-checked, can request donations

// ═══════════════════════════════════════════════════════════════════
// TRACK A: CERTIFIED FIELD TRAPPER
// ═══════════════════════════════════════════════════════════════════

export interface TrapperCertification {
  track: 'FIELD_TRAPPER';
  tier: VolunteerTier;
  
  // Equipment proficiency
  boxTrapProficiency: boolean;        // Tru-Catch/Tomahawk mechanics
  dropTrapProficiency: boolean;       // Manual deployment for trap-shy cats
  remoteTriggerProficiency: boolean;  // RC fobs for selective trapping
  transferCageProficiency: boolean;   // Safe cat transfer procedures
  
  // Colony assessment skills
  canDistinguishFeralVsStray: boolean;
  colonyAssessmentTrained: boolean;
  withholdingProtocolTrained: boolean; // 24hr food withholding coordination
  
  // Wildlife protocol
  wildlifeReleaseProtocolTrained: boolean; // Skunk/raccoon/opossum handling
  
  // Practical exam completion
  practicalExamPassed: boolean;
  practicalExamDate?: string;
  practicalExamProctor?: string;
}

export const TRAPPER_CERTIFICATION_REQUIREMENTS = {
  NOVICE: {
    modules: ['TNR_BASICS', 'TRAP_SAFETY', 'COLONY_IDENTIFICATION'],
    practicalRequired: false,
    minimumHours: 0,
  },
  APPRENTICE: {
    modules: ['BOX_TRAP_MASTERY', 'WILDLIFE_PROTOCOL', 'COLONY_MANAGEMENT'],
    practicalRequired: true,
    minimumHours: 10,
    supervisedTraps: 5,
  },
  EXPERT: {
    modules: ['DROP_TRAP_ADVANCED', 'REMOTE_TRIGGER', 'COLONY_COORDINATOR'],
    practicalRequired: true,
    minimumHours: 50,
    independentTraps: 25,
    mentoredNewbies: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════
// TRACK B: EMERGENCY TRANSPORT LOGISTICS
// ═══════════════════════════════════════════════════════════════════

export interface TransportCertification {
  track: 'TRANSPORT';
  tier: VolunteerTier;
  
  // The Golden Standard: Two-Door Rule
  twoDoorRuleTrained: boolean;
  airlockProcedureTrained: boolean;
  
  // Equipment knowledge
  martingaleCollarTrained: boolean;   // Prevents collar slip
  slipLeadTrained: boolean;
  crateSecurementTrained: boolean;
  
  // Vehicle requirements
  vehicleInspected: boolean;
  vehicleInspectionDate?: string;
  hasRearClimateControl: boolean;
  hasTemperatureMonitoring: boolean;
  
  // Disease prevention
  parvocidalDisinfectionTrained: boolean; // Rescue/Accel protocol
  
  // Practical completion
  transportLegsCompleted: number;
  practicalExamPassed: boolean;
}

/**
 * The Two-Door Rule (Double Containment)
 * An animal is NEVER allowed to have a direct path to the open sky.
 * There must always be two barriers between the animal and the environment.
 */
export const TWO_DOOR_RULE = {
  principle: 'An animal is NEVER allowed to have a direct path to the open sky.',
  barriers: [
    'Barrier 1: The crate door',
    'Barrier 2: The vehicle door (or garage door)',
  ],
  protocol: [
    'Vehicle door must be closed and latched before crate door is opened',
    'Crate door must be secured before vehicle door is opened',
    'Handoffs occur in enclosed spaces only (garage, building)',
    'Never transfer animals in open parking lots',
  ],
  leashRequirements: [
    'Martingale collars or Slip Leads are mandatory for all transports',
    'Flat collars are for ID tags only, never for control',
    'Double-leash system (slip lead + harness) for high-risk handoffs',
  ],
};

export const TRANSPORT_CERTIFICATION_REQUIREMENTS = {
  NOVICE: {
    modules: ['TRANSPORT_BASICS', 'TWO_DOOR_RULE', 'CRATE_SAFETY'],
    practicalRequired: false,
    minimumLegs: 0,
  },
  APPRENTICE: {
    modules: ['INJURED_ANIMAL_TRANSPORT', 'DISEASE_PREVENTION', 'VEHICLE_PREP'],
    practicalRequired: true,
    minimumLegs: 5,
    vehicleInspectionRequired: true,
  },
  EXPERT: {
    modules: ['LONG_HAUL_COORDINATION', 'MULTI_ANIMAL_TRANSPORT', 'EMERGENCY_PROTOCOLS'],
    practicalRequired: true,
    minimumLegs: 25,
    coordinatedChains: 5,
  },
};

// ═══════════════════════════════════════════════════════════════════
// TRACK C: EMERGENCY FOSTER CARE
// ═══════════════════════════════════════════════════════════════════

export interface FosterCertification {
  track: 'FOSTER_CARE';
  tier: VolunteerTier;
  
  // Biosecurity zoning
  biosecurityZoningTrained: boolean;
  hasDesignatedHotZone: boolean;       // Quarantine room
  hasTransitionZone: boolean;          // Bleach footbath/changing station
  homeInspectionPassed: boolean;
  homeInspectionDate?: string;
  
  // Neonatal care
  neonatalCareTrained: boolean;
  fadingKittenProtocolTrained: boolean;
  bottleFeedingCertified: boolean;
  
  // Medical step-down
  medicationAdministrationTrained: boolean;
  subcutaneousFluidsTrained: boolean;
  
  // Emotional resilience
  bridgeBuilderMindsetTrained: boolean; // "Teacher not Owner" mindset
  griefSupportResourcesProvided: boolean;
  
  // Track record
  littersSuccessfullyFostered: number;
  animalsAdopted: number;
}

/**
 * Biosecurity Zoning Protocol
 * Every foster home must be zoned to prevent disease transmission.
 */
export const BIOSECURITY_ZONES = {
  HOT_ZONE: {
    name: 'Hot Zone (Quarantine)',
    description: 'A bathroom or spare bedroom with no carpet if possible.',
    requirements: [
      'Dedicated supplies (litter scoop, bowls, bedding) that never leave the room',
      'Non-porous flooring preferred',
      'Separate ventilation if possible',
      'No contact with resident pets',
    ],
  },
  TRANSITION_ZONE: {
    name: 'Transition Zone',
    description: 'A designated changing station at the Hot Zone boundary.',
    requirements: [
      'Bleach footbath or designated Hot Zone shoes (e.g., Crocs)',
      'Over-shirt or gown that stays in this zone',
      'Hand sanitizer station',
    ],
  },
  COLD_ZONE: {
    name: 'Cold Zone',
    description: 'The rest of the house where resident pets live.',
    requirements: [
      'No foster animals allowed',
      'Normal household operation',
    ],
  },
  protocol: [
    '1. Enter Transition Zone -> Don Hot Zone shoes/gown',
    '2. Enter Hot Zone -> Care for animals',
    '3. Disinfect surfaces with Rescue™ (Accelerated Hydrogen Peroxide)',
    '4. Exit Hot Zone -> Remove shoes/gown in Transition Zone',
    '5. Wash hands for 30 seconds immediately',
  ],
};

/**
 * Fading Kitten Protocol
 * The "Sugar & Heat" Rule - Never feed a cold kitten
 */
export const FADING_KITTEN_PROTOCOL = {
  crashIndicators: [
    'Lethargy/Limpness',
    'Rejection of the bottle',
    'Temperature drop (hypothermia)',
    'Constant crying (sign of hunger or cold)',
  ],
  criticalRule: 'A common fatal error is feeding a cold kitten, which leads to aspiration pneumonia or ileus (gut stasis).',
  protocol: [
    '1. HEAT FIRST: Never feed a cold kitten. Warm slowly to 98°F using heating pad or body heat.',
    '2. SUGAR SECOND: Rub Karo syrup or dextrose on gums to spike blood sugar (hypoglycemia is a primary killer).',
    '3. FOOD LAST: Only feed formula once kitten is warm and has a suckle reflex.',
  ],
  targetTemperature: '98°F (36.7°C)',
};

export const FOSTER_CERTIFICATION_REQUIREMENTS = {
  NOVICE: {
    modules: ['FOSTER_BASICS', 'BIOSECURITY_101', 'QUARANTINE_PROTOCOLS'],
    practicalRequired: false,
    homeInspectionRequired: false,
  },
  APPRENTICE: {
    modules: ['NEONATAL_CARE', 'MEDICATION_ADMIN', 'FADING_KITTEN_PROTOCOL'],
    practicalRequired: true,
    homeInspectionRequired: true,
    successfulLitters: 1,
  },
  EXPERT: {
    modules: ['HOSPICE_CARE', 'SUBCUTANEOUS_FLUIDS', 'MENTOR_TRAINING'],
    practicalRequired: true,
    homeInspectionRequired: true,
    successfulLitters: 5,
    mentoredNewFosters: 2,
  },
};

// ═══════════════════════════════════════════════════════════════════
// MODERATOR TRACK: DIGITAL FIRST RESPONDER
// ═══════════════════════════════════════════════════════════════════

export interface ModeratorCertification {
  track: 'MODERATOR';
  tier: VolunteerTier;
  
  // Triage competency
  triageTrainingCompleted: boolean;
  abcProtocolTrained: boolean;        // Airway/Behavior/Context assessment
  triageAccuracyRate: number;         // Percentage
  
  // Mental health protections
  compassionFatigueTrainingCompleted: boolean;
  debriefSessionsAttended: number;
  
  // Governance skills
  antiVigilantismTrained: boolean;
  piiScrubbingTrained: boolean;
  fraudDetectionTrained: boolean;
  deEscalationTrained: boolean;
  
  // Session management
  totalModerationHours: number;
  lastSessionDate?: string;
  forcedBreaksTaken: number;          // Mandatory 2-hour breaks
  
  // Authority
  canDeclareTier1Emergency: boolean;
  canAccessLawEnforcementChannel: boolean;
}

/**
 * Compassion Fatigue Firewall
 * Technical safeguards for moderator wellbeing
 */
export const COMPASSION_FATIGUE_PROTOCOLS = {
  greyscaleDefault: {
    description: 'All Tier 1 imagery loads in greyscale and blurred by default',
    rationale: 'Reduces visceral shock of red blood, a known PTSD trigger',
    userAction: 'Moderator must actively click to "Unmask" the image',
  },
  twoHourHardStop: {
    description: 'No moderator permitted in Triage Queue for more than 2 consecutive hours',
    implementation: 'System automatically locks "Write" access after 120 minutes',
    cooldownPeriod: '30-minute mandatory lockout before resuming',
  },
  mandatoryDebrief: {
    description: 'Weekly peer-led support groups',
    focus: 'Emotional impact discussion, not case mechanics',
    rationale: 'Counters isolation inherent in digital work',
  },
};

export const MODERATOR_CERTIFICATION_REQUIREMENTS = {
  NOVICE: {
    modules: ['TRIAGE_FUNDAMENTALS', 'ABC_PROTOCOL', 'PLATFORM_ORIENTATION'],
    practicalRequired: false,
    minimumHours: 0,
  },
  APPRENTICE: {
    modules: ['FRAUD_DETECTION', 'ANTI_VIGILANTISM', 'COMPASSION_FATIGUE_AWARENESS'],
    practicalRequired: true,
    minimumHours: 20,
    triageAccuracyRequired: 0.85,
    supervisedSessions: 5,
  },
  EXPERT: {
    modules: ['CRISIS_INTERVENTION', 'INCIDENT_COMMANDER', 'MODERATOR_MENTOR'],
    practicalRequired: true,
    minimumHours: 100,
    triageAccuracyRequired: 0.95,
    canDeclareTier1: true,
    debriefSessionsRequired: 10,
  },
};

// ═══════════════════════════════════════════════════════════════════
// ANTI-VIGILANTISM PROTOCOLS
// ═══════════════════════════════════════════════════════════════════

/**
 * SOPs for preventing internet mob justice
 */
export const ANTI_VIGILANTISM_PROTOCOLS = {
  piiScrubbing: {
    description: 'Any post containing PII of alleged abuser must be immediately quarantined',
    piiTypes: ['addresses', 'license plates', 'phone numbers', 'full names', 'workplace info'],
    action: 'Move post to "Law Enforcement Only" hidden channel. Redact public post but keep animal status visible.',
  },
  justiceRedirection: {
    description: 'Redirect vigilante energy into legal action',
    script: `We understand your anger. However, posting this address alerts the abuser and may cause them to hide the animal or harm it further. We have forwarded this unredacted info to [Local Animal Control]. Please do not comment on the address or you will be banned.`,
  },
  escalationTiers: [
    { offense: 1, action: 'Warning and comment deletion' },
    { offense: 2, action: '7-day suspension' },
    { offense: 3, action: 'Permanent Ban (Zero Tolerance for incitement of violence)' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION SYSTEM (Trusted Reporter)
// ═══════════════════════════════════════════════════════════════════

export interface UserVerification {
  userId: string;
  badgeLevel: VerificationBadge;
  
  // Verification steps completed
  phoneVerified: boolean;
  phoneVerifiedAt?: string;
  
  identityVerified: boolean;      // Driver's license for individuals
  identityVerifiedAt?: string;
  
  organizationVerified: boolean;  // 501c3 IRS determination letter
  organizationName?: string;
  organizationEIN?: string;
  organizationVerifiedAt?: string;
  
  backgroundCheckCompleted: boolean;
  backgroundCheckDate?: string;
  
  // Permissions
  canPostImmediately: boolean;
  canRequestSupplies: boolean;      // Amazon Wishlist only
  canRequestDonations: boolean;     // Cash donations
  canOrganizeTransportChains: boolean;
}

export const VERIFICATION_BADGE_PERMISSIONS: Record<VerificationBadge, {
  description: string;
  postingBehavior: string;
  donationPermissions: string;
  requirements: string[];
}> = {
  GREY: {
    description: 'Unverified User',
    postingBehavior: 'Posts enter Moderation Queue before going live',
    donationPermissions: 'Cannot request donations',
    requirements: ['Account creation'],
  },
  BLUE: {
    description: 'Verified Reporter',
    postingBehavior: 'Posts go live immediately',
    donationPermissions: 'Can request "Supplies Only" (Amazon Wishlist), no cash',
    requirements: ['Phone number verification'],
  },
  GOLD: {
    description: 'Certified Rescuer',
    postingBehavior: 'Posts go live immediately with priority visibility',
    donationPermissions: 'Can request cash donations and organize transport chains',
    requirements: [
      '501c3 IRS determination letter (for organizations)',
      'OR background check + identity verification (for individuals)',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
// SKILL TREE (Gamification)
// ═══════════════════════════════════════════════════════════════════

export interface SkillTreeNode {
  id: string;
  name: string;
  track: CertificationTrack;
  tier: VolunteerTier;
  description: string;
  prerequisites: string[];
  unlocks: string[];
  badgeIcon: string;
}

export const SKILL_TREE: SkillTreeNode[] = [
  // Moderator Track
  {
    id: 'mod_watcher',
    name: 'Watcher',
    track: 'MODERATOR',
    tier: 'NOVICE',
    description: 'Completed Orientation. Can comment and view Alpha posts.',
    prerequisites: [],
    unlocks: ['mod_triage_trainee'],
    badgeIcon: '👁️',
  },
  {
    id: 'mod_triage_trainee',
    name: 'Triage Trainee',
    track: 'MODERATOR',
    tier: 'APPRENTICE',
    description: 'Can triage Tier 2/3 posts under supervision.',
    prerequisites: ['mod_watcher', 'BASIC_SAFETY_QUIZ'],
    unlocks: ['mod_incident_commander'],
    badgeIcon: '🎯',
  },
  {
    id: 'mod_incident_commander',
    name: 'Incident Commander',
    track: 'MODERATOR',
    tier: 'EXPERT',
    description: '100+ Hours Moderation + Crisis Intervention Cert. Can declare Tier 1 Emergencies.',
    prerequisites: ['mod_triage_trainee', 'CRISIS_INTERVENTION_CERT'],
    unlocks: [],
    badgeIcon: '🎖️',
  },
  
  // Transport Track
  {
    id: 'transport_helper',
    name: 'Transport Helper',
    track: 'TRANSPORT',
    tier: 'NOVICE',
    description: 'Completed Two-Door Training. Can assist on supervised transports.',
    prerequisites: [],
    unlocks: ['transport_leg'],
    badgeIcon: '🚗',
  },
  {
    id: 'transport_leg',
    name: 'Transport Leg',
    track: 'TRANSPORT',
    tier: 'APPRENTICE',
    description: 'Completed 5 successful transports + Two-Door Training Module.',
    prerequisites: ['transport_helper', 'FIVE_TRANSPORTS'],
    unlocks: ['transport_coordinator'],
    badgeIcon: '🚙',
  },
  {
    id: 'transport_coordinator',
    name: 'Transport Coordinator',
    track: 'TRANSPORT',
    tier: 'EXPERT',
    description: 'Can organize multi-leg transport chains. Access to Long-Haul coordination channels.',
    prerequisites: ['transport_leg', 'TWENTY_FIVE_TRANSPORTS'],
    unlocks: [],
    badgeIcon: '🚛',
  },
  
  // Foster Track
  {
    id: 'foster_helper',
    name: 'Foster Helper',
    track: 'FOSTER_CARE',
    tier: 'NOVICE',
    description: 'Completed Biosecurity Training. Ready for first foster.',
    prerequisites: [],
    unlocks: ['kitten_nurse'],
    badgeIcon: '🏠',
  },
  {
    id: 'kitten_nurse',
    name: 'Kitten Nurse',
    track: 'FOSTER_CARE',
    tier: 'APPRENTICE',
    description: 'Completed Neonatal Module + 1 successful litter foster.',
    prerequisites: ['foster_helper', 'NEONATAL_CERT', 'ONE_LITTER'],
    unlocks: ['foster_coordinator'],
    badgeIcon: '🍼',
  },
  {
    id: 'foster_coordinator',
    name: 'Foster Coordinator',
    track: 'FOSTER_CARE',
    tier: 'EXPERT',
    description: 'Can mentor new fosters and coordinate foster network.',
    prerequisites: ['kitten_nurse', 'FIVE_LITTERS', 'MENTORED_TWO'],
    unlocks: [],
    badgeIcon: '🏆',
  },
  
  // Trapper Track
  {
    id: 'trap_helper',
    name: 'Trap Helper',
    track: 'FIELD_TRAPPER',
    tier: 'NOVICE',
    description: 'Completed TNR Basics. Can assist on supervised trapping.',
    prerequisites: [],
    unlocks: ['colony_trapper'],
    badgeIcon: '🪤',
  },
  {
    id: 'colony_trapper',
    name: 'Colony Trapper',
    track: 'FIELD_TRAPPER',
    tier: 'APPRENTICE',
    description: 'Proficient in box traps. Can lead colony trapping.',
    prerequisites: ['trap_helper', 'BOX_TRAP_CERT', 'FIVE_TRAPS'],
    unlocks: ['master_trapper'],
    badgeIcon: '🐱',
  },
  {
    id: 'master_trapper',
    name: 'Master Trapper',
    track: 'FIELD_TRAPPER',
    tier: 'EXPERT',
    description: 'Certified in Drop Trap. "When a Master Trapper speaks, the community listens."',
    prerequisites: ['colony_trapper', 'DROP_TRAP_CERT', 'TWENTY_FIVE_TRAPS'],
    unlocks: [],
    badgeIcon: '👑',
  },
];
