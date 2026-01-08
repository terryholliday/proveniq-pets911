import type { AlertProjection, MemoryEvent } from './types';

export function emptyProjection(): AlertProjection {
  return {
    consentByChannel: {},
    userPaused: false,
    partnerContracted: {},
    rateLimitedUntilByChannel: {},
    lowConfidence: false,
    fraudSignal: false,
    escalationProofRequired: false,
    escalationProofAttached: false,
    humanReviewRequired: false,
    humanReviewChannels: null,
  };
}

export function replay(events: MemoryEvent[]): AlertProjection {
  const p = emptyProjection();

  for (const e of events) {
    switch (e.type) {
      case 'pet911.alert.consent_set':
        p.consentByChannel[`${e.channel}::${e.audience_segment}`] = e.consent;
        break;
      case 'pet911.alert.user_pause_set':
        p.userPaused = e.paused;
        break;
      case 'pet911.partner.contracted':
        p.partnerContracted[`${e.channel}::${e.audience_segment}`] = true;
        break;
      case 'pet911.alert.rate_limit_exceeded':
        p.rateLimitedUntilByChannel[`${e.channel}::${e.audience_segment}`] = e.until;
        break;
      case 'pet911.alert.flag_low_confidence':
        p.lowConfidence = true;
        break;
      case 'pet911.alert.fraud_signal':
        p.fraudSignal = true;
        break;
      case 'pet911.alert.escalation_proof_required':
        p.escalationProofRequired = true;
        break;
      case 'pet911.alert.escalation_proof_attached':
        p.escalationProofAttached = true;
        break;
      case 'pet911.alert.human_review_required':
        p.humanReviewRequired = true;
        p.humanReviewChannels = e.channels ? [...e.channels] : null;
        break;
      case 'pet911.alert.evaluate_requested':
        break;
      default: {
        const _exhaustive: never = e;
        return _exhaustive;
      }
    }
  }

  return p;
}
