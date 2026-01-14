/**
 * PETMAYDAY TRAINING SYSTEM V2 — Part 1: Core Types
 * 
 * Consolidated type definitions incorporating:
 * - Branded types and authoring/delivery split
 * - Service architecture patterns
 * - Accessibility, mobile, proctoring, and analytics additions
 * 
 * @version 2.0.0
 */

import type { RoleId } from '../roles';
export type { RoleId } from '../roles';

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1: BRANDED TYPE HELPERS (Type Safety)
// ══════════════════════════════════════════════════════════════════════════════

export type Brand<T, B extends string> = T & { readonly __brand: B };

// Temporal types
export type IsoDateTime = Brand<string, 'IsoDateTime'>;
export type IsoDate = Brand<string, 'IsoDate'>;

// Identity types
export type UserId = Brand<string, 'UserId'>;
export type Uuid = Brand<string, 'Uuid'>;

// Training entity IDs (stable keys, not random UUIDs)
export type ModuleId = Brand<string, 'ModuleId'>;
export type LessonId = Brand<string, 'LessonId'>;
export type AssessmentId = Brand<string, 'AssessmentId'>;
export type QuestionId = Brand<string, 'QuestionId'>;
export type CertificationId = Brand<string, 'CertificationId'>;
export type TrainingPathId = Brand<string, 'TrainingPathId'>;
export type TrainingPhaseId = Brand<string, 'TrainingPhaseId'>;
export type ContentItemId = Brand<string, 'ContentItemId'>;
export type CeCreditId = Brand<string, 'CeCreditId'>;
export type ObjectiveId = Brand<string, 'ObjectiveId'>;
export type KnowledgeCheckId = Brand<string, 'KnowledgeCheckId'>;
export type QuestionBankId = Brand<string, 'QuestionBankId'>;
export type PracticalAssessmentId = Brand<string, 'PracticalAssessmentId'>;
export type FeedbackId = Brand<string, 'FeedbackId'>;
export type OfflinePackageId = Brand<string, 'OfflinePackageId'>;
export type LiveSessionId = Brand<string, 'LiveSessionId'>;
export type SandboxId = Brand<string, 'SandboxId'>;
export type MentorAssignmentId = Brand<string, 'MentorAssignmentId'>;
export type ShadowSessionId = Brand<string, 'ShadowSessionId'>;
export type AssessmentSessionId = Brand<string, 'AssessmentSessionId'>;
export type ProctoringSessionId = Brand<string, 'ProctoringSessionId'>;
export type ContentVersionId = Brand<string, 'ContentVersionId'>;
export type ImprovementTicketId = Brand<string, 'ImprovementTicketId'>;
export type ComplianceReportId = Brand<string, 'ComplianceReportId'>;
export type TrainingAuditEventId = Brand<string, 'TrainingAuditEventId'>;
export type CorrelationId = Brand<string, 'CorrelationId'>;

// Numeric types
export type Minutes = number;
export type Hours = number;
export type Points = number;
export type Percentage = number; // 0-100

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2: ENUMERATIONS
// ══════════════════════════════════════════════════════════════════════════════

export type ContentType =
  | 'VIDEO'
  | 'READING'
  | 'INTERACTIVE'
  | 'SCENARIO'
  | 'PRACTICAL'
  | 'AUDIO'
  | 'INFOGRAPHIC'
  | 'SIMULATION';

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type LessonStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

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

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'SCENARIO_BASED'
  | 'ORDERING'
  | 'MATCHING'
  | 'HOTSPOT'
  | 'DRAG_DROP';

export type ContentStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'REJECTED';

export type ProctoringMode =
  | 'NONE'
  | 'HONOR_CODE'
  | 'BROWSER_LOCKDOWN'
  | 'WEBCAM_RECORDING'
  | 'LIVE_PROCTOR'
  | 'AI_MONITORED';

export type PracticalAssessmentMethod =
  | 'VIDEO_SUBMISSION'
  | 'LIVE_VIDEO_CALL'
  | 'MENTOR_SIGNOFF'
  | 'SUPERVISED_TASK'
  | 'SIMULATION';

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3: ACCESSIBILITY & INTERNATIONALIZATION (ADA/WCAG Compliance)
// ══════════════════════════════════════════════════════════════════════════════

export interface AccessibilityMetadata {
  wcagLevel: 'A' | 'AA' | 'AAA';
  hasClosedCaptions: boolean;
  hasAudioDescription: boolean;
  hasTranscript: boolean;
  transcriptUrl?: string;
  fleschKincaidGrade: number;
  hasSimplifiedVersion: boolean;
  simplifiedVersionId?: ContentItemId;
  colorContrastRatio: number;
  usesColorAloneForMeaning: boolean;
  hasAltTextForImages: boolean;
  keyboardNavigable: boolean;
  minimumTouchTargetSize: number;
  noTimingDependentContent: boolean;
  estimatedCognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH';
  hasProgressIndicators: boolean;
  allowsUnlimitedTime: boolean;
  hasConsistentNavigation: boolean;
  noFlashingContent: boolean;
  flashesPerSecond?: number;
  ariaLabelsComplete: boolean;
  headingStructureValid: boolean;
  tabOrderLogical: boolean;
}

export interface LocalizedContent {
  contentItemId: ContentItemId;
  locale: string;
  title: string;
  description: string;
  contentUrl: string;
  translationType: 'HUMAN' | 'MACHINE' | 'HUMAN_REVIEWED_MACHINE';
  translatedAt: IsoDateTime;
  translatedBy?: UserId;
  reviewedBy?: UserId;
  culturalAdaptations?: string[];
  unitsOfMeasure?: 'METRIC' | 'IMPERIAL';
  dateFormat?: string;
  approved: boolean;
  approvedBy?: UserId;
  approvedAt?: IsoDateTime;
}

export interface UserAccommodations {
  userId: UserId;
  extendedTimeMultiplier: number;
  unlimitedTime: boolean;
  additionalBreaksAllowed: boolean;
  breakDurationMinutes?: Minutes;
  preferredLocale: string;
  requiresSimplifiedContent: boolean;
  requiresAudioDescription: boolean;
  requiresLargeText: boolean;
  fontSizeMultiplier: number;
  preferredFontFamily?: string;
  highContrastMode: boolean;
  allowsTextToSpeech: boolean;
  allowsSpeechToText: boolean;
  allowsCalculator: boolean;
  allowsNoteTaking: boolean;
  allowsDictionary: boolean;
  separateTestingEnvironment: boolean;
  requiresPhysicalAccommodation: boolean;
  physicalAccommodationDetails?: string;
  accommodationDocumentUrl?: string;
  medicalDocumentationUrl?: string;
  approvedBy: UserId;
  approvedAt: IsoDateTime;
  expiresAt?: IsoDateTime;
  renewalRequired: boolean;
  createdAt: IsoDateTime;
  lastModifiedAt: IsoDateTime;
  lastModifiedBy: UserId;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4: CONTENT ITEMS
// ══════════════════════════════════════════════════════════════════════════════

export interface ContentItem {
  id: ContentItemId;
  type: ContentType;
  title: string;
  description: string;
  durationMinutes: Minutes;
  contentUrl?: string;
  embedCode?: string;
  inlineContent?: string;
  downloadable: boolean;
  downloadUrl?: string;
  downloadSize?: number;
  requiredForCompletion: boolean;
  videoMetadata?: {
    format: 'MP4' | 'WEBM' | 'HLS';
    resolution: '480p' | '720p' | '1080p' | '4K';
    hasChapters: boolean;
    chapters?: { title: string; timestampSeconds: number }[];
  };
  accessibility: AccessibilityMetadata;
  localizations: LocalizedContent[];
  defaultLocale: string;
  availableOffline: boolean;
  offlineSize?: number;
  version: string;
  lastUpdatedAt: IsoDateTime;
  tags: string[];
  estimatedReadingTimeMinutes?: Minutes;
  wordCount?: number;
}

export interface RenewalRequirement {
  type: 'CE_HOURS' | 'RETAKE_ASSESSMENT' | 'PRACTICAL_EVAL' | 'SUPERVISOR_APPROVAL' | 'REFRESHER_MODULE';
  details: string;
  requiredValue?: number;
  moduleId?: ModuleId;
}

export interface Certification {
  id: CertificationId;
  code: string;
  name: string;
  description: string;
  issuingAuthority: 'PETMAYDAY' | 'EXTERNAL';
  externalProvider?: string;
  externalCertificationUrl?: string;
  requiredModules: ModuleId[];
  requiredPracticals?: PracticalAssessmentId[];
  requiredPassingScore?: Percentage;
  validityMonths: number;
  renewalRequirements: RenewalRequirement[];
  badgeUrl: string;
  certificateTemplateId: string;
  level?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
  prerequisiteCertifications?: CertificationId[];
  accreditedBy?: string[];
  accreditationNumber?: string;
}

export type TrainingPathStatus = 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED';

export type PhaseDeadline =
  | 'ON_ASSIGNMENT'
  | 'BEFORE_ROLE_GRANT'
  | 'WITHIN_7_DAYS'
  | 'WITHIN_14_DAYS'
  | 'WITHIN_30_DAYS'
  | 'WITHIN_60_DAYS'
  | 'WITHIN_90_DAYS';

export interface TrainingPhase {
  id: TrainingPhaseId;
  name: string;
  description: string;
  orderIndex: number;
  modules: ModuleId[];
  practicalAssessments?: PracticalAssessmentId[];
  mustCompleteBeforeNextPhase: boolean;
  deadline: PhaseDeadline;
  requiresMentorSignoff: boolean;
  mentorCheckpoints?: string[];
}

export interface TrainingPath {
  id: TrainingPathId;
  roleId: RoleId;
  name: string;
  description: string;
  phases: TrainingPhase[];
  totalEstimatedHours: number;
  recommendedCompletionDays: number;
  maximumCompletionDays: number;
  requiredModules: ModuleId[];
  electiveModules: ModuleId[];
  electivesRequired: number;
  requiredPracticals: PracticalAssessmentId[];
  mentorshipRequired: boolean;
  minimumShadowSessions?: number;
  annualCeHoursRequired: number;
  ceCategoriesRequired: ModuleCategory[];
  version: string;
  effectiveDate: IsoDateTime;
  status: TrainingPathStatus;
  acceptsTransferFrom?: TrainingPathId[];
}

export interface QuestionBank {
  id: QuestionBankId;
  moduleId: ModuleId;
  name: string;
  description: string;
  questions: QuizQuestionAuthoring[];
  questionsByObjective: Record<ObjectiveId, QuestionId[]>;
  questionsByDifficulty: Record<DifficultyLevel, QuestionId[]>;
  questionsByTag: Record<string, QuestionId[]>;
  selectionRules: {
    objectiveId: ObjectiveId;
    minimumQuestions: number;
    maximumQuestions: number;
    difficultyDistribution?: {
      difficulty: DifficultyLevel;
      percentage: Percentage;
    }[];
  }[];
  rotationPolicy: {
    minimumQuestionsBetweenRepeats: number;
    retireAfterAttempts: number;
    refreshCycleMonths: number;
  };
  autoRetireCriteria: {
    correctRateAbove: Percentage;
    correctRateBelow: Percentage;
    discriminationBelow: number;
    minimumAttemptsForAnalysis: number;
  };
  mutuallyExclusiveGroups: QuestionId[][];
  version: string;
  lastUpdatedAt: IsoDateTime;
  lastUpdatedBy: UserId;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

export type TrainingActor = UserId | 'SYSTEM' | 'LMS_WEBHOOK' | 'SCHEDULER';

export type TrainingAuditEventType =
  | 'PATH_ASSIGNED'
  | 'PATH_STARTED'
  | 'PATH_PHASE_COMPLETED'
  | 'PATH_COMPLETED'
  | 'PATH_ABANDONED'
  | 'MODULE_ASSIGNED'
  | 'MODULE_STARTED'
  | 'MODULE_COMPLETED'
  | 'MODULE_FAILED'
  | 'MODULE_DEADLINE_EXTENDED'
  | 'LESSON_STARTED'
  | 'LESSON_COMPLETED'
  | 'CONTENT_VIEWED'
  | 'VIDEO_COMPLETED'
  | 'ASSESSMENT_STARTED'
  | 'ASSESSMENT_SUBMITTED'
  | 'ASSESSMENT_PASSED'
  | 'ASSESSMENT_FAILED'
  | 'ASSESSMENT_INVALIDATED'
  | 'ASSESSMENT_RECOVERED'
  | 'KNOWLEDGE_CHECK_SUBMITTED'
  | 'PRACTICAL_SUBMITTED'
  | 'PRACTICAL_EVALUATED'
  | 'PRACTICAL_PASSED'
  | 'PRACTICAL_FAILED'
  | 'CERT_ISSUED'
  | 'CERT_RENEWED'
  | 'CERT_EXPIRED'
  | 'CERT_REVOKED'
  | 'CERT_SUSPENDED'
  | 'MENTOR_ASSIGNED'
  | 'SHADOW_SESSION_COMPLETED'
  | 'MENTOR_SIGNOFF'
  | 'DEADLINE_REMINDER_SENT'
  | 'AUTO_REMEDIATION_ASSIGNED'
  | 'ESCALATED_TO_HUMAN_REVIEW'
  | 'ACCOMMODATION_APPLIED'
  | 'MANUAL_OVERRIDE'
  | 'PROGRESS_RESET';

export interface TrainingAuditEvent {
  id: TrainingAuditEventId;
  type: TrainingAuditEventType;
  actor: TrainingActor;
  occurredAt: IsoDateTime;
  userId: UserId;
  moduleId?: ModuleId;
  pathId?: TrainingPathId;
  lessonId?: LessonId;
  assessmentId?: AssessmentId;
  certificationId?: CertificationId;
  mentorAssignmentId?: MentorAssignmentId;
  correlationId?: CorrelationId;
  sessionId?: string;
  details: Record<string, unknown>;
  previousState?: string;
  newState?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AssignedPath {
  pathId: TrainingPathId;
  assignedAt: IsoDateTime;
  assignedBy: UserId | 'SYSTEM';
  dueDate: IsoDateTime;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'ABANDONED';
  currentPhaseIndex: number;
  progressPercent: Percentage;
  mentorId?: UserId;
  mentorAssignedAt?: IsoDateTime;
}

export interface LessonProgress {
  lessonId: LessonId;
  status: LessonStatus;
  startedAt?: IsoDateTime;
  completedAt?: IsoDateTime;
  timeSpentMinutes: Minutes;
  contentProgress: {
    contentItemId: ContentItemId;
    completed: boolean;
    progressPercent: Percentage;
    lastAccessedAt?: IsoDateTime;
  }[];
  knowledgeCheckPointsEarned?: Points;
  knowledgeCheckTotalPoints?: Points;
  knowledgeCheckAttempts: number;
  knowledgeCheckPassed?: boolean;
}

export interface AssignedModule {
  moduleId: ModuleId;
  pathId?: TrainingPathId;
  assignedAt: IsoDateTime;
  assignedBy: UserId | 'SYSTEM';
  dueDate: IsoDateTime;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'OVERDUE';
  progressPercent: Percentage;
  currentLessonIndex: number;
  lessonProgress: LessonProgress[];
  timeSpentMinutes: Minutes;
  startedAt?: IsoDateTime;
  assessmentAttempts: number;
  lastAssessmentScore?: Percentage;
}

export interface CompletedModule {
  moduleId: ModuleId;
  moduleCode: string;
  moduleTitle: string;
  moduleVersion: string;
  completedAt: IsoDateTime;
  assessmentPointsEarned: Points;
  assessmentTotalPoints: Points;
  assessmentScore: Percentage;
  practicalPassed?: boolean;
  practicalScore?: Percentage;
  timeSpentMinutes: Minutes;
  certificateIssued: boolean;
  certificateId?: CertificationId;
  expiresAt?: IsoDateTime;
  refresherDueAt?: IsoDateTime;
}

export interface AssessmentAnswer {
  questionId: QuestionId;
  answer: string | string[];
  isCorrect: boolean;
  pointsEarned: Points;
  pointsPossible: Points;
  timeSpentSeconds: number;
}

export interface CompletedAssessment {
  assessmentId: AssessmentId;
  moduleId: ModuleId;
  attemptNumber: number;
  startedAt: IsoDateTime;
  completedAt: IsoDateTime;
  pointsEarned: Points;
  totalPoints: Points;
  score: Percentage;
  passed: boolean;
  answers: AssessmentAnswer[];
  timeSpentMinutes: Minutes;
  proctoringSessionId?: ProctoringSessionId;
  proctoringOutcome?: 'VALID' | 'FLAGGED' | 'INVALIDATED';
  proctorNotes?: string;
}

export interface UserCertification {
  certificationId: CertificationId;
  userId: UserId;
  code: string;
  name: string;
  issuedAt: IsoDateTime;
  expiresAt: IsoDateTime;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
  certificateUrl: string;
  certificateNumber: string;
  badgeUrl: string;
  verificationUrl: string;
  renewalDueAt?: IsoDateTime;
  lastRenewedAt?: IsoDateTime;
  revokedAt?: IsoDateTime;
  revokedBy?: UserId;
  revocationReason?: string;
  suspendedAt?: IsoDateTime;
  suspendedBy?: UserId;
  suspensionReason?: string;
  suspensionEndsAt?: IsoDateTime;
}

export interface CeCredit {
  id: CeCreditId;
  moduleId?: ModuleId;
  activityType: 'MODULE' | 'WEBINAR' | 'CONFERENCE' | 'WORKSHOP' | 'EXTERNAL' | 'PUBLICATION';
  activityName: string;
  activityDescription?: string;
  credits: number;
  category: ModuleCategory;
  earnedAt: IsoDateTime;
  year: number;
  verifiedBy?: UserId;
  externalDocumentUrl?: string;
  externalCertificateNumber?: string;
}

export interface CompletedPractical {
  practicalAssessmentId: PracticalAssessmentId;
  moduleId: ModuleId;
  submittedAt: IsoDateTime;
  evaluatedAt: IsoDateTime;
  method: PracticalAssessmentMethod;
  score: Percentage;
  passed: boolean;
  evaluatedBy: UserId;
  feedback?: string;
}

export interface UserTrainingProfile {
  userId: UserId;
  assignedPaths: AssignedPath[];
  assignedModules: AssignedModule[];
  completedModules: CompletedModule[];
  completedAssessments: CompletedAssessment[];
  completedPracticals: CompletedPractical[];
  certifications: UserCertification[];
  ceCreditsEarned: CeCredit[];
  currentCeYear: number;
  accommodations?: UserAccommodations;
  mentorAssignments: MentorAssignment[];
  totalTrainingHours?: number;
  averageAssessmentScore?: Percentage;
  createdAt: IsoDateTime;
  lastActivityAt: IsoDateTime;
  auditEvents: TrainingAuditEvent[];
}

export interface AssessmentSession {
  id: AssessmentSessionId;
  userId: UserId;
  assessmentId: AssessmentId;
  attemptNumber: number;
  status: 'ACTIVE' | 'PAUSED' | 'SUBMITTED' | 'ABANDONED' | 'RECOVERED' | 'TIMED_OUT' | 'INVALIDATED';
  startedAt: IsoDateTime;
  lastActivityAt: IsoDateTime;
  submittedAt?: IsoDateTime;
  totalTimeElapsedSeconds: number;
  timeLimitSeconds: number | null;
  timeRemainingSeconds?: number;
  savedAnswers: SavedAnswer[];
  questionsViewed: QuestionId[];
  questionsAnswered: QuestionId[];
  currentQuestionIndex: number;
  navigationLog: {
    timestamp: IsoDateTime;
    action: 'VIEW' | 'ANSWER' | 'CHANGE' | 'SKIP' | 'FLAG' | 'UNFLAG';
    questionId: QuestionId;
  }[];
  flaggedQuestions: QuestionId[];
  recoveryAttempts: RecoveryAttempt[];
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  suspiciousActivityFlags: string[];
  proctoringSessionId?: ProctoringSessionId;
}

export interface SavedAnswer {
  questionId: QuestionId;
  answer: string | string[];
  savedAt: IsoDateTime;
  changeCount: number;
}

export interface RecoveryAttempt {
  attemptedAt: IsoDateTime;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  recoveryReason: 'BROWSER_CRASH' | 'NETWORK_ERROR' | 'SESSION_TIMEOUT' | 'DEVICE_SWITCH' | 'ACCIDENTAL_CLOSE';
  approved: boolean;
  approvedBy?: UserId | 'SYSTEM';
  denialReason?: string;
  graceTimeAddedMinutes?: Minutes;
}

export interface AssessmentRecoveryPolicy {
  assessmentId: AssessmentId;
  allowAutoRecovery: boolean;
  autoRecoveryWindowMinutes: Minutes;
  maxAutoRecoveries: number;
  preserveAnswersOnRecovery: boolean;
  humanReviewRequired: {
    deviceChange: boolean;
    ipChange: boolean;
    userAgentChange: boolean;
    multipleRecoveries: boolean;
    multipleRecoveriesThreshold: number;
    longGap: boolean;
    longGapMinutes: Minutes;
  };
  addGraceTimeOnRecovery: boolean;
  graceTimeMinutes: Minutes;
  maxTotalGraceTimeMinutes: Minutes;
  abandonAfterMinutesInactive: Minutes;
  notifyBeforeAbandonMinutes: Minutes;
}

export interface ProctoringSession {
  id: ProctoringSessionId;
  assessmentSessionId: AssessmentSessionId;
  userId: UserId;
  mode: ProctoringMode;
  environmentCheckPassed: boolean;
  environmentCheckCompletedAt?: IsoDateTime;
  environmentCheckResults: {
    webcamWorking: boolean;
    webcamResolution?: string;
    microphoneWorking: boolean;
    browserCompatible: boolean;
    browserVersion?: string;
    extensionsDisabled: boolean;
    fullscreenCapable: boolean;
    roomScanCompleted?: boolean;
    roomScanVideoUrl?: string;
    idVerificationPassed?: boolean;
    idVerificationPhotoUrl?: string;
  };
  suspiciousEvents: ProctoringEvent[];
  totalSuspiciousScore: number;
  requiresHumanReview: boolean;
  reviewedBy?: UserId;
  reviewedAt?: IsoDateTime;
  reviewOutcome?: 'VALID' | 'FLAGGED' | 'INVALIDATED';
  reviewNotes?: string;
}

export interface ProctoringEvent {
  timestamp: IsoDateTime;
  eventType:
    | 'TAB_SWITCH'
    | 'WINDOW_BLUR'
    | 'FACE_ABSENT'
    | 'MULTIPLE_FACES'
    | 'AUDIO_DETECTED'
    | 'SPEECH_DETECTED'
    | 'PHONE_DETECTED'
    | 'SCREEN_SHARE_DETECTED'
    | 'COPY_PASTE_ATTEMPT'
    | 'RIGHT_CLICK_ATTEMPT'
    | 'DEVTOOLS_ATTEMPT'
    | 'FULLSCREEN_EXIT'
    | 'UNUSUAL_EYE_MOVEMENT'
    | 'ID_MISMATCH';
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aiConfidence?: number;
  screenshotUrl?: string;
}

export interface ProctoringPhoto {
  timestamp: IsoDateTime;
  photoUrl: string;
  aiAnalysis?: {
    facesDetected: number;
    primaryFaceConfidence: number;
    faceMatchConfidence?: number;
    eyeGazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'UNKNOWN';
    mouthOpen: boolean;
    suspiciousFlags: string[];
    overallSuspicionScore: number;
  };
}

export interface MentorAssignment {
  id: MentorAssignmentId;
  menteeUserId: UserId;
  mentorUserId: UserId;
  pathId: TrainingPathId;
  roleId: RoleId;
  assignedAt: IsoDateTime;
  assignedBy: UserId | 'SYSTEM';
  requiredShadowSessions: number;
  completedShadowSessions: ShadowSession[];
  status: 'ACTIVE' | 'COMPLETED' | 'REASSIGNED' | 'ABANDONED';
  lastContactAt?: IsoDateTime;
  meetingNotes?: string[];
  mentorFeedbackOnMentee?: string;
  menteeFeedbackOnMentor?: string;
  mentorRating?: number;
  menteeRating?: number;
  signedOffAt?: IsoDateTime;
  signedOffBy?: UserId;
  completionNotes?: string;
}

export interface ShadowSession {
  id: ShadowSessionId;
  mentorAssignmentId: MentorAssignmentId;
  scheduledAt: IsoDateTime;
  completedAt?: IsoDateTime;
  durationMinutes?: Minutes;
  activityType: 'TRANSPORT' | 'FOSTER_VISIT' | 'TRAPPING' | 'MODERATION' | 'CASE_REVIEW' | 'OTHER';
  activityDescription?: string;
  caseId?: string;
  location?: string;
  mentorObservations?: string;
  competenciesObserved: string[];
  competenciesNeedingWork?: string[];
  areasForImprovement?: string[];
  readyForIndependent: boolean;
  menteeReflection?: string;
  menteeLearnings?: string[];
  menteeQuestions?: string[];
  mentorSignedOff: boolean;
  menteeAcknowledged: boolean;
}

export interface MentorProfile {
  userId: UserId;
  roles: RoleId[];
  experienceMonths: number;
  mentorCertifiedAt?: IsoDateTime;
  maxMentees: number;
  currentMenteeCount: number;
  availableForNewMentees: boolean;
  preferredActivityTypes: string[];
  preferredSchedule?: string;
  timezone: string;
  totalMenteesCompleted: number;
  averageMenteeRating: number;
  averageCompletionDays: number;
  mentorLevel: 'NEW' | 'EXPERIENCED' | 'SENIOR' | 'MASTER';
  specializations?: string[];
}

export interface VideoProgress {
  contentItemId: ContentItemId;
  userId: UserId;
  totalDurationSeconds: number;
  currentPositionSeconds: number;
  watchedSegments: { start: number; end: number }[];
  percentageWatched: Percentage;
  uniqueSecondsWatched: number;
  attentionChecks: AttentionCheck[];
  attentionCheckPassRate: Percentage;
  playbackSpeed: number;
  averagePlaybackSpeed: number;
  pauseCount: number;
  seekCount: number;
  rewindCount: number;
  sessions: {
    startedAt: IsoDateTime;
    endedAt: IsoDateTime;
    startPosition: number;
    endPosition: number;
    deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
  }[];
  completedAt?: IsoDateTime;
  creditGranted: boolean;
  completionMethod: 'WATCHED' | 'SKIPPED_ALLOWED' | 'ACCESSIBILITY_EXEMPT' | 'ADMIN_OVERRIDE';
}

export interface AttentionCheck {
  promptedAtSeconds: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  userSelectedIndex?: number;
  answeredCorrectly?: boolean;
  responseTimeSeconds?: number;
  promptedAt: IsoDateTime;
  respondedAt?: IsoDateTime;
  timedOut: boolean;
}

export interface VideoCompletionPolicy {
  minimumWatchPercentage: Percentage;
  minimumUniqueSecondsRatio: Percentage;
  maxPlaybackSpeed: number;
  attentionCheckRequired: boolean;
  attentionCheckFrequencyMinutes: Minutes;
  attentionCheckPassRate: Percentage;
  attentionCheckTimeoutSeconds: number;
  allowSkipForAccessibility: boolean;
  allowSkipIfPreviouslyCompleted: boolean;
  flagThresholds: {
    excessiveSeekingCount: number;
    suspiciousSpeedThreshold: number;
    minimumSessionDurationSeconds: number;
  };
}

export type PracticalSubmissionId = Brand<string, 'PracticalSubmissionId'>;

export interface PracticalSubmission {
  id: PracticalSubmissionId;
  assessmentId: PracticalAssessmentId;
  userId: UserId;
  attemptNumber: number;
  submittedAt: IsoDateTime;
  method: PracticalAssessmentMethod;
  videoUrl?: string;
  videoDurationSeconds?: number;
  videoThumbnailUrl?: string;
  mentorUserId?: UserId;
  mentorName?: string;
  observationDates?: IsoDateTime[];
  observationNotes?: string;
  supervisorUserId?: UserId;
  supervisorNotes?: string;
  simulationResultId?: string;
  simulationScore?: number;
  status: 'PENDING' | 'IN_REVIEW' | 'PASSED' | 'FAILED' | 'NEEDS_REVISION';
  evaluatedBy?: UserId;
  evaluatedAt?: IsoDateTime;
  rubricScores: { rubricItemId: string; score: Points; feedback?: string }[];
  totalScore: Points;
  passed: boolean;
  overallFeedback?: string;
  strengthsIdentified?: string[];
  areasForImprovement?: string[];
  retakeEligibleAt?: IsoDateTime;
  revisionInstructions?: string;
}

export interface UserCompetencyStatus {
  userId: UserId;
  moduleId: ModuleId;
  completedAt: IsoDateTime;
  completedVersion: string;
  currentVersion: string;
  expiresAt: IsoDateTime;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'GRACE_PERIOD';
  daysUntilExpiry: number;
  lastRefresherAt?: IsoDateTime;
  nextRefresherDue: IsoDateTime;
  refresherOverdue: boolean;
  requiresRecertification: boolean;
  recertificationDeadline?: IsoDateTime;
  deltaModulesRequired?: ModuleId[];
}

export type TransferCreditPolicyId = Brand<string, 'TransferCreditPolicyId'>;
export type TransferCreditApplicationId = Brand<string, 'TransferCreditApplicationId'>;

export interface TransferCreditPolicy {
  id: TransferCreditPolicyId;
  sourcePathId: TrainingPathId;
  targetPathId: TrainingPathId;
  transferableModules: {
    moduleId: ModuleId;
    validityMonths: number;
    requiresRefresher: boolean;
    refresherType?: 'QUIZ' | 'VIDEO' | 'ACKNOWLEDGMENT';
  }[];
  gapModules: ModuleId[];
  gapPracticals?: PracticalAssessmentId[];
  maxAgeMonths: number;
  requiresApproval: boolean;
  approverRoles?: RoleId[];
  effectiveDate: IsoDateTime;
  status: 'ACTIVE' | 'DEPRECATED';
}

export interface TransferCreditApplication {
  id: TransferCreditApplicationId;
  userId: UserId;
  sourcePathId: TrainingPathId;
  targetPathId: TrainingPathId;
  claimedModules: {
    moduleId: ModuleId;
    completedAt: IsoDateTime;
    score: Percentage;
    approved?: boolean;
    approvalNotes?: string;
  }[];
  requiredModules: ModuleId[];
  requiredRefreshers: ModuleId[];
  estimatedHoursReduced: number;
  status: 'PENDING' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED';
  submittedAt: IsoDateTime;
  reviewedBy?: UserId;
  reviewedAt?: IsoDateTime;
  reviewNotes?: string;
}

export type EmergencyModeId = Brand<string, 'EmergencyModeId'>;
export type EmergencyPathId = Brand<string, 'EmergencyPathId'>;

export interface EmergencyTrainingPath {
  id: EmergencyPathId;
  basePathId: TrainingPathId;
  name: string;
  description: string;
  criticalModules: ModuleId[];
  deferredModules: ModuleId[];
  deferralPeriodDays: number;
  reducedAssessmentPolicy: {
    passingScore: Percentage;
    skipPracticalAssessments: boolean;
    skipProctoringRequirements: boolean;
    mentorAssignmentRequired: boolean;
  };
  provisionalRoleValidDays: number;
}

export interface EmergencyTrainingMode {
  id: EmergencyModeId;
  active: boolean;
  activatedAt: IsoDateTime;
  activatedBy: UserId;
  reason: 'NATURAL_DISASTER' | 'MASS_RESCUE' | 'SHELTER_OVERFLOW' | 'PANDEMIC' | 'OTHER';
  description: string;
  affectedRegions: string[];
  emergencyPaths: EmergencyTrainingPath[];
  expiresAt: IsoDateTime;
  autoDeactivate: boolean;
  deactivatedAt?: IsoDateTime;
  deactivatedBy?: UserId;
}

export interface EmergencyVolunteerStatus {
  userId: UserId;
  emergencyModeId: EmergencyModeId;
  emergencyPathId: EmergencyPathId;
  activatedAt: IsoDateTime;
  criticalModulesCompleted: boolean;
  criticalModulesCompletedAt?: IsoDateTime;
  deferredModuleDeadline: IsoDateTime;
  deferredModulesCompleted: boolean;
  deferredModulesCompletedAt?: IsoDateTime;
  mentorAssignedId?: UserId;
  status: 'PROVISIONAL' | 'FULLY_QUALIFIED' | 'EXPIRED' | 'CONVERTED' | 'REVOKED';
  convertedToRegularAt?: IsoDateTime;
  convertedPathId?: TrainingPathId;
}

export interface OfflinePackage {
  id: OfflinePackageId;
  moduleId: ModuleId;
  name: string;
  description: string;
  includedLessons: LessonId[];
  includedContent: ContentItemId[];
  totalSizeBytes: number;
  compressedSizeBytes: number;
  packageVersion: string;
  moduleVersion: string;
  contentHash: string;
  generatedAt: IsoDateTime;
  requiresOnline: {
    assessments: boolean;
    practicalSubmissions: boolean;
    knowledgeChecks: boolean;
    discussions: boolean;
    attentionChecks: boolean;
  };
  supportedPlatforms: ('IOS' | 'ANDROID' | 'WEB')[];
  minimumAppVersion: string;
}

export interface UserOfflineState {
  userId: UserId;
  deviceId: string;
  deviceType: 'IOS' | 'ANDROID' | 'WEB';
  downloadedPackages: {
    packageId: OfflinePackageId;
    downloadedAt: IsoDateTime;
    packageVersion: string;
    storageUsedBytes: number;
    lastAccessedAt?: IsoDateTime;
  }[];
  pendingLessonCompletions: {
    lessonId: LessonId;
    moduleId: ModuleId;
    completedAt: IsoDateTime;
    timeSpentMinutes: Minutes;
    offlineSessionId: string;
  }[];
  pendingContentProgress: {
    contentItemId: ContentItemId;
    progressPercent: Percentage;
    lastPositionSeconds?: number;
    updatedAt: IsoDateTime;
    offlineSessionId: string;
  }[];
  pendingKnowledgeCheckAttempts: {
    knowledgeCheckId: KnowledgeCheckId;
    lessonId: LessonId;
    answers: Record<QuestionId, string | string[]>;
    attemptedAt: IsoDateTime;
    offlineSessionId: string;
  }[];
  lastSyncedAt: IsoDateTime;
  syncStatus: 'SYNCED' | 'PENDING' | 'CONFLICT' | 'ERROR';
  syncErrorMessage?: string;
  pendingSyncCount: number;
}

export interface MobileProgressResume {
  userId: UserId;
  moduleId: ModuleId;
  lessonId: LessonId;
  contentItemId: ContentItemId;
  videoTimestampSeconds?: number;
  scrollPositionPercent?: Percentage;
  pageNumber?: number;
  lastInteractionAt: IsoDateTime;
  deviceId: string;
  syncedAt: IsoDateTime;
  sessionDurationMinutes: Minutes;
  canResumeUntil: IsoDateTime;
}

export interface QuestionAnalytics {
  questionId: QuestionId;
  moduleId: ModuleId;
  questionBankId?: QuestionBankId;
  totalAttempts: number;
  uniqueUsers: number;
  correctAttempts: number;
  correctRate: Percentage;
  discriminationIndex: number;
  pointBiserial: number;
  optionSelectionRates: Record<string, Percentage>;
  optionSelectionByPerformance: Record<string, { highPerformers: Percentage; lowPerformers: Percentage }>;
  flags: {
    tooEasy: boolean;
    tooHard: boolean;
    poorDiscrimination: boolean;
    distractorNeverChosen: string[];
    distractorTooAttractive: string[];
    possibleAmbiguity: boolean;
  };
  averageTimeSeconds: number;
  medianTimeSeconds: number;
  timeStdDev: number;
  reportedIssues: number;
  reportedUnclear: number;
  reportedWrongAnswer: number;
  lastAnalyzedAt: IsoDateTime;
  sampleSize: number;
  confidenceLevel: Percentage;
}

export interface AssessmentGeneration {
  assessmentId: AssessmentId;
  userId: UserId;
  attemptNumber: number;
  selectedQuestionIds: QuestionId[];
  selectionSeed: string;
  selectionAlgorithm: 'RANDOM' | 'STRATIFIED' | 'ADAPTIVE';
  objectivesCovered: ObjectiveId[];
  difficultyDistribution: Record<DifficultyLevel, number>;
  questionsExcluded: QuestionId[];
  generatedAt: IsoDateTime;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5: LEARNING OBJECTIVES
// ══════════════════════════════════════════════════════════════════════════════

export interface LearningObjective {
  id: ObjectiveId;
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  description: string;
  actionVerb: string;
  assessedInKnowledgeCheck: boolean;
  assessedInFinalAssessment: boolean;
  assessedInPractical: boolean;
  competencyAreaId?: string;
  criticalForSafety: boolean;
  importanceWeight: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6: QUESTIONS — AUTHORING VS DELIVERY
// ══════════════════════════════════════════════════════════════════════════════

export interface QuizOptionDelivery {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface QuizOptionAuthoring extends QuizOptionDelivery {
  isCorrect: boolean;
  feedback?: string;
  commonMistakeExplanation?: string;
}

export interface QuizQuestionDelivery {
  id: QuestionId;
  type: QuestionType;
  question: string;
  context?: string;
  imageUrl?: string;
  audioUrl?: string;
  options?: QuizOptionDelivery[];
  matchingLeftItems?: string[];
  matchingRightItems?: string[];
  itemsToOrder?: string[];
  points: Points;
  objectiveId?: ObjectiveId;
  tags: string[];
  difficulty: DifficultyLevel;
  altText?: string;
  screenReaderInstructions?: string;
}

export interface QuizQuestionAuthoring
  extends Omit<QuizQuestionDelivery, 'options' | 'matchingLeftItems' | 'matchingRightItems' | 'itemsToOrder'>
{
  options?: QuizOptionAuthoring[];
  matchingPairs?: { left: string; right: string }[];
  correctOrder?: string[];
  correctAnswer?: string | string[];
  shortAnswerRubric?: {
    keywords: string[];
    acceptableVariations: string[];
    partialCreditRules?: { condition: string; points: Points }[];
  };
  explanation: string;
  expectedDifficulty: DifficultyLevel;
  retireAfterUses?: number;
  retireIfCorrectRateAbove?: Percentage;
  retireIfCorrectRateBelow?: Percentage;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 7: KNOWLEDGE CHECKS & ASSESSMENTS
// ══════════════════════════════════════════════════════════════════════════════

export interface KnowledgeCheckAuthoring {
  id: KnowledgeCheckId;
  questions: QuizQuestionAuthoring[];
  totalPoints: Points;
  passingPoints: Points;
  allowRetry: boolean;
  maxAttempts: number;
  retryDelayMinutes?: Minutes;
  showExplanations: 'NEVER' | 'ON_PASS' | 'ON_FAIL' | 'ALWAYS';
  showCorrectAnswers: 'NEVER' | 'ON_PASS' | 'ALWAYS';
  timeLimitMinutes: Minutes | null;
}

export interface KnowledgeCheckDelivery extends Omit<KnowledgeCheckAuthoring, 'questions'> {
  questions: QuizQuestionDelivery[];
}

export interface AssessmentAuthoring {
  id: AssessmentId;
  moduleId: ModuleId;
  title: string;
  description: string;
  instructions: string;
  questions: QuizQuestionAuthoring[];
  questionBankId?: QuestionBankId;
  totalPoints: Points;
  passingPoints: Points;
  timeLimitMinutes: Minutes | null;
  gracePeriodMinutes?: Minutes;
  allowRetake: boolean;
  maxAttempts: number;
  retakeWaitHours: Hours;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionsPerPage?: number;
  allowBackNavigation: boolean;
  showQuestionNumbers: boolean;
  proctored: boolean;
  proctoringConfig?: ProctoringConfig;
  showResults: 'IMMEDIATE' | 'AFTER_SUBMISSION' | 'AFTER_REVIEW' | 'AFTER_ALL_ATTEMPTS';
  showCorrectAnswers: 'NEVER' | 'AFTER_PASSING' | 'AFTER_ALL_ATTEMPTS';
  remediationPolicy?: RemediationPolicy;
  version: string;
  effectiveDate: IsoDateTime;
}

export interface AssessmentDelivery
  extends Omit<AssessmentAuthoring, 'questions' | 'proctoringConfig' | 'remediationPolicy'>
{
  questions: QuizQuestionDelivery[];
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 8: PROCTORING
// ══════════════════════════════════════════════════════════════════════════════

export interface ProctoringConfig {
  assessmentId: AssessmentId;
  mode: ProctoringMode;
  browserLockdown?: {
    preventCopyPaste: boolean;
    preventRightClick: boolean;
    preventTabSwitch: boolean;
    preventScreenshot: boolean;
    fullscreenRequired: boolean;
    disableDevTools: boolean;
    disableExtensions: boolean;
  };
  webcamRecording?: {
    required: boolean;
    minimumResolution: '480p' | '720p' | '1080p';
    photoIntervalSeconds: number;
    fullVideoRecording: boolean;
    retentionDays: number;
    requireRoomScan: boolean;
    roomScanDurationSeconds?: number;
  };
  audioMonitoring?: {
    required: boolean;
    detectSpeech: boolean;
    detectMultipleVoices: boolean;
    retentionDays: number;
  };
  aiMonitoring?: {
    detectMultipleFaces: boolean;
    detectFaceAbsence: boolean;
    faceAbsenceThresholdSeconds: number;
    detectEyeMovement: boolean;
    eyeMovementSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
    detectAudioAnomalies: boolean;
    detectPhoneUsage: boolean;
    detectTabSwitching: boolean;
    flagThreshold: number;
    autoInvalidateThreshold?: number;
  };
  liveProctor?: {
    required: boolean;
    proctorToStudentRatio: number;
    schedulingRequired: boolean;
    proctorRoles: RoleId[];
    allowProctorIntervention: boolean;
  };
  identityVerification?: {
    required: boolean;
    method: 'PHOTO_ID' | 'BIOMETRIC' | 'KNOWLEDGE_BASED';
    photoIdTypes: ('DRIVERS_LICENSE' | 'PASSPORT' | 'STATE_ID')[];
  };
}

export interface RemediationPolicy {
  moduleId: ModuleId;
  onFail: {
    assignModules: ModuleId[];
    assignLessons: LessonId[];
    minimumWaitHoursBeforeRetake: Hours;
    maxTotalAttempts: number;
    remediationThreshold: Percentage;
    nearPassThreshold: Percentage;
  };
  escalationPolicy: {
    afterAttempts: number;
    action: 'HUMAN_REVIEW' | 'PROCTOR_REQUIRED' | 'MENTOR_ASSIGNMENT' | 'SUPERVISOR_MEETING';
    notifyRoles: RoleId[];
  }[];
  cooldownPolicy: {
    attempt: number;
    cooldownHours: Hours;
  }[];
  supportResources: {
    resourceType: 'DOCUMENT' | 'VIDEO' | 'OFFICE_HOURS' | 'MENTOR';
    title: string;
    url?: string;
    contactInfo?: string;
  }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 14: LESSONS & MODULES
// ══════════════════════════════════════════════════════════════════════════════

export interface Lesson {
  id: LessonId;
  moduleId: ModuleId;
  orderIndex: number;
  title: string;
  description: string;
  learningObjectives: LearningObjective[];
  content: ContentItem[];
  estimatedDurationMinutes: Minutes;
  requiredForModuleCompletion: boolean;
  knowledgeCheck?: KnowledgeCheckAuthoring;
  prerequisiteLessons?: LessonId[];
  hasAccessibleAlternative: boolean;
  accessibleAlternativeLessonId?: LessonId;
}

export interface TrainingModule {
  id: ModuleId;
  code: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  version: string;
  effectiveDate: IsoDateTime;
  category: ModuleCategory;
  difficulty: DifficultyLevel;
  targetRoles: RoleId[];
  prerequisites: ModuleId[];
  corequisites: ModuleId[];
  lessons: Lesson[];
  finalAssessment: AssessmentAuthoring;
  practicalAssessment?: PracticalAssessment;
  questionBankId?: QuestionBankId;
  estimatedDurationMinutes: Minutes;
  completionDeadlineDays: number | null;
  grantsCertification: boolean;
  certificationId?: CertificationId;
  certificationValidityMonths?: number;
  ceCredits: number;
  ceCategory?: ModuleCategory;
  decayPolicy?: CompetencyDecayPolicy;
  author: string;
  reviewedBy: string;
  lastReviewedAt: IsoDateTime;
  nextReviewDue: IsoDateTime;
  tags: string[];
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'RETIRED';
  previousVersionId?: ModuleId;
  migrationPolicy?: 'GRANDFATHER' | 'REQUIRE_DELTA' | 'REQUIRE_FULL_RETAKE';
}

export interface PracticalAssessment {
  id: PracticalAssessmentId;
  moduleId: ModuleId;
  title: string;
  description: string;
  instructions: string;
  method: PracticalAssessmentMethod;
  rubric: PracticalRubricItem[];
  totalPoints: Points;
  passingPoints: Points;
  evaluatorRoles: RoleId[];
  deadlineDays: number;
  allowExtension: boolean;
  maxExtensionDays: number;
}

export interface PracticalRubricItem {
  id: string;
  criterion: string;
  description: string;
  maxPoints: Points;
  criticalForSafety: boolean;
  scoringGuidance: {
    points: Points;
    description: string;
  }[];
  minimumAcceptableScore?: Points;
}

export interface CompetencyDecayPolicy {
  moduleId: ModuleId;
  decayCategory: 'CRITICAL_SAFETY' | 'PROCEDURAL' | 'INFORMATIONAL';
  refresherIntervalMonths: number;
  refresherType: 'FULL_RETAKE' | 'ABBREVIATED_QUIZ' | 'VIDEO_REVIEW' | 'ACKNOWLEDGMENT';
  refresherModuleId?: ModuleId;
  refresherPassingScore?: Percentage;
  gracePeriodDays: number;
  reminderDaysBeforeExpiry: number[];
  autoDeactivateOnExpiry: boolean;
  deactivateAfterGracePeriod: boolean;
  reactivationRequirement: 'REFRESHER' | 'FULL_RETAKE' | 'ASSESSMENT_ONLY';
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 24: MODULE IDS REGISTRY
// ══════════════════════════════════════════════════════════════════════════════

export const MODULE_IDS = {
  VOLUNTEER_ORIENTATION: 'mod_volunteer_orientation' as ModuleId,
  TRANSPORT_BASICS: 'mod_transport_basics' as ModuleId,
  VEHICLE_SAFETY: 'mod_vehicle_safety' as ModuleId,
  ANIMAL_COMFORT: 'mod_animal_comfort' as ModuleId,
  TRANSPORT_ADVANCED: 'mod_transport_advanced' as ModuleId,
  ANIMAL_HANDLING: 'mod_animal_handling' as ModuleId,
  EMERGENCY_RESPONSE: 'mod_emergency_response' as ModuleId,
  FOSTER_BASICS: 'mod_foster_basics' as ModuleId,
  ANIMAL_CARE: 'mod_animal_care' as ModuleId,
  MEDICAL_MONITORING: 'mod_medical_monitoring' as ModuleId,
  FOSTER_EMERGENCY: 'mod_foster_emergency' as ModuleId,
  ANIMAL_FIRST_AID: 'mod_animal_first_aid' as ModuleId,
  STRESS_RECOGNITION: 'mod_stress_recognition' as ModuleId,
  HUMANE_TRAPPING: 'mod_humane_trapping' as ModuleId,
  TNR_CERTIFICATION: 'mod_tnr_certification' as ModuleId,
  ANIMAL_BEHAVIOR: 'mod_animal_behavior' as ModuleId,
  MODERATOR_BASICS: 'mod_moderator_basics' as ModuleId,
  CASE_TRIAGE: 'mod_case_triage' as ModuleId,
  MODERATOR_CORE: 'mod_moderator_core' as ModuleId,
  MATCH_VERIFICATION: 'mod_match_verification' as ModuleId,
  VOLUNTEER_MANAGEMENT: 'mod_volunteer_management' as ModuleId,
  MODERATOR_ADVANCED: 'mod_moderator_advanced' as ModuleId,
  TEAM_LEADERSHIP: 'mod_team_leadership' as ModuleId,
  CRISIS_RESPONSE: 'mod_crisis_response' as ModuleId,
  COORDINATOR_TRAINING: 'mod_coordinator_training' as ModuleId,
  PARTNER_RELATIONS: 'mod_partner_relations' as ModuleId,
  CRISIS_MANAGEMENT: 'mod_crisis_management' as ModuleId,
  FOUNDATION_OPS: 'mod_foundation_ops' as ModuleId,
  LEGAL_COMPLIANCE: 'mod_legal_compliance' as ModuleId,
} as const;

export type AnyModuleId = typeof MODULE_IDS[keyof typeof MODULE_IDS];
