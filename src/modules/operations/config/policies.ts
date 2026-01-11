/**
 * OPERATIONS MODULE - POLICY CONFIGURATION
 * 
 * Centralized configuration for all operational policies.
 * These values can be overridden per-region.
 */

// ═══════════════════════════════════════════════════════════════════
// MAIN OPERATIONS POLICY
// ═══════════════════════════════════════════════════════════════════

export const OPERATIONS_POLICY = {
  // ─────────────────────────────────────────────────────────────────
  // Case Management
  // ─────────────────────────────────────────────────────────────────
  cases: {
    maxActiveCasesPerModerator: 15,
    maxActiveCasesPerJuniorModerator: 8,
    maxActiveCasesPerLeadModerator: 25,
    
    // Triage timing
    defaultTriageMinutes: 30,
    urgentTriageMinutes: 5,
    criticalTriageMinutes: 2,
    
    // SLA deadlines (hours)
    slaT1ResponseHours: 1,
    slaT2ResponseHours: 4,
    slaT3ResponseHours: 24,
    slaT4ResponseHours: 48,
    slaT5ResponseHours: 72,
    
    // Archive
    maxCaseAgeDaysBeforeArchive: 365,
    archiveClosedAfterDays: 90,
    
    // Matching
    archivedCasesMatchable: true,
    matchSearchRadiusKm: 50,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // Volunteer Management
  // ─────────────────────────────────────────────────────────────────
  volunteers: {
    // Cooldowns
    reapplicationCooldownDays: 90,
    suspensionAppealCooldownDays: 30,
    
    // Inactivity
    inactivityWarningDays: 60,
    inactivityDeactivationDays: 90,
    
    // Shift limits
    maxConsecutiveShiftDays: 5,
    minHoursBetweenShifts: 8,
    maxShiftHoursPerDay: 10,
    maxShiftHoursPerWeek: 40,
    
    // Dispatch limits
    maxConcurrentDispatchesTransporter: 2,
    maxConcurrentDispatchesSeniorTransporter: 3,
    
    // Background checks
    backgroundCheckExpirationDays: 730, // 2 years
    backgroundCheckRenewalWarningDays: 60,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // Owner Verification
  // ─────────────────────────────────────────────────────────────────
  verification: {
    // Score thresholds
    ownershipScoreAutoVerify: 85,
    ownershipScoreStandardApproval: 60,
    ownershipScoreLeadReview: 40,
    ownershipScoreReject: 25,
    
    // Hold settings
    releaseHoldDefaultHours: 24,
    releaseHoldMaxHours: 168, // 7 days
    
    // Two-person requirements
    twoPersonApprovalBelowScore: 60,
    twoPersonApprovalOnDispute: true,
    twoPersonApprovalOnFraudSuspicion: true,
    
    // Knowledge test
    knowledgeTestMinQuestions: 3,
    knowledgeTestMaxQuestions: 7,
    knowledgeTestPassThreshold: 60, // percent
    
    // Evidence expiration
    evidenceUrlExpirationHours: 72,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // Field Safety
  // ─────────────────────────────────────────────────────────────────
  safety: {
    // Check-in intervals
    loneWorkerCheckInMinutes: 30,
    loneWorkerHighRiskCheckInMinutes: 15,
    
    // Escalation thresholds
    loneWorkerEscalation1Minutes: 15,
    loneWorkerEscalation2Minutes: 30,
    loneWorkerEscalation3Minutes: 60,
    
    // Location
    locationRetentionDays: 30,
    locationConsentExpirationDays: 365,
    
    // Buddy system
    buddyRequiredForNightOps: true,
    buddyRequiredForAggressiveAnimal: true,
    nightOpsStartHour: 22,
    nightOpsEndHour: 6,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // On-Call
  // ─────────────────────────────────────────────────────────────────
  onCall: {
    primaryResponseMinutes: 5,
    backupResponseMinutes: 10,
    tertiaryResponseMinutes: 15,
    
    maxConsecutiveOnCallDays: 3,
    minDaysBetweenOnCallWeeks: 2,
    
    acknowledgementDeadlineHours: 48,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // Wellness
  // ─────────────────────────────────────────────────────────────────
  wellness: {
    // Forced breaks
    forcedBreakAfterDeceasedCases: 3,
    forcedBreakAfterHighStressCases: 5,
    forcedBreakAfterConsecutiveDays: 7,
    forcedBreakDurationHours: 24,
    
    // Check-ins
    wellnessCheckInIntervalDays: 30,
    
    // Thresholds
    deceasedCasesAlertThreshold30Days: 5,
    highStressCasesAlertThreshold30Days: 10,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // Alerts
  // ─────────────────────────────────────────────────────────────────
  alerts: {
    // Tier definitions
    t1RadiusKm: 5,      // Neighborhood
    t2RadiusKm: 15,     // County
    t3RadiusKm: 50,     // Regional
    t4RadiusKm: 150,    // State
    t5RadiusKm: 500,    // Emergency broadcast
    
    // Cooldowns
    alertCooldownMinutes: 30,
    maxAlertsPerCasePerDay: 3,
    
    // Two-person requirements
    twoPersonRequiredTier: 4,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // Rate Limits
  // ─────────────────────────────────────────────────────────────────
  rateLimits: {
    applicationsApprovedPerHour: 15,
    applicationsApprovedPerDay: 50,
    casesClosedPerHour: 20,
    casesClosedPerDay: 100,
    alertsTriggeredPerHour: 10,
    alertsTriggeredPerDay: 30,
    dispatchesPerHour: 20,
    matchNotificationsPerHour: 15,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // Communication
  // ─────────────────────────────────────────────────────────────────
  communication: {
    // Quiet hours
    defaultQuietHoursStart: '22:00',
    defaultQuietHoursEnd: '07:00',
    quietHoursOverrideForT1: true,
    
    // Batching
    nonUrgentBatchIntervalMinutes: 60,
    
    // Retries
    notificationRetryAttempts: 3,
    notificationRetryDelayMinutes: 5,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // Break-Glass
  // ─────────────────────────────────────────────────────────────────
  breakGlass: {
    defaultTtlMinutes: 30,
    maxTtlMinutes: 120,
    autoGrantReasonCodes: ['immediate_safety', 'vet_emergency'],
    requiresReview: true,
    reviewDeadlineHours: 24,
  },
  
  // ─────────────────────────────────────────────────────────────────
  // Training
  // ─────────────────────────────────────────────────────────────────
  training: {
    modulePassingScore: 80,
    maxAttemptsPerModule: 3,
    attemptCooldownHours: 24,
    certificationValidityDays: 365,
    recertificationWarningDays: 30,
  },
};

// ═══════════════════════════════════════════════════════════════════
// REGIONAL OVERRIDES
// ═══════════════════════════════════════════════════════════════════

export interface RegionalOverride {
  regionId: string;
  regionName: string;
  overrides: Partial<typeof OPERATIONS_POLICY>;
  effectiveDate: string;
  expiresAt?: string;
  reason: string;
}

export const REGIONAL_OVERRIDES: RegionalOverride[] = [
  // Example: Hurricane season in coastal regions
  // {
  //   regionId: 'region_coastal',
  //   regionName: 'Coastal Region',
  //   overrides: {
  //     safety: {
  //       ...OPERATIONS_POLICY.safety,
  //       loneWorkerCheckInMinutes: 15,
  //     },
  //   },
  //   effectiveDate: '2026-06-01',
  //   expiresAt: '2026-11-30',
  //   reason: 'Hurricane season - increased safety measures',
  // },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get effective policy for a region
 */
export function getEffectivePolicy(regionId?: string): typeof OPERATIONS_POLICY {
  if (!regionId) return OPERATIONS_POLICY;
  
  const override = REGIONAL_OVERRIDES.find(o => 
    o.regionId === regionId &&
    new Date(o.effectiveDate) <= new Date() &&
    (!o.expiresAt || new Date(o.expiresAt) > new Date())
  );
  
  if (!override) return OPERATIONS_POLICY;
  
  // Deep merge overrides
  return deepMerge(OPERATIONS_POLICY, override.overrides);
}

/**
 * Get specific policy value
 */
export function getPolicyValue<K extends keyof typeof OPERATIONS_POLICY>(
  category: K,
  key: keyof typeof OPERATIONS_POLICY[K],
  regionId?: string
): typeof OPERATIONS_POLICY[K][typeof key] {
  const policy = getEffectivePolicy(regionId);
  return policy[category][key];
}

/**
 * Deep merge utility
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue as any);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as any;
    }
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// POLICY VALIDATION
// ═══════════════════════════════════════════════════════════════════

export interface PolicyValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate policy configuration
 */
export function validatePolicy(policy: typeof OPERATIONS_POLICY): PolicyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate escalation timing is sequential
  if (policy.safety.loneWorkerEscalation1Minutes >= policy.safety.loneWorkerEscalation2Minutes) {
    errors.push('Escalation 1 must be less than Escalation 2');
  }
  if (policy.safety.loneWorkerEscalation2Minutes >= policy.safety.loneWorkerEscalation3Minutes) {
    errors.push('Escalation 2 must be less than Escalation 3');
  }
  
  // Validate thresholds are in order
  if (policy.verification.ownershipScoreReject >= policy.verification.ownershipScoreLeadReview) {
    errors.push('Reject threshold must be less than lead review threshold');
  }
  if (policy.verification.ownershipScoreLeadReview >= policy.verification.ownershipScoreStandardApproval) {
    errors.push('Lead review threshold must be less than standard approval');
  }
  
  // Validate rate limits are reasonable
  if (policy.rateLimits.applicationsApprovedPerHour > policy.rateLimits.applicationsApprovedPerDay) {
    warnings.push('Hourly application limit exceeds daily limit');
  }
  
  // Validate shift limits
  if (policy.volunteers.maxShiftHoursPerDay * 7 < policy.volunteers.maxShiftHoursPerWeek) {
    warnings.push('Weekly shift limit may be unreachable given daily limit');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
