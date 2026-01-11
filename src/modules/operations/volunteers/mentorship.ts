/**
 * OPERATIONS MODULE - VOLUNTEER MENTORSHIP
 * 
 * Buddy system and mentorship program for volunteers.
 */

import type { UserId, AuditMetadata } from '../types';
import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// MENTORSHIP TYPES
// ═══════════════════════════════════════════════════════════════════

export type MentorshipType = 
  | 'buddy_system'      // New volunteer paired with experienced volunteer
  | 'skill_mentor'      // Mentor for specific skill
  | 'role_mentor'       // Mentor for role advancement
  | 'wellness_mentor'   // Support for compassion fatigue
  | 'peer_support';     // General peer support

export type MentorshipStatus = 
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'terminated';

export interface MentorshipRelationship {
  id: string;
  mentorId: UserId;
  menteeId: UserId;
  type: MentorshipType;
  status: MentorshipStatus;
  
  // Matching
  matchedAt: string;
  matchedBy: UserId;
  matchScore: number; // 0-100
  matchReasons: string[];
  
  // Goals and focus
  goals: MentorshipGoal[];
  focusAreas: string[];
  
  // Schedule
  expectedDurationWeeks: number;
  startDate: string;
  endDate?: string;
  checkInFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  
  // Progress
  sessionsCompleted: number;
  lastSessionAt?: string;
  nextSessionAt?: string;
  progressNotes: MentorshipNote[];
  
  // Feedback
  mentorRating?: number; // 1-5
  menteeRating?: number; // 1-5
  finalFeedback?: {
    mentor: string;
    mentee: string;
    outcomes: string[];
  };
  
  // Termination
  terminatedAt?: string;
  terminatedBy?: UserId;
  terminationReason?: string;
  
  audit: AuditMetadata;
}

export interface MentorshipGoal {
  id: string;
  description: string;
  category: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
  evidence?: string[];
}

export interface MentorshipNote {
  id: string;
  authorId: UserId;
  authorRole: 'mentor' | 'mentee' | 'admin';
  content: string;
  private: boolean; // Visible only to admin
  createdAt: string;
  tags?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// MENTOR PROFILES
// ═══════════════════════════════════════════════════════════════════

export interface MentorProfile {
  userId: UserId;
  
  // Mentor status
  isMentor: boolean;
  mentorSince?: string;
  mentorStatus: 'active' | 'inactive' | 'suspended';
  
  // Specializations
  mentorshipTypes: MentorshipType[];
  specializations: string[];
  skillsCanTeach: string[];
  rolesCanMentor: RoleId[];
  
  // Capacity
  maxMentees: number;
  currentMentees: number;
  waitingListCapacity: number;
  
  // Preferences
  preferredMenteeLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredCommunication: 'phone' | 'video' | 'email' | 'in_person';
  availability: {
    weekdays: boolean;
    weekends: boolean;
    evenings: boolean;
    timeSlots: string[];
  };
  
  // Experience
  totalMentees: number;
  successfulMentorships: number;
  averageRating: number;
  yearsOfExperience: number;
  
  // Requirements
  minMenteeExperience?: string;
  requiredQualifications?: string[];
  
  // Background check
  backgroundCheckRequired: boolean;
  backgroundCheckValidUntil?: string;
  
  // Training
  mentorshipTrainingCompleted: boolean;
  trainingCompletedAt?: string;
  
  lastUpdated: string;
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// MENTEE PROFILES
// ═══════════════════════════════════════════════════════════════════

export interface MenteeProfile {
  userId: UserId;
  
  // Current status
  currentRole: RoleId;
  roleStartDate: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Mentorship needs
  seekingMentor: boolean;
  mentorshipTypeNeeded: MentorshipType[];
  primaryGoals: string[];
  skillGaps: string[];
  
  // Preferences
  preferredMentorQualities: string[];
  preferredCommunication: 'phone' | 'video' | 'email' | 'in_person';
  availability: {
    weekdays: boolean;
    weekends: boolean;
    evenings: boolean;
    timeSlots: string[];
  };
  
  // History
  previousMentorships: {
    mentorId: UserId;
    type: MentorshipType;
    startDate: string;
    endDate: string;
    rating?: number;
  }[];
  
  // Special considerations
  specialNeeds?: string[];
  languagePreferences?: string[];
  timezone?: string;
  
  // Matching status
  inMatchingPool: boolean;
  inMatchingPoolSince: string;
  matchAttempts: number;
  lastMatchAttempt?: string;
  
  lastUpdated: string;
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// MATCHING ALGORITHM
// ═══════════════════════════════════════════════════════════════════

export interface MatchingCriteria {
  type: MentorshipType;
  menteeRole?: RoleId;
  menteeGoals: string[];
  menteeSkillGaps: string[];
  menteeAvailability: string[];
  menteeLocation?: string;
  specialRequirements?: string[];
}

export interface MatchingResult {
  mentorId: UserId;
  score: number;
  reasons: {
    positive: string[];
    negative: string[];
  };
  compatibility: {
    skills: number; // 0-100
    availability: number; // 0-100
    experience: number; // 0-100
    personality: number; // 0-100
  };
}

export class MentorshipMatcher {
  /**
   * Find best mentors for a mentee
   */
  findMatches(
    mentee: MenteeProfile,
    mentors: MentorProfile[],
    criteria: MatchingCriteria,
    limit: number = 5
  ): MatchingResult[] {
    const results: MatchingResult[] = [];
    
    for (const mentor of mentors) {
      // Skip inactive mentors
      if (mentor.mentorStatus !== 'active') continue;
      
      // Skip if at capacity
      if (mentor.currentMentees >= mentor.maxMentees) continue;
      
      // Check if mentor can handle this type
      if (!mentor.mentorshipTypes.includes(criteria.type)) continue;
      
      // Check role compatibility
      if (criteria.menteeRole && !mentor.rolesCanMentor.includes(criteria.menteeRole)) {
        continue;
      }
      
      // Calculate match score
      const result = this.calculateMatchScore(mentee, mentor, criteria);
      results.push(result);
    }
    
    // Sort by score and return top matches
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  /**
   * Calculate match score between mentor and mentee
   */
  private calculateMatchScore(
    mentee: MenteeProfile,
    mentor: MentorProfile,
    criteria: MatchingCriteria
  ): MatchingResult {
    let score = 0;
    const positive: string[] = [];
    const negative: string[] = [];
    
    // Skills matching (40% weight)
    const skillsMatch = this.calculateSkillsMatch(criteria.menteeSkillGaps, mentor.skillsCanTeach);
    score += skillsMatch * 0.4;
    if (skillsMatch > 80) positive.push('Excellent skills match');
    if (skillsMatch < 30) negative.push('Limited skills overlap');
    
    // Availability matching (25% weight)
    const availabilityMatch = this.calculateAvailabilityMatch(mentee.availability, mentor.availability);
    score += availabilityMatch * 0.25;
    if (availabilityMatch > 80) positive.push('Compatible schedules');
    if (availabilityMatch < 30) negative.push('Schedule conflicts');
    
    // Experience matching (20% weight)
    const experienceMatch = this.calculateExperienceMatch(mentee.experienceLevel, mentor);
    score += experienceMatch * 0.2;
    if (experienceMatch > 80) positive.push('Good experience match');
    if (experienceMatch < 30) negative.push('Experience level mismatch');
    
    // Communication preference (15% weight)
    const communicationMatch = mentee.preferredCommunication === mentor.preferredCommunication ? 100 : 50;
    score += communicationMatch * 0.15;
    if (communicationMatch === 100) positive.push('Same communication preference');
    
    // Bonus factors
    if (mentor.averageRating >= 4.5) {
      score += 5;
      positive.push('Highly rated mentor');
    }
    
    if (mentor.successfulMentorships > 10) {
      score += 3;
      positive.push('Experienced mentor');
    }
    
    // Penalty factors
    if (mentor.currentMentees >= mentor.maxMentees - 1) {
      score -= 10;
      negative.push('Near capacity');
    }
    
    return {
      mentorId: mentor.userId,
      score: Math.round(Math.max(0, Math.min(100, score))),
      reasons: { positive, negative },
      compatibility: {
        skills: skillsMatch,
        availability: availabilityMatch,
        experience: experienceMatch,
        personality: 50, // Would be calculated from personality assessment
      },
    };
  }
  
  private calculateSkillsMatch(menteeGaps: string[], mentorSkills: string[]): number {
    if (menteeGaps.length === 0) return 100;
    
    const matches = menteeGaps.filter(gap => mentorSkills.includes(gap)).length;
    return (matches / menteeGaps.length) * 100;
  }
  
  private calculateAvailabilityMatch(
    menteeAvail: any,
    mentorAvail: any
  ): number {
    // Simple availability matching - in production would be more sophisticated
    let match = 0;
    
    if (menteeAvail.weekdays && mentorAvail.weekdays) match += 25;
    if (menteeAvail.weekends && mentorAvail.weekends) match += 25;
    if (menteeAvail.evenings && mentorAvail.evenings) match += 25;
    
    // Time slot matching
    const commonSlots = menteeAvail.timeSlots.filter((slot: string) => 
      mentorAvail.timeSlots.includes(slot)
    ).length;
    match += (commonSlots / Math.max(menteeAvail.timeSlots.length, 1)) * 25;
    
    return match;
  }
  
  private calculateExperienceMatch(
    menteeLevel: 'beginner' | 'intermediate' | 'advanced',
    mentor: MentorProfile
  ): number {
    // Match mentee level with mentor's preferred level
    if (mentor.preferredMenteeLevel === menteeLevel) return 100;
    
    // Still good if mentor can handle multiple levels
    if (mentor.yearsOfExperience > 5) return 80;
    if (mentor.yearsOfExperience > 2) return 60;
    
    return 40;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MENTORSHIP MANAGER
// ═══════════════════════════════════════════════════════════════════

export class MentorshipManager {
  /**
   * Create mentorship relationship
   */
  createRelationship(
    mentorId: UserId,
    menteeId: UserId,
    type: MentorshipType,
    matchedBy: UserId,
    goals: MentorshipGoal[],
    expectedDurationWeeks: number = 12
  ): MentorshipRelationship {
    const now = new Date().toISOString();
    
    return {
      id: crypto.randomUUID(),
      mentorId,
      menteeId,
      type,
      status: 'pending',
      matchedAt: now,
      matchedBy,
      matchScore: 0, // Would be calculated by matcher
      matchReasons: [],
      goals,
      focusAreas: goals.map(g => g.category),
      expectedDurationWeeks,
      startDate: now,
      checkInFrequency: type === 'buddy_system' ? 'daily' : 'weekly',
      sessionsCompleted: 0,
      progressNotes: [],
      audit: {
        createdAt: now,
        createdBy: matchedBy,
        version: 1,
      },
    };
  }
  
  /**
   * Activate mentorship
   */
  activateRelationship(
    relationship: MentorshipRelationship,
    activatedBy: UserId
  ): MentorshipRelationship {
    return {
      ...relationship,
      status: 'active',
      audit: {
        ...relationship.audit,
        updatedAt: new Date().toISOString(),
        version: relationship.audit.version + 1,
      },
    };
  }
  
  /**
   * Add progress note
   */
  addNote(
    relationship: MentorshipRelationship,
    authorId: UserId,
    authorRole: 'mentor' | 'mentee' | 'admin',
    content: string,
    isPrivate: boolean = false,
    tags?: string[]
  ): MentorshipRelationship {
    const note: MentorshipNote = {
      id: crypto.randomUUID(),
      authorId,
      authorRole,
      content,
      private: isPrivate,
      createdAt: new Date().toISOString(),
      tags,
    };
    
    return {
      ...relationship,
      progressNotes: [...relationship.progressNotes, note],
      audit: {
        ...relationship.audit,
        updatedAt: new Date().toISOString(),
        version: relationship.audit.version + 1,
      },
    };
  }
  
  /**
   * Complete mentorship
   */
  completeRelationship(
    relationship: MentorshipRelationship,
    mentorRating: number,
    menteeRating: number,
    finalFeedback: {
      mentor: string;
      mentee: string;
      outcomes: string[];
    }
  ): MentorshipRelationship {
    const now = new Date().toISOString();
    
    return {
      ...relationship,
      status: 'completed',
      endDate: now,
      mentorRating,
      menteeRating,
      finalFeedback,
      audit: {
        ...relationship.audit,
        updatedAt: now,
        version: relationship.audit.version + 1,
      },
    };
  }
  
  /**
   * Check if mentorship is due for check-in
   */
  isCheckInDue(relationship: MentorshipRelationship): boolean {
    if (relationship.status !== 'active') return false;
    
    const now = new Date();
    const lastSession = relationship.lastSessionAt 
      ? new Date(relationship.lastSessionAt)
      : new Date(relationship.startDate);
    
    let checkInPeriodDays = 7; // Default to weekly
    
    switch (relationship.checkInFrequency) {
      case 'daily': checkInPeriodDays = 1; break;
      case 'biweekly': checkInPeriodDays = 14; break;
      case 'monthly': checkInPeriodDays = 30; break;
    }
    
    const daysSinceLastSession = Math.floor(
      (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastSession >= checkInPeriodDays;
  }
  
  /**
   * Get mentorship statistics
   */
  getStatistics(relationships: MentorshipRelationship[]): {
    total: number;
    active: number;
    completed: number;
    averageRating: number;
    averageDuration: number;
    successRate: number;
  } {
    const total = relationships.length;
    const active = relationships.filter(r => r.status === 'active').length;
    const completed = relationships.filter(r => r.status === 'completed').length;
    
    const withRatings = relationships.filter(r => r.mentorRating && r.menteeRating);
    const averageRating = withRatings.length > 0
      ? withRatings.reduce((sum, r) => sum + ((r.mentorRating! + r.menteeRating!) / 2), 0) / withRatings.length
      : 0;
    
    const completedWithDuration = relationships.filter(r => r.status === 'completed' && r.endDate);
    const averageDuration = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, r) => {
          const duration = Math.floor(
            (new Date(r.endDate!).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7)
          );
          return sum + duration;
        }, 0) / completedWithDuration.length
      : 0;
    
    // Success rate = completed with good ratings
    const successful = relationships.filter(r => 
      r.status === 'completed' && 
      r.mentorRating && r.menteeRating &&
      r.mentorRating >= 4 && r.menteeRating >= 4
    ).length;
    const successRate = completed > 0 ? (successful / completed) * 100 : 0;
    
    return {
      total,
      active,
      completed,
      averageRating,
      averageDuration,
      successRate,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const mentorshipMatcher = new MentorshipMatcher();
export const mentorshipManager = new MentorshipManager();

export function createMentorProfile(userId: UserId): MentorProfile {
  const now = new Date().toISOString();
  
  return {
    userId,
    isMentor: false,
    mentorStatus: 'inactive',
    mentorshipTypes: [],
    specializations: [],
    skillsCanTeach: [],
    rolesCanMentor: [],
    maxMentees: 3,
    currentMentees: 0,
    waitingListCapacity: 2,
    preferredMenteeLevel: 'beginner',
    preferredCommunication: 'video',
    availability: {
      weekdays: true,
      weekends: false,
      evenings: true,
      timeSlots: [],
    },
    totalMentees: 0,
    successfulMentorships: 0,
    averageRating: 0,
    yearsOfExperience: 0,
    backgroundCheckRequired: false,
    mentorshipTrainingCompleted: false,
    lastUpdated: now,
    audit: {
      createdAt: now,
      createdBy: userId,
      version: 1,
    },
  };
}

export function createMenteeProfile(userId: UserId, currentRole: RoleId): MenteeProfile {
  const now = new Date().toISOString();
  
  return {
    userId,
    currentRole,
    roleStartDate: now,
    experienceLevel: 'beginner',
    seekingMentor: false,
    mentorshipTypeNeeded: [],
    primaryGoals: [],
    skillGaps: [],
    preferredMentorQualities: [],
    preferredCommunication: 'video',
    availability: {
      weekdays: true,
      weekends: false,
      evenings: true,
      timeSlots: [],
    },
    previousMentorships: [],
    inMatchingPool: false,
    inMatchingPoolSince: now,
    matchAttempts: 0,
    lastUpdated: now,
    audit: {
      createdAt: now,
      createdBy: userId,
      version: 1,
    },
  };
}

export function createMentorshipGoal(
  description: string,
  category: string,
  targetDate?: string
): MentorshipGoal {
  return {
    id: crypto.randomUUID(),
    description,
    category,
    targetDate,
    completed: false,
  };
}

export function canBeMentor(
  profile: MentorProfile,
  type: MentorshipType,
  menteeRole: RoleId
): boolean {
  // Check basic requirements
  if (!profile.isMentor || profile.mentorStatus !== 'active') return false;
  if (!profile.mentorshipTypes.includes(type)) return false;
  if (!profile.rolesCanMentor.includes(menteeRole)) return false;
  if (profile.currentMentees >= profile.maxMentees) return false;
  
  // Check background check if required
  if (profile.backgroundCheckRequired) {
    if (!profile.backgroundCheckValidUntil || new Date(profile.backgroundCheckValidUntil) <= new Date()) {
      return false;
    }
  }
  
  // Check training
  if (!profile.mentorshipTrainingCompleted) return false;
  
  return true;
}

export function getMentorshipProgress(relationship: MentorshipRelationship): {
  percentageComplete: number;
  goalsCompleted: number;
  totalGoals: number;
  timeElapsed: number;
  timeRemaining: number;
} {
  const goalsCompleted = relationship.goals.filter(g => g.completed).length;
  const totalGoals = relationship.goals.length;
  const percentageComplete = totalGoals > 0 ? (goalsCompleted / totalGoals) * 100 : 0;
  
  const now = new Date();
  const start = new Date(relationship.startDate);
  const end = relationship.endDate ? new Date(relationship.endDate) : new Date(start);
  end.setDate(end.getDate() + (relationship.expectedDurationWeeks * 7));
  
  const timeElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const totalTime = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const timeRemaining = Math.max(0, totalTime - timeElapsed);
  
  return {
    percentageComplete,
    goalsCompleted,
    totalGoals,
    timeElapsed,
    timeRemaining,
  };
}
