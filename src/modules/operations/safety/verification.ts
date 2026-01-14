/**
 * OPERATIONS MODULE - OWNER VERIFICATION SYSTEM
 * 
 * CRITICAL: This is the highest-risk area.
 * Releasing an animal to the wrong person is unrecoverable.
 * 
 * Key Principles:
 * - Microchip is gold standard (80 points)
 * - Pre-registration profiles provide strong evidence (60 points)
 * - Scoring is deterministic, not subjective
 * - Two-person approval for disputes/low scores
 * - Release hold prevents premature handoff
 */

import type { 
  UserId, CaseId, ClaimId, ConfidenceLevel, VerificationStatus,
  AuditMetadata, Address, GeoLocation 
} from '../types';
import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// OWNERSHIP CLAIM
// ═══════════════════════════════════════════════════════════════════

export interface OwnershipClaim {
  id: ClaimId;
  caseId: CaseId;
  animalId?: string;
  
  // Claimant
  claimantUserId: UserId;
  claimantIdentity: ClaimantIdentity;
  claimedAt: string;
  
  // Status
  status: ClaimStatus;
  
  // Release hold (animal cannot be released until cleared)
  releaseHold: ReleaseHold;
  
  // Evidence
  evidence: OwnershipEvidence[];
  totalScore: number;
  scoreBreakdown: EvidenceScoreEntry[];
  scoreCalculatedAt?: string;
  
  // Verification steps
  verificationSteps: OwnershipVerificationStep[];
  
  // Pre-reg linkage (Mayday doctrine)
  linkedPreregProfileId?: string;
  preregMatchConfidence?: ConfidenceLevel;
  
  // Knowledge test (questions recorded BEFORE claimant answers)
  knowledgeTest?: KnowledgeTest;
  
  // Dispute handling
  competingClaimIds?: ClaimId[];
  disputeStatus?: DisputeStatus;
  disputeEscalatedTo?: RoleId;
  disputeEscalatedAt?: string;
  
  // Decision
  decision?: ClaimDecision;
  
  // Audit
  reviewHistory: ClaimReviewEvent[];
  audit: AuditMetadata;
}

export type ClaimStatus = 
  | 'pending'
  | 'under_review'
  | 'evidence_requested'
  | 'verified'
  | 'rejected'
  | 'disputed'
  | 'withdrawn';

export type DisputeStatus =
  | 'none'
  | 'competing_claim'
  | 'evidence_conflict'
  | 'fraud_suspected'
  | 'under_investigation'
  | 'resolved';

// ═══════════════════════════════════════════════════════════════════
// RELEASE HOLD
// ═══════════════════════════════════════════════════════════════════

export interface ReleaseHold {
  status: 'active' | 'cleared' | 'denied';
  reason?: ReleaseHoldReason;
  setBy?: UserId;
  setAt?: string;
  clearedBy?: UserId;
  clearedAt?: string;
  clearanceApprovers?: { userId: UserId; roleId: RoleId; approvedAt: string }[];
  requiresTwoPersonClearance: boolean;
}

export type ReleaseHoldReason =
  | 'insufficient_evidence'
  | 'pending_verification'
  | 'dispute'
  | 'suspected_fraud'
  | 'law_enforcement'
  | 'pending_chip_scan'
  | 'competing_claim'
  | 'knowledge_test_failed'
  | 'other';

// ═══════════════════════════════════════════════════════════════════
// CLAIMANT IDENTITY
// ═══════════════════════════════════════════════════════════════════

export interface ClaimantIdentity {
  fullName: string;
  phone: string;
  email: string;
  address?: Address;
  
  // ID verification (for in-person handoff)
  idVerified: boolean;
  idType?: 'drivers_license' | 'state_id' | 'passport' | 'military_id';
  idLast4?: string;  // Never store full ID
  idPhotoMatches?: boolean;
  verifiedBy?: UserId;
  verifiedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// OWNERSHIP EVIDENCE
// ═══════════════════════════════════════════════════════════════════

export interface OwnershipEvidence {
  id: string;
  type: OwnershipEvidenceType;
  description: string;
  documentUrl?: string;  // Stored in secure evidence store with TTL
  
  // Submission
  submittedBy: UserId;
  submittedAt: string;
  
  // Verification
  verificationStatus: VerificationStatus;
  verifiedBy?: UserId;
  verifiedAt?: string;
  verificationNotes?: string;
  
  // Scoring
  score: number;
  confidence: ConfidenceLevel;
  
  // Expiration (evidence URLs should expire)
  evidenceExpiresAt?: string;
  
  // Specific evidence details
  microchipDetails?: MicrochipEvidence;
  preregMatchDetails?: PreregMatchEvidence;
  vetRecordDetails?: VetRecordEvidence;
  photoDetails?: PhotoEvidence;
}

export type OwnershipEvidenceType =
  | 'microchip_registration'      // 80 points - Gold standard
  | 'owner_prereg_profile_match'  // 60 points - Mayday pre-registration
  | 'vet_records'                 // 40 points
  | 'adoption_papers'             // 40 points
  | 'purchase_receipt'            // 30 points
  | 'pet_license'                 // 30 points
  | 'insurance_policy'            // 25 points
  | 'dated_photo_with_pet'        // 20 points - Must show date metadata
  | 'undated_photo_with_pet'      // 10 points
  | 'knowledge_test'              // 15 points
  | 'witness_statement'           // 10 points
  | 'social_media_history'        // 10 points - Public posts showing ownership
  | 'other';                      // 0-10 points, reviewer discretion

// ═══════════════════════════════════════════════════════════════════
// EVIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════

export interface EvidenceScoreRule {
  type: OwnershipEvidenceType;
  basePoints: number;
  requiresVerification: boolean;
  maxInstances: number;
  description: string;
}

export const EVIDENCE_SCORE_RULES: EvidenceScoreRule[] = [
  { type: 'microchip_registration', basePoints: 80, requiresVerification: true, maxInstances: 1, description: 'Registered microchip matching claimant' },
  { type: 'owner_prereg_profile_match', basePoints: 60, requiresVerification: true, maxInstances: 1, description: 'Pre-registered Mayday profile match' },
  { type: 'vet_records', basePoints: 40, requiresVerification: true, maxInstances: 1, description: 'Veterinary records with claimant name' },
  { type: 'adoption_papers', basePoints: 40, requiresVerification: true, maxInstances: 1, description: 'Official adoption documentation' },
  { type: 'purchase_receipt', basePoints: 30, requiresVerification: true, maxInstances: 1, description: 'Purchase receipt from breeder/store' },
  { type: 'pet_license', basePoints: 30, requiresVerification: true, maxInstances: 1, description: 'Government pet license' },
  { type: 'insurance_policy', basePoints: 25, requiresVerification: true, maxInstances: 1, description: 'Pet insurance policy' },
  { type: 'dated_photo_with_pet', basePoints: 20, requiresVerification: true, maxInstances: 3, description: 'Photo with verifiable date metadata' },
  { type: 'undated_photo_with_pet', basePoints: 10, requiresVerification: true, maxInstances: 2, description: 'Photo without date verification' },
  { type: 'knowledge_test', basePoints: 15, requiresVerification: false, maxInstances: 1, description: 'Knowledge test about the animal' },
  { type: 'witness_statement', basePoints: 10, requiresVerification: true, maxInstances: 2, description: 'Statement from witness' },
  { type: 'social_media_history', basePoints: 10, requiresVerification: true, maxInstances: 1, description: 'Public social media posts' },
  { type: 'other', basePoints: 5, requiresVerification: true, maxInstances: 2, description: 'Other supporting evidence' },
];

export const OWNERSHIP_THRESHOLDS = {
  autoVerify: 85,           // Microchip match = near-auto-approve (still needs hold clear)
  standardApproval: 60,     // Standard moderator can approve
  requiresLeadReview: 40,   // Lead moderator must review
  rejectBelow: 25,          // Insufficient evidence
  disputeOverride: 999,     // Any dispute = requires lead review regardless of score
};

export interface EvidenceScoreEntry {
  evidenceId: string;
  evidenceType: OwnershipEvidenceType;
  baseScore: number;
  adjustments: { reason: string; amount: number }[];
  finalScore: number;
  counted: boolean;  // False if exceeded maxInstances
}

// ═══════════════════════════════════════════════════════════════════
// SPECIFIC EVIDENCE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface MicrochipEvidence {
  chipNumber: string;
  chipFormat?: string;
  lookupMethod: 'manual' | 'api';
  registriesChecked: string[];
  foundInRegistry?: string;
  registeredOwnerMatch: 'confirmed' | 'mismatch' | 'not_found' | 'registry_error';
  
  // PII handling
  piiRetrieved: boolean;
  piiAccessBreakGlassId?: string;
  
  // Evidence
  screenshotRef?: string;
  errorCode?: 'registry_down' | 'captcha' | 'timeout' | 'invalid_format' | 'other';
}

export interface PreregMatchEvidence {
  preregProfileId: string;
  matchScore: number;
  matchedFields: string[];
  profileCreatedAt: string;
  distinctiveMarksMatch: boolean;
  photoSimilarityScore?: number;
}

export interface VetRecordEvidence {
  vetClinicName: string;
  vetClinicPhone?: string;
  recordDate: string;
  animalNameOnRecord: string;
  ownerNameOnRecord: string;
  vetContacted: boolean;
  vetConfirmed?: boolean;
}

export interface PhotoEvidence {
  hasExifData: boolean;
  exifDate?: string;
  exifLocation?: GeoLocation;
  faceMatchScore?: number;
  distinctiveMarksVisible: string[];
}

// ═══════════════════════════════════════════════════════════════════
// KNOWLEDGE TEST
// ═══════════════════════════════════════════════════════════════════

export interface KnowledgeTest {
  id: string;
  claimId: ClaimId;
  
  // Questions recorded BEFORE showing to claimant
  questions: KnowledgeQuestion[];
  
  // Answers recorded separately
  answers: KnowledgeAnswer[];
  
  // Scoring
  totalQuestions: number;
  correctAnswers: number;
  partialCorrect: number;
  score: number;  // 0-100
  
  // Timestamps
  questionsRecordedAt: string;
  questionsRecordedBy: UserId;
  answersRecordedAt?: string;
  answersRecordedBy?: UserId;
}

export interface KnowledgeQuestion {
  id: string;
  question: string;
  expectedAnswer: string;
  answerSource: 'lost_report' | 'prereg_profile' | 'moderator_notes';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface KnowledgeAnswer {
  questionId: string;
  givenAnswer: string;
  recordedAt: string;
  isCorrect: boolean;
  partialCredit: boolean;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION STEPS
// ═══════════════════════════════════════════════════════════════════

export interface OwnershipVerificationStep {
  order: number;
  step: OwnershipVerificationStepType;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  required: boolean;
  completedAt?: string;
  completedBy?: UserId;
  result?: 'pass' | 'fail' | 'inconclusive';
  notes?: string;
  evidenceIds?: string[];
}

export type OwnershipVerificationStepType =
  | 'claimant_identity_verified'
  | 'microchip_scan_requested'
  | 'microchip_lookup_completed'
  | 'vet_records_requested'
  | 'vet_contacted'
  | 'photos_compared'
  | 'distinctive_marks_verified'
  | 'knowledge_test_administered'
  | 'prereg_profile_checked'
  | 'social_media_verified'
  | 'witness_contacted'
  | 'in_person_meeting_scheduled'
  | 'in_person_id_verified'
  | 'law_enforcement_contacted'
  | 'final_review_completed';

// ═══════════════════════════════════════════════════════════════════
// CLAIM DECISION
// ═══════════════════════════════════════════════════════════════════

export interface ClaimDecision {
  decision: 'verified' | 'rejected';
  decidedBy: UserId;
  decidedAt: string;
  reasoning: string;
  evidenceSummary: string;
  scoreAtDecision: number;
  
  // For rejections
  rejectionReason?: RejectionReason;
  
  // For approvals
  conditions?: string[];
  releaseAuthorized: boolean;
  
  // Two-person approval (if required)
  twoPersonApproval?: {
    approver1: UserId;
    approver1At: string;
    approver2: UserId;
    approver2At: string;
  };
}

export type RejectionReason =
  | 'insufficient_evidence'
  | 'evidence_contradicted'
  | 'suspected_fraud'
  | 'failed_knowledge_test'
  | 'dispute_unresolved'
  | 'claimant_withdrew'
  | 'microchip_mismatch'
  | 'id_verification_failed';

// ═══════════════════════════════════════════════════════════════════
// CLAIM REVIEW EVENT
// ═══════════════════════════════════════════════════════════════════

export interface ClaimReviewEvent {
  id: string;
  timestamp: string;
  reviewerId: UserId;
  reviewerRole: RoleId;
  action: ClaimReviewAction;
  details: string;
  previousState?: string;
  newState?: string;
}

export type ClaimReviewAction =
  | 'viewed'
  | 'evidence_added'
  | 'evidence_verified'
  | 'evidence_rejected'
  | 'step_completed'
  | 'step_failed'
  | 'score_calculated'
  | 'score_adjusted'
  | 'hold_set'
  | 'hold_cleared'
  | 'escalated'
  | 'deescalated'
  | 'decision_made'
  | 'decision_appealed';

// ═══════════════════════════════════════════════════════════════════
// ANIMAL RELEASE
// ═══════════════════════════════════════════════════════════════════

export interface AnimalRelease {
  id: string;
  caseId: CaseId;
  claimId: ClaimId;
  
  // Parties
  releasedToUserId: UserId;
  releasedToName: string;
  releasedByUserId: UserId;
  releasedByName: string;
  
  // When/where
  releasedAt: string;
  releaseLocation?: GeoLocation;
  releaseLocationType: 'shelter' | 'foster_home' | 'neutral_location' | 'owner_address' | 'other';
  
  // Verification at release
  idVerifiedAtRelease: boolean;
  idType?: string;
  idLast4?: string;
  photoTakenAtRelease: boolean;
  releasePhotoUrl?: string;
  
  // Animal condition
  animalConditionNotes: string;
  
  // Signatures
  releaseFormSigned: boolean;
  releaseFormUrl?: string;
  
  // Chain of custody
  custodyTransferId?: string;
  
  // Audit
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate evidence score for a claim
 */
export function calculateEvidenceScore(evidence: OwnershipEvidence[]): {
  total: number;
  breakdown: EvidenceScoreEntry[];
} {
  const breakdown: EvidenceScoreEntry[] = [];
  const typeCounts = new Map<OwnershipEvidenceType, number>();
  let total = 0;
  
  // Sort evidence by score (highest first) to count best instances
  const sortedEvidence = [...evidence].sort((a, b) => b.score - a.score);
  
  for (const ev of sortedEvidence) {
    const rule = EVIDENCE_SCORE_RULES.find(r => r.type === ev.type);
    if (!rule) continue;
    
    // Check if we've exceeded max instances
    const currentCount = typeCounts.get(ev.type) || 0;
    const counted = currentCount < rule.maxInstances;
    
    // Only count verified evidence (or evidence that doesn't require verification)
    const isVerified = !rule.requiresVerification || ev.verificationStatus === 'verified';
    
    const adjustments: { reason: string; amount: number }[] = [];
    let finalScore = ev.score;
    
    if (!counted) {
      adjustments.push({ reason: `Exceeded max instances (${rule.maxInstances})`, amount: -ev.score });
      finalScore = 0;
    } else if (!isVerified) {
      adjustments.push({ reason: 'Not yet verified', amount: -ev.score });
      finalScore = 0;
    }
    
    breakdown.push({
      evidenceId: ev.id,
      evidenceType: ev.type,
      baseScore: ev.score,
      adjustments,
      finalScore,
      counted: counted && isVerified,
    });
    
    if (counted && isVerified) {
      total += finalScore;
      typeCounts.set(ev.type, currentCount + 1);
    }
  }
  
  return { total, breakdown };
}

/**
 * Get required verification steps based on evidence and score
 */
export function getRequiredVerificationSteps(claim: OwnershipClaim): OwnershipVerificationStepType[] {
  const steps: OwnershipVerificationStepType[] = ['claimant_identity_verified'];
  
  // Always check for microchip if not already done
  const hasChipEvidence = claim.evidence.some(e => e.type === 'microchip_registration');
  if (!hasChipEvidence) {
    steps.push('microchip_scan_requested');
  }
  
  // Check pre-reg profile
  if (!claim.linkedPreregProfileId) {
    steps.push('prereg_profile_checked');
  }
  
  // Photo comparison
  const hasPhotos = claim.evidence.some(e => 
    e.type === 'dated_photo_with_pet' || e.type === 'undated_photo_with_pet'
  );
  if (hasPhotos) {
    steps.push('photos_compared', 'distinctive_marks_verified');
  }
  
  // Low score = more verification
  if (claim.totalScore < OWNERSHIP_THRESHOLDS.standardApproval) {
    steps.push('knowledge_test_administered');
    if (claim.totalScore < OWNERSHIP_THRESHOLDS.requiresLeadReview) {
      steps.push('vet_contacted');
    }
  }
  
  // Final review always required
  steps.push('final_review_completed');
  
  return steps;
}

/**
 * Determine if hold can be cleared and by whom
 */
export function canClearHold(claim: OwnershipClaim, approverRole: RoleId): {
  allowed: boolean;
  reason: string;
  requiresTwoPerson: boolean;
} {
  // Cannot clear if claim not verified
  if (claim.status !== 'verified') {
    return { allowed: false, reason: 'Claim must be verified before clearing hold', requiresTwoPerson: false };
  }
  
  // Cannot clear if decision doesn't authorize release
  if (!claim.decision?.releaseAuthorized) {
    return { allowed: false, reason: 'Release not authorized in decision', requiresTwoPerson: false };
  }
  
  // Check if two-person required
  const requiresTwoPerson: boolean = 
    claim.totalScore < OWNERSHIP_THRESHOLDS.standardApproval ||
    (claim.disputeStatus !== 'none' && claim.disputeStatus !== undefined) ||
    (claim.competingClaimIds !== undefined && claim.competingClaimIds.length > 0);
  
  // Role-based authorization
  const roleLevel: Record<RoleId, number> = {
    foundation_admin: 100,
    regional_coordinator: 90,
    lead_moderator: 80,
    moderator: 70,
    junior_moderator: 60,
    senior_transporter: 50,
    transporter: 40,
    emergency_foster: 45,
    foster: 40,
    trapper: 45,
    community_volunteer: 30,
    verified_user: 20,
    user: 10,
  };
  
  const minRoleLevel = requiresTwoPerson ? 70 : 70; // Moderator or above
  
  if ((roleLevel[approverRole] || 0) < minRoleLevel) {
    return { 
      allowed: false, 
      reason: `Requires ${requiresTwoPerson ? 'moderator or above' : 'moderator or above'}`,
      requiresTwoPerson,
    };
  }
  
  return { allowed: true, reason: 'Authorized', requiresTwoPerson };
}

/**
 * Check if claim requires two-person clearance
 */
export function requiresTwoPersonClearance(claim: OwnershipClaim): boolean {
  return (
    claim.totalScore < OWNERSHIP_THRESHOLDS.standardApproval ||
    (claim.disputeStatus !== 'none' && claim.disputeStatus !== undefined) ||
    (claim.competingClaimIds && claim.competingClaimIds.length > 0) ||
    claim.releaseHold.reason === 'suspected_fraud'
  );
}

/**
 * Get approval threshold based on score
 */
export function getApprovalThreshold(score: number): {
  canApprove: RoleId[];
  requiresLeadReview: boolean;
  autoReject: boolean;
} {
  if (score < OWNERSHIP_THRESHOLDS.rejectBelow) {
    return {
      canApprove: [],
      requiresLeadReview: true,
      autoReject: true,
    };
  }
  
  if (score < OWNERSHIP_THRESHOLDS.requiresLeadReview) {
    return {
      canApprove: ['lead_moderator', 'regional_coordinator', 'foundation_admin'],
      requiresLeadReview: true,
      autoReject: false,
    };
  }
  
  if (score < OWNERSHIP_THRESHOLDS.standardApproval) {
    return {
      canApprove: ['moderator', 'lead_moderator', 'regional_coordinator', 'foundation_admin'],
      requiresLeadReview: false,
      autoReject: false,
    };
  }
  
  return {
    canApprove: ['moderator', 'lead_moderator', 'regional_coordinator', 'foundation_admin'],
    requiresLeadReview: false,
    autoReject: false,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CLAIM FACTORY
// ═══════════════════════════════════════════════════════════════════

export function createOwnershipClaim(params: {
  caseId: CaseId;
  claimantUserId: UserId;
  claimantIdentity: ClaimantIdentity;
}): OwnershipClaim {
  const now = new Date().toISOString();
  const claimId = crypto.randomUUID() as ClaimId;
  
  return {
    id: claimId,
    caseId: params.caseId,
    claimantUserId: params.claimantUserId,
    claimantIdentity: params.claimantIdentity,
    claimedAt: now,
    status: 'pending',
    releaseHold: {
      status: 'active',
      reason: 'pending_verification',
      setAt: now,
      requiresTwoPersonClearance: false,
    },
    evidence: [],
    totalScore: 0,
    scoreBreakdown: [],
    verificationSteps: [],
    reviewHistory: [],
    audit: {
      createdAt: now,
      createdBy: params.claimantUserId,
      version: 1,
    },
  };
}

/**
 * Add evidence to a claim
 */
export function addEvidence(
  claim: OwnershipClaim,
  evidence: Omit<OwnershipEvidence, 'id' | 'verificationStatus' | 'score' | 'confidence'>
): OwnershipClaim {
  const rule = EVIDENCE_SCORE_RULES.find(r => r.type === evidence.type);
  const baseScore = rule?.basePoints ?? 0;
  
  const newEvidence: OwnershipEvidence = {
    ...evidence,
    id: crypto.randomUUID(),
    verificationStatus: rule?.requiresVerification ? 'pending' : 'verified',
    score: baseScore,
    confidence: 'medium',
  };
  
  const updatedEvidence = [...claim.evidence, newEvidence];
  const { total, breakdown } = calculateEvidenceScore(updatedEvidence);
  
  // Update two-person requirement based on new score
  const requiresTwoPerson = total < OWNERSHIP_THRESHOLDS.standardApproval;
  
  return {
    ...claim,
    evidence: updatedEvidence,
    totalScore: total,
    scoreBreakdown: breakdown,
    scoreCalculatedAt: new Date().toISOString(),
    releaseHold: {
      ...claim.releaseHold,
      requiresTwoPersonClearance: requiresTwoPerson,
    },
    audit: {
      ...claim.audit,
      updatedAt: new Date().toISOString(),
      version: claim.audit.version + 1,
    },
  };
}
