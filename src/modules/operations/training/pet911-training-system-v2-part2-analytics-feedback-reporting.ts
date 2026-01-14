/**
 * petmayday TRAINING SYSTEM V2 — Part 2: Analytics, Feedback & Reporting
 *
 * Contains:
 * - Learning Analytics Dashboard
 * - Feedback & Continuous Improvement
 * - Live Training Sessions
 * - Content Authoring Workflow
 * - Compliance & Audit Reports
 * - Training Sandbox/Simulation
 *
 * @version 2.0.0
 */

import type {
  UserId,
  ModuleId,
  LessonId,
  ContentItemId,
  QuestionId,
  TrainingPathId,
  CertificationId,
  AssessmentId,
  ObjectiveId,
  IsoDateTime,
  Minutes,
  Hours,
  Percentage,
  Points,
  Brand,
  ContentType,
  ModuleCategory,
  DifficultyLevel,
  ContentStatus,
  ProctoringSessionId,
} from './petmayday-training-system-v2-part1-types';
import type { RoleId } from '../roles';

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1: LEARNING ANALYTICS DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

export interface TrainingAnalyticsDashboard {
  periodStart: IsoDateTime;
  periodEnd: IsoDateTime;
  generatedAt: IsoDateTime;
  enrollment: EnrollmentMetrics;
  completion: CompletionMetrics;
  assessments: AssessmentMetrics;
  engagement: EngagementMetrics;
  certifications: CertificationMetrics;
  ceCompliance: CeComplianceMetrics;
  alerts: AnalyticsAlert[];
}

export interface EnrollmentMetrics {
  totalEnrolled: number;
  activeEnrolled: number;
  newEnrollmentsThisPeriod: number;
  enrollmentsByPath: Record<TrainingPathId, {
    pathName: string;
    count: number;
    percentOfTotal: Percentage;
  }>;
  enrollmentsByRole: Record<RoleId, {
    roleName: string;
    count: number;
  }>;
  enrollmentTrend: {
    date: string;
    enrollments: number;
    cumulativeTotal: number;
  }[];
  enrollmentsByRegion?: Record<string, number>;
  enrollmentsBySource?: Record<string, number>;
}

export interface CompletionMetrics {
  overallCompletionRate: Percentage;
  averageTimeToCompletionDays: number;
  medianTimeToCompletionDays: number;
  completionsByPath: Record<TrainingPathId, {
    pathName: string;
    enrolled: number;
    completed: number;
    inProgress: number;
    dropped: number;
    overdue: number;
    completionRate: Percentage;
    averageCompletionDays: number;
  }>;
  completionsByModule: Record<ModuleId, {
    moduleCode: string;
    moduleTitle: string;
    enrolled: number;
    completed: number;
    completionRate: Percentage;
    averageTimeMinutes: Minutes;
  }>;
  completionTrend: {
    date: string;
    completions: number;
    enrollments: number;
  }[];
  highestDropOffModules: {
    moduleId: ModuleId;
    moduleTitle: string;
    dropOffRate: Percentage;
    averageProgressAtDrop: Percentage;
  }[];
  overdueUsers: {
    userId: UserId;
    pathId: TrainingPathId;
    dueDate: IsoDateTime;
    daysOverdue: number;
    lastActivityAt?: IsoDateTime;
  }[];
}

export interface AssessmentMetrics {
  totalAssessmentsTaken: number;
  averageScore: Percentage;
  passRate: Percentage;
  averageAttempts: number;
  scoreDistribution: {
    range: string;
    count: number;
    percentage: Percentage;
  }[];
  performanceByModule: Record<ModuleId, {
    moduleTitle: string;
    averageScore: Percentage;
    passRate: Percentage;
    averageAttempts: number;
    totalAttempts: number;
  }>;
  lowestPassRateModules: {
    moduleId: ModuleId;
    moduleTitle: string;
    passRate: Percentage;
    totalAttempts: number;
  }[];
  highestRetakeModules: {
    moduleId: ModuleId;
    moduleTitle: string;
    averageAttempts: number;
    retakeRate: Percentage;
  }[];
  mostMissedQuestions: {
    questionId: QuestionId;
    moduleId: ModuleId;
    questionText: string;
    correctRate: Percentage;
    totalAttempts: number;
  }[];
  proctoringStats?: {
    totalProctoredAssessments: number;
    flaggedForReview: number;
    invalidated: number;
    flagRate: Percentage;
  };
}

export interface EngagementMetrics {
  totalLearningHours: Hours;
  averageSessionDurationMinutes: Minutes;
  averageSessionsPerUser: number;
  contentCompletionRates: Record<ContentType, {
    totalItems: number;
    completedItems: number;
    completionRate: Percentage;
    averageTimeMinutes: Minutes;
  }>;
  timeByContentType: Record<ContentType, {
    totalHours: Hours;
    averageMinutesPerItem: Minutes;
  }>;
  dropOffPoints: {
    moduleId: ModuleId;
    moduleTitle: string;
    lessonId: LessonId;
    lessonTitle: string;
    contentItemId?: ContentItemId;
    contentTitle?: string;
    dropOffRate: Percentage;
    usersDropped: number;
  }[];
  engagementByDayOfWeek: Record<string, {
    sessions: number;
    totalMinutes: Minutes;
  }>;
  engagementByTimeOfDay: Record<string, {
    sessions: number;
    totalMinutes: Minutes;
  }>;
  deviceBreakdown: {
    desktop: Percentage;
    mobile: Percentage;
    tablet: Percentage;
  };
  offlineUsage?: {
    packagesDownloaded: number;
    offlineCompletions: number;
    percentOffline: Percentage;
  };
}

export interface CertificationMetrics {
  activeCertifications: number;
  issuedThisPeriod: number;
  certificationsByType: Record<CertificationId, {
    certificationName: string;
    active: number;
    expiringSoon: number;
    expired: number;
    revoked: number;
  }>;
  expirationForecast: {
    next30Days: number;
    next60Days: number;
    next90Days: number;
  };
  renewalMetrics: {
    totalDueForRenewal: number;
    renewedOnTime: number;
    renewedLate: number;
    lapsed: number;
    renewalRate: Percentage;
  };
}

export interface CeComplianceMetrics {
  totalVolunteersRequiringCe: number;
  compliantVolunteers: number;
  atRiskVolunteers: number;
  nonCompliantVolunteers: number;
  complianceRate: Percentage;
  complianceByRole: Record<RoleId, {
    roleName: string;
    required: number;
    compliant: number;
    complianceRate: Percentage;
  }>;
  averageCeCreditsEarned: number;
  creditsByCategory: Record<ModuleCategory, {
    totalEarned: number;
    averagePerUser: number;
  }>;
  nonCompliantUsers: {
    userId: UserId;
    roleId: RoleId;
    hoursRequired: number;
    hoursEarned: number;
    hoursShort: number;
    deadline: IsoDateTime;
    daysUntilDeadline: number;
  }[];
}

export interface AnalyticsAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: 'COMPLETION' | 'ASSESSMENT' | 'CERTIFICATION' | 'CE' | 'ENGAGEMENT' | 'CONTENT';
  title: string;
  description: string;
  affectedCount: number;
  detectedAt: IsoDateTime;
  actionRequired?: string;
  relatedEntityType?: 'USER' | 'MODULE' | 'PATH' | 'CERTIFICATION';
  relatedEntityIds?: string[];
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2: INDIVIDUAL LEARNER ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

export interface LearnerAnalytics {
  userId: UserId;
  generatedAt: IsoDateTime;
  learningPatterns: {
    preferredTimeOfDay: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'VARIED';
    averageSessionLengthMinutes: Minutes;
    typicalSessionsPerWeek: number;
    preferredContentType: ContentType;
    preferredDevice: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'VARIED';
    completesInOneSession: boolean;
    prefersDayBatching: boolean;
    usesOfflineMode: boolean;
  };
  performanceProfile: {
    overallAverageScore: Percentage;
    assessmentStrength: 'LOW' | 'MEDIUM' | 'HIGH';
    strongObjectives: {
      objectiveId: ObjectiveId;
      description: string;
      averageScore: Percentage;
    }[];
    weakObjectives: {
      objectiveId: ObjectiveId;
      description: string;
      averageScore: Percentage;
      recommendedReview: ModuleId[];
    }[];
    scoresByCategory: Record<ModuleCategory, Percentage>;
  };
  engagementHealth: {
    engagementScore: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    lastActivityDaysAgo: number;
    atRiskIndicators: {
      longInactivityGap: boolean;
      failedMultipleAssessments: boolean;
      lowEngagementTrend: boolean;
      missedDeadlines: boolean;
      abandonedModules: boolean;
      frequentInterruptions: boolean;
    };
    atRiskScore: number;
  };
  predictions: {
    predictedCompletionDate?: IsoDateTime;
    riskOfDropout: 'LOW' | 'MEDIUM' | 'HIGH';
    dropoutRiskFactors?: string[];
    recommendedInterventions?: string[];
  };
  recommendations: TrainingRecommendation[];
  comparativeMetrics?: {
    scorePercentile: number;
    speedPercentile: number;
    engagementPercentile: number;
  };
}

export interface TrainingRecommendation {
  id: Brand<string, 'RecommendationId'>;
  userId: UserId;
  recommendationType:
    | 'ROLE_EXPANSION'
    | 'SKILL_GAP'
    | 'CAREER_PATH'
    | 'REFRESHER'
    | 'CE_CREDIT'
    | 'MENTORSHIP'
    | 'ADVANCED_TRAINING';
  title: string;
  description: string;
  reasoning: string;
  recommendedModules?: ModuleId[];
  recommendedPaths?: TrainingPathId[];
  recommendedCertifications?: CertificationId[];
  triggeredBy:
    | 'ASSESSMENT_PERFORMANCE'
    | 'ACTIVITY_PATTERN'
    | 'TENURE'
    | 'ROLE_REQUIREMENTS'
    | 'CE_DEADLINE'
    | 'MANUAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: IsoDateTime;
  expiresAt?: IsoDateTime;
  dismissedAt?: IsoDateTime;
  acceptedAt?: IsoDateTime;
  actionTaken?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3: FEEDBACK & CONTINUOUS IMPROVEMENT
// ══════════════════════════════════════════════════════════════════════════════

export interface ModuleFeedback {
  id: Brand<string, 'FeedbackId'>;
  moduleId: ModuleId;
  lessonId?: LessonId;
  contentItemId?: ContentItemId;
  questionId?: QuestionId;
  userId: UserId;
  submittedAt: IsoDateTime;
  submittedAfter: 'LESSON' | 'MODULE' | 'ASSESSMENT';
  attemptNumber?: number;
  assessmentScore?: Percentage;
  ratings: {
    overallQuality: number;
    relevanceToRole: number;
    clarity: number;
    engagement: number;
    practicalUsefulness: number;
    technicalQuality?: number;
  };
  difficulty: 'TOO_EASY' | 'JUST_RIGHT' | 'TOO_HARD';
  length: 'TOO_SHORT' | 'JUST_RIGHT' | 'TOO_LONG';
  pacing: 'TOO_SLOW' | 'JUST_RIGHT' | 'TOO_FAST';
  whatWorkedWell?: string;
  whatCouldImprove?: string;
  technicalIssues?: string;
  suggestedChanges?: string;
  additionalComments?: string;
  questionFeedback?: {
    wasUnclear: boolean;
    hadWrongAnswer: boolean;
    wasNotCoveredInContent: boolean;
    explanation?: string;
  };
  sentimentScore?: number;
  wouldRecommend: boolean;
  npsScore?: number;
  responseRequested: boolean;
  respondedBy?: UserId;
  respondedAt?: IsoDateTime;
  responseText?: string;
  reviewStatus: 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';
  reviewedBy?: UserId;
  reviewNotes?: string;
  linkedTicketId?: Brand<string, 'ImprovementTicketId'>;
}

export interface ContentImprovementTicket {
  id: Brand<string, 'ImprovementTicketId'>;
  moduleId: ModuleId;
  lessonId?: LessonId;
  contentItemId?: ContentItemId;
  questionId?: QuestionId;
  sourceType: 'FEEDBACK' | 'ANALYTICS' | 'SME_REVIEW' | 'INCIDENT' | 'COMPLIANCE' | 'MANUAL';
  sourceFeedbackIds?: Brand<string, 'FeedbackId'>[];
  sourceAnalyticsSnapshot?: string;
  issueType:
    | 'ACCURACY'
    | 'CLARITY'
    | 'OUTDATED'
    | 'ACCESSIBILITY'
    | 'ENGAGEMENT'
    | 'DIFFICULTY'
    | 'TECHNICAL'
    | 'COMPLIANCE'
    | 'QUESTION_QUALITY'
    | 'LOCALIZATION';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo?: UserId;
  assignedAt?: IsoDateTime;
  status: 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'RESOLVED' | 'WONT_FIX';
  resolution?: string;
  resolutionType?: 'CONTENT_UPDATED' | 'QUESTION_RETIRED' | 'QUESTION_REVISED' | 'NO_CHANGE_NEEDED' | 'DEFERRED';
  resolvedAt?: IsoDateTime;
  resolvedBy?: UserId;
  affectedUserCount?: number;
  feedbackCountBeforeFix?: number;
  feedbackScoreBeforeFix?: number;
  feedbackScoreAfterFix?: number;
  contentVersionBefore?: string;
  contentVersionAfter?: string;
  createdAt: IsoDateTime;
  createdBy: UserId;
  updatedAt: IsoDateTime;
  comments: {
    userId: UserId;
    timestamp: IsoDateTime;
    text: string;
  }[];
}

export interface FeedbackSummary {
  moduleId: ModuleId;
  periodStart: IsoDateTime;
  periodEnd: IsoDateTime;
  totalResponses: number;
  responseRate: Percentage;
  averageRatings: {
    overallQuality: number;
    relevanceToRole: number;
    clarity: number;
    engagement: number;
    practicalUsefulness: number;
  };
  difficultyDistribution: {
    tooEasy: Percentage;
    justRight: Percentage;
    tooHard: Percentage;
  };
  lengthDistribution: {
    tooShort: Percentage;
    justRight: Percentage;
    tooLong: Percentage;
  };
  recommendRate: Percentage;
  npsScore: number;
  ratingTrend: {
    period: string;
    overallQuality: number;
    responseCount: number;
  }[];
  commonThemes: {
    theme: string;
    mentionCount: number;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    exampleFeedback: string[];
  }[];
  contentItemFeedback: {
    contentItemId: ContentItemId;
    title: string;
    averageRating: number;
    responseCount: number;
    issuesReported: number;
  }[];
  openTickets: number;
  resolvedTickets: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4: LIVE TRAINING SESSIONS
// ══════════════════════════════════════════════════════════════════════════════

export interface LiveTrainingSession {
  id: Brand<string, 'LiveSessionId'>;
  moduleId?: ModuleId;
  title: string;
  description: string;
  sessionType: 'WEBINAR' | 'WORKSHOP' | 'Q_AND_A' | 'OFFICE_HOURS' | 'ORIENTATION' | 'CERTIFICATION_PREP';
  scheduledAt: IsoDateTime;
  durationMinutes: Minutes;
  timezone: string;
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    dayOfWeek?: number[];
    endDate?: IsoDateTime;
  };
  maxParticipants: number;
  registrationDeadline?: IsoDateTime;
  waitlistEnabled: boolean;
  maxWaitlist: number;
  registrations: LiveSessionRegistration[];
  waitlist: LiveSessionRegistration[];
  primaryFacilitatorId: UserId;
  coFacilitatorIds: UserId[];
  platform: 'ZOOM' | 'TEAMS' | 'GOOGLE_MEET' | 'WEBEX' | 'IN_PERSON' | 'HYBRID';
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  physicalLocation?: string;
  hybridDetails?: string;
  status:
    | 'DRAFT'
    | 'SCHEDULED'
    | 'REGISTRATION_OPEN'
    | 'REGISTRATION_CLOSED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
  actualStartedAt?: IsoDateTime;
  actualEndedAt?: IsoDateTime;
  attendance: LiveSessionAttendance[];
  polls: LivePoll[];
  questions: LiveQuestion[];
  breakoutRooms?: BreakoutRoom[];
  preMaterials: ContentItemId[];
  sessionMaterials: ContentItemId[];
  postMaterials: ContentItemId[];
  recordingEnabled: boolean;
  recordingUrl?: string;
  recordingAvailableUntil?: IsoDateTime;
  completionRequirements: {
    minimumAttendancePercent: Percentage;
    pollParticipationRequired: boolean;
    minimumPollParticipation?: Percentage;
    postSessionQuizRequired: boolean;
    postSessionQuizId?: AssessmentId;
  };
  ceCreditsAwarded: number;
  ceCategory?: ModuleCategory;
  feedbackFormEnabled: boolean;
  feedbackDeadline?: IsoDateTime;
}

export interface LiveSessionRegistration {
  userId: UserId;
  registeredAt: IsoDateTime;
  status: 'REGISTERED' | 'WAITLISTED' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
  remindersSent: {
    type: '1_WEEK' | '1_DAY' | '1_HOUR';
    sentAt: IsoDateTime;
  }[];
  cancellationReason?: string;
  cancelledAt?: IsoDateTime;
  promotedFromWaitlistAt?: IsoDateTime;
}

export interface LiveSessionAttendance {
  userId: UserId;
  joinedAt?: IsoDateTime;
  leftAt?: IsoDateTime;
  totalAttendanceMinutes: Minutes;
  attendanceLog: {
    action: 'JOIN' | 'LEAVE';
    timestamp: IsoDateTime;
  }[];
  attendancePercent: Percentage;
  attendanceStatus: 'PRESENT' | 'PARTIAL' | 'ABSENT' | 'EXCUSED';
  pollsAnswered: number;
  questionsAsked: number;
  completionAwarded: boolean;
  ceCreditsAwarded: number;
}

export interface LivePoll {
  id: string;
  question: string;
  pollType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RATING' | 'OPEN_ENDED';
  options?: string[];
  launchedAt?: IsoDateTime;
  closedAt?: IsoDateTime;
  durationSeconds?: number;
  responses: {
    userId: UserId;
    response: string | string[] | number;
    respondedAt: IsoDateTime;
  }[];
  isKnowledgeCheck: boolean;
  correctOptionIndex?: number;
  anonymousResults: boolean;
}

export interface LiveQuestion {
  id: string;
  askedBy: UserId;
  askedAt: IsoDateTime;
  questionText: string;
  status: 'PENDING' | 'ANSWERED' | 'SKIPPED' | 'DEFERRED';
  upvotes: UserId[];
  upvoteCount: number;
  answeredAt?: IsoDateTime;
  answeredBy?: UserId;
  answerSummary?: string;
  isAnonymous: boolean;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participants: UserId[];
  facilitatorId?: UserId;
  topic?: string;
  instructions?: string;
  startedAt?: IsoDateTime;
  durationMinutes: Minutes;
  endedAt?: IsoDateTime;
  reportBack?: string;
  notes?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5: CONTENT AUTHORING WORKFLOW
// ══════════════════════════════════════════════════════════════════════════════

export interface ContentVersion {
  id: Brand<string, 'ContentVersionId'>;
  entityType: 'MODULE' | 'LESSON' | 'CONTENT_ITEM' | 'ASSESSMENT' | 'QUESTION';
  entityId: string;
  versionNumber: string;
  status: ContentStatus;
  contentSnapshot: Record<string, unknown>;
  createdBy: UserId;
  createdAt: IsoDateTime;
  changeType: 'INITIAL' | 'MINOR_UPDATE' | 'MAJOR_UPDATE' | 'CORRECTION' | 'LOCALIZATION';
  changeDescription: string;
  changeNotes?: string;
  reviewWorkflow: ReviewWorkflow;
  approvedBy?: UserId;
  approvedAt?: IsoDateTime;
  publishedAt?: IsoDateTime;
  publishedBy?: UserId;
  retiredAt?: IsoDateTime;
  retiredBy?: UserId;
  retirementReason?: string;
  replacedByVersionId?: Brand<string, 'ContentVersionId'>;
  diffFromPreviousId?: Brand<string, 'ContentVersionId'>;
  diffSummary?: string;
}

export interface ReviewWorkflow {
  versionId: Brand<string, 'ContentVersionId'>;
  status: 'PENDING_REVIEWS' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  requiredReviewers: ReviewAssignment[];
  optionalReviewers: ReviewAssignment[];
  minimumApprovalsRequired: number;
  currentApprovals: number;
  currentRejections: number;
  startedAt: IsoDateTime;
  completedAt?: IsoDateTime;
  finalDecision?: 'APPROVED' | 'REJECTED';
  finalDecisionBy?: UserId;
  finalDecisionAt?: IsoDateTime;
  finalDecisionNotes?: string;
}

export interface ReviewAssignment {
  userId: UserId;
  role: 'SME' | 'LEGAL' | 'ACCESSIBILITY' | 'EDITORIAL' | 'COMPLIANCE' | 'TECHNICAL';
  assignedAt: IsoDateTime;
  dueDate: IsoDateTime;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'SKIPPED';
  reviewedAt?: IsoDateTime;
  decision?: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
  comments?: string;
  changeRequests?: {
    id: string;
    description: string;
    severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
    resolved: boolean;
    resolvedAt?: IsoDateTime;
  }[];
  checklistCompleted?: ContentReviewChecklist;
}

export interface ContentReviewChecklist {
  checklistId: string;
  versionId: Brand<string, 'ContentVersionId'>;
  reviewerId: UserId;
  checks: {
    category: 'ACCURACY' | 'LEGAL' | 'ACCESSIBILITY' | 'BRAND' | 'TECHNICAL' | 'PEDAGOGICAL';
    checkItem: string;
    required: boolean;
    passed: boolean;
    notes?: string;
    checkedAt?: IsoDateTime;
  }[];
  overallPassed: boolean;
  completedAt?: IsoDateTime;
}

export interface ContentAuthoringPermissions {
  userId: UserId;
  canCreate: ModuleCategory[];
  canCreateTypes: ('MODULE' | 'LESSON' | 'CONTENT_ITEM' | 'ASSESSMENT' | 'QUESTION')[];
  canEditModules: ModuleId[];
  canEditCategories: ModuleCategory[];
  canReviewAs: ('SME' | 'LEGAL' | 'ACCESSIBILITY' | 'EDITORIAL' | 'COMPLIANCE' | 'TECHNICAL')[];
  canReviewCategories: ModuleCategory[];
  canApproveCategories: ModuleCategory[];
  canApproveTypes: ('MODULE' | 'LESSON' | 'CONTENT_ITEM' | 'ASSESSMENT' | 'QUESTION')[];
  canPublishCategories: ModuleCategory[];
  regionScope?: string[];
  roleScope?: RoleId[];
  effectiveFrom: IsoDateTime;
  effectiveUntil?: IsoDateTime;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6: COMPLIANCE & AUDIT REPORTS
// ══════════════════════════════════════════════════════════════════════════════

export interface ComplianceReport {
  id: Brand<string, 'ComplianceReportId'>;
  reportType:
    | 'TRAINING_COMPLETION'
    | 'CERTIFICATION_STATUS'
    | 'CE_COMPLIANCE'
    | 'INCIDENT_CORRELATION'
    | 'AUDIT_TRAIL'
    | 'PROCTORING_SUMMARY'
    | 'ACCOMMODATION_USAGE'
    | 'CONTENT_REVIEW_STATUS';
  title: string;
  description?: string;
  generatedAt: IsoDateTime;
  generatedBy: UserId | 'SYSTEM';
  periodStart: IsoDateTime;
  periodEnd: IsoDateTime;
  regionScope?: string[];
  roleScope?: RoleId[];
  moduleScope?: ModuleId[];
  parameters: Record<string, unknown>;
  data: ComplianceReportData;
  summary: {
    totalRecords: number;
    compliantCount?: number;
    nonCompliantCount?: number;
    complianceRate?: Percentage;
    keyFindings: string[];
    recommendations?: string[];
  };
  exportFormats: ('PDF' | 'CSV' | 'XLSX' | 'JSON')[];
  exportUrls: Record<string, string>;
  retainUntil: IsoDateTime;
  accessibleTo: UserId[];
  accessibleToRoles: RoleId[];
}

export type ComplianceReportData =
  | TrainingCompletionReportData
  | CertificationStatusReportData
  | CeComplianceReportData
  | IncidentCorrelationReportData
  | AuditTrailReportData
  | ProctoringReportData
  | AccommodationReportData
  | ContentReviewReportData;

export interface TrainingCompletionReportData {
  type: 'TRAINING_COMPLETION';
  byRole: Record<RoleId, {
    roleName: string;
    totalUsers: number;
    completedTraining: number;
    inProgress: number;
    notStarted: number;
    overdue: number;
    completionRate: Percentage;
  }>;
  byModule: Record<ModuleId, {
    moduleTitle: string;
    enrolled: number;
    completed: number;
    completionRate: Percentage;
    averageScore: Percentage;
  }>;
  overdueDetails: {
    userId: UserId;
    userName: string;
    roleId: RoleId;
    pathId: TrainingPathId;
    dueDate: IsoDateTime;
    daysOverdue: number;
    lastActivity?: IsoDateTime;
  }[];
}

export interface CertificationStatusReportData {
  type: 'CERTIFICATION_STATUS';
  byStatus: {
    active: number;
    expiringSoon: number;
    expired: number;
    revoked: number;
    suspended: number;
  };
  byCertification: Record<CertificationId, {
    certificationName: string;
    active: number;
    expiringSoon: number;
    expired: number;
  }>;
  expiringDetails: {
    userId: UserId;
    userName: string;
    certificationId: CertificationId;
    certificationName: string;
    expiresAt: IsoDateTime;
    daysUntilExpiry: number;
  }[];
  expiredDetails: {
    userId: UserId;
    userName: string;
    certificationId: CertificationId;
    certificationName: string;
    expiredAt: IsoDateTime;
    daysSinceExpiry: number;
    stillActive: boolean;
  }[];
}

export interface CeComplianceReportData {
  type: 'CE_COMPLIANCE';
  complianceYear: number;
  overallCompliance: {
    totalRequired: number;
    compliant: number;
    nonCompliant: number;
    complianceRate: Percentage;
  };
  byRole: Record<RoleId, {
    roleName: string;
    hoursRequired: number;
    compliant: number;
    nonCompliant: number;
    complianceRate: Percentage;
  }>;
  nonCompliantDetails: {
    userId: UserId;
    userName: string;
    roleId: RoleId;
    hoursRequired: number;
    hoursEarned: number;
    hoursShort: number;
    deadline: IsoDateTime;
  }[];
  creditsByCategory: Record<ModuleCategory, {
    totalEarned: number;
    byActivity: Record<string, number>;
  }>;
}

export interface IncidentCorrelationReportData {
  type: 'INCIDENT_CORRELATION';
  totalIncidents: number;
  incidentsByTrainingStatus: {
    fullyTrained: number;
    partiallyTrained: number;
    overdue: number;
    certificationLapsed: number;
  };
  incidentsByModule: Record<ModuleId, {
    moduleTitle: string;
    volunteersWithModule: number;
    incidentsWithModule: number;
    volunteersWithoutModule: number;
    incidentsWithoutModule: number;
    correlationStrength: 'NONE' | 'WEAK' | 'MODERATE' | 'STRONG';
  }>;
  volunteerDetails: {
    userId: UserId;
    incidentCount: number;
    trainingComplete: boolean;
    certificationsCurrent: boolean;
    overduePaths: TrainingPathId[];
    expiredCertifications: CertificationId[];
  }[];
  correlationAnalysis: string;
  recommendedActions: string[];
}

export interface AuditTrailReportData {
  type: 'AUDIT_TRAIL';
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByActor: Record<string, number>;
  events: {
    timestamp: IsoDateTime;
    eventType: string;
    actorType: 'USER' | 'SYSTEM';
    actorId: string;
    userId: UserId;
    entityType: string;
    entityId: string;
    details: Record<string, unknown>;
  }[];
  anomalies: {
    type: string;
    description: string;
    timestamp: IsoDateTime;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
}

export interface ProctoringReportData {
  type: 'PROCTORING';
  totalProctoredAssessments: number;
  outcomes: {
    valid: number;
    flagged: number;
    invalidated: number;
    pending: number;
  };
  flagReasons: Record<string, number>;
  byModule: Record<ModuleId, {
    moduleTitle: string;
    total: number;
    valid: number;
    flagged: number;
    invalidated: number;
    flagRate: Percentage;
  }>;
  flaggedDetails: {
    userId: UserId;
    assessmentId: AssessmentId;
    proctoringSessionId: ProctoringSessionId;
    flagReasons: string[];
    outcome: 'VALID' | 'FLAGGED' | 'INVALIDATED';
    reviewedBy?: UserId;
  }[];
}

export interface AccommodationReportData {
  type: 'ACCOMMODATION_USAGE';
  totalUsersWithAccommodations: number;
  byAccommodationType: Record<string, {
    count: number;
    percentage: Percentage;
  }>;
  usageStats: {
    extendedTimeUsed: number;
    accessibilityFeaturesUsed: number;
    alternativeFormatsUsed: number;
  };
  outcomeComparison: {
    withAccommodations: {
      averageScore: Percentage;
      passRate: Percentage;
      completionRate: Percentage;
    };
    withoutAccommodations: {
      averageScore: Percentage;
      passRate: Percentage;
      completionRate: Percentage;
    };
  };
}

export interface ContentReviewReportData {
  type: 'CONTENT_REVIEW';
  totalModules: number;
  reviewStatus: {
    upToDate: number;
    reviewDue: number;
    reviewOverdue: number;
  };
  byModule: {
    moduleId: ModuleId;
    moduleTitle: string;
    lastReviewedAt: IsoDateTime;
    nextReviewDue: IsoDateTime;
    reviewStatus: 'UP_TO_DATE' | 'DUE' | 'OVERDUE';
    openImprovementTickets: number;
    averageFeedbackScore: number;
  }[];
  pendingVersions: {
    entityType: string;
    entityId: string;
    entityTitle: string;
    status: ContentStatus;
    createdAt: IsoDateTime;
    daysPending: number;
    blockedBy?: string;
  }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 7: AUDIT EXPORT
// ══════════════════════════════════════════════════════════════════════════════

export interface AuditExportRequest {
  id: Brand<string, 'AuditExportRequestId'>;
  requestedBy: UserId;
  requestedAt: IsoDateTime;
  requestReason: 'REGULATORY_AUDIT' | 'LEGAL_DISCOVERY' | 'INTERNAL_INVESTIGATION' | 'COMPLIANCE_CHECK' | 'OTHER';
  requestDetails: string;
  scope: {
    userIds?: UserId[];
    moduleIds?: ModuleId[];
    certificationIds?: CertificationId[];
    dateRange: {
      start: IsoDateTime;
      end: IsoDateTime;
    };
    eventTypes?: string[];
  };
  includeAssessmentAnswers: boolean;
  includeProctoringRecordings: boolean;
  includeProctoringPhotos: boolean;
  includeAuditEvents: boolean;
  includePersonalData: boolean;
  requiresApproval: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'DENIED';
  approvedBy?: UserId;
  approvedAt?: IsoDateTime;
  approvalNotes?: string;
  denialReason?: string;
  generationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  generationStartedAt?: IsoDateTime;
  generationCompletedAt?: IsoDateTime;
  generationError?: string;
  exportUrl?: string;
  exportFormat: 'ZIP' | 'ENCRYPTED_ZIP';
  exportSizeBytes?: number;
  downloadCount: number;
  expiresAt: IsoDateTime;
  accessLog: {
    userId: UserId;
    accessedAt: IsoDateTime;
    action: 'VIEW' | 'DOWNLOAD';
    ipAddress: string;
  }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 8: TRAINING SANDBOX / SIMULATION
// ══════════════════════════════════════════════════════════════════════════════

export interface TrainingSandbox {
  id: Brand<string, 'SandboxId'>;
  traineeId: UserId;
  supervisorId: UserId;
  moduleId: ModuleId;
  pathId: TrainingPathId;
  title: string;
  description: string;
  startedAt: IsoDateTime;
  completedAt?: IsoDateTime;
  expiresAt: IsoDateTime;
  simulatedCases: SimulatedCase[];
  simulatedApplications: SimulatedApplication[];
  simulatedVolunteers?: SimulatedVolunteer[];
  actionsRecorded: SandboxAction[];
  scenariosCompleted: number;
  scenariosTotal: number;
  correctDecisions: number;
  incorrectDecisions: number;
  criticalErrors: number;
  overallScore?: Percentage;
  passedSimulation: boolean;
  supervisorFeedback?: string;
  areasForImprovement?: string[];
  readyForLiveWork: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
}

export interface SimulatedCase {
  id: string;
  sandboxId: Brand<string, 'SandboxId'>;
  template:
    | 'LOST_DOG_STANDARD'
    | 'LOST_CAT_INDOOR'
    | 'FOUND_DOG_FRIENDLY'
    | 'FOUND_CAT_FERAL'
    | 'FOUND_INJURED'
    | 'TRANSPORT_REQUEST'
    | 'OWNER_REUNION_SIMPLE'
    | 'OWNER_REUNION_DISPUTED'
    | 'FRAUDULENT_CLAIM'
    | 'AGGRESSIVE_FINDER'
    | 'URGENT_MEDICAL'
    | 'MULTIPLE_SIGHTINGS'
    | 'CROSS_JURISDICTION';
  difficulty: DifficultyLevel;
  caseData: Record<string, unknown>;
  objectivesTested: ObjectiveId[];
  expectedActions: string[];
  optionalActions: string[];
  criticalMistakes: string[];
  traineeActions: string[];
  actionSequence: {
    action: string;
    timestamp: IsoDateTime;
    wasCorrect: boolean;
    feedback?: string;
  }[];
  handledCorrectly: boolean;
  criticalMistakesMade: string[];
  missedActions: string[];
  score: Percentage;
  feedback: string;
  startedAt?: IsoDateTime;
  completedAt?: IsoDateTime;
  timeSpentMinutes?: Minutes;
}

export interface SimulatedApplication {
  id: string;
  sandboxId: Brand<string, 'SandboxId'>;
  template:
    | 'STANDARD_TRANSPORTER'
    | 'STANDARD_FOSTER'
    | 'STANDARD_TRAPPER'
    | 'RED_FLAG_INCOMPLETE'
    | 'RED_FLAG_REFERENCES'
    | 'RED_FLAG_BACKGROUND'
    | 'NEEDS_FOLLOWUP'
    | 'BORDERLINE_APPROVE'
    | 'BORDERLINE_REJECT';
  difficulty: DifficultyLevel;
  applicationData: Record<string, unknown>;
  expectedDecision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'ESCALATE';
  expectedReasons: string[];
  traineeDecision?: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'ESCALATE';
  traineeReasons?: string[];
  decisionCorrect: boolean;
  reasoningCorrect: boolean;
  feedback: string;
  startedAt?: IsoDateTime;
  completedAt?: IsoDateTime;
}

export interface SimulatedVolunteer {
  id: string;
  sandboxId: Brand<string, 'SandboxId'>;
  name: string;
  roleId: RoleId;
  experienceLevel: 'NEW' | 'EXPERIENCED' | 'VETERAN';
  traits: {
    reliability: 'LOW' | 'MEDIUM' | 'HIGH';
    communication: 'POOR' | 'AVERAGE' | 'EXCELLENT';
    skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    availability: 'LIMITED' | 'MODERATE' | 'FLEXIBLE';
  };
  currentLocation?: string;
  serviceArea?: string[];
  capabilities?: string[];
}

export interface SandboxAction {
  id: string;
  sandboxId: Brand<string, 'SandboxId'>;
  actionType: string;
  targetType: 'CASE' | 'APPLICATION' | 'VOLUNTEER' | 'SYSTEM';
  targetId: string;
  timestamp: IsoDateTime;
  actionDetails: Record<string, unknown>;
  wasCorrect: boolean;
  optimalAction?: string;
  feedback?: string;
  impactLevel: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
  pointsEarned: Points;
  pointsPossible: Points;
}
