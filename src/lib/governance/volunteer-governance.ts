/**
 * VOLUNTEER SELF-GOVERNANCE SYSTEM
 * 
 * Inspired by Wikipedia and Reddit's successful volunteer models.
 * 
 * Key Principles:
 * 1. TRUST IS EARNED - Start with limited powers, earn more through action
 * 2. PEER ACCOUNTABILITY - Volunteers hold each other accountable
 * 3. TRANSPARENCY - All significant decisions are logged and reviewable
 * 4. CONSENSUS - Major decisions require peer agreement
 * 5. MINIMAL HIERARCHY - Foundation staff only intervene when necessary
 * 6. COMMUNITY OWNERSHIP - Volunteers feel ownership of the mission
 * 
 * Inspired By:
 * - Wikipedia: Barnstars, RfA (Request for Adminship), AfD, Talk pages
 * - Reddit: Karma, mod elections, community voting, transparency reports
 * - Stack Overflow: Reputation, privileges, review queues
 */

import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// TRUST & REPUTATION SYSTEM
// ═══════════════════════════════════════════════════════════════════

export interface VolunteerReputation {
  odaineId: string;
  odaineName: string;
  currentRole: RoleId;
  
  // Core Metrics (like Reddit karma, but mission-focused)
  trustScore: number;           // 0-1000, weighted composite
  lifetimePoints: number;       // Never decreases (like total karma)
  currentStanding: StandingLevel;
  
  // Activity Metrics
  casesHandled: number;
  matchesVerified: number;
  volunteersCoordinated: number;
  disputesResolved: number;
  peerEndorsements: number;
  peerConcerns: number;
  
  // Quality Metrics
  accuracyRate: number;         // Matches verified that were correct
  responseTimeAvg: number;      // Minutes
  ownerSatisfactionAvg: number; // 1-5 from feedback
  
  // Tenure
  joinedAt: string;
  daysActive: number;
  currentStreak: number;        // Consecutive days with activity
  longestStreak: number;
  
  // Achievements (like Wikipedia Barnstars)
  badges: Badge[];
  
  // Flags
  onProbation: boolean;
  probationReason?: string;
  probationUntil?: string;
}

export type StandingLevel = 
  | 'PROBATIONARY'    // New or under review
  | 'GOOD'            // Normal standing
  | 'TRUSTED'         // Proven track record
  | 'EXEMPLARY'       // Top performers
  | 'SUSPENDED';      // Temporarily removed

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  awardedAt: string;
  awardedBy: string;
  category: 'milestone' | 'quality' | 'community' | 'special';
}

// ═══════════════════════════════════════════════════════════════════
// BADGE DEFINITIONS (Like Wikipedia Barnstars)
// ═══════════════════════════════════════════════════════════════════

export const BADGE_DEFINITIONS: Record<string, Omit<Badge, 'awardedAt' | 'awardedBy'>> = {
  // Milestone Badges
  first_case: { id: 'first_case', name: 'First Responder', description: 'Handled your first case', icon: '🎯', category: 'milestone' },
  cases_10: { id: 'cases_10', name: 'Getting Started', description: 'Handled 10 cases', icon: '⭐', category: 'milestone' },
  cases_50: { id: 'cases_50', name: 'Dedicated', description: 'Handled 50 cases', icon: '🌟', category: 'milestone' },
  cases_100: { id: 'cases_100', name: 'Veteran', description: 'Handled 100 cases', icon: '💫', category: 'milestone' },
  cases_500: { id: 'cases_500', name: 'Legend', description: 'Handled 500 cases', icon: '👑', category: 'milestone' },
  
  // Quality Badges
  perfect_week: { id: 'perfect_week', name: 'Perfect Week', description: '100% accuracy for a week', icon: '✨', category: 'quality' },
  speed_demon: { id: 'speed_demon', name: 'Speed Demon', description: 'Avg response under 5 min for 30 days', icon: '⚡', category: 'quality' },
  five_star: { id: 'five_star', name: 'Five Star', description: 'Maintained 5.0 owner satisfaction for a month', icon: '🏆', category: 'quality' },
  
  // Community Badges
  mentor: { id: 'mentor', name: 'Mentor', description: 'Helped train 5 new volunteers', icon: '🎓', category: 'community' },
  peacemaker: { id: 'peacemaker', name: 'Peacemaker', description: 'Successfully resolved 10 disputes', icon: '🕊️', category: 'community' },
  endorser: { id: 'endorser', name: 'Community Builder', description: 'Endorsed 25 peers', icon: '🤝', category: 'community' },
  
  // Special Badges (manually awarded)
  founder_circle: { id: 'founder_circle', name: 'Founder Circle', description: 'Original pilot volunteer', icon: '🔷', category: 'special' },
  crisis_hero: { id: 'crisis_hero', name: 'Crisis Hero', description: 'Exceptional performance during emergency', icon: '🦸', category: 'special' },
  innovation: { id: 'innovation', name: 'Innovator', description: 'Suggested improvement that was implemented', icon: '💡', category: 'special' },
};

// ═══════════════════════════════════════════════════════════════════
// TRUST SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════════

export interface TrustFactors {
  tenure: number;           // 0-100 (max at 1 year)
  volume: number;           // 0-100 (cases handled)
  quality: number;          // 0-100 (accuracy + satisfaction)
  consistency: number;      // 0-100 (streak + regularity)
  community: number;        // 0-100 (endorsements - concerns)
}

const TRUST_WEIGHTS = {
  tenure: 0.15,
  volume: 0.20,
  quality: 0.35,      // Quality matters most
  consistency: 0.15,
  community: 0.15,
};

/**
 * Calculate trust score from reputation data
 */
export function calculateTrustScore(rep: VolunteerReputation): { score: number; factors: TrustFactors } {
  // Tenure: 0-100, max at 365 days
  const tenure = Math.min(100, (rep.daysActive / 365) * 100);
  
  // Volume: 0-100, logarithmic scale (100 cases = 50, 1000 cases = 100)
  const volume = Math.min(100, Math.log10(rep.casesHandled + 1) * 33);
  
  // Quality: weighted accuracy and satisfaction
  const quality = (rep.accuracyRate * 0.6 + (rep.ownerSatisfactionAvg / 5) * 100 * 0.4);
  
  // Consistency: streak-based
  const consistency = Math.min(100, (rep.currentStreak / 30) * 50 + (rep.longestStreak / 90) * 50);
  
  // Community: endorsements vs concerns
  const communityRatio = rep.peerConcerns > 0 
    ? rep.peerEndorsements / (rep.peerEndorsements + rep.peerConcerns * 3)
    : rep.peerEndorsements > 0 ? 1 : 0.5;
  const community = Math.min(100, communityRatio * 100);
  
  const factors: TrustFactors = { tenure, volume, quality, consistency, community };
  
  const score = Math.round(
    tenure * TRUST_WEIGHTS.tenure +
    volume * TRUST_WEIGHTS.volume +
    quality * TRUST_WEIGHTS.quality +
    consistency * TRUST_WEIGHTS.consistency +
    community * TRUST_WEIGHTS.community
  ) * 10; // Scale to 0-1000
  
  return { score, factors };
}

/**
 * Determine standing level from trust score
 */
export function determineStanding(trustScore: number, onProbation: boolean): StandingLevel {
  if (onProbation) return 'PROBATIONARY';
  if (trustScore >= 800) return 'EXEMPLARY';
  if (trustScore >= 500) return 'TRUSTED';
  if (trustScore >= 200) return 'GOOD';
  return 'PROBATIONARY';
}

// ═══════════════════════════════════════════════════════════════════
// PRIVILEGE SYSTEM (Like Stack Overflow)
// ═══════════════════════════════════════════════════════════════════

export interface Privilege {
  id: string;
  name: string;
  description: string;
  requiredTrustScore: number;
  requiredRole?: RoleId;
  requiredBadges?: string[];
}

export const PRIVILEGES: Privilege[] = [
  // Basic privileges (trust 0-200)
  { id: 'view_cases', name: 'View Cases', description: 'See case details', requiredTrustScore: 0 },
  { id: 'add_notes', name: 'Add Notes', description: 'Add notes to cases', requiredTrustScore: 50 },
  
  // Intermediate privileges (trust 200-500)
  { id: 'edit_cases', name: 'Edit Cases', description: 'Edit case information', requiredTrustScore: 200 },
  { id: 'endorse_peers', name: 'Endorse Peers', description: 'Give peer endorsements', requiredTrustScore: 250 },
  { id: 'vote_decisions', name: 'Vote on Decisions', description: 'Participate in consensus votes', requiredTrustScore: 300 },
  { id: 'flag_concerns', name: 'Flag Concerns', description: 'Flag peer concerns', requiredTrustScore: 350 },
  
  // Advanced privileges (trust 500-800)
  { id: 'verify_matches', name: 'Verify Matches', description: 'Approve potential matches', requiredTrustScore: 500, requiredRole: 'moderator' },
  { id: 'dispatch_volunteers', name: 'Dispatch Volunteers', description: 'Coordinate volunteer dispatch', requiredTrustScore: 500 },
  { id: 'close_cases', name: 'Close Cases', description: 'Mark cases as resolved', requiredTrustScore: 550 },
  { id: 'review_applications', name: 'Review Applications', description: 'Review volunteer applications', requiredTrustScore: 600 },
  
  // Senior privileges (trust 800+)
  { id: 'approve_volunteers', name: 'Approve Volunteers', description: 'Approve new volunteer applications', requiredTrustScore: 800 },
  { id: 'resolve_disputes', name: 'Resolve Disputes', description: 'Make final decisions on disputes', requiredTrustScore: 850 },
  { id: 'nominate_promotion', name: 'Nominate for Promotion', description: 'Nominate peers for role upgrades', requiredTrustScore: 900 },
];

/**
 * Check if volunteer has a specific privilege
 */
export function hasPrivilege(rep: VolunteerReputation, privilegeId: string): boolean {
  const privilege = PRIVILEGES.find(p => p.id === privilegeId);
  if (!privilege) return false;
  
  if (rep.trustScore < privilege.requiredTrustScore) return false;
  if (privilege.requiredRole && rep.currentRole !== privilege.requiredRole) return false;
  if (privilege.requiredBadges?.some(b => !rep.badges.find(rb => rb.id === b))) return false;
  
  return true;
}

/**
 * Get all privileges for a volunteer
 */
export function getPrivileges(rep: VolunteerReputation): Privilege[] {
  return PRIVILEGES.filter(p => hasPrivilege(rep, p.id));
}

/**
 * Get next privilege to unlock
 */
export function getNextPrivilege(rep: VolunteerReputation): Privilege | null {
  const unlockedIds = new Set(getPrivileges(rep).map(p => p.id));
  return PRIVILEGES.find(p => !unlockedIds.has(p.id)) || null;
}

// ═══════════════════════════════════════════════════════════════════
// PEER ENDORSEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════

export type EndorsementType = 
  | 'helpful'         // Generally helpful
  | 'accurate'        // Makes accurate decisions
  | 'responsive'      // Quick to respond
  | 'thorough'        // Does thorough work
  | 'mentoring'       // Helps train others
  | 'leadership';     // Shows leadership

export interface PeerEndorsement {
  id: string;
  fromVolunteerId: string;
  toVolunteerId: string;
  type: EndorsementType;
  message?: string;
  caseId?: string;      // If related to a specific case
  createdAt: string;
  
  // Validation
  weight: number;       // Based on endorser's trust score
}

export interface PeerConcern {
  id: string;
  fromVolunteerId: string;
  toVolunteerId: string;
  concernType: ConcernType;
  description: string;
  evidence?: string[];
  caseId?: string;
  createdAt: string;
  
  // Resolution
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  resolution?: string;
  resolvedAt?: string;
}

export type ConcernType =
  | 'inaccuracy'       // Made incorrect decisions
  | 'slow_response'    // Consistently slow
  | 'poor_communication'
  | 'policy_violation'
  | 'misconduct'
  | 'harassment';

/**
 * Create an endorsement with weight based on endorser's trust
 */
export function createEndorsement(
  fromRep: VolunteerReputation,
  toVolunteerId: string,
  type: EndorsementType,
  message?: string,
  caseId?: string
): PeerEndorsement {
  // Weight based on endorser's trust (higher trust = more valuable endorsement)
  const weight = Math.max(0.5, Math.min(2.0, fromRep.trustScore / 500));
  
  return {
    id: crypto.randomUUID(),
    fromVolunteerId: fromRep.odaineId,
    toVolunteerId,
    type,
    message,
    caseId,
    createdAt: new Date().toISOString(),
    weight,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SELF-PROMOTION SYSTEM (Like Wikipedia RfA)
// ═══════════════════════════════════════════════════════════════════

export interface PromotionNomination {
  id: string;
  nomineeId: string;
  nomineeName: string;
  currentRole: RoleId;
  targetRole: RoleId;
  
  // Nomination
  nominatedBy: string;
  nominatorName: string;
  nominationReason: string;
  nominatedAt: string;
  
  // Requirements check
  meetsRequirements: boolean;
  requirementDetails: {
    requirement: string;
    met: boolean;
    current: string;
    needed: string;
  }[];
  
  // Voting (like Wikipedia RfA)
  votes: PromotionVote[];
  supportCount: number;
  opposeCount: number;
  neutralCount: number;
  
  // Timeline
  votingEndsAt: string;   // Typically 7 days
  status: 'voting' | 'passed' | 'failed' | 'withdrawn';
  
  // Resolution
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface PromotionVote {
  odaineId: string;
  volunteerName: string;
  vote: 'support' | 'oppose' | 'neutral';
  reason: string;
  weight: number;         // Based on voter's trust score
  votedAt: string;
}

/**
 * Requirements for role promotions
 */
export const PROMOTION_REQUIREMENTS: Record<RoleId, {
  minTrustScore: number;
  minDaysActive: number;
  minCasesHandled: number;
  requiredStanding: StandingLevel;
  requiredEndorsements: number;
  maxConcerns: number;
  additionalRequirements?: string[];
}> = {
  junior_moderator: {
    minTrustScore: 300,
    minDaysActive: 30,
    minCasesHandled: 20,
    requiredStanding: 'GOOD',
    requiredEndorsements: 3,
    maxConcerns: 1,
  },
  moderator: {
    minTrustScore: 500,
    minDaysActive: 90,
    minCasesHandled: 75,
    requiredStanding: 'TRUSTED',
    requiredEndorsements: 5,
    maxConcerns: 0,
    additionalRequirements: ['Completed moderator training', 'No probation in last 60 days'],
  },
  lead_moderator: {
    minTrustScore: 800,
    minDaysActive: 180,
    minCasesHandled: 200,
    requiredStanding: 'EXEMPLARY',
    requiredEndorsements: 10,
    maxConcerns: 0,
    additionalRequirements: ['Mentored at least 3 volunteers', 'Resolved at least 5 disputes'],
  },
  senior_transporter: {
    minTrustScore: 400,
    minDaysActive: 60,
    minCasesHandled: 30,
    requiredStanding: 'TRUSTED',
    requiredEndorsements: 3,
    maxConcerns: 0,
  },
  // Add other roles as needed...
} as Record<RoleId, any>;

/**
 * Check if volunteer meets promotion requirements
 */
export function checkPromotionRequirements(
  rep: VolunteerReputation,
  targetRole: RoleId
): { eligible: boolean; details: PromotionNomination['requirementDetails'] } {
  const reqs = PROMOTION_REQUIREMENTS[targetRole];
  if (!reqs) return { eligible: false, details: [{ requirement: 'Role not promotable', met: false, current: 'N/A', needed: 'N/A' }] };
  
  const details: PromotionNomination['requirementDetails'] = [
    {
      requirement: 'Trust Score',
      met: rep.trustScore >= reqs.minTrustScore,
      current: rep.trustScore.toString(),
      needed: reqs.minTrustScore.toString(),
    },
    {
      requirement: 'Days Active',
      met: rep.daysActive >= reqs.minDaysActive,
      current: rep.daysActive.toString(),
      needed: reqs.minDaysActive.toString(),
    },
    {
      requirement: 'Cases Handled',
      met: rep.casesHandled >= reqs.minCasesHandled,
      current: rep.casesHandled.toString(),
      needed: reqs.minCasesHandled.toString(),
    },
    {
      requirement: 'Standing',
      met: rep.currentStanding === reqs.requiredStanding || rep.currentStanding === 'EXEMPLARY',
      current: rep.currentStanding,
      needed: reqs.requiredStanding,
    },
    {
      requirement: 'Peer Endorsements',
      met: rep.peerEndorsements >= reqs.requiredEndorsements,
      current: rep.peerEndorsements.toString(),
      needed: reqs.requiredEndorsements.toString(),
    },
    {
      requirement: 'Open Concerns',
      met: rep.peerConcerns <= reqs.maxConcerns,
      current: rep.peerConcerns.toString(),
      needed: `≤${reqs.maxConcerns}`,
    },
  ];
  
  const eligible = details.every(d => d.met);
  return { eligible, details };
}

/**
 * Calculate promotion vote result
 * Requires 2/3 support with minimum participation
 */
export function calculatePromotionResult(nomination: PromotionNomination): {
  passed: boolean;
  reason: string;
  supportPercentage: number;
} {
  const totalVotes = nomination.supportCount + nomination.opposeCount;
  const minVotes = 5; // Minimum participation required
  
  if (totalVotes < minVotes) {
    return {
      passed: false,
      reason: `Insufficient participation (${totalVotes}/${minVotes} required)`,
      supportPercentage: 0,
    };
  }
  
  const supportPercentage = (nomination.supportCount / totalVotes) * 100;
  const threshold = 66.7; // 2/3 majority
  
  return {
    passed: supportPercentage >= threshold,
    reason: supportPercentage >= threshold 
      ? `Passed with ${supportPercentage.toFixed(1)}% support`
      : `Failed with ${supportPercentage.toFixed(1)}% support (${threshold}% required)`,
    supportPercentage,
  };
}
