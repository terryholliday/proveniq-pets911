/**
 * PET911 TRAINING SYSTEM - Part 1: Core Types & Structures
 * 
 * Comprehensive training and certification system for all volunteer
 * and moderator roles.
 */

import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// TYPES & PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

export type IsoDateTime = string;
export type Uuid = string;
export type Minutes = number;
export type Hours = number;

// ═══════════════════════════════════════════════════════════════════
// CONTENT TYPES
// ═══════════════════════════════════════════════════════════════════

export type ContentType = 
  | 'VIDEO'
  | 'READING'
  | 'INTERACTIVE'
  | 'SCENARIO'
  | 'PRACTICAL'
  | 'QUIZ'
  | 'ASSESSMENT';

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type LessonStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface ContentItem {
  id: Uuid;
  type: ContentType;
  title: string;
  description: string;
  durationMinutes: Minutes;
  contentUrl?: string;
  embedCode?: string;
  downloadable: boolean;
  downloadUrl?: string;
  requiredForCompletion: boolean;
}

export interface LearningObjective {
  id: Uuid;
  description: string;
  measurable: boolean;
  assessedInQuiz: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// QUIZ & ASSESSMENT TYPES
// ═══════════════════════════════════════════════════════════════════

export type QuestionType = 
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'SCENARIO_BASED'
  | 'ORDERING'
  | 'MATCHING';

export interface QuizQuestion {
  id: Uuid;
  type: QuestionType;
  question: string;
  context?: string;
  imageUrl?: string;
  options?: QuizOption[];
  correctAnswer?: string | string[];
  matchingPairs?: { left: string; right: string }[];
  points: number;
  explanation: string;
  objectiveId?: Uuid;
  tags: string[];
  difficulty: DifficultyLevel;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface KnowledgeCheck {
  id: Uuid;
  questions: QuizQuestion[];
  passingScore: number;
  allowRetry: boolean;
  maxAttempts: number;
  showCorrectAnswers: boolean;
}

export interface Assessment {
  id: Uuid;
  moduleId: Uuid;
  title: string;
  description: string;
  instructions: string;
  questions: QuizQuestion[];
  totalPoints: number;
  passingScore: number;
  passingPoints: number;
  timeLimitMinutes: Minutes | null;
  allowRetake: boolean;
  maxAttempts: number;
  retakeWaitHours: Hours;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: 'IMMEDIATE' | 'AFTER_SUBMISSION' | 'AFTER_REVIEW';
  proctored: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// LESSON STRUCTURE
// ═══════════════════════════════════════════════════════════════════

export interface Lesson {
  id: Uuid;
  moduleId: Uuid;
  orderIndex: number;
  title: string;
  description: string;
  learningObjectives: LearningObjective[];
  content: ContentItem[];
  estimatedDurationMinutes: Minutes;
  requiredForModuleCompletion: boolean;
  knowledgeCheck?: KnowledgeCheck;
}

// ═══════════════════════════════════════════════════════════════════
// TRAINING MODULE
// ═══════════════════════════════════════════════════════════════════

export type ModuleCategory =
  | 'ORIENTATION'
  | 'CORE_SKILLS'
  | 'ROLE_SPECIFIC'
  | 'SAFETY'
  | 'COMPLIANCE'
  | 'LEADERSHIP'
  | 'CRISIS_MANAGEMENT'
  | 'ANIMAL_WELFARE'
  | 'COMMUNICATION'
  | 'TECHNOLOGY'
  | 'CONTINUING_EDUCATION';

export interface TrainingModule {
  id: Uuid;
  code: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  version: string;
  effectiveDate: IsoDateTime;
  
  category: ModuleCategory;
  difficulty: DifficultyLevel;
  targetRoles: RoleId[];
  
  prerequisites: Uuid[];
  corequisites: Uuid[];
  
  lessons: Lesson[];
  finalAssessment: Assessment;
  
  estimatedDurationMinutes: Minutes;
  completionDeadlineDays: number | null;
  
  grantsCertification: boolean;
  certificationId?: Uuid;
  certificationValidityMonths?: number;
  
  ceCredits: number;
  ceCategory?: string;
  
  author: string;
  reviewedBy: string;
  lastReviewedAt: IsoDateTime;
  nextReviewDue: IsoDateTime;
  tags: string[];
  
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'RETIRED';
}

// ═══════════════════════════════════════════════════════════════════
// TRAINING PATH (Role-Based Curriculum)
// ═══════════════════════════════════════════════════════════════════

export interface TrainingPath {
  id: Uuid;
  roleId: RoleId;
  name: string;
  description: string;
  
  phases: TrainingPhase[];
  
  totalEstimatedHours: number;
  recommendedCompletionDays: number;
  maximumCompletionDays: number;
  
  requiredModules: Uuid[];
  electiveModules: Uuid[];
  electivesRequired: number;
  
  annualCeHoursRequired: number;
  ceCategoriesRequired: string[];
  
  version: string;
  effectiveDate: IsoDateTime;
  status: 'ACTIVE' | 'DEPRECATED';
}

export interface TrainingPhase {
  id: Uuid;
  name: string;
  description: string;
  orderIndex: number;
  modules: Uuid[];
  mustCompleteBeforeNextPhase: boolean;
  deadline: 'ON_ASSIGNMENT' | 'BEFORE_ROLE_GRANT' | 'WITHIN_30_DAYS' | 'WITHIN_60_DAYS' | 'WITHIN_90_DAYS';
}

// ═══════════════════════════════════════════════════════════════════
// CERTIFICATION
// ═══════════════════════════════════════════════════════════════════

export interface TrainingCertification {
  id: Uuid;
  code: string;
  name: string;
  description: string;
  issuingAuthority: 'PET911' | 'EXTERNAL';
  externalProvider?: string;
  
  requiredModules: Uuid[];
  requiredAssessmentScore: number;
  
  validityMonths: number;
  renewalRequirements: RenewalRequirement[];
  
  badgeUrl: string;
  certificateTemplateId: string;
  
  level?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
  prerequisiteCertifications?: Uuid[];
}

export interface RenewalRequirement {
  type: 'CE_HOURS' | 'RETAKE_ASSESSMENT' | 'PRACTICAL_EVAL' | 'SUPERVISOR_APPROVAL';
  details: string;
  requiredValue?: number;
}

// ═══════════════════════════════════════════════════════════════════
// USER TRAINING PROGRESS
// ═══════════════════════════════════════════════════════════════════

export interface UserTrainingProfile {
  userId: string;
  
  assignedPaths: AssignedPath[];
  assignedModules: AssignedModule[];
  
  completedModules: CompletedModule[];
  completedAssessments: CompletedAssessment[];
  
  certifications: UserCertification[];
  
  ceCreditsEarned: CeCredit[];
  currentCeYear: number;
  
  totalTrainingHours: number;
  averageAssessmentScore: number;
  
  createdAt: IsoDateTime;
  lastActivityAt: IsoDateTime;
}

export interface AssignedPath {
  pathId: Uuid;
  assignedAt: IsoDateTime;
  assignedBy: string;
  dueDate: IsoDateTime;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  currentPhase: number;
  progress: number;
}

export interface AssignedModule {
  moduleId: Uuid;
  pathId?: Uuid;
  assignedAt: IsoDateTime;
  assignedBy: string;
  dueDate: IsoDateTime;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'OVERDUE';
  progress: number;
  currentLessonIndex: number;
  lessonsCompleted: LessonProgress[];
  timeSpentMinutes: number;
  startedAt?: IsoDateTime;
}

export interface LessonProgress {
  lessonId: Uuid;
  status: LessonStatus;
  startedAt?: IsoDateTime;
  completedAt?: IsoDateTime;
  timeSpentMinutes: number;
  knowledgeCheckScore?: number;
  knowledgeCheckAttempts: number;
}

export interface CompletedModule {
  moduleId: Uuid;
  moduleCode: string;
  moduleTitle: string;
  completedAt: IsoDateTime;
  assessmentScore: number;
  timeSpentMinutes: number;
  certificateIssued: boolean;
  certificateId?: Uuid;
}

export interface CompletedAssessment {
  assessmentId: Uuid;
  moduleId: Uuid;
  attemptNumber: number;
  startedAt: IsoDateTime;
  completedAt: IsoDateTime;
  score: number;
  passed: boolean;
  answers: AssessmentAnswer[];
  timeSpentMinutes: number;
  proctorNotes?: string;
}

export interface AssessmentAnswer {
  questionId: Uuid;
  answer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpentSeconds: number;
}

export interface UserCertification {
  certificationId: Uuid;
  code: string;
  name: string;
  issuedAt: IsoDateTime;
  expiresAt: IsoDateTime;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED';
  certificateUrl: string;
  badgeUrl: string;
  renewalDueAt?: IsoDateTime;
}

export interface CeCredit {
  id: Uuid;
  moduleId?: Uuid;
  activityType: 'MODULE' | 'WEBINAR' | 'CONFERENCE' | 'EXTERNAL';
  activityName: string;
  credits: number;
  category: string;
  earnedAt: IsoDateTime;
  verifiedBy?: string;
  externalDocumentUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════
// MODULE REGISTRY (All Available Modules)
// ═══════════════════════════════════════════════════════════════════

export const MODULE_IDS = {
  // Orientation
  VOLUNTEER_ORIENTATION: 'mod_volunteer_orientation',
  
  // Transporter
  TRANSPORT_BASICS: 'mod_transport_basics',
  VEHICLE_SAFETY: 'mod_vehicle_safety',
  ANIMAL_COMFORT: 'mod_animal_comfort',
  TRANSPORT_ADVANCED: 'mod_transport_advanced',
  ANIMAL_HANDLING: 'mod_animal_handling',
  EMERGENCY_RESPONSE: 'mod_emergency_response',
  
  // Foster
  FOSTER_BASICS: 'mod_foster_basics',
  ANIMAL_CARE: 'mod_animal_care',
  MEDICAL_MONITORING: 'mod_medical_monitoring',
  FOSTER_EMERGENCY: 'mod_foster_emergency',
  ANIMAL_FIRST_AID: 'mod_animal_first_aid',
  STRESS_RECOGNITION: 'mod_stress_recognition',
  
  // Trapper
  HUMANE_TRAPPING: 'mod_humane_trapping',
  TNR_CERTIFICATION: 'mod_tnr_certification',
  ANIMAL_BEHAVIOR: 'mod_animal_behavior',
  
  // Moderator - Junior
  MODERATOR_BASICS: 'mod_moderator_basics',
  CASE_TRIAGE: 'mod_case_triage',
  
  // Moderator - Full
  MODERATOR_CORE: 'mod_moderator_core',
  MATCH_VERIFICATION: 'mod_match_verification',
  VOLUNTEER_MANAGEMENT: 'mod_volunteer_management',
  
  // Moderator - Lead
  MODERATOR_ADVANCED: 'mod_moderator_advanced',
  TEAM_LEADERSHIP: 'mod_team_leadership',
  CRISIS_RESPONSE: 'mod_crisis_response',
  
  // Coordinator
  COORDINATOR_TRAINING: 'mod_coordinator_training',
  PARTNER_RELATIONS: 'mod_partner_relations',
  CRISIS_MANAGEMENT: 'mod_crisis_management',
  
  // Foundation Admin
  FOUNDATION_OPS: 'mod_foundation_ops',
  LEGAL_COMPLIANCE: 'mod_legal_compliance',
} as const;

export type ModuleId = typeof MODULE_IDS[keyof typeof MODULE_IDS];

// ═══════════════════════════════════════════════════════════════════
// TRAINING PATHS BY ROLE
// ═══════════════════════════════════════════════════════════════════

export const TRAINING_PATHS: Record<RoleId, TrainingPath> = {
  // ─────────────────────────────────────────────────────────────────
  // COMMUNITY VOLUNTEER
  // ─────────────────────────────────────────────────────────────────
  community_volunteer: {
    id: 'path_community_volunteer',
    roleId: 'community_volunteer',
    name: 'Community Volunteer Training Path',
    description: 'Basic training for community volunteers helping with outreach and awareness',
    phases: [
      {
        id: 'phase_cv_1',
        name: 'Orientation',
        description: 'Get started with Pet911',
        orderIndex: 1,
        modules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_30_DAYS',
      },
    ],
    totalEstimatedHours: 3.5,
    recommendedCompletionDays: 14,
    maximumCompletionDays: 30,
    requiredModules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 2,
    ceCategoriesRequired: [],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  // ─────────────────────────────────────────────────────────────────
  // TRANSPORTER
  // ─────────────────────────────────────────────────────────────────
  transporter: {
    id: 'path_transporter',
    roleId: 'transporter',
    name: 'Transporter Training Path',
    description: 'Complete training for pet transporters',
    phases: [
      {
        id: 'phase_t_1',
        name: 'Orientation',
        description: 'Pet911 basics',
        orderIndex: 1,
        modules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
        mustCompleteBeforeNextPhase: true,
        deadline: 'ON_ASSIGNMENT',
      },
      {
        id: 'phase_t_2',
        name: 'Core Transport Training',
        description: 'Essential transport skills',
        orderIndex: 2,
        modules: [
          MODULE_IDS.TRANSPORT_BASICS,
          MODULE_IDS.VEHICLE_SAFETY,
          MODULE_IDS.ANIMAL_COMFORT,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'BEFORE_ROLE_GRANT',
      },
    ],
    totalEstimatedHours: 8,
    recommendedCompletionDays: 21,
    maximumCompletionDays: 30,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.TRANSPORT_BASICS,
      MODULE_IDS.VEHICLE_SAFETY,
      MODULE_IDS.ANIMAL_COMFORT,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 4,
    ceCategoriesRequired: ['SAFETY'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  senior_transporter: {
    id: 'path_senior_transporter',
    roleId: 'senior_transporter',
    name: 'Senior Transporter Training Path',
    description: 'Advanced training for senior transporters',
    phases: [
      {
        id: 'phase_st_1',
        name: 'Orientation',
        description: 'Pet911 basics',
        orderIndex: 1,
        modules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
        mustCompleteBeforeNextPhase: true,
        deadline: 'ON_ASSIGNMENT',
      },
      {
        id: 'phase_st_2',
        name: 'Core Transport Training',
        description: 'Essential transport skills',
        orderIndex: 2,
        modules: [
          MODULE_IDS.TRANSPORT_BASICS,
          MODULE_IDS.VEHICLE_SAFETY,
          MODULE_IDS.ANIMAL_COMFORT,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_30_DAYS',
      },
      {
        id: 'phase_st_3',
        name: 'Advanced Skills',
        description: 'Senior-level competencies',
        orderIndex: 3,
        modules: [
          MODULE_IDS.TRANSPORT_ADVANCED,
          MODULE_IDS.ANIMAL_HANDLING,
          MODULE_IDS.EMERGENCY_RESPONSE,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_60_DAYS',
      },
    ],
    totalEstimatedHours: 14,
    recommendedCompletionDays: 30,
    maximumCompletionDays: 60,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.TRANSPORT_BASICS,
      MODULE_IDS.VEHICLE_SAFETY,
      MODULE_IDS.ANIMAL_COMFORT,
      MODULE_IDS.TRANSPORT_ADVANCED,
      MODULE_IDS.ANIMAL_HANDLING,
      MODULE_IDS.EMERGENCY_RESPONSE,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 6,
    ceCategoriesRequired: ['SAFETY', 'ANIMAL_WELFARE'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  // ─────────────────────────────────────────────────────────────────
  // FOSTER
  // ─────────────────────────────────────────────────────────────────
  foster: {
    id: 'path_foster',
    roleId: 'foster',
    name: 'Foster Training Path',
    description: 'Complete training for foster caregivers',
    phases: [
      {
        id: 'phase_f_1',
        name: 'Orientation',
        description: 'Pet911 basics',
        orderIndex: 1,
        modules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
        mustCompleteBeforeNextPhase: true,
        deadline: 'ON_ASSIGNMENT',
      },
      {
        id: 'phase_f_2',
        name: 'Core Foster Training',
        description: 'Essential foster skills',
        orderIndex: 2,
        modules: [
          MODULE_IDS.FOSTER_BASICS,
          MODULE_IDS.ANIMAL_CARE,
          MODULE_IDS.MEDICAL_MONITORING,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'BEFORE_ROLE_GRANT',
      },
    ],
    totalEstimatedHours: 8,
    recommendedCompletionDays: 21,
    maximumCompletionDays: 30,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.FOSTER_BASICS,
      MODULE_IDS.ANIMAL_CARE,
      MODULE_IDS.MEDICAL_MONITORING,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 4,
    ceCategoriesRequired: ['ANIMAL_WELFARE'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  emergency_foster: {
    id: 'path_emergency_foster',
    roleId: 'emergency_foster',
    name: 'Emergency Foster Training Path',
    description: 'Training for emergency/short-term foster caregivers',
    phases: [
      {
        id: 'phase_ef_1',
        name: 'Orientation',
        description: 'Pet911 basics',
        orderIndex: 1,
        modules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
        mustCompleteBeforeNextPhase: true,
        deadline: 'ON_ASSIGNMENT',
      },
      {
        id: 'phase_ef_2',
        name: 'Emergency Foster Training',
        description: 'Emergency foster skills',
        orderIndex: 2,
        modules: [
          MODULE_IDS.FOSTER_EMERGENCY,
          MODULE_IDS.ANIMAL_FIRST_AID,
          MODULE_IDS.STRESS_RECOGNITION,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'BEFORE_ROLE_GRANT',
      },
    ],
    totalEstimatedHours: 7,
    recommendedCompletionDays: 14,
    maximumCompletionDays: 21,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.FOSTER_EMERGENCY,
      MODULE_IDS.ANIMAL_FIRST_AID,
      MODULE_IDS.STRESS_RECOGNITION,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 4,
    ceCategoriesRequired: ['SAFETY', 'ANIMAL_WELFARE'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  // ─────────────────────────────────────────────────────────────────
  // TRAPPER
  // ─────────────────────────────────────────────────────────────────
  trapper: {
    id: 'path_trapper',
    roleId: 'trapper',
    name: 'Trapper Training Path',
    description: 'Complete training for humane trappers',
    phases: [
      {
        id: 'phase_tr_1',
        name: 'Orientation',
        description: 'Pet911 basics',
        orderIndex: 1,
        modules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
        mustCompleteBeforeNextPhase: true,
        deadline: 'ON_ASSIGNMENT',
      },
      {
        id: 'phase_tr_2',
        name: 'Core Trapping Training',
        description: 'Essential trapping skills',
        orderIndex: 2,
        modules: [
          MODULE_IDS.HUMANE_TRAPPING,
          MODULE_IDS.TNR_CERTIFICATION,
          MODULE_IDS.ANIMAL_BEHAVIOR,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'BEFORE_ROLE_GRANT',
      },
    ],
    totalEstimatedHours: 9,
    recommendedCompletionDays: 30,
    maximumCompletionDays: 45,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.HUMANE_TRAPPING,
      MODULE_IDS.TNR_CERTIFICATION,
      MODULE_IDS.ANIMAL_BEHAVIOR,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 4,
    ceCategoriesRequired: ['ANIMAL_WELFARE'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  // ─────────────────────────────────────────────────────────────────
  // JUNIOR MODERATOR
  // ─────────────────────────────────────────────────────────────────
  junior_moderator: {
    id: 'path_junior_moderator',
    roleId: 'junior_moderator',
    name: 'Junior Moderator Training Path',
    description: 'Entry-level moderator training',
    phases: [
      {
        id: 'phase_jm_1',
        name: 'Orientation',
        description: 'Pet911 basics',
        orderIndex: 1,
        modules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
        mustCompleteBeforeNextPhase: true,
        deadline: 'ON_ASSIGNMENT',
      },
      {
        id: 'phase_jm_2',
        name: 'Moderator Fundamentals',
        description: 'Core moderator skills',
        orderIndex: 2,
        modules: [
          MODULE_IDS.MODERATOR_BASICS,
          MODULE_IDS.CASE_TRIAGE,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'BEFORE_ROLE_GRANT',
      },
    ],
    totalEstimatedHours: 9,
    recommendedCompletionDays: 21,
    maximumCompletionDays: 30,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.MODERATOR_BASICS,
      MODULE_IDS.CASE_TRIAGE,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 8,
    ceCategoriesRequired: ['CORE_SKILLS'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  // ─────────────────────────────────────────────────────────────────
  // MODERATOR
  // ─────────────────────────────────────────────────────────────────
  moderator: {
    id: 'path_moderator',
    roleId: 'moderator',
    name: 'Moderator Training Path',
    description: 'Full moderator training program',
    phases: [
      {
        id: 'phase_m_1',
        name: 'Orientation',
        description: 'Pet911 basics',
        orderIndex: 1,
        modules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
        mustCompleteBeforeNextPhase: true,
        deadline: 'ON_ASSIGNMENT',
      },
      {
        id: 'phase_m_2',
        name: 'Moderator Fundamentals',
        description: 'Core moderator skills',
        orderIndex: 2,
        modules: [
          MODULE_IDS.MODERATOR_BASICS,
          MODULE_IDS.CASE_TRIAGE,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_30_DAYS',
      },
      {
        id: 'phase_m_3',
        name: 'Advanced Moderator Skills',
        description: 'Full moderator competencies',
        orderIndex: 3,
        modules: [
          MODULE_IDS.MODERATOR_CORE,
          MODULE_IDS.MATCH_VERIFICATION,
          MODULE_IDS.VOLUNTEER_MANAGEMENT,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_60_DAYS',
      },
    ],
    totalEstimatedHours: 18,
    recommendedCompletionDays: 30,
    maximumCompletionDays: 60,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.MODERATOR_BASICS,
      MODULE_IDS.CASE_TRIAGE,
      MODULE_IDS.MODERATOR_CORE,
      MODULE_IDS.MATCH_VERIFICATION,
      MODULE_IDS.VOLUNTEER_MANAGEMENT,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 12,
    ceCategoriesRequired: ['CORE_SKILLS', 'LEADERSHIP'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  // ─────────────────────────────────────────────────────────────────
  // LEAD MODERATOR
  // ─────────────────────────────────────────────────────────────────
  lead_moderator: {
    id: 'path_lead_moderator',
    roleId: 'lead_moderator',
    name: 'Lead Moderator Training Path',
    description: 'Leadership training for senior moderators',
    phases: [
      {
        id: 'phase_lm_1',
        name: 'Orientation',
        description: 'Pet911 basics',
        orderIndex: 1,
        modules: [MODULE_IDS.VOLUNTEER_ORIENTATION],
        mustCompleteBeforeNextPhase: true,
        deadline: 'ON_ASSIGNMENT',
      },
      {
        id: 'phase_lm_2',
        name: 'Moderator Fundamentals',
        description: 'Core moderator skills',
        orderIndex: 2,
        modules: [
          MODULE_IDS.MODERATOR_BASICS,
          MODULE_IDS.CASE_TRIAGE,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_30_DAYS',
      },
      {
        id: 'phase_lm_3',
        name: 'Advanced Moderator Skills',
        description: 'Full moderator competencies',
        orderIndex: 3,
        modules: [
          MODULE_IDS.MODERATOR_CORE,
          MODULE_IDS.MATCH_VERIFICATION,
          MODULE_IDS.VOLUNTEER_MANAGEMENT,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_60_DAYS',
      },
      {
        id: 'phase_lm_4',
        name: 'Leadership Training',
        description: 'Lead moderator competencies',
        orderIndex: 4,
        modules: [
          MODULE_IDS.MODERATOR_ADVANCED,
          MODULE_IDS.TEAM_LEADERSHIP,
          MODULE_IDS.CRISIS_RESPONSE,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_90_DAYS',
      },
    ],
    totalEstimatedHours: 28,
    recommendedCompletionDays: 45,
    maximumCompletionDays: 90,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.MODERATOR_BASICS,
      MODULE_IDS.CASE_TRIAGE,
      MODULE_IDS.MODERATOR_CORE,
      MODULE_IDS.MATCH_VERIFICATION,
      MODULE_IDS.VOLUNTEER_MANAGEMENT,
      MODULE_IDS.MODERATOR_ADVANCED,
      MODULE_IDS.TEAM_LEADERSHIP,
      MODULE_IDS.CRISIS_RESPONSE,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 16,
    ceCategoriesRequired: ['CORE_SKILLS', 'LEADERSHIP', 'CRISIS_MANAGEMENT'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  // ─────────────────────────────────────────────────────────────────
  // REGIONAL COORDINATOR
  // ─────────────────────────────────────────────────────────────────
  regional_coordinator: {
    id: 'path_regional_coordinator',
    roleId: 'regional_coordinator',
    name: 'Regional Coordinator Training Path',
    description: 'Training for regional leadership',
    phases: [
      {
        id: 'phase_rc_1',
        name: 'Foundation Training',
        description: 'Core knowledge',
        orderIndex: 1,
        modules: [
          MODULE_IDS.VOLUNTEER_ORIENTATION,
          MODULE_IDS.MODERATOR_BASICS,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_30_DAYS',
      },
      {
        id: 'phase_rc_2',
        name: 'Coordinator Training',
        description: 'Regional leadership skills',
        orderIndex: 2,
        modules: [
          MODULE_IDS.COORDINATOR_TRAINING,
          MODULE_IDS.PARTNER_RELATIONS,
          MODULE_IDS.CRISIS_MANAGEMENT,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_60_DAYS',
      },
    ],
    totalEstimatedHours: 22,
    recommendedCompletionDays: 45,
    maximumCompletionDays: 60,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.MODERATOR_BASICS,
      MODULE_IDS.COORDINATOR_TRAINING,
      MODULE_IDS.PARTNER_RELATIONS,
      MODULE_IDS.CRISIS_MANAGEMENT,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 20,
    ceCategoriesRequired: ['LEADERSHIP', 'CRISIS_MANAGEMENT', 'COMPLIANCE'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  // ─────────────────────────────────────────────────────────────────
  // FOUNDATION ADMIN
  // ─────────────────────────────────────────────────────────────────
  foundation_admin: {
    id: 'path_foundation_admin',
    roleId: 'foundation_admin',
    name: 'Foundation Admin Training Path',
    description: 'Executive leadership training',
    phases: [
      {
        id: 'phase_fa_1',
        name: 'Foundation Training',
        description: 'Core knowledge',
        orderIndex: 1,
        modules: [
          MODULE_IDS.VOLUNTEER_ORIENTATION,
          MODULE_IDS.MODERATOR_BASICS,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_30_DAYS',
      },
      {
        id: 'phase_fa_2',
        name: 'Executive Training',
        description: 'Foundation leadership',
        orderIndex: 2,
        modules: [
          MODULE_IDS.FOUNDATION_OPS,
          MODULE_IDS.CRISIS_MANAGEMENT,
          MODULE_IDS.LEGAL_COMPLIANCE,
        ],
        mustCompleteBeforeNextPhase: true,
        deadline: 'WITHIN_90_DAYS',
      },
    ],
    totalEstimatedHours: 30,
    recommendedCompletionDays: 60,
    maximumCompletionDays: 90,
    requiredModules: [
      MODULE_IDS.VOLUNTEER_ORIENTATION,
      MODULE_IDS.MODERATOR_BASICS,
      MODULE_IDS.FOUNDATION_OPS,
      MODULE_IDS.CRISIS_MANAGEMENT,
      MODULE_IDS.LEGAL_COMPLIANCE,
    ],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 24,
    ceCategoriesRequired: ['LEADERSHIP', 'CRISIS_MANAGEMENT', 'COMPLIANCE'],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  // ─────────────────────────────────────────────────────────────────
  // NON-VOLUNTEER ROLES (minimal training)
  // ─────────────────────────────────────────────────────────────────
  verified_user: {
    id: 'path_verified_user',
    roleId: 'verified_user',
    name: 'Verified User Path',
    description: 'No training required',
    phases: [],
    totalEstimatedHours: 0,
    recommendedCompletionDays: 0,
    maximumCompletionDays: 0,
    requiredModules: [],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 0,
    ceCategoriesRequired: [],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },

  user: {
    id: 'path_user',
    roleId: 'user',
    name: 'User Path',
    description: 'No training required',
    phases: [],
    totalEstimatedHours: 0,
    recommendedCompletionDays: 0,
    maximumCompletionDays: 0,
    requiredModules: [],
    electiveModules: [],
    electivesRequired: 0,
    annualCeHoursRequired: 0,
    ceCategoriesRequired: [],
    version: '1.0',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },
};
