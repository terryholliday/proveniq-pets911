/**
 * OPERATIONS MODULE - GEOSPATIAL TYPES
 * 
 * Types for location, service areas, and address handling.
 * All location data requires explicit consent and has TTL.
 */

// ═══════════════════════════════════════════════════════════════════
// COORDINATES
// ═══════════════════════════════════════════════════════════════════

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;      // meters
  altitude?: number;      // meters
  heading?: number;       // degrees from north
  speed?: number;         // meters per second
  timestamp?: string;     // ISO timestamp
  source?: LocationSource;
}

export type LocationSource = 
  | 'gps'
  | 'network'
  | 'ip_geolocation'
  | 'manual_entry'
  | 'geocoded';

export type LocationPrecision = 'coarse' | 'precise';

// ═══════════════════════════════════════════════════════════════════
// ADDRESS
// ═══════════════════════════════════════════════════════════════════

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  country: string;
  
  // Geocoded location
  geocoded?: GeoLocation;
  geocodedAt?: string;
  geocodeConfidence?: number;  // 0-1
  
  // For privacy - generalized location for public display
  generalizedLocation?: {
    neighborhood?: string;
    crossStreets?: string;
    landmark?: string;
  };
}

export interface AddressValidation {
  isValid: boolean;
  standardizedAddress?: Address;
  validationSource?: string;
  validatedAt?: string;
  issues?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE AREA
// ═══════════════════════════════════════════════════════════════════

export interface ServiceArea {
  id: string;
  name: string;
  type: 'radius' | 'polygon' | 'county' | 'region';
  
  // For radius-based
  center?: GeoLocation;
  radiusKm?: number;
  
  // For polygon-based
  polygonPoints?: GeoLocation[];
  
  // For county/region-based
  counties?: string[];
  regionId?: string;
  
  // Metadata
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// DISTANCE & ROUTING
// ═══════════════════════════════════════════════════════════════════

export interface DistanceResult {
  straightLineKm: number;
  drivingDistanceKm?: number;
  drivingTimeMinutes?: number;
  walkingDistanceKm?: number;
  walkingTimeMinutes?: number;
}

export interface RouteWaypoint {
  location: GeoLocation;
  address?: string;
  arrivalTime?: string;
  departureTime?: string;
  stopDurationMinutes?: number;
}

export interface Route {
  id: string;
  waypoints: RouteWaypoint[];
  totalDistanceKm: number;
  totalTimeMinutes: number;
  polyline?: string;  // Encoded polyline for map display
}

// ═══════════════════════════════════════════════════════════════════
// LOCATION TRACKING (with consent)
// ═══════════════════════════════════════════════════════════════════

export interface LocationTrackingSession {
  id: string;
  userId: string;
  operationId: string;
  
  // Consent (CRITICAL)
  consentCaptured: boolean;
  consentVersion: string;
  consentAt: string;
  consentIpAddress?: string;
  
  // Precision control
  precision: LocationPrecision;
  
  // Session bounds
  startedAt: string;
  expiresAt: string;
  endedAt?: string;
  
  // Location history (subject to TTL)
  locations: TrackedLocation[];
  
  // Retention
  retentionDays: number;
  scheduledPurgeAt: string;
  purgedAt?: string;
}

export interface TrackedLocation {
  location: GeoLocation;
  capturedAt: string;
  precision: LocationPrecision;
  batteryLevel?: number;
  networkType?: string;
}

// ═══════════════════════════════════════════════════════════════════
// GEOFENCE
// ═══════════════════════════════════════════════════════════════════

export interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  
  // Circle
  center?: GeoLocation;
  radiusMeters?: number;
  
  // Polygon
  vertices?: GeoLocation[];
  
  // Triggers
  triggerOnEnter: boolean;
  triggerOnExit: boolean;
  triggerOnDwell: boolean;
  dwellTimeMinutes?: number;
  
  // Status
  active: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(p1: GeoLocation, p2: GeoLocation): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a point is within a service area
 */
export function isWithinServiceArea(point: GeoLocation, area: ServiceArea): boolean {
  if (area.type === 'radius' && area.center && area.radiusKm) {
    const distance = calculateDistance(point, area.center);
    return distance <= area.radiusKm;
  }
  
  if (area.type === 'polygon' && area.polygonPoints && area.polygonPoints.length >= 3) {
    return isPointInPolygon(point, area.polygonPoints);
  }
  
  return false;
}

/**
 * Ray casting algorithm for point-in-polygon test
 */
function isPointInPolygon(point: GeoLocation, polygon: GeoLocation[]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    
    if (((yi > point.lat) !== (yj > point.lat)) &&
        (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Generalize a location for privacy (reduce precision)
 */
export function generalizeLocation(location: GeoLocation, precisionKm: number = 1): GeoLocation {
  // Round to reduce precision
  const factor = 1 / (precisionKm / 111); // ~111km per degree
  return {
    lat: Math.round(location.lat * factor) / factor,
    lng: Math.round(location.lng * factor) / factor,
    accuracy: precisionKm * 1000, // Convert to meters
    source: 'manual_entry',
  };
}

/**
 * Calculate bounding box around a point
 */
export function getBoundingBox(center: GeoLocation, radiusKm: number): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDelta = radiusKm / 111; // ~111km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos(toRad(center.lat)));
  
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta,
  };
}
