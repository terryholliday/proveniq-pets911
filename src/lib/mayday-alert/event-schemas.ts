import type { JsonSchema } from './schema';

export const geofenceSnapshotSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['lat_microdegrees', 'lng_microdegrees', 'radius_meters'],
  properties: {
    lat_microdegrees: { type: 'integer' },
    lng_microdegrees: { type: 'integer' },
    radius_meters: { type: 'integer' },
  },
};

export const policyEvaluatedSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type',
    'decision_id',
    'policy_version_hash',
    'tier',
    'geofence_snapshot',
    'eligible_channels',
    'evaluation_timestamp',
  ],
  properties: {
    type: { type: 'string', const: 'Mayday.alert.policy_evaluated' },
    decision_id: { type: 'string' },
    policy_version_hash: { type: 'string' },
    tier: { type: 'string', enum: ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'] },
    geofence_snapshot: geofenceSnapshotSchema,
    eligible_channels: {
      type: 'array',
      items: { type: 'string' },
    },
    evaluation_timestamp: { type: 'string' },
    predicted_ineligibility: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['channel', 'reason_code'],
        properties: {
          channel: { type: 'string' },
          reason_code: {
            type: 'string',
            enum: [
              'consent_missing',
              'user_paused',
              'rate_limited',
              'low_confidence',
              'fraud_signal',
              'partner_unavailable',
              'verification_required',
              'human_review_required',
              'policy_ambiguity',
            ],
          },
        },
      },
    },
  },
};

export const alertEmittedSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type',
    'decision_id',
    'policy_version_hash',
    'channel',
    'audience_segment',
    'geofence_snapshot',
    'ttl_seconds',
    'per_recipient_caps_applied',
    'idempotency_key',
  ],
  properties: {
    type: { type: 'string', const: 'Mayday.alert.emitted' },
    decision_id: { type: 'string' },
    policy_version_hash: { type: 'string' },
    channel: { type: 'string' },
    audience_segment: { type: 'string' },
    geofence_snapshot: geofenceSnapshotSchema,
    ttl_seconds: { type: 'integer' },
    per_recipient_caps_applied: { type: 'boolean' },
    idempotency_key: { type: 'string' },
  },
};

export const alertSuppressedSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type',
    'decision_id',
    'policy_version_hash',
    'case_id',
    'channel',
    'geofence_snapshot',
    'evaluation_timestamp',
    'reason_code',
  ],
  properties: {
    type: { type: 'string', const: 'Mayday.alert.suppressed' },
    decision_id: { type: 'string' },
    policy_version_hash: { type: 'string' },
    case_id: { type: 'string' },
    channel: { type: 'string' },
    geofence_snapshot: geofenceSnapshotSchema,
    evaluation_timestamp: { type: 'string' },
    reason_code: {
      type: 'string',
      enum: [
        'consent_missing',
        'user_paused',
        'rate_limited',
        'low_confidence',
        'fraud_signal',
        'partner_unavailable',
        'verification_required',
        'human_review_required',
        'policy_ambiguity',
      ],
    },
  },
};

export const auditEventSchema: JsonSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['type'],
  properties: {
    type: { type: 'string' },
  },
};
