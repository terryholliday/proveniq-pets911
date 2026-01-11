/**
 * ADDRESS PRIVACY PROTECTION
 * 
 * Protects finder and owner addresses from public exposure.
 * No public address publishing for finders.
 * Matches are only revealed when confirmed by a certified moderator.
 * 
 * Key Principles:
 * 1. Finder addresses are NEVER published publicly
 * 2. Owner addresses are only shared with verified shelter partners
 * 3. Location data is generalized for public display (neighborhood/area level)
 * 4. Exact coordinates only visible to moderators and verified responders
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type PrivacyLevel = 
  | 'PUBLIC'          // Anyone can see (generalized location only)
  | 'COMMUNITY'       // Verified community members
  | 'RESPONDER'       // Verified responders (shelter, vet, municipal)
  | 'MODERATOR'       // Certified moderators only
  | 'OWNER_ONLY'      // Only the owner and system
  | 'SYSTEM_ONLY';    // Never exposed to users

export type LocationPrecision =
  | 'EXACT'           // Full address/coordinates
  | 'STREET'          // Street name only, no number
  | 'NEIGHBORHOOD'    // Neighborhood/area name
  | 'CITY'            // City only
  | 'COUNTY'          // County only
  | 'REGION'          // Multi-county region
  | 'HIDDEN';         // Not shown at all

export interface ProtectedLocation {
  // Original data (SYSTEM_ONLY)
  exactAddress?: string;
  exactCoordinates?: { lat: number; lng: number };
  
  // Generalized data (for different privacy levels)
  streetName?: string;
  neighborhood?: string;
  city?: string;
  county?: string;
  state?: string;
  
  // Display data
  displayText: string;
  displayPrecision: LocationPrecision;
  centerPoint?: { lat: number; lng: number }; // Generalized center
  fuzzyRadiusMeters?: number; // Uncertainty radius for display
}

export interface PrivacyContext {
  viewerRole: 'public' | 'community' | 'responder' | 'moderator' | 'owner' | 'system';
  viewerVerified: boolean;
  viewerUserId?: string;
  ownerUserId?: string;
  reportType: 'lost' | 'found' | 'sighting';
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export const ADDRESS_PRIVACY_CONFIG = {
  // Default privacy levels by report type
  defaultPrivacyLevels: {
    lost: {
      ownerAddress: 'OWNER_ONLY' as PrivacyLevel,
      lastSeenLocation: 'COMMUNITY' as PrivacyLevel,
    },
    found: {
      finderAddress: 'SYSTEM_ONLY' as PrivacyLevel, // NEVER PUBLIC
      foundLocation: 'COMMUNITY' as PrivacyLevel,
    },
    sighting: {
      reporterAddress: 'SYSTEM_ONLY' as PrivacyLevel,
      sightingLocation: 'PUBLIC' as PrivacyLevel,
    },
  },

  // Location precision by privacy level
  precisionByPrivacyLevel: {
    PUBLIC: 'NEIGHBORHOOD' as LocationPrecision,
    COMMUNITY: 'STREET' as LocationPrecision,
    RESPONDER: 'EXACT' as LocationPrecision,
    MODERATOR: 'EXACT' as LocationPrecision,
    OWNER_ONLY: 'EXACT' as LocationPrecision,
    SYSTEM_ONLY: 'EXACT' as LocationPrecision,
  },

  // Fuzzy radius for generalized locations (in meters)
  fuzzyRadiusByPrecision: {
    EXACT: 0,
    STREET: 100,
    NEIGHBORHOOD: 500,
    CITY: 2000,
    COUNTY: 10000,
    REGION: 50000,
    HIDDEN: 0,
  },

  // Safe meeting location recommendations
  safeMeetingLocations: [
    'Police station lobby',
    'Fire station',
    'Veterinary clinic',
    'Animal shelter',
    'Public library',
    'Bank parking lot (during business hours)',
    'Well-lit public parking area',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// LOCATION PROTECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Protect a location based on privacy context
 * This is the main function for address privacy
 */
export function protectLocation(params: {
  exactAddress: string;
  exactCoordinates: { lat: number; lng: number };
  neighborhood?: string;
  city: string;
  county: string;
  state: string;
  context: PrivacyContext;
  privacyLevel: PrivacyLevel;
}): ProtectedLocation {
  const { exactAddress, exactCoordinates, neighborhood, city, county, state, context, privacyLevel } = params;

  // Determine what precision the viewer is allowed to see
  const allowedPrecision = getAllowedPrecision(context, privacyLevel);

  // Build protected location based on allowed precision
  switch (allowedPrecision) {
    case 'EXACT':
      return {
        exactAddress,
        exactCoordinates,
        streetName: extractStreetName(exactAddress),
        neighborhood,
        city,
        county,
        state,
        displayText: exactAddress,
        displayPrecision: 'EXACT',
        centerPoint: exactCoordinates,
        fuzzyRadiusMeters: 0,
      };

    case 'STREET':
      const streetName = extractStreetName(exactAddress);
      return {
        streetName,
        neighborhood,
        city,
        county,
        state,
        displayText: streetName ? `${streetName}, ${city}` : `${city}, ${state}`,
        displayPrecision: 'STREET',
        centerPoint: fuzzyCoordinates(exactCoordinates, 100),
        fuzzyRadiusMeters: ADDRESS_PRIVACY_CONFIG.fuzzyRadiusByPrecision.STREET,
      };

    case 'NEIGHBORHOOD':
      return {
        neighborhood,
        city,
        county,
        state,
        displayText: neighborhood ? `${neighborhood}, ${city}` : `${city} area`,
        displayPrecision: 'NEIGHBORHOOD',
        centerPoint: fuzzyCoordinates(exactCoordinates, 500),
        fuzzyRadiusMeters: ADDRESS_PRIVACY_CONFIG.fuzzyRadiusByPrecision.NEIGHBORHOOD,
      };

    case 'CITY':
      return {
        city,
        county,
        state,
        displayText: `${city}, ${state}`,
        displayPrecision: 'CITY',
        centerPoint: fuzzyCoordinates(exactCoordinates, 2000),
        fuzzyRadiusMeters: ADDRESS_PRIVACY_CONFIG.fuzzyRadiusByPrecision.CITY,
      };

    case 'COUNTY':
      return {
        county,
        state,
        displayText: `${county} County, ${state}`,
        displayPrecision: 'COUNTY',
        centerPoint: fuzzyCoordinates(exactCoordinates, 10000),
        fuzzyRadiusMeters: ADDRESS_PRIVACY_CONFIG.fuzzyRadiusByPrecision.COUNTY,
      };

    case 'HIDDEN':
    default:
      return {
        state,
        displayText: 'Location protected',
        displayPrecision: 'HIDDEN',
        fuzzyRadiusMeters: 0,
      };
  }
}

/**
 * Determine what precision a viewer is allowed to see
 */
function getAllowedPrecision(context: PrivacyContext, privacyLevel: PrivacyLevel): LocationPrecision {
  // Owner always sees their own data
  if (context.viewerRole === 'owner' && context.viewerUserId === context.ownerUserId) {
    return 'EXACT';
  }

  // System always has full access
  if (context.viewerRole === 'system') {
    return 'EXACT';
  }

  // Check role-based access
  const roleHierarchy: Record<string, number> = {
    public: 0,
    community: 1,
    responder: 2,
    moderator: 3,
    owner: 4,
    system: 5,
  };

  const privacyHierarchy: Record<PrivacyLevel, number> = {
    PUBLIC: 0,
    COMMUNITY: 1,
    RESPONDER: 2,
    MODERATOR: 3,
    OWNER_ONLY: 4,
    SYSTEM_ONLY: 5,
  };

  const viewerLevel = roleHierarchy[context.viewerRole] || 0;
  const requiredLevel = privacyHierarchy[privacyLevel];

  // Verification bonus
  const effectiveLevel = context.viewerVerified ? viewerLevel + 0.5 : viewerLevel;

  if (effectiveLevel >= requiredLevel) {
    return ADDRESS_PRIVACY_CONFIG.precisionByPrivacyLevel[privacyLevel];
  }

  // Downgrade precision based on gap
  const gap = requiredLevel - effectiveLevel;
  if (gap <= 1) return 'NEIGHBORHOOD';
  if (gap <= 2) return 'CITY';
  if (gap <= 3) return 'COUNTY';
  return 'HIDDEN';
}

/**
 * Extract street name from full address (remove house number)
 */
function extractStreetName(address: string): string | undefined {
  // Simple extraction - remove leading numbers
  const match = address.match(/^\d+\s+(.+?)(?:,|$)/);
  return match ? match[1] : undefined;
}

/**
 * Create fuzzy coordinates by adding random offset
 */
function fuzzyCoordinates(
  exact: { lat: number; lng: number },
  radiusMeters: number
): { lat: number; lng: number } {
  // Convert radius to approximate degrees (rough estimate)
  const latOffset = (radiusMeters / 111000) * (Math.random() - 0.5) * 2;
  const lngOffset = (radiusMeters / (111000 * Math.cos(exact.lat * Math.PI / 180))) * (Math.random() - 0.5) * 2;

  return {
    lat: exact.lat + latOffset,
    lng: exact.lng + lngOffset,
  };
}

// ═══════════════════════════════════════════════════════════════════
// FINDER PROTECTION (CRITICAL)
// ═══════════════════════════════════════════════════════════════════

/**
 * Protect finder information for public display
 * FINDER ADDRESSES ARE NEVER PUBLISHED PUBLICLY
 */
export function protectFinderInfo(params: {
  finderId: string;
  finderName: string;
  finderPhone: string;
  finderAddress: string;
  finderCoordinates: { lat: number; lng: number };
  context: PrivacyContext;
}): {
  displayName: string;
  contactMethod: string;
  location: ProtectedLocation;
  canContactDirectly: boolean;
} {
  const { context } = params;

  // Public sees nothing about finder
  if (context.viewerRole === 'public') {
    return {
      displayName: 'Anonymous Finder',
      contactMethod: 'Contact through Pet911',
      location: {
        displayText: 'Location protected',
        displayPrecision: 'HIDDEN',
      },
      canContactDirectly: false,
    };
  }

  // Community members see generalized info
  if (context.viewerRole === 'community') {
    return {
      displayName: params.finderName.split(' ')[0] + ' ' + params.finderName.split(' ')[1]?.[0] + '.',
      contactMethod: 'Contact through Pet911',
      location: protectLocation({
        exactAddress: params.finderAddress,
        exactCoordinates: params.finderCoordinates,
        city: '', // Would be populated from geocoding
        county: '',
        state: '',
        context,
        privacyLevel: 'COMMUNITY',
      }),
      canContactDirectly: false,
    };
  }

  // Responders and moderators see more
  if (context.viewerRole === 'responder' || context.viewerRole === 'moderator') {
    return {
      displayName: params.finderName,
      contactMethod: 'Direct contact authorized',
      location: protectLocation({
        exactAddress: params.finderAddress,
        exactCoordinates: params.finderCoordinates,
        city: '',
        county: '',
        state: '',
        context,
        privacyLevel: 'RESPONDER',
      }),
      canContactDirectly: true,
    };
  }

  // Default: protected
  return {
    displayName: 'Finder',
    contactMethod: 'Contact through Pet911',
    location: {
      displayText: 'Location protected',
      displayPrecision: 'HIDDEN',
    },
    canContactDirectly: false,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SAFE MEETING COORDINATION
// ═══════════════════════════════════════════════════════════════════

export interface SafeMeetingLocation {
  name: string;
  type: 'police' | 'fire' | 'vet' | 'shelter' | 'library' | 'public';
  address: string;
  coordinates: { lat: number; lng: number };
  hours?: string;
  phone?: string;
  recommended: boolean;
}

/**
 * Get safe meeting location recommendations for a reunification
 * Used instead of sharing personal addresses
 */
export function getSafeMeetingRecommendations(
  finderLocation: { lat: number; lng: number },
  ownerLocation: { lat: number; lng: number },
  availableLocations: SafeMeetingLocation[]
): SafeMeetingLocation[] {
  // Calculate midpoint
  const midpoint = {
    lat: (finderLocation.lat + ownerLocation.lat) / 2,
    lng: (finderLocation.lng + ownerLocation.lng) / 2,
  };

  // Sort by distance from midpoint and recommendation status
  return availableLocations
    .map(loc => ({
      ...loc,
      distance: haversineDistance(midpoint, loc.coordinates),
    }))
    .sort((a, b) => {
      // Prioritize recommended locations
      if (a.recommended !== b.recommended) {
        return a.recommended ? -1 : 1;
      }
      // Then by distance
      return a.distance - b.distance;
    })
    .slice(0, 5); // Return top 5
}

function haversineDistance(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════════

export interface AddressAccessLog {
  logId: string;
  timestamp: string;
  viewerId: string;
  viewerRole: string;
  targetType: 'finder' | 'owner' | 'sighting';
  targetId: string;
  accessGranted: boolean;
  precisionGranted: LocationPrecision;
  reason: string;
}

/**
 * Log address access for audit trail
 */
export function logAddressAccess(params: {
  viewerId: string;
  viewerRole: string;
  targetType: 'finder' | 'owner' | 'sighting';
  targetId: string;
  accessGranted: boolean;
  precisionGranted: LocationPrecision;
  reason: string;
}): AddressAccessLog {
  return {
    logId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  };
}
