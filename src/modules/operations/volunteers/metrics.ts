/**
 * OPERATIONS MODULE - VOLUNTEER METRICS
 * 
 * Performance metrics, service hours, and engagement tracking.
 */

import type { UserId, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// SERVICE METRICS
// ═══════════════════════════════════════════════════════════════════

export interface ServiceHours {
  id: string;
  userId: UserId;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  activityType: ActivityType;
  caseId?: string;
  description?: string;
  verified: boolean;
  verifiedBy?: UserId;
  verifiedAt?: string;
  location?: string;
  mileage?: number;
  expenses?: {
    type: string;
    amount: number;
    receiptUrl?: string;
  }[];
  audit: AuditMetadata;
}

export type ActivityType = 
  | 'transport'
  | 'trapping'
  | 'foster_care'
  | 'home_visit'
  | 'phone_support'
  | 'admin_support'
  | 'training'
  | 'meeting'
  | 'event'
  | 'other';

export interface ServiceMetrics {
  userId: UserId;
  
  // Lifetime totals
  totalHours: number;
  totalCases: number;
  totalTransports: number;
  totalTraps: number;
  totalFosters: number;
  totalAnimalsHelped: number;
  
  // Current period
  currentMonthHours: number;
  currentQuarterHours: number;
  currentYearHours: number;
  
  // Averages
  averageHoursPerMonth: number;
  averageCasesPerMonth: number;
  
  // Milestones
  milestones: Milestone[];
  nextMilestone?: Milestone;
  
  // Rankings
  regionRank?: number;
  overallRank?: number;
  totalVolunteersInRegion?: number;
  totalVolunteersOverall?: number;
  
  // Last updated
  lastUpdated: string;
  audit: AuditMetadata;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  threshold: number;
  metricType: 'hours' | 'cases' | 'transports' | 'fosters' | 'animals';
  achievedAt?: string;
  reward?: string;
  icon?: string;
}

export const SERVICE_MILESTONES: Milestone[] = [
  {
    id: 'hours_10',
    name: 'Getting Started',
    description: 'Completed 10 hours of service',
    threshold: 10,
    metricType: 'hours',
    icon: '🌟',
  },
  {
    id: 'hours_50',
    name: 'Dedicated Volunteer',
    description: 'Completed 50 hours of service',
    threshold: 50,
    metricType: 'hours',
    icon: '🏆',
  },
  {
    id: 'hours_100',
    name: 'Century Club',
    description: 'Completed 100 hours of service',
    threshold: 100,
    metricType: 'hours',
    reward: 'Volunteer T-shirt',
    icon: '💯',
  },
  {
    id: 'hours_250',
    name: 'Super Volunteer',
    description: 'Completed 250 hours of service',
    threshold: 250,
    metricType: 'hours',
    reward: 'Gift card',
    icon: '⭐',
  },
  {
    id: 'hours_500',
    name: 'Elite Volunteer',
    description: 'Completed 500 hours of service',
    threshold: 500,
    metricType: 'hours',
    reward: 'Award plaque',
    icon: '🏅',
  },
  {
    id: 'hours_1000',
    name: 'Hall of Fame',
    description: 'Completed 1000 hours of service',
    threshold: 1000,
    metricType: 'hours',
    reward: 'Lifetime achievement award',
    icon: '👑',
  },
  {
    id: 'cases_10',
    name: 'Case Helper',
    description: 'Helped resolve 10 cases',
    threshold: 10,
    metricType: 'cases',
    icon: '📋',
  },
  {
    id: 'cases_50',
    name: 'Case Expert',
    description: 'Helped resolve 50 cases',
    threshold: 50,
    metricType: 'cases',
    icon: '📊',
  },
  {
    id: 'transports_25',
    name: 'Transport Pro',
    description: 'Completed 25 transports',
    threshold: 25,
    metricType: 'transports',
    icon: '🚗',
  },
  {
    id: 'fosters_10',
    name: 'Foster Hero',
    description: 'Fostered 10 animals',
    threshold: 10,
    metricType: 'fosters',
    icon: '🏠',
  },
];

// ═══════════════════════════════════════════════════════════════════
// ENGAGEMENT METRICS
// ═══════════════════════════════════════════════════════════════════

export interface EngagementMetrics {
  userId: UserId;
  
  // Activity
  lastLoginAt: string;
  lastActiveAt: string;
  daysSinceLastActive: number;
  loginStreak: number;
  longestStreak: number;
  
  // Communication
  messagesSent: number;
  callsMade: number;
  emailsSent: number;
  
  // Training
  trainingModulesCompleted: number;
  trainingHours: number;
  certificationsEarned: number;
  
  // Community
  forumPosts: number;
  helpfulVotes: number;
  peerMentions: number;
  
  // Reliability
  onTimePercentage: number;
  cancellationRate: number;
  noShowRate: number;
  
  // Satisfaction
  satisfactionScore?: number; // 1-5
  feedbackReceived: number;
  complaintsReceived: number;
  
  // Trends
  activityTrend: 'increasing' | 'stable' | 'decreasing';
  engagementScore: number; // 0-100
  
  lastUpdated: string;
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE METRICS
// ═══════════════════════════════════════════════════════════════════

export interface PerformanceMetrics {
  userId: UserId;
  
  // Quality scores
  averageQualityScore: number; // 1-5
  caseResolutionRate: number; // percentage
  firstContactResolutionRate: number; // percentage
  
  // Efficiency
  averageResponseTime: number; // minutes
  averageCaseDuration: number; // hours
  casesPerHour: number;
  
  // Outcomes
  successfulReunifications: number;
  animalsSaved: number;
  livesImpacted: number;
  
  // Special achievements
  difficultCasesHandled: number;
  emergencyResponses: number;
  afterHoursSupport: number;
  
  // Peer feedback
  peerRating: number; // 1-5
  mentorshipProvided: number;
  mentorshipReceived: number;
  
  // Recognition
  recognitionsReceived: number;
  volunteerOfMonthWins: number;
  specialAwards: string[];
  
  // Performance trend
  performanceTrend: 'improving' | 'stable' | 'declining';
  performancePercentile: number; // 0-100
  
  period: string; // YYYY-MM
  lastUpdated: string;
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// METRICS CALCULATOR
// ═══════════════════════════════════════════════════════════════════

export class MetricsCalculator {
  /**
   * Calculate service metrics from hours
   */
  calculateServiceMetrics(
    userId: UserId,
    serviceHours: ServiceHours[],
    regionRank?: number,
    overallRank?: number
  ): ServiceMetrics {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const currentYear = now.getFullYear();
    
    // Calculate totals
    const totalHours = serviceHours.reduce((sum, h) => sum + h.duration, 0) / 60;
    const totalCases = new Set(serviceHours.filter(h => h.caseId).map(h => h.caseId)).size;
    const totalTransports = serviceHours.filter(h => h.activityType === 'transport').length;
    const totalTraps = serviceHours.filter(h => h.activityType === 'trapping').length;
    const totalFosters = serviceHours.filter(h => h.activityType === 'foster_care').length;
    
    // Calculate period metrics
    const currentMonthHours = this.getHoursInPeriod(serviceHours, currentMonth);
    const currentQuarterHours = this.getHoursInQuarter(serviceHours, currentYear, currentQuarter);
    const currentYearHours = this.getHoursInYear(serviceHours, currentYear);
    
    // Calculate averages
    const monthsActive = this.getMonthsActive(serviceHours);
    const averageHoursPerMonth = monthsActive > 0 ? totalHours / monthsActive : 0;
    const averageCasesPerMonth = monthsActive > 0 ? totalCases / monthsActive : 0;
    
    // Calculate milestones
    const milestones = this.calculateMilestones(totalHours, totalCases, totalTransports, totalFosters);
    const nextMilestone = this.getNextMilestone(totalHours, totalCases, totalTransports, totalFosters);
    
    return {
      userId,
      totalHours,
      totalCases,
      totalTransports,
      totalTraps,
      totalFosters,
      totalAnimalsHelped: totalCases + totalTransports + totalFosters,
      currentMonthHours,
      currentQuarterHours,
      currentYearHours,
      averageHoursPerMonth,
      averageCasesPerMonth,
      milestones,
      nextMilestone,
      regionRank,
      overallRank,
      totalVolunteersInRegion: undefined, // To be filled by caller
      totalVolunteersOverall: undefined, // To be filled by caller
      lastUpdated: now.toISOString(),
      audit: {
        createdAt: now.toISOString(),
        createdBy: userId,
        version: 1,
      },
    };
  }
  
  /**
   * Calculate engagement metrics
   */
  calculateEngagementMetrics(
    userId: UserId,
    loginHistory: { timestamp: string }[],
    activities: {
      messagesSent: number;
      callsMade: number;
      emailsSent: number;
      trainingCompleted: number;
      forumPosts: number;
      helpfulVotes: number;
    },
    reliability: {
      onTimePercentage: number;
      cancellationRate: number;
      noShowRate: number;
    }
  ): EngagementMetrics {
    const now = new Date();
    const lastLogin = loginHistory[0]?.timestamp;
    const lastActive = loginHistory[0]?.timestamp;
    
    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(loginHistory);
    
    // Calculate activity trend
    const activityTrend = this.calculateActivityTrend(loginHistory);
    
    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(
      activities,
      reliability,
      activityTrend
    );
    
    return {
      userId,
      lastLoginAt: lastLogin ?? now.toISOString(),
      lastActiveAt: lastActive ?? now.toISOString(),
      daysSinceLastActive: lastActive ? Math.floor((now.getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      loginStreak: currentStreak,
      longestStreak,
      messagesSent: activities.messagesSent,
      callsMade: activities.callsMade,
      emailsSent: activities.emailsSent,
      trainingModulesCompleted: activities.trainingCompleted,
      trainingHours: activities.trainingCompleted * 2, // Assume 2 hours per module
      certificationsEarned: 0, // To be calculated separately
      forumPosts: activities.forumPosts,
      helpfulVotes: activities.helpfulVotes,
      peerMentions: 0, // To be calculated separately
      onTimePercentage: reliability.onTimePercentage,
      cancellationRate: reliability.cancellationRate,
      noShowRate: reliability.noShowRate,
      feedbackReceived: 0, // To be calculated separately
      complaintsReceived: 0, // To be calculated separately
      activityTrend,
      engagementScore,
      lastUpdated: now.toISOString(),
      audit: {
        createdAt: now.toISOString(),
        createdBy: userId,
        version: 1,
      },
    };
  }
  
  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(
    userId: UserId,
    caseOutcomes: {
      total: number;
      resolved: number;
      firstContact: number;
      successfulReunifications: number;
      animalsSaved: number;
    },
    efficiency: {
      averageResponseTime: number;
      averageCaseDuration: number;
    },
    specialCases: {
      difficultHandled: number;
      emergencyResponses: number;
      afterHoursSupport: number;
    },
    peerFeedback: {
      averageRating: number;
      mentorshipProvided: number;
      mentorshipReceived: number;
    },
    recognition: {
      recognitionsReceived: number;
      volunteerOfMonthWins: number;
      specialAwards: string[];
    }
  ): PerformanceMetrics {
    const now = new Date();
    const period = now.toISOString().slice(0, 7);
    
    // Calculate rates
    const caseResolutionRate = caseOutcomes.total > 0 ? (caseOutcomes.resolved / caseOutcomes.total) * 100 : 0;
    const firstContactResolutionRate = caseOutcomes.total > 0 ? (caseOutcomes.firstContact / caseOutcomes.total) * 100 : 0;
    const casesPerHour = efficiency.averageCaseDuration > 0 ? 60 / efficiency.averageCaseDuration : 0;
    
    // Calculate performance trend
    const performanceTrend = 'stable'; // To be calculated based on historical data
    
    // Calculate performance percentile
    const performancePercentile = this.calculatePerformancePercentile(
      caseResolutionRate,
      efficiency.averageResponseTime,
      peerFeedback.averageRating
    );
    
    return {
      userId,
      averageQualityScore: peerFeedback.averageRating,
      caseResolutionRate,
      firstContactResolutionRate,
      averageResponseTime: efficiency.averageResponseTime,
      averageCaseDuration: efficiency.averageCaseDuration,
      casesPerHour,
      successfulReunifications: caseOutcomes.successfulReunifications,
      animalsSaved: caseOutcomes.animalsSaved,
      livesImpacted: caseOutcomes.successfulReunifications + caseOutcomes.animalsSaved,
      difficultCasesHandled: specialCases.difficultHandled,
      emergencyResponses: specialCases.emergencyResponses,
      afterHoursSupport: specialCases.afterHoursSupport,
      peerRating: peerFeedback.averageRating,
      mentorshipProvided: peerFeedback.mentorshipProvided,
      mentorshipReceived: peerFeedback.mentorshipReceived,
      recognitionsReceived: recognition.recognitionsReceived,
      volunteerOfMonthWins: recognition.volunteerOfMonthWins,
      specialAwards: recognition.specialAwards,
      performanceTrend,
      performancePercentile,
      period,
      lastUpdated: now.toISOString(),
      audit: {
        createdAt: now.toISOString(),
        createdBy: userId,
        version: 1,
      },
    };
  }
  
  private getHoursInPeriod(serviceHours: ServiceHours[], period: string): number {
    return serviceHours
      .filter(h => h.date.startsWith(period))
      .reduce((sum, h) => sum + h.duration, 0) / 60;
  }
  
  private getHoursInQuarter(serviceHours: ServiceHours[], year: number, quarter: number): number {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;
    
    return serviceHours
      .filter(h => {
        const date = new Date(h.date);
        return date.getFullYear() === year && date.getMonth() + 1 >= startMonth && date.getMonth() + 1 <= endMonth;
      })
      .reduce((sum, h) => sum + h.duration, 0) / 60;
  }
  
  private getHoursInYear(serviceHours: ServiceHours[], year: number): number {
    return serviceHours
      .filter(h => new Date(h.date).getFullYear() === year)
      .reduce((sum, h) => sum + h.duration, 0) / 60;
  }
  
  private getMonthsActive(serviceHours: ServiceHours[]): number {
    const months = new Set(serviceHours.map(h => h.date.slice(0, 7)));
    return months.size;
  }
  
  private calculateMilestones(
    hours: number,
    cases: number,
    transports: number,
    fosters: number
  ): Milestone[] {
    const achieved: Milestone[] = [];
    
    for (const milestone of SERVICE_MILESTONES) {
      let value = 0;
      switch (milestone.metricType) {
        case 'hours': value = hours; break;
        case 'cases': value = cases; break;
        case 'transports': value = transports; break;
        case 'fosters': value = fosters; break;
        case 'animals': value = cases + transports + fosters; break;
      }
      
      if (value >= milestone.threshold) {
        achieved.push({
          ...milestone,
          achievedAt: new Date().toISOString(), // Should be actual achievement date
        });
      }
    }
    
    return achieved;
  }
  
  private getNextMilestone(
    hours: number,
    cases: number,
    transports: number,
    fosters: number
  ): Milestone | undefined {
    const upcoming = SERVICE_MILESTONES.filter(m => {
      let value = 0;
      switch (m.metricType) {
        case 'hours': value = hours; break;
        case 'cases': value = cases; break;
        case 'transports': value = transports; break;
        case 'fosters': value = fosters; break;
        case 'animals': value = cases + transports + fosters; break;
      }
      return value < m.threshold;
    });
    
    // Return the closest milestone
    return upcoming.sort((a, b) => a.threshold - b.threshold)[0];
  }
  
  private calculateStreaks(loginHistory: { timestamp: string }[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (loginHistory.length === 0) return { currentStreak: 0, longestStreak: 0 };
    
    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;
    
    for (let i = 1; i < loginHistory.length; i++) {
      const current = new Date(loginHistory[i].timestamp);
      const previous = new Date(loginHistory[i - 1].timestamp);
      const daysDiff = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        tempStreak++;
        if (i === loginHistory.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { currentStreak, longestStreak };
  }
  
  private calculateActivityTrend(loginHistory: { timestamp: string }[]): 'increasing' | 'stable' | 'decreasing' {
    if (loginHistory.length < 7) return 'stable';
    
    const recent = loginHistory.slice(0, 7).length;
    const previous = loginHistory.slice(7, 14).length;
    
    if (recent > previous * 1.2) return 'increasing';
    if (recent < previous * 0.8) return 'decreasing';
    return 'stable';
  }
  
  private calculateEngagementScore(
    activities: any,
    reliability: any,
    activityTrend: string
  ): number {
    let score = 50; // Base score
    
    // Activity score (0-30 points)
    const activityScore = Math.min(
      (activities.messagesSent + activities.callsMade + activities.forumPosts) / 10 * 30,
      30
    );
    score += activityScore;
    
    // Reliability score (0-20 points)
    const reliabilityScore = (reliability.onTimePercentage / 100) * 20;
    score += reliabilityScore;
    
    // Trend bonus/penalty
    if (activityTrend === 'increasing') score += 10;
    if (activityTrend === 'decreasing') score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  private calculatePerformancePercentile(
    resolutionRate: number,
    responseTime: number,
    peerRating: number
  ): number {
    // Simplified percentile calculation
    // In production, this would use actual distribution data
    let score = 0;
    
    // Resolution rate (40% weight)
    score += (resolutionRate / 100) * 40;
    
    // Response time (30% weight) - lower is better
    const responseScore = Math.max(0, 30 - (responseTime / 60) * 30);
    score += responseScore;
    
    // Peer rating (30% weight)
    score += (peerRating / 5) * 30;
    
    return Math.round(score);
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const metricsCalculator = new MetricsCalculator();

export function createServiceHours(params: {
  userId: UserId;
  date: string;
  startTime: string;
  endTime: string;
  activityType: ActivityType;
  description?: string;
  location?: string;
  mileage?: number;
}): ServiceHours {
  const start = new Date(`${params.date}T${params.startTime}`);
  const end = new Date(`${params.date}T${params.endTime}`);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  
  return {
    id: crypto.randomUUID(),
    userId: params.userId,
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
    duration,
    activityType: params.activityType,
    description: params.description,
    verified: false,
    location: params.location,
    mileage: params.mileage,
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: params.userId,
      version: 1,
    },
  };
}

export function verifyServiceHours(
  hours: ServiceHours,
  verifiedBy: UserId
): ServiceHours {
  return {
    ...hours,
    verified: true,
    verifiedBy,
    verifiedAt: new Date().toISOString(),
    audit: {
      ...hours.audit,
      updatedAt: new Date().toISOString(),
      version: hours.audit.version + 1,
    },
  };
}

export function getTopVolunteers(
  metrics: ServiceMetrics[],
  metric: 'totalHours' | 'totalCases' | 'totalTransports',
  limit: number = 10
): ServiceMetrics[] {
  return metrics
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, limit);
}

export function getVolunteerRanking(
  metrics: ServiceMetrics[],
  userId: UserId
): { region: number; overall: number } | null {
  const user = metrics.find(m => m.userId === userId);
  if (!user) return null;
  
  const sortedByHours = metrics.sort((a, b) => b.totalHours - a.totalHours);
  const overallRank = sortedByHours.findIndex(m => m.userId === userId) + 1;
  
  // Region ranking would be calculated with region-specific metrics
  const regionRank = overallRank; // Simplified
  
  return { region: regionRank, overall: overallRank };
}
