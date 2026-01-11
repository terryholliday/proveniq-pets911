/**
 * OPERATIONS MODULE - BACKGROUND CHECK INTEGRATIONS
 * 
 * Background check provider integrations for volunteer verification.
 */

import type { UserId, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// BACKGROUND CHECK TYPES
// ═══════════════════════════════════════════════════════════════════

export type BackgroundCheckType = 
  | 'basic'              // Name/SSN verification, sex offender registry
  | 'standard'           // Basic + criminal history (7 years)
  | 'enhanced'           // Standard + driving record
  | 'comprehensive';     // Enhanced + credit check, employment verification

export type BackgroundCheckStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export type BackgroundCheckResult = 
  | 'clear'
  | 'review_required'
  | 'disqualifying'
  | 'unable_to_complete';

export interface BackgroundCheck {
  id: string;
  
  // Subject
  subjectUserId: UserId;
  subjectName: string;
  
  // Check details
  checkType: BackgroundCheckType;
  providerId: string;
  providerName: string;
  providerReference?: string;
  
  // Status
  status: BackgroundCheckStatus;
  result?: BackgroundCheckResult;
  
  // Timing
  requestedAt: string;
  requestedBy: UserId;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  
  // Consent
  consentCaptured: boolean;
  consentCapturedAt?: string;
  consentDocumentUrl?: string;
  
  // Results (summary only - PII stored securely)
  resultSummary?: BackgroundCheckSummary;
  
  // Review
  reviewRequired: boolean;
  reviewedAt?: string;
  reviewedBy?: UserId;
  reviewNotes?: string;
  reviewDecision?: 'approved' | 'denied' | 'conditional';
  
  // Flags
  flags: BackgroundCheckFlag[];
  
  // Cost
  cost?: number;
  billedAt?: string;
  
  audit: AuditMetadata;
}

export interface BackgroundCheckSummary {
  // Identity verification
  identityVerified: boolean;
  ssnVerified: boolean;
  
  // Criminal history
  criminalRecordsFound: boolean;
  criminalRecordCount?: number;
  felonyCount?: number;
  misdemeanorCount?: number;
  oldestRecordYears?: number;
  
  // Sex offender registry
  sexOffenderRegistryCheck: boolean;
  sexOffenderFound: boolean;
  
  // Driving record (if applicable)
  drivingRecordChecked: boolean;
  drivingRecordClear?: boolean;
  drivingViolationCount?: number;
  licenseStatus?: 'valid' | 'suspended' | 'revoked' | 'expired' | 'not_found';
  
  // Watchlists
  watchlistChecked: boolean;
  watchlistHit: boolean;
  
  // Overall
  overallRiskLevel?: 'low' | 'medium' | 'high';
  recommendedAction?: 'approve' | 'review' | 'deny';
  
  // Notes from provider
  providerNotes?: string;
}

export interface BackgroundCheckFlag {
  type: BackgroundCheckFlagType;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  details?: string;
  disqualifying: boolean;
  requiresReview: boolean;
}

export type BackgroundCheckFlagType = 
  | 'identity_mismatch'
  | 'ssn_mismatch'
  | 'criminal_felony'
  | 'criminal_misdemeanor'
  | 'sex_offender'
  | 'driving_violation'
  | 'driving_dui'
  | 'license_issue'
  | 'watchlist_hit'
  | 'pending_charges'
  | 'unable_to_verify';

// ═══════════════════════════════════════════════════════════════════
// BACKGROUND CHECK PROVIDERS
// ═══════════════════════════════════════════════════════════════════

export interface BackgroundCheckProvider {
  id: string;
  name: string;
  
  // Capabilities
  checkTypesSupported: BackgroundCheckType[];
  statesCovered: string[]; // State codes or 'all'
  
  // Timing
  averageCompletionHours: number;
  expeditedAvailable: boolean;
  expeditedHours?: number;
  
  // Cost
  baseCost: Record<BackgroundCheckType, number>;
  expeditedCost?: number;
  
  // Integration
  apiEnabled: boolean;
  webhookSupported: boolean;
  
  // Status
  isActive: boolean;
  isPreferred: boolean;
  
  // Compliance
  fcraCompliant: boolean;
  pbsaAccredited: boolean;
}

export const BACKGROUND_CHECK_PROVIDERS: BackgroundCheckProvider[] = [
  {
    id: 'checkr',
    name: 'Checkr',
    checkTypesSupported: ['basic', 'standard', 'enhanced', 'comprehensive'],
    statesCovered: ['all'],
    averageCompletionHours: 24,
    expeditedAvailable: true,
    expeditedHours: 4,
    baseCost: {
      basic: 25,
      standard: 40,
      enhanced: 60,
      comprehensive: 85,
    },
    expeditedCost: 20,
    apiEnabled: true,
    webhookSupported: true,
    isActive: true,
    isPreferred: true,
    fcraCompliant: true,
    pbsaAccredited: true,
  },
  {
    id: 'sterling',
    name: 'Sterling',
    checkTypesSupported: ['basic', 'standard', 'enhanced', 'comprehensive'],
    statesCovered: ['all'],
    averageCompletionHours: 48,
    expeditedAvailable: true,
    expeditedHours: 12,
    baseCost: {
      basic: 30,
      standard: 50,
      enhanced: 75,
      comprehensive: 100,
    },
    expeditedCost: 25,
    apiEnabled: true,
    webhookSupported: true,
    isActive: true,
    isPreferred: false,
    fcraCompliant: true,
    pbsaAccredited: true,
  },
  {
    id: 'goodhire',
    name: 'GoodHire',
    checkTypesSupported: ['basic', 'standard', 'enhanced'],
    statesCovered: ['all'],
    averageCompletionHours: 72,
    expeditedAvailable: false,
    baseCost: {
      basic: 20,
      standard: 35,
      enhanced: 55,
      comprehensive: 0, // Not supported
    },
    apiEnabled: true,
    webhookSupported: true,
    isActive: true,
    isPreferred: false,
    fcraCompliant: true,
    pbsaAccredited: false,
  },
];

// ═══════════════════════════════════════════════════════════════════
// DISQUALIFICATION RULES
// ═══════════════════════════════════════════════════════════════════

export interface DisqualificationRule {
  id: string;
  name: string;
  description: string;
  flagTypes: BackgroundCheckFlagType[];
  condition: 'any' | 'all';
  lookbackYears?: number;
  severity: 'disqualifying' | 'review_required' | 'warning';
  appliesToRoles: string[]; // Role IDs or 'all'
  overridable: boolean;
  overrideRequiresRole?: string;
}

export const DISQUALIFICATION_RULES: DisqualificationRule[] = [
  {
    id: 'sex_offender',
    name: 'Sex Offender Registry',
    description: 'Presence on sex offender registry is permanently disqualifying',
    flagTypes: ['sex_offender'],
    condition: 'any',
    severity: 'disqualifying',
    appliesToRoles: ['all'],
    overridable: false,
  },
  {
    id: 'violent_felony',
    name: 'Violent Felony',
    description: 'Violent felony within 10 years is disqualifying',
    flagTypes: ['criminal_felony'],
    condition: 'any',
    lookbackYears: 10,
    severity: 'disqualifying',
    appliesToRoles: ['all'],
    overridable: true,
    overrideRequiresRole: 'foundation_admin',
  },
  {
    id: 'any_felony',
    name: 'Any Felony',
    description: 'Any felony within 7 years requires review',
    flagTypes: ['criminal_felony'],
    condition: 'any',
    lookbackYears: 7,
    severity: 'review_required',
    appliesToRoles: ['all'],
    overridable: true,
    overrideRequiresRole: 'regional_coordinator',
  },
  {
    id: 'dui_transport',
    name: 'DUI for Transport Roles',
    description: 'DUI within 5 years disqualifies from transport roles',
    flagTypes: ['driving_dui'],
    condition: 'any',
    lookbackYears: 5,
    severity: 'disqualifying',
    appliesToRoles: ['transporter', 'senior_transporter'],
    overridable: false,
  },
  {
    id: 'license_issue',
    name: 'License Issues for Transport',
    description: 'Invalid license disqualifies from transport roles',
    flagTypes: ['license_issue'],
    condition: 'any',
    severity: 'disqualifying',
    appliesToRoles: ['transporter', 'senior_transporter'],
    overridable: false,
  },
  {
    id: 'identity_mismatch',
    name: 'Identity Verification Failed',
    description: 'Unable to verify identity requires review',
    flagTypes: ['identity_mismatch', 'ssn_mismatch'],
    condition: 'any',
    severity: 'review_required',
    appliesToRoles: ['all'],
    overridable: true,
    overrideRequiresRole: 'lead_moderator',
  },
];

// ═══════════════════════════════════════════════════════════════════
// BACKGROUND CHECK MANAGER
// ═══════════════════════════════════════════════════════════════════

export class BackgroundCheckManager {
  /**
   * Initiate background check
   */
  initiateCheck(params: {
    subjectUserId: UserId;
    subjectName: string;
    checkType: BackgroundCheckType;
    providerId: string;
    requestedBy: UserId;
  }): BackgroundCheck {
    const now = new Date().toISOString();
    const provider = BACKGROUND_CHECK_PROVIDERS.find(p => p.id === params.providerId);
    
    if (!provider) {
      throw new Error(`Provider not found: ${params.providerId}`);
    }
    
    if (!provider.checkTypesSupported.includes(params.checkType)) {
      throw new Error(`Provider does not support check type: ${params.checkType}`);
    }
    
    // Calculate expiration (1 year from completion)
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    return {
      id: crypto.randomUUID(),
      subjectUserId: params.subjectUserId,
      subjectName: params.subjectName,
      checkType: params.checkType,
      providerId: params.providerId,
      providerName: provider.name,
      status: 'pending',
      requestedAt: now,
      requestedBy: params.requestedBy,
      expiresAt: expiresAt.toISOString(),
      consentCaptured: false,
      reviewRequired: false,
      flags: [],
      cost: provider.baseCost[params.checkType],
      audit: {
        createdAt: now,
        createdBy: params.requestedBy,
        version: 1,
      },
    };
  }
  
  /**
   * Record consent
   */
  recordConsent(
    check: BackgroundCheck,
    consentDocumentUrl?: string
  ): BackgroundCheck {
    const now = new Date().toISOString();
    
    return {
      ...check,
      consentCaptured: true,
      consentCapturedAt: now,
      consentDocumentUrl,
      audit: {
        ...check.audit,
        updatedAt: now,
        version: check.audit.version + 1,
      },
    };
  }
  
  /**
   * Start check
   */
  startCheck(
    check: BackgroundCheck,
    providerReference: string
  ): BackgroundCheck {
    const now = new Date().toISOString();
    
    if (!check.consentCaptured) {
      throw new Error('Cannot start check without consent');
    }
    
    return {
      ...check,
      status: 'in_progress',
      startedAt: now,
      providerReference,
      audit: {
        ...check.audit,
        updatedAt: now,
        version: check.audit.version + 1,
      },
    };
  }
  
  /**
   * Complete check with results
   */
  completeCheck(
    check: BackgroundCheck,
    summary: BackgroundCheckSummary,
    flags: BackgroundCheckFlag[]
  ): BackgroundCheck {
    const now = new Date().toISOString();
    
    // Determine result
    const hasDisqualifying = flags.some(f => f.disqualifying);
    const hasReviewRequired = flags.some(f => f.requiresReview);
    
    let result: BackgroundCheckResult = 'clear';
    if (hasDisqualifying) {
      result = 'disqualifying';
    } else if (hasReviewRequired) {
      result = 'review_required';
    }
    
    return {
      ...check,
      status: 'completed',
      result,
      completedAt: now,
      resultSummary: summary,
      flags,
      reviewRequired: hasReviewRequired && !hasDisqualifying,
      audit: {
        ...check.audit,
        updatedAt: now,
        version: check.audit.version + 1,
      },
    };
  }
  
  /**
   * Record review
   */
  recordReview(
    check: BackgroundCheck,
    reviewedBy: UserId,
    decision: BackgroundCheck['reviewDecision'],
    notes?: string
  ): BackgroundCheck {
    const now = new Date().toISOString();
    
    return {
      ...check,
      reviewedAt: now,
      reviewedBy,
      reviewDecision: decision,
      reviewNotes: notes,
      audit: {
        ...check.audit,
        updatedAt: now,
        version: check.audit.version + 1,
      },
    };
  }
  
  /**
   * Evaluate flags against rules
   */
  evaluateFlags(
    flags: BackgroundCheckFlag[],
    roleId: string
  ): {
    isDisqualified: boolean;
    requiresReview: boolean;
    matchedRules: DisqualificationRule[];
  } {
    const matchedRules: DisqualificationRule[] = [];
    let isDisqualified = false;
    let requiresReview = false;
    
    for (const rule of DISQUALIFICATION_RULES) {
      // Check if rule applies to this role
      if (!rule.appliesToRoles.includes('all') && !rule.appliesToRoles.includes(roleId)) {
        continue;
      }
      
      // Check if flags match rule
      const matchingFlags = flags.filter(f => rule.flagTypes.includes(f.type));
      
      let ruleMatched = false;
      if (rule.condition === 'any') {
        ruleMatched = matchingFlags.length > 0;
      } else {
        ruleMatched = rule.flagTypes.every(ft => matchingFlags.some(f => f.type === ft));
      }
      
      if (ruleMatched) {
        matchedRules.push(rule);
        
        if (rule.severity === 'disqualifying') {
          isDisqualified = true;
        } else if (rule.severity === 'review_required') {
          requiresReview = true;
        }
      }
    }
    
    return {
      isDisqualified,
      requiresReview: requiresReview && !isDisqualified,
      matchedRules,
    };
  }
  
  /**
   * Check if background check is valid
   */
  isCheckValid(check: BackgroundCheck): boolean {
    if (check.status !== 'completed') return false;
    if (check.result === 'disqualifying') return false;
    if (check.result === 'review_required' && !check.reviewedAt) return false;
    if (check.reviewDecision === 'denied') return false;
    if (check.expiresAt && new Date(check.expiresAt) <= new Date()) return false;
    
    return true;
  }
  
  /**
   * Get check statistics
   */
  getStatistics(checks: BackgroundCheck[]): {
    total: number;
    byStatus: Record<BackgroundCheckStatus, number>;
    byResult: Record<BackgroundCheckResult, number>;
    clearRate: number;
    averageCompletionTime: number;
    totalCost: number;
  } {
    const byStatus: Record<string, number> = {};
    const byResult: Record<string, number> = {};
    let totalCompletionTime = 0;
    let completionTimeCount = 0;
    let totalCost = 0;
    
    for (const check of checks) {
      byStatus[check.status] = (byStatus[check.status] ?? 0) + 1;
      
      if (check.result) {
        byResult[check.result] = (byResult[check.result] ?? 0) + 1;
      }
      
      if (check.startedAt && check.completedAt) {
        const completionTime = new Date(check.completedAt).getTime() - new Date(check.startedAt).getTime();
        totalCompletionTime += completionTime;
        completionTimeCount++;
      }
      
      if (check.cost) {
        totalCost += check.cost;
      }
    }
    
    const completed = checks.filter(c => c.status === 'completed').length;
    const clear = checks.filter(c => c.result === 'clear').length;
    const clearRate = completed > 0 ? (clear / completed) * 100 : 0;
    
    const averageCompletionTime = completionTimeCount > 0
      ? totalCompletionTime / completionTimeCount / (1000 * 60 * 60) // hours
      : 0;
    
    return {
      total: checks.length,
      byStatus: byStatus as Record<BackgroundCheckStatus, number>,
      byResult: byResult as Record<BackgroundCheckResult, number>,
      clearRate,
      averageCompletionTime,
      totalCost,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const backgroundCheckManager = new BackgroundCheckManager();

export function getPreferredProvider(): BackgroundCheckProvider | undefined {
  return BACKGROUND_CHECK_PROVIDERS.find(p => p.isActive && p.isPreferred);
}

export function getProviderById(id: string): BackgroundCheckProvider | undefined {
  return BACKGROUND_CHECK_PROVIDERS.find(p => p.id === id);
}

export function getActiveProviders(): BackgroundCheckProvider[] {
  return BACKGROUND_CHECK_PROVIDERS.filter(p => p.isActive);
}

export function getProvidersForCheckType(checkType: BackgroundCheckType): BackgroundCheckProvider[] {
  return BACKGROUND_CHECK_PROVIDERS.filter(p => 
    p.isActive && p.checkTypesSupported.includes(checkType)
  );
}

export function isCheckExpired(check: BackgroundCheck): boolean {
  if (!check.expiresAt) return false;
  return new Date(check.expiresAt) <= new Date();
}

export function needsRenewal(check: BackgroundCheck, daysThreshold: number = 30): boolean {
  if (!check.expiresAt) return false;
  
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);
  
  return new Date(check.expiresAt) <= threshold;
}

export function getCheckRequirementForRole(roleId: string): BackgroundCheckType {
  const roleCheckTypes: Record<string, BackgroundCheckType> = {
    foundation_admin: 'comprehensive',
    regional_coordinator: 'comprehensive',
    lead_moderator: 'enhanced',
    moderator: 'standard',
    junior_moderator: 'standard',
    senior_transporter: 'enhanced',
    transporter: 'enhanced',
    emergency_foster: 'standard',
    foster: 'standard',
    trapper: 'standard',
    community_volunteer: 'basic',
  };
  
  return roleCheckTypes[roleId] ?? 'basic';
}

export function canOverrideDisqualification(
  rule: DisqualificationRule,
  userRole: string
): boolean {
  if (!rule.overridable) return false;
  if (!rule.overrideRequiresRole) return false;
  
  // Role hierarchy for override permissions
  const roleHierarchy = [
    'foundation_admin',
    'regional_coordinator',
    'lead_moderator',
    'moderator',
  ];
  
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(rule.overrideRequiresRole);
  
  return userRoleIndex !== -1 && userRoleIndex <= requiredRoleIndex;
}
