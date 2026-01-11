/**
 * OPERATIONS MODULE - PARTNER INTEGRATIONS
 * 
 * Shelter, veterinarian, and rescue organization partnerships.
 */

import type { UserId, GeoLocation, Address, Species, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// PARTNER TYPES
// ═══════════════════════════════════════════════════════════════════

export type PartnerType = 
  | 'shelter'
  | 'rescue'
  | 'veterinarian'
  | 'vet_clinic'
  | 'animal_control'
  | 'humane_society'
  | 'foster_network'
  | 'transport_network'
  | 'tnr_organization'
  | 'wildlife_rehab'
  | 'pet_store'
  | 'groomer'
  | 'trainer';

export type PartnerStatus = 
  | 'prospective'
  | 'onboarding'
  | 'active'
  | 'suspended'
  | 'inactive'
  | 'terminated';

export type IntegrationLevel = 
  | 'none'           // Manual processes only
  | 'basic'          // Data sharing via exports
  | 'standard'       // API integration
  | 'premium'        // Full real-time integration
  | 'enterprise';    // Custom integration

export interface Partner {
  id: string;
  type: PartnerType;
  name: string;
  legalName?: string;
  
  // Status
  status: PartnerStatus;
  statusChangedAt: string;
  statusChangedBy?: UserId;
  statusReason?: string;
  
  // Contact
  contact: PartnerContact;
  
  // Location
  location: PartnerLocation;
  
  // Capabilities
  capabilities: PartnerCapabilities;
  
  // Integration
  integration: PartnerIntegration;
  
  // Agreement
  agreement: PartnerAgreement;
  
  // Metrics
  metrics: PartnerMetrics;
  
  // Tags
  tags: string[];
  notes?: string;
  
  // Dates
  createdAt: string;
  onboardedAt?: string;
  lastActiveAt?: string;
  
  audit: AuditMetadata;
}

export interface PartnerContact {
  primaryContact: {
    name: string;
    title?: string;
    email: string;
    phone: string;
    extension?: string;
  };
  
  alternateContacts?: {
    name: string;
    title?: string;
    email: string;
    phone: string;
    role: 'intake' | 'medical' | 'admin' | 'emergency' | 'it';
  }[];
  
  emergencyContact?: {
    name: string;
    phone: string;
    available24x7: boolean;
  };
  
  website?: string;
  socialMedia?: {
    platform: string;
    url: string;
  }[];
}

export interface PartnerLocation {
  address: Address;
  coordinates?: GeoLocation;
  serviceArea?: {
    radiusKm: number;
    counties?: string[];
    zipCodes?: string[];
  };
  
  // Hours
  hours: {
    day: string;
    open: string;
    close: string;
    notes?: string;
  }[];
  
  holidayHours?: {
    date: string;
    open?: string;
    close?: string;
    closed: boolean;
  }[];
  
  // Access
  publicAccess: boolean;
  appointmentRequired: boolean;
  afterHoursAvailable: boolean;
  afterHoursPhone?: string;
}

export interface PartnerCapabilities {
  // Species handled
  speciesAccepted: Species[];
  speciesNotAccepted: Species[];
  
  // Services
  services: PartnerService[];
  
  // Capacity
  capacity?: {
    maxAnimals?: number;
    currentOccupancy?: number;
    averageTurnover?: number;
  };
  
  // Special capabilities
  canAcceptAggressive: boolean;
  canAcceptInjured: boolean;
  canAcceptSick: boolean;
  canAcceptExotic: boolean;
  canAcceptLarge: boolean;
  
  // Medical capabilities (for vets)
  medicalCapabilities?: {
    emergencyServices: boolean;
    surgeryCapable: boolean;
    xrayAvailable: boolean;
    labOnSite: boolean;
    overnightCare: boolean;
    icuAvailable: boolean;
  };
  
  // Licensing
  licenses: {
    type: string;
    number: string;
    state: string;
    expiresAt?: string;
    verified: boolean;
  }[];
}

export interface PartnerService {
  id: string;
  name: string;
  description: string;
  category: 'intake' | 'medical' | 'behavioral' | 'grooming' | 'transport' | 'foster' | 'adoption' | 'tnr' | 'other';
  available: boolean;
  cost?: number;
  discountedForPet911: boolean;
  discountPercent?: number;
  requiresAppointment: boolean;
  leadTimeHours?: number;
}

export interface PartnerIntegration {
  level: IntegrationLevel;
  
  // API access
  apiEnabled: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
  
  // Data sharing
  dataSharing: {
    sendCases: boolean;
    receiveCases: boolean;
    sendAnimals: boolean;
    receiveAnimals: boolean;
    realTimeSync: boolean;
  };
  
  // External systems
  externalSystemId?: string;
  externalSystemType?: 'shelterluv' | 'petpoint' | 'chameleon' | 'pethealth' | 'evet' | 'avimark' | 'other';
  
  // Last sync
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'partial' | 'failed';
  syncErrors?: string[];
}

export interface PartnerAgreement {
  // Contract
  agreementSigned: boolean;
  agreementSignedAt?: string;
  agreementSignedBy?: string;
  agreementVersion?: string;
  agreementDocumentUrl?: string;
  
  // Terms
  startDate?: string;
  endDate?: string;
  autoRenew: boolean;
  
  // Commitments
  commitments: {
    type: string;
    description: string;
    frequency?: string;
    target?: number;
  }[];
  
  // Fees
  fees?: {
    type: 'monthly' | 'annual' | 'per_case' | 'per_animal';
    amount: number;
    description: string;
  }[];
  
  // Insurance
  insuranceVerified: boolean;
  insuranceExpiresAt?: string;
  insuranceDocumentUrl?: string;
}

export interface PartnerMetrics {
  // Activity
  totalCasesReferred: number;
  totalAnimalsReceived: number;
  totalAnimalsTransferred: number;
  
  // Performance
  averageResponseTimeHours: number;
  intakeAcceptanceRate: number;
  outcomeSuccessRate: number;
  
  // Quality
  satisfactionScore?: number;
  complaintCount: number;
  commendationCount: number;
  
  // Last updated
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════
// PARTNER REFERRAL
// ═══════════════════════════════════════════════════════════════════

export interface PartnerReferral {
  id: string;
  partnerId: string;
  partnerName: string;
  
  // Context
  caseId: string;
  animalId?: string;
  referralType: 'intake' | 'medical' | 'transfer' | 'foster' | 'adoption' | 'service';
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  
  // Timing
  createdAt: string;
  createdBy: UserId;
  respondedAt?: string;
  respondedBy?: string;
  completedAt?: string;
  
  // Response
  responseNotes?: string;
  declineReason?: string;
  
  // Details
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  requestedServices: string[];
  specialInstructions?: string;
  
  // Communication
  messages: {
    id: string;
    from: 'pet911' | 'partner';
    content: string;
    sentAt: string;
  }[];
  
  // Outcome
  outcome?: {
    type: string;
    description: string;
    animalStatus?: string;
    recordedAt: string;
  };
  
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// PARTNER MANAGER
// ═══════════════════════════════════════════════════════════════════

export class PartnerManager {
  /**
   * Create partner
   */
  createPartner(params: {
    type: PartnerType;
    name: string;
    contact: PartnerContact;
    location: PartnerLocation;
    createdBy: UserId;
  }): Partner {
    const now = new Date().toISOString();
    
    return {
      id: crypto.randomUUID(),
      type: params.type,
      name: params.name,
      status: 'prospective',
      statusChangedAt: now,
      contact: params.contact,
      location: params.location,
      capabilities: {
        speciesAccepted: ['dog', 'cat'],
        speciesNotAccepted: [],
        services: [],
        canAcceptAggressive: false,
        canAcceptInjured: false,
        canAcceptSick: false,
        canAcceptExotic: false,
        canAcceptLarge: false,
        licenses: [],
      },
      integration: {
        level: 'none',
        apiEnabled: false,
        dataSharing: {
          sendCases: false,
          receiveCases: false,
          sendAnimals: false,
          receiveAnimals: false,
          realTimeSync: false,
        },
      },
      agreement: {
        agreementSigned: false,
        autoRenew: false,
        commitments: [],
        insuranceVerified: false,
      },
      metrics: {
        totalCasesReferred: 0,
        totalAnimalsReceived: 0,
        totalAnimalsTransferred: 0,
        averageResponseTimeHours: 0,
        intakeAcceptanceRate: 0,
        outcomeSuccessRate: 0,
        complaintCount: 0,
        commendationCount: 0,
        lastUpdated: now,
      },
      tags: [],
      createdAt: now,
      audit: {
        createdAt: now,
        createdBy: params.createdBy,
        version: 1,
      },
    };
  }
  
  /**
   * Update partner status
   */
  updateStatus(
    partner: Partner,
    newStatus: PartnerStatus,
    changedBy: UserId,
    reason?: string
  ): Partner {
    const now = new Date().toISOString();
    
    return {
      ...partner,
      status: newStatus,
      statusChangedAt: now,
      statusChangedBy: changedBy,
      statusReason: reason,
      onboardedAt: newStatus === 'active' && !partner.onboardedAt ? now : partner.onboardedAt,
      audit: {
        ...partner.audit,
        updatedAt: now,
        version: partner.audit.version + 1,
      },
    };
  }
  
  /**
   * Create referral
   */
  createReferral(params: {
    partnerId: string;
    partnerName: string;
    caseId: string;
    animalId?: string;
    referralType: PartnerReferral['referralType'];
    urgency: PartnerReferral['urgency'];
    requestedServices: string[];
    specialInstructions?: string;
    createdBy: UserId;
  }): PartnerReferral {
    const now = new Date().toISOString();
    
    return {
      id: crypto.randomUUID(),
      partnerId: params.partnerId,
      partnerName: params.partnerName,
      caseId: params.caseId,
      animalId: params.animalId,
      referralType: params.referralType,
      status: 'pending',
      createdAt: now,
      createdBy: params.createdBy,
      urgency: params.urgency,
      requestedServices: params.requestedServices,
      specialInstructions: params.specialInstructions,
      messages: [],
      audit: {
        createdAt: now,
        createdBy: params.createdBy,
        version: 1,
      },
    };
  }
  
  /**
   * Respond to referral
   */
  respondToReferral(
    referral: PartnerReferral,
    accepted: boolean,
    respondedBy: string,
    notes?: string,
    declineReason?: string
  ): PartnerReferral {
    const now = new Date().toISOString();
    
    return {
      ...referral,
      status: accepted ? 'accepted' : 'declined',
      respondedAt: now,
      respondedBy,
      responseNotes: notes,
      declineReason: accepted ? undefined : declineReason,
      audit: {
        ...referral.audit,
        updatedAt: now,
        version: referral.audit.version + 1,
      },
    };
  }
  
  /**
   * Find partners by location
   */
  findPartnersByLocation(
    partners: Partner[],
    location: GeoLocation,
    maxDistanceKm: number,
    filters?: {
      types?: PartnerType[];
      services?: string[];
      species?: Species;
      mustAcceptAggressive?: boolean;
      mustAcceptInjured?: boolean;
    }
  ): { partner: Partner; distance: number }[] {
    const results: { partner: Partner; distance: number }[] = [];
    
    for (const partner of partners) {
      // Skip inactive partners
      if (partner.status !== 'active') continue;
      
      // Apply filters
      if (filters?.types && !filters.types.includes(partner.type)) continue;
      if (filters?.species && !partner.capabilities.speciesAccepted.includes(filters.species)) continue;
      if (filters?.mustAcceptAggressive && !partner.capabilities.canAcceptAggressive) continue;
      if (filters?.mustAcceptInjured && !partner.capabilities.canAcceptInjured) continue;
      
      if (filters?.services) {
        const partnerServices = partner.capabilities.services.map(s => s.id);
        if (!filters.services.some(s => partnerServices.includes(s))) continue;
      }
      
      // Calculate distance
      if (!partner.location.coordinates) continue;
      
      const distance = this.calculateDistance(location, partner.location.coordinates);
      if (distance <= maxDistanceKm) {
        results.push({ partner, distance });
      }
    }
    
    return results.sort((a, b) => a.distance - b.distance);
  }
  
  /**
   * Get partner statistics
   */
  getStatistics(partners: Partner[]): {
    total: number;
    byType: Record<PartnerType, number>;
    byStatus: Record<PartnerStatus, number>;
    byIntegrationLevel: Record<IntegrationLevel, number>;
    totalCapacity: number;
    averageSatisfaction: number;
  } {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byIntegrationLevel: Record<string, number> = {};
    let totalCapacity = 0;
    let totalSatisfaction = 0;
    let satisfactionCount = 0;
    
    for (const partner of partners) {
      byType[partner.type] = (byType[partner.type] ?? 0) + 1;
      byStatus[partner.status] = (byStatus[partner.status] ?? 0) + 1;
      byIntegrationLevel[partner.integration.level] = (byIntegrationLevel[partner.integration.level] ?? 0) + 1;
      
      if (partner.capabilities.capacity?.maxAnimals) {
        totalCapacity += partner.capabilities.capacity.maxAnimals;
      }
      
      if (partner.metrics.satisfactionScore !== undefined) {
        totalSatisfaction += partner.metrics.satisfactionScore;
        satisfactionCount++;
      }
    }
    
    return {
      total: partners.length,
      byType: byType as Record<PartnerType, number>,
      byStatus: byStatus as Record<PartnerStatus, number>,
      byIntegrationLevel: byIntegrationLevel as Record<IntegrationLevel, number>,
      totalCapacity,
      averageSatisfaction: satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0,
    };
  }
  
  private calculateDistance(from: GeoLocation, to: GeoLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.lat - from.lat);
    const dLon = this.toRad(to.lng - from.lng);
    const lat1 = this.toRad(from.lat);
    const lat2 = this.toRad(to.lat);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }
  
  private toRad(value: number): number {
    return value * Math.PI / 180;
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const partnerManager = new PartnerManager();

export function isPartnerActive(partner: Partner): boolean {
  return partner.status === 'active';
}

export function canAcceptAnimal(
  partner: Partner,
  species: Species,
  isAggressive: boolean,
  isInjured: boolean
): boolean {
  if (!isPartnerActive(partner)) return false;
  if (!partner.capabilities.speciesAccepted.includes(species)) return false;
  if (isAggressive && !partner.capabilities.canAcceptAggressive) return false;
  if (isInjured && !partner.capabilities.canAcceptInjured) return false;
  
  return true;
}

export function hasService(partner: Partner, serviceId: string): boolean {
  return partner.capabilities.services.some(s => s.id === serviceId && s.available);
}

export function getPartnerServices(partner: Partner, category?: PartnerService['category']): PartnerService[] {
  if (!category) return partner.capabilities.services;
  return partner.capabilities.services.filter(s => s.category === category);
}

export function isAgreementValid(partner: Partner): boolean {
  if (!partner.agreement.agreementSigned) return false;
  if (partner.agreement.endDate && new Date(partner.agreement.endDate) <= new Date()) {
    return partner.agreement.autoRenew;
  }
  return true;
}

export function getActivePartners(partners: Partner[]): Partner[] {
  return partners.filter(p => p.status === 'active');
}

export function getPartnersByType(partners: Partner[], type: PartnerType): Partner[] {
  return partners.filter(p => p.type === type && p.status === 'active');
}
