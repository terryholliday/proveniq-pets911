/**
 * VERIFICATION SERVICE - Ownership Claim Scoring & Release Authorization
 * 
 * CRITICAL SAFETY:
 * - Animals CANNOT be released without 80+ verification points
 * - All evidence is scored deterministically
 * - Release requires court-safe audit trail
 */

import type { UserId, ClaimId } from '@/modules/operations/types';
import {
  claimStateMachine,
  type ClaimState,
  type ClaimTrigger,
  type TransitionContext,
} from './infrastructure/state-machine';
import {
  calculateOwnershipScore,
  type EvidenceItem,
  type EvidenceType,
  type OwnershipScoreInput,
  type ScoringResult,
} from './infrastructure/scoring-engine';
import { logOwnershipClaim, createAuditEntry } from './infrastructure/audit-log';
import { eventBus, createServiceEvent } from './infrastructure/event-bus';

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════

export interface OwnershipClaim {
  id: ClaimId;
  caseId: string;
  claimantId: UserId;
  state: ClaimState;
  
  // Evidence
  evidence: ClaimEvidence[];
  
  // Scoring
  scoreResult?: ScoringResult;
  
  // Claimant verification
  claimantIdentityVerified: boolean;
  claimantAddressVerified: boolean;
  
  // Pet matching
  petDistinctiveMarkingsMatched: boolean;
  behaviorTestPassed?: boolean;
  
  // Release
  releaseAuthorizedBy?: UserId;
  releaseAuthorizedAt?: string;
  releasedAt?: string;
  releasedBy?: UserId;
  releaseLocation?: { lat: number; lng: number };
  
  // Timeline
  submittedAt: string;
  lastUpdatedAt: string;
  
  // Audit
  correlationId: string;
  version: number;
}

export interface ClaimEvidence {
  id: string;
  type: EvidenceType;
  description: string;
  documentUrl?: string;
  submittedAt: string;
  verified: boolean;
  verifiedBy?: UserId;
  verifiedAt?: string;
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
}

const RELEASE_THRESHOLD = 80;

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION SERVICE INTERFACE
// ═══════════════════════════════════════════════════════════════════

export interface IVerificationService {
  // Claim lifecycle
  createClaim(caseId: string, claimantId: UserId): Promise<OwnershipClaim>;
  addEvidence(claimId: ClaimId, evidence: Omit<ClaimEvidence, 'id' | 'submittedAt' | 'verified'>): Promise<OwnershipClaim>;
  verifyEvidence(claimId: ClaimId, evidenceId: string, verifier: UserId, confidence: 'high' | 'medium' | 'low', notes?: string): Promise<OwnershipClaim>;
  
  // Identity verification
  verifyClaimantIdentity(claimId: ClaimId, verifier: UserId): Promise<OwnershipClaim>;
  verifyClaimantAddress(claimId: ClaimId, verifier: UserId): Promise<OwnershipClaim>;
  
  // Pet matching
  recordMarkingsMatch(claimId: ClaimId, matched: boolean, verifier: UserId): Promise<OwnershipClaim>;
  recordBehaviorTest(claimId: ClaimId, passed: boolean, verifier: UserId, notes?: string): Promise<OwnershipClaim>;
  
  // Scoring
  calculateScore(claimId: ClaimId): Promise<OwnershipClaim>;
  
  // Release authorization
  authorizeRelease(claimId: ClaimId, authorizer: UserId): Promise<OwnershipClaim>;
  completeRelease(claimId: ClaimId, releasedBy: UserId, location: { lat: number; lng: number }): Promise<OwnershipClaim>;
  
  // Queries
  getClaim(claimId: ClaimId): Promise<OwnershipClaim | null>;
  getClaimsByCaseId(caseId: string): Promise<OwnershipClaim[]>;
  getClaimsByClaimant(claimantId: UserId): Promise<OwnershipClaim[]>;
  
  // Threshold check
  canRelease(claimId: ClaimId): Promise<{ allowed: boolean; score: number; reason?: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION SERVICE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

class VerificationServiceImpl implements IVerificationService {
  private claims: Map<string, OwnershipClaim> = new Map();

  async createClaim(caseId: string, claimantId: UserId): Promise<OwnershipClaim> {
    const id = crypto.randomUUID() as ClaimId;
    const correlationId = `claim-${Date.now()}-${id.slice(0, 8)}`;
    const now = new Date().toISOString();

    const claim: OwnershipClaim = {
      id,
      caseId,
      claimantId,
      state: claimStateMachine.initialState,
      evidence: [],
      claimantIdentityVerified: false,
      claimantAddressVerified: false,
      petDistinctiveMarkingsMatched: false,
      submittedAt: now,
      lastUpdatedAt: now,
      correlationId,
      version: 1,
    };

    this.claims.set(id, claim);

    logOwnershipClaim({
      claimId: id,
      eventType: 'CLAIM_CREATED',
      actor: claimantId,
      correlationId,
      details: { caseId },
    });

    eventBus.publish(createServiceEvent('CLAIM_SUBMITTED', {
      claimId: id,
      caseId,
      claimantId,
    }, claimantId, { correlationId }));

    return claim;
  }

  async addEvidence(claimId: ClaimId, evidenceData: Omit<ClaimEvidence, 'id' | 'submittedAt' | 'verified'>): Promise<OwnershipClaim> {
    const claim = await this.getOrThrow(claimId);
    
    const evidence: ClaimEvidence = {
      ...evidenceData,
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      verified: false,
    };

    // Transition state if first evidence
    let state = claim.state;
    if (claim.state === 'SUBMITTED') {
      const result = this.transition(claim, 'ADD_EVIDENCE', claim.claimantId);
      state = result.toState;
    }

    const updated: OwnershipClaim = {
      ...claim,
      state,
      evidence: [...claim.evidence, evidence],
      lastUpdatedAt: new Date().toISOString(),
      version: claim.version + 1,
    };

    this.claims.set(claimId, updated);

    logOwnershipClaim({
      claimId,
      eventType: 'EVIDENCE_ADDED',
      actor: claim.claimantId,
      correlationId: claim.correlationId,
      details: { evidenceType: evidence.type, evidenceId: evidence.id },
    });

    return updated;
  }

  async verifyEvidence(claimId: ClaimId, evidenceId: string, verifier: UserId, confidence: 'high' | 'medium' | 'low', notes?: string): Promise<OwnershipClaim> {
    const claim = await this.getOrThrow(claimId);
    const now = new Date().toISOString();

    const updatedEvidence = claim.evidence.map(e => 
      e.id === evidenceId
        ? { ...e, verified: true, verifiedBy: verifier, verifiedAt: now, confidence, notes }
        : e
    );

    const updated: OwnershipClaim = {
      ...claim,
      evidence: updatedEvidence,
      lastUpdatedAt: now,
      version: claim.version + 1,
    };

    this.claims.set(claimId, updated);

    logOwnershipClaim({
      claimId,
      eventType: 'EVIDENCE_VERIFIED',
      actor: verifier,
      correlationId: claim.correlationId,
      details: { evidenceId, confidence },
    });

    return updated;
  }

  async verifyClaimantIdentity(claimId: ClaimId, verifier: UserId): Promise<OwnershipClaim> {
    const claim = await this.getOrThrow(claimId);

    const updated: OwnershipClaim = {
      ...claim,
      claimantIdentityVerified: true,
      lastUpdatedAt: new Date().toISOString(),
      version: claim.version + 1,
    };

    this.claims.set(claimId, updated);
    return updated;
  }

  async verifyClaimantAddress(claimId: ClaimId, verifier: UserId): Promise<OwnershipClaim> {
    const claim = await this.getOrThrow(claimId);

    const updated: OwnershipClaim = {
      ...claim,
      claimantAddressVerified: true,
      lastUpdatedAt: new Date().toISOString(),
      version: claim.version + 1,
    };

    this.claims.set(claimId, updated);
    return updated;
  }

  async recordMarkingsMatch(claimId: ClaimId, matched: boolean, verifier: UserId): Promise<OwnershipClaim> {
    const claim = await this.getOrThrow(claimId);

    const updated: OwnershipClaim = {
      ...claim,
      petDistinctiveMarkingsMatched: matched,
      lastUpdatedAt: new Date().toISOString(),
      version: claim.version + 1,
    };

    this.claims.set(claimId, updated);
    return updated;
  }

  async recordBehaviorTest(claimId: ClaimId, passed: boolean, verifier: UserId, notes?: string): Promise<OwnershipClaim> {
    const claim = await this.getOrThrow(claimId);

    const updated: OwnershipClaim = {
      ...claim,
      behaviorTestPassed: passed,
      lastUpdatedAt: new Date().toISOString(),
      version: claim.version + 1,
    };

    this.claims.set(claimId, updated);
    return updated;
  }

  async calculateScore(claimId: ClaimId): Promise<OwnershipClaim> {
    const claim = await this.getOrThrow(claimId);

    const evidenceItems: EvidenceItem[] = claim.evidence.map(e => ({
      type: e.type,
      verified: e.verified,
      verifiedBy: e.verifiedBy,
      verifiedAt: e.verifiedAt,
      documentUrl: e.documentUrl,
      notes: e.notes,
      confidence: e.confidence,
    }));

    const input: OwnershipScoreInput = {
      evidence: evidenceItems,
      claimantIdentityVerified: claim.claimantIdentityVerified,
      claimantAddressVerified: claim.claimantAddressVerified,
      timeSinceReportDays: this.daysSinceSubmission(claim.submittedAt),
      petDistinctiveMarkingsMatched: claim.petDistinctiveMarkingsMatched,
      behaviorTestPassed: claim.behaviorTestPassed,
    };

    const scoreResult = calculateOwnershipScore(input);

    const updated: OwnershipClaim = {
      ...claim,
      scoreResult,
      lastUpdatedAt: new Date().toISOString(),
      version: claim.version + 1,
    };

    this.claims.set(claimId, updated);

    logOwnershipClaim({
      claimId,
      eventType: 'CLAIM_SCORE_CALCULATED',
      actor: 'SYSTEM',
      correlationId: claim.correlationId,
      details: { 
        totalScore: scoreResult.totalScore,
        meetsThreshold: scoreResult.meetsThreshold,
        threshold: scoreResult.thresholdUsed,
      },
    });

    return updated;
  }

  async authorizeRelease(claimId: ClaimId, authorizer: UserId): Promise<OwnershipClaim> {
    const claim = await this.getOrThrow(claimId);

    // Check score threshold
    const canRelease = await this.canRelease(claimId);
    if (!canRelease.allowed) {
      throw new Error(`Cannot authorize release: ${canRelease.reason}`);
    }

    const result = this.transition(claim, 'AUTHORIZE_RELEASE', authorizer);
    const now = new Date().toISOString();

    const updated: OwnershipClaim = {
      ...claim,
      state: result.toState,
      releaseAuthorizedBy: authorizer,
      releaseAuthorizedAt: now,
      lastUpdatedAt: now,
      version: claim.version + 1,
    };

    this.claims.set(claimId, updated);

    logOwnershipClaim({
      claimId,
      eventType: 'RELEASE_AUTHORIZED',
      actor: authorizer,
      correlationId: claim.correlationId,
      details: { score: claim.scoreResult?.totalScore },
    });

    eventBus.publish(createServiceEvent('RELEASE_AUTHORIZED', {
      claimId,
      caseId: claim.caseId,
      claimantId: claim.claimantId,
      score: claim.scoreResult?.totalScore,
    }, authorizer, { correlationId: claim.correlationId }));

    return updated;
  }

  async completeRelease(claimId: ClaimId, releasedBy: UserId, location: { lat: number; lng: number }): Promise<OwnershipClaim> {
    const claim = await this.getOrThrow(claimId);
    this.assertState(claim, ['RELEASE_AUTHORIZED']);

    const result = this.transition(claim, 'COMPLETE_RELEASE', releasedBy);
    const now = new Date().toISOString();

    const updated: OwnershipClaim = {
      ...claim,
      state: result.toState,
      releasedAt: now,
      releasedBy,
      releaseLocation: location,
      lastUpdatedAt: now,
      version: claim.version + 1,
    };

    this.claims.set(claimId, updated);

    logOwnershipClaim({
      claimId,
      eventType: 'RELEASE_COMPLETED',
      actor: releasedBy,
      correlationId: claim.correlationId,
      details: { location, claimantId: claim.claimantId },
    });

    eventBus.publish(createServiceEvent('RELEASE_COMPLETED', {
      claimId,
      caseId: claim.caseId,
      claimantId: claim.claimantId,
      releasedBy,
      location,
    }, releasedBy, { correlationId: claim.correlationId }));

    return updated;
  }

  async getClaim(claimId: ClaimId): Promise<OwnershipClaim | null> {
    return this.claims.get(claimId) ?? null;
  }

  async getClaimsByCaseId(caseId: string): Promise<OwnershipClaim[]> {
    return Array.from(this.claims.values()).filter(c => c.caseId === caseId);
  }

  async getClaimsByClaimant(claimantId: UserId): Promise<OwnershipClaim[]> {
    return Array.from(this.claims.values()).filter(c => c.claimantId === claimantId);
  }

  async canRelease(claimId: ClaimId): Promise<{ allowed: boolean; score: number; reason?: string }> {
    const claim = await this.getClaim(claimId);
    if (!claim) {
      return { allowed: false, score: 0, reason: 'Claim not found' };
    }

    if (!claim.scoreResult) {
      return { allowed: false, score: 0, reason: 'Score not calculated' };
    }

    if (claim.scoreResult.totalScore < RELEASE_THRESHOLD) {
      return { 
        allowed: false, 
        score: claim.scoreResult.totalScore,
        reason: `Score ${claim.scoreResult.totalScore} below threshold ${RELEASE_THRESHOLD}`,
      };
    }

    return { allowed: true, score: claim.scoreResult.totalScore };
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════

  private async getOrThrow(claimId: ClaimId): Promise<OwnershipClaim> {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }
    return claim;
  }

  private assertState(claim: OwnershipClaim, allowedStates: ClaimState[]): void {
    if (!allowedStates.includes(claim.state)) {
      throw new Error(`Invalid state: ${claim.state}. Expected: ${allowedStates.join(', ')}`);
    }
  }

  private transition(
    claim: OwnershipClaim,
    trigger: ClaimTrigger,
    actor: UserId | 'SYSTEM'
  ): { fromState: ClaimState; toState: ClaimState } {
    const context: TransitionContext = {
      actor,
      timestamp: new Date().toISOString(),
    };

    const result = claimStateMachine.transition(claim.state, trigger, context);
    
    if (!result.success) {
      throw new Error(result.error ?? `Invalid transition: ${claim.state} -> ${trigger}`);
    }

    return { fromState: result.fromState, toState: result.toState };
  }

  private daysSinceSubmission(submittedAt: string): number {
    const submitted = new Date(submittedAt).getTime();
    const now = Date.now();
    return Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

export const verificationService: IVerificationService = new VerificationServiceImpl();
