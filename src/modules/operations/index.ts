/**
 * Mayday OPERATIONS MODULE
 * 
 * Enterprise-grade volunteer coordination, case handling, and safety protocols.
 * 
 * Core Principles:
 * - AUDIT-SAFE: All state changes emit events and are logged
 * - LEGALLY DEFENSIBLE: Deterministic scoring, two-person approvals, break-glass access
 * - OPERATIONALLY ROBUST: Clear SOPs, escalation paths, and failsafes
 * - PRIVACY BY DESIGN: Consent-based location tracking, data TTLs, GDPR support
 * 
 * Key Features:
 * - Role hierarchy with 14 roles and 70+ permissions
 * - No destructive deletes (archive/redact/legal_hold only)
 * - Two-person approval for high-impact actions
 * - Break-glass access for PII with audit trail
 * - Owner verification scoring system (deterministic, not subjective)
 * - Lone worker safety protocols with escalation
 * - Standard Operating Procedures (SOPs) with attestation
 * - Data retention policies with legal hold support
 * 
 * @module operations
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export * from './types';

// ═══════════════════════════════════════════════════════════════════
// ROLES & PERMISSIONS
// ═══════════════════════════════════════════════════════════════════

export {
  // Definitions
  ROLE_DEFINITIONS,
  getRoleDefinition,
  getRolesByCategory,
  getRoleLevel,
  outranks,
  getReportingChain,
  canRoleApprove,
  getRequiredWaivers,
  getRequiredTrainingModules,
  
  // Assignments
  ROLE_CONFLICTS,
  checkRoleConflict,
  getEffectivePermissions,
  getHighestRole,
  getPrimaryRole,
  buildUserRoleSet,
  validateRoleAssignment,
  createRoleAssignment,
  suspendRoleAssignment,
  revokeRoleAssignment,
  reinstateRoleAssignment,
  renewRoleAssignment,
  checkExpiration,
  
  // Permissions
  TWO_PERSON_RULES,
  BREAK_GLASS_PERMISSIONS,
  BREAK_GLASS_CONFIG,
  requiresBreakGlass,
  getBreakGlassScopes,
  createBreakGlassRequest,
  isBreakGlassValid,
  getTwoPersonRule,
  requiresTwoPersonApproval,
  createTwoPersonApprovalRequest,
  isTwoPersonApprovalSatisfied,
  checkPermission,
  explainPermission,
  checkPermissions,
  hasAllPermissions,
  hasAnyPermission,
} from './roles';

export type {
  PermissionId,
  RoleId,
  RoleCategory,
  RoleDefinition,
  UserRoleAssignment,
  UserRoleSet,
  RoleConflict,
  AssignmentValidation,
  AssignRoleParams,
  SuspendRoleParams,
  RevokeRoleParams,
  ActionContext,
  PermissionCheck,
  PermissionDecision,
  PermissionCheckResult,
  TwoPersonRule,
  BreakGlassScope,
  BreakGlassReasonCode,
  BreakGlassRequest,
  TwoPersonApprovalRequest,
  PermissionExplanation,
} from './roles';

// ═══════════════════════════════════════════════════════════════════
// SAFETY
// ═══════════════════════════════════════════════════════════════════

export {
  // Verification
  EVIDENCE_SCORE_RULES,
  OWNERSHIP_THRESHOLDS,
  calculateEvidenceScore,
  getRequiredVerificationSteps,
  canClearHold,
  requiresTwoPersonClearance,
  getApprovalThreshold,
  createOwnershipClaim,
  addEvidence,
  
  // Protocols
  LONE_WORKER_POLICY,
  FIELD_OPERATION_POLICIES,
  LOCATION_CONSENT_VERSION,
  getTaskPolicy,
  isCheckInOverdue,
  minutesSinceLastCheckIn,
  getEscalationAction,
  requiresBuddy,
  isLocationConsentValid,
  createFieldOperation,
  recordCheckIn,
  recordEscalation,
  completeFieldOperation,
} from './safety';

export type {
  // Verification types
  OwnershipClaim,
  ClaimStatus,
  DisputeStatus,
  ReleaseHold,
  ReleaseHoldReason,
  ClaimantIdentity,
  OwnershipEvidence,
  OwnershipEvidenceType,
  EvidenceScoreRule,
  EvidenceScoreEntry,
  MicrochipEvidence,
  PreregMatchEvidence,
  VetRecordEvidence,
  PhotoEvidence,
  KnowledgeTest,
  KnowledgeQuestion,
  KnowledgeAnswer,
  OwnershipVerificationStep,
  OwnershipVerificationStepType,
  ClaimDecision,
  RejectionReason,
  ClaimReviewEvent,
  ClaimReviewAction,
  AnimalRelease,
  
  // Protocol types
  FieldOperation,
  FieldTaskType,
  FieldOperationStatus,
  EscalationLevel,
  LocationConsent,
  CheckInEvent,
  EscalationEvent,
  EscalationTrigger,
  FieldOperationPolicy,
} from './safety';

// ═══════════════════════════════════════════════════════════════════
// GOVERNANCE
// ═══════════════════════════════════════════════════════════════════

export {
  // SOPs
  STANDARD_PROCEDURES,
  getProceduresByCategory,
  getProceduresForRole,
  getProcedure,
  getRequiredSteps,
  canExecuteProcedure,
  hasValidAttestation,
  getMissingAttestations,
  
  // Retention
  DATA_RETENTION_POLICIES,
  getRetentionPolicy,
  shouldRetainData,
  canProcessDeletionRequest,
  getRecordsDueForAction,
} from './governance';

export type {
  // SOP types
  Procedure,
  ProcedureStep,
  SopCategory,
  SopAttestation,
  
  // Retention types
  DataType,
  ArchiveBehavior,
  DataRetentionPolicy,
  DataDeletionRequest,
  DeletionRequestType,
  DeletionRequestStatus,
  LegalHold,
  LegalHoldScope,
} from './governance';

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

export {
  OPERATIONS_POLICY,
  REGIONAL_OVERRIDES,
  getEffectivePolicy,
  getPolicyValue,
  validatePolicy,
} from './config';

export type {
  RegionalOverride,
  PolicyValidation,
} from './config';

// ═══════════════════════════════════════════════════════════════════
// APPLICATION
// ═══════════════════════════════════════════════════════════════════

export * from './application';

// ═══════════════════════════════════════════════════════════════════
// VOLUNTEERS
// ═══════════════════════════════════════════════════════════════════

export * from './volunteers';

// ═══════════════════════════════════════════════════════════════════
// LOGISTICS
// ═══════════════════════════════════════════════════════════════════

export * from './logistics';

// ═══════════════════════════════════════════════════════════════════
// CASES
// ═══════════════════════════════════════════════════════════════════

export * from './cases';

// ═══════════════════════════════════════════════════════════════════
// COMMUNICATION
// ═══════════════════════════════════════════════════════════════════

export * from './communication';

// ═══════════════════════════════════════════════════════════════════
// INTEGRATIONS
// ═══════════════════════════════════════════════════════════════════

export * from './integrations';

// ═══════════════════════════════════════════════════════════════════
// TRAINING
// ═══════════════════════════════════════════════════════════════════

export * from './training';

// ═══════════════════════════════════════════════════════════════════
// MODULE VERSION
// ═══════════════════════════════════════════════════════════════════

export const OPERATIONS_MODULE_VERSION = '1.0.0';
export const OPERATIONS_MODULE_BUILD_DATE = '2026-01-11';
