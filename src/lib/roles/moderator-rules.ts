/**
 * MODERATOR RULES & PROCEDURES
 * 
 * Comprehensive guidelines for Mayday moderators.
 * These rules are binding and enforceable.
 */

import type { RoleId } from './role-hierarchy';

// ═══════════════════════════════════════════════════════════════════
// MODERATOR CODE OF CONDUCT
// ═══════════════════════════════════════════════════════════════════

export const MODERATOR_CODE_OF_CONDUCT = {
  version: '1.0.0',
  effectiveDate: '2026-01-01',
  
  principles: [
    {
      id: 'P1',
      title: 'Animal Welfare First',
      description: 'Every decision must prioritize the safety and wellbeing of animals. When in doubt, err on the side of caution.',
    },
    {
      id: 'P2',
      title: 'Verified Before Shared',
      description: 'Never share unverified information with pet owners. False hope causes harm.',
    },
    {
      id: 'P3',
      title: 'Privacy Protection',
      description: 'Protect the privacy of finders, owners, and volunteers. Never share personal information publicly.',
    },
    {
      id: 'P4',
      title: 'Impartial Decision-Making',
      description: 'Make decisions based on evidence, not emotion. Follow established protocols.',
    },
    {
      id: 'P5',
      title: 'Chain of Command',
      description: 'Escalate issues appropriately. Know your limits and ask for help when needed.',
    },
    {
      id: 'P6',
      title: 'Documentation',
      description: 'Document all significant actions. The audit trail protects everyone.',
    },
    {
      id: 'P7',
      title: 'Confidentiality',
      description: 'Information learned through moderation must not be shared outside the platform.',
    },
    {
      id: 'P8',
      title: 'No Personal Benefit',
      description: 'Never use your role for personal gain or to benefit friends/family preferentially.',
    },
  ],

  violations: {
    minor: [
      'Failing to document actions',
      'Delayed response without notification',
      'Minor protocol deviation (no harm caused)',
    ],
    moderate: [
      'Sharing unverified match information with owners',
      'Failing to escalate when required',
      'Repeated minor violations',
      'Inadequate case documentation',
    ],
    major: [
      'Sharing PII publicly',
      'Making unauthorized T4/T5 alerts',
      'Ignoring fraud signals',
      'Falsifying records',
    ],
    terminable: [
      'Deliberate privacy breach',
      'Accepting bribes or gifts',
      'Harassment of users or volunteers',
      'Falsifying background check information',
      'Coordinating with scammers',
    ],
  },

  consequences: {
    minor: 'Verbal warning, additional training required',
    moderate: 'Written warning, supervised probation (30 days)',
    major: 'Immediate suspension, review by Lead Moderator',
    terminable: 'Immediate termination, permanent ban, potential legal referral',
  },
};

// ═══════════════════════════════════════════════════════════════════
// STANDARD OPERATING PROCEDURES
// ═══════════════════════════════════════════════════════════════════

export interface Procedure {
  id: string;
  title: string;
  category: 'case_management' | 'match_verification' | 'volunteer_coordination' | 'escalation' | 'safety';
  applicableRoles: RoleId[];
  steps: ProcedureStep[];
  timeLimit?: string;
  escalationPath: RoleId[];
}

export interface ProcedureStep {
  order: number;
  action: string;
  required: boolean;
  documentation: string;
  failureAction?: string;
}

export const STANDARD_PROCEDURES: Procedure[] = [
  // ─────────────────────────────────────────────────────────────────
  // CASE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-001',
    title: 'New Case Triage',
    category: 'case_management',
    applicableRoles: ['lead_moderator', 'moderator', 'junior_moderator'],
    timeLimit: '30 minutes from submission',
    escalationPath: ['lead_moderator', 'regional_coordinator'],
    steps: [
      {
        order: 1,
        action: 'Review submitted information for completeness',
        required: true,
        documentation: 'Note any missing required fields',
        failureAction: 'Request additional information from submitter',
      },
      {
        order: 2,
        action: 'Verify photos meet quality standards (clear, shows animal)',
        required: true,
        documentation: 'Mark photo quality in case notes',
        failureAction: 'Request better photos',
      },
      {
        order: 3,
        action: 'Check for duplicate cases in system',
        required: true,
        documentation: 'Record search performed and results',
      },
      {
        order: 4,
        action: 'Assign appropriate tier based on evidence and urgency',
        required: true,
        documentation: 'Record tier assignment with justification',
      },
      {
        order: 5,
        action: 'Initiate appropriate alerts based on tier',
        required: true,
        documentation: 'Record alerts triggered',
      },
    ],
  },

  {
    id: 'SOP-002',
    title: 'Case Escalation',
    category: 'escalation',
    applicableRoles: ['lead_moderator', 'moderator', 'junior_moderator'],
    timeLimit: '15 minutes for urgent escalations',
    escalationPath: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
    steps: [
      {
        order: 1,
        action: 'Document reason for escalation',
        required: true,
        documentation: 'Clear description of why escalation is needed',
      },
      {
        order: 2,
        action: 'Notify next level in chain via system message',
        required: true,
        documentation: 'Record notification sent timestamp',
      },
      {
        order: 3,
        action: 'If no response in 15 minutes, escalate to next level',
        required: true,
        documentation: 'Record each escalation attempt',
      },
      {
        order: 4,
        action: 'For life-threatening situations, escalate directly to Regional Coordinator',
        required: true,
        documentation: 'Document emergency bypass',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // MATCH VERIFICATION
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-003',
    title: 'Match Verification (False Hope Prevention)',
    category: 'match_verification',
    applicableRoles: ['lead_moderator', 'moderator'],
    timeLimit: '2 hours from match suggestion',
    escalationPath: ['lead_moderator', 'regional_coordinator'],
    steps: [
      {
        order: 1,
        action: 'Review AI confidence score and matching factors',
        required: true,
        documentation: 'Record AI score and key matching factors',
      },
      {
        order: 2,
        action: 'Compare photos side-by-side (lost vs found)',
        required: true,
        documentation: 'Note specific similarities and differences',
      },
      {
        order: 3,
        action: 'Verify species, breed, size, and color match',
        required: true,
        documentation: 'Checklist of physical characteristics',
        failureAction: 'Reject match if species differs',
      },
      {
        order: 4,
        action: 'Check distinctive markings alignment',
        required: true,
        documentation: 'List matching and non-matching marks',
      },
      {
        order: 5,
        action: 'Verify geographic plausibility (found location vs last seen)',
        required: true,
        documentation: 'Record distance and travel feasibility',
      },
      {
        order: 6,
        action: 'If microchip available, request shelter scan',
        required: false,
        documentation: 'Record chip number and registry result',
      },
      {
        order: 7,
        action: 'Make verification decision: Approve, Reject, or Need More Info',
        required: true,
        documentation: 'Full justification for decision',
      },
      {
        order: 8,
        action: 'If approved, authorize owner notification (system handles)',
        required: true,
        documentation: 'Record notification authorization',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // VOLUNTEER COORDINATION
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-004',
    title: 'Volunteer Dispatch',
    category: 'volunteer_coordination',
    applicableRoles: ['lead_moderator', 'moderator'],
    timeLimit: '15 minutes for urgent requests',
    escalationPath: ['lead_moderator', 'regional_coordinator'],
    steps: [
      {
        order: 1,
        action: 'Assess dispatch request urgency and type',
        required: true,
        documentation: 'Record priority level assigned',
      },
      {
        order: 2,
        action: 'Search for available volunteers matching criteria',
        required: true,
        documentation: 'Record search parameters used',
      },
      {
        order: 3,
        action: 'Select best-matched volunteer (proximity, availability, capability)',
        required: true,
        documentation: 'Record selection rationale',
      },
      {
        order: 4,
        action: 'Send dispatch notification via system',
        required: true,
        documentation: 'Record notification sent',
      },
      {
        order: 5,
        action: 'Monitor for response (5-minute intervals)',
        required: true,
        documentation: 'Record response or lack thereof',
      },
      {
        order: 6,
        action: 'If no response in 15 minutes, dispatch next volunteer',
        required: true,
        documentation: 'Record escalation to backup',
      },
      {
        order: 7,
        action: 'Confirm volunteer arrival and task completion',
        required: true,
        documentation: 'Record completion status',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // SAFETY PROCEDURES
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'SOP-005',
    title: 'Scam/Fraud Response',
    category: 'safety',
    applicableRoles: ['lead_moderator', 'moderator'],
    timeLimit: 'Immediate',
    escalationPath: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
    steps: [
      {
        order: 1,
        action: 'Review flagged message/activity',
        required: true,
        documentation: 'Screenshot and record flagged content',
      },
      {
        order: 2,
        action: 'Assess threat level (low/medium/high/critical)',
        required: true,
        documentation: 'Record threat assessment with reasoning',
      },
      {
        order: 3,
        action: 'For HIGH/CRITICAL: Immediately block user communication',
        required: true,
        documentation: 'Record block action',
      },
      {
        order: 4,
        action: 'Notify affected pet owner of blocked attempt',
        required: true,
        documentation: 'Record owner notification',
      },
      {
        order: 5,
        action: 'If ransom demand: Escalate to Foundation Admin immediately',
        required: true,
        documentation: 'Record escalation',
      },
      {
        order: 6,
        action: 'Preserve all evidence in audit log',
        required: true,
        documentation: 'Confirm audit log entries',
      },
      {
        order: 7,
        action: 'Consider IP blacklist for repeated offenders',
        required: false,
        documentation: 'Record blacklist decision',
      },
    ],
  },

  {
    id: 'SOP-006',
    title: 'Injured Animal Report',
    category: 'safety',
    applicableRoles: ['lead_moderator', 'moderator', 'junior_moderator'],
    timeLimit: '10 minutes',
    escalationPath: ['lead_moderator', 'regional_coordinator'],
    steps: [
      {
        order: 1,
        action: 'Assess reported injury severity from description/photos',
        required: true,
        documentation: 'Record injury assessment',
      },
      {
        order: 2,
        action: 'For LIFE-THREATENING: Immediately provide emergency vet contacts',
        required: true,
        documentation: 'Record emergency referral',
      },
      {
        order: 3,
        action: 'Dispatch nearest emergency-capable volunteer if available',
        required: true,
        documentation: 'Record dispatch attempt',
      },
      {
        order: 4,
        action: 'Contact nearest shelter/rescue for assistance',
        required: true,
        documentation: 'Record shelter contact',
      },
      {
        order: 5,
        action: 'Monitor situation until animal is in safe hands',
        required: true,
        documentation: 'Record status updates',
      },
      {
        order: 6,
        action: 'Follow up within 24 hours for outcome',
        required: true,
        documentation: 'Record outcome',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// SHIFT REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════

export const SHIFT_REQUIREMENTS = {
  minimumShiftHours: 2,
  maximumShiftHours: 8,
  minimumShiftsPerMonth: {
    lead_moderator: 8,
    moderator: 6,
    junior_moderator: 4,
  },
  peakHoursCoverage: {
    weekday: { start: 17, end: 22 }, // 5pm - 10pm
    weekend: { start: 10, end: 22 }, // 10am - 10pm
  },
  responseTimeTargets: {
    urgent: 5, // minutes
    high: 15,
    medium: 30,
    low: 60,
  },
};

// ═══════════════════════════════════════════════════════────────────
// TRAINING REQUIREMENTS
// ═══════════════────────────────────────────────────────────────────

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  requiredForRoles: RoleId[];
  prerequisites: string[];
  assessmentRequired: boolean;
  passingScore: number;
  recertificationDays: number;
}

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'moderator_basics',
    title: 'Moderator Basics',
    description: 'Introduction to the moderator role, platform navigation, and basic procedures.',
    durationMinutes: 60,
    requiredForRoles: ['junior_moderator', 'moderator', 'lead_moderator'],
    prerequisites: [],
    assessmentRequired: true,
    passingScore: 80,
    recertificationDays: 365,
  },
  {
    id: 'case_triage',
    title: 'Case Triage & Prioritization',
    description: 'How to assess and prioritize incoming cases. Tier assignment guidelines.',
    durationMinutes: 45,
    requiredForRoles: ['junior_moderator', 'moderator', 'lead_moderator'],
    prerequisites: ['moderator_basics'],
    assessmentRequired: true,
    passingScore: 85,
    recertificationDays: 365,
  },
  {
    id: 'match_verification',
    title: 'Match Verification (False Hope Prevention)',
    description: 'Detailed training on verifying potential matches without causing false hope.',
    durationMinutes: 90,
    requiredForRoles: ['moderator', 'lead_moderator'],
    prerequisites: ['moderator_basics', 'case_triage'],
    assessmentRequired: true,
    passingScore: 90,
    recertificationDays: 180,
  },
  {
    id: 'volunteer_management',
    title: 'Volunteer Coordination',
    description: 'How to dispatch volunteers, manage availability, and handle no-shows.',
    durationMinutes: 60,
    requiredForRoles: ['moderator', 'lead_moderator'],
    prerequisites: ['moderator_basics'],
    assessmentRequired: true,
    passingScore: 85,
    recertificationDays: 365,
  },
  {
    id: 'moderator_advanced',
    title: 'Advanced Moderation',
    description: 'Complex case handling, conflict resolution, and escalation procedures.',
    durationMinutes: 120,
    requiredForRoles: ['lead_moderator'],
    prerequisites: ['moderator_basics', 'case_triage', 'match_verification', 'volunteer_management'],
    assessmentRequired: true,
    passingScore: 90,
    recertificationDays: 365,
  },
  {
    id: 'team_leadership',
    title: 'Team Leadership',
    description: 'Managing other moderators, performance reviews, and team coordination.',
    durationMinutes: 90,
    requiredForRoles: ['lead_moderator'],
    prerequisites: ['moderator_advanced'],
    assessmentRequired: true,
    passingScore: 85,
    recertificationDays: 365,
  },
  {
    id: 'crisis_response',
    title: 'Crisis Response',
    description: 'Handling emergencies, disaster response, and high-pressure situations.',
    durationMinutes: 60,
    requiredForRoles: ['lead_moderator', 'regional_coordinator'],
    prerequisites: ['moderator_basics'],
    assessmentRequired: true,
    passingScore: 90,
    recertificationDays: 180,
  },
  {
    id: 'transport_basics',
    title: 'Transport Volunteer Training',
    description: 'Safe animal transport, vehicle preparation, and handoff procedures.',
    durationMinutes: 45,
    requiredForRoles: ['transporter', 'senior_transporter'],
    prerequisites: [],
    assessmentRequired: true,
    passingScore: 80,
    recertificationDays: 365,
  },
  {
    id: 'foster_basics',
    title: 'Foster Care Basics',
    description: 'Temporary animal care, health monitoring, and emergency protocols.',
    durationMinutes: 60,
    requiredForRoles: ['foster', 'emergency_foster'],
    prerequisites: [],
    assessmentRequired: true,
    passingScore: 80,
    recertificationDays: 365,
  },
  {
    id: 'foster_emergency',
    title: 'Emergency Foster Care',
    description: 'Specialized training for short-term emergency foster situations.',
    durationMinutes: 45,
    requiredForRoles: ['emergency_foster'],
    prerequisites: ['foster_basics'],
    assessmentRequired: true,
    passingScore: 85,
    recertificationDays: 180,
  },
  {
    id: 'humane_trapping',
    title: 'Humane Trapping Certification',
    description: 'Safe and humane trapping techniques for lost pet recovery.',
    durationMinutes: 120,
    requiredForRoles: ['trapper'],
    prerequisites: [],
    assessmentRequired: true,
    passingScore: 90,
    recertificationDays: 365,
  },
  {
    id: 'volunteer_orientation',
    title: 'General Volunteer Orientation',
    description: 'Introduction to Mayday, expectations, and community guidelines.',
    durationMinutes: 30,
    requiredForRoles: ['community_volunteer'],
    prerequisites: [],
    assessmentRequired: false,
    passingScore: 0,
    recertificationDays: 0,
  },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get procedures applicable to a role
 */
export function getProceduresForRole(roleId: RoleId): Procedure[] {
  return STANDARD_PROCEDURES.filter(p => p.applicableRoles.includes(roleId));
}

/**
 * Get required training for a role
 */
export function getRequiredTraining(roleId: RoleId): TrainingModule[] {
  return TRAINING_MODULES.filter(t => t.requiredForRoles.includes(roleId));
}

/**
 * Check if training is complete for a role
 */
export function isTrainingComplete(
  roleId: RoleId,
  completedModules: string[]
): { complete: boolean; missing: string[] } {
  const required = getRequiredTraining(roleId);
  const missing = required
    .filter(t => !completedModules.includes(t.id))
    .map(t => t.id);

  return {
    complete: missing.length === 0,
    missing,
  };
}
