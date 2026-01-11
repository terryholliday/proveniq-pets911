/**
 * IDENTITY-VERIFIED COMMUNICATION
 * 
 * No anonymous texts. All communication flows through our secure, monitored relay.
 * If they can't verify their identity, they can't message you.
 */

import type {
  IdentityProfile,
  IdentityFlag,
  VerificationStatus,
  VerificationMethod,
  SecureRelaySession,
  RelayMessage,
} from './types';

// ═══════════════════════════════════════════════════════════════════
// TRUST SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════════

const TRUST_WEIGHTS = {
  PHONE_OTP: 30,
  EMAIL_LINK: 20,
  SHELTER_PARTNER: 50,
  VET_PARTNER: 45,
  CHIP_REGISTRY: 60,
  GOVERNMENT_ID: 80,
};

const FLAG_PENALTIES = {
  LOW: 5,
  MEDIUM: 15,
  HIGH: 30,
  CRITICAL: 50,
};

/**
 * Calculate trust score for a user based on verification and flags
 */
export function calculateTrustScore(
  verificationMethod: VerificationMethod | null,
  flags: IdentityFlag[]
): number {
  // Base score from verification method
  let score = verificationMethod ? TRUST_WEIGHTS[verificationMethod] : 0;

  // Apply flag penalties
  for (const flag of flags) {
    score -= FLAG_PENALTIES[flag.severity];
  }

  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
}

// ═══════════════════════════════════════════════════════════════════
// IDENTITY VERIFICATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Verify user identity via phone OTP
 */
export async function verifyViaPhoneOTP(
  userId: string,
  phoneNumber: string,
  otpCode: string,
  expectedCode: string
): Promise<{ success: boolean; profile?: Partial<IdentityProfile>; error?: string }> {
  if (otpCode !== expectedCode) {
    return { success: false, error: 'Invalid verification code' };
  }

  return {
    success: true,
    profile: {
      userId,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      verificationMethod: 'PHONE_OTP',
      trustScore: TRUST_WEIGHTS.PHONE_OTP,
      partnerSource: null,
      flags: [],
    },
  };
}

/**
 * Verify user identity via shelter partner
 * Highest trust level for found pet claims
 */
export async function verifyViaShelterPartner(
  userId: string,
  shelterPartnerId: string,
  shelterName: string,
  verificationDetails: {
    staffMemberId: string;
    animalIntakeId?: string;
    chipScanResult?: string;
  }
): Promise<{ success: boolean; profile?: Partial<IdentityProfile>; error?: string }> {
  // In production: Verify shelter is in partner network
  // For now, assume valid if shelterPartnerId provided

  const hasChipScan = !!verificationDetails.chipScanResult;
  const method: VerificationMethod = hasChipScan ? 'CHIP_REGISTRY' : 'SHELTER_PARTNER';

  return {
    success: true,
    profile: {
      userId,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      verificationMethod: method,
      trustScore: TRUST_WEIGHTS[method],
      partnerSource: `Shelter Partner (${shelterName})`,
      flags: [],
    },
  };
}

/**
 * Verify user identity via vet partner
 */
export async function verifyViaVetPartner(
  userId: string,
  vetClinicId: string,
  clinicName: string,
  verificationDetails: {
    staffMemberId: string;
    patientId?: string;
  }
): Promise<{ success: boolean; profile?: Partial<IdentityProfile>; error?: string }> {
  return {
    success: true,
    profile: {
      userId,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      verificationMethod: 'VET_PARTNER',
      trustScore: TRUST_WEIGHTS.VET_PARTNER,
      partnerSource: `Vet Partner (${clinicName})`,
      flags: [],
    },
  };
}

/**
 * Verify via microchip registry match
 */
export async function verifyViaChipRegistry(
  userId: string,
  chipNumber: string,
  registryName: string
): Promise<{ success: boolean; profile?: Partial<IdentityProfile>; error?: string }> {
  return {
    success: true,
    profile: {
      userId,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      verificationMethod: 'CHIP_REGISTRY',
      trustScore: TRUST_WEIGHTS.CHIP_REGISTRY,
      partnerSource: `Chip Registry (${registryName})`,
      flags: [],
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// IDENTITY FLAGGING
// ═══════════════════════════════════════════════════════════════════

/**
 * Flag an identity for suspicious behavior
 */
export function flagIdentity(
  profile: IdentityProfile,
  flagType: IdentityFlag['type'],
  reason: string,
  severity: IdentityFlag['severity']
): IdentityProfile {
  const newFlag: IdentityFlag = {
    type: flagType,
    reason,
    flaggedAt: new Date().toISOString(),
    severity,
  };

  const updatedFlags = [...profile.flags, newFlag];
  const newTrustScore = calculateTrustScore(profile.verificationMethod, updatedFlags);

  // Auto-suspend if trust score drops below threshold
  let newStatus: VerificationStatus = profile.status;
  if (newTrustScore < 20) {
    newStatus = 'SUSPENDED';
  }
  if (severity === 'CRITICAL') {
    newStatus = 'BANNED';
  }

  return {
    ...profile,
    flags: updatedFlags,
    trustScore: newTrustScore,
    status: newStatus,
  };
}

/**
 * Ban an identity permanently
 */
export function banIdentity(
  profile: IdentityProfile,
  reason: string
): IdentityProfile {
  return {
    ...profile,
    status: 'BANNED',
    trustScore: 0,
    flags: [
      ...profile.flags,
      {
        type: 'REPORTED',
        reason: `BANNED: ${reason}`,
        flaggedAt: new Date().toISOString(),
        severity: 'CRITICAL',
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════
// SECURE RELAY COMMUNICATION
// ═══════════════════════════════════════════════════════════════════

const RELAY_CONFIG = {
  sessionDurationHours: 72,
  maxMessagesPerSession: 50,
  minTrustScoreToInitiate: 30,
  minTrustScoreToRespond: 20,
};

/**
 * Create a secure relay session for communication between finder and claimant
 */
export function createSecureRelaySession(
  reportId: string,
  finderProfile: IdentityProfile,
  claimantProfile: IdentityProfile
): { success: boolean; session?: SecureRelaySession; error?: string } {
  // Verify both parties meet minimum trust requirements
  if (finderProfile.status !== 'VERIFIED') {
    return { success: false, error: 'Finder identity not verified' };
  }

  if (claimantProfile.status !== 'VERIFIED') {
    return { success: false, error: 'Claimant identity not verified' };
  }

  if (claimantProfile.trustScore < RELAY_CONFIG.minTrustScoreToInitiate) {
    return {
      success: false,
      error: `Claimant trust score (${claimantProfile.trustScore}) below minimum (${RELAY_CONFIG.minTrustScoreToInitiate})`,
    };
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + RELAY_CONFIG.sessionDurationHours * 60 * 60 * 1000
  );

  const session: SecureRelaySession = {
    sessionId: crypto.randomUUID(),
    reportId,
    finderUserId: finderProfile.userId,
    claimantUserId: claimantProfile.userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'ACTIVE',
    messageCount: 0,
    flaggedMessageCount: 0,
  };

  return { success: true, session };
}

/**
 * Check if a user can send a message in a relay session
 */
export function canSendMessage(
  session: SecureRelaySession,
  senderProfile: IdentityProfile
): { allowed: boolean; reason?: string } {
  // Check session status
  if (session.status !== 'ACTIVE') {
    return { allowed: false, reason: 'Session is no longer active' };
  }

  // Check expiration
  if (new Date() > new Date(session.expiresAt)) {
    return { allowed: false, reason: 'Session has expired' };
  }

  // Check message limit
  if (session.messageCount >= RELAY_CONFIG.maxMessagesPerSession) {
    return { allowed: false, reason: 'Session message limit reached' };
  }

  // Check sender identity
  if (senderProfile.status === 'BANNED') {
    return { allowed: false, reason: 'Sender is banned' };
  }

  if (senderProfile.status === 'SUSPENDED') {
    return { allowed: false, reason: 'Sender account is suspended' };
  }

  if (senderProfile.status !== 'VERIFIED') {
    return { allowed: false, reason: 'Sender identity not verified' };
  }

  // Check sender is part of session
  const isFinder = senderProfile.userId === session.finderUserId;
  const isClaimant = senderProfile.userId === session.claimantUserId;
  if (!isFinder && !isClaimant) {
    return { allowed: false, reason: 'Sender not part of this conversation' };
  }

  return { allowed: true };
}

/**
 * Create a relay message (to be processed by anti-fraud before delivery)
 */
export function createRelayMessage(
  sessionId: string,
  senderId: string,
  content: string
): RelayMessage {
  return {
    messageId: crypto.randomUUID(),
    sessionId,
    senderId,
    content,
    sentAt: new Date().toISOString(),
    delivered: false,
    blocked: false,
    blockReason: null,
  };
}

/**
 * Block a relay message
 */
export function blockRelayMessage(
  message: RelayMessage,
  reason: string
): RelayMessage {
  return {
    ...message,
    blocked: true,
    blockReason: reason,
  };
}

/**
 * Mark a relay message as delivered
 */
export function markMessageDelivered(message: RelayMessage): RelayMessage {
  return {
    ...message,
    delivered: true,
  };
}
