/**
 * OPERATIONS MODULE - DOMAIN EVENTS
 * 
 * All state changes emit domain events for audit trail and event sourcing.
 * Events are the source of truth; projections are derived.
 */

import type { UserId, CaseId, ClaimId, IncidentId, ApplicationId, DispatchId } from './common';

// ═══════════════════════════════════════════════════════════════════
// BASE EVENT STRUCTURE
// ═══════════════════════════════════════════════════════════════════

export interface DomainEvent<T extends string = string, P = Record<string, unknown>> {
  id: string;
  aggregateType: AggregateType;
  aggregateId: string;
  eventType: T;
  version: number;
  occurredAt: string;
  causedBy: UserId;
  correlationId?: string;
  causationId?: string;  // ID of event that caused this event
  metadata: EventMetadata;
  payload: P;
}

export type AggregateType = 
  | 'volunteer'
  | 'application'
  | 'case'
  | 'claim'
  | 'incident'
  | 'asset'
  | 'dispatch'
  | 'field_operation'
  | 'training'
  | 'shift';

export interface EventMetadata {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  traceId?: string;
  environment: 'production' | 'staging' | 'development';
  moduleVersion: string;
}

// ═══════════════════════════════════════════════════════════════════
// VOLUNTEER EVENTS
// ═══════════════════════════════════════════════════════════════════

export type VolunteerEventType =
  | 'VolunteerApplicationSubmitted'
  | 'VolunteerApplicationApproved'
  | 'VolunteerApplicationRejected'
  | 'VolunteerApplicationWithdrawn'
  | 'VolunteerRoleAssigned'
  | 'VolunteerRoleSuspended'
  | 'VolunteerRoleRevoked'
  | 'VolunteerRoleReinstated'
  | 'VolunteerRoleExpired'
  | 'VolunteerRoleRenewed'
  | 'VolunteerStatusChanged'
  | 'VolunteerProfileUpdated'
  | 'VolunteerAvailabilityUpdated'
  | 'VolunteerTrainingCompleted'
  | 'VolunteerTrainingExpired'
  | 'VolunteerIncidentReported'
  | 'VolunteerEndorsementReceived'
  | 'VolunteerConcernRaised'
  | 'VolunteerBadgeAwarded'
  | 'VolunteerWaiverSigned'
  | 'VolunteerBackgroundCheckInitiated'
  | 'VolunteerBackgroundCheckCompleted'
  | 'Volunteer2FAEnabled'
  | 'Volunteer2FADisabled';

export interface VolunteerApplicationSubmittedPayload {
  applicationId: ApplicationId;
  roleId: string;
  personalInfo: { name: string; email: string };
}

export interface VolunteerApplicationApprovedPayload {
  applicationId: ApplicationId;
  roleId: string;
  approvedBy: UserId;
  approvalNotes?: string;
  effectiveDate: string;
}

export interface VolunteerApplicationRejectedPayload {
  applicationId: ApplicationId;
  roleId: string;
  rejectedBy: UserId;
  rejectionReason: string;
  appealDeadline?: string;
}

export interface VolunteerRoleAssignedPayload {
  roleId: string;
  isPrimary: boolean;
  grantedBy: UserId;
  grantReason?: string;
  regionIds?: string[];
  expiresAt?: string;
}

export interface VolunteerRoleSuspendedPayload {
  roleId: string;
  suspendedBy: UserId;
  suspensionReason: string;
  suspensionEndsAt?: string;
  requiresRetraining: boolean;
  twoPersonApproval: { approver1: UserId; approver2: UserId };
}

export interface VolunteerRoleRevokedPayload {
  roleId: string;
  revokedBy: UserId;
  revocationReason: string;
  permanentBan: boolean;
  twoPersonApproval: { approver1: UserId; approver2: UserId };
}

export interface VolunteerStatusChangedPayload {
  previousStatus: string;
  newStatus: string;
  reason?: string;
  autoReactivateAt?: string;
}

export interface VolunteerTrainingCompletedPayload {
  trainingModuleId: string;
  score?: number;
  passedAt: string;
  certificateUrl?: string;
  expiresAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CASE EVENTS
// ═══════════════════════════════════════════════════════════════════

export type CaseEventType =
  | 'CaseCreated'
  | 'CaseTriaged'
  | 'CaseAssigned'
  | 'CaseReassigned'
  | 'CaseEscalated'
  | 'CaseDeescalated'
  | 'CasePriorityChanged'
  | 'CaseStatusChanged'
  | 'CaseNoteAdded'
  | 'CaseHandoffInitiated'
  | 'CaseHandoffAcknowledged'
  | 'CaseHandoffCompleted'
  | 'CaseHandoffExpired'
  | 'CaseMatchSuggested'
  | 'CaseMatchVerified'
  | 'CaseMatchRejected'
  | 'CaseResolved'
  | 'CaseReopened'
  | 'CaseArchived'
  | 'CaseUnarchived'
  | 'CasePiiRedacted'
  | 'CaseLegalHoldApplied'
  | 'CaseLegalHoldReleased'
  | 'CaseColdStorageMoved';

export interface CaseCreatedPayload {
  caseType: 'lost' | 'found' | 'sighting';
  species: string;
  location: { lat: number; lng: number; county: string };
  reportedBy: UserId;
  urgencyLevel: string;
}

export interface CaseTriagedPayload {
  triagedBy: UserId;
  priority: string;
  assignmentRecommendation?: UserId;
  triageNotes?: string;
  slaDeadline: string;
}

export interface CaseAssignedPayload {
  assignedTo: UserId;
  assignedBy: UserId;
  assignmentReason?: string;
  expectedCompletionAt?: string;
}

export interface CaseEscalatedPayload {
  escalatedTo: string;  // Role or user
  escalatedBy: UserId;
  escalationReason: string;
  previousPriority: string;
  newPriority: string;
}

export interface CaseHandoffInitiatedPayload {
  handoffId: string;
  fromUserId: UserId;
  toUserId: UserId;
  briefingNotes: string;
  pendingActions: string[];
  deadline: string;
}

export interface CaseHandoffAcknowledgedPayload {
  handoffId: string;
  acknowledgedBy: UserId;
  acknowledgedAt: string;
}

export interface CaseResolvedPayload {
  resolution: 'reunited' | 'adopted' | 'returned_to_owner' | 'deceased' | 'unable_to_locate' | 'duplicate' | 'withdrawn';
  resolvedBy: UserId;
  resolutionNotes?: string;
  relatedClaimId?: ClaimId;
}

export interface CaseArchivedPayload {
  archivedBy: UserId;
  archiveReason: string;
  retainForMatching: boolean;
  scheduledPurgeAt?: string;
}

export interface CasePiiRedactedPayload {
  redactedBy: UserId;
  redactionReason: string;
  fieldsRedacted: string[];
  breakGlassId?: string;
}

export interface CaseLegalHoldAppliedPayload {
  appliedBy: UserId;
  legalHoldId: string;
  reason: string;
  externalReference?: string;
  indefinite: boolean;
  expiresAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION EVENTS
// ═══════════════════════════════════════════════════════════════════

export type VerificationEventType =
  | 'OwnershipClaimCreated'
  | 'OwnershipEvidenceAdded'
  | 'OwnershipEvidenceVerified'
  | 'OwnershipEvidenceRejected'
  | 'OwnershipScoreCalculated'
  | 'OwnershipVerificationStepCompleted'
  | 'OwnershipKnowledgeTestAdministered'
  | 'OwnershipClaimVerified'
  | 'OwnershipClaimRejected'
  | 'OwnershipClaimDisputed'
  | 'OwnershipDisputeResolved'
  | 'ReleaseHoldSet'
  | 'ReleaseHoldCleared'
  | 'AnimalReleaseAuthorized'
  | 'AnimalReleaseCompleted';

export interface OwnershipClaimCreatedPayload {
  claimId: ClaimId;
  caseId: CaseId;
  claimantUserId: UserId;
  claimantName: string;
}

export interface OwnershipEvidenceAddedPayload {
  claimId: ClaimId;
  evidenceId: string;
  evidenceType: string;
  baseScore: number;
}

export interface OwnershipEvidenceVerifiedPayload {
  claimId: ClaimId;
  evidenceId: string;
  verifiedBy: UserId;
  verificationNotes?: string;
  finalScore: number;
}

export interface OwnershipScoreCalculatedPayload {
  claimId: ClaimId;
  totalScore: number;
  breakdown: { evidenceType: string; score: number }[];
  meetsThreshold: boolean;
  thresholdUsed: number;
}

export interface ReleaseHoldSetPayload {
  claimId: ClaimId;
  holdReason: string;
  setBy: UserId;
  requiresTwoPersonClearance: boolean;
}

export interface ReleaseHoldClearedPayload {
  claimId: ClaimId;
  clearedBy: UserId;
  clearanceReason: string;
  twoPersonApproval?: { approver1: UserId; approver2: UserId; approvedAt: string };
}

export interface AnimalReleaseCompletedPayload {
  claimId: ClaimId;
  caseId: CaseId;
  releasedTo: UserId;
  releasedBy: UserId;
  releaseLocation: { lat: number; lng: number };
  idVerifiedAtRelease: boolean;
  photoTaken: boolean;
  releaseFormSigned: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// SAFETY EVENTS
// ═══════════════════════════════════════════════════════════════════

export type SafetyEventType =
  | 'FieldOperationStarted'
  | 'FieldOperationCheckIn'
  | 'FieldOperationCheckInMissed'
  | 'FieldOperationEscalated'
  | 'FieldOperationCompleted'
  | 'FieldOperationCancelled'
  | 'EmergencyContactNotified'
  | 'IncidentReported'
  | 'IncidentInvestigationStarted'
  | 'IncidentResolved'
  | 'SafetyAlertTriggered';

export interface FieldOperationStartedPayload {
  operationId: string;
  volunteerId: UserId;
  caseId?: CaseId;
  taskType: string;
  startLocation: { lat: number; lng: number };
  destinationLocation?: { lat: number; lng: number };
  checkInIntervalMinutes: number;
  buddyUserId?: UserId;
  locationConsentVersion: string;
}

export interface FieldOperationCheckInPayload {
  operationId: string;
  location: { lat: number; lng: number };
  status: 'ok' | 'need_assistance' | 'emergency';
  notes?: string;
}

export interface FieldOperationCheckInMissedPayload {
  operationId: string;
  expectedAt: string;
  missedCount: number;
  escalationLevel: number;
}

export interface FieldOperationEscalatedPayload {
  operationId: string;
  escalationLevel: number;
  action: string;
  contactedParty?: string;
  response?: string;
}

export interface IncidentReportedPayload {
  incidentId: IncidentId;
  incidentType: string;
  severity: string;
  reportedBy: UserId;
  involvedParties: UserId[];
  description: string;
  relatedCaseId?: CaseId;
}

// ═══════════════════════════════════════════════════════════════════
// DISPATCH EVENTS
// ═══════════════════════════════════════════════════════════════════

export type DispatchEventType =
  | 'DispatchRequested'
  | 'DispatchAssigned'
  | 'DispatchAccepted'
  | 'DispatchDeclined'
  | 'DispatchEnRoute'
  | 'DispatchArrived'
  | 'DispatchCompleted'
  | 'DispatchCancelled'
  | 'DispatchEscalated';

export interface DispatchRequestedPayload {
  dispatchId: DispatchId;
  caseId: CaseId;
  taskType: string;
  location: { lat: number; lng: number };
  urgency: string;
  requiredCapabilities: string[];
  requestedBy: UserId;
}

export interface DispatchAssignedPayload {
  dispatchId: DispatchId;
  assignedTo: UserId;
  assignedBy: UserId | 'auto';
  estimatedArrivalMinutes?: number;
  distanceKm?: number;
}

export interface DispatchAcceptedPayload {
  dispatchId: DispatchId;
  acceptedBy: UserId;
  estimatedArrivalMinutes: number;
}

export interface DispatchCompletedPayload {
  dispatchId: DispatchId;
  completedBy: UserId;
  outcome: string;
  durationMinutes: number;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT EVENTS
// ═══════════════════════════════════════════════════════════════════

export type AuditEventType =
  | 'PermissionChecked'
  | 'PermissionDenied'
  | 'BreakGlassRequested'
  | 'BreakGlassGranted'
  | 'BreakGlassUsed'
  | 'BreakGlassExpired'
  | 'TwoPersonApprovalRequested'
  | 'TwoPersonApprovalGranted'
  | 'TwoPersonApprovalDenied'
  | 'DataExported'
  | 'DataRetentionPolicyApplied'
  | 'DataAnonymized'
  | 'DataPurged';

export interface BreakGlassRequestedPayload {
  breakGlassId: string;
  requesterId: UserId;
  scopes: string[];
  reasonCode: string;
  justification: string;
  caseId?: CaseId;
  expiresAt: string;
}

export interface BreakGlassUsedPayload {
  breakGlassId: string;
  userId: UserId;
  resourceType: string;
  resourceId: string;
  accessType: 'read' | 'write';
}

export interface TwoPersonApprovalRequestedPayload {
  approvalId: string;
  action: string;
  requestedBy: UserId;
  targetResourceId: string;
  requiredApprovers: number;
  approverRoles: string[];
  timeoutAt: string;
}

export interface TwoPersonApprovalGrantedPayload {
  approvalId: string;
  approvers: { userId: UserId; approvedAt: string }[];
}

// ═══════════════════════════════════════════════════════════════════
// EVENT STORE INTERFACE
// ═══════════════════════════════════════════════════════════════════

export interface EventStore {
  append<T extends string, P>(event: DomainEvent<T, P>): Promise<void>;
  getByAggregate(aggregateType: AggregateType, aggregateId: string): Promise<DomainEvent[]>;
  getByCorrelation(correlationId: string): Promise<DomainEvent[]>;
  getByTimeRange(start: string, end: string, aggregateType?: AggregateType): Promise<DomainEvent[]>;
}

// ═══════════════════════════════════════════════════════════════════
// EVENT FACTORY
// ═══════════════════════════════════════════════════════════════════

export function createEvent<T extends string, P>(
  aggregateType: AggregateType,
  aggregateId: string,
  eventType: T,
  payload: P,
  causedBy: UserId,
  options?: {
    correlationId?: string;
    causationId?: string;
    version?: number;
  }
): DomainEvent<T, P> {
  return {
    id: crypto.randomUUID(),
    aggregateType,
    aggregateId,
    eventType,
    version: options?.version ?? 1,
    occurredAt: new Date().toISOString(),
    causedBy,
    correlationId: options?.correlationId,
    causationId: options?.causationId,
    metadata: {
      environment: (process.env.NODE_ENV as 'production' | 'staging' | 'development') || 'development',
      moduleVersion: '1.0.0',
    },
    payload,
  };
}
