/**
 * Privacy Protection Module
 * 
 * Implements:
 * - False Hope Prevention Protocol
 * - Address Privacy Protection
 * - Finder anonymity
 * - Safe meeting coordination
 */

// False Hope Prevention
export {
  FALSE_HOPE_CONFIG,
  canNotifyOwner,
  calculateMatchConfidence,
  getConfidenceLevel,
  createPotentialMatch,
  recordHumanReview,
  recordChipVerification,
  recordOwnerNotification,
  createFalseHopeAuditEntry,
} from './false-hope-prevention';

export type {
  MatchConfidenceLevel,
  MatchGateStatus,
  PotentialMatch,
  MatchingFactor,
  VerificationEvent,
  FalseHopeAuditEntry,
} from './false-hope-prevention';

// Address Protection
export {
  ADDRESS_PRIVACY_CONFIG,
  protectLocation,
  protectFinderInfo,
  getSafeMeetingRecommendations,
  logAddressAccess,
} from './address-protection';

export type {
  PrivacyLevel,
  LocationPrecision,
  ProtectedLocation,
  PrivacyContext,
  SafeMeetingLocation,
  AddressAccessLog,
} from './address-protection';
