/**
 * Mayday TRAINING SYSTEM V2 — Part 4: Additional Services
 *
 * Contains service interfaces and implementations for:
 * - Analytics Service
 * - Proctoring Service
 * - Offline/Mobile Service
 * - Feedback Service
 * - Sandbox/Simulation Service
 * - Live Session Service
 * - Content Authoring Service
 *
 * @version 2.0.0
 */

import type {
  UserId,
  ModuleId,
  LessonId,
  ContentItemId,
  QuestionId,
  CertificationId,
  TrainingPathId,
  AssessmentId,
  ObjectiveId,
  IsoDateTime,
  Minutes,
  Hours,
  Percentage,
  Points,
  Brand,
  RoleId,
  ModuleCategory,
  DifficultyLevel,
  ContentType,
  ContentStatus,
  ProctoringMode,
  TrainingModule,
  TrainingPath,
  AssessmentAuthoring,
  UserTrainingProfile,
  AssessmentSession,
  ProctoringSession,
  ProctoringConfig,
  ProctoringEvent,
  ProctoringPhoto,
  AssessmentRecoveryPolicy,
  VideoProgress,
  VideoCompletionPolicy,
  AttentionCheck,
  OfflinePackage,
  UserOfflineState,
  MobileProgressResume,
  QuestionAnalytics,
  QuestionBank,
  UserAccommodations,
  MentorAssignment,
  MentorProfile,
  ShadowSession,
  TrainingAuditEvent,
} from './Mayday-training-system-v2-part1-types';

import type {
  TrainingAnalyticsDashboard,
  LearnerAnalytics,
  TrainingRecommendation,
  ModuleFeedback,
  ContentImprovementTicket,
  FeedbackSummary,
  LiveTrainingSession,
  LiveSessionRegistration,
  LiveSessionAttendance,
  LivePoll,
  LiveQuestion,
  BreakoutRoom,
  ContentVersion,
  ReviewWorkflow,
  ReviewAssignment,
  ContentReviewChecklist,
  ContentAuthoringPermissions,
  ComplianceReport,
  AuditExportRequest,
  TrainingSandbox,
  SimulatedCase,
  SimulatedApplication,
  SandboxAction,
} from './Mayday-training-system-v2-part2-analytics';

import { now, generateId, daysBetween, addDays, minutesBetween } from './Mayday-training-system-v2-part3-services';

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1: ANALYTICS SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IAnalyticsService {
  generateDashboard(
    periodStart: IsoDateTime,
    periodEnd: IsoDateTime,
    filters?: { regionScope?: string[]; roleScope?: RoleId[]; moduleScope?: ModuleId[] }
  ): Promise<TrainingAnalyticsDashboard>;

  generateLearnerAnalytics(userId: UserId): Promise<LearnerAnalytics>;
  generateRecommendations(userId: UserId): Promise<TrainingRecommendation[]>;

  analyzeQuestionPerformance(
    questionId: QuestionId,
    periodStart?: IsoDateTime,
    periodEnd?: IsoDateTime
  ): Promise<QuestionAnalytics>;

  identifyAtRiskLearners(thresholds?: {
    inactivityDays?: number;
    failedAssessments?: number;
    overdueModules?: number;
  }): Promise<
    {
      userId: UserId;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      riskFactors: string[];
      recommendedIntervention: string;
    }[]
  >;

  trackContentEngagement(
    userId: UserId,
    contentItemId: ContentItemId,
    engagement: {
      timeSpentSeconds: number;
      scrollDepthPercent?: Percentage;
      videoWatchPercent?: Percentage;
      interactionsCount?: number;
    }
  ): Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2: PROCTORING SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IProctoringService {
  startProctoringSession(
    assessmentSessionId: Brand<string, 'AssessmentSessionId'>,
    userId: UserId,
    config: ProctoringConfig
  ): Promise<ProctoringSession>;

  performEnvironmentCheck(
    sessionId: Brand<string, 'ProctoringSessionId'>,
    checkResults: {
      webcamWorking: boolean;
      microphoneWorking: boolean;
      browserCompatible: boolean;
      extensionsDisabled: boolean;
    }
  ): Promise<{ passed: boolean; failureReasons: string[] }>;

  submitRoomScan(
    sessionId: Brand<string, 'ProctoringSessionId'>,
    videoUrl: string
  ): Promise<{ accepted: boolean; issues?: string[] }>;

  verifyIdentity(
    sessionId: Brand<string, 'ProctoringSessionId'>,
    idPhotoUrl: string,
    selfieUrl: string
  ): Promise<{ verified: boolean; confidence: number; issues?: string[] }>;

  capturePhoto(
    sessionId: Brand<string, 'ProctoringSessionId'>,
    photoUrl: string
  ): Promise<ProctoringPhoto>;

  recordEvent(
    sessionId: Brand<string, 'ProctoringSessionId'>,
    event: Omit<ProctoringEvent, 'timestamp'>
  ): Promise<void>;

  analyzeSession(sessionId: Brand<string, 'ProctoringSessionId'>): Promise<{
    requiresReview: boolean;
    suspicionScore: number;
    flaggedEvents: ProctoringEvent[];
    recommendation: 'VALID' | 'REVIEW' | 'INVALIDATE';
  }>;

  submitReview(
    sessionId: Brand<string, 'ProctoringSessionId'>,
    reviewedBy: UserId,
    outcome: 'VALID' | 'FLAGGED' | 'INVALIDATED',
    notes?: string
  ): Promise<ProctoringSession>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3: ASSESSMENT RECOVERY SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IAssessmentRecoveryService {
  attemptRecovery(
    sessionId: Brand<string, 'AssessmentSessionId'>,
    userId: UserId,
    deviceFingerprint: string,
    ipAddress: string,
    reason: 'BROWSER_CRASH' | 'NETWORK_ERROR' | 'SESSION_TIMEOUT' | 'DEVICE_SWITCH' | 'ACCIDENTAL_CLOSE'
  ): Promise<{
    success: boolean;
    session?: AssessmentSession;
    requiresHumanApproval?: boolean;
    denialReason?: string;
    graceTimeAdded?: Minutes;
  }>;

  autosaveProgress(
    sessionId: Brand<string, 'AssessmentSessionId'>,
    answers: { questionId: QuestionId; answer: string | string[] }[]
  ): Promise<void>;

  checkAbandonedSessions(): Promise<Brand<string, 'AssessmentSessionId'>[]>;

  approveRecovery(
    sessionId: Brand<string, 'AssessmentSessionId'>,
    approvedBy: UserId,
    graceTimeMinutes?: Minutes
  ): Promise<AssessmentSession>;

  denyRecovery(
    sessionId: Brand<string, 'AssessmentSessionId'>,
    deniedBy: UserId,
    reason: string
  ): Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4: VIDEO PROGRESS SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IVideoProgressService {
  initializeProgress(userId: UserId, contentItemId: ContentItemId, totalDurationSeconds: number): Promise<VideoProgress>;
  updateProgress(userId: UserId, contentItemId: ContentItemId, currentPositionSeconds: number, playbackSpeed: number): Promise<VideoProgress>;
  recordWatchedSegment(userId: UserId, contentItemId: ContentItemId, startSeconds: number, endSeconds: number): Promise<void>;
  promptAttentionCheck(userId: UserId, contentItemId: ContentItemId, atSeconds: number): Promise<AttentionCheck>;
  submitAttentionCheckAnswer(userId: UserId, contentItemId: ContentItemId, atSeconds: number, selectedOptionIndex: number): Promise<{ correct: boolean; feedback?: string }>;
  checkCompletion(userId: UserId, contentItemId: ContentItemId, policy: VideoCompletionPolicy): Promise<{
    completed: boolean;
    percentageWatched: Percentage;
    attentionCheckPassRate: Percentage;
    issues?: string[];
  }>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5: OFFLINE/MOBILE SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IOfflineService {
  generateOfflinePackage(moduleId: ModuleId): Promise<OfflinePackage>;
  getAvailablePackages(userId: UserId): Promise<OfflinePackage[]>;
  recordPackageDownload(userId: UserId, packageId: Brand<string, 'OfflinePackageId'>, deviceId: string): Promise<void>;
  syncOfflineProgress(userId: UserId, deviceId: string, offlineState: UserOfflineState): Promise<{ synced: number; conflicts: number; errors: string[] }>;
  saveResumePoint(userId: UserId, resumePoint: Omit<MobileProgressResume, 'syncedAt'>): Promise<void>;
  getResumePoint(userId: UserId, moduleId: ModuleId): Promise<MobileProgressResume | null>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6: FEEDBACK SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IFeedbackService {
  submitModuleFeedback(
    feedback: Omit<ModuleFeedback, 'id' | 'submittedAt' | 'reviewStatus' | 'sentimentScore'>
  ): Promise<ModuleFeedback>;

  getFeedbackForModule(
    moduleId: ModuleId,
    filters?: { periodStart?: IsoDateTime; periodEnd?: IsoDateTime; minRating?: number }
  ): Promise<ModuleFeedback[]>;

  generateFeedbackSummary(moduleId: ModuleId, periodStart: IsoDateTime, periodEnd: IsoDateTime): Promise<FeedbackSummary>;

  createImprovementTicket(
    ticket: Omit<ContentImprovementTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'comments'>
  ): Promise<ContentImprovementTicket>;

  updateTicketStatus(
    ticketId: Brand<string, 'ImprovementTicketId'>,
    status: ContentImprovementTicket['status'],
    updatedBy: UserId,
    notes?: string
  ): Promise<ContentImprovementTicket>;

  respondToFeedback(
    feedbackId: Brand<string, 'FeedbackId'>,
    respondedBy: UserId,
    response: string
  ): Promise<ModuleFeedback>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 7: SANDBOX/SIMULATION SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface ISandboxService {
  createSandbox(traineeId: UserId, supervisorId: UserId, moduleId: ModuleId, pathId: TrainingPathId): Promise<TrainingSandbox>;
  addSimulatedCase(sandboxId: Brand<string, 'SandboxId'>, template: SimulatedCase['template'], difficulty: DifficultyLevel): Promise<SimulatedCase>;
  addSimulatedApplication(sandboxId: Brand<string, 'SandboxId'>, template: SimulatedApplication['template'], difficulty: DifficultyLevel): Promise<SimulatedApplication>;
  recordAction(
    sandboxId: Brand<string, 'SandboxId'>,
    action: Omit<SandboxAction, 'id' | 'timestamp' | 'wasCorrect' | 'feedback' | 'pointsEarned' | 'pointsPossible'>
  ): Promise<SandboxAction>;
  evaluateCase(sandboxId: Brand<string, 'SandboxId'>, caseId: string, traineeActions: string[]): Promise<{ score: Percentage; feedback: string; criticalMistakes: string[]; passedScenario: boolean }>;
  completeSandbox(sandboxId: Brand<string, 'SandboxId'>, supervisorFeedback: string, readyForLiveWork: boolean): Promise<TrainingSandbox>;
  getSandbox(sandboxId: Brand<string, 'SandboxId'>): Promise<TrainingSandbox | null>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 8: LIVE SESSION SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface ILiveSessionService {
  createSession(
    session: Omit<LiveTrainingSession, 'id' | 'status' | 'registrations' | 'waitlist' | 'attendance' | 'polls' | 'questions'>
  ): Promise<LiveTrainingSession>;
  registerParticipant(sessionId: Brand<string, 'LiveSessionId'>, userId: UserId): Promise<LiveSessionRegistration>;
  cancelRegistration(sessionId: Brand<string, 'LiveSessionId'>, userId: UserId, reason?: string): Promise<void>;
  startSession(sessionId: Brand<string, 'LiveSessionId'>): Promise<LiveTrainingSession>;
  recordAttendance(sessionId: Brand<string, 'LiveSessionId'>, userId: UserId, action: 'JOIN' | 'LEAVE'): Promise<LiveSessionAttendance>;
  launchPoll(sessionId: Brand<string, 'LiveSessionId'>, poll: Omit<LivePoll, 'id' | 'launchedAt' | 'closedAt' | 'responses'>): Promise<LivePoll>;
  submitPollResponse(sessionId: Brand<string, 'LiveSessionId'>, pollId: string, userId: UserId, response: string | string[] | number): Promise<void>;
  askQuestion(sessionId: Brand<string, 'LiveSessionId'>, userId: UserId, question: string, anonymous?: boolean): Promise<LiveQuestion>;
  answerQuestion(sessionId: Brand<string, 'LiveSessionId'>, questionId: string, answeredBy: UserId, summary?: string): Promise<void>;
  endSession(sessionId: Brand<string, 'LiveSessionId'>): Promise<LiveTrainingSession>;
  processCompletions(sessionId: Brand<string, 'LiveSessionId'>): Promise<{ userId: UserId; completed: boolean; reason?: string }[]>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 9: CONTENT AUTHORING SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IContentAuthoringService {
  createContentVersion(
    entityType: 'MODULE' | 'LESSON' | 'CONTENT_ITEM' | 'ASSESSMENT' | 'QUESTION',
    entityId: string,
    content: Record<string, unknown>,
    createdBy: UserId,
    changeDescription: string
  ): Promise<ContentVersion>;

  submitForReview(
    versionId: Brand<string, 'ContentVersionId'>,
    reviewers: { userId: UserId; role: ReviewAssignment['role'] }[]
  ): Promise<ReviewWorkflow>;

  submitReview(
    versionId: Brand<string, 'ContentVersionId'>,
    reviewerId: UserId,
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    comments?: string
  ): Promise<ReviewWorkflow>;

  publishVersion(versionId: Brand<string, 'ContentVersionId'>, publishedBy: UserId): Promise<ContentVersion>;

  getVersionHistory(entityType: string, entityId: string): Promise<ContentVersion[]>;

  compareVersions(
    versionId1: Brand<string, 'ContentVersionId'>,
    versionId2: Brand<string, 'ContentVersionId'>
  ): Promise<{ added: string[]; removed: string[]; changed: string[] }>;

  getUserPermissions(userId: UserId): Promise<ContentAuthoringPermissions>;
  setUserPermissions(userId: UserId, permissions: Partial<ContentAuthoringPermissions>): Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 10: COMPLIANCE REPORT SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IComplianceReportService {
  generateReport(
    reportType: ComplianceReport['reportType'],
    periodStart: IsoDateTime,
    periodEnd: IsoDateTime,
    filters?: { regionScope?: string[]; roleScope?: RoleId[]; moduleScope?: ModuleId[] }
  ): Promise<ComplianceReport>;

  scheduleRecurringReport(
    reportType: ComplianceReport['reportType'],
    schedule: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    recipients: UserId[],
    filters?: Record<string, unknown>
  ): Promise<string>;

  requestAuditExport(
    request: Omit<AuditExportRequest, 'id' | 'requestedAt' | 'approvalStatus' | 'generationStatus' | 'downloadCount' | 'accessLog'>
  ): Promise<AuditExportRequest>;

  approveAuditExport(
    requestId: Brand<string, 'AuditExportRequestId'>,
    approvedBy: UserId,
    notes?: string
  ): Promise<AuditExportRequest>;

  generateAuditExport(requestId: Brand<string, 'AuditExportRequestId'>): Promise<AuditExportRequest>;
  downloadAuditExport(requestId: Brand<string, 'AuditExportRequestId'>, downloadedBy: UserId): Promise<string>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 11: MENTOR SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IMentorService {
  createMentorProfile(
    userId: UserId,
    profile: Omit<
      MentorProfile,
      'userId' | 'currentMenteeCount' | 'totalMenteesCompleted' | 'averageMenteeRating' | 'averageCompletionDays'
    >
  ): Promise<MentorProfile>;

  updateMentorAvailability(userId: UserId, available: boolean): Promise<MentorProfile>;
  getMentorProfile(userId: UserId): Promise<MentorProfile | null>;
  getAvailableMentors(roleId: RoleId, region?: string): Promise<MentorProfile[]>;

  assignMentor(menteeId: UserId, mentorId: UserId, pathId: TrainingPathId, roleId: RoleId): Promise<MentorAssignment>;

  reassignMentor(
    assignmentId: Brand<string, 'MentorAssignmentId'>,
    newMentorId: UserId,
    reason: string
  ): Promise<MentorAssignment>;

  scheduleShadowSession(
    assignmentId: Brand<string, 'MentorAssignmentId'>,
    scheduledAt: IsoDateTime,
    activityType: ShadowSession['activityType'],
    description?: string
  ): Promise<ShadowSession>;

  completeShadowSession(
    sessionId: Brand<string, 'ShadowSessionId'>,
    mentorObservations: string,
    competenciesObserved: string[],
    readyForIndependent: boolean
  ): Promise<ShadowSession>;

  submitMenteeReflection(
    sessionId: Brand<string, 'ShadowSessionId'>,
    reflection: string,
    learnings: string[],
    questions?: string[]
  ): Promise<ShadowSession>;

  completeAssignment(
    assignmentId: Brand<string, 'MentorAssignmentId'>,
    completionNotes: string
  ): Promise<MentorAssignment>;

  submitMenteeFeedback(assignmentId: Brand<string, 'MentorAssignmentId'>, feedback: string, rating: number): Promise<void>;
  submitMentorFeedback(assignmentId: Brand<string, 'MentorAssignmentId'>, feedback: string): Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 12: ACCOMMODATION SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface IAccommodationService {
  requestAccommodation(
    userId: UserId,
    accommodationType: keyof UserAccommodations,
    value: unknown,
    documentationUrl?: string
  ): Promise<{ requestId: string; status: 'PENDING' | 'APPROVED' | 'DENIED' }>;

  approveAccommodation(requestId: string, approvedBy: UserId, expiresAt?: IsoDateTime): Promise<UserAccommodations>;

  getUserAccommodations(userId: UserId): Promise<UserAccommodations | null>;

  applyAccommodationsToAssessment(
    userId: UserId,
    assessmentId: AssessmentId
  ): Promise<{
    timeLimitMultiplier: number;
    additionalFeatures: string[];
  }>;

  generateAccommodationReport(
    periodStart: IsoDateTime,
    periodEnd: IsoDateTime
  ): Promise<{
    totalRequests: number;
    approvedRequests: number;
    byType: Record<string, number>;
    outcomeComparison: {
      withAccommodations: { avgScore: number; passRate: number };
      withoutAccommodations: { avgScore: number; passRate: number };
    };
  }>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 13: SERVICE REGISTRY
// ══════════════════════════════════════════════════════════════════════════════

export interface ServiceRegistry {
  analytics: IAnalyticsService;
  proctoring: IProctoringService;
  assessmentRecovery: IAssessmentRecoveryService;
  videoProgress: IVideoProgressService;
  offline: IOfflineService;
  feedback: IFeedbackService;
  sandbox: ISandboxService;
  liveSession: ILiveSessionService;
  contentAuthoring: IContentAuthoringService;
  complianceReport: IComplianceReportService;
  mentor: IMentorService;
  accommodation: IAccommodationService;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 14: EVENT TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type TrainingDomainEvent =
  | { type: 'PATH_ASSIGNED'; userId: UserId; pathId: TrainingPathId; assignedBy: UserId | 'SYSTEM' }
  | { type: 'MODULE_ASSIGNED'; userId: UserId; moduleId: ModuleId; pathId?: TrainingPathId }
  | { type: 'LESSON_STARTED'; userId: UserId; moduleId: ModuleId; lessonId: LessonId }
  | { type: 'LESSON_COMPLETED'; userId: UserId; moduleId: ModuleId; lessonId: LessonId; score?: Percentage }
  | { type: 'ASSESSMENT_STARTED'; userId: UserId; assessmentId: AssessmentId; attemptNumber: number }
  | { type: 'ASSESSMENT_COMPLETED'; userId: UserId; assessmentId: AssessmentId; score: Percentage; passed: boolean }
  | { type: 'MODULE_COMPLETED'; userId: UserId; moduleId: ModuleId; score: Percentage }
  | { type: 'PATH_PHASE_COMPLETED'; userId: UserId; pathId: TrainingPathId; phaseIndex: number }
  | { type: 'PATH_COMPLETED'; userId: UserId; pathId: TrainingPathId }
  | { type: 'CERTIFICATION_ISSUED'; userId: UserId; certificationId: CertificationId }
  | { type: 'CERTIFICATION_EXPIRED'; userId: UserId; certificationId: CertificationId }
  | { type: 'CERTIFICATION_RENEWED'; userId: UserId; certificationId: CertificationId }
  | { type: 'CE_CREDIT_EARNED'; userId: UserId; credits: number; category: ModuleCategory }
  | { type: 'PROCTORING_FLAGGED'; userId: UserId; sessionId: Brand<string, 'ProctoringSessionId'>; reasons: string[] }
  | { type: 'ASSESSMENT_INVALIDATED'; userId: UserId; assessmentId: AssessmentId; reason: string }
  | { type: 'MENTOR_ASSIGNED'; menteeId: UserId; mentorId: UserId; pathId: TrainingPathId }
  | { type: 'SHADOW_SESSION_COMPLETED'; menteeId: UserId; mentorId: UserId; readyForIndependent: boolean }
  | { type: 'SANDBOX_COMPLETED'; userId: UserId; passed: boolean; criticalErrors: number }
  | { type: 'DEADLINE_WARNING'; userId: UserId; entityType: 'MODULE' | 'PATH' | 'CERTIFICATION'; entityId: string; daysRemaining: number }
  | { type: 'AT_RISK_LEARNER_IDENTIFIED'; userId: UserId; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; factors: string[] };

export interface EventHandler<T extends TrainingDomainEvent['type']> {
  handle(event: Extract<TrainingDomainEvent, { type: T }>): Promise<void>;
}

export interface EventBus {
  publish(event: TrainingDomainEvent): Promise<void>;
  subscribe<T extends TrainingDomainEvent['type']>(eventType: T, handler: EventHandler<T>): void;
  unsubscribe<T extends TrainingDomainEvent['type']>(eventType: T, handler: EventHandler<T>): void;
}
