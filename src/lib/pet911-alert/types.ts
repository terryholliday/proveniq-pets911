export type Tier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export type ReasonCode =
  | 'consent_missing'
  | 'user_paused'
  | 'rate_limited'
  | 'low_confidence'
  | 'fraud_signal'
  | 'partner_unavailable'
  | 'verification_required'
  | 'human_review_required'
  | 'policy_ambiguity';

export type Channel = string;

export interface GeofenceSnapshot {
  lat_microdegrees: number;
  lng_microdegrees: number;
  radius_meters: number;
}

export interface PolicyEvaluatedEvent {
  type: 'pet911.alert.policy_evaluated';
  decision_id: string;
  policy_version_hash: string;
  tier: Tier;
  geofence_snapshot: GeofenceSnapshot;
  eligible_channels: string[];
  evaluation_timestamp: string;
  predicted_ineligibility?: { channel: string; reason_code: ReasonCode }[];
}

export interface AlertEmittedEvent {
  type: 'pet911.alert.emitted';
  decision_id: string;
  policy_version_hash: string;
  channel: string;
  audience_segment: string;
  geofence_snapshot: GeofenceSnapshot;
  ttl_seconds: number;
  per_recipient_caps_applied: boolean;
  idempotency_key: string;
}

export interface AlertSuppressedEvent {
  type: 'pet911.alert.suppressed';
  decision_id: string;
  policy_version_hash: string;
  case_id: string;
  channel: string;
  geofence_snapshot: GeofenceSnapshot;
  evaluation_timestamp: string;
  reason_code: ReasonCode;
}

export type AuditEvent = PolicyEvaluatedEvent | AlertEmittedEvent | AlertSuppressedEvent;

export type MemoryEvent =
  | {
      type: 'pet911.alert.consent_set';
      channel: string;
      audience_segment: string;
      consent: boolean;
      at: string;
    }
  | {
      type: 'pet911.alert.user_pause_set';
      paused: boolean;
      at: string;
    }
  | {
      type: 'pet911.partner.contracted';
      channel: string;
      audience_segment: string;
      at: string;
    }
  | {
      type: 'pet911.alert.rate_limit_exceeded';
      channel: string;
      audience_segment: string;
      until: string;
      at: string;
    }
  | {
      type: 'pet911.alert.flag_low_confidence';
      at: string;
    }
  | {
      type: 'pet911.alert.fraud_signal';
      at: string;
    }
  | {
      type: 'pet911.alert.escalation_proof_required';
      at: string;
    }
  | {
      type: 'pet911.alert.escalation_proof_attached';
      at: string;
    }
  | {
      type: 'pet911.alert.human_review_required';
      channels?: string[];
      at: string;
    }
  | {
      type: 'pet911.alert.evaluate_requested';
      case_id?: string;
      policy_version_hash?: string;
      tier?: Tier;
      geofence_snapshot?: GeofenceSnapshot;
      ttl_seconds?: number;
      requested_channels?: string[];
      audience_segment?: string;
      at: string;
    }
  | {
      type: 'pet911.antifraud.message_blocked';
      sender_id: string;
      report_id: string;
      pattern_type: string;
      action: 'USER_BAN' | 'IP_BLACKLIST' | 'MESSAGE_BLOCKED';
      at: string;
    }
  | {
      type: 'pet911.antifraud.user_banned';
      user_id: string;
      ip_address?: string;
      reason: string;
      at: string;
    }
  | {
      type: 'pet911.antifraud.proof_of_life_submitted';
      report_id: string;
      submitter_id: string;
      verification_status: 'VERIFIED' | 'FAILED_NO_METADATA' | 'FAILED_TIMESTAMP_MISMATCH' | 'FAILED_LOCATION_MISMATCH' | 'FAILED_STOCK_PHOTO';
      at: string;
    }
  | {
      type: 'pet911.antifraud.identity_verified';
      user_id: string;
      method: 'PHONE_OTP' | 'EMAIL_LINK' | 'SHELTER_PARTNER' | 'VET_PARTNER' | 'CHIP_REGISTRY';
      trust_score: number;
      at: string;
    }
  | {
      type: 'pet911.antifraud.verified_match';
      report_id: string;
      finder_id: string;
      claimant_id: string;
      verification_method: 'GPS_MATCH' | 'CHIP_SCAN' | 'GPS_MATCH + CHIP_SCAN';
      at: string;
    };

export interface AlertProjection {
  consentByChannel: Record<string, boolean>;
  userPaused: boolean;
  partnerContracted: Record<string, boolean>;
  rateLimitedUntilByChannel: Record<string, string>;
  lowConfidence: boolean;
  fraudSignal: boolean;
  escalationProofRequired: boolean;
  escalationProofAttached: boolean;
  humanReviewRequired: boolean;
  humanReviewChannels: string[] | null;
  // ANTI_FRAUD_LOCKER_V2 extensions
  identityVerified?: boolean;
  identityTrustScore?: number;
  proofOfLifeVerified?: boolean;
  bannedUser?: boolean;
  blacklistedIp?: boolean;
}
