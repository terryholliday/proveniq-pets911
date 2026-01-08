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
}
