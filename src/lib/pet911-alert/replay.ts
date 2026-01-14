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
      case 'petmayday.alert.consent_set':
        p.consentByChannel[`${e.channel}::${e.audience_segment}`] = e.consent;
        break;
      case 'petmayday.alert.user_pause_set':
        p.userPaused = e.paused;
        break;
      case 'petmayday.partner.contracted':
        p.partnerContracted[`${e.channel}::${e.audience_segment}`] = true;
        break;
      case 'petmayday.alert.rate_limit_exceeded':
        p.rateLimitedUntilByChannel[`${e.channel}::${e.audience_segment}`] = e.until;
        break;
      case 'petmayday.alert.flag_low_confidence':
        p.lowConfidence = true;
        break;
      case 'petmayday.alert.fraud_signal':
        p.fraudSignal = true;
        break;
      case 'petmayday.alert.escalation_proof_required':
        p.escalationProofRequired = true;
        break;
      case 'petmayday.alert.escalation_proof_attached':
        p.escalationProofAttached = true;
        break;
      case 'petmayday.alert.human_review_required':
        p.humanReviewRequired = true;
        p.humanReviewChannels = e.channels ? [...e.channels] : null;
        break;
      case 'petmayday.alert.evaluate_requested':
        break;
      // ANTI_FRAUD_LOCKER_V2 events
      case 'petmayday.antifraud.message_blocked':
        p.fraudSignal = true;
        break;
      case 'petmayday.antifraud.user_banned':
        p.bannedUser = true;
        p.fraudSignal = true;
        break;
      case 'petmayday.antifraud.proof_of_life_submitted':
        p.proofOfLifeVerified = e.verification_status === 'VERIFIED';
        break;
      case 'petmayday.antifraud.identity_verified':
        p.identityVerified = true;
        p.identityTrustScore = e.trust_score;
        break;
      case 'petmayday.antifraud.verified_match':
        p.proofOfLifeVerified = true;
        p.identityVerified = true;
        break;
      default: {
        const _exhaustive: never = e;
        return _exhaustive;
      }
    }
  }

  return p;
}
