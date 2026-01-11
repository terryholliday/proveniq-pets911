/**
 * DYNAMIC GEOFENCE COMPUTATION
 * 
 * Radius is computed as a function of time, species, environment, and sighting clustering.
 * It expands over time but contracts around fresh sightings.
 * 
 * Models:
 * - Dog Model: Faster expansion, considers road density and travel corridors
 * - Cat Model: Slower expansion, prioritizes near-home search initially
 * - Indoor-Only: Reduced early radius, requires strong evidence for escalation
 * - Severe Weather: Increased urgency, prefers responder networks
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

import type { WindData, EllipticalSearchArea } from '../weather';
import { createWindAdjustedSearchArea, calculateDogWindBias } from '../weather';

export type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
export type Environment = 'urban' | 'suburban' | 'rural';
export type BehaviorProfile = 'indoor_only' | 'outdoor_access' | 'flight_risk' | 'known_wanderer';
export type WeatherCondition = 'normal' | 'severe_heat' | 'severe_cold' | 'storm' | 'flood';

export interface PetProfile {
  species: Species;
  behavior: BehaviorProfile;
  age: 'puppy_kitten' | 'adult' | 'senior';
  size: 'small' | 'medium' | 'large';
  medicalNeeds: boolean;
  knownRange?: number; // Known roaming range in meters (if any)
}

export interface LocationContext {
  environment: Environment;
  roadDensity: 'low' | 'medium' | 'high';
  weatherCondition: WeatherCondition;
  timeOfDay: 'day' | 'night';
  nearWater: boolean;
  nearHighway: boolean;
}

export interface SightingCluster {
  centroid: { lat: number; lng: number };
  count: number;
  avgRecencyHours: number;
  trustScore: number; // 0-100
  radiusMeters: number;
}

export interface GeofenceResult {
  center: { lat: number; lng: number };
  radiusMeters: number;
  confidence: number;
  model: string;
  expandedFromOriginal: boolean;
  recenteredOnSighting: boolean;
  urgencyFactor: number;
  nextExpansionHours: number;
}

// ═══════════════════════════════════════════════════════════════════
// SPECIES-SPECIFIC BASE MODELS
// ═══════════════════════════════════════════════════════════════════

const SPECIES_MODELS = {
  dog: {
    name: 'Dog Model',
    baseRadiusMeters: 800,
    expansionRatePerHour: 200, // meters per hour
    maxRadiusMeters: 25000,
    travelCorridorBonus: 1.5, // Multiply if near roads
    flightRiskMultiplier: 2.0,
  },
  cat: {
    name: 'Cat Model',
    baseRadiusMeters: 200,
    expansionRatePerHour: 50,
    maxRadiusMeters: 5000,
    travelCorridorBonus: 1.0, // Cats don't follow roads
    flightRiskMultiplier: 1.3,
  },
  bird: {
    name: 'Bird Model',
    baseRadiusMeters: 500,
    expansionRatePerHour: 500,
    maxRadiusMeters: 50000,
    travelCorridorBonus: 1.0,
    flightRiskMultiplier: 3.0,
  },
  rabbit: {
    name: 'Rabbit Model',
    baseRadiusMeters: 100,
    expansionRatePerHour: 30,
    maxRadiusMeters: 2000,
    travelCorridorBonus: 1.0,
    flightRiskMultiplier: 1.5,
  },
  other: {
    name: 'Generic Model',
    baseRadiusMeters: 300,
    expansionRatePerHour: 100,
    maxRadiusMeters: 10000,
    travelCorridorBonus: 1.0,
    flightRiskMultiplier: 1.5,
  },
};

// ═══════════════════════════════════════════════════════════════════
// BEHAVIOR MODIFIERS
// ═══════════════════════════════════════════════════════════════════

const BEHAVIOR_MODIFIERS = {
  indoor_only: {
    radiusMultiplier: 0.3, // Much smaller initial radius
    expansionDelay: 6, // Hours before expansion kicks in
    minEvidenceForEscalation: 0.7, // High evidence required
  },
  outdoor_access: {
    radiusMultiplier: 1.0,
    expansionDelay: 0,
    minEvidenceForEscalation: 0.5,
  },
  flight_risk: {
    radiusMultiplier: 2.0,
    expansionDelay: 0,
    minEvidenceForEscalation: 0.3,
  },
  known_wanderer: {
    radiusMultiplier: 1.5,
    expansionDelay: 2,
    minEvidenceForEscalation: 0.4,
  },
};

// ═══════════════════════════════════════════════════════════════════
// ENVIRONMENT MODIFIERS
// ═══════════════════════════════════════════════════════════════════

const ENVIRONMENT_MODIFIERS = {
  urban: {
    radiusMultiplier: 0.7, // Smaller in urban (more obstacles)
    expansionRate: 0.8,
  },
  suburban: {
    radiusMultiplier: 1.0,
    expansionRate: 1.0,
  },
  rural: {
    radiusMultiplier: 1.5, // Larger in rural (open space)
    expansionRate: 1.3,
  },
};

// ═══════════════════════════════════════════════════════════════════
// WEATHER URGENCY MODIFIERS
// ═══════════════════════════════════════════════════════════════════

const WEATHER_URGENCY = {
  normal: { urgencyFactor: 1.0, channelPreference: 'standard' },
  severe_heat: { urgencyFactor: 1.8, channelPreference: 'responder' },
  severe_cold: { urgencyFactor: 1.8, channelPreference: 'responder' },
  storm: { urgencyFactor: 2.0, channelPreference: 'responder' },
  flood: { urgencyFactor: 2.5, channelPreference: 'emergency' },
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPUTATION FUNCTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute dynamic geofence based on pet profile, location context, time elapsed, and sightings
 */
export function computeDynamicGeofence(params: {
  originalLocation: { lat: number; lng: number };
  pet: PetProfile;
  context: LocationContext;
  hoursSinceLost: number;
  sightingClusters: SightingCluster[];
}): GeofenceResult {
  const { originalLocation, pet, context, hoursSinceLost, sightingClusters } = params;

  // Get species model
  const speciesModel = SPECIES_MODELS[pet.species];
  const behaviorMod = BEHAVIOR_MODIFIERS[pet.behavior];
  const envMod = ENVIRONMENT_MODIFIERS[context.environment];
  const weatherUrgency = WEATHER_URGENCY[context.weatherCondition];

  // Calculate base radius
  let baseRadius = speciesModel.baseRadiusMeters;

  // Apply behavior modifier
  baseRadius *= behaviorMod.radiusMultiplier;

  // Apply environment modifier
  baseRadius *= envMod.radiusMultiplier;

  // Apply flight risk if applicable
  if (pet.behavior === 'flight_risk') {
    baseRadius *= speciesModel.flightRiskMultiplier;
  }

  // Apply travel corridor bonus for dogs near roads
  if (pet.species === 'dog' && context.roadDensity === 'high') {
    baseRadius *= speciesModel.travelCorridorBonus;
  }

  // Apply known range if available
  if (pet.knownRange && pet.knownRange > 0) {
    baseRadius = Math.max(baseRadius, pet.knownRange * 1.5);
  }

  // Calculate time-based expansion
  const effectiveHours = Math.max(0, hoursSinceLost - behaviorMod.expansionDelay);
  const expansionRate = speciesModel.expansionRatePerHour * envMod.expansionRate;
  const timeExpansion = effectiveHours * expansionRate;

  // Calculate final radius (capped at max)
  let finalRadius = Math.min(baseRadius + timeExpansion, speciesModel.maxRadiusMeters);

  // Determine center point (original or re-centered on sighting cluster)
  let center = { ...originalLocation };
  let recenteredOnSighting = false;

  // Check for valid sighting cluster to re-center on
  const validCluster = findBestSightingCluster(sightingClusters);
  if (validCluster) {
    center = validCluster.centroid;
    recenteredOnSighting = true;
    // Contract radius around fresh sightings
    finalRadius = Math.min(finalRadius, validCluster.radiusMeters * 2);
  }

  // Apply urgency factor for severe weather
  const urgencyFactor = weatherUrgency.urgencyFactor;

  // Calculate confidence (decreases with time and increases with sightings)
  const timeConfidencePenalty = Math.min(hoursSinceLost * 0.02, 0.5);
  const sightingConfidenceBonus = validCluster ? validCluster.trustScore * 0.01 : 0;
  const confidence = Math.max(0.2, Math.min(1.0, 0.8 - timeConfidencePenalty + sightingConfidenceBonus));

  // Calculate next expansion time
  const nextExpansionHours = Math.max(1, 6 - Math.floor(hoursSinceLost / 12));

  return {
    center,
    radiusMeters: Math.round(finalRadius),
    confidence,
    model: speciesModel.name,
    expandedFromOriginal: timeExpansion > 0,
    recenteredOnSighting,
    urgencyFactor,
    nextExpansionHours,
  };
}

/**
 * Find the best sighting cluster to re-center on
 * Requires: count >= 2, recency < 24h, trust score >= 60
 */
function findBestSightingCluster(clusters: SightingCluster[]): SightingCluster | null {
  const validClusters = clusters.filter(
    c => c.count >= 2 && c.avgRecencyHours < 24 && c.trustScore >= 60
  );

  if (validClusters.length === 0) return null;

  // Sort by trust score * recency weight
  validClusters.sort((a, b) => {
    const aScore = a.trustScore * (1 / (a.avgRecencyHours + 1));
    const bScore = b.trustScore * (1 / (b.avgRecencyHours + 1));
    return bScore - aScore;
  });

  return validClusters[0];
}

// ═══════════════════════════════════════════════════════════════════
// GEOFENCE TIER RECOMMENDATION
// ═══════════════════════════════════════════════════════════════════

export type AlertTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

/**
 * Recommend alert tier based on geofence computation and context
 */
export function recommendAlertTier(params: {
  geofence: GeofenceResult;
  hoursSinceLost: number;
  evidenceStrength: number; // 0-1
  shelterConfirmed: boolean;
  humanReviewComplete: boolean;
  isRegionalCrisis: boolean;
}): { tier: AlertTier; reason: string } {
  const { geofence, hoursSinceLost, evidenceStrength, shelterConfirmed, humanReviewComplete, isRegionalCrisis } = params;

  // T5: Regional Crisis
  if (isRegionalCrisis) {
    return { tier: 'T5', reason: 'Regional crisis declared' };
  }

  // T4: Public Display - requires human review AND high confidence
  if (humanReviewComplete && geofence.confidence >= 0.7 && evidenceStrength >= 0.8) {
    return { tier: 'T4', reason: 'Human-reviewed, high-confidence case' };
  }

  // T3: Responder Network - shelter confirmed OR strong evidence
  if (shelterConfirmed || (evidenceStrength >= 0.6 && hoursSinceLost >= 6)) {
    return { tier: 'T3', reason: shelterConfirmed ? 'Shelter-confirmed case' : 'Strong evidence, time threshold met' };
  }

  // T2: Expanded Search - moderate evidence OR time threshold
  if (evidenceStrength >= 0.4 || hoursSinceLost >= 4) {
    return { tier: 'T2', reason: 'Evidence strength or time threshold met' };
  }

  // T1: Local Alert - basic case with location and photo
  if (evidenceStrength >= 0.2) {
    return { tier: 'T1', reason: 'Basic case requirements met' };
  }

  // T0: Draft - incomplete
  return { tier: 'T0', reason: 'Case incomplete or insufficient evidence' };
}

// ═══════════════════════════════════════════════════════════════════
// GEOFENCE OVERLAP DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if two geofences overlap (for sighting deduplication)
 */
export function geofencesOverlap(
  g1: { center: { lat: number; lng: number }; radiusMeters: number },
  g2: { center: { lat: number; lng: number }; radiusMeters: number }
): boolean {
  const distance = haversineDistance(g1.center, g2.center);
  return distance < g1.radiusMeters + g2.radiusMeters;
}

/**
 * Calculate distance between two points in meters (Haversine formula)
 */
function haversineDistance(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ═══════════════════════════════════════════════════════════════════
// WIND-ADJUSTED GEOFENCE (ELLIPTICAL)
// ═══════════════════════════════════════════════════════════════════

export interface WindAdjustedGeofence extends GeofenceResult {
  ellipse: EllipticalSearchArea | null;
  windBias: {
    primaryDirection: number;
    confidence: number;
    spreadDegrees: number;
  } | null;
}

/**
 * Compute geofence with wind direction adjustment
 * Returns both circular fallback and wind-adjusted ellipse
 * 
 * Research basis:
 * - Dogs travel downwind 60-70% of the time (scent disperses behind them)
 * - Higher wind speeds strengthen directional preference
 * - Cats are less affected by wind (shelter-seeking dominates)
 */
export function computeWindAdjustedGeofence(params: {
  originalLocation: { lat: number; lng: number };
  pet: PetProfile;
  context: LocationContext;
  hoursSinceLost: number;
  sightingClusters: SightingCluster[];
  wind: WindData | null;
}): WindAdjustedGeofence {
  const { wind, pet, ...baseParams } = params;
  
  // First compute the standard circular geofence
  const circularResult = computeDynamicGeofence({ ...baseParams, pet });
  
  // If no wind data or calm conditions, return circular only
  if (!wind || wind.speed < 3) {
    return {
      ...circularResult,
      ellipse: null,
      windBias: null,
    };
  }
  
  // Calculate wind-adjusted elliptical search area
  const ellipse = createWindAdjustedSearchArea({
    center: circularResult.center,
    baseRadiusMeters: circularResult.radiusMeters,
    species: pet.species,
    wind,
  });
  
  // Calculate wind bias for dogs (primary use case)
  const windBias = pet.species === 'dog' ? calculateDogWindBias(wind) : null;
  
  return {
    ...circularResult,
    ellipse,
    windBias: windBias ? {
      primaryDirection: windBias.primaryDirection,
      confidence: windBias.confidence,
      spreadDegrees: windBias.spreadDegrees,
    } : null,
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT MODELS FOR REFERENCE
// ═══════════════════════════════════════════════════════════════════

export const GEOFENCE_MODELS = {
  species: SPECIES_MODELS,
  behavior: BEHAVIOR_MODIFIERS,
  environment: ENVIRONMENT_MODIFIERS,
  weather: WEATHER_URGENCY,
};
