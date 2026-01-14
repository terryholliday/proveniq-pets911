/**
 * ANTI_FRAUD_LOCKER_V2
 * 
 * Military-grade fraud prevention for Mayday.
 * Ending the Desperation Economy by removing the opportunity to scam.
 * 
 * Components:
 * 1. Identity-Verified Communication - No anonymous texts
 * 2. Proof of Life Protocol - Metadata-verified photos required
 * 3. Ransomware Detection - AI flags scam scripts, auto-bans actors
 * 4. Audit Logging - Court-safe, append-only record
 */

import type {
  AntiFraudLockerState,
  IdentityProfile,
  SecureRelaySession,
  RelayMessage,
  ProofOfLifeSubmission,
  MessageAnalysis,
  AuditLogEntry,
} from './types';

import {
  analyzeMessageForScams,
  determineAction,
} from './scam-patterns';

import {
  processProofOfLifeSubmission,
} from './proof-of-life';

import {
  createSecureRelaySession,
  canSendMessage,
  createRelayMessage,
  blockRelayMessage,
  markMessageDelivered,
  flagIdentity,
  banIdentity,
} from './identity-verification';

import {
  logMessageBlocked,
  logOwnerNotified,
  logVerifiedMatch,
  logProofOfLifeSubmitted,
  logUserBan,
  getAuditStatistics,
  getRecentEntries,
} from './audit-log';

// ═══════════════════════════════════════════════════════════════════
// LOCKER STATE
// ═══════════════════════════════════════════════════════════════════

const lockerState: AntiFraudLockerState = {
  version: 'V2',
  protectionLevel: 'MILITARY_GRADE',
  activeRelays: 0,
  blockedAttemptsToday: 0,
  bannedActorsTotal: 0,
  verifiedMatchesToday: 0,
  auditLogRetentionDays: 2555, // 7 years for legal compliance
};

// In-memory stores (production: Supabase)
const identityProfiles = new Map<string, IdentityProfile>();
const relaySessions = new Map<string, SecureRelaySession>();
const ipBlacklist = new Set<string>();
const bannedUserIds = new Set<string>();

// ═══════════════════════════════════════════════════════════════════
// MAIN LOCKER INTERFACE
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize the Anti-Fraud Locker
 */
export function initializeLocker(): AntiFraudLockerState {
  console.log('');
  console.log('○ ANTI_FRAUD_LOCKER_V2');
  console.log('  Protection Level: MILITARY-GRADE');
  console.log('');
  return { ...lockerState };
}

/**
 * Get current locker state
 */
export function getLockerState(): AntiFraudLockerState {
  const stats = getAuditStatistics();
  return {
    ...lockerState,
    blockedAttemptsToday: stats.blockedMessages,
    bannedActorsTotal: bannedUserIds.size,
    verifiedMatchesToday: stats.verifiedMatches,
    activeRelays: relaySessions.size,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MESSAGE PROCESSING PIPELINE
// ═══════════════════════════════════════════════════════════════════

/**
 * Process an incoming message through the anti-fraud pipeline
 * This is the main entry point for message screening
 */
export async function processIncomingMessage(params: {
  sessionId: string;
  senderId: string;
  senderIp: string;
  content: string;
  reportId: string;
  recipientId: string;
}): Promise<{
  allowed: boolean;
  message?: RelayMessage;
  analysis: MessageAnalysis;
  auditEntry?: AuditLogEntry;
}> {
  const { sessionId, senderId, senderIp, content, reportId, recipientId } = params;

  // 1. Check if sender is already banned
  if (bannedUserIds.has(senderId) || ipBlacklist.has(senderIp)) {
    const analysis: MessageAnalysis = {
      messageId: crypto.randomUUID(),
      senderId,
      receiverId: recipientId,
      content,
      analyzedAt: new Date().toISOString(),
      isSuspicious: true,
      matchedPatterns: [],
      action: 'BLOCKED',
    };

    return {
      allowed: false,
      analysis,
      auditEntry: logMessageBlocked({
        reportId,
        userId: senderId,
        ipAddress: senderIp,
        patternType: 'BANNED_USER',
        matchedText: '',
        action: 'MESSAGE_BLOCKED',
      }),
    };
  }

  // 2. Get session and verify sender can message
  const session = relaySessions.get(sessionId);
  if (session) {
    const senderProfile = identityProfiles.get(senderId);
    if (!senderProfile) {
      return {
        allowed: false,
        analysis: {
          messageId: crypto.randomUUID(),
          senderId,
          receiverId: recipientId,
          content,
          analyzedAt: new Date().toISOString(),
          isSuspicious: true,
          matchedPatterns: [],
          action: 'BLOCKED',
        },
      };
    }

    const canSend = canSendMessage(session, senderProfile);
    if (!canSend.allowed) {
      return {
        allowed: false,
        analysis: {
          messageId: crypto.randomUUID(),
          senderId,
          receiverId: recipientId,
          content,
          analyzedAt: new Date().toISOString(),
          isSuspicious: false,
          matchedPatterns: [],
          action: 'BLOCKED',
        },
      };
    }
  }

  // 3. Analyze message for scam patterns (RANSOMWARE DETECTION)
  const scamAnalysis = analyzeMessageForScams(content);
  const action = determineAction(scamAnalysis.matches);

  const analysis: MessageAnalysis = {
    messageId: crypto.randomUUID(),
    senderId,
    receiverId: recipientId,
    content,
    analyzedAt: new Date().toISOString(),
    isSuspicious: scamAnalysis.isSuspicious,
    matchedPatterns: scamAnalysis.matches.map(m => ({
      patternType: m.type,
      matchedText: m.matchedText,
      confidence: m.confidence,
      severity: m.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    })),
    action,
  };

  // 4. Take action based on analysis
  if (action === 'USER_BANNED') {
    // Auto-ban the actor across entire network
    bannedUserIds.add(senderId);
    ipBlacklist.add(senderIp);
    lockerState.bannedActorsTotal++;

    // Update identity profile if exists
    const profile = identityProfiles.get(senderId);
    if (profile) {
      const bannedProfile = banIdentity(profile, `Scam pattern detected: ${scamAnalysis.matches[0]?.type}`);
      identityProfiles.set(senderId, bannedProfile);
    }

    // Log the ban
    const banEntry = logUserBan({
      userId: senderId,
      ipAddress: senderIp,
      reason: `Scam pattern: ${scamAnalysis.matches[0]?.type}`,
      scamPatternType: scamAnalysis.matches[0]?.type,
    });

    // Log blocked message
    const blockEntry = logMessageBlocked({
      reportId,
      userId: senderId,
      ipAddress: senderIp,
      patternType: scamAnalysis.matches[0]?.type || 'UNKNOWN',
      matchedText: scamAnalysis.matches[0]?.matchedText || '',
      action: 'USER_BAN',
    });

    // Notify the pet owner
    logOwnerNotified({
      reportId,
      ownerId: recipientId,
      attemptEntryId: blockEntry.entryId,
    });

    lockerState.blockedAttemptsToday++;

    return {
      allowed: false,
      analysis,
      auditEntry: blockEntry,
    };
  }

  if (action === 'BLOCKED') {
    const blockEntry = logMessageBlocked({
      reportId,
      userId: senderId,
      ipAddress: senderIp,
      patternType: scamAnalysis.matches[0]?.type || 'SUSPICIOUS',
      matchedText: scamAnalysis.matches[0]?.matchedText || '',
      action: 'MESSAGE_BLOCKED',
    });

    lockerState.blockedAttemptsToday++;

    return {
      allowed: false,
      analysis,
      auditEntry: blockEntry,
    };
  }

  if (action === 'FLAGGED') {
    // Allow but flag for review
    const message = createRelayMessage(sessionId, senderId, content);
    
    // Flag the sender's profile
    const profile = identityProfiles.get(senderId);
    if (profile) {
      const flaggedProfile = flagIdentity(
        profile,
        'SUSPICIOUS_PATTERN',
        `Flagged message: ${scamAnalysis.matches[0]?.type}`,
        'MEDIUM'
      );
      identityProfiles.set(senderId, flaggedProfile);
    }

    return {
      allowed: true,
      message: markMessageDelivered(message),
      analysis,
    };
  }

  // 5. Message is clean - deliver it
  const message = createRelayMessage(sessionId, senderId, content);
  
  // Update session message count
  if (session) {
    session.messageCount++;
  }

  return {
    allowed: true,
    message: markMessageDelivered(message),
    analysis,
  };
}

// ═══════════════════════════════════════════════════════════════════
// IDENTITY & RELAY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Register or update an identity profile
 */
export function registerIdentityProfile(profile: IdentityProfile): void {
  identityProfiles.set(profile.userId, profile);
}

/**
 * Get an identity profile
 */
export function getIdentityProfile(userId: string): IdentityProfile | undefined {
  return identityProfiles.get(userId);
}

/**
 * Create a secure communication relay between finder and claimant
 */
export function createRelay(
  reportId: string,
  finderUserId: string,
  claimantUserId: string
): { success: boolean; session?: SecureRelaySession; error?: string } {
  const finderProfile = identityProfiles.get(finderUserId);
  const claimantProfile = identityProfiles.get(claimantUserId);

  if (!finderProfile || !claimantProfile) {
    return {
      success: false,
      error: 'Both parties must have verified identities',
    };
  }

  const result = createSecureRelaySession(reportId, finderProfile, claimantProfile);

  if (result.success && result.session) {
    relaySessions.set(result.session.sessionId, result.session);
    lockerState.activeRelays++;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// PROOF OF LIFE PROCESSING
// ═══════════════════════════════════════════════════════════════════

/**
 * Submit and verify proof of life photos for a found claim
 */
export async function submitProofOfLife(params: {
  reportId: string;
  submittedBy: string;
  photos: Array<{
    photoId: string;
    url: string;
    buffer: ArrayBuffer;
    filename: string;
  }>;
  reportedLocation: { lat: number; lng: number } | null;
  reportedAt: string;
}): Promise<ProofOfLifeSubmission> {
  const submission = await processProofOfLifeSubmission(
    params.reportId,
    params.submittedBy,
    params.photos,
    params.reportedLocation,
    params.reportedAt
  );

  // Log the submission
  logProofOfLifeSubmitted({
    reportId: params.reportId,
    submitterId: params.submittedBy,
    photoCount: params.photos.length,
    verificationStatus: submission.overallStatus,
  });

  return submission;
}

// ═══════════════════════════════════════════════════════════════════
// VERIFIED MATCH PROCESSING
// ═══════════════════════════════════════════════════════════════════

/**
 * Record a verified match between lost pet and found claim
 */
export function recordVerifiedMatch(params: {
  reportId: string;
  finderId: string;
  claimantId: string;
  verificationMethod: 'GPS_MATCH' | 'CHIP_SCAN' | 'GPS_MATCH + CHIP_SCAN';
  partnerSource?: string;
}): AuditLogEntry {
  lockerState.verifiedMatchesToday++;

  return logVerifiedMatch({
    reportId: params.reportId,
    finderId: params.finderId,
    claimantId: params.claimantId,
    source: params.partnerSource || 'Direct Verification',
    verificationMethod: params.verificationMethod,
  });
}

// ═══════════════════════════════════════════════════════════════════
// BLACKLIST MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if an IP is blacklisted
 */
export function isIpBlacklisted(ip: string): boolean {
  return ipBlacklist.has(ip);
}

/**
 * Check if a user is banned
 */
export function isUserBanned(userId: string): boolean {
  return bannedUserIds.has(userId);
}

/**
 * Manually blacklist an IP
 */
export function blacklistIp(ip: string, reason: string): void {
  ipBlacklist.add(ip);
}

/**
 * Manually ban a user
 */
export function banUser(userId: string, reason: string): void {
  bannedUserIds.add(userId);
  
  const profile = identityProfiles.get(userId);
  if (profile) {
    identityProfiles.set(userId, banIdentity(profile, reason));
  }

  logUserBan({
    userId,
    reason,
  });

  lockerState.bannedActorsTotal++;
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD / REPORTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Get dashboard statistics
 */
export function getDashboardStats(): {
  state: AntiFraudLockerState;
  recentActivity: AuditLogEntry[];
  statistics: ReturnType<typeof getAuditStatistics>;
} {
  return {
    state: getLockerState(),
    recentActivity: getRecentEntries(20),
    statistics: getAuditStatistics(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export {
  analyzeMessageForScams,
  determineAction,
} from './scam-patterns';

export {
  verifyPhoto,
  extractPhotoMetadata,
  processProofOfLifeSubmission,
} from './proof-of-life';

export {
  calculateTrustScore,
  verifyViaPhoneOTP,
  verifyViaShelterPartner,
  verifyViaVetPartner,
  verifyViaChipRegistry,
  flagIdentity,
  banIdentity,
  createSecureRelaySession,
  canSendMessage,
} from './identity-verification';

export {
  createAuditEntry,
  logMessageBlocked,
  logOwnerNotified,
  logVerifiedMatch,
  logProofOfLifeSubmitted,
  logIdentityVerified,
  logUserBan,
  getAuditEntriesForReport,
  getAuditEntriesForUser,
  getLegalPreservedEntries,
  getRecentEntries,
  getAuditStatistics,
} from './audit-log';
