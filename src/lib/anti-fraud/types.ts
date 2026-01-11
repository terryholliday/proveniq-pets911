/**
 * ANTI_FRAUD_LOCKER_V2 Type Definitions
 * 
 * Military-grade fraud prevention for Pet911.
 * Ending the Desperation Economy by removing the opportunity to scam.
 */

// ═══════════════════════════════════════════════════════════════════
// IDENTITY VERIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════

export type VerificationStatus = 
  | 'UNVERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'SUSPENDED'
  | 'BANNED';

export type VerificationMethod =
  | 'PHONE_OTP'
  | 'EMAIL_LINK'
  | 'SHELTER_PARTNER'
  | 'VET_PARTNER'
  | 'CHIP_REGISTRY'
  | 'GOVERNMENT_ID';

export interface IdentityProfile {
  userId: string;
  status: VerificationStatus;
  verifiedAt: string | null;
  verificationMethod: VerificationMethod | null;
  trustScore: number; // 0-100
  partnerSource: string | null; // e.g., "Shelter Partner (Kanawha)"
  flags: IdentityFlag[];
}

export interface IdentityFlag {
  type: 'SUSPICIOUS_PATTERN' | 'MULTIPLE_ACCOUNTS' | 'IP_BLACKLIST' | 'REPORTED';
  reason: string;
  flaggedAt: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ═══════════════════════════════════════════════════════════════════
// PROOF OF LIFE PROTOCOL TYPES
// ═══════════════════════════════════════════════════════════════════

export interface PhotoMetadata {
  timestamp: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
    accuracy: number; // meters
  } | null;
  deviceId: string | null;
  originalFilename: string;
  fileHash: string; // SHA-256
  exifData: Record<string, string | number> | null;
}

export type PhotoVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'FAILED_NO_METADATA'
  | 'FAILED_TIMESTAMP_MISMATCH'
  | 'FAILED_LOCATION_MISMATCH'
  | 'FAILED_STOCK_PHOTO'
  | 'FAILED_DUPLICATE';

export interface ProofOfLifeSubmission {
  submissionId: string;
  reportId: string;
  submittedBy: string;
  submittedAt: string;
  photos: ProofPhoto[];
  overallStatus: PhotoVerificationStatus;
  verificationDetails: string;
}

export interface ProofPhoto {
  photoId: string;
  url: string;
  metadata: PhotoMetadata | null;
  verificationStatus: PhotoVerificationStatus;
  verificationNotes: string;
}

// ═══════════════════════════════════════════════════════════════════
// RANSOMWARE/SCAM DETECTION TYPES
// ═══════════════════════════════════════════════════════════════════

export type ScamPatternType =
  | 'CASH_DEMAND'
  | 'PAYMENT_APP_REQUEST'
  | 'WIRE_TRANSFER'
  | 'GIFT_CARD'
  | 'CRYPTOCURRENCY'
  | 'SHIPPING_FEE'
  | 'VERIFICATION_CODE'
  | 'URGENCY_PRESSURE'
  | 'VAGUE_THREAT'
  | 'RANSOM_DEMAND';

export interface ScamPattern {
  type: ScamPatternType;
  patterns: RegExp[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoAction: 'FLAG' | 'BLOCK' | 'BAN';
}

export interface MessageAnalysis {
  messageId: string;
  senderId: string;
  receiverId: string;
  content: string;
  analyzedAt: string;
  isSuspicious: boolean;
  matchedPatterns: ScamPatternMatch[];
  action: MessageAction;
}

export interface ScamPatternMatch {
  patternType: ScamPatternType;
  matchedText: string;
  confidence: number; // 0-100
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type MessageAction =
  | 'ALLOWED'
  | 'FLAGGED'
  | 'BLOCKED'
  | 'USER_BANNED';

// ═══════════════════════════════════════════════════════════════════
// AUDIT LOG TYPES
// ═══════════════════════════════════════════════════════════════════

export type AuditEventType =
  | 'INCOMING_MSG_BLOCKED'
  | 'INCOMING_MSG_FLAGGED'
  | 'USER_BAN'
  | 'IP_BLACKLIST'
  | 'VERIFIED_MATCH'
  | 'PROOF_OF_LIFE_SUBMITTED'
  | 'PROOF_OF_LIFE_VERIFIED'
  | 'PROOF_OF_LIFE_REJECTED'
  | 'IDENTITY_VERIFIED'
  | 'IDENTITY_SUSPENDED'
  | 'REUNITE_PENDING'
  | 'REUNITE_COMPLETED'
  | 'SCAM_ATTEMPT_BLOCKED';

export interface AuditLogEntry {
  entryId: string;
  timestamp: string;
  eventType: AuditEventType;
  reportId: string | null;
  userId: string | null;
  ipAddress: string | null;
  reason: string;
  action: string;
  metadata: Record<string, unknown>;
  preservedForLegal: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// COMMUNICATION RELAY TYPES
// ═══════════════════════════════════════════════════════════════════

export interface SecureRelaySession {
  sessionId: string;
  reportId: string;
  finderUserId: string;
  claimantUserId: string;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  messageCount: number;
  flaggedMessageCount: number;
}

export interface RelayMessage {
  messageId: string;
  sessionId: string;
  senderId: string;
  content: string;
  sentAt: string;
  delivered: boolean;
  blocked: boolean;
  blockReason: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// LOCKER STATE
// ═══════════════════════════════════════════════════════════════════

export interface AntiFraudLockerState {
  version: 'V2';
  protectionLevel: 'MILITARY_GRADE';
  activeRelays: number;
  blockedAttemptsToday: number;
  bannedActorsTotal: number;
  verifiedMatchesToday: number;
  auditLogRetentionDays: number;
}
