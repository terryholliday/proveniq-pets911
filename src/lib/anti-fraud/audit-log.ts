/**
 * AUDIT LOG SERVICE
 * 
 * Append-only, court-safe audit trail for all anti-fraud actions.
 * Every blocked attempt, every ban, every verified match - logged for legal compliance.
 */

import type { AuditLogEntry, AuditEventType } from './types';

// ═══════════════════════════════════════════════════════════════════
// IN-MEMORY AUDIT LOG (Production: Supabase append-only table)
// ═══════════════════════════════════════════════════════════════════

const auditLog: AuditLogEntry[] = [];

/**
 * Create a new audit log entry
 */
export function createAuditEntry(
  eventType: AuditEventType,
  params: {
    reportId?: string;
    userId?: string;
    ipAddress?: string;
    reason: string;
    action: string;
    metadata?: Record<string, unknown>;
    preservedForLegal?: boolean;
  }
): AuditLogEntry {
  const entry: AuditLogEntry = {
    entryId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType,
    reportId: params.reportId || null,
    userId: params.userId || null,
    ipAddress: params.ipAddress || null,
    reason: params.reason,
    action: params.action,
    metadata: params.metadata || {},
    preservedForLegal: params.preservedForLegal ?? false,
  };

  // Append to log (in production: INSERT to Supabase)
  auditLog.push(entry);

  // Console output for terminal display (as shown in screenshot)
  logToConsole(entry);

  return entry;
}

/**
 * Format and log entry to console (matches screenshot terminal style)
 */
function logToConsole(entry: AuditLogEntry): void {
  const time = formatTime(entry.timestamp);
  
  switch (entry.eventType) {
    case 'INCOMING_MSG_BLOCKED':
      console.log(`[${time}] \x1b[31mINCOMING_MSG_BLOCKED\x1b[0m`);
      console.log(`Reason: \x1b[31m${entry.reason}\x1b[0m`);
      console.log(`Action: \x1b[33m${entry.action}\x1b[0m`);
      break;

    case 'USER_BAN':
      console.log(`[${time}] \x1b[31mUSER_BAN\x1b[0m`);
      console.log(`Reason: \x1b[31m${entry.reason}\x1b[0m`);
      console.log(`User ID: ${entry.userId}`);
      break;

    case 'VERIFIED_MATCH':
      console.log(`[${time}] \x1b[32mVERIFIED_MATCH\x1b[0m`);
      console.log(`Source: \x1b[32m${entry.metadata?.['source'] || 'Unknown'}\x1b[0m`);
      console.log(`Metadata: \x1b[36m${entry.metadata?.['verificationMethod'] || ''}\x1b[0m`);
      console.log(`Status: \x1b[33m${entry.action}\x1b[0m`);
      break;

    case 'SCAM_ATTEMPT_BLOCKED':
      console.log(`[${time}] \x1b[31mSCAM_ATTEMPT_BLOCKED\x1b[0m`);
      console.log(`Pattern: \x1b[31m${entry.reason}\x1b[0m`);
      console.log(`Action: \x1b[33m${entry.action}\x1b[0m`);
      break;

    default:
      console.log(`[${time}] ${entry.eventType}`);
      console.log(`Reason: ${entry.reason}`);
      console.log(`Action: ${entry.action}`);
  }
  
  console.log('');
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE LOGGING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Log incoming message blocked
 */
export function logMessageBlocked(params: {
  reportId?: string;
  userId: string;
  ipAddress?: string;
  patternType: string;
  matchedText: string;
  action: 'USER_BAN' | 'IP_BLACKLIST' | 'MESSAGE_BLOCKED';
}): AuditLogEntry {
  return createAuditEntry('INCOMING_MSG_BLOCKED', {
    reportId: params.reportId,
    userId: params.userId,
    ipAddress: params.ipAddress,
    reason: `Suspicious Pattern Match (${params.patternType})`,
    action: params.action === 'USER_BAN' ? 'USER_BAN + IP_BLACKLIST' : params.action,
    metadata: {
      patternType: params.patternType,
      matchedText: params.matchedText,
    },
    preservedForLegal: true,
  });
}

/**
 * Log owner notified of blocked scam attempt
 */
export function logOwnerNotified(params: {
  reportId: string;
  ownerId: string;
  attemptEntryId: string;
}): AuditLogEntry {
  return createAuditEntry('SCAM_ATTEMPT_BLOCKED', {
    reportId: params.reportId,
    userId: params.ownerId,
    reason: `Report #${params.reportId.slice(0, 5)} preserved. Owner notified of blocked attempt.`,
    action: 'OWNER_NOTIFICATION_SENT',
    metadata: {
      blockedAttemptId: params.attemptEntryId,
    },
    preservedForLegal: true,
  });
}

/**
 * Log verified match
 */
export function logVerifiedMatch(params: {
  reportId: string;
  finderId: string;
  claimantId: string;
  source: string;
  verificationMethod: string;
}): AuditLogEntry {
  return createAuditEntry('VERIFIED_MATCH', {
    reportId: params.reportId,
    userId: params.claimantId,
    reason: 'Identity and proof verified',
    action: 'REUNITE_PENDING',
    metadata: {
      source: params.source,
      verificationMethod: params.verificationMethod,
      finderId: params.finderId,
    },
    preservedForLegal: false,
  });
}

/**
 * Log proof of life submission
 */
export function logProofOfLifeSubmitted(params: {
  reportId: string;
  submitterId: string;
  photoCount: number;
  verificationStatus: string;
}): AuditLogEntry {
  const eventType = params.verificationStatus === 'VERIFIED'
    ? 'PROOF_OF_LIFE_VERIFIED'
    : 'PROOF_OF_LIFE_REJECTED';

  return createAuditEntry(eventType, {
    reportId: params.reportId,
    userId: params.submitterId,
    reason: `${params.photoCount} photo(s) submitted`,
    action: params.verificationStatus,
    metadata: {
      photoCount: params.photoCount,
    },
    preservedForLegal: true,
  });
}

/**
 * Log identity verification
 */
export function logIdentityVerified(params: {
  userId: string;
  method: string;
  partnerSource?: string;
  trustScore: number;
}): AuditLogEntry {
  return createAuditEntry('IDENTITY_VERIFIED', {
    userId: params.userId,
    reason: `Verified via ${params.method}`,
    action: 'IDENTITY_CONFIRMED',
    metadata: {
      method: params.method,
      partnerSource: params.partnerSource,
      trustScore: params.trustScore,
    },
    preservedForLegal: false,
  });
}

/**
 * Log user ban
 */
export function logUserBan(params: {
  userId: string;
  ipAddress?: string;
  reason: string;
  scamPatternType?: string;
}): AuditLogEntry {
  return createAuditEntry('USER_BAN', {
    userId: params.userId,
    ipAddress: params.ipAddress,
    reason: params.reason,
    action: 'PERMANENT_BAN + NETWORK_BLACKLIST',
    metadata: {
      scamPatternType: params.scamPatternType,
    },
    preservedForLegal: true,
  });
}

// ═══════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get audit entries for a specific report
 */
export function getAuditEntriesForReport(reportId: string): AuditLogEntry[] {
  return auditLog.filter(e => e.reportId === reportId);
}

/**
 * Get audit entries for a specific user
 */
export function getAuditEntriesForUser(userId: string): AuditLogEntry[] {
  return auditLog.filter(e => e.userId === userId);
}

/**
 * Get all entries preserved for legal
 */
export function getLegalPreservedEntries(): AuditLogEntry[] {
  return auditLog.filter(e => e.preservedForLegal);
}

/**
 * Get recent entries (for dashboard display)
 */
export function getRecentEntries(limit: number = 50): AuditLogEntry[] {
  return auditLog.slice(-limit).reverse();
}

/**
 * Get statistics for dashboard
 */
export function getAuditStatistics(): {
  totalEntries: number;
  blockedMessages: number;
  userBans: number;
  verifiedMatches: number;
  proofOfLifeSubmissions: number;
} {
  return {
    totalEntries: auditLog.length,
    blockedMessages: auditLog.filter(e => e.eventType === 'INCOMING_MSG_BLOCKED').length,
    userBans: auditLog.filter(e => e.eventType === 'USER_BAN').length,
    verifiedMatches: auditLog.filter(e => e.eventType === 'VERIFIED_MATCH').length,
    proofOfLifeSubmissions: auditLog.filter(
      e => e.eventType === 'PROOF_OF_LIFE_SUBMITTED' || 
           e.eventType === 'PROOF_OF_LIFE_VERIFIED' ||
           e.eventType === 'PROOF_OF_LIFE_REJECTED'
    ).length,
  };
}
