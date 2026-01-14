/**
 * ANTI_FRAUD_LOCKER_V2
 * 
 * Military-grade fraud prevention for Mayday.
 * Ending the Desperation Economy.
 * 
 * Features:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  1. Identity-Verified Communication                             │
 * │     No anonymous texts. Secure, monitored relay.                │
 * │     If they can't verify identity, they can't message you.      │
 * │                                                                 │
 * │  2. "Proof of Life" Protocol                                    │
 * │     Metadata-verified photos (time + location stamped).         │
 * │     No stock photos. No vague threats.                          │
 * │                                                                 │
 * │  3. Ransomware Detection                                        │
 * │     AI flags scam scripts ("I have your dog, send via Zelle")   │
 * │     Auto-bans actors instantly across entire network.           │
 * │                                                                 │
 * │  4. Court-Safe Audit Trail                                      │
 * │     Append-only logging. Legal compliance. 7-year retention.    │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * PROTECTION LEVEL: MILITARY-GRADE
 */

// Main Locker Interface
export {
  initializeLocker,
  getLockerState,
  processIncomingMessage,
  registerIdentityProfile,
  getIdentityProfile,
  createRelay,
  submitProofOfLife,
  recordVerifiedMatch,
  isIpBlacklisted,
  isUserBanned,
  blacklistIp,
  banUser,
  getDashboardStats,
} from './anti-fraud-locker';

// Re-export from sub-modules for direct access
export {
  analyzeMessageForScams,
  determineAction,
  SCAM_PATTERNS,
} from './scam-patterns';

export {
  verifyPhoto,
  extractPhotoMetadata,
  processProofOfLifeSubmission,
  parseExifData,
  checkStockPhotoDatabase,
  addToStockPhotoBlacklist,
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
  createRelayMessage,
  blockRelayMessage,
  markMessageDelivered,
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

// Type exports
export type {
  // Identity types
  VerificationStatus,
  VerificationMethod,
  IdentityProfile,
  IdentityFlag,
  
  // Proof of Life types
  PhotoMetadata,
  PhotoVerificationStatus,
  ProofOfLifeSubmission,
  ProofPhoto,
  
  // Scam detection types
  ScamPatternType,
  ScamPattern,
  MessageAnalysis,
  ScamPatternMatch,
  MessageAction,
  
  // Audit types
  AuditEventType,
  AuditLogEntry,
  
  // Communication types
  SecureRelaySession,
  RelayMessage,
  
  // State types
  AntiFraudLockerState,
} from './types';
