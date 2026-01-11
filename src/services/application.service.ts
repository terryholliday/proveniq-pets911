/**
 * APPLICATION SERVICE V4 - Two-Phase Volunteer Application Processing
 * 
 * CRITICAL COST CONTROL:
 * - Phase 1: Free operations (eligibility, documents, agreements)
 * - Phase 2: Background check ONLY after P1 approval (expensive)
 * 
 * CONSTRAINTS:
 * - Background checks NEVER triggered in Phase 1
 * - Role granted only after training complete (TrainingService.isPathComplete)
 * - All state changes logged to audit trail
 * - Deterministic scoring for P1 auto-triage
 */

import type { UserId, ApplicationId } from '@/modules/operations/types';
import type { RoleId } from '@/modules/operations/roles';
import {
  applicationStateMachine,
  type ApplicationState,
  type ApplicationTrigger,
  type TransitionContext,
} from './infrastructure/state-machine';
import {
  calculateApplicationScore,
  type ApplicationScoreInput,
  type ScoringResult,
} from './infrastructure/scoring-engine';
import {
  createAuditEntry,
  logApplicationStateChange,
  logBackgroundCheck,
  logRoleChange,
} from './infrastructure/audit-log';
import { eventBus, createServiceEvent } from './infrastructure/event-bus';

// ═══════════════════════════════════════════════════════════════════
// APPLICATION TYPES
// ═══════════════════════════════════════════════════════════════════

export interface VolunteerApplicationV4 {
  id: ApplicationId;
  userId: UserId;
  roleId: RoleId;
  state: ApplicationState;
  
  // Phase 1 data (collected before any cost)
  personalInfo: PersonalInfo;
  agreements: Agreements;
  availability: AvailabilityInfo;
  experience: ExperienceInfo;
  references: Reference[];
  
  // Scoring
  p1Score?: ScoringResult;
  
  // Phase 2 data (after P1 approval)
  backgroundCheck?: BackgroundCheckInfo;
  trainingPathId?: string;
  trainingComplete?: boolean;
  interview?: InterviewInfo;
  
  // Timeline
  createdAt: string;
  submittedAt?: string;
  p1ApprovedAt?: string;
  p2StartedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  expiresAt?: string;
  
  // Audit
  correlationId: string;
  version: number;
}

export interface PersonalInfo {
  legalName: string;
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  hasDriversLicense: boolean;
  hasTransportation: boolean;
}

export interface Agreements {
  codeOfConduct: boolean;
  codeOfConductSignedAt?: string;
  backgroundCheckConsent: boolean;
  backgroundCheckConsentSignedAt?: string;
  termsOfService: boolean;
  termsOfServiceSignedAt?: string;
  liabilityWaiver: boolean;
  liabilityWaiverSignedAt?: string;
}

export interface AvailabilityInfo {
  weekdays: boolean;
  weekends: boolean;
  evenings: boolean;
  overnights: boolean;
  holidays: boolean;
  regions: string[];
  maxTravelMiles: number;
}

export interface ExperienceInfo {
  previousVolunteerExperience: boolean;
  animalHandlingExperience: boolean;
  professionalBackground?: 'veterinary' | 'animal_shelter' | 'rescue' | 'training' | 'other' | 'none';
  specialSkills: string[];
  certifications: string[];
}

export interface Reference {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  verified?: boolean;
  verifiedAt?: string;
}

export interface BackgroundCheckInfo {
  vendorId: string;
  externalId?: string;
  status: 'not_started' | 'initiated' | 'pending' | 'cleared' | 'failed' | 'error';
  initiatedAt?: string;
  completedAt?: string;
  result?: 'clear' | 'consider' | 'fail';
  reportUrl?: string;
}

export interface InterviewInfo {
  scheduledAt?: string;
  conductedAt?: string;
  conductedBy?: UserId;
  format: 'video' | 'phone' | 'in_person';
  score?: number;
  notes?: string;
  recommendation?: 'approve' | 'conditional' | 'reject';
}

// ═══════════════════════════════════════════════════════════════════
// APPLICATION SERVICE INTERFACE
// ═══════════════════════════════════════════════════════════════════

export interface IApplicationService {
  // Phase 1: Free operations
  createApplication(userId: UserId, roleId: RoleId): Promise<VolunteerApplicationV4>;
  updatePersonalInfo(appId: ApplicationId, info: Partial<PersonalInfo>, actor: UserId): Promise<VolunteerApplicationV4>;
  updateAgreements(appId: ApplicationId, agreements: Partial<Agreements>, actor: UserId): Promise<VolunteerApplicationV4>;
  updateAvailability(appId: ApplicationId, availability: Partial<AvailabilityInfo>, actor: UserId): Promise<VolunteerApplicationV4>;
  updateExperience(appId: ApplicationId, experience: Partial<ExperienceInfo>, actor: UserId): Promise<VolunteerApplicationV4>;
  addReference(appId: ApplicationId, reference: Reference, actor: UserId): Promise<VolunteerApplicationV4>;
  
  submitP1(appId: ApplicationId, actor: UserId): Promise<VolunteerApplicationV4>;
  reviewP1(appId: ApplicationId, reviewer: UserId): Promise<VolunteerApplicationV4>;
  approveP1(appId: ApplicationId, reviewer: UserId, notes?: string): Promise<VolunteerApplicationV4>;
  rejectP1(appId: ApplicationId, reviewer: UserId, reason: string): Promise<VolunteerApplicationV4>;
  
  // Phase 2: After P1 approval (costs incurred)
  startPhase2(appId: ApplicationId, actor: UserId | 'SYSTEM'): Promise<VolunteerApplicationV4>;
  initiateBackgroundCheck(appId: ApplicationId, actor: UserId | 'SYSTEM'): Promise<VolunteerApplicationV4>;
  recordBackgroundCheckResult(appId: ApplicationId, result: 'cleared' | 'failed', details: Record<string, unknown>): Promise<VolunteerApplicationV4>;
  
  markTrainingComplete(appId: ApplicationId, actor: UserId | 'SYSTEM'): Promise<VolunteerApplicationV4>;
  scheduleInterview(appId: ApplicationId, scheduledAt: string, format: 'video' | 'phone' | 'in_person', actor: UserId): Promise<VolunteerApplicationV4>;
  recordInterviewResult(appId: ApplicationId, result: InterviewInfo, actor: UserId): Promise<VolunteerApplicationV4>;
  
  // Final decision
  approve(appId: ApplicationId, reviewer: UserId, notes?: string): Promise<VolunteerApplicationV4>;
  reject(appId: ApplicationId, reviewer: UserId, reason: string): Promise<VolunteerApplicationV4>;
  withdraw(appId: ApplicationId, actor: UserId, reason?: string): Promise<VolunteerApplicationV4>;
  
  // Queries
  getApplication(appId: ApplicationId): Promise<VolunteerApplicationV4 | null>;
  getApplicationsByUser(userId: UserId): Promise<VolunteerApplicationV4[]>;
  getApplicationsByState(state: ApplicationState): Promise<VolunteerApplicationV4[]>;
  getPendingP1Review(): Promise<VolunteerApplicationV4[]>;
  getPendingP2(): Promise<VolunteerApplicationV4[]>;
  
  // Training gate check
  canGrantRole(appId: ApplicationId): Promise<{ allowed: boolean; reason?: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// APPLICATION SERVICE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

class ApplicationServiceImpl implements IApplicationService {
  private applications: Map<string, VolunteerApplicationV4> = new Map();
  private trainingService?: { isPathComplete: (userId: UserId, pathId: string) => Promise<boolean> };

  setTrainingService(service: { isPathComplete: (userId: UserId, pathId: string) => Promise<boolean> }): void {
    this.trainingService = service;
  }

  async createApplication(userId: UserId, roleId: RoleId): Promise<VolunteerApplicationV4> {
    const id = crypto.randomUUID() as ApplicationId;
    const correlationId = `app-${Date.now()}-${id.slice(0, 8)}`;

    const app: VolunteerApplicationV4 = {
      id,
      userId,
      roleId,
      state: applicationStateMachine.initialState,
      personalInfo: {
        legalName: '',
        displayName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        county: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        hasDriversLicense: false,
        hasTransportation: false,
      },
      agreements: {
        codeOfConduct: false,
        backgroundCheckConsent: false,
        termsOfService: false,
        liabilityWaiver: false,
      },
      availability: {
        weekdays: false,
        weekends: false,
        evenings: false,
        overnights: false,
        holidays: false,
        regions: [],
        maxTravelMiles: 0,
      },
      experience: {
        previousVolunteerExperience: false,
        animalHandlingExperience: false,
        specialSkills: [],
        certifications: [],
      },
      references: [],
      createdAt: new Date().toISOString(),
      correlationId,
      version: 1,
    };

    this.applications.set(id, app);

    createAuditEntry({
      eventType: 'APPLICATION_CREATED',
      aggregateType: 'application',
      aggregateId: id,
      actor: userId,
      correlationId,
      newState: app.state,
      details: { roleId },
    });

    return app;
  }

  async updatePersonalInfo(appId: ApplicationId, info: Partial<PersonalInfo>, actor: UserId): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['DRAFT']);

    const updated: VolunteerApplicationV4 = {
      ...app,
      personalInfo: { ...app.personalInfo, ...info },
      version: app.version + 1,
    };

    this.applications.set(appId, updated);
    return updated;
  }

  async updateAgreements(appId: ApplicationId, agreements: Partial<Agreements>, actor: UserId): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['DRAFT']);

    const now = new Date().toISOString();
    const updatedAgreements = { ...app.agreements };

    if (agreements.codeOfConduct && !app.agreements.codeOfConduct) {
      updatedAgreements.codeOfConduct = true;
      updatedAgreements.codeOfConductSignedAt = now;
    }
    if (agreements.backgroundCheckConsent && !app.agreements.backgroundCheckConsent) {
      updatedAgreements.backgroundCheckConsent = true;
      updatedAgreements.backgroundCheckConsentSignedAt = now;
    }
    if (agreements.termsOfService && !app.agreements.termsOfService) {
      updatedAgreements.termsOfService = true;
      updatedAgreements.termsOfServiceSignedAt = now;
    }
    if (agreements.liabilityWaiver && !app.agreements.liabilityWaiver) {
      updatedAgreements.liabilityWaiver = true;
      updatedAgreements.liabilityWaiverSignedAt = now;
    }

    const updated: VolunteerApplicationV4 = {
      ...app,
      agreements: updatedAgreements,
      version: app.version + 1,
    };

    this.applications.set(appId, updated);
    return updated;
  }

  async updateAvailability(appId: ApplicationId, availability: Partial<AvailabilityInfo>, actor: UserId): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['DRAFT']);

    const updated: VolunteerApplicationV4 = {
      ...app,
      availability: { ...app.availability, ...availability },
      version: app.version + 1,
    };

    this.applications.set(appId, updated);
    return updated;
  }

  async updateExperience(appId: ApplicationId, experience: Partial<ExperienceInfo>, actor: UserId): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['DRAFT']);

    const updated: VolunteerApplicationV4 = {
      ...app,
      experience: { ...app.experience, ...experience },
      version: app.version + 1,
    };

    this.applications.set(appId, updated);
    return updated;
  }

  async addReference(appId: ApplicationId, reference: Reference, actor: UserId): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['DRAFT']);

    const updated: VolunteerApplicationV4 = {
      ...app,
      references: [...app.references, reference],
      version: app.version + 1,
    };

    this.applications.set(appId, updated);
    return updated;
  }

  async submitP1(appId: ApplicationId, actor: UserId): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    
    // Validate required fields
    this.validateP1Submission(app);

    const result = this.transition(app, 'SUBMIT_P1', actor);
    
    // Calculate P1 score
    const scoreInput = this.buildScoreInput(app);
    const p1Score = calculateApplicationScore(scoreInput);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: result.toState,
      p1Score,
      submittedAt: new Date().toISOString(),
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
      details: { p1Score: p1Score.totalScore, meetsThreshold: p1Score.meetsThreshold },
    });

    eventBus.publish(createServiceEvent('APPLICATION_SUBMITTED', {
      applicationId: appId,
      userId: app.userId,
      roleId: app.roleId,
      p1Score: p1Score.totalScore,
    }, actor, { correlationId: app.correlationId }));

    return updated;
  }

  async reviewP1(appId: ApplicationId, reviewer: UserId): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    const result = this.transition(app, 'START_P1_REVIEW', reviewer);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: result.toState,
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor: reviewer,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
    });

    return updated;
  }

  async approveP1(appId: ApplicationId, reviewer: UserId, notes?: string): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    const result = this.transition(app, 'APPROVE_P1', reviewer);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: result.toState,
      p1ApprovedAt: new Date().toISOString(),
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor: reviewer,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
      details: { notes },
    });

    eventBus.publish(createServiceEvent('APPLICATION_P1_APPROVED', {
      applicationId: appId,
      userId: app.userId,
      roleId: app.roleId,
      reviewedBy: reviewer,
    }, reviewer, { correlationId: app.correlationId }));

    return updated;
  }

  async rejectP1(appId: ApplicationId, reviewer: UserId, reason: string): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    const result = this.transition(app, 'REJECT_P1', reviewer);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: result.toState,
      rejectedAt: new Date().toISOString(),
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor: reviewer,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
      details: { reason },
    });

    eventBus.publish(createServiceEvent('APPLICATION_P1_REJECTED', {
      applicationId: appId,
      userId: app.userId,
      reason,
    }, reviewer, { correlationId: app.correlationId }));

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 2: After P1 Approval (costs incurred here)
  // ═══════════════════════════════════════════════════════════════════

  async startPhase2(appId: ApplicationId, actor: UserId | 'SYSTEM'): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['P1_APPROVED']);

    const result = this.transition(app, 'START_BACKGROUND_CHECK', actor);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: result.toState,
      p2StartedAt: new Date().toISOString(),
      backgroundCheck: {
        vendorId: 'checkr',
        status: 'not_started',
      },
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
    });

    eventBus.publish(createServiceEvent('APPLICATION_P2_STARTED', {
      applicationId: appId,
      userId: app.userId,
    }, actor, { correlationId: app.correlationId }));

    return updated;
  }

  async initiateBackgroundCheck(appId: ApplicationId, actor: UserId | 'SYSTEM'): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    
    // CRITICAL: Only allow background check in P2_BACKGROUND_CHECK state
    this.assertState(app, ['P2_BACKGROUND_CHECK']);

    if (!app.backgroundCheck) {
      throw new Error('Background check not initialized');
    }

    const updated: VolunteerApplicationV4 = {
      ...app,
      backgroundCheck: {
        ...app.backgroundCheck,
        status: 'initiated',
        initiatedAt: new Date().toISOString(),
      },
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logBackgroundCheck({
      applicationId: appId,
      eventType: 'BACKGROUND_CHECK_INITIATED',
      actor,
      correlationId: app.correlationId,
      details: { vendorId: updated.backgroundCheck.vendorId },
    });

    eventBus.publish(createServiceEvent('APPLICATION_BACKGROUND_CHECK_INITIATED', {
      applicationId: appId,
      userId: app.userId,
      vendorId: updated.backgroundCheck.vendorId,
    }, actor, { correlationId: app.correlationId }));

    return updated;
  }

  async recordBackgroundCheckResult(
    appId: ApplicationId,
    result: 'cleared' | 'failed',
    details: Record<string, unknown>
  ): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['P2_BACKGROUND_CHECK']);

    const trigger: ApplicationTrigger = result === 'cleared' 
      ? 'BACKGROUND_CHECK_PASSED' 
      : 'BACKGROUND_CHECK_FAILED';

    const transitionResult = this.transition(app, trigger, 'SYSTEM');

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: transitionResult.toState,
      backgroundCheck: {
        ...app.backgroundCheck!,
        status: result,
        completedAt: new Date().toISOString(),
        result: result === 'cleared' ? 'clear' : 'fail',
        reportUrl: details.reportUrl as string | undefined,
      },
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    const eventType = result === 'cleared' ? 'BACKGROUND_CHECK_COMPLETED' : 'BACKGROUND_CHECK_FAILED';
    logBackgroundCheck({
      applicationId: appId,
      eventType,
      actor: 'SYSTEM',
      correlationId: app.correlationId,
      details,
    });

    eventBus.publish(createServiceEvent('APPLICATION_BACKGROUND_CHECK_COMPLETED', {
      applicationId: appId,
      userId: app.userId,
      result,
    }, 'SYSTEM', { correlationId: app.correlationId }));

    return updated;
  }

  async markTrainingComplete(appId: ApplicationId, actor: UserId | 'SYSTEM'): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['P2_TRAINING']);

    const result = this.transition(app, 'TRAINING_COMPLETED', actor);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: result.toState,
      trainingComplete: true,
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
    });

    eventBus.publish(createServiceEvent('APPLICATION_TRAINING_COMPLETED', {
      applicationId: appId,
      userId: app.userId,
    }, actor, { correlationId: app.correlationId }));

    return updated;
  }

  async scheduleInterview(
    appId: ApplicationId,
    scheduledAt: string,
    format: 'video' | 'phone' | 'in_person',
    actor: UserId
  ): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['P2_INTERVIEW']);

    const updated: VolunteerApplicationV4 = {
      ...app,
      interview: {
        scheduledAt,
        format,
      },
      version: app.version + 1,
    };

    this.applications.set(appId, updated);
    return updated;
  }

  async recordInterviewResult(appId: ApplicationId, result: InterviewInfo, actor: UserId): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    this.assertState(app, ['P2_INTERVIEW']);

    const trigger: ApplicationTrigger = result.recommendation === 'reject' 
      ? 'INTERVIEW_FAILED' 
      : 'INTERVIEW_PASSED';

    const transitionResult = this.transition(app, trigger, actor);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: transitionResult.toState,
      interview: {
        ...app.interview,
        ...result,
        conductedAt: new Date().toISOString(),
        conductedBy: actor,
      },
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
      details: { score: result.score, recommendation: result.recommendation },
    });

    return updated;
  }

  async approve(appId: ApplicationId, reviewer: UserId, notes?: string): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    
    // Check training gate
    const canGrant = await this.canGrantRole(appId);
    if (!canGrant.allowed) {
      throw new Error(`Cannot approve: ${canGrant.reason}`);
    }

    const result = this.transition(app, 'APPROVE', reviewer);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: result.toState,
      approvedAt: new Date().toISOString(),
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor: reviewer,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
      details: { notes },
    });

    // Grant role
    logRoleChange({
      userId: app.userId,
      roleId: app.roleId,
      eventType: 'ROLE_GRANTED',
      actor: reviewer,
      correlationId: app.correlationId,
      details: { applicationId: appId },
    });

    eventBus.publish(createServiceEvent('APPLICATION_APPROVED', {
      applicationId: appId,
      userId: app.userId,
      roleId: app.roleId,
    }, reviewer, { correlationId: app.correlationId }));

    return updated;
  }

  async reject(appId: ApplicationId, reviewer: UserId, reason: string): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    const result = this.transition(app, 'REJECT', reviewer);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: result.toState,
      rejectedAt: new Date().toISOString(),
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor: reviewer,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
      details: { reason },
    });

    eventBus.publish(createServiceEvent('APPLICATION_REJECTED', {
      applicationId: appId,
      userId: app.userId,
      reason,
    }, reviewer, { correlationId: app.correlationId }));

    return updated;
  }

  async withdraw(appId: ApplicationId, actor: UserId, reason?: string): Promise<VolunteerApplicationV4> {
    const app = await this.getOrThrow(appId);
    const result = this.transition(app, 'WITHDRAW', actor);

    const updated: VolunteerApplicationV4 = {
      ...app,
      state: result.toState,
      withdrawnAt: new Date().toISOString(),
      version: app.version + 1,
    };

    this.applications.set(appId, updated);

    logApplicationStateChange({
      applicationId: appId,
      actor,
      previousState: app.state,
      newState: updated.state,
      correlationId: app.correlationId,
      details: { reason },
    });

    eventBus.publish(createServiceEvent('APPLICATION_WITHDRAWN', {
      applicationId: appId,
      userId: app.userId,
      reason,
    }, actor, { correlationId: app.correlationId }));

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════════════

  async getApplication(appId: ApplicationId): Promise<VolunteerApplicationV4 | null> {
    return this.applications.get(appId) ?? null;
  }

  async getApplicationsByUser(userId: UserId): Promise<VolunteerApplicationV4[]> {
    return Array.from(this.applications.values()).filter(a => a.userId === userId);
  }

  async getApplicationsByState(state: ApplicationState): Promise<VolunteerApplicationV4[]> {
    return Array.from(this.applications.values()).filter(a => a.state === state);
  }

  async getPendingP1Review(): Promise<VolunteerApplicationV4[]> {
    return Array.from(this.applications.values()).filter(
      a => a.state === 'P1_SUBMITTED' || a.state === 'P1_UNDER_REVIEW'
    );
  }

  async getPendingP2(): Promise<VolunteerApplicationV4[]> {
    return Array.from(this.applications.values()).filter(
      a => ['P2_BACKGROUND_CHECK', 'P2_TRAINING', 'P2_INTERVIEW', 'P2_FINAL_REVIEW'].includes(a.state)
    );
  }

  async canGrantRole(appId: ApplicationId): Promise<{ allowed: boolean; reason?: string }> {
    const app = await this.getApplication(appId);
    if (!app) {
      return { allowed: false, reason: 'Application not found' };
    }

    // Must be in final review state
    if (app.state !== 'P2_FINAL_REVIEW') {
      return { allowed: false, reason: `Invalid state: ${app.state}` };
    }

    // Background check must be cleared
    if (app.backgroundCheck?.status !== 'cleared') {
      return { allowed: false, reason: 'Background check not cleared' };
    }

    // Training must be complete (via TrainingService)
    if (this.trainingService && app.trainingPathId) {
      const trainingComplete = await this.trainingService.isPathComplete(app.userId, app.trainingPathId);
      if (!trainingComplete) {
        return { allowed: false, reason: 'Training not complete' };
      }
    } else if (!app.trainingComplete) {
      return { allowed: false, reason: 'Training not marked complete' };
    }

    return { allowed: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════

  private async getOrThrow(appId: ApplicationId): Promise<VolunteerApplicationV4> {
    const app = this.applications.get(appId);
    if (!app) {
      throw new Error(`Application not found: ${appId}`);
    }
    return app;
  }

  private assertState(app: VolunteerApplicationV4, allowedStates: ApplicationState[]): void {
    if (!allowedStates.includes(app.state)) {
      throw new Error(`Invalid state: ${app.state}. Expected one of: ${allowedStates.join(', ')}`);
    }
  }

  private transition(
    app: VolunteerApplicationV4,
    trigger: ApplicationTrigger,
    actor: UserId | 'SYSTEM'
  ): { fromState: ApplicationState; toState: ApplicationState } {
    const context: TransitionContext = {
      actor,
      timestamp: new Date().toISOString(),
    };

    const result = applicationStateMachine.transition(app.state, trigger, context);
    
    if (!result.success) {
      throw new Error(result.error ?? `Invalid transition: ${app.state} -> ${trigger}`);
    }

    return { fromState: result.fromState, toState: result.toState };
  }

  private validateP1Submission(app: VolunteerApplicationV4): void {
    const errors: string[] = [];

    if (!app.personalInfo.legalName) errors.push('Legal name required');
    if (!app.personalInfo.email) errors.push('Email required');
    if (!app.personalInfo.phone) errors.push('Phone required');
    if (!app.personalInfo.dateOfBirth) errors.push('Date of birth required');
    if (!app.agreements.codeOfConduct) errors.push('Code of conduct agreement required');
    if (!app.agreements.backgroundCheckConsent) errors.push('Background check consent required');
    if (!app.agreements.termsOfService) errors.push('Terms of service agreement required');

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }
  }

  private buildScoreInput(app: VolunteerApplicationV4): ApplicationScoreInput {
    return {
      hasRequiredDocuments: true, // Assume validated
      hasValidEmail: !!app.personalInfo.email,
      hasValidPhone: !!app.personalInfo.phone,
      ageVerified: !!app.personalInfo.dateOfBirth,
      isOver18: this.isOver18(app.personalInfo.dateOfBirth),
      agreedToCodeOfConduct: app.agreements.codeOfConduct,
      agreedToBackgroundCheck: app.agreements.backgroundCheckConsent,
      agreedToTerms: app.agreements.termsOfService,
      hasTransportation: app.personalInfo.hasTransportation,
      hasDriversLicense: app.personalInfo.hasDriversLicense,
      regionAvailable: app.availability.regions.length > 0,
      roleAvailable: true, // Assume available
      previousVolunteerExperience: app.experience.previousVolunteerExperience,
      animalHandlingExperience: app.experience.animalHandlingExperience,
      professionalBackground: app.experience.professionalBackground,
      referenceCount: app.references.length,
      completedInitialQuestionnaire: true,
    };
  }

  private isOver18(dateOfBirth: string): boolean {
    if (!dateOfBirth) return false;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    return age > 18 || (age === 18 && monthDiff >= 0);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

export const applicationService: IApplicationService & {
  setTrainingService: (service: { isPathComplete: (userId: UserId, pathId: string) => Promise<boolean> }) => void;
} = new ApplicationServiceImpl();
