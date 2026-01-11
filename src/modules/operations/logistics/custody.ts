/**
 * OPERATIONS MODULE - CHAIN OF CUSTODY
 * 
 * Animal custody transfers and tracking.
 */

import type { UserId, GeoLocation, Species, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// CUSTODY TYPES
// ═══════════════════════════════════════════════════════════════════

export type CustodyType = 
  | 'initial_intake'      // First person to take custody
  | 'transfer'            // Transfer between parties
  | 'temporary_hold'      // Temporary custody (e.g., vet visit)
  | 'release_to_owner'    // Release to verified owner
  | 'release_to_rescue'   // Release to rescue organization
  | 'release_to_shelter'  // Release to shelter
  | 'foster_placement'    // Placement in foster home
  | 'adoption';           // Final adoption

export type CustodianType = 
  | 'finder'
  | 'volunteer'
  | 'foster'
  | 'shelter'
  | 'rescue'
  | 'veterinarian'
  | 'owner'
  | 'adopter'
  | 'other';

export interface CustodyRecord {
  id: string;
  caseId: string;
  animalId?: string;
  
  // Transfer details
  type: CustodyType;
  transferNumber: number; // Sequential within case
  
  // From party
  fromCustodian: Custodian;
  
  // To party
  toCustodian: Custodian;
  
  // Timing
  transferredAt: string;
  scheduledAt?: string;
  
  // Location
  transferLocation: TransferLocation;
  
  // Animal condition
  animalCondition: AnimalConditionRecord;
  
  // Documentation
  photos: CustodyPhoto[];
  signatures: CustodySignature[];
  documents: CustodyDocument[];
  
  // Verification
  verificationRequired: boolean;
  verificationCompleted: boolean;
  verificationDetails?: {
    method: 'id_check' | 'microchip' | 'knowledge_test' | 'ownership_claim';
    verifiedBy: UserId;
    verifiedAt: string;
    notes?: string;
  };
  
  // Notes
  notes: string;
  internalNotes?: string;
  
  // Status
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  
  audit: AuditMetadata;
}

export interface Custodian {
  type: CustodianType;
  userId?: UserId;
  organizationId?: string;
  
  // Contact info
  name: string;
  phone: string;
  email?: string;
  address?: string;
  
  // Verification
  idVerified: boolean;
  idType?: string;
  idLast4?: string;
}

export interface TransferLocation {
  type: 'shelter' | 'vet' | 'foster_home' | 'public_place' | 'private_residence' | 'other';
  name: string;
  address?: string;
  coordinates?: GeoLocation;
  notes?: string;
}

export interface AnimalConditionRecord {
  // General condition
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  weightKg?: number;
  temperature?: number;
  
  // Health
  healthNotes: string;
  visibleInjuries: string[];
  behaviorNotes: string;
  
  // Apparent issues
  appearsInjured: boolean;
  appearsSick: boolean;
  appearsMalnourished: boolean;
  appearsDehydrated: boolean;
  appearsPregnant: boolean;
  appearsNursing: boolean;
  
  // Behavior
  behaviorAggressive: boolean;
  behaviorFearful: boolean;
  behaviorFriendly: boolean;
  
  // Special needs
  specialNeeds: string[];
  medicationsGiven: string[];
  feedingNotes?: string;
  
  // Microchip
  microchipScanned: boolean;
  microchipFound: boolean;
  microchipNumber?: string;
  
  // Collar/tags
  hasCollar: boolean;
  collarDescription?: string;
  hasTags: boolean;
  tagInfo?: string;
}

export interface CustodyPhoto {
  id: string;
  url: string;
  type: 'animal_front' | 'animal_side' | 'animal_back' | 'markings' | 'injury' | 'collar' | 'microchip' | 'transfer_scene' | 'other';
  caption?: string;
  takenAt: string;
  takenBy: UserId;
}

export interface CustodySignature {
  id: string;
  signerId: UserId;
  signerName: string;
  signerRole: 'releasing' | 'receiving' | 'witness';
  signatureData: string; // Base64 or reference
  signedAt: string;
  ipAddress?: string;
}

export interface CustodyDocument {
  id: string;
  type: 'release_form' | 'medical_records' | 'ownership_proof' | 'intake_form' | 'other';
  filename: string;
  url: string;
  uploadedAt: string;
  uploadedBy: UserId;
}

// ═══════════════════════════════════════════════════════════════════
// CUSTODY CHAIN
// ═══════════════════════════════════════════════════════════════════

export interface CustodyChain {
  caseId: string;
  animalId?: string;
  
  // Current custody
  currentCustodian: Custodian;
  currentSince: string;
  currentLocation: TransferLocation;
  
  // Chain of custody
  transfers: CustodyRecord[];
  totalTransfers: number;
  
  // Timeline
  firstCustodyAt: string;
  lastTransferAt: string;
  
  // Status
  isResolved: boolean;
  resolvedAt?: string;
  resolution?: 'returned_to_owner' | 'adopted' | 'rescue' | 'shelter' | 'other';
  
  // Audit trail
  auditLog: CustodyAuditEntry[];
  
  audit: AuditMetadata;
}

export interface CustodyAuditEntry {
  id: string;
  action: 'created' | 'transferred' | 'condition_updated' | 'photo_added' | 'document_added' | 'resolved' | 'disputed';
  timestamp: string;
  performedBy: UserId;
  details: string;
  previousState?: string;
  newState?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CUSTODY MANAGER
// ═══════════════════════════════════════════════════════════════════

export class CustodyManager {
  /**
   * Create initial custody record (intake)
   */
  createInitialCustody(params: {
    caseId: string;
    animalId?: string;
    custodian: Custodian;
    location: TransferLocation;
    condition: AnimalConditionRecord;
    photos?: CustodyPhoto[];
    createdBy: UserId;
    notes?: string;
  }): CustodyChain {
    const now = new Date().toISOString();
    
    const initialRecord: CustodyRecord = {
      id: crypto.randomUUID(),
      caseId: params.caseId,
      animalId: params.animalId,
      type: 'initial_intake',
      transferNumber: 1,
      fromCustodian: {
        type: 'other',
        name: 'Unknown/Found',
        phone: '',
        idVerified: false,
      },
      toCustodian: params.custodian,
      transferredAt: now,
      transferLocation: params.location,
      animalCondition: params.condition,
      photos: params.photos ?? [],
      signatures: [],
      documents: [],
      verificationRequired: false,
      verificationCompleted: false,
      notes: params.notes ?? 'Initial intake',
      status: 'completed',
      audit: {
        createdAt: now,
        createdBy: params.createdBy,
        version: 1,
      },
    };
    
    return {
      caseId: params.caseId,
      animalId: params.animalId,
      currentCustodian: params.custodian,
      currentSince: now,
      currentLocation: params.location,
      transfers: [initialRecord],
      totalTransfers: 1,
      firstCustodyAt: now,
      lastTransferAt: now,
      isResolved: false,
      auditLog: [
        {
          id: crypto.randomUUID(),
          action: 'created',
          timestamp: now,
          performedBy: params.createdBy,
          details: 'Initial custody established',
        },
      ],
      audit: {
        createdAt: now,
        createdBy: params.createdBy,
        version: 1,
      },
    };
  }
  
  /**
   * Transfer custody to new party
   */
  transferCustody(
    chain: CustodyChain,
    params: {
      type: CustodyType;
      toCustodian: Custodian;
      location: TransferLocation;
      condition: AnimalConditionRecord;
      photos?: CustodyPhoto[];
      signatures?: CustodySignature[];
      verificationRequired?: boolean;
      performedBy: UserId;
      notes?: string;
    }
  ): CustodyChain {
    const now = new Date().toISOString();
    
    const transfer: CustodyRecord = {
      id: crypto.randomUUID(),
      caseId: chain.caseId,
      animalId: chain.animalId,
      type: params.type,
      transferNumber: chain.totalTransfers + 1,
      fromCustodian: chain.currentCustodian,
      toCustodian: params.toCustodian,
      transferredAt: now,
      transferLocation: params.location,
      animalCondition: params.condition,
      photos: params.photos ?? [],
      signatures: params.signatures ?? [],
      documents: [],
      verificationRequired: params.verificationRequired ?? false,
      verificationCompleted: !params.verificationRequired,
      notes: params.notes ?? '',
      status: 'completed',
      audit: {
        createdAt: now,
        createdBy: params.performedBy,
        version: 1,
      },
    };
    
    // Check if this is a resolution transfer
    const isResolution = ['release_to_owner', 'release_to_rescue', 'release_to_shelter', 'adoption'].includes(params.type);
    
    const resolutionMap: Record<string, CustodyChain['resolution']> = {
      release_to_owner: 'returned_to_owner',
      release_to_rescue: 'rescue',
      release_to_shelter: 'shelter',
      adoption: 'adopted',
    };
    
    return {
      ...chain,
      currentCustodian: params.toCustodian,
      currentSince: now,
      currentLocation: params.location,
      transfers: [...chain.transfers, transfer],
      totalTransfers: chain.totalTransfers + 1,
      lastTransferAt: now,
      isResolved: isResolution,
      resolvedAt: isResolution ? now : undefined,
      resolution: isResolution ? resolutionMap[params.type] : undefined,
      auditLog: [
        ...chain.auditLog,
        {
          id: crypto.randomUUID(),
          action: 'transferred',
          timestamp: now,
          performedBy: params.performedBy,
          details: `Custody transferred to ${params.toCustodian.name} (${params.type})`,
          previousState: chain.currentCustodian.name,
          newState: params.toCustodian.name,
        },
      ],
      audit: {
        ...chain.audit,
        updatedAt: now,
        version: chain.audit.version + 1,
      },
    };
  }
  
  /**
   * Update animal condition
   */
  updateCondition(
    chain: CustodyChain,
    condition: Partial<AnimalConditionRecord>,
    updatedBy: UserId,
    notes?: string
  ): CustodyChain {
    const now = new Date().toISOString();
    
    // Update the latest transfer record
    const updatedTransfers = [...chain.transfers];
    const latestTransfer = updatedTransfers[updatedTransfers.length - 1];
    
    if (latestTransfer) {
      updatedTransfers[updatedTransfers.length - 1] = {
        ...latestTransfer,
        animalCondition: {
          ...latestTransfer.animalCondition,
          ...condition,
        },
        audit: {
          ...latestTransfer.audit,
          updatedAt: now,
          version: latestTransfer.audit.version + 1,
        },
      };
    }
    
    return {
      ...chain,
      transfers: updatedTransfers,
      auditLog: [
        ...chain.auditLog,
        {
          id: crypto.randomUUID(),
          action: 'condition_updated',
          timestamp: now,
          performedBy: updatedBy,
          details: notes ?? 'Animal condition updated',
        },
      ],
      audit: {
        ...chain.audit,
        updatedAt: now,
        version: chain.audit.version + 1,
      },
    };
  }
  
  /**
   * Add photo to custody chain
   */
  addPhoto(
    chain: CustodyChain,
    photo: Omit<CustodyPhoto, 'id'>,
    addedBy: UserId
  ): CustodyChain {
    const now = new Date().toISOString();
    
    const newPhoto: CustodyPhoto = {
      id: crypto.randomUUID(),
      ...photo,
    };
    
    // Add to latest transfer record
    const updatedTransfers = [...chain.transfers];
    const latestTransfer = updatedTransfers[updatedTransfers.length - 1];
    
    if (latestTransfer) {
      updatedTransfers[updatedTransfers.length - 1] = {
        ...latestTransfer,
        photos: [...latestTransfer.photos, newPhoto],
        audit: {
          ...latestTransfer.audit,
          updatedAt: now,
          version: latestTransfer.audit.version + 1,
        },
      };
    }
    
    return {
      ...chain,
      transfers: updatedTransfers,
      auditLog: [
        ...chain.auditLog,
        {
          id: crypto.randomUUID(),
          action: 'photo_added',
          timestamp: now,
          performedBy: addedBy,
          details: `Photo added: ${photo.type}`,
        },
      ],
      audit: {
        ...chain.audit,
        updatedAt: now,
        version: chain.audit.version + 1,
      },
    };
  }
  
  /**
   * Generate custody report
   */
  generateReport(chain: CustodyChain): CustodyReport {
    const transfers = chain.transfers;
    const conditions = transfers.map(t => t.animalCondition);
    
    // Calculate time in custody by each party
    const custodyDurations: { custodian: string; durationHours: number }[] = [];
    
    for (let i = 0; i < transfers.length; i++) {
      const transfer = transfers[i];
      const nextTransfer = transfers[i + 1];
      
      const startTime = new Date(transfer.transferredAt).getTime();
      const endTime = nextTransfer 
        ? new Date(nextTransfer.transferredAt).getTime()
        : Date.now();
      
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      
      custodyDurations.push({
        custodian: transfer.toCustodian.name,
        durationHours,
      });
    }
    
    // Detect condition changes
    const conditionChanges: { from: string; to: string; at: string }[] = [];
    
    for (let i = 1; i < conditions.length; i++) {
      if (conditions[i].overallCondition !== conditions[i - 1].overallCondition) {
        conditionChanges.push({
          from: conditions[i - 1].overallCondition,
          to: conditions[i].overallCondition,
          at: transfers[i].transferredAt,
        });
      }
    }
    
    return {
      caseId: chain.caseId,
      animalId: chain.animalId,
      totalTransfers: chain.totalTransfers,
      totalPhotos: transfers.reduce((sum, t) => sum + t.photos.length, 0),
      totalDocuments: transfers.reduce((sum, t) => sum + t.documents.length, 0),
      custodyDurations,
      conditionChanges,
      initialCondition: conditions[0]?.overallCondition,
      finalCondition: conditions[conditions.length - 1]?.overallCondition,
      isResolved: chain.isResolved,
      resolution: chain.resolution,
      firstCustodyAt: chain.firstCustodyAt,
      lastTransferAt: chain.lastTransferAt,
      totalDaysInSystem: Math.floor(
        (Date.now() - new Date(chain.firstCustodyAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
      generatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Validate transfer
   */
  validateTransfer(
    chain: CustodyChain,
    toCustodian: Custodian,
    type: CustodyType
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if case is already resolved
    if (chain.isResolved) {
      errors.push('Case is already resolved - cannot transfer custody');
    }
    
    // Validate custodian info
    if (!toCustodian.name || toCustodian.name.trim() === '') {
      errors.push('Custodian name is required');
    }
    
    if (!toCustodian.phone || toCustodian.phone.trim() === '') {
      errors.push('Custodian phone is required');
    }
    
    // Validate type-specific requirements
    if (type === 'release_to_owner' && !toCustodian.idVerified) {
      errors.push('Owner ID verification is required for release');
    }
    
    // Warnings
    if (chain.totalTransfers > 5) {
      warnings.push('Animal has been transferred many times - consider stable placement');
    }
    
    const latestCondition = chain.transfers[chain.transfers.length - 1]?.animalCondition;
    if (latestCondition?.overallCondition === 'critical' || latestCondition?.overallCondition === 'poor') {
      warnings.push('Animal is in poor/critical condition - ensure receiving party can provide adequate care');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// CUSTODY REPORT
// ═══════════════════════════════════════════════════════════════════

export interface CustodyReport {
  caseId: string;
  animalId?: string;
  totalTransfers: number;
  totalPhotos: number;
  totalDocuments: number;
  custodyDurations: { custodian: string; durationHours: number }[];
  conditionChanges: { from: string; to: string; at: string }[];
  initialCondition?: string;
  finalCondition?: string;
  isResolved: boolean;
  resolution?: string;
  firstCustodyAt: string;
  lastTransferAt: string;
  totalDaysInSystem: number;
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const custodyManager = new CustodyManager();

export function createCustodian(
  type: CustodianType,
  name: string,
  phone: string,
  userId?: UserId
): Custodian {
  return {
    type,
    userId,
    name,
    phone,
    idVerified: false,
  };
}

export function createTransferLocation(
  type: TransferLocation['type'],
  name: string,
  address?: string,
  coordinates?: GeoLocation
): TransferLocation {
  return {
    type,
    name,
    address,
    coordinates,
  };
}

export function createAnimalCondition(
  overallCondition: AnimalConditionRecord['overallCondition'],
  healthNotes: string = ''
): AnimalConditionRecord {
  return {
    overallCondition,
    healthNotes,
    visibleInjuries: [],
    behaviorNotes: '',
    appearsInjured: false,
    appearsSick: false,
    appearsMalnourished: false,
    appearsDehydrated: false,
    appearsPregnant: false,
    appearsNursing: false,
    behaviorAggressive: false,
    behaviorFearful: false,
    behaviorFriendly: true,
    specialNeeds: [],
    medicationsGiven: [],
    microchipScanned: false,
    microchipFound: false,
    hasCollar: false,
    hasTags: false,
  };
}

export function getCustodyDuration(chain: CustodyChain): number {
  const start = new Date(chain.firstCustodyAt).getTime();
  const now = Date.now();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24)); // days
}

export function getCurrentCustodianDuration(chain: CustodyChain): number {
  const start = new Date(chain.currentSince).getTime();
  const now = Date.now();
  return Math.floor((now - start) / (1000 * 60 * 60)); // hours
}

export function hasVerificationPending(chain: CustodyChain): boolean {
  return chain.transfers.some(t => t.verificationRequired && !t.verificationCompleted);
}

export function getLatestCondition(chain: CustodyChain): AnimalConditionRecord | undefined {
  return chain.transfers[chain.transfers.length - 1]?.animalCondition;
}

export function getAllPhotos(chain: CustodyChain): CustodyPhoto[] {
  return chain.transfers.flatMap(t => t.photos);
}

export function getAllDocuments(chain: CustodyChain): CustodyDocument[] {
  return chain.transfers.flatMap(t => t.documents);
}

export function getTransfersByType(chain: CustodyChain, type: CustodyType): CustodyRecord[] {
  return chain.transfers.filter(t => t.type === type);
}

export function requiresOwnerVerification(type: CustodyType): boolean {
  return type === 'release_to_owner';
}

export function isHighRiskTransfer(chain: CustodyChain): boolean {
  const condition = getLatestCondition(chain);
  if (!condition) return false;
  
  return (
    condition.overallCondition === 'critical' ||
    condition.overallCondition === 'poor' ||
    condition.appearsInjured ||
    condition.behaviorAggressive
  );
}
