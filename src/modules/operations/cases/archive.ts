/**
 * OPERATIONS MODULE - CASE ARCHIVE
 * 
 * Archival, cold storage, and anonymization for cases.
 */

import type { UserId, AuditMetadata } from '../types';
import type { Case, CaseStatus } from './lifecycle';

// ═══════════════════════════════════════════════════════════════════
// ARCHIVE TYPES
// ═══════════════════════════════════════════════════════════════════

export type ArchiveStatus = 
  | 'active'              // Not archived
  | 'ui_archived'         // Hidden from default views, still matchable
  | 'cold_storage'        // Moved to long-term storage
  | 'anonymized'          // PII removed
  | 'legal_hold'          // Frozen for legal preservation
  | 'deleted';            // Soft deleted (never hard delete)

export type AnonymizationLevel = 
  | 'none'
  | 'partial'             // Some PII removed
  | 'full'                // All PII removed
  | 'feature_only';       // Only feature hashes retained

export interface ArchivedCase {
  id: string;
  originalCaseId: string;
  caseNumber: string;
  
  // Archive status
  archiveStatus: ArchiveStatus;
  archiveReason: ArchiveReason;
  
  // Timing
  archivedAt: string;
  archivedBy: UserId;
  scheduledDeletionAt?: string;
  
  // Anonymization
  anonymizationLevel: AnonymizationLevel;
  anonymizedAt?: string;
  anonymizedBy?: UserId;
  fieldsAnonymized?: string[];
  
  // Searchability
  isSearchable: boolean;
  isMatchable: boolean;
  searchableUntil?: string;
  
  // Legal hold
  legalHold: boolean;
  legalHoldSetAt?: string;
  legalHoldSetBy?: UserId;
  legalHoldReason?: string;
  legalHoldReference?: string;
  legalHoldReleasedAt?: string;
  legalHoldReleasedBy?: UserId;
  
  // Storage
  storageLocation: 'primary' | 'cold' | 'archive';
  storageReference?: string;
  
  // Retention
  retentionPolicy: string;
  retentionExpiresAt?: string;
  
  // Owner opt-out
  ownerOptedOutOfMatching: boolean;
  ownerOptOutAt?: string;
  
  // Metadata retained for matching
  featureHashes?: {
    speciesHash?: string;
    colorHash?: string;
    markingsHash?: string;
    locationHash?: string;
    dateHash?: string;
  };
  
  // Original case summary (non-PII)
  summary: {
    caseType: string;
    resolution?: string;
    createdAt: string;
    resolvedAt?: string;
    durationDays: number;
  };
  
  audit: AuditMetadata;
}

export type ArchiveReason = 
  | 'case_resolved'
  | 'case_closed'
  | 'time_based'
  | 'owner_request'
  | 'gdpr_request'
  | 'policy_expiration'
  | 'legal_requirement'
  | 'manual_archive';

// ═══════════════════════════════════════════════════════════════════
// ARCHIVE POLICY
// ═══════════════════════════════════════════════════════════════════

export interface ArchivePolicy {
  caseType: string;
  daysUntilUIArchive: number;
  daysUntilColdStorage: number;
  daysUntilAnonymization: number;
  daysUntilDeletion?: number;
  retainForMatching: boolean;
  matchingRetentionDays?: number;
}

export const ARCHIVE_POLICIES: ArchivePolicy[] = [
  {
    caseType: 'lost_pet',
    daysUntilUIArchive: 90,
    daysUntilColdStorage: 365,
    daysUntilAnonymization: 730,
    retainForMatching: true,
    matchingRetentionDays: 2555, // 7 years
  },
  {
    caseType: 'found_pet',
    daysUntilUIArchive: 90,
    daysUntilColdStorage: 365,
    daysUntilAnonymization: 730,
    retainForMatching: true,
    matchingRetentionDays: 2555,
  },
  {
    caseType: 'stray',
    daysUntilUIArchive: 60,
    daysUntilColdStorage: 180,
    daysUntilAnonymization: 365,
    retainForMatching: true,
    matchingRetentionDays: 730,
  },
  {
    caseType: 'transport_request',
    daysUntilUIArchive: 30,
    daysUntilColdStorage: 90,
    daysUntilAnonymization: 180,
    retainForMatching: false,
  },
  {
    caseType: 'trap_request',
    daysUntilUIArchive: 60,
    daysUntilColdStorage: 180,
    daysUntilAnonymization: 365,
    retainForMatching: false,
  },
];

// ═══════════════════════════════════════════════════════════════════
// ANONYMIZATION RULES
// ═══════════════════════════════════════════════════════════════════

export interface AnonymizationRule {
  field: string;
  action: 'remove' | 'hash' | 'generalize' | 'mask';
  hashAlgorithm?: string;
  generalizeTo?: string;
  maskPattern?: string;
}

export const ANONYMIZATION_RULES: AnonymizationRule[] = [
  // Personal information
  { field: 'owner.name', action: 'remove' },
  { field: 'owner.email', action: 'remove' },
  { field: 'owner.phone', action: 'remove' },
  { field: 'owner.address', action: 'generalize', generalizeTo: 'city_state' },
  
  // Reporter information
  { field: 'reporter.name', action: 'remove' },
  { field: 'reporter.email', action: 'remove' },
  { field: 'reporter.phone', action: 'remove' },
  
  // Location (generalize but keep for matching)
  { field: 'location.street', action: 'remove' },
  { field: 'location.coordinates', action: 'generalize', generalizeTo: 'area_centroid' },
  { field: 'location.zipCode', action: 'mask', maskPattern: '***##' },
  
  // Animal details (keep for matching)
  { field: 'animal.name', action: 'remove' },
  { field: 'animal.microchipNumber', action: 'hash', hashAlgorithm: 'sha256' },
  
  // Photos (keep feature hashes)
  { field: 'photos', action: 'hash', hashAlgorithm: 'perceptual' },
  
  // Notes
  { field: 'notes.content', action: 'remove' },
  { field: 'internalNotes', action: 'remove' },
];

// ═══════════════════════════════════════════════════════════════════
// ARCHIVE MANAGER
// ═══════════════════════════════════════════════════════════════════

export class ArchiveManager {
  /**
   * Archive a case
   */
  archiveCase(
    caseData: Case,
    reason: ArchiveReason,
    archivedBy: UserId,
    options?: {
      anonymizationLevel?: AnonymizationLevel;
      storageLocation?: ArchivedCase['storageLocation'];
      retainForMatching?: boolean;
    }
  ): ArchivedCase {
    const now = new Date().toISOString();
    const policy = this.getPolicy(caseData.type);
    
    // Calculate retention expiration
    const retentionExpiresAt = policy.matchingRetentionDays
      ? new Date(Date.now() + policy.matchingRetentionDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    
    // Calculate duration
    const durationDays = caseData.resolvedAt
      ? Math.floor((new Date(caseData.resolvedAt).getTime() - new Date(caseData.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((Date.now() - new Date(caseData.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: crypto.randomUUID(),
      originalCaseId: caseData.id,
      caseNumber: caseData.caseNumber,
      archiveStatus: 'ui_archived',
      archiveReason: reason,
      archivedAt: now,
      archivedBy,
      anonymizationLevel: options?.anonymizationLevel ?? 'none',
      isSearchable: true,
      isMatchable: options?.retainForMatching ?? policy.retainForMatching,
      legalHold: false,
      storageLocation: options?.storageLocation ?? 'primary',
      retentionPolicy: policy.caseType,
      retentionExpiresAt,
      ownerOptedOutOfMatching: false,
      summary: {
        caseType: caseData.type,
        resolution: caseData.resolution?.type,
        createdAt: caseData.createdAt,
        resolvedAt: caseData.resolvedAt,
        durationDays,
      },
      audit: {
        createdAt: now,
        createdBy: archivedBy,
        version: 1,
      },
    };
  }
  
  /**
   * Move to cold storage
   */
  moveToColdStorage(
    archived: ArchivedCase,
    movedBy: UserId,
    storageReference?: string
  ): ArchivedCase {
    const now = new Date().toISOString();
    
    return {
      ...archived,
      archiveStatus: 'cold_storage',
      storageLocation: 'cold',
      storageReference,
      isSearchable: false,
      audit: {
        ...archived.audit,
        updatedAt: now,
        version: archived.audit.version + 1,
      },
    };
  }
  
  /**
   * Anonymize case
   */
  anonymizeCase(
    archived: ArchivedCase,
    level: AnonymizationLevel,
    anonymizedBy: UserId,
    featureHashes?: ArchivedCase['featureHashes']
  ): ArchivedCase {
    const now = new Date().toISOString();
    
    // Determine fields to anonymize
    const fieldsAnonymized = ANONYMIZATION_RULES
      .filter(rule => {
        if (level === 'full') return true;
        if (level === 'partial') return ['owner', 'reporter'].some(prefix => rule.field.startsWith(prefix));
        if (level === 'feature_only') return rule.action !== 'hash';
        return false;
      })
      .map(rule => rule.field);
    
    return {
      ...archived,
      archiveStatus: 'anonymized',
      anonymizationLevel: level,
      anonymizedAt: now,
      anonymizedBy,
      fieldsAnonymized,
      featureHashes,
      isMatchable: level !== 'full' && archived.isMatchable,
      audit: {
        ...archived.audit,
        updatedAt: now,
        version: archived.audit.version + 1,
      },
    };
  }
  
  /**
   * Set legal hold
   */
  setLegalHold(
    archived: ArchivedCase,
    setBy: UserId,
    reason: string,
    reference?: string
  ): ArchivedCase {
    const now = new Date().toISOString();
    
    return {
      ...archived,
      archiveStatus: 'legal_hold',
      legalHold: true,
      legalHoldSetAt: now,
      legalHoldSetBy: setBy,
      legalHoldReason: reason,
      legalHoldReference: reference,
      // Legal hold prevents deletion
      scheduledDeletionAt: undefined,
      audit: {
        ...archived.audit,
        updatedAt: now,
        version: archived.audit.version + 1,
      },
    };
  }
  
  /**
   * Release legal hold
   */
  releaseLegalHold(
    archived: ArchivedCase,
    releasedBy: UserId
  ): ArchivedCase {
    const now = new Date().toISOString();
    
    // Determine new status based on previous state
    const newStatus: ArchiveStatus = archived.anonymizationLevel !== 'none'
      ? 'anonymized'
      : archived.storageLocation === 'cold'
        ? 'cold_storage'
        : 'ui_archived';
    
    return {
      ...archived,
      archiveStatus: newStatus,
      legalHold: false,
      legalHoldReleasedAt: now,
      legalHoldReleasedBy: releasedBy,
      audit: {
        ...archived.audit,
        updatedAt: now,
        version: archived.audit.version + 1,
      },
    };
  }
  
  /**
   * Handle owner opt-out of matching
   */
  optOutOfMatching(
    archived: ArchivedCase,
    optOutBy: UserId
  ): ArchivedCase {
    const now = new Date().toISOString();
    
    return {
      ...archived,
      ownerOptedOutOfMatching: true,
      ownerOptOutAt: now,
      isMatchable: false,
      featureHashes: undefined,
      audit: {
        ...archived.audit,
        updatedAt: now,
        version: archived.audit.version + 1,
      },
    };
  }
  
  /**
   * Check if case should be archived
   */
  shouldArchive(caseData: Case): {
    shouldArchive: boolean;
    reason?: ArchiveReason;
    archiveType?: ArchiveStatus;
  } {
    // Only archive resolved/closed cases
    if (!['resolved', 'closed'].includes(caseData.status)) {
      return { shouldArchive: false };
    }
    
    const policy = this.getPolicy(caseData.type);
    const closedAt = caseData.closedAt ?? caseData.resolvedAt ?? caseData.updatedAt;
    const daysSinceClosed = Math.floor(
      (Date.now() - new Date(closedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceClosed >= policy.daysUntilUIArchive) {
      return {
        shouldArchive: true,
        reason: 'time_based',
        archiveType: 'ui_archived',
      };
    }
    
    return { shouldArchive: false };
  }
  
  /**
   * Check if archived case should be processed further
   */
  getNextArchiveAction(archived: ArchivedCase): {
    action?: 'cold_storage' | 'anonymize' | 'delete';
    dueAt?: string;
  } {
    // Skip if on legal hold
    if (archived.legalHold) {
      return {};
    }
    
    const policy = this.getPolicy(archived.summary.caseType);
    const archivedAt = new Date(archived.archivedAt).getTime();
    const now = Date.now();
    
    // Check for cold storage
    if (archived.storageLocation === 'primary') {
      const coldStorageDue = archivedAt + policy.daysUntilColdStorage * 24 * 60 * 60 * 1000;
      if (now >= coldStorageDue) {
        return { action: 'cold_storage' };
      }
      return { dueAt: new Date(coldStorageDue).toISOString() };
    }
    
    // Check for anonymization
    if (archived.anonymizationLevel === 'none') {
      const anonymizeDue = archivedAt + policy.daysUntilAnonymization * 24 * 60 * 60 * 1000;
      if (now >= anonymizeDue) {
        return { action: 'anonymize' };
      }
      return { dueAt: new Date(anonymizeDue).toISOString() };
    }
    
    // Check for deletion
    if (policy.daysUntilDeletion) {
      const deleteDue = archivedAt + policy.daysUntilDeletion * 24 * 60 * 60 * 1000;
      if (now >= deleteDue) {
        return { action: 'delete' };
      }
      return { dueAt: new Date(deleteDue).toISOString() };
    }
    
    return {};
  }
  
  /**
   * Get archive statistics
   */
  getStatistics(archives: ArchivedCase[]): {
    total: number;
    byStatus: Record<ArchiveStatus, number>;
    byAnonymizationLevel: Record<AnonymizationLevel, number>;
    onLegalHold: number;
    matchable: number;
    pendingActions: number;
  } {
    const byStatus: Record<string, number> = {};
    const byAnonymizationLevel: Record<string, number> = {};
    let onLegalHold = 0;
    let matchable = 0;
    let pendingActions = 0;
    
    for (const archive of archives) {
      byStatus[archive.archiveStatus] = (byStatus[archive.archiveStatus] ?? 0) + 1;
      byAnonymizationLevel[archive.anonymizationLevel] = (byAnonymizationLevel[archive.anonymizationLevel] ?? 0) + 1;
      
      if (archive.legalHold) onLegalHold++;
      if (archive.isMatchable) matchable++;
      
      const nextAction = this.getNextArchiveAction(archive);
      if (nextAction.action) pendingActions++;
    }
    
    return {
      total: archives.length,
      byStatus: byStatus as Record<ArchiveStatus, number>,
      byAnonymizationLevel: byAnonymizationLevel as Record<AnonymizationLevel, number>,
      onLegalHold,
      matchable,
      pendingActions,
    };
  }
  
  private getPolicy(caseType: string): ArchivePolicy {
    const policy = ARCHIVE_POLICIES.find(p => p.caseType === caseType);
    
    if (!policy) {
      // Default policy
      return {
        caseType,
        daysUntilUIArchive: 90,
        daysUntilColdStorage: 365,
        daysUntilAnonymization: 730,
        retainForMatching: true,
        matchingRetentionDays: 2555,
      };
    }
    
    return policy;
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const archiveManager = new ArchiveManager();

export function isOnLegalHold(archived: ArchivedCase): boolean {
  return archived.legalHold;
}

export function canBeDeleted(archived: ArchivedCase): boolean {
  return !archived.legalHold && archived.archiveStatus !== 'legal_hold';
}

export function isMatchable(archived: ArchivedCase): boolean {
  return archived.isMatchable && !archived.ownerOptedOutOfMatching;
}

export function getRetentionDaysRemaining(archived: ArchivedCase): number | null {
  if (!archived.retentionExpiresAt) return null;
  
  const now = Date.now();
  const expires = new Date(archived.retentionExpiresAt).getTime();
  
  return Math.max(0, Math.floor((expires - now) / (1000 * 60 * 60 * 24)));
}

export function searchArchivedCases(
  archives: ArchivedCase[],
  query: {
    caseNumber?: string;
    caseType?: string;
    dateRange?: { from: string; to: string };
    matchableOnly?: boolean;
    excludeLegalHold?: boolean;
  }
): ArchivedCase[] {
  return archives.filter(archive => {
    // Search criteria
    if (query.caseNumber && !archive.caseNumber.includes(query.caseNumber)) {
      return false;
    }
    
    if (query.caseType && archive.summary.caseType !== query.caseType) {
      return false;
    }
    
    if (query.dateRange) {
      const created = new Date(archive.summary.createdAt).getTime();
      const from = new Date(query.dateRange.from).getTime();
      const to = new Date(query.dateRange.to).getTime();
      
      if (created < from || created > to) {
        return false;
      }
    }
    
    if (query.matchableOnly && !archive.isMatchable) {
      return false;
    }
    
    if (query.excludeLegalHold && archive.legalHold) {
      return false;
    }
    
    return true;
  });
}

export function generateFeatureHashes(caseData: Case): ArchivedCase['featureHashes'] {
  // In production, this would use actual hashing algorithms
  return {
    speciesHash: `species_${caseData.type}_hash`,
    colorHash: undefined,
    markingsHash: undefined,
    locationHash: undefined,
    dateHash: `date_${caseData.createdAt.split('T')[0]}_hash`,
  };
}
