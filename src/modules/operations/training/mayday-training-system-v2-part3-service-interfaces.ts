/**
 * Mayday TRAINING SYSTEM V2 — Part 3: Service Interfaces
 *
 * Service layer implementation incorporating:
 * - ChatGPT's bug fixes (time math, progress calculation, phase advancement)
 * - Proper assessment question population
 * - Matching question grading
 * - Audit patterns
 * - Accessibility and analytics services
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
  TrainingPhaseId,
  AssessmentId,
  ObjectiveId,
  IsoDateTime,
  Minutes,
  Hours,
  Percentage,
  Points,
  Brand,
  ModuleCategory,
  DifficultyLevel,
  LessonStatus,
  TrainingModule,
  TrainingPath,
  TrainingPhase,
  Lesson,
  AssessmentAuthoring,
  AssessmentDelivery,
  QuizQuestionAuthoring,
  QuizQuestionDelivery,
  KnowledgeCheckAuthoring,
  KnowledgeCheckDelivery,
  QuestionBank,
  Certification,
  UserTrainingProfile,
  AssignedPath,
  AssignedModule,
  LessonProgress,
  CompletedModule,
  CompletedAssessment,
  AssessmentAnswer,
  UserCertification,
  CeCredit,
  AssessmentSession,
  ProctoringSession,
  AssessmentRecoveryPolicy,
  MentorAssignment,
  ShadowSession,
  MentorProfile,
  VideoProgress,
  VideoCompletionPolicy,
  PracticalAssessment,
  PracticalSubmission,
  CompetencyDecayPolicy,
  UserCompetencyStatus,
  TransferCreditPolicy,
  TransferCreditApplication,
  EmergencyTrainingMode,
  EmergencyTrainingPath,
  EmergencyVolunteerStatus,
  TrainingAuditEvent,
  TrainingAuditEventType,
  TrainingActor,
  CorrelationId,
  UserAccommodations,
  OfflinePackage,
  UserOfflineState,
  MobileProgressResume,
  QuestionAnalytics,
  AssessmentGeneration,
  RemediationPolicy,
} from './Mayday-training-system-v2-part1-types';

import type {
  TrainingAnalyticsDashboard,
  LearnerAnalytics,
  TrainingRecommendation,
  ModuleFeedback,
  ContentImprovementTicket,
  FeedbackSummary,
  LiveTrainingSession,
  LiveSessionAttendance,
  ContentVersion,
  ReviewWorkflow,
  ComplianceReport,
  AuditExportRequest,
  TrainingSandbox,
  SimulatedCase,
  SandboxAction,
} from './Mayday-training-system-v2-part2-analytics';

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1: UTILITY FUNCTIONS (Time math)
// ══════════════════════════════════════════════════════════════════════════════

export function now(): IsoDateTime {
  return new Date().toISOString() as IsoDateTime;
}

export function minutesBetween(start: IsoDateTime, end: IsoDateTime): Minutes {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  return Math.max(0, Math.round((e - s) / (1000 * 60)));
}

export function daysBetween(start: IsoDateTime, end: IsoDateTime): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

export function addDays(date: IsoDateTime, days: number): IsoDateTime {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString() as IsoDateTime;
}

export function addHours(date: IsoDateTime, hours: number): IsoDateTime {
  const d = new Date(date);
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d.toISOString() as IsoDateTime;
}

export function generateId<T extends string>(): Brand<string, T> {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }) as Brand<string, T>;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2: GRADING ENGINE
// ══════════════════════════════════════════════════════════════════════════════

export interface GradingResult {
  questionId: QuestionId;
  isCorrect: boolean;
  pointsEarned: Points;
  pointsPossible: Points;
  feedback?: string;
}

export interface AssessmentGradingResult {
  assessmentId: AssessmentId;
  totalPoints: Points;
  earnedPoints: Points;
  score: Percentage;
  passed: boolean;
  questionResults: GradingResult[];
  feedback: string[];
  gradedAt: IsoDateTime;
}

export function checkAnswer(
  question: QuizQuestionAuthoring,
  submittedAnswer: string | string[] | { left: string; right: string }[]
): boolean {
  switch (question.type) {
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE': {
      const correct = question.options?.find((o) => o.isCorrect)?.id;
      return String(submittedAnswer) === correct;
    }

    case 'MULTIPLE_SELECT': {
      if (!Array.isArray(submittedAnswer)) return false;
      const submitted = new Set(submittedAnswer.map(String));
      const correct = new Set(
        question.options?.filter((o) => o.isCorrect).map((o) => o.id) ?? []
      );
      if (submitted.size !== correct.size) return false;
      for (const id of Array.from(submitted)) {
        if (!correct.has(id)) return false;
      }
      return true;
    }

    case 'SHORT_ANSWER': {
      const answer = String(submittedAnswer).toLowerCase().trim();

      if (question.correctAnswer) {
        if (Array.isArray(question.correctAnswer)) {
          return question.correctAnswer.some(
            (a) => a.toLowerCase().trim() === answer
          );
        }
        return question.correctAnswer.toLowerCase().trim() === answer;
      }

      if (question.shortAnswerRubric?.keywords) {
        return question.shortAnswerRubric.keywords.some((k) =>
          answer.includes(k.toLowerCase())
        );
      }

      return false;
    }

    case 'ORDERING': {
      if (!Array.isArray(submittedAnswer) || !question.correctOrder) return false;
      if (submittedAnswer.length !== question.correctOrder.length) return false;
      return submittedAnswer.every(
        (item, index) => String(item) === question.correctOrder![index]
      );
    }

    case 'MATCHING': {
      if (!Array.isArray(submittedAnswer) || !Array.isArray(question.matchingPairs)) {
        return false;
      }

      const submitted = new Map<string, string>();
      for (const pair of submittedAnswer as { left: string; right: string }[]) {
        if (!pair?.left || !pair?.right) return false;
        submitted.set(String(pair.left), String(pair.right));
      }

      for (const pair of question.matchingPairs) {
        if (submitted.get(pair.left) !== pair.right) return false;
      }

      if (submitted.size !== question.matchingPairs.length) return false;

      return true;
    }

    case 'SCENARIO_BASED': {
      const correct = question.options?.find((o) => o.isCorrect)?.id;
      return String(submittedAnswer) === correct;
    }

    case 'HOTSPOT':
    case 'DRAG_DROP': {
      if (question.correctAnswer) {
        const submitted = JSON.stringify(submittedAnswer);
        const correct = JSON.stringify(question.correctAnswer);
        return submitted === correct;
      }
      return false;
    }

    default:
      return false;
  }
}

export function gradeAssessment(
  assessment: AssessmentAuthoring,
  submission: { questionId: QuestionId; answer: string | string[] }[],
  attemptNumber: number
): AssessmentGradingResult {
  const questionResults: GradingResult[] = [];
  let earnedPoints: Points = 0;
  const feedback: string[] = [];

  const questionMap = new Map<string, QuizQuestionAuthoring>();
  for (const q of assessment.questions) {
    questionMap.set(q.id, q);
  }

  for (const sub of submission) {
    const question = questionMap.get(sub.questionId);
    if (!question) {
      questionResults.push({
        questionId: sub.questionId,
        isCorrect: false,
        pointsEarned: 0,
        pointsPossible: 0,
        feedback: 'Question not found',
      });
      continue;
    }

    const isCorrect = checkAnswer(question, sub.answer);
    const pointsEarnedForQuestion = isCorrect ? question.points : 0;

    questionResults.push({
      questionId: sub.questionId,
      isCorrect,
      pointsEarned: pointsEarnedForQuestion,
      pointsPossible: question.points,
      feedback: isCorrect ? undefined : question.explanation,
    });

    earnedPoints += pointsEarnedForQuestion;

    if (!isCorrect && question.explanation) {
      feedback.push(question.explanation);
    }
  }

  for (const q of assessment.questions) {
    if (!submission.find((s) => s.questionId === q.id)) {
      questionResults.push({
        questionId: q.id,
        isCorrect: false,
        pointsEarned: 0,
        pointsPossible: q.points,
        feedback: 'Question not answered',
      });
    }
  }

  const score =
    assessment.totalPoints > 0
      ? (Math.round((earnedPoints / assessment.totalPoints) * 100) as Percentage)
      : (0 as Percentage);

  const passed = earnedPoints >= assessment.passingPoints;

  return {
    assessmentId: assessment.id,
    totalPoints: assessment.totalPoints,
    earnedPoints,
    score,
    passed,
    questionResults,
    feedback,
    gradedAt: now(),
  };
}

export function buildFinalAssessmentQuestions(module: TrainingModule): QuizQuestionAuthoring[] {
  const questions: QuizQuestionAuthoring[] = [];
  for (const lesson of module.lessons) {
    if (lesson.knowledgeCheck?.questions?.length) {
      questions.push(...lesson.knowledgeCheck.questions);
    }
  }
  return questions;
}

export function finalizeAssessment(
  assessment: AssessmentAuthoring,
  module: TrainingModule
): AssessmentAuthoring {
  const questions = buildFinalAssessmentQuestions(module);
  if (questions.length === 0) {
    throw new Error(`Assessment ${assessment.id} has no questions (module=${module.id})`);
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const passingPoints = Math.ceil(
    (totalPoints * assessment.passingPoints) / assessment.totalPoints
  );

  return {
    ...assessment,
    questions,
    totalPoints,
    passingPoints,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3: QUESTION DELIVERY (Strip Answers for Clients)
// ══════════════════════════════════════════════════════════════════════════════

export function toDeliveryQuestion(question: QuizQuestionAuthoring): QuizQuestionDelivery {
  const delivery: QuizQuestionDelivery = {
    id: question.id,
    type: question.type,
    question: question.question,
    context: question.context,
    imageUrl: question.imageUrl,
    points: question.points,
    objectiveId: question.objectiveId,
    tags: question.tags,
    difficulty: question.difficulty,
    altText: question.altText,
    screenReaderInstructions: question.screenReaderInstructions,
  };

  if (question.options) {
    delivery.options = question.options.map((o) => ({
      id: o.id,
      text: o.text,
      imageUrl: o.imageUrl,
    }));
  }

  if (question.matchingPairs) {
    delivery.matchingLeftItems = question.matchingPairs.map((p) => p.left);
    delivery.matchingRightItems = [...question.matchingPairs.map((p) => p.right)].sort(
      () => Math.random() - 0.5
    );
  }

  if (question.correctOrder) {
    delivery.itemsToOrder = [...question.correctOrder].sort(() => Math.random() - 0.5);
  }

  return delivery;
}

export function toDeliveryAssessment(assessment: AssessmentAuthoring): AssessmentDelivery {
  let questions = assessment.questions.map(toDeliveryQuestion);

  if (assessment.shuffleQuestions) {
    questions = [...questions].sort(() => Math.random() - 0.5);
  }

  if (assessment.shuffleOptions) {
    questions = questions.map((q) => {
      if (q.options) {
        return {
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5),
        };
      }
      return q;
    });
  }

  return {
    ...assessment,
    questions,
  };
}

export function toDeliveryKnowledgeCheck(check: KnowledgeCheckAuthoring): KnowledgeCheckDelivery {
  return {
    ...check,
    questions: check.questions.map(toDeliveryQuestion),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4: TRAINING SERVICE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════

export interface ITrainingService {
  createUserTrainingProfile(userId: UserId): Promise<UserTrainingProfile>;
  getUserTrainingProfile(userId: UserId): Promise<UserTrainingProfile | null>;

  assignTrainingPath(
    userId: UserId,
    pathId: TrainingPathId,
    assignedBy: UserId | 'SYSTEM',
    deadlineOverrideDays?: number
  ): Promise<UserTrainingProfile>;

  isPathComplete(userId: UserId, pathId: TrainingPathId): Promise<boolean>;

  assignModule(
    profile: UserTrainingProfile,
    moduleId: ModuleId,
    pathId: TrainingPathId | undefined,
    assignedBy: UserId | 'SYSTEM',
    deadlineDays: number
  ): UserTrainingProfile;

  startLesson(profile: UserTrainingProfile, moduleId: ModuleId, lessonId: LessonId): UserTrainingProfile;

  completeLesson(
    profile: UserTrainingProfile,
    moduleId: ModuleId,
    lessonId: LessonId,
    timeSpentMinutes: Minutes,
    knowledgeCheckScore: Percentage | undefined,
    moduleDef: TrainingModule
  ): UserTrainingProfile;

  startAssessment(
    userId: UserId,
    assessmentId: AssessmentId,
    moduleId: ModuleId
  ): Promise<AssessmentSession>;

  getAssessmentForDelivery(assessmentId: AssessmentId, userId: UserId): Promise<AssessmentDelivery>;

  submitAssessment(
    sessionId: Brand<string, 'AssessmentSessionId'>,
    submission: { questionId: QuestionId; answer: string | string[] }[]
  ): Promise<AssessmentGradingResult>;

  recordAssessmentResult(
    profile: UserTrainingProfile,
    result: AssessmentGradingResult,
    timeSpentMinutes: Minutes
  ): UserTrainingProfile;

  completeModule(
    profile: UserTrainingProfile,
    moduleId: ModuleId,
    moduleCode: string,
    moduleTitle: string,
    assessmentScore: Percentage,
    timeSpentMinutes: Minutes,
    module: TrainingModule
  ): UserTrainingProfile;

  issueCertification(
    profile: UserTrainingProfile,
    certificationId: CertificationId,
    certification: Certification
  ): UserTrainingProfile;

  checkCertificationStatus(profile: UserTrainingProfile): UserTrainingProfile;

  renewCertification(profile: UserTrainingProfile, certificationId: CertificationId, renewalMonths: number): UserTrainingProfile;

  getCeCreditsForYear(profile: UserTrainingProfile, year: number): number;

  checkCeCompliance(
    profile: UserTrainingProfile,
    path: TrainingPath,
    year: number
  ): { compliant: boolean; hoursEarned: number; hoursRequired: number };

  addExternalCeCredit(
    profile: UserTrainingProfile,
    activityName: string,
    credits: number,
    category: ModuleCategory,
    documentUrl?: string
  ): UserTrainingProfile;

  generateProgressReport(
    profile: UserTrainingProfile,
    paths: TrainingPath[],
    modulesById: Record<string, TrainingModule>
  ): TrainingProgressReport;

  getDeadlineAlerts(
    profile: UserTrainingProfile,
    paths: TrainingPath[],
    warningDays?: number
  ): DeadlineAlert[];
}

export interface TrainingProgressReport {
  userId: UserId;
  generatedAt: IsoDateTime;

  paths: {
    pathId: TrainingPathId;
    pathName: string;
    status: string;
    progress: Percentage;
    currentPhase: number;
    totalPhases: number;
    dueDate: IsoDateTime;
    isOverdue: boolean;
  }[];

  modules: {
    moduleId: ModuleId;
    moduleTitle: string;
    status: string;
    progress: Percentage;
    dueDate: IsoDateTime;
    assessmentScore?: Percentage;
  }[];

  certifications: {
    certificationId: CertificationId;
    name: string;
    status: string;
    issuedAt?: IsoDateTime;
    expiresAt?: IsoDateTime;
    daysUntilExpiry?: number;
  }[];

  ceCompliance: {
    year: number;
    hoursRequired: number;
    hoursEarned: number;
    hoursRemaining: number;
    compliant: boolean;
    deadline: IsoDateTime;
  };

  summary: {
    totalAssignedModules: number;
    completedModules: number;
    inProgressModules: number;
    overdueModules: number;
    totalTrainingHours: number;
    averageAssessmentScore: Percentage;
  };
}

export interface DeadlineAlert {
  alertType: 'MODULE_DUE' | 'PATH_DUE' | 'CERT_EXPIRING' | 'CE_DEADLINE' | 'REFRESHER_DUE';
  entityId: string;
  entityName: string;
  dueDate: IsoDateTime;
  daysRemaining: number;
  severity: 'INFO' | 'WARNING' | 'URGENT' | 'OVERDUE';
  actionRequired: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5: TRAINING SERVICE IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════

export class TrainingService implements ITrainingService {
  private profiles: Map<string, UserTrainingProfile> = new Map();
  private modules: Map<string, TrainingModule> = new Map();
  private paths: Map<string, TrainingPath> = new Map();
  private certifications: Map<string, Certification> = new Map();
  private assessments: Map<string, AssessmentAuthoring> = new Map();
  private sessions: Map<string, AssessmentSession> = new Map();

  constructor(modules: TrainingModule[], paths: TrainingPath[], certifications: Certification[]) {
    modules.forEach((m) => this.modules.set(m.id, m));
    paths.forEach((p) => this.paths.set(p.id, p));
    certifications.forEach((c) => this.certifications.set(c.id, c));

    modules.forEach((m) => {
      if (m.finalAssessment) {
        this.assessments.set(m.finalAssessment.id, m.finalAssessment);
      }
    });
  }

  async createUserTrainingProfile(userId: UserId): Promise<UserTrainingProfile> {
    const existing = this.profiles.get(userId);
    if (existing) return existing;

    const profile: UserTrainingProfile = {
      userId,
      assignedPaths: [],
      assignedModules: [],
      completedModules: [],
      completedAssessments: [],
      completedPracticals: [],
      certifications: [],
      ceCreditsEarned: [],
      currentCeYear: new Date().getFullYear(),
      mentorAssignments: [],
      totalTrainingHours: 0,
      averageAssessmentScore: 0 as Percentage,
      createdAt: now(),
      lastActivityAt: now(),
      auditEvents: [],
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  async getUserTrainingProfile(userId: UserId): Promise<UserTrainingProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async assignTrainingPath(
    userId: UserId,
    pathId: TrainingPathId,
    assignedBy: UserId | 'SYSTEM',
    deadlineOverrideDays?: number
  ): Promise<UserTrainingProfile> {
    let profile = await this.getUserTrainingProfile(userId);
    if (!profile) {
      profile = await this.createUserTrainingProfile(userId);
    }

    const path = this.paths.get(pathId);
    if (!path) {
      throw new Error(`Training path ${pathId} not found`);
    }

    if (profile.assignedPaths.some((p) => p.pathId === pathId)) {
      return profile;
    }

    const deadlineDays = deadlineOverrideDays ?? path.maximumCompletionDays;
    const dueDate = addDays(now(), deadlineDays);

    const assignedPath: AssignedPath = {
      pathId,
      assignedAt: now(),
      assignedBy,
      dueDate,
      status: 'NOT_STARTED',
      currentPhaseIndex: 0,
      progressPercent: 0 as Percentage,
    };

    const firstPhase = path.phases[0];
    if (firstPhase) {
      for (const moduleId of firstPhase.modules) {
        profile = this.assignModule(profile, moduleId, pathId, assignedBy, deadlineDays);
      }
    }

    const auditEvent: TrainingAuditEvent = {
      id: generateId(),
      type: 'PATH_ASSIGNED',
      actor: assignedBy,
      occurredAt: now(),
      userId,
      pathId,
      details: {
        pathName: path.name,
        dueDate,
        modulesAssigned: firstPhase?.modules.length ?? 0,
      },
    };

    profile = {
      ...profile,
      assignedPaths: [...profile.assignedPaths, assignedPath],
      auditEvents: [...profile.auditEvents, auditEvent],
      lastActivityAt: now(),
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  async isPathComplete(userId: UserId, pathId: TrainingPathId): Promise<boolean> {
    const profile = await this.getUserTrainingProfile(userId);
    if (!profile) return false;

    const path = this.paths.get(pathId);
    if (!path) return false;

    for (const moduleId of path.requiredModules) {
      if (!profile.completedModules.some((m) => m.moduleId === moduleId)) {
        return false;
      }
    }

    return true;
  }

  assignModule(
    profile: UserTrainingProfile,
    moduleId: ModuleId,
    pathId: TrainingPathId | undefined,
    assignedBy: UserId | 'SYSTEM',
    deadlineDays: number
  ): UserTrainingProfile {
    if (profile.assignedModules.some((m) => m.moduleId === moduleId)) {
      return profile;
    }

    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const moduleDeadlineDays = module.completionDeadlineDays ?? deadlineDays;
    const effectiveDeadlineDays = Math.min(deadlineDays, moduleDeadlineDays);
    const dueDate = addDays(now(), effectiveDeadlineDays);

    const lessonProgress: LessonProgress[] = module.lessons.map((lesson) => ({
      lessonId: lesson.id,
      status: 'NOT_STARTED' as LessonStatus,
      timeSpentMinutes: 0,
      knowledgeCheckAttempts: 0,
      contentProgress: lesson.content.map((c) => ({
        contentItemId: c.id,
        completed: false,
        progressPercent: 0 as Percentage,
      })),
    }));

    const assignedModule: AssignedModule = {
      moduleId,
      pathId,
      assignedAt: now(),
      assignedBy,
      dueDate,
      status: 'NOT_STARTED',
      progressPercent: 0 as Percentage,
      currentLessonIndex: 0,
      lessonProgress,
      timeSpentMinutes: 0,
      assessmentAttempts: 0,
    };

    const auditEvent: TrainingAuditEvent = {
      id: generateId(),
      type: 'MODULE_ASSIGNED',
      actor: assignedBy,
      occurredAt: now(),
      userId: profile.userId,
      moduleId,
      pathId,
      details: {
        moduleCode: module.code,
        moduleTitle: module.title,
        dueDate,
      },
    };

    return {
      ...profile,
      assignedModules: [...profile.assignedModules, assignedModule],
      auditEvents: [...profile.auditEvents, auditEvent],
      lastActivityAt: now(),
    };
  }

  startLesson(profile: UserTrainingProfile, moduleId: ModuleId, lessonId: LessonId): UserTrainingProfile {
    const moduleIndex = profile.assignedModules.findIndex((m) => m.moduleId === moduleId);
    if (moduleIndex === -1) {
      throw new Error(`Module ${moduleId} not assigned to user`);
    }

    const assigned = profile.assignedModules[moduleIndex];
    const lessonIndex = assigned.lessonProgress.findIndex((l) => l.lessonId === lessonId);
    if (lessonIndex === -1) {
      throw new Error(`Lesson ${lessonId} not found in module`);
    }

    const lesson = assigned.lessonProgress[lessonIndex];
    if (lesson.status !== 'NOT_STARTED') {
      return profile;
    }

    const updatedLessonProgress = [...assigned.lessonProgress];
    updatedLessonProgress[lessonIndex] = {
      ...lesson,
      status: 'IN_PROGRESS',
      startedAt: now(),
    };

    const updatedModule: AssignedModule = {
      ...assigned,
      lessonProgress: updatedLessonProgress,
      status: 'IN_PROGRESS',
      startedAt: assigned.startedAt ?? now(),
    };

    const updatedModules = [...profile.assignedModules];
    updatedModules[moduleIndex] = updatedModule;

    const auditEvent: TrainingAuditEvent = {
      id: generateId(),
      type: 'LESSON_STARTED',
      actor: profile.userId,
      occurredAt: now(),
      userId: profile.userId,
      moduleId,
      lessonId,
      details: {},
    };

    return {
      ...profile,
      assignedModules: updatedModules,
      auditEvents: [...profile.auditEvents, auditEvent],
      lastActivityAt: now(),
    };
  }

  completeLesson(
    profile: UserTrainingProfile,
    moduleId: ModuleId,
    lessonId: LessonId,
    timeSpentMinutes: Minutes,
    knowledgeCheckScore: Percentage | undefined,
    moduleDef: TrainingModule
  ): UserTrainingProfile {
    const moduleIndex = profile.assignedModules.findIndex((m) => m.moduleId === moduleId);
    if (moduleIndex === -1) {
      throw new Error(`Module ${moduleId} not assigned to user`);
    }

    const assigned = profile.assignedModules[moduleIndex];

    const updatedLessonProgress = assigned.lessonProgress.map((l) => {
      if (l.lessonId !== lessonId) return l;
      return {
        ...l,
        status: 'COMPLETED' as LessonStatus,
        completedAt: now(),
        timeSpentMinutes: (l.timeSpentMinutes || 0) + timeSpentMinutes,
        knowledgeCheckPointsEarned: knowledgeCheckScore,
        knowledgeCheckAttempts:
          knowledgeCheckScore !== undefined
            ? (l.knowledgeCheckAttempts || 0) + 1
            : l.knowledgeCheckAttempts || 0,
        knowledgeCheckPassed:
          knowledgeCheckScore !== undefined ? knowledgeCheckScore >= 70 : l.knowledgeCheckPassed,
      };
    });

    const totalLessons = moduleDef.lessons.length;
    const completedCount = updatedLessonProgress.filter((l) => l.status === 'COMPLETED').length;
    const progress =
      totalLessons > 0
        ? (Math.round((completedCount / totalLessons) * 100) as Percentage)
        : (0 as Percentage);

    const currentLessonIdx = moduleDef.lessons.findIndex((l) => l.id === lessonId);
    const nextLessonIndex = Math.min(currentLessonIdx + 1, totalLessons - 1);

    const updatedModule: AssignedModule = {
      ...assigned,
      lessonProgress: updatedLessonProgress,
      progressPercent: progress,
      timeSpentMinutes: assigned.timeSpentMinutes + timeSpentMinutes,
      currentLessonIndex: nextLessonIndex,
    };

    const updatedModules = [...profile.assignedModules];
    updatedModules[moduleIndex] = updatedModule;

    const totalMinutes = updatedModules.reduce((sum, m) => sum + m.timeSpentMinutes, 0);

    const auditEvent: TrainingAuditEvent = {
      id: generateId(),
      type: 'LESSON_COMPLETED',
      actor: profile.userId,
      occurredAt: now(),
      userId: profile.userId,
      moduleId,
      lessonId,
      details: {
        timeSpentMinutes,
        knowledgeCheckScore,
        moduleProgress: progress,
      },
    };

    return {
      ...profile,
      assignedModules: updatedModules,
      totalTrainingHours: totalMinutes / 60,
      auditEvents: [...profile.auditEvents, auditEvent],
      lastActivityAt: now(),
    };
  }

  async startAssessment(userId: UserId, assessmentId: AssessmentId, moduleId: ModuleId): Promise<AssessmentSession> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const profile = await this.getUserTrainingProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const previousAttempts = profile.completedAssessments.filter((a) => a.assessmentId === assessmentId).length;

    if (!assessment.allowRetake && previousAttempts > 0) {
      throw new Error('Assessment does not allow retakes');
    }

    if (previousAttempts >= assessment.maxAttempts) {
      throw new Error('Maximum attempts reached');
    }

    const session: AssessmentSession = {
      id: generateId(),
      userId,
      assessmentId,
      attemptNumber: previousAttempts + 1,
      status: 'ACTIVE',
      startedAt: now(),
      lastActivityAt: now(),
      totalTimeElapsedSeconds: 0,
      timeLimitSeconds: assessment.timeLimitMinutes ? assessment.timeLimitMinutes * 60 : null,
      savedAnswers: [],
      questionsViewed: [],
      questionsAnswered: [],
      currentQuestionIndex: 0,
      navigationLog: [],
      flaggedQuestions: [],
      recoveryAttempts: [],
      deviceFingerprint: '',
      ipAddress: '',
      userAgent: '',
      suspiciousActivityFlags: [],
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async getAssessmentForDelivery(assessmentId: AssessmentId, userId: UserId): Promise<AssessmentDelivery> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const profile = await this.getUserTrainingProfile(userId);
    let deliveryAssessment = toDeliveryAssessment(assessment);

    if (profile?.accommodations?.extendedTimeMultiplier) {
      const originalTime = deliveryAssessment.timeLimitMinutes;
      if (originalTime) {
        deliveryAssessment = {
          ...deliveryAssessment,
          timeLimitMinutes: Math.round(originalTime * profile.accommodations.extendedTimeMultiplier) as Minutes,
        };
      }
    }

    return deliveryAssessment;
  }

  async submitAssessment(
    sessionId: Brand<string, 'AssessmentSessionId'>,
    submission: { questionId: QuestionId; answer: string | string[] }[]
  ): Promise<AssessmentGradingResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== 'ACTIVE') {
      throw new Error(`Session is not active (status: ${session.status})`);
    }

    const assessment = this.assessments.get(session.assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const result = gradeAssessment(assessment, submission, session.attemptNumber);

    session.status = 'SUBMITTED';
    session.submittedAt = now();
    this.sessions.set(sessionId, session);

    return result;
  }

  recordAssessmentResult(profile: UserTrainingProfile, result: AssessmentGradingResult, timeSpentMinutes: Minutes): UserTrainingProfile {
    const module = Array.from(this.modules.values()).find((m) => m.finalAssessment?.id === result.assessmentId);
    if (!module) {
      throw new Error(`Module for assessment ${result.assessmentId} not found`);
    }

    const previousAttempts = profile.completedAssessments.filter((a) => a.assessmentId === result.assessmentId).length;

    const completedAssessment: CompletedAssessment = {
      assessmentId: result.assessmentId,
      moduleId: module.id,
      attemptNumber: previousAttempts + 1,
      startedAt: addHours(now(), -(timeSpentMinutes / 60)),
      completedAt: now(),
      pointsEarned: result.earnedPoints,
      totalPoints: result.totalPoints,
      score: result.score,
      passed: result.passed,
      answers: result.questionResults.map((r) => ({
        questionId: r.questionId,
        answer: '',
        isCorrect: r.isCorrect,
        pointsEarned: r.pointsEarned,
        pointsPossible: r.pointsPossible,
        timeSpentSeconds: 0,
      })),
      timeSpentMinutes,
    };

    const moduleIndex = profile.assignedModules.findIndex((m) => m.moduleId === module.id);
    const updatedModules = [...profile.assignedModules];

    if (moduleIndex !== -1) {
      const assigned = profile.assignedModules[moduleIndex];
      updatedModules[moduleIndex] = {
        ...assigned,
        assessmentAttempts: previousAttempts + 1,
        lastAssessmentScore: result.score,
        status:
          result.passed
            ? 'COMPLETED'
            : previousAttempts + 1 >= (module.finalAssessment?.maxAttempts ?? 3)
            ? 'FAILED'
            : 'IN_PROGRESS',
      };
    }

    const allScores = [...profile.completedAssessments.map((a) => a.score), result.score];
    const averageScore =
      allScores.length > 0
        ? (Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) as Percentage)
        : (0 as Percentage);

    const auditEvent: TrainingAuditEvent = {
      id: generateId(),
      type: result.passed ? 'ASSESSMENT_PASSED' : 'ASSESSMENT_FAILED',
      actor: profile.userId,
      occurredAt: now(),
      userId: profile.userId,
      moduleId: module.id,
      assessmentId: result.assessmentId,
      details: {
        score: result.score,
        passed: result.passed,
        attemptNumber: previousAttempts + 1,
      },
    };

    let updatedProfile: UserTrainingProfile = {
      ...profile,
      assignedModules: updatedModules,
      completedAssessments: [...profile.completedAssessments, completedAssessment],
      averageAssessmentScore: averageScore,
      auditEvents: [...profile.auditEvents, auditEvent],
      lastActivityAt: now(),
    };

    if (result.passed) {
      updatedProfile = this.completeModule(
        updatedProfile,
        module.id,
        module.code,
        module.title,
        result.score,
        profile.assignedModules.find((m) => m.moduleId === module.id)?.timeSpentMinutes ?? 0,
        module
      );
    }

    return updatedProfile;
  }

  completeModule(
    profile: UserTrainingProfile,
    moduleId: ModuleId,
    moduleCode: string,
    moduleTitle: string,
    assessmentScore: Percentage,
    timeSpentMinutes: Minutes,
    module: TrainingModule
  ): UserTrainingProfile {
    if (profile.completedModules.some((m) => m.moduleId === moduleId)) {
      return profile;
    }

    const completedModule: CompletedModule = {
      moduleId,
      moduleCode,
      moduleTitle,
      moduleVersion: module.version,
      completedAt: now(),
      assessmentPointsEarned: Math.round((assessmentScore / 100) * (module.finalAssessment?.totalPoints ?? 100)) as Points,
      assessmentTotalPoints: module.finalAssessment?.totalPoints ?? 100,
      assessmentScore,
      timeSpentMinutes,
      certificateIssued: false,
    };

    let ceCreditsEarned = [...profile.ceCreditsEarned];
    if (module.ceCredits > 0) {
      ceCreditsEarned.push({
        id: generateId(),
        moduleId,
        activityType: 'MODULE',
        activityName: moduleTitle,
        credits: module.ceCredits,
        category: module.ceCategory ?? module.category,
        earnedAt: now(),
        year: new Date().getFullYear(),
      });
    }

    const updatedAssignedModules = profile.assignedModules.filter((m) => m.moduleId !== moduleId);

    const auditEvent: TrainingAuditEvent = {
      id: generateId(),
      type: 'MODULE_COMPLETED',
      actor: profile.userId,
      occurredAt: now(),
      userId: profile.userId,
      moduleId,
      details: {
        moduleCode,
        moduleTitle,
        assessmentScore,
        ceCredits: module.ceCredits,
      },
    };

    let updatedProfile: UserTrainingProfile = {
      ...profile,
      assignedModules: updatedAssignedModules,
      completedModules: [...profile.completedModules, completedModule],
      ceCreditsEarned,
      auditEvents: [...profile.auditEvents, auditEvent],
      lastActivityAt: now(),
    };

    updatedProfile = this.checkAndAdvancePathPhase(updatedProfile);

    if (module.grantsCertification && module.certificationId) {
      const cert = this.certifications.get(module.certificationId);
      if (cert) {
        updatedProfile = this.issueCertification(updatedProfile, module.certificationId, cert);
      }
    }

    return updatedProfile;
  }

  private checkAndAdvancePathPhase(profile: UserTrainingProfile): UserTrainingProfile {
    let updated: UserTrainingProfile = { ...profile };

    updated.assignedPaths = updated.assignedPaths.map((ap) => {
      const path = this.paths.get(ap.pathId);
      if (!path) return ap;

      const phaseIndex = ap.currentPhaseIndex;
      const currentPhase = path.phases[phaseIndex];
      if (!currentPhase) return ap;

      const phaseComplete = currentPhase.modules.every((mid) =>
        updated.completedModules.some((cm) => cm.moduleId === mid)
      );

      if (!phaseComplete) return ap;

      if (ap.currentPhaseIndex >= path.phases.length - 1) {
        const auditEvent: TrainingAuditEvent = {
          id: generateId(),
          type: 'PATH_COMPLETED',
          actor: 'SYSTEM',
          occurredAt: now(),
          userId: profile.userId,
          pathId: ap.pathId,
          details: {
            pathName: path.name,
          },
        };
        updated.auditEvents = [...updated.auditEvents, auditEvent];

        return {
          ...ap,
          status: 'COMPLETED',
          progressPercent: 100 as Percentage,
        };
      }

      const nextPhaseIndex = ap.currentPhaseIndex + 1;
      const nextPhase = path.phases[nextPhaseIndex];

      if (nextPhase) {
        for (const moduleId of nextPhase.modules) {
          if (!updated.assignedModules.some((m) => m.moduleId === moduleId)) {
            updated = this.assignModule(updated, moduleId, ap.pathId, 'SYSTEM', path.maximumCompletionDays);
          }
        }
      }

      const auditEvent: TrainingAuditEvent = {
        id: generateId(),
        type: 'PATH_PHASE_COMPLETED',
        actor: 'SYSTEM',
        occurredAt: now(),
        userId: profile.userId,
        pathId: ap.pathId,
        details: {
          completedPhase: phaseIndex + 1,
          nextPhase: nextPhaseIndex + 1,
          phaseName: currentPhase.name,
        },
      };
      updated.auditEvents = [...updated.auditEvents, auditEvent];

      return {
        ...ap,
        currentPhaseIndex: nextPhaseIndex,
        progressPercent: Math.round(((nextPhaseIndex + 1) / path.phases.length) * 100) as Percentage,
        status: 'IN_PROGRESS',
      };
    });

    return updated;
  }

  issueCertification(profile: UserTrainingProfile, certificationId: CertificationId, certification: Certification): UserTrainingProfile {
    if (profile.certifications.some((c) => c.certificationId === certificationId && c.status === 'ACTIVE')) {
      return profile;
    }

    const issuedAt = now();
    const expiresAt = addDays(issuedAt, certification.validityMonths * 30);

    const userCert: UserCertification = {
      certificationId,
      userId: profile.userId,
      code: certification.code,
      name: certification.name,
      issuedAt,
      expiresAt,
      status: 'ACTIVE',
      certificateUrl: `/certificates/${profile.userId}/${certificationId}`,
      certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      badgeUrl: certification.badgeUrl,
      verificationUrl: `/verify/${certificationId}/${profile.userId}`,
    };

    const auditEvent: TrainingAuditEvent = {
      id: generateId(),
      type: 'CERT_ISSUED',
      actor: 'SYSTEM',
      occurredAt: now(),
      userId: profile.userId,
      certificationId,
      details: {
        certificationName: certification.name,
        expiresAt,
      },
    };

    const updatedCompletedModules = profile.completedModules.map((m) => {
      const module = this.modules.get(m.moduleId);
      if (module?.certificationId === certificationId) {
        return { ...m, certificateIssued: true, certificateId: certificationId };
      }
      return m;
    });

    return {
      ...profile,
      certifications: [...profile.certifications, userCert],
      completedModules: updatedCompletedModules,
      auditEvents: [...profile.auditEvents, auditEvent],
      lastActivityAt: now(),
    };
  }

  checkCertificationStatus(profile: UserTrainingProfile): UserTrainingProfile {
    const today = new Date();
    const thirtyDaysFromNow = addDays(now(), 30);

    const updatedCertifications = profile.certifications.map((cert) => {
      if (cert.status === 'REVOKED' || cert.status === 'SUSPENDED') {
        return cert;
      }

      const expiresAt = new Date(cert.expiresAt);

      if (expiresAt < today) {
        return { ...cert, status: 'EXPIRED' as const };
      }

      if (expiresAt < new Date(thirtyDaysFromNow)) {
        return { ...cert, status: 'EXPIRING_SOON' as const };
      }

      return { ...cert, status: 'ACTIVE' as const };
    });

    return {
      ...profile,
      certifications: updatedCertifications,
    };
  }

  renewCertification(profile: UserTrainingProfile, certificationId: CertificationId, renewalMonths: number): UserTrainingProfile {
    const certIndex = profile.certifications.findIndex((c) => c.certificationId === certificationId);
    if (certIndex === -1) {
      throw new Error(`Certification ${certificationId} not found`);
    }

    const cert = profile.certifications[certIndex];
    const newExpiresAt = addDays(now(), renewalMonths * 30);

    const updatedCert: UserCertification = {
      ...cert,
      expiresAt: newExpiresAt,
      status: 'ACTIVE',
      lastRenewedAt: now(),
    };

    const updatedCertifications = [...profile.certifications];
    updatedCertifications[certIndex] = updatedCert;

    const auditEvent: TrainingAuditEvent = {
      id: generateId(),
      type: 'CERT_RENEWED',
      actor: profile.userId,
      occurredAt: now(),
      userId: profile.userId,
      certificationId,
      details: {
        newExpiresAt,
        renewalMonths,
      },
    };

    return {
      ...profile,
      certifications: updatedCertifications,
      auditEvents: [...profile.auditEvents, auditEvent],
      lastActivityAt: now(),
    };
  }

  getCeCreditsForYear(profile: UserTrainingProfile, year: number): number {
    return profile.ceCreditsEarned.filter((c) => c.year === year).reduce((sum, c) => sum + c.credits, 0);
  }

  checkCeCompliance(profile: UserTrainingProfile, path: TrainingPath, year: number): { compliant: boolean; hoursEarned: number; hoursRequired: number } {
    const hoursEarned = this.getCeCreditsForYear(profile, year);
    const hoursRequired = path.annualCeHoursRequired;

    return {
      compliant: hoursEarned >= hoursRequired,
      hoursEarned,
      hoursRequired,
    };
  }

  addExternalCeCredit(profile: UserTrainingProfile, activityName: string, credits: number, category: ModuleCategory, documentUrl?: string): UserTrainingProfile {
    const ceCredit: CeCredit = {
      id: generateId(),
      activityType: 'EXTERNAL',
      activityName,
      credits,
      category,
      earnedAt: now(),
      year: new Date().getFullYear(),
      externalDocumentUrl: documentUrl,
    };

    return {
      ...profile,
      ceCreditsEarned: [...profile.ceCreditsEarned, ceCredit],
      lastActivityAt: now(),
    };
  }

  generateProgressReport(profile: UserTrainingProfile, paths: TrainingPath[], modulesById: Record<string, TrainingModule>): TrainingProgressReport {
    const pathsReport = profile.assignedPaths.map((ap) => {
      const path = paths.find((p) => p.id === ap.pathId);
      const isOverdue = new Date(ap.dueDate) < new Date();

      return {
        pathId: ap.pathId,
        pathName: path?.name ?? ap.pathId,
        status: ap.status,
        progress: ap.progressPercent,
        currentPhase: ap.currentPhaseIndex + 1,
        totalPhases: path?.phases.length ?? 0,
        dueDate: ap.dueDate,
        isOverdue,
      };
    });

    const modulesReport = [
      ...profile.assignedModules.map((am) => {
        const module = modulesById[am.moduleId];
        return {
          moduleId: am.moduleId,
          moduleTitle: module?.title ?? am.moduleId,
          status: am.status,
          progress: am.progressPercent,
          dueDate: am.dueDate,
          assessmentScore: am.lastAssessmentScore,
        };
      }),
      ...profile.completedModules.map((cm) => ({
        moduleId: cm.moduleId,
        moduleTitle: cm.moduleTitle,
        status: 'COMPLETED' as const,
        progress: 100 as Percentage,
        dueDate: cm.completedAt,
        assessmentScore: cm.assessmentScore,
      })),
    ];

    const certificationsReport = profile.certifications.map((cert) => ({
      certificationId: cert.certificationId,
      name: cert.name,
      status: cert.status,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      daysUntilExpiry: daysBetween(now(), cert.expiresAt),
    }));

    const currentYear = new Date().getFullYear();
    const primaryPath = paths.find((p) => profile.assignedPaths.some((ap) => ap.pathId === p.id));
    const ceRequired = primaryPath?.annualCeHoursRequired ?? 0;
    const ceEarned = this.getCeCreditsForYear(profile, currentYear);

    return {
      userId: profile.userId,
      generatedAt: now(),
      paths: pathsReport,
      modules: modulesReport,
      certifications: certificationsReport,
      ceCompliance: {
        year: currentYear,
        hoursRequired: ceRequired,
        hoursEarned: ceEarned,
        hoursRemaining: Math.max(0, ceRequired - ceEarned),
        compliant: ceEarned >= ceRequired,
        deadline: `${currentYear}-12-31T23:59:59Z` as IsoDateTime,
      },
      summary: {
        totalAssignedModules: profile.assignedModules.length,
        completedModules: profile.completedModules.length,
        inProgressModules: profile.assignedModules.filter((m) => m.status === 'IN_PROGRESS').length,
        overdueModules: profile.assignedModules.filter((m) => new Date(m.dueDate) < new Date()).length,
        totalTrainingHours: profile.totalTrainingHours ?? 0,
        averageAssessmentScore: profile.averageAssessmentScore ?? (0 as Percentage),
      },
    };
  }

  getDeadlineAlerts(profile: UserTrainingProfile, paths: TrainingPath[], warningDays: number = 14): DeadlineAlert[] {
    const alerts: DeadlineAlert[] = [];
    const today = new Date();

    for (const module of profile.assignedModules) {
      const dueDate = new Date(module.dueDate);
      const daysRemaining = daysBetween(now(), module.dueDate);
      const moduleDef = this.modules.get(module.moduleId);

      if (dueDate < today) {
        alerts.push({
          alertType: 'MODULE_DUE',
          entityId: module.moduleId,
          entityName: moduleDef?.title ?? module.moduleId,
          dueDate: module.dueDate,
          daysRemaining: -Math.abs(daysRemaining),
          severity: 'OVERDUE',
          actionRequired: 'Complete module immediately',
        });
      } else if (daysRemaining <= warningDays) {
        alerts.push({
          alertType: 'MODULE_DUE',
          entityId: module.moduleId,
          entityName: moduleDef?.title ?? module.moduleId,
          dueDate: module.dueDate,
          daysRemaining,
          severity: daysRemaining <= 3 ? 'URGENT' : 'WARNING',
          actionRequired: `Complete module within ${daysRemaining} days`,
        });
      }
    }

    for (const path of profile.assignedPaths) {
      if (path.status === 'COMPLETED') continue;

      const dueDate = new Date(path.dueDate);
      const daysRemaining = daysBetween(now(), path.dueDate);
      const pathDef = paths.find((p) => p.id === path.pathId);

      if (dueDate < today) {
        alerts.push({
          alertType: 'PATH_DUE',
          entityId: path.pathId,
          entityName: pathDef?.name ?? path.pathId,
          dueDate: path.dueDate,
          daysRemaining: -Math.abs(daysRemaining),
          severity: 'OVERDUE',
          actionRequired: 'Complete training path immediately',
        });
      } else if (daysRemaining <= warningDays) {
        alerts.push({
          alertType: 'PATH_DUE',
          entityId: path.pathId,
          entityName: pathDef?.name ?? path.pathId,
          dueDate: path.dueDate,
          daysRemaining,
          severity: daysRemaining <= 7 ? 'URGENT' : 'WARNING',
          actionRequired: `Complete training path within ${daysRemaining} days`,
        });
      }
    }

    for (const cert of profile.certifications) {
      if (cert.status === 'REVOKED' || cert.status === 'SUSPENDED') continue;

      const expiresAt = new Date(cert.expiresAt);
      const daysRemaining = daysBetween(now(), cert.expiresAt);

      if (expiresAt < today) {
        alerts.push({
          alertType: 'CERT_EXPIRING',
          entityId: cert.certificationId,
          entityName: cert.name,
          dueDate: cert.expiresAt,
          daysRemaining: -Math.abs(daysRemaining),
          severity: 'OVERDUE',
          actionRequired: 'Renew certification immediately',
        });
      } else if (daysRemaining <= 30) {
        alerts.push({
          alertType: 'CERT_EXPIRING',
          entityId: cert.certificationId,
          entityName: cert.name,
          dueDate: cert.expiresAt,
          daysRemaining,
          severity: daysRemaining <= 7 ? 'URGENT' : 'WARNING',
          actionRequired: `Renew certification within ${daysRemaining} days`,
        });
      }
    }

    const currentYear = new Date().getFullYear();
    const primaryPath = paths.find((p) => profile.assignedPaths.some((ap) => ap.pathId === p.id));

    if (primaryPath && primaryPath.annualCeHoursRequired > 0) {
      const ceEarned = this.getCeCreditsForYear(profile, currentYear);
      const ceRequired = primaryPath.annualCeHoursRequired;

      if (ceEarned < ceRequired) {
        const yearEndDate = `${currentYear}-12-31T23:59:59Z` as IsoDateTime;
        const daysRemaining = daysBetween(now(), yearEndDate);

        alerts.push({
          alertType: 'CE_DEADLINE',
          entityId: `ce-${currentYear}`,
          entityName: `${currentYear} CE Requirements`,
          dueDate: yearEndDate,
          daysRemaining,
          severity: daysRemaining <= 30 ? 'URGENT' : daysRemaining <= 60 ? 'WARNING' : 'INFO',
          actionRequired: `Complete ${ceRequired - ceEarned} more CE hours by year end`,
        });
      }
    }

    const severityOrder = { OVERDUE: 0, URGENT: 1, WARNING: 2, INFO: 3 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.daysRemaining - b.daysRemaining;
    });

    return alerts;
  }
}
