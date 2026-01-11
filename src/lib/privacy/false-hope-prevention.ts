/**
 * FALSE HOPE PREVENTION PROTOCOL
 * 
 * Prevents unverified matches from being communicated to pet owners.
 * Matches are only revealed when confirmed by a certified moderator.
 * 
 * Key Principles:
 * 1. No unverified match notifications to owners
 * 2. Sighting confidence must meet threshold before owner contact
 * 3. Moderator verification required for all reunification claims
 * 4. Immutable audit trail for all match decisions
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type MatchConfidenceLevel = 
  | 'UNVERIFIED'      // Raw sighting, no analysis
  | 'LOW'             // AI match < 50%
  | 'MODERATE'        // AI match 50-75%
  | 'HIGH'            // AI match > 75%
  | 'HUMAN_VERIFIED'  // Moderator confirmed
  | 'OWNER_CONFIRMED' // Owner positively identified
  | 'CHIP_VERIFIED'   // Microchip scan confirmed
  | 'FALSE_POSITIVE'; // Confirmed not a match

export type MatchGateStatus =
  | 'PENDING_ANALYSIS'
  | 'PENDING_HUMAN_REVIEW'
  | 'PENDING_OWNER_CONTACT'
  | 'OWNER_NOTIFIED'
  | 'REUNIFICATION_IN_PROGRESS'
  | 'REUNIFICATION_COMPLETE'
  | 'REJECTED_FALSE_POSITIVE'
  | 'EXPIRED';

export interface PotentialMatch {
  matchId: string;
  lostReportId: string;
  foundReportId: string;
  sightingId?: string;
  createdAt: string;
  confidenceLevel: MatchConfidenceLevel;
  gateStatus: MatchGateStatus;
  aiConfidenceScore: number; // 0-100
  matchingFactors: MatchingFactor[];
  verificationHistory: VerificationEvent[];
  ownerNotificationBlocked: boolean;
  blockReason?: string;
}

export interface MatchingFactor {
  factor: string;
  weight: number;
  matched: boolean;
  details: string;
}

export interface VerificationEvent {
  eventId: string;
  timestamp: string;
  eventType: 'AI_ANALYSIS' | 'HUMAN_REVIEW' | 'OWNER_CONTACT' | 'CHIP_SCAN' | 'REJECTION' | 'EXPIRATION';
  actor: string; // 'system', moderator_id, or owner_id
  previousStatus: MatchGateStatus;
  newStatus: MatchGateStatus;
  notes: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export const FALSE_HOPE_CONFIG = {
  // Minimum AI confidence before human review is triggered
  minAiConfidenceForReview: 40,
  
  // Minimum AI confidence before owner can be notified (with human approval)
  minAiConfidenceForOwnerNotification: 60,
  
  // Minimum confidence for automatic owner notification (still requires human)
  autoNotificationThreshold: 85,
  
  // Always require human review regardless of AI confidence
  alwaysRequireHumanReview: true,
  
  // Maximum hours before unreviewed match expires
  matchExpirationHours: 72,
  
  // Matching factors and their weights
  matchingFactors: {
    species: { weight: 20, required: true },
    breed: { weight: 15, required: false },
    color: { weight: 15, required: false },
    size: { weight: 10, required: false },
    distinctiveMarks: { weight: 20, required: false },
    location: { weight: 10, required: false },
    microchip: { weight: 50, required: false }, // Highest weight
    photoMatch: { weight: 25, required: false },
  },
};

// ═══════════════════════════════════════════════════════════════════
// GATE CHECK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if a match can proceed to owner notification
 * THIS IS THE CORE FALSE HOPE PREVENTION GATE
 */
export function canNotifyOwner(match: PotentialMatch): {
  allowed: boolean;
  reason: string;
  requiredActions: string[];
} {
  const requiredActions: string[] = [];

  // Gate 1: Must not be explicitly blocked
  if (match.ownerNotificationBlocked) {
    return {
      allowed: false,
      reason: match.blockReason || 'Notification blocked by system',
      requiredActions: ['Review and resolve block reason'],
    };
  }

  // Gate 2: Must have minimum AI confidence
  if (match.aiConfidenceScore < FALSE_HOPE_CONFIG.minAiConfidenceForOwnerNotification) {
    return {
      allowed: false,
      reason: `AI confidence (${match.aiConfidenceScore}%) below threshold (${FALSE_HOPE_CONFIG.minAiConfidenceForOwnerNotification}%)`,
      requiredActions: ['Gather more evidence', 'Request human review with additional context'],
    };
  }

  // Gate 3: Must have human verification (ALWAYS REQUIRED)
  if (FALSE_HOPE_CONFIG.alwaysRequireHumanReview) {
    const hasHumanReview = match.verificationHistory.some(
      e => e.eventType === 'HUMAN_REVIEW' && e.newStatus !== 'REJECTED_FALSE_POSITIVE'
    );
    
    if (!hasHumanReview) {
      requiredActions.push('Human review required');
    }
  }

  // Gate 4: Must be in correct status
  const validStatuses: MatchGateStatus[] = [
    'PENDING_OWNER_CONTACT',
    'OWNER_NOTIFIED',
    'REUNIFICATION_IN_PROGRESS',
  ];
  
  if (!validStatuses.includes(match.gateStatus)) {
    if (match.gateStatus === 'PENDING_ANALYSIS') {
      requiredActions.push('Complete AI analysis');
    }
    if (match.gateStatus === 'PENDING_HUMAN_REVIEW') {
      requiredActions.push('Complete human review');
    }
  }

  // Gate 5: Species must match (non-negotiable)
  const speciesMatch = match.matchingFactors.find(f => f.factor === 'species');
  if (speciesMatch && !speciesMatch.matched) {
    return {
      allowed: false,
      reason: 'Species mismatch - cannot be the same animal',
      requiredActions: ['This match should be rejected'],
    };
  }

  if (requiredActions.length > 0) {
    return {
      allowed: false,
      reason: 'Required verification steps incomplete',
      requiredActions,
    };
  }

  return {
    allowed: true,
    reason: 'All verification gates passed',
    requiredActions: [],
  };
}

/**
 * Calculate match confidence score based on matching factors
 */
export function calculateMatchConfidence(factors: MatchingFactor[]): number {
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const factor of factors) {
    totalWeight += factor.weight;
    if (factor.matched) {
      matchedWeight += factor.weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((matchedWeight / totalWeight) * 100);
}

/**
 * Determine confidence level from score
 */
export function getConfidenceLevel(score: number, hasHumanVerification: boolean, hasChipVerification: boolean): MatchConfidenceLevel {
  if (hasChipVerification) return 'CHIP_VERIFIED';
  if (hasHumanVerification && score >= 75) return 'HUMAN_VERIFIED';
  if (score >= 75) return 'HIGH';
  if (score >= 50) return 'MODERATE';
  if (score >= 25) return 'LOW';
  return 'UNVERIFIED';
}

// ═══════════════════════════════════════════════════════════════════
// MATCH LIFECYCLE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a new potential match (starts in PENDING_ANALYSIS)
 */
export function createPotentialMatch(params: {
  lostReportId: string;
  foundReportId: string;
  sightingId?: string;
  initialFactors: MatchingFactor[];
}): PotentialMatch {
  const aiScore = calculateMatchConfidence(params.initialFactors);
  
  return {
    matchId: crypto.randomUUID(),
    lostReportId: params.lostReportId,
    foundReportId: params.foundReportId,
    sightingId: params.sightingId,
    createdAt: new Date().toISOString(),
    confidenceLevel: getConfidenceLevel(aiScore, false, false),
    gateStatus: 'PENDING_ANALYSIS',
    aiConfidenceScore: aiScore,
    matchingFactors: params.initialFactors,
    verificationHistory: [
      {
        eventId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        eventType: 'AI_ANALYSIS',
        actor: 'system',
        previousStatus: 'PENDING_ANALYSIS',
        newStatus: aiScore >= FALSE_HOPE_CONFIG.minAiConfidenceForReview ? 'PENDING_HUMAN_REVIEW' : 'PENDING_ANALYSIS',
        notes: `Initial AI analysis: ${aiScore}% confidence`,
      },
    ],
    ownerNotificationBlocked: true, // BLOCKED BY DEFAULT
    blockReason: 'Awaiting verification',
  };
}

/**
 * Record human review decision
 */
export function recordHumanReview(
  match: PotentialMatch,
  moderatorId: string,
  decision: 'approve' | 'reject' | 'needs_more_info',
  notes: string
): PotentialMatch {
  const previousStatus = match.gateStatus;
  let newStatus: MatchGateStatus;
  let ownerNotificationBlocked = match.ownerNotificationBlocked;
  let blockReason = match.blockReason;

  switch (decision) {
    case 'approve':
      newStatus = 'PENDING_OWNER_CONTACT';
      ownerNotificationBlocked = false;
      blockReason = undefined;
      break;
    case 'reject':
      newStatus = 'REJECTED_FALSE_POSITIVE';
      ownerNotificationBlocked = true;
      blockReason = 'Rejected by human review: ' + notes;
      break;
    case 'needs_more_info':
      newStatus = 'PENDING_HUMAN_REVIEW';
      ownerNotificationBlocked = true;
      blockReason = 'Additional information required: ' + notes;
      break;
  }

  const event: VerificationEvent = {
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType: 'HUMAN_REVIEW',
    actor: moderatorId,
    previousStatus,
    newStatus,
    notes,
  };

  return {
    ...match,
    gateStatus: newStatus,
    confidenceLevel: decision === 'approve' ? 'HUMAN_VERIFIED' : match.confidenceLevel,
    verificationHistory: [...match.verificationHistory, event],
    ownerNotificationBlocked,
    blockReason,
  };
}

/**
 * Record chip verification (highest confidence)
 */
export function recordChipVerification(
  match: PotentialMatch,
  verifierId: string,
  chipNumber: string,
  registryMatch: boolean
): PotentialMatch {
  const previousStatus = match.gateStatus;
  const newStatus: MatchGateStatus = registryMatch ? 'PENDING_OWNER_CONTACT' : 'REJECTED_FALSE_POSITIVE';

  const event: VerificationEvent = {
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType: 'CHIP_SCAN',
    actor: verifierId,
    previousStatus,
    newStatus,
    notes: registryMatch 
      ? `Chip #${chipNumber} matches registered owner` 
      : `Chip #${chipNumber} does not match - different animal`,
  };

  return {
    ...match,
    gateStatus: newStatus,
    confidenceLevel: registryMatch ? 'CHIP_VERIFIED' : 'FALSE_POSITIVE',
    aiConfidenceScore: registryMatch ? 100 : 0,
    verificationHistory: [...match.verificationHistory, event],
    ownerNotificationBlocked: !registryMatch,
    blockReason: registryMatch ? undefined : 'Chip verification failed - not the same animal',
  };
}

/**
 * Record owner notification sent
 */
export function recordOwnerNotification(
  match: PotentialMatch,
  notificationMethod: string
): PotentialMatch {
  const event: VerificationEvent = {
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType: 'OWNER_CONTACT',
    actor: 'system',
    previousStatus: match.gateStatus,
    newStatus: 'OWNER_NOTIFIED',
    notes: `Owner notified via ${notificationMethod}`,
  };

  return {
    ...match,
    gateStatus: 'OWNER_NOTIFIED',
    verificationHistory: [...match.verificationHistory, event],
  };
}

// ═══════════════════════════════════════════════════════════════════
// FALSE HOPE AUDIT
// ═══════════════════════════════════════════════════════════════════

export interface FalseHopeAuditEntry {
  entryId: string;
  timestamp: string;
  matchId: string;
  eventType: 'GATE_CHECK' | 'NOTIFICATION_BLOCKED' | 'NOTIFICATION_ALLOWED' | 'FALSE_POSITIVE_PREVENTED';
  details: string;
  gatesPassed: string[];
  gatesFailed: string[];
}

/**
 * Create audit entry for false hope prevention
 */
export function createFalseHopeAuditEntry(
  match: PotentialMatch,
  eventType: FalseHopeAuditEntry['eventType'],
  gateResult: ReturnType<typeof canNotifyOwner>
): FalseHopeAuditEntry {
  return {
    entryId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    matchId: match.matchId,
    eventType,
    details: gateResult.reason,
    gatesPassed: gateResult.allowed ? ['All gates'] : [],
    gatesFailed: gateResult.requiredActions,
  };
}
