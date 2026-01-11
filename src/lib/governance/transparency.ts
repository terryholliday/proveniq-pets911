/**
 * TRANSPARENCY & ACCOUNTABILITY SYSTEM
 * 
 * All significant actions are logged and publicly visible.
 * Volunteers can see what decisions were made and why.
 * 
 * Inspired by:
 * - Wikipedia's contribution history and talk pages
 * - Reddit's mod logs
 * - Government sunshine laws
 */

import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY STREAM
// ═══════════════════════════════════════════════════════════════════

export type ActivityType =
  // Case Actions
  | 'case_created'
  | 'case_triaged'
  | 'case_escalated'
  | 'case_assigned'
  | 'case_resolved'
  | 'case_reopened'
  // Match Actions
  | 'match_suggested'
  | 'match_verified'
  | 'match_rejected'
  | 'owner_notified'
  // Volunteer Actions
  | 'volunteer_dispatched'
  | 'dispatch_completed'
  | 'dispatch_cancelled'
  // Moderation Actions
  | 'content_flagged'
  | 'content_removed'
  | 'user_warned'
  | 'user_suspended'
  // Governance Actions
  | 'proposal_created'
  | 'vote_cast'
  | 'consensus_reached'
  | 'dispute_filed'
  | 'dispute_resolved'
  | 'promotion_nominated'
  | 'promotion_decided'
  // Peer Actions
  | 'endorsement_given'
  | 'concern_raised'
  | 'badge_awarded';

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  
  // Actor
  actorId: string;
  actorName: string;
  actorRole: RoleId;
  actorTrust: number;
  
  // Subject
  subjectType: 'case' | 'match' | 'volunteer' | 'proposal' | 'dispute' | 'user';
  subjectId: string;
  subjectName?: string;
  
  // Details
  action: string;           // Human-readable action description
  details: Record<string, any>;
  
  // Visibility
  visibility: 'public' | 'volunteers_only' | 'moderators_only' | 'staff_only';
  
  // Timestamps
  occurredAt: string;
  
  // Reversibility
  reversible: boolean;
  reversedAt?: string;
  reversedBy?: string;
}

// ═══════════════════════════════════════════════════════════════════
// VOLUNTEER PROFILE (PUBLIC)
// ═══════════════════════════════════════════════════════════════════

export interface PublicVolunteerProfile {
  odaineId: string;
  displayName: string;
  role: RoleId;
  joinedAt: string;
  
  // Reputation (public)
  trustScore: number;
  standing: string;
  badges: { id: string; name: string; icon: string }[];
  
  // Statistics (public)
  stats: {
    casesHandled: number;
    matchesVerified: number;
    daysActive: number;
    currentStreak: number;
    endorsementsReceived: number;
  };
  
  // Recent Activity (public, sanitized)
  recentActivity: {
    type: string;
    description: string;
    occurredAt: string;
  }[];
  
  // Availability (if they choose to share)
  availability?: {
    status: 'available' | 'busy' | 'offline';
    nextAvailable?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// DECISION LOG
// ═══════════════════════════════════════════════════════════════════

export interface DecisionLogEntry {
  id: string;
  decisionType: string;
  title: string;
  
  // Decision maker(s)
  decidedBy: 'individual' | 'consensus' | 'panel' | 'staff';
  participants: {
    odaineId: string;
    name: string;
    role: string;
    vote?: string;
  }[];
  
  // Outcome
  outcome: string;
  rationale: string;
  
  // Impact
  affectedCases?: string[];
  affectedVolunteers?: string[];
  
  // Timestamps
  proposedAt?: string;
  decidedAt: string;
  
  // Appeals
  appealable: boolean;
  appealed: boolean;
  appealOutcome?: string;
}

// ═══════════════════════════════════════════════════════════════════
// TRANSPARENCY REPORTS (Weekly/Monthly)
// ═══════════════════════════════════════════════════════════════════

export interface TransparencyReport {
  id: string;
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  generatedAt: string;
  
  // Volume Metrics
  metrics: {
    casesCreated: number;
    casesResolved: number;
    averageResolutionTimeHours: number;
    matchesVerified: number;
    matchAccuracyRate: number;
    volunteersActive: number;
    newVolunteers: number;
    volunteersOnboarded: number;
  };
  
  // Moderation Metrics
  moderation: {
    contentFlagged: number;
    contentRemoved: number;
    warningsIssued: number;
    suspensions: number;
    fraudAttemptsPrevented: number;
  };
  
  // Governance Metrics
  governance: {
    proposalsCreated: number;
    proposalsPassed: number;
    proposalsFailed: number;
    disputesFiled: number;
    disputesResolved: number;
    promotions: number;
    demotions: number;
  };
  
  // Community Health
  community: {
    averageTrustScore: number;
    endorsementsGiven: number;
    concernsRaised: number;
    badgesAwarded: number;
    volunteerRetentionRate: number;
  };
  
  // Notable Events
  highlights: {
    title: string;
    description: string;
    type: 'success' | 'challenge' | 'milestone';
  }[];
  
  // Staff Interventions (should be minimal)
  staffInterventions: {
    count: number;
    reasons: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT TRAIL
// ═══════════════════════════════════════════════════════════════════

export interface AuditTrailQuery {
  actorId?: string;
  subjectId?: string;
  subjectType?: string;
  activityTypes?: ActivityType[];
  dateFrom?: string;
  dateTo?: string;
  visibility?: ActivityLogEntry['visibility'];
  limit?: number;
  offset?: number;
}

/**
 * Query audit trail with filters
 */
export function queryAuditTrail(
  allEntries: ActivityLogEntry[],
  query: AuditTrailQuery,
  viewerRole: RoleId
): ActivityLogEntry[] {
  let filtered = [...allEntries];
  
  // Filter by visibility based on viewer role
  const visibilityRank: Record<string, number> = {
    public: 0,
    volunteers_only: 1,
    moderators_only: 2,
    staff_only: 3,
  };
  
  const viewerRank = getViewerVisibilityRank(viewerRole);
  filtered = filtered.filter(e => visibilityRank[e.visibility] <= viewerRank);
  
  // Apply query filters
  if (query.actorId) {
    filtered = filtered.filter(e => e.actorId === query.actorId);
  }
  if (query.subjectId) {
    filtered = filtered.filter(e => e.subjectId === query.subjectId);
  }
  if (query.subjectType) {
    filtered = filtered.filter(e => e.subjectType === query.subjectType);
  }
  if (query.activityTypes?.length) {
    filtered = filtered.filter(e => query.activityTypes!.includes(e.type));
  }
  if (query.dateFrom) {
    filtered = filtered.filter(e => e.occurredAt >= query.dateFrom!);
  }
  if (query.dateTo) {
    filtered = filtered.filter(e => e.occurredAt <= query.dateTo!);
  }
  
  // Sort by date descending
  filtered.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  
  // Apply pagination
  const offset = query.offset || 0;
  const limit = query.limit || 50;
  return filtered.slice(offset, offset + limit);
}

function getViewerVisibilityRank(role: RoleId): number {
  switch (role) {
    case 'foundation_admin':
    case 'regional_coordinator':
      return 3;
    case 'lead_moderator':
    case 'moderator':
      return 2;
    case 'junior_moderator':
    case 'senior_transporter':
    case 'transporter':
    case 'foster':
    case 'emergency_foster':
    case 'trapper':
    case 'community_volunteer':
      return 1;
    default:
      return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════
// LEADERBOARD (Gamification)
// ═══════════════════════════════════════════════════════════════════

export interface LeaderboardEntry {
  rank: number;
  odaineId: string;
  displayName: string;
  role: RoleId;
  score: number;
  metric: string;
  badges: string[];
  trend: 'up' | 'down' | 'stable';
  previousRank: number;
}

export type LeaderboardType =
  | 'trust_score'          // Overall trust
  | 'cases_this_week'      // Activity
  | 'accuracy'             // Quality
  | 'response_time'        // Speed
  | 'endorsements'         // Community
  | 'streak';              // Consistency

/**
 * Generate leaderboard for a metric
 */
export function generateLeaderboard(
  volunteers: { odaineId: string; displayName: string; role: RoleId; badges: string[]; [key: string]: any }[],
  metric: LeaderboardType,
  limit: number = 10
): LeaderboardEntry[] {
  const metricKey: Record<LeaderboardType, string> = {
    trust_score: 'trustScore',
    cases_this_week: 'casesThisWeek',
    accuracy: 'accuracyRate',
    response_time: 'avgResponseTime',
    endorsements: 'peerEndorsements',
    streak: 'currentStreak',
  };
  
  const key = metricKey[metric];
  const isLowerBetter = metric === 'response_time';
  
  const sorted = [...volunteers].sort((a, b) => 
    isLowerBetter 
      ? (a[key] || Infinity) - (b[key] || Infinity)
      : (b[key] || 0) - (a[key] || 0)
  );
  
  return sorted.slice(0, limit).map((v, i) => ({
    rank: i + 1,
    odaineId: v.odaineId,
    displayName: v.displayName,
    role: v.role,
    score: v[key] || 0,
    metric,
    badges: v.badges || [],
    trend: 'stable' as const,
    previousRank: i + 1,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════

export interface GovernanceNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  actionRequired: boolean;
  actionDeadline?: string;
}

export type NotificationType =
  | 'endorsement_received'
  | 'concern_raised_about_you'
  | 'badge_earned'
  | 'privilege_unlocked'
  | 'promotion_nominated'
  | 'vote_requested'
  | 'consensus_reached'
  | 'dispute_filed_against_you'
  | 'mediation_requested'
  | 'panel_assignment'
  | 'decision_appealed'
  | 'action_reversed'
  | 'weekly_summary';

/**
 * Create notifications for governance events
 */
export function createGovernanceNotification(
  recipientId: string,
  type: NotificationType,
  context: Record<string, any>
): GovernanceNotification {
  const templates: Record<NotificationType, { title: string; body: string; priority: GovernanceNotification['priority']; actionRequired: boolean }> = {
    endorsement_received: {
      title: 'You received an endorsement!',
      body: `${context.fromName} endorsed you for being ${context.type}`,
      priority: 'low',
      actionRequired: false,
    },
    concern_raised_about_you: {
      title: 'A concern was raised',
      body: 'A peer has raised a concern about your activity. Please review.',
      priority: 'high',
      actionRequired: true,
    },
    badge_earned: {
      title: `Badge Earned: ${context.badgeName}`,
      body: context.badgeDescription,
      priority: 'normal',
      actionRequired: false,
    },
    privilege_unlocked: {
      title: `New Privilege: ${context.privilegeName}`,
      body: `You can now ${context.privilegeDescription}`,
      priority: 'normal',
      actionRequired: false,
    },
    promotion_nominated: {
      title: 'You\'ve been nominated for promotion!',
      body: `${context.nominatorName} nominated you for ${context.targetRole}`,
      priority: 'normal',
      actionRequired: false,
    },
    vote_requested: {
      title: 'Your vote is needed',
      body: `Vote on: ${context.proposalTitle}`,
      priority: 'normal',
      actionRequired: true,
    },
    consensus_reached: {
      title: 'Decision Made',
      body: `The community decided: ${context.outcome}`,
      priority: 'normal',
      actionRequired: false,
    },
    dispute_filed_against_you: {
      title: 'Dispute Filed',
      body: 'Someone has filed a dispute regarding your actions. Please respond.',
      priority: 'urgent',
      actionRequired: true,
    },
    mediation_requested: {
      title: 'Mediation Request',
      body: 'You\'ve been selected to mediate a dispute.',
      priority: 'high',
      actionRequired: true,
    },
    panel_assignment: {
      title: 'Panel Assignment',
      body: 'You\'ve been assigned to a dispute resolution panel.',
      priority: 'high',
      actionRequired: true,
    },
    decision_appealed: {
      title: 'Decision Appealed',
      body: 'A decision you were involved in has been appealed.',
      priority: 'normal',
      actionRequired: false,
    },
    action_reversed: {
      title: 'Action Reversed',
      body: `Your action was reversed: ${context.reason}`,
      priority: 'high',
      actionRequired: false,
    },
    weekly_summary: {
      title: 'Your Weekly Summary',
      body: `You handled ${context.cases} cases this week with ${context.accuracy}% accuracy.`,
      priority: 'low',
      actionRequired: false,
    },
  };
  
  const template = templates[type];
  
  return {
    id: crypto.randomUUID(),
    recipientId,
    type,
    title: template.title,
    body: template.body,
    priority: template.priority,
    createdAt: new Date().toISOString(),
    actionRequired: template.actionRequired,
    actionDeadline: template.actionRequired ? context.deadline : undefined,
  };
}
