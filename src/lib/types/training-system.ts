// Pet911 Training System Types
// Based on ASPCA, Best Friends, FEMA CERT, CDC standards

// ============================================================================
// ENUMS
// ============================================================================

export type ModuleCategory = 
  | 'orientation'
  | 'moderator'
  | 'field_trapper'
  | 'field_transport'
  | 'field_foster'
  | 'safety'
  | 'advanced'
  | 'recertification';

export type TrainingTrack =
  | 'all'
  | 'moderator_t1'
  | 'moderator_t2'
  | 'moderator_t3'
  | 'trapper'
  | 'transporter'
  | 'foster'
  | 'disaster';

export type ContentType = 
  | 'reading'
  | 'video'
  | 'interactive'
  | 'simulation'
  | 'shadowing'
  | 'external';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'multi_select'
  | 'scenario'
  | 'sequencing';

export type ProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'content_complete'
  | 'quiz_pending'
  | 'quiz_failed'
  | 'awaiting_signoff'
  | 'awaiting_shadowing'
  | 'completed'
  | 'expired'
  | 'suspended';

export type BackgroundCheckStatus =
  | 'not_started'
  | 'pending'
  | 'in_review'
  | 'cleared'
  | 'flagged'
  | 'failed'
  | 'expired';

export type CertificationStatus =
  | 'active'
  | 'expired'
  | 'suspended'
  | 'revoked'
  | 'superseded';

export type CooldownType =
  | 'short_break'
  | 'tier_restriction'
  | 'full_lockout'
  | 'mandatory_debrief';

export type ExposureType =
  | 'code_red_triage'
  | 'graphic_content'
  | 'cruelty_case'
  | 'fatality'
  | 'euthanasia_decision';

export type SignoffStatus = 'pending' | 'approved' | 'needs_work' | 'denied';

export type Difficulty = 'easy' | 'medium' | 'hard';

// ============================================================================
// CONTENT STRUCTURES
// ============================================================================

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface ModuleContent {
  sections: ContentSection[];
  resources?: { title: string; url: string; type: string }[];
}

// ============================================================================
// TRAINING MODULES
// ============================================================================

export interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: ModuleCategory;
  track: TrainingTrack;
  contentType: ContentType;
  estimatedMinutes: number;
  contentJson: ModuleContent;
  requiresQuiz: boolean;
  quizQuestionCount: number;
  passingScore: number;
  maxAttempts: number | null;
  requiresSupervisorSignoff: boolean;
  requiresBackgroundCheck: boolean;
  requiresShadowing: boolean;
  shadowingHoursRequired: number;
  certificationValidDays: number | null;
  isMandatory: boolean;
  isActive: boolean;
  sortOrder: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  prerequisites?: TrainingModule[];
  questions?: TrainingQuestion[];
}

// ============================================================================
// QUIZ SYSTEM
// ============================================================================

export interface TrainingQuestion {
  id: string;
  moduleId: string;
  questionType: QuestionType;
  questionText: string;
  scenarioContext?: string;
  explanation?: string;
  referenceSource?: string;
  difficulty: Difficulty;
  points: number;
  isCritical: boolean;
  isActive: boolean;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  partialCredit: number;
  feedback?: string;
  sortOrder: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  moduleId: string;
  progressId: string;
  attemptNumber: number;
  score: number;
  scorePct: number;
  passed: boolean;
  questionsTotal: number;
  questionsCorrect: number;
  criticalQuestionsTotal: number;
  criticalQuestionsCorrect: number;
  failedCritical: boolean;
  startedAt: Date;
  completedAt?: Date;
  timeSpentSeconds?: number;
  questionOrder: string[];
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptions: string[];
  sequenceAnswer?: string[];
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  answeredAt: Date;
  timeSpentSeconds?: number;
}

// ============================================================================
// USER PROGRESS
// ============================================================================

export interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  status: ProgressStatus;
  contentProgressPct: number;
  contentSectionsCompleted: string[];
  lastContentPosition?: { sectionId: string; scrollPosition?: number };
  contentCompletedAt?: Date;
  quizAttempts: number;
  bestQuizScore?: number;
  lastQuizScore?: number;
  lastQuizAt?: Date;
  quizPassedAt?: Date;
  quizLockedUntil?: Date;
  completedAt?: Date;
  certificateId?: string;
  expiresAt?: Date;
  startedAt?: Date;
  updatedAt: Date;
  module?: TrainingModule;
  certificate?: Certification;
}

// ============================================================================
// CERTIFICATIONS & SAFETY
// ============================================================================

export interface Certification {
  id: string;
  userId: string;
  moduleId: string;
  certificateNumber: string;
  title: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: CertificationStatus;
  verificationHash: string;
  pdfUrl?: string;
  finalScore?: number;
  module?: TrainingModule;
}

export interface BackgroundCheck {
  id: string;
  userId: string;
  provider: string;
  status: BackgroundCheckStatus;
  checkType: 'standard' | 'enhanced' | 'fingerprint';
  submittedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export interface CooldownEvent {
  id: string;
  userId: string;
  triggerReason: string;
  cooldownType: CooldownType;
  restrictedActions: string[];
  startedAt: Date;
  endsAt: Date;
  acknowledgedAt?: Date;
}

export interface SupervisorSignoff {
  id: string;
  userId: string;
  moduleId: string;
  supervisorId: string;
  status: SignoffStatus;
  competencyRating?: number;
  supervisorNotes?: string;
  requestedAt: Date;
  reviewedAt?: Date;
}

export interface ShadowingRecord {
  id: string;
  userId: string;
  moduleId: string;
  mentorId: string;
  sessionDate: Date;
  hours: number;
  activityType: string;
  verified: boolean;
  mentorNotes?: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface QuizQuestionForAttempt {
  id: string;
  questionType: QuestionType;
  questionText: string;
  scenarioContext?: string;
  options: { id: string; optionText: string; sortOrder: number }[];
  points: number;
  isCritical: boolean;
}

export interface StartQuizResponse {
  attemptId: string;
  attemptNumber: number;
  questions: QuizQuestionForAttempt[];
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  pointsEarned: number;
  explanation?: string;
  correctOptions?: string[];
  feedback?: string;
}

export interface CompleteQuizResponse {
  score: number;
  scorePct: number;
  passed: boolean;
  questionsTotal: number;
  questionsCorrect: number;
  failedCritical: boolean;
  newStatus: ProgressStatus;
  certificateId?: string;
  nextSteps: string[];
}

export interface ModuleProgressSummary {
  module: TrainingModule;
  progress: UserProgress | null;
  prerequisitesMet: boolean;
  backgroundCheckRequired: boolean;
  backgroundCheckCleared: boolean;
  canStart: boolean;
  blockedReason?: string;
}

export interface TrainingDashboard {
  tracks: {
    track: TrainingTrack;
    title: string;
    modules: ModuleProgressSummary[];
    completedCount: number;
    totalCount: number;
  }[];
  activeCertifications: Certification[];
  expiringCertifications: Certification[];
  backgroundCheck: BackgroundCheck | null;
  activeCooldown: CooldownEvent | null;
}

// ============================================================================
// TRACK CONFIGURATION
// ============================================================================

export const TRACK_CONFIG: Record<TrainingTrack, {
  title: string;
  description: string;
  icon: string;
  color: string;
  badgeTitle: string;
}> = {
  all: {
    title: 'Orientation',
    description: 'Required for all volunteers',
    icon: '📋',
    color: 'gray',
    badgeTitle: 'Certified Volunteer'
  },
  moderator_t1: {
    title: 'Junior Moderator',
    description: 'Intake triage and basic moderation',
    icon: '🎯',
    color: 'blue',
    badgeTitle: 'Certified Dispatcher I'
  },
  moderator_t2: {
    title: 'Triage Specialist',
    description: 'Advanced triage, dispatch coordination',
    icon: '📡',
    color: 'purple',
    badgeTitle: 'Certified Dispatcher II'
  },
  moderator_t3: {
    title: 'Community Guardian',
    description: 'Governance, fraud verification, appeals',
    icon: '🛡️',
    color: 'gold',
    badgeTitle: 'Certified Dispatcher III'
  },
  trapper: {
    title: 'Certified Trapper',
    description: 'TNR and humane trapping operations',
    icon: '🪤',
    color: 'green',
    badgeTitle: 'Certified Field Trapper'
  },
  transporter: {
    title: 'Certified Transporter',
    description: 'Safe animal transport logistics',
    icon: '🚗',
    color: 'orange',
    badgeTitle: 'Certified Transporter'
  },
  foster: {
    title: 'Emergency Foster',
    description: 'Temporary care and medical triage',
    icon: '🏠',
    color: 'pink',
    badgeTitle: 'Certified Emergency Foster'
  },
  disaster: {
    title: 'Disaster Response',
    description: 'FEMA-aligned emergency response',
    icon: '🆘',
    color: 'red',
    badgeTitle: 'Disaster Response Certified'
  }
};

export const TRIAGE_CODES = {
  RED: { label: 'Code Red', description: 'Immediate life threat', color: '#DC2626' },
  YELLOW: { label: 'Code Yellow', description: 'Urgent - 12-24 hours', color: '#D97706' },
  GREEN: { label: 'Code Green', description: 'Routine / Advice', color: '#059669' }
} as const;
