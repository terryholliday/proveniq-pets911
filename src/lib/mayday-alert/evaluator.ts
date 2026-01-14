import type { Clock } from './fake-clock';
import {
  sortEligibleChannels,
  sortPredictedIneligibility,
  sortAuditStream,
  sha256HexCanonicalJson,
} from './canonical-json';
import type {
  AlertEmittedEvent,
  AlertProjection,
  AlertSuppressedEvent,
  AuditEvent,
  GeofenceSnapshot,
  MemoryEvent,
  PolicyEvaluatedEvent,
  ReasonCode,
  Tier,
} from './types';

export interface EvaluateRequest {
  case_id?: string;
  policy_version_hash?: string;
  tier?: Tier;
  geofence_snapshot?: GeofenceSnapshot;
  ttl_seconds?: number;
  requested_channels?: string[];
  audience_segment?: string;
}

export interface EvaluationResult {
  decision_id: string;
  eligible_channels: string[];
  audit_events: AuditEvent[];
}

function channelKey(channel: string, audienceSegment: string): string {
  return `${channel}::${audienceSegment}`;
}

function hasCanonicalGeofence(geofence: GeofenceSnapshot | undefined): boolean {
  if (!geofence) return false;
  return (
    Number.isInteger(geofence.lat_microdegrees) &&
    Number.isInteger(geofence.lng_microdegrees) &&
    Number.isInteger(geofence.radius_meters)
  );
}

function sortSuppressedStream(events: AlertSuppressedEvent[]): AlertSuppressedEvent[] {
  return [...events].sort((a, b) => {
    const c = a.channel.localeCompare(b.channel);
    if (c !== 0) return c;
    const s = a.case_id.localeCompare(b.case_id);
    if (s !== 0) return s;
    return a.reason_code.localeCompare(b.reason_code);
  });
}

export function computeDecisionId(input: {
  case_id: string | null;
  policy_version_hash: string | null;
  tier: Tier | null;
  geofence_snapshot: GeofenceSnapshot | null;
  ttl_seconds: number | null;
  eligible_channels: string[];
  evaluation_timestamp: string;
}): string {
  return sha256HexCanonicalJson(input);
}

export function computeIdempotencyKey(input: {
  case_id: string | null;
  policy_version_hash: string | null;
  channel: string;
  audience_segment: string | null;
  geofence_snapshot: GeofenceSnapshot | null;
  ttl_seconds: number | null;
}): string {
  return sha256HexCanonicalJson(input);
}

function determineSuppressionReason(
  req: EvaluateRequest,
  projection: AlertProjection,
  clock: Clock,
  channel: string
): ReasonCode | null {
  if (!req.audience_segment) return 'policy_ambiguity';
  const key = channelKey(channel, req.audience_segment);

  const contracted = projection.partnerContracted[key];
  if (!contracted) return 'partner_unavailable';

  const consent = projection.consentByChannel[key];
  if (consent !== true) return 'consent_missing';

  if (projection.userPaused) return 'user_paused';

  const rateUntil = projection.rateLimitedUntilByChannel[key];
  if (rateUntil) {
    const nowIso = clock.nowIso();
    if (nowIso < rateUntil) return 'rate_limited';
  }

  const humanReviewApplies =
    projection.humanReviewRequired &&
    (!projection.humanReviewChannels || projection.humanReviewChannels.includes(channel));
  if (humanReviewApplies) return 'human_review_required';

  if (projection.fraudSignal && projection.lowConfidence) return 'fraud_signal';

  if (projection.lowConfidence) return 'low_confidence';

  if (projection.escalationProofRequired && !projection.escalationProofAttached) {
    return 'verification_required';
  }

  return null;
}

export function evaluateAlert(
  req: EvaluateRequest,
  projection: AlertProjection,
  clock: Clock
): EvaluationResult {
  const requested = Array.isArray(req.requested_channels) ? req.requested_channels : [];
  const ambiguous =
    !req.case_id ||
    !req.policy_version_hash ||
    !req.tier ||
    !hasCanonicalGeofence(req.geofence_snapshot) ||
    !Number.isInteger(req.ttl_seconds) ||
    requested.length === 0 ||
    !req.audience_segment;

  const evaluation_timestamp = clock.nowIso();

  const predicted: { channel: string; reason_code: ReasonCode }[] = [];
  const emitted: AlertEmittedEvent[] = [];
  const suppressed: AlertSuppressedEvent[] = [];

  for (const ch of requested) {
    const reason = ambiguous
      ? 'policy_ambiguity'
      : determineSuppressionReason(req, projection, clock, ch);
    if (reason) predicted.push({ channel: ch, reason_code: reason });
  }

  const eligible = sortEligibleChannels(requested.filter(ch => !predicted.some(p => p.channel === ch)));

  const decision_id = computeDecisionId({
    case_id: req.case_id ?? null,
    policy_version_hash: req.policy_version_hash ?? null,
    tier: req.tier ?? null,
    geofence_snapshot: req.geofence_snapshot ?? null,
    ttl_seconds: typeof req.ttl_seconds === 'number' ? req.ttl_seconds : null,
    eligible_channels: eligible,
    evaluation_timestamp,
  });

  const predictedSorted = sortPredictedIneligibility(predicted);

  const policyEvaluated: PolicyEvaluatedEvent = {
    type: 'Mayday.alert.policy_evaluated',
    decision_id,
    policy_version_hash: req.policy_version_hash ?? '',
    tier: req.tier ?? 'T0',
    geofence_snapshot: req.geofence_snapshot ?? {
      lat_microdegrees: 0,
      lng_microdegrees: 0,
      radius_meters: 0,
    },
    eligible_channels: eligible,
    evaluation_timestamp,
    ...(predictedSorted.length > 0 ? { predicted_ineligibility: predictedSorted } : {}),
  };

  for (const ch of requested) {
    const reason = predicted.find(p => p.channel === ch)?.reason_code ?? null;
    if (reason) {
      suppressed.push({
        type: 'Mayday.alert.suppressed',
        decision_id,
        policy_version_hash: req.policy_version_hash ?? '',
        case_id: req.case_id ?? '',
        channel: ch,
        geofence_snapshot: req.geofence_snapshot ?? {
          lat_microdegrees: 0,
          lng_microdegrees: 0,
          radius_meters: 0,
        },
        evaluation_timestamp,
        reason_code: reason,
      });
    } else {
      const idempotency_key = computeIdempotencyKey({
        case_id: req.case_id ?? null,
        policy_version_hash: req.policy_version_hash ?? null,
        channel: ch,
        audience_segment: req.audience_segment ?? null,
        geofence_snapshot: req.geofence_snapshot ?? null,
        ttl_seconds: typeof req.ttl_seconds === 'number' ? req.ttl_seconds : null,
      });
      emitted.push({
        type: 'Mayday.alert.emitted',
        decision_id,
        policy_version_hash: req.policy_version_hash ?? '',
        channel: ch,
        audience_segment: req.audience_segment ?? '',
        geofence_snapshot: req.geofence_snapshot ?? {
          lat_microdegrees: 0,
          lng_microdegrees: 0,
          radius_meters: 0,
        },
        ttl_seconds: typeof req.ttl_seconds === 'number' ? req.ttl_seconds : 0,
        per_recipient_caps_applied: false,
        idempotency_key,
      });
    }
  }

  return {
    decision_id,
    eligible_channels: eligible,
    audit_events: [
      policyEvaluated,
      ...sortAuditStream(emitted),
      ...sortSuppressedStream(suppressed),
    ],
  };
}

export function extractEvaluateRequest(events: MemoryEvent[]): EvaluateRequest {
  const reqEvent = events.find(e => e.type === 'Mayday.alert.evaluate_requested');
  if (!reqEvent || reqEvent.type !== 'Mayday.alert.evaluate_requested') {
    throw new Error('Missing Mayday.alert.evaluate_requested event');
  }
  return {
    case_id: reqEvent.case_id,
    policy_version_hash: reqEvent.policy_version_hash,
    tier: reqEvent.tier,
    geofence_snapshot: reqEvent.geofence_snapshot,
    ttl_seconds: reqEvent.ttl_seconds,
    requested_channels: reqEvent.requested_channels,
    audience_segment: reqEvent.audience_segment,
  };
}
