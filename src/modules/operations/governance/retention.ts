/**
 * OPERATIONS MODULE - DATA RETENTION POLICIES
 * 
 * Manages data lifecycle including archival, anonymization, and deletion.
 * Supports GDPR erasure requests and legal holds.
 */

import type { UserId, CaseId, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// DATA TYPES
// ═══════════════════════════════════════════════════════════════════

export type DataType =
  | 'active_case'
  | 'closed_case'
  | 'archived_case'
  | 'volunteer_application_approved'
  | 'volunteer_application_rejected'
  | 'volunteer_profile'
  | 'background_check'
  | 'incident_report'
  | 'ownership_claim'
  | 'field_operation_location'
  | 'audit_log'
  | 'break_glass_log'
  | 'communication_log'
  | 'service_hours'
  | 'consent_record'
  | 'waiver_signature';

export type ArchiveBehavior = 
  | 'ui_archive_match_active'       // Hidden from UI, still matchable
  | 'ui_archive_match_manual_only'  // Hidden, only manual search
  | 'cold_storage'                  // Moved to archive storage
  | 'anonymize_match_minimal';      // PII removed, feature hashes retained

// ═══════════════════════════════════════════════════════════════════
// RETENTION POLICY
// ═══════════════════════════════════════════════════════════════════

export interface DataRetentionPolicy {
  dataType: DataType;
  retentionDays: number;
  anonymizeAfterDays?: number;
  archiveBehavior: ArchiveBehavior;
  legalHoldOverride: boolean;
  gdprApplicable: boolean;
  deletionMethod: 'hard_delete' | 'soft_delete' | 'anonymize';
  description: string;
}

export const DATA_RETENTION_POLICIES: DataRetentionPolicy[] = [
  {
    dataType: 'active_case',
    retentionDays: 9999,  // Never auto-delete active
    archiveBehavior: 'ui_archive_match_active',
    legalHoldOverride: true,
    gdprApplicable: true,
    deletionMethod: 'anonymize',
    description: 'Active cases retained until closed',
  },
  {
    dataType: 'closed_case',
    retentionDays: 2555,  // 7 years
    anonymizeAfterDays: 365,
    archiveBehavior: 'ui_archive_match_active',
    legalHoldOverride: true,
    gdprApplicable: true,
    deletionMethod: 'anonymize',
    description: 'Closed cases retained for matching and legal compliance',
  },
  {
    dataType: 'archived_case',
    retentionDays: 2555,  // 7 years
    anonymizeAfterDays: 180,
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: true,
    deletionMethod: 'anonymize',
    description: 'Archived cases in cold storage',
  },
  {
    dataType: 'volunteer_application_approved',
    retentionDays: 2555,  // 7 years
    anonymizeAfterDays: 730,  // 2 years
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: true,
    deletionMethod: 'anonymize',
    description: 'Approved applications retained for compliance',
  },
  {
    dataType: 'volunteer_application_rejected',
    retentionDays: 365,
    anonymizeAfterDays: 180,
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: true,
    deletionMethod: 'anonymize',
    description: 'Rejected applications retained briefly for appeals',
  },
  {
    dataType: 'volunteer_profile',
    retentionDays: 2555,  // 7 years after deactivation
    anonymizeAfterDays: 365,
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: true,
    deletionMethod: 'anonymize',
    description: 'Volunteer profiles retained for compliance',
  },
  {
    dataType: 'background_check',
    retentionDays: 365,
    anonymizeAfterDays: 30,
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: true,
    deletionMethod: 'anonymize',
    description: 'Background checks - keep result, remove details quickly',
  },
  {
    dataType: 'incident_report',
    retentionDays: 2555,  // 7 years
    anonymizeAfterDays: 730,
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: false,
    deletionMethod: 'soft_delete',
    description: 'Incident reports retained for safety and legal',
  },
  {
    dataType: 'ownership_claim',
    retentionDays: 2555,  // 7 years
    anonymizeAfterDays: 365,
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: true,
    deletionMethod: 'anonymize',
    description: 'Ownership claims retained for disputes',
  },
  {
    dataType: 'field_operation_location',
    retentionDays: 30,
    archiveBehavior: 'anonymize_match_minimal',
    legalHoldOverride: false,  // Privacy trumps legal hold for location
    gdprApplicable: true,
    deletionMethod: 'hard_delete',
    description: 'Location data deleted quickly for privacy',
  },
  {
    dataType: 'audit_log',
    retentionDays: 2555,  // 7 years
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: false,
    deletionMethod: 'soft_delete',
    description: 'Audit logs retained for compliance',
  },
  {
    dataType: 'break_glass_log',
    retentionDays: 2555,  // 7 years
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: false,
    deletionMethod: 'soft_delete',
    description: 'Break glass logs critical for accountability',
  },
  {
    dataType: 'communication_log',
    retentionDays: 365,
    anonymizeAfterDays: 90,
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: true,
    deletionMethod: 'anonymize',
    description: 'Communication logs retained for disputes',
  },
  {
    dataType: 'service_hours',
    retentionDays: 2555,  // 7 years
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: false,
    deletionMethod: 'soft_delete',
    description: 'Service hours retained for recognition',
  },
  {
    dataType: 'consent_record',
    retentionDays: 2555,  // 7 years
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: false,
    deletionMethod: 'soft_delete',
    description: 'Consent records retained for compliance proof',
  },
  {
    dataType: 'waiver_signature',
    retentionDays: 2555,  // 7 years
    archiveBehavior: 'cold_storage',
    legalHoldOverride: true,
    gdprApplicable: false,
    deletionMethod: 'soft_delete',
    description: 'Waivers retained for legal protection',
  },
];

// ═══════════════════════════════════════════════════════════════════
// DATA DELETION REQUEST
// ═══════════════════════════════════════════════════════════════════

export interface DataDeletionRequest {
  id: string;
  requestedBy: UserId;
  requestedAt: string;
  requestType: DeletionRequestType;
  
  // Subject
  subjectUserId?: UserId;
  subjectEmail?: string;
  
  // Scope
  scope: 'full_deletion' | 'pii_only' | 'specific_records';
  specificRecordIds?: string[];
  specificDataTypes?: DataType[];
  
  // Processing
  status: DeletionRequestStatus;
  processedAt?: string;
  processedBy?: UserId;
  
  // Results
  recordsAffected?: number;
  recordsAnonymized?: number;
  recordsDeleted?: number;
  recordsRetainedWithReason?: { recordId: string; reason: string }[];
  
  // Denial
  deniedAt?: string;
  deniedBy?: UserId;
  denialReason?: string;
  
  // Legal hold blocks
  blockedByLegalHold?: boolean;
  legalHoldIds?: string[];
  
  // Audit
  audit: AuditMetadata;
}

export type DeletionRequestType = 
  | 'gdpr_erasure'
  | 'user_requested'
  | 'policy_expiration'
  | 'legal_order';

export type DeletionRequestStatus = 
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'partially_completed'
  | 'denied'
  | 'blocked_legal_hold';

// ═══════════════════════════════════════════════════════════════════
// LEGAL HOLD
// ═══════════════════════════════════════════════════════════════════

export interface LegalHold {
  id: string;
  name: string;
  description: string;
  
  // Scope
  scope: LegalHoldScope;
  caseIds?: CaseId[];
  userIds?: UserId[];
  dataTypes?: DataType[];
  dateRangeStart?: string;
  dateRangeEnd?: string;
  
  // Timeline
  createdAt: string;
  createdBy: UserId;
  expiresAt?: string;
  indefinite: boolean;
  
  // External reference
  externalReference?: string;
  legalContact?: string;
  
  // Status
  status: 'active' | 'released' | 'expired';
  releasedAt?: string;
  releasedBy?: UserId;
  releaseReason?: string;
  
  // Two-person approval
  approvers: { userId: UserId; approvedAt: string }[];
  
  // Audit
  audit: AuditMetadata;
}

export type LegalHoldScope = 
  | 'specific_cases'
  | 'specific_users'
  | 'date_range'
  | 'data_type'
  | 'global';

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get retention policy for a data type
 */
export function getRetentionPolicy(dataType: DataType): DataRetentionPolicy | undefined {
  return DATA_RETENTION_POLICIES.find(p => p.dataType === dataType);
}

/**
 * Check if data should be retained based on policy
 */
export function shouldRetainData(
  dataType: DataType,
  createdAt: string,
  hasLegalHold: boolean
): { retain: boolean; reason: string; action?: 'keep' | 'anonymize' | 'archive' | 'delete' } {
  const policy = getRetentionPolicy(dataType);
  if (!policy) {
    return { retain: true, reason: 'No policy defined - retain by default' };
  }
  
  const ageInDays = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Legal hold overrides
  if (hasLegalHold && policy.legalHoldOverride) {
    return { retain: true, reason: 'Legal hold active', action: 'keep' };
  }
  
  // Check anonymization threshold
  if (policy.anonymizeAfterDays && ageInDays >= policy.anonymizeAfterDays && ageInDays < policy.retentionDays) {
    return { retain: true, reason: 'Due for anonymization', action: 'anonymize' };
  }
  
  // Check retention threshold
  if (ageInDays >= policy.retentionDays) {
    return { 
      retain: false, 
      reason: `Exceeded retention period (${policy.retentionDays} days)`,
      action: policy.deletionMethod === 'hard_delete' ? 'delete' : 'archive',
    };
  }
  
  return { retain: true, reason: 'Within retention period', action: 'keep' };
}

/**
 * Check if deletion request can proceed
 */
export function canProcessDeletionRequest(
  request: DataDeletionRequest,
  activeLegalHolds: LegalHold[]
): { canProcess: boolean; blockers: string[] } {
  const blockers: string[] = [];
  
  // Check for active legal holds
  const relevantHolds = activeLegalHolds.filter(hold => {
    if (hold.status !== 'active') return false;
    
    if (request.subjectUserId && hold.userIds?.includes(request.subjectUserId)) {
      return true;
    }
    
    if (request.specificRecordIds && hold.caseIds) {
      const overlap = request.specificRecordIds.some(id => 
        hold.caseIds!.includes(id as CaseId)
      );
      if (overlap) return true;
    }
    
    if (request.specificDataTypes && hold.dataTypes) {
      const overlap = request.specificDataTypes.some(dt => 
        hold.dataTypes!.includes(dt)
      );
      if (overlap) return true;
    }
    
    if (hold.scope === 'global') return true;
    
    return false;
  });
  
  if (relevantHolds.length > 0) {
    blockers.push(`Blocked by ${relevantHolds.length} legal hold(s): ${relevantHolds.map(h => h.id).join(', ')}`);
  }
  
  // Check for non-GDPR data in GDPR request
  if (request.requestType === 'gdpr_erasure' && request.specificDataTypes) {
    const nonGdprTypes = request.specificDataTypes.filter(dt => {
      const policy = getRetentionPolicy(dt);
      return policy && !policy.gdprApplicable;
    });
    
    if (nonGdprTypes.length > 0) {
      blockers.push(`Data types not subject to GDPR erasure: ${nonGdprTypes.join(', ')}`);
    }
  }
  
  return {
    canProcess: blockers.length === 0,
    blockers,
  };
}

/**
 * Get records due for retention action
 */
export function getRecordsDueForAction(
  records: { id: string; dataType: DataType; createdAt: string; hasLegalHold: boolean }[]
): {
  toAnonymize: string[];
  toArchive: string[];
  toDelete: string[];
} {
  const result = {
    toAnonymize: [] as string[],
    toArchive: [] as string[],
    toDelete: [] as string[],
  };
  
  for (const record of records) {
    const status = shouldRetainData(record.dataType, record.createdAt, record.hasLegalHold);
    
    switch (status.action) {
      case 'anonymize':
        result.toAnonymize.push(record.id);
        break;
      case 'archive':
        result.toArchive.push(record.id);
        break;
      case 'delete':
        result.toDelete.push(record.id);
        break;
    }
  }
  
  return result;
}
