/**
 * Dynamic Geofence Module
 * 
 * Species-specific radius computation for lost pet searches.
 * Includes wind-adjusted elliptical search areas.
 */

export {
  computeDynamicGeofence,
  computeWindAdjustedGeofence,
  recommendAlertTier,
  geofencesOverlap,
  GEOFENCE_MODELS,
} from './dynamic-geofence';

export type {
  Species,
  Environment,
  BehaviorProfile,
  WeatherCondition,
  PetProfile,
  LocationContext,
  SightingCluster,
  GeofenceResult,
  AlertTier,
  WindAdjustedGeofence,
} from './dynamic-geofence';
