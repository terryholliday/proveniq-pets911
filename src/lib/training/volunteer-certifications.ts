// ============================================================
// VOLUNTEER CERTIFICATION SYSTEM — BADGE & SKILL TREE
// Source: "Pet Rescue Training Protocol" Research Document (2026)
// Open Badges 2.0 compliant credential ecosystem
// ============================================================

import type { BadgeTier, VolunteerBadge, VolunteerCertification } from '../types';

/**
 * Badge definitions from Pet Rescue Protocol:
 * 
 * NOVICE (Grey): Basic orientation complete. Can observe and comment.
 * APPRENTICE (Green): Specialized training complete. Can participate in operations.
 * EXPERT (Gold): Advanced certification. Has authority in operations.
 */

export interface BadgeDefinition {
  badge: VolunteerBadge;
  tier: BadgeTier;
  display_name: string;
  description: string;
  requirements: {
    training_modules: string[];
    min_training_hours: number;
    min_field_hours: number;
    requires_mentor_verification: boolean;
    prerequisites: VolunteerBadge[];
  };
  permissions: {
    can_view_tier1_posts: boolean;
    can_view_tier2_posts: boolean;
    can_declare_tier1_emergency: boolean;
    can_coordinate_transport: boolean;
    can_request_donations: boolean;
    can_moderate_comments: boolean;
  };
  color: string;
  icon: string;
  expires_after_months: number | null;
}

export const BADGE_DEFINITIONS: Record<VolunteerBadge, BadgeDefinition> = {
  // ============ NOVICE TIER (Grey) ============
  WATCHER: {
    badge: 'WATCHER',
    tier: 'NOVICE',
    display_name: 'Watcher',
    description: 'Completed basic orientation. Can observe posts and comment on Alpha-tier incidents.',
    requirements: {
      training_modules: ['ORIENTATION_101', 'BASIC_SAFETY'],
      min_training_hours: 1,
      min_field_hours: 0,
      requires_mentor_verification: false,
      prerequisites: [],
    },
    permissions: {
      can_view_tier1_posts: false,
      can_view_tier2_posts: false,
      can_declare_tier1_emergency: false,
      can_coordinate_transport: false,
      can_request_donations: false,
      can_moderate_comments: false,
    },
    color: '#6B7280', // gray-500
    icon: 'eye',
    expires_after_months: null,
  },

  // ============ APPRENTICE TIER (Green) ============
  TRANSPORT_LEG: {
    badge: 'TRANSPORT_LEG',
    tier: 'APPRENTICE',
    display_name: 'Transport Leg',
    description: 'Certified in safe animal transport. Completed Two-Door Rule training and 5 successful transports.',
    requirements: {
      training_modules: ['TRANSPORT_BASICS', 'TWO_DOOR_RULE', 'VEHICLE_SAFETY', 'DISEASE_PREVENTION'],
      min_training_hours: 4,
      min_field_hours: 10,
      requires_mentor_verification: true,
      prerequisites: ['WATCHER'],
    },
    permissions: {
      can_view_tier1_posts: false,
      can_view_tier2_posts: true,
      can_declare_tier1_emergency: false,
      can_coordinate_transport: false,
      can_request_donations: false,
      can_moderate_comments: false,
    },
    color: '#22C55E', // green-500
    icon: 'car',
    expires_after_months: 24,
  },

  KITTEN_NURSE: {
    badge: 'KITTEN_NURSE',
    tier: 'APPRENTICE',
    display_name: 'Kitten Nurse',
    description: 'Certified in neonatal care. Completed Fading Kitten Protocol and successfully fostered 1 litter.',
    requirements: {
      training_modules: ['NEONATAL_BASICS', 'FADING_KITTEN_PROTOCOL', 'BOTTLE_FEEDING', 'BIOSECURITY_101'],
      min_training_hours: 6,
      min_field_hours: 20,
      requires_mentor_verification: true,
      prerequisites: ['WATCHER'],
    },
    permissions: {
      can_view_tier1_posts: false,
      can_view_tier2_posts: true,
      can_declare_tier1_emergency: false,
      can_coordinate_transport: false,
      can_request_donations: false,
      can_moderate_comments: false,
    },
    color: '#22C55E', // green-500
    icon: 'heart',
    expires_after_months: 24,
  },

  COLONY_CARETAKER: {
    badge: 'COLONY_CARETAKER',
    tier: 'APPRENTICE',
    display_name: 'Colony Caretaker',
    description: 'Trained in TNR colony management and feral cat identification.',
    requirements: {
      training_modules: ['TNR_BASICS', 'COLONY_MANAGEMENT', 'FERAL_VS_STRAY', 'TRAPPING_INTRO'],
      min_training_hours: 4,
      min_field_hours: 15,
      requires_mentor_verification: true,
      prerequisites: ['WATCHER'],
    },
    permissions: {
      can_view_tier1_posts: false,
      can_view_tier2_posts: true,
      can_declare_tier1_emergency: false,
      can_coordinate_transport: false,
      can_request_donations: false,
      can_moderate_comments: false,
    },
    color: '#22C55E', // green-500
    icon: 'users',
    expires_after_months: 24,
  },

  // ============ EXPERT TIER (Gold) ============
  INCIDENT_COMMANDER: {
    badge: 'INCIDENT_COMMANDER',
    tier: 'EXPERT',
    display_name: 'Incident Commander',
    description: '100+ hours moderation experience. Can declare Tier 1 emergencies and coordinate multi-volunteer responses.',
    requirements: {
      training_modules: ['TRIAGE_ADVANCED', 'CRISIS_INTERVENTION', 'MODERATOR_ETHICS', 'LEGAL_FRAMEWORK'],
      min_training_hours: 20,
      min_field_hours: 100,
      requires_mentor_verification: true,
      prerequisites: ['TRANSPORT_LEG', 'KITTEN_NURSE'],
    },
    permissions: {
      can_view_tier1_posts: true,
      can_view_tier2_posts: true,
      can_declare_tier1_emergency: true,
      can_coordinate_transport: true,
      can_request_donations: false,
      can_moderate_comments: true,
    },
    color: '#EAB308', // yellow-500
    icon: 'shield',
    expires_after_months: 12,
  },

  MASTER_TRAPPER: {
    badge: 'MASTER_TRAPPER',
    tier: 'EXPERT',
    display_name: 'Master Trapper',
    description: 'Expert in humane trapping including drop traps and remote triggers. Certified in wildlife protocol.',
    requirements: {
      training_modules: ['TRAPPING_ADVANCED', 'DROP_TRAP_MASTERY', 'WILDLIFE_PROTOCOL', 'DE_ESCALATION'],
      min_training_hours: 15,
      min_field_hours: 50,
      requires_mentor_verification: true,
      prerequisites: ['COLONY_CARETAKER'],
    },
    permissions: {
      can_view_tier1_posts: true,
      can_view_tier2_posts: true,
      can_declare_tier1_emergency: false,
      can_coordinate_transport: true,
      can_request_donations: false,
      can_moderate_comments: false,
    },
    color: '#EAB308', // yellow-500
    icon: 'target',
    expires_after_months: 12,
  },

  DISASTER_RESPONSE: {
    badge: 'DISASTER_RESPONSE',
    tier: 'EXPERT',
    display_name: 'Disaster Response',
    description: 'FEMA IS-10.a and IS-11.a certified. Authorized for large-scale emergency coordination.',
    requirements: {
      training_modules: ['FEMA_IS_10A', 'FEMA_IS_11A', 'MASS_SHELTERING', 'INCIDENT_COMMAND_SYSTEM'],
      min_training_hours: 25,
      min_field_hours: 40,
      requires_mentor_verification: true,
      prerequisites: ['INCIDENT_COMMANDER'],
    },
    permissions: {
      can_view_tier1_posts: true,
      can_view_tier2_posts: true,
      can_declare_tier1_emergency: true,
      can_coordinate_transport: true,
      can_request_donations: true,
      can_moderate_comments: true,
    },
    color: '#EAB308', // yellow-500
    icon: 'alert-triangle',
    expires_after_months: 12,
  },

  BIOSECURITY_SPECIALIST: {
    badge: 'BIOSECURITY_SPECIALIST',
    tier: 'EXPERT',
    display_name: 'Biosecurity Specialist',
    description: 'Expert in disease prevention and quarantine protocols. Can certify foster homes.',
    requirements: {
      training_modules: ['BIOSECURITY_ADVANCED', 'QUARANTINE_PROTOCOLS', 'DISEASE_IDENTIFICATION', 'FOSTER_CERTIFICATION'],
      min_training_hours: 15,
      min_field_hours: 30,
      requires_mentor_verification: true,
      prerequisites: ['KITTEN_NURSE'],
    },
    permissions: {
      can_view_tier1_posts: true,
      can_view_tier2_posts: true,
      can_declare_tier1_emergency: false,
      can_coordinate_transport: false,
      can_request_donations: false,
      can_moderate_comments: true,
    },
    color: '#EAB308', // yellow-500
    icon: 'shield-check',
    expires_after_months: 12,
  },
};

// Training module definitions
export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  has_quiz: boolean;
  passing_score: number;
  content_type: 'VIDEO' | 'DOCUMENT' | 'SIMULATION' | 'WEBINAR';
}

export const TRAINING_MODULES: Record<string, TrainingModule> = {
  // Novice modules
  ORIENTATION_101: {
    id: 'ORIENTATION_101',
    name: 'Mayday Orientation',
    description: 'Introduction to the Mayday platform, mission, and community guidelines.',
    duration_minutes: 30,
    has_quiz: true,
    passing_score: 80,
    content_type: 'VIDEO',
  },
  BASIC_SAFETY: {
    id: 'BASIC_SAFETY',
    name: 'Basic Safety',
    description: 'Understanding risks in animal rescue and personal safety protocols.',
    duration_minutes: 30,
    has_quiz: true,
    passing_score: 80,
    content_type: 'VIDEO',
  },

  // Transport modules
  TRANSPORT_BASICS: {
    id: 'TRANSPORT_BASICS',
    name: 'Transport Fundamentals',
    description: 'Basics of safe animal transport including crate selection and vehicle preparation.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 85,
    content_type: 'VIDEO',
  },
  TWO_DOOR_RULE: {
    id: 'TWO_DOOR_RULE',
    name: 'The Two-Door Rule',
    description: 'Critical protocol ensuring animals never have direct access to open sky. The "Airlock" procedure.',
    duration_minutes: 30,
    has_quiz: true,
    passing_score: 100,
    content_type: 'SIMULATION',
  },
  VEHICLE_SAFETY: {
    id: 'VEHICLE_SAFETY',
    name: 'Vehicle Safety & Climate Control',
    description: 'Temperature monitoring, ventilation requirements, and heatstroke prevention.',
    duration_minutes: 30,
    has_quiz: true,
    passing_score: 90,
    content_type: 'VIDEO',
  },
  DISEASE_PREVENTION: {
    id: 'DISEASE_PREVENTION',
    name: 'Disease Prevention in Transport',
    description: 'Sanitization protocols, parvocidal agents, and preventing disease transmission.',
    duration_minutes: 30,
    has_quiz: true,
    passing_score: 85,
    content_type: 'VIDEO',
  },

  // Neonatal modules
  NEONATAL_BASICS: {
    id: 'NEONATAL_BASICS',
    name: 'Neonatal Care Fundamentals',
    description: 'Introduction to bottle baby care, feeding schedules, and developmental milestones.',
    duration_minutes: 60,
    has_quiz: true,
    passing_score: 85,
    content_type: 'VIDEO',
  },
  FADING_KITTEN_PROTOCOL: {
    id: 'FADING_KITTEN_PROTOCOL',
    name: 'Fading Kitten Protocol',
    description: 'The "Sugar & Heat" rule. Recognizing crash indicators and emergency intervention.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 100,
    content_type: 'SIMULATION',
  },
  BOTTLE_FEEDING: {
    id: 'BOTTLE_FEEDING',
    name: 'Bottle Feeding Technique',
    description: 'Proper positioning, formula preparation, and aspiration prevention.',
    duration_minutes: 30,
    has_quiz: true,
    passing_score: 90,
    content_type: 'VIDEO',
  },
  BIOSECURITY_101: {
    id: 'BIOSECURITY_101',
    name: 'Biosecurity Basics',
    description: 'Hot Zone/Cold Zone setup, transition protocols, and PPE usage.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 90,
    content_type: 'VIDEO',
  },

  // TNR/Colony modules
  TNR_BASICS: {
    id: 'TNR_BASICS',
    name: 'TNR Fundamentals',
    description: 'Understanding Trap-Neuter-Return as humane population control.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 80,
    content_type: 'VIDEO',
  },
  COLONY_MANAGEMENT: {
    id: 'COLONY_MANAGEMENT',
    name: 'Colony Management',
    description: 'Feeding schedules, population tracking, and community relations.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 80,
    content_type: 'VIDEO',
  },
  FERAL_VS_STRAY: {
    id: 'FERAL_VS_STRAY',
    name: 'Feral vs. Stray Assessment',
    description: 'Behavioral indicators distinguishing feral cats from lost pets.',
    duration_minutes: 30,
    has_quiz: true,
    passing_score: 85,
    content_type: 'DOCUMENT',
  },
  TRAPPING_INTRO: {
    id: 'TRAPPING_INTRO',
    name: 'Introduction to Humane Trapping',
    description: 'Box trap mechanics, bait selection, and trap placement.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 85,
    content_type: 'VIDEO',
  },

  // Advanced modules
  TRIAGE_ADVANCED: {
    id: 'TRIAGE_ADVANCED',
    name: 'Advanced Digital Triage',
    description: 'The 3-Tier system, ABC assessment, and clinical reasoning.',
    duration_minutes: 90,
    has_quiz: true,
    passing_score: 90,
    content_type: 'WEBINAR',
  },
  CRISIS_INTERVENTION: {
    id: 'CRISIS_INTERVENTION',
    name: 'Crisis Intervention',
    description: 'De-escalation techniques, vigilante prevention, and emotional support.',
    duration_minutes: 60,
    has_quiz: true,
    passing_score: 85,
    content_type: 'WEBINAR',
  },
  MODERATOR_ETHICS: {
    id: 'MODERATOR_ETHICS',
    name: 'Moderator Ethics',
    description: 'Anti-doxxing protocols, PII handling, and platform liability.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 100,
    content_type: 'DOCUMENT',
  },
  LEGAL_FRAMEWORK: {
    id: 'LEGAL_FRAMEWORK',
    name: 'Legal Framework',
    description: 'Good Samaritan laws, scope of practice, and liability waivers.',
    duration_minutes: 60,
    has_quiz: true,
    passing_score: 85,
    content_type: 'DOCUMENT',
  },
  TRAPPING_ADVANCED: {
    id: 'TRAPPING_ADVANCED',
    name: 'Advanced Trapping Techniques',
    description: 'Drop traps, remote triggers, and trap-shy cat strategies.',
    duration_minutes: 60,
    has_quiz: true,
    passing_score: 90,
    content_type: 'SIMULATION',
  },
  DROP_TRAP_MASTERY: {
    id: 'DROP_TRAP_MASTERY',
    name: 'Drop Trap Mastery',
    description: 'Manual deployment, timing, and transfer cage techniques.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 90,
    content_type: 'SIMULATION',
  },
  WILDLIFE_PROTOCOL: {
    id: 'WILDLIFE_PROTOCOL',
    name: 'Wildlife Protocol',
    description: 'Handling non-target captures, rabies vectors, and safe release.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 100,
    content_type: 'VIDEO',
  },
  DE_ESCALATION: {
    id: 'DE_ESCALATION',
    name: 'De-escalation & Community Relations',
    description: 'The E.A.R. method for handling angry neighbors and conflict resolution.',
    duration_minutes: 30,
    has_quiz: true,
    passing_score: 85,
    content_type: 'WEBINAR',
  },
  FEMA_IS_10A: {
    id: 'FEMA_IS_10A',
    name: 'FEMA IS-10.a',
    description: 'Animals in Disasters: Awareness and Preparedness.',
    duration_minutes: 120,
    has_quiz: true,
    passing_score: 75,
    content_type: 'DOCUMENT',
  },
  FEMA_IS_11A: {
    id: 'FEMA_IS_11A',
    name: 'FEMA IS-11.a',
    description: 'Animals in Disasters: Community Planning.',
    duration_minutes: 120,
    has_quiz: true,
    passing_score: 75,
    content_type: 'DOCUMENT',
  },
  MASS_SHELTERING: {
    id: 'MASS_SHELTERING',
    name: 'Mass Sheltering Operations',
    description: 'Large-scale intake, triage, and tracking during disasters.',
    duration_minutes: 90,
    has_quiz: true,
    passing_score: 85,
    content_type: 'WEBINAR',
  },
  INCIDENT_COMMAND_SYSTEM: {
    id: 'INCIDENT_COMMAND_SYSTEM',
    name: 'Incident Command System',
    description: 'ICS structure, roles, and communication protocols.',
    duration_minutes: 60,
    has_quiz: true,
    passing_score: 80,
    content_type: 'DOCUMENT',
  },
  BIOSECURITY_ADVANCED: {
    id: 'BIOSECURITY_ADVANCED',
    name: 'Advanced Biosecurity',
    description: 'Disease identification, quarantine duration, and outbreak management.',
    duration_minutes: 90,
    has_quiz: true,
    passing_score: 90,
    content_type: 'WEBINAR',
  },
  QUARANTINE_PROTOCOLS: {
    id: 'QUARANTINE_PROTOCOLS',
    name: 'Quarantine Protocols',
    description: 'FPV, parvo, and ringworm quarantine requirements.',
    duration_minutes: 60,
    has_quiz: true,
    passing_score: 90,
    content_type: 'DOCUMENT',
  },
  DISEASE_IDENTIFICATION: {
    id: 'DISEASE_IDENTIFICATION',
    name: 'Disease Identification',
    description: 'Visual signs of common shelter diseases and when to escalate.',
    duration_minutes: 60,
    has_quiz: true,
    passing_score: 85,
    content_type: 'VIDEO',
  },
  FOSTER_CERTIFICATION: {
    id: 'FOSTER_CERTIFICATION',
    name: 'Foster Home Certification',
    description: 'Inspecting and certifying foster homes for biosecurity compliance.',
    duration_minutes: 45,
    has_quiz: true,
    passing_score: 90,
    content_type: 'DOCUMENT',
  },
};

// Helper functions
export function getBadgeDefinition(badge: VolunteerBadge): BadgeDefinition {
  return BADGE_DEFINITIONS[badge];
}

export function getBadgesByTier(tier: BadgeTier): VolunteerBadge[] {
  return Object.entries(BADGE_DEFINITIONS)
    .filter(([_, def]) => def.tier === tier)
    .map(([badge]) => badge as VolunteerBadge);
}

export function canEarnBadge(
  targetBadge: VolunteerBadge,
  currentBadges: VolunteerBadge[],
  completedModules: string[],
  trainingHours: number,
  fieldHours: number
): { eligible: boolean; missing: string[] } {
  const definition = BADGE_DEFINITIONS[targetBadge];
  const missing: string[] = [];

  // Check prerequisites
  for (const prereq of definition.requirements.prerequisites) {
    if (!currentBadges.includes(prereq)) {
      missing.push(`Prerequisite badge: ${BADGE_DEFINITIONS[prereq].display_name}`);
    }
  }

  // Check training modules
  for (const module of definition.requirements.training_modules) {
    if (!completedModules.includes(module)) {
      missing.push(`Training module: ${TRAINING_MODULES[module]?.name || module}`);
    }
  }

  // Check hours
  if (trainingHours < definition.requirements.min_training_hours) {
    missing.push(`Training hours: ${definition.requirements.min_training_hours - trainingHours} more needed`);
  }

  if (fieldHours < definition.requirements.min_field_hours) {
    missing.push(`Field hours: ${definition.requirements.min_field_hours - fieldHours} more needed`);
  }

  return {
    eligible: missing.length === 0,
    missing,
  };
}

export function isCertificationExpired(cert: VolunteerCertification): boolean {
  if (!cert.expires_at) return false;
  return new Date(cert.expires_at) < new Date();
}

export function getHighestTierBadge(badges: VolunteerBadge[]): VolunteerBadge | null {
  const expertBadges = badges.filter(b => BADGE_DEFINITIONS[b].tier === 'EXPERT');
  if (expertBadges.length > 0) return expertBadges[0];

  const apprenticeBadges = badges.filter(b => BADGE_DEFINITIONS[b].tier === 'APPRENTICE');
  if (apprenticeBadges.length > 0) return apprenticeBadges[0];

  const noviceBadges = badges.filter(b => BADGE_DEFINITIONS[b].tier === 'NOVICE');
  if (noviceBadges.length > 0) return noviceBadges[0];

  return null;
}
