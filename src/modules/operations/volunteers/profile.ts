/**
 * OPERATIONS MODULE - VOLUNTEER PROFILES
 * 
 * Extended volunteer profiles with capabilities, equipment, and preferences.
 */

import type { 
  UserId, Species, DayOfWeek, TimeSlot, 
  ContactMethod, AuditMetadata, IdentityAssuranceLevel 
} from '../types';
import type { RoleId } from '../roles';

// ═══════════════════════════════════════════════════════════════════
// VOLUNTEER PROFILE
// ═══════════════════════════════════════════════════════════════════

export interface VolunteerProfile {
  userId: UserId;
  
  // Identity
  identity: IdentityProfile;
  
  // Cultural competency
  cultural: CulturalCompetency;
  
  // Role-specific capabilities
  transporterDetails?: TransporterCapabilities;
  fosterDetails?: FosterCapabilities;
  trapperDetails?: TrapperCapabilities;
  
  // General capabilities
  animalHandling: AnimalHandlingCapabilities;
  
  // Equipment
  personalEquipment: PersonalEquipment[];
  
  // Service area
  serviceArea: VolunteerServiceArea;
  
  // Availability
  availability: AvailabilitySchedule;
  
  // Notifications
  notificationPreferences: VolunteerNotificationPreferences;
  
  // Wellness
  wellnessStatus: WellnessStatus;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// IDENTITY PROFILE
// ═══════════════════════════════════════════════════════════════════

export interface IdentityProfile {
  legalName: string;
  displayName: string;
  dateOfBirth: string;
  ial: IdentityAssuranceLevel;
  
  // Verification
  idVerified: boolean;
  idType?: 'drivers_license' | 'state_id' | 'passport' | 'military_id';
  idVerifiedAt?: string;
  idVerifiedBy?: string;
  
  // 2FA
  twoFactorEnabled: boolean;
  twoFactorEnabledAt?: string;
  twoFactorMethod?: 'totp' | 'sms' | 'email';
}

// ═══════════════════════════════════════════════════════════════════
// CULTURAL COMPETENCY
// ═══════════════════════════════════════════════════════════════════

export interface CulturalCompetency {
  languages: {
    code: string; // ISO 639-1, e.g., 'es', 'vi', 'ht'
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
    canTranslate: boolean;
  }[];
  familiarNeighborhoods: string[];
  culturalTrainingCompleted: boolean;
  culturalTrainingDate?: string;
  culturalNotes?: string;
}

// ═══════════════════════════════════════════════════════════════════
// TRANSPORTER CAPABILITIES
// ═══════════════════════════════════════════════════════════════════

export interface TransporterCapabilities {
  // Vehicle
  vehicleType: 'sedan' | 'suv' | 'truck' | 'van' | 'minivan';
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor?: string;
  licensePlate?: string; // Encrypted
  
  // Insurance
  insuranceVerified: boolean;
  insuranceExpiry: string;
  insuranceDocumentUrl?: string;
  insuranceProvider?: string;
  
  // Equipment
  hasCarrierSmall: boolean;
  hasCarrierMedium: boolean;
  hasCarrierLarge: boolean;
  hasCrate: boolean;
  hasSlipLead: boolean;
  hasHarness: boolean;
  hasMuzzle: boolean;
  hasFirstAidKit: boolean;
  hasWaterBowls: boolean;
  hasBlankets: boolean;
  
  // Limits
  maxAnimalWeight: number; // kg
  maxAnimalCount: number;
  maxDistanceKm: number;
  maxTransportHours: number;
  
  // Special capabilities
  canTransportAggressive: boolean;
  canTransportInjured: boolean;
  canTransportExotic: boolean;
  canTransportMultiple: boolean;
  canTransportOvernight: boolean;
  
  // Preferences
  prefersHighway: boolean;
  avoidsTolls: boolean;
  hasGPS: boolean;
  canProvideUpdates: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// FOSTER CAPABILITIES
// ═══════════════════════════════════════════════════════════════════

export interface FosterCapabilities {
  // Home
  homeType: 'house' | 'apartment' | 'condo' | 'mobile_home' | 'farm' | 'ranch';
  hasYard: boolean;
  yardFenced: boolean;
  fenceHeightFeet?: number;
  fenceType?: 'wood' | 'chain_link' | 'vinyl' | 'invisible' | 'other';
  yardSizeSqFt?: number;
  
  // Isolation/Medical
  isolationCapability: 'none' | 'separate_room' | 'separate_floor' | 'detached_structure';
  canQuarantine: boolean;
  quarantineExperience?: string;
  hasQuarantineSupplies: boolean;
  
  // Medical care
  canAdministerMedication: boolean;
  canProvideSubQ: boolean; // Subcutaneous fluids
  canGiveInjections: boolean;
  canChangeBandages: boolean;
  canHandleSpecialNeeds: boolean;
  bottleBabyExperience: boolean;
  neonatalCareExperience: boolean;
  hospiceCareWilling: boolean;
  behavioralRehabWilling: boolean;
  
  // Current household
  hasOtherPets: boolean;
  otherPetsDescription?: string;
  otherPetsVaccinated: boolean;
  otherPetsFriendlyToNew: boolean;
  hasChildren: boolean;
  childrenAges?: string[];
  childrenComfortableWithAnimals: boolean;
  hasElderly: boolean;
  
  // Capacity
  speciesAccepted: Species[];
  speciesExcluded: Species[];
  maxSizeAccepted: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'giant';
  maxFosterCount: number;
  currentFosterCount: number;
  canTakeEmergencyFoster: boolean;
  canTakeLongTermFoster: boolean;
  
  // Restrictions
  noCats?: boolean;
  noDogs?: boolean;
  noPuppies?: boolean;
  noKittens?: boolean;
  noUnaltered?: boolean;
  noSpecialNeeds?: boolean;
  
  // Support
  hasVeterinarian: boolean;
  vetName?: string;
  vetDistance?: number; // miles
  canTransportToVet: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// TRAPPER CAPABILITIES
// ═══════════════════════════════════════════════════════════════════

export interface TrapperCapabilities {
  // Experience
  yearsExperience: number;
  estimatedTrapsSet: number;
  estimatedCatsTNRed: number;
  
  // Certification
  tnrCertified: boolean;
  tnrCertificationDate?: string;
  tnrCertificationOrg?: string;
  humaneAllianceTrained: boolean;
  
  // Equipment (personal)
  ownsTrapSmall: boolean;
  ownsTrapMedium: boolean;
  ownsTrapLarge: boolean;
  ownsDropTrap: boolean;
  ownsTrailCamera: boolean;
  ownsTransferCage: boolean;
  ownsTrapDividers: boolean;
  ownsCoverSheets: boolean;
  
  // Capabilities
  willingNightOps: boolean;
  canSetMultipleTraps: boolean;
  feralHandlingExperience: boolean;
  canHandlePregnant: boolean;
  canHandleNursing: boolean;
  canHandleInjured: boolean;
  canClimbTrees: boolean;
  canAccessTightSpaces: boolean;
  
  // Support
  hasAccessToClinic: boolean;
  canProvideTransport: boolean;
  hasRecoverySpace: boolean;
  recoveryDaysAvailable: number;
  
  // Specialized
  specializesInColonies: boolean;
  canManageColony: boolean;
  experiencedWithDogs: boolean;
  experiencedWithWildlife: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// ANIMAL HANDLING CAPABILITIES
// ═══════════════════════════════════════════════════════════════════

export interface AnimalHandlingCapabilities {
  speciesHandled: Species[];
  speciesExcluded: Species[];
  maxWeightKg: number;
  canHandleAggressive: boolean;
  canHandleFeral: boolean;
  canHandleInjured: boolean;
  canHandleMedicalNeeds: boolean;
  canHandleBehavioralIssues: boolean;
  exoticLicensed: boolean;
  largeAnimalCertified: boolean;
  specialSkills: string[];
}

// ═══════════════════════════════════════════════════════════════════
// PERSONAL EQUIPMENT
// ═══════════════════════════════════════════════════════════════════

export interface PersonalEquipment {
  id: string;
  type: string;
  description: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  quantity: number;
  verifiedAt?: string;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE AREA
// ═══════════════════════════════════════════════════════════════════

export interface VolunteerServiceArea {
  // Primary service area
  primaryLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Service radius
  serviceRadiusKm: number;
  serviceRadiusMiles: number;
  
  // Additional service areas
  additionalAreas: {
    city: string;
    state: string;
    county: string;
    notes?: string;
  }[];
  
  // Willing to travel
  maxTravelDistance: number; // miles
  maxTravelTime: number; // minutes
  
  // Restrictions
  avoidedAreas: string[];
  preferredAreas: string[];
  willCrossStateLines: boolean;
  requiresGasReimbursement: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// AVAILABILITY SCHEDULE
// ═══════════════════════════════════════════════════════════════════

export interface AvailabilitySchedule {
  // Weekly schedule
  weeklySlots: {
    day: DayOfWeek;
    slots: TimeSlot[];
    startTime?: string; // More precise, e.g., "09:00"
    endTime?: string;
    available: boolean;
  }[];
  
  // Response times
  canRespondWithin15Min: boolean;
  canRespondWithin30Min: boolean;
  canRespondWithin1Hour: boolean;
  canRespondWithin2Hours: boolean;
  canRespondWithin4Hours: boolean;
  
  // Restrictions
  blackoutDates: { start: string; end: string; reason?: string }[];
  seasonalRestrictions?: {
    season: string;
    unavailable: boolean;
    reason?: string;
  }[];
  
  // On-call availability
  willingOnCall: boolean;
  onCallDays: DayOfWeek[];
  onCallHours: { start: string; end: string };
  
  // Notes
  notes?: string;
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════════════

export interface VolunteerNotificationPreferences {
  // Channels
  channels: {
    push: boolean;
    sms: boolean;
    email: boolean;
    phone: boolean;
    inApp: boolean;
  };
  
  // Contact details
  phoneNumber?: string;
  emailAddress?: string;
  alternatePhone?: string;
  
  // Quiet hours
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "07:00"
    timezone: string;
    overrideForTier1: boolean;
    overrideForTier2: boolean;
  };
  
  // Content filters
  notifyForSpecies: Species[];
  notifyForCaseTypes: string[];
  maxDistanceKm?: number;
  minSeverity?: 'minor' | 'moderate' | 'major' | 'critical';
  
  // Batching
  batchNonUrgent: boolean;
  digestFrequency?: 'immediate' | 'hourly' | 'twice_daily' | 'daily';
  digestTime?: string; // "09:00"
  
  // Language
  preferredLanguage: string;
  
  // Last updated
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════
// WELLNESS STATUS
// ═══════════════════════════════════════════════════════════════════

export interface WellnessStatus {
  currentStatus: 'available' | 'on_break' | 'limited' | 'unavailable';
  statusReason?: 'vacation' | 'medical' | 'family' | 'burnout_recovery' | 'equipment_issue' | 'other';
  statusChangedAt: string;
  statusChangedBy: UserId;
  autoReactivateAt?: string;
  
  // Fatigue tracking
  lastShiftEnded?: string;
  consecutiveDaysActive: number;
  forcedBreakActive: boolean;
  forcedBreakReason?: string;
  forcedBreakEndsAt?: string;
  
  // Compassion fatigue indicators
  deceasedCasesHandled30Days: number;
  highStressCasesHandled30Days: number;
  totalCasesHandled30Days: number;
  hoursServed30Days: number;
  
  // Wellness check-ins
  wellnessCheckInDue?: string;
  lastWellnessCheckIn?: string;
  wellnessScore?: number; // 1-10
  wellnessNotes?: string;
  
  // Support
  hasBuddy: boolean;
  buddyUserId?: UserId;
  needsSupport: boolean;
  supportRequestedAt?: string;
  supportNotes?: string;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function createVolunteerProfile(userId: UserId): VolunteerProfile {
  const now = new Date().toISOString();
  
  return {
    userId,
    identity: {
      legalName: '',
      displayName: '',
      dateOfBirth: '',
      ial: 'IAL0',
      idVerified: false,
      twoFactorEnabled: false,
    },
    cultural: {
      languages: [],
      familiarNeighborhoods: [],
      culturalTrainingCompleted: false,
    },
    animalHandling: {
      speciesHandled: [],
      speciesExcluded: [],
      maxWeightKg: 0,
      canHandleAggressive: false,
      canHandleFeral: false,
      canHandleInjured: false,
      canHandleMedicalNeeds: false,
      canHandleBehavioralIssues: false,
      exoticLicensed: false,
      largeAnimalCertified: false,
      specialSkills: [],
    },
    personalEquipment: [],
    serviceArea: {
      primaryLocation: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        county: '',
      },
      serviceRadiusKm: 0,
      serviceRadiusMiles: 0,
      additionalAreas: [],
      maxTravelDistance: 0,
      maxTravelTime: 0,
      avoidedAreas: [],
      preferredAreas: [],
      willCrossStateLines: false,
      requiresGasReimbursement: false,
    },
    availability: {
      weeklySlots: [],
      canRespondWithin15Min: false,
      canRespondWithin30Min: false,
      canRespondWithin1Hour: false,
      canRespondWithin2Hours: false,
      canRespondWithin4Hours: false,
      blackoutDates: [],
      willingOnCall: false,
      onCallDays: [],
      onCallHours: { start: '00:00', end: '00:00' },
      lastUpdated: now,
    },
    notificationPreferences: {
      channels: {
        push: true,
        sms: false,
        email: true,
        phone: false,
        inApp: true,
      },
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '07:00',
        timezone: 'America/New_York',
        overrideForTier1: true,
        overrideForTier2: false,
      },
      notifyForSpecies: ['dog', 'cat'],
      notifyForCaseTypes: [],
      batchNonUrgent: true,
      digestFrequency: 'daily',
      digestTime: '09:00',
      preferredLanguage: 'en',
      lastUpdated: now,
    },
    wellnessStatus: {
      currentStatus: 'available',
      statusChangedAt: now,
      statusChangedBy: userId,
      forcedBreakActive: false,
      consecutiveDaysActive: 0,
      forcedBreakReason: undefined,
      forcedBreakEndsAt: undefined,
      deceasedCasesHandled30Days: 0,
      highStressCasesHandled30Days: 0,
      totalCasesHandled30Days: 0,
      hoursServed30Days: 0,
      hasBuddy: false,
      needsSupport: false,
    },
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
    audit: {
      createdAt: now,
      createdBy: userId,
      version: 1,
    },
  };
}

export function isAvailableForDispatch(profile: VolunteerProfile): boolean {
  // Check wellness status
  if (profile.wellnessStatus.currentStatus !== 'available') {
    return false;
  }
  
  // Check if on forced break
  if (profile.wellnessStatus.forcedBreakActive) {
    const now = new Date();
    const breakEnds = new Date(profile.wellnessStatus.forcedBreakEndsAt ?? '');
    if (now < breakEnds) {
      return false;
    }
  }
  
  // Check quiet hours
  const now = new Date();
  const quietHours = profile.notificationPreferences.quietHours;
  
  if (quietHours.enabled) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = parseTime(quietHours.startTime);
    const endTime = parseTime(quietHours.endTime);
    
    let inQuietHours = false;
    
    if (startTime > endTime) {
      // Overnight quiet hours (e.g., 22:00 to 07:00)
      inQuietHours = currentTime >= startTime || currentTime < endTime;
    } else {
      // Same day quiet hours
      inQuietHours = currentTime >= startTime && currentTime < endTime;
    }
    
    // Quiet hours don't apply for tier 1 emergencies
    if (inQuietHours && !quietHours.overrideForTier1) {
      return false;
    }
  }
  
  return true;
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function calculateWellnessScore(status: WellnessStatus): number {
  let score = 10; // Start at 10
  
  // Deduct for high stress cases
  score -= Math.min(status.highStressCasesHandled30Days * 0.5, 3);
  
  // Deduct for deceased cases
  score -= Math.min(status.deceasedCasesHandled30Days * 1, 3);
  
  // Deduct for consecutive days
  if (status.consecutiveDaysActive > 7) {
    score -= Math.min((status.consecutiveDaysActive - 7) * 0.2, 2);
  }
  
  // Deduct for long hours
  if (status.hoursServed30Days > 80) {
    score -= Math.min((status.hoursServed30Days - 80) * 0.02, 2);
  }
  
  return Math.max(1, Math.round(score));
}

export function needsForcedBreak(status: WellnessStatus): boolean {
  const score = calculateWellnessScore(status);
  
  // Force break if wellness score is low
  if (score <= 3) return true;
  
  // Force break after too many deceased cases
  if (status.deceasedCasesHandled30Days >= 5) return true;
  
  // Force break after too many consecutive days
  if (status.consecutiveDaysActive >= 14) return true;
  
  return false;
}
