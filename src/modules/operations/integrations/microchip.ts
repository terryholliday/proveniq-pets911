/**
 * OPERATIONS MODULE - MICROCHIP INTEGRATIONS
 * 
 * Microchip registry lookups and verification.
 */

import type { UserId, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// MICROCHIP TYPES
// ═══════════════════════════════════════════════════════════════════

export type ChipFormat = 
  | 'iso_fdx_b'      // 15-digit ISO standard (FDX-B)
  | 'iso_fdx_a'      // 10-digit ISO standard (FDX-A)
  | 'avid'           // 9 or 10-digit AVID
  | 'trovan'         // Trovan format
  | 'destron'        // Destron Fearing
  | 'homeagain'      // HomeAgain specific
  | 'unknown';

export type RegistryStatus = 
  | 'active'
  | 'inactive'
  | 'unavailable'
  | 'error';

export interface MicrochipLookup {
  id: string;
  chipNumber: string;
  chipFormat: ChipFormat;
  
  // Lookup context
  caseId?: string;
  claimId?: string;
  requestedBy: UserId;
  requestedAt: string;
  
  // Results
  status: 'pending' | 'completed' | 'partial' | 'failed';
  registriesQueried: RegistryQuery[];
  
  // Match results
  matchFound: boolean;
  ownerInfo?: MicrochipOwnerInfo;
  
  // Audit
  piiAccessed: boolean;
  breakGlassId?: string;
  
  audit: AuditMetadata;
}

export interface RegistryQuery {
  registryId: string;
  registryName: string;
  status: 'success' | 'not_found' | 'error' | 'timeout' | 'rate_limited';
  queriedAt: string;
  responseTime?: number; // milliseconds
  errorMessage?: string;
  
  // Result
  found: boolean;
  registrationStatus?: 'active' | 'expired' | 'transferred' | 'unknown';
  lastUpdated?: string;
}

export interface MicrochipOwnerInfo {
  // Contact info (PII - break-glass required)
  name?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Pet info
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petColor?: string;
  petSex?: string;
  petDateOfBirth?: string;
  
  // Registration info
  registrationDate?: string;
  registryName?: string;
  registrationId?: string;
  
  // Verification
  ownerVerified: boolean;
  lastContactAttempt?: string;
  contactResult?: 'reached' | 'voicemail' | 'wrong_number' | 'disconnected' | 'no_answer';
}

// ═══════════════════════════════════════════════════════════════════
// REGISTRIES
// ═══════════════════════════════════════════════════════════════════

export interface MicrochipRegistry {
  id: string;
  name: string;
  url: string;
  
  // Capabilities
  supportsApiLookup: boolean;
  supportsManualLookup: boolean;
  supportsBulkLookup: boolean;
  
  // Chip formats supported
  supportedFormats: ChipFormat[];
  
  // Authentication
  requiresAuthentication: boolean;
  authType?: 'api_key' | 'oauth' | 'basic';
  
  // Rate limits
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  
  // Status
  status: RegistryStatus;
  lastChecked?: string;
  uptime?: number; // percentage
  
  // Contact
  supportEmail?: string;
  supportPhone?: string;
}

export const MICROCHIP_REGISTRIES: MicrochipRegistry[] = [
  {
    id: 'aaha',
    name: 'AAHA Universal Pet Microchip Lookup',
    url: 'https://www.petmicrochiplookup.org',
    supportsApiLookup: false,
    supportsManualLookup: true,
    supportsBulkLookup: false,
    supportedFormats: ['iso_fdx_b', 'iso_fdx_a', 'avid', 'trovan', 'destron', 'homeagain'],
    requiresAuthentication: false,
    status: 'active',
  },
  {
    id: 'homeagain',
    name: 'HomeAgain',
    url: 'https://www.homeagain.com',
    supportsApiLookup: true,
    supportsManualLookup: true,
    supportsBulkLookup: false,
    supportedFormats: ['homeagain', 'iso_fdx_b'],
    requiresAuthentication: true,
    authType: 'api_key',
    rateLimitPerHour: 100,
    rateLimitPerDay: 1000,
    status: 'active',
  },
  {
    id: 'foundanimals',
    name: 'Found Animals Registry',
    url: 'https://www.foundanimals.org',
    supportsApiLookup: true,
    supportsManualLookup: true,
    supportsBulkLookup: true,
    supportedFormats: ['iso_fdx_b', 'iso_fdx_a', 'avid'],
    requiresAuthentication: true,
    authType: 'api_key',
    rateLimitPerHour: 200,
    rateLimitPerDay: 2000,
    status: 'active',
  },
  {
    id: 'petlink',
    name: 'PetLink',
    url: 'https://www.petlink.net',
    supportsApiLookup: true,
    supportsManualLookup: true,
    supportsBulkLookup: false,
    supportedFormats: ['iso_fdx_b', 'avid'],
    requiresAuthentication: true,
    authType: 'api_key',
    rateLimitPerHour: 50,
    rateLimitPerDay: 500,
    status: 'active',
  },
  {
    id: 'akc_reunite',
    name: 'AKC Reunite',
    url: 'https://www.akcreunite.org',
    supportsApiLookup: true,
    supportsManualLookup: true,
    supportsBulkLookup: false,
    supportedFormats: ['iso_fdx_b', 'trovan'],
    requiresAuthentication: true,
    authType: 'api_key',
    rateLimitPerHour: 100,
    rateLimitPerDay: 1000,
    status: 'active',
  },
];

// ═══════════════════════════════════════════════════════════════════
// MICROCHIP MANAGER
// ═══════════════════════════════════════════════════════════════════

export class MicrochipManager {
  /**
   * Validate chip number format
   */
  validateChipNumber(chipNumber: string): {
    valid: boolean;
    format: ChipFormat;
    normalized: string;
    errors: string[];
  } {
    const errors: string[] = [];
    const normalized = chipNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Check for empty
    if (!normalized) {
      return { valid: false, format: 'unknown', normalized: '', errors: ['Chip number is required'] };
    }
    
    // Determine format
    let format: ChipFormat = 'unknown';
    
    if (/^\d{15}$/.test(normalized)) {
      format = 'iso_fdx_b';
    } else if (/^\d{10}$/.test(normalized)) {
      // Could be ISO FDX-A or AVID
      format = 'iso_fdx_a';
    } else if (/^\d{9}$/.test(normalized)) {
      format = 'avid';
    } else if (/^[0-9A-F]{10}$/i.test(normalized)) {
      format = 'trovan';
    } else {
      errors.push('Unrecognized chip number format');
    }
    
    return {
      valid: errors.length === 0,
      format,
      normalized,
      errors,
    };
  }
  
  /**
   * Initiate microchip lookup
   */
  initiateLookup(params: {
    chipNumber: string;
    caseId?: string;
    claimId?: string;
    requestedBy: UserId;
    breakGlassId?: string;
  }): MicrochipLookup {
    const now = new Date().toISOString();
    const validation = this.validateChipNumber(params.chipNumber);
    
    if (!validation.valid) {
      throw new Error(`Invalid chip number: ${validation.errors.join(', ')}`);
    }
    
    return {
      id: crypto.randomUUID(),
      chipNumber: validation.normalized,
      chipFormat: validation.format,
      caseId: params.caseId,
      claimId: params.claimId,
      requestedBy: params.requestedBy,
      requestedAt: now,
      status: 'pending',
      registriesQueried: [],
      matchFound: false,
      piiAccessed: !!params.breakGlassId,
      breakGlassId: params.breakGlassId,
      audit: {
        createdAt: now,
        createdBy: params.requestedBy,
        version: 1,
      },
    };
  }
  
  /**
   * Record registry query result
   */
  recordQueryResult(
    lookup: MicrochipLookup,
    registryId: string,
    result: Omit<RegistryQuery, 'registryId' | 'registryName' | 'queriedAt'>
  ): MicrochipLookup {
    const now = new Date().toISOString();
    const registry = MICROCHIP_REGISTRIES.find(r => r.id === registryId);
    
    const query: RegistryQuery = {
      registryId,
      registryName: registry?.name ?? registryId,
      queriedAt: now,
      ...result,
    };
    
    return {
      ...lookup,
      registriesQueried: [...lookup.registriesQueried, query],
      matchFound: lookup.matchFound || result.found,
      audit: {
        ...lookup.audit,
        updatedAt: now,
        version: lookup.audit.version + 1,
      },
    };
  }
  
  /**
   * Record owner info (PII)
   */
  recordOwnerInfo(
    lookup: MicrochipLookup,
    ownerInfo: MicrochipOwnerInfo,
    breakGlassId: string
  ): MicrochipLookup {
    const now = new Date().toISOString();
    
    return {
      ...lookup,
      ownerInfo,
      piiAccessed: true,
      breakGlassId,
      audit: {
        ...lookup.audit,
        updatedAt: now,
        version: lookup.audit.version + 1,
      },
    };
  }
  
  /**
   * Complete lookup
   */
  completeLookup(
    lookup: MicrochipLookup,
    status: 'completed' | 'partial' | 'failed'
  ): MicrochipLookup {
    const now = new Date().toISOString();
    
    return {
      ...lookup,
      status,
      audit: {
        ...lookup.audit,
        updatedAt: now,
        version: lookup.audit.version + 1,
      },
    };
  }
  
  /**
   * Get registries for chip format
   */
  getRegistriesForFormat(format: ChipFormat): MicrochipRegistry[] {
    return MICROCHIP_REGISTRIES.filter(r => 
      r.status === 'active' && r.supportedFormats.includes(format)
    );
  }
  
  /**
   * Get lookup statistics
   */
  getStatistics(lookups: MicrochipLookup[]): {
    total: number;
    matchFound: number;
    noMatch: number;
    failed: number;
    averageResponseTime: number;
    byRegistry: Record<string, { total: number; found: number; errors: number }>;
  } {
    const byRegistry: Record<string, { total: number; found: number; errors: number }> = {};
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (const lookup of lookups) {
      for (const query of lookup.registriesQueried) {
        if (!byRegistry[query.registryId]) {
          byRegistry[query.registryId] = { total: 0, found: 0, errors: 0 };
        }
        
        byRegistry[query.registryId].total++;
        if (query.found) byRegistry[query.registryId].found++;
        if (query.status === 'error') byRegistry[query.registryId].errors++;
        
        if (query.responseTime) {
          totalResponseTime += query.responseTime;
          responseCount++;
        }
      }
    }
    
    return {
      total: lookups.length,
      matchFound: lookups.filter(l => l.matchFound).length,
      noMatch: lookups.filter(l => l.status === 'completed' && !l.matchFound).length,
      failed: lookups.filter(l => l.status === 'failed').length,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      byRegistry,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const microchipManager = new MicrochipManager();

export function formatChipNumber(chipNumber: string): string {
  const normalized = chipNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Format as groups for readability
  if (normalized.length === 15) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9, 12)} ${normalized.slice(12)}`;
  } else if (normalized.length === 10) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
  } else if (normalized.length === 9) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
  }
  
  return normalized;
}

export function getChipManufacturer(chipNumber: string): string | null {
  const normalized = chipNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // ISO chips have manufacturer codes in the first 3 digits
  if (normalized.length === 15) {
    const mfgCode = normalized.slice(0, 3);
    
    const manufacturers: Record<string, string> = {
      '900': 'HomeAgain',
      '956': 'AVID/Datamars',
      '981': 'Datamars',
      '982': 'Allflex',
      '985': 'HomeAgain',
      '991': 'AKC Reunite',
    };
    
    return manufacturers[mfgCode] ?? null;
  }
  
  return null;
}

export function isValidChipNumber(chipNumber: string): boolean {
  const validation = microchipManager.validateChipNumber(chipNumber);
  return validation.valid;
}

export function getActiveRegistries(): MicrochipRegistry[] {
  return MICROCHIP_REGISTRIES.filter(r => r.status === 'active');
}

export function getRegistryById(id: string): MicrochipRegistry | undefined {
  return MICROCHIP_REGISTRIES.find(r => r.id === id);
}

export function requiresBreakGlass(lookup: MicrochipLookup): boolean {
  // PII access requires break-glass
  return lookup.ownerInfo !== undefined;
}
