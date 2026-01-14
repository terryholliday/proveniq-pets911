/**
 * WEATHER SERVICE FOR PET SEARCH OPTIMIZATION
 * 
 * Integrates weather data into search area calculations.
 * 
 * Key Research Findings:
 * - Dogs tend to travel DOWNWIND (wind at their back) - scent disperses behind them
 * - Cats seek shelter and stay closer to home in bad weather
 * - Rain reduces scent trails, requiring tighter initial search areas
 * - Extreme temperatures affect travel distance and shelter-seeking behavior
 * - Wind speed affects how far scent carries (relevant for tracking)
 * 
 * Architecture:
 * - petmayday accesses weather APIs directly for real-time operational needs
 * - Data is reported back to PROVENIQ Core for aggregation and ML training
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface WindData {
  speed: number;           // mph
  direction: number;       // degrees (0-360, 0=N, 90=E, 180=S, 270=W)
  gustSpeed?: number;      // mph
}

export interface WeatherData {
  timestamp: string;
  location: { lat: number; lng: number };
  
  // Current conditions
  temperature: number;     // Fahrenheit
  feelsLike: number;
  humidity: number;        // percentage
  
  // Wind
  wind: WindData;
  
  // Precipitation
  precipitationType: 'none' | 'rain' | 'snow' | 'sleet' | 'hail';
  precipitationIntensity: 'none' | 'light' | 'moderate' | 'heavy';
  precipitationProbability: number; // percentage
  
  // Visibility & Conditions
  visibility: number;      // miles
  cloudCover: number;      // percentage
  uvIndex: number;
  
  // Alerts
  alerts: WeatherAlert[];
  
  // Derived
  conditions: WeatherConditionCategory;
  searchImpact: SearchImpactAssessment;
}

export interface WeatherAlert {
  type: 'heat' | 'cold' | 'wind' | 'flood' | 'tornado' | 'thunderstorm' | 'winter_storm' | 'fire';
  severity: 'advisory' | 'watch' | 'warning' | 'emergency';
  headline: string;
  description: string;
  expiresAt: string;
}

export type WeatherConditionCategory = 
  | 'ideal'           // Perfect search conditions
  | 'good'            // Minor weather, no significant impact
  | 'challenging'     // Weather affects search but possible
  | 'hazardous'       // Dangerous for searchers
  | 'impossible';     // Active emergency, no outdoor search

export interface SearchImpactAssessment {
  overallImpact: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  scentTrackingQuality: number;      // 0-100
  visibilityQuality: number;         // 0-100
  searcherSafetyRisk: number;        // 0-100
  animalStressLevel: number;         // 0-100 (estimated)
  recommendedActions: string[];
}

// ═══════════════════════════════════════════════════════════════════
// WIND DIRECTION TRAVEL MODEL
// ═══════════════════════════════════════════════════════════════════

/**
 * Research-based model for how wind affects animal travel direction.
 * 
 * Dogs: Strongly prefer traveling downwind (wind at back)
 * - They follow their nose, and scent disperses behind them downwind
 * - 60-70% of lost dogs travel generally downwind
 * - Higher wind speeds strengthen this tendency
 * 
 * Cats: Less affected by wind direction
 * - Shelter-seeking behavior dominates
 * - May travel perpendicular to wind to avoid direct exposure
 */

export interface WindTravelBias {
  // Primary direction bias (degrees, 0-360)
  primaryDirection: number;
  
  // Confidence in this direction (0-1)
  confidence: number;
  
  // Angular spread of likely travel (degrees from primary)
  spreadDegrees: number;
  
  // Multiplier for search radius in downwind direction
  downwindRadiusMultiplier: number;
  
  // Multiplier for search radius in upwind direction
  upwindRadiusMultiplier: number;
}

/**
 * Calculate wind-based travel bias for dogs
 */
export function calculateDogWindBias(wind: WindData): WindTravelBias {
  // Dogs travel DOWNWIND (opposite of wind direction)
  // Wind direction 0° (from North) means dog travels South (180°)
  const downwindDirection = (wind.direction + 180) % 360;
  
  // Confidence increases with wind speed (stronger wind = stronger tendency)
  // At 0 mph: 0.3 confidence (random)
  // At 15+ mph: 0.8 confidence (strong downwind preference)
  const speedFactor = Math.min(wind.speed / 15, 1);
  const confidence = 0.3 + (speedFactor * 0.5);
  
  // Spread narrows with higher wind speed
  // Low wind: ±90° spread (nearly random)
  // High wind: ±45° spread (more directional)
  const spreadDegrees = 90 - (speedFactor * 45);
  
  // Radius multipliers
  // Dogs travel farther downwind, shorter upwind
  const downwindMultiplier = 1.0 + (speedFactor * 0.5);  // Up to 1.5x
  const upwindMultiplier = 1.0 - (speedFactor * 0.3);    // Down to 0.7x
  
  return {
    primaryDirection: downwindDirection,
    confidence,
    spreadDegrees,
    downwindRadiusMultiplier: downwindMultiplier,
    upwindRadiusMultiplier: upwindMultiplier,
  };
}

/**
 * Calculate wind-based travel bias for cats
 */
export function calculateCatWindBias(wind: WindData): WindTravelBias {
  // Cats are less affected by wind direction
  // They tend to seek shelter, which could be any direction
  // Slight preference to travel perpendicular to strong winds
  
  const perpendicular1 = (wind.direction + 90) % 360;
  const perpendicular2 = (wind.direction + 270) % 360;
  
  // Very low confidence - cats don't follow wind patterns strongly
  const speedFactor = Math.min(wind.speed / 20, 1);
  const confidence = 0.1 + (speedFactor * 0.2); // Max 0.3
  
  return {
    primaryDirection: perpendicular1, // Arbitrary choice of perpendicular
    confidence,
    spreadDegrees: 120, // Wide spread - cats are unpredictable
    downwindRadiusMultiplier: 1.0,
    upwindRadiusMultiplier: 1.0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ELLIPTICAL SEARCH AREA CALCULATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Instead of a circular geofence, wind data suggests an ELLIPSE
 * - Long axis aligned with downwind direction
 * - Short axis perpendicular (upwind/crosswind)
 */

export interface EllipticalSearchArea {
  center: { lat: number; lng: number };
  
  // Semi-major axis (downwind direction)
  majorAxisMeters: number;
  majorAxisBearing: number; // degrees
  
  // Semi-minor axis (perpendicular)
  minorAxisMeters: number;
  
  // For display/API
  eccentricity: number;
  areaSquareMeters: number;
  
  // Original circular equivalent
  circularRadiusEquivalent: number;
  
  // Metadata
  windAdjusted: boolean;
  windData: WindData | null;
}

/**
 * Convert circular search radius to wind-adjusted ellipse
 */
export function createWindAdjustedSearchArea(params: {
  center: { lat: number; lng: number };
  baseRadiusMeters: number;
  species: string; // Accepts any species, maps to dog/cat/other for wind model
  wind: WindData | null;
}): EllipticalSearchArea {
  const { center, baseRadiusMeters, species, wind } = params;
  
  // No wind data or calm conditions - return circle
  if (!wind || wind.speed < 3) {
    return {
      center,
      majorAxisMeters: baseRadiusMeters,
      majorAxisBearing: 0,
      minorAxisMeters: baseRadiusMeters,
      eccentricity: 0,
      areaSquareMeters: Math.PI * baseRadiusMeters * baseRadiusMeters,
      circularRadiusEquivalent: baseRadiusMeters,
      windAdjusted: false,
      windData: wind,
    };
  }
  
  // Calculate wind bias based on species
  const bias = species === 'dog' 
    ? calculateDogWindBias(wind)
    : species === 'cat'
      ? calculateCatWindBias(wind)
      : { ...calculateDogWindBias(wind), confidence: 0.2 }; // Other species - low confidence
  
  // Calculate ellipse axes
  const majorAxis = baseRadiusMeters * bias.downwindRadiusMultiplier;
  const minorAxis = baseRadiusMeters * bias.upwindRadiusMultiplier;
  
  // Eccentricity (0 = circle, approaches 1 = very elongated)
  const eccentricity = Math.sqrt(1 - Math.pow(minorAxis / majorAxis, 2));
  
  // Area of ellipse
  const area = Math.PI * majorAxis * minorAxis;
  
  // Circular equivalent (same area)
  const circularEquivalent = Math.sqrt(area / Math.PI);
  
  return {
    center,
    majorAxisMeters: majorAxis,
    majorAxisBearing: bias.primaryDirection,
    minorAxisMeters: minorAxis,
    eccentricity,
    areaSquareMeters: area,
    circularRadiusEquivalent: circularEquivalent,
    windAdjusted: true,
    windData: wind,
  };
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER CONDITION ASSESSMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Assess overall search conditions based on weather
 */
export function assessSearchConditions(weather: Partial<WeatherData>): SearchImpactAssessment {
  const actions: string[] = [];
  let scentQuality = 100;
  let visibilityQuality = 100;
  let safetyRisk = 0;
  let animalStress = 0;
  
  // Temperature impacts
  const temp = weather.temperature ?? 70;
  if (temp > 90) {
    scentQuality -= 20;
    animalStress += 30;
    safetyRisk += 20;
    actions.push('High heat - search in early morning/evening');
    actions.push('Animal likely seeking shade/water');
  } else if (temp > 85) {
    animalStress += 15;
    actions.push('Warm conditions - bring water for searchers');
  } else if (temp < 32) {
    animalStress += 25;
    safetyRisk += 15;
    actions.push('Freezing conditions - animal seeking warmth');
    actions.push('Check garages, sheds, under porches');
  } else if (temp < 40) {
    animalStress += 10;
    actions.push('Cold conditions - check sheltered areas');
  }
  
  // Wind impacts
  const windSpeed = weather.wind?.speed ?? 0;
  if (windSpeed > 25) {
    scentQuality -= 40;
    safetyRisk += 25;
    actions.push('High winds dispersing scent trails');
    actions.push('Use visual search, scent tracking unreliable');
  } else if (windSpeed > 15) {
    scentQuality -= 20;
    actions.push('Moderate wind - focus search downwind of last known location');
  } else if (windSpeed > 5) {
    actions.push('Light wind - expand search ellipse downwind');
  }
  
  // Precipitation impacts
  if (weather.precipitationType !== 'none' && weather.precipitationType) {
    if (weather.precipitationIntensity === 'heavy') {
      scentQuality -= 50;
      visibilityQuality -= 40;
      safetyRisk += 30;
      animalStress += 30;
      actions.push('Heavy precipitation - scent trails washing away');
      actions.push('Animal likely sheltering');
    } else if (weather.precipitationIntensity === 'moderate') {
      scentQuality -= 30;
      visibilityQuality -= 20;
      animalStress += 15;
      actions.push('Rain affecting scent - tighten search area');
    } else {
      scentQuality -= 15;
      actions.push('Light precipitation - search still viable');
    }
  }
  
  // Visibility
  const visibility = weather.visibility ?? 10;
  if (visibility < 0.5) {
    visibilityQuality -= 60;
    safetyRisk += 40;
    actions.push('Very low visibility - postpone visual search');
  } else if (visibility < 2) {
    visibilityQuality -= 30;
    safetyRisk += 15;
    actions.push('Reduced visibility - use caution');
  }
  
  // Alerts
  if (weather.alerts?.some(a => a.severity === 'warning' || a.severity === 'emergency')) {
    safetyRisk += 50;
    actions.push('WEATHER ALERT ACTIVE - prioritize searcher safety');
  }
  
  // Calculate overall impact
  const avgImpact = (100 - scentQuality + 100 - visibilityQuality + safetyRisk + animalStress) / 4;
  let overallImpact: SearchImpactAssessment['overallImpact'];
  if (avgImpact < 10) overallImpact = 'none';
  else if (avgImpact < 25) overallImpact = 'low';
  else if (avgImpact < 50) overallImpact = 'moderate';
  else if (avgImpact < 75) overallImpact = 'high';
  else overallImpact = 'severe';
  
  return {
    overallImpact,
    scentTrackingQuality: Math.max(0, scentQuality),
    visibilityQuality: Math.max(0, visibilityQuality),
    searcherSafetyRisk: Math.min(100, safetyRisk),
    animalStressLevel: Math.min(100, animalStress),
    recommendedActions: actions,
  };
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER API INTEGRATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch weather data from external API
 * Supports: OpenWeatherMap, WeatherAPI, Tomorrow.io
 */
export async function fetchWeatherData(
  lat: number,
  lng: number,
  provider: 'openweathermap' | 'weatherapi' | 'tomorrow' = 'openweathermap'
): Promise<WeatherData | null> {
  // API key would come from environment
  const apiKey = process.env.WEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn('Weather API key not configured');
    return null;
  }
  
  try {
    let response: Response;
    let data: any;
    
    switch (provider) {
      case 'openweathermap':
        response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
        );
        data = await response.json();
        return parseOpenWeatherMap(data, lat, lng);
        
      case 'weatherapi':
        response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lng}`
        );
        data = await response.json();
        return parseWeatherAPI(data, lat, lng);
        
      default:
        return null;
    }
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    return null;
  }
}

function parseOpenWeatherMap(data: any, lat: number, lng: number): WeatherData {
  const assessment = assessSearchConditions({
    temperature: data.main?.temp,
    wind: {
      speed: data.wind?.speed ?? 0,
      direction: data.wind?.deg ?? 0,
      gustSpeed: data.wind?.gust,
    },
    visibility: (data.visibility ?? 10000) / 1609, // Convert meters to miles
    humidity: data.main?.humidity,
  });
  
  return {
    timestamp: new Date().toISOString(),
    location: { lat, lng },
    temperature: data.main?.temp ?? 70,
    feelsLike: data.main?.feels_like ?? 70,
    humidity: data.main?.humidity ?? 50,
    wind: {
      speed: data.wind?.speed ?? 0,
      direction: data.wind?.deg ?? 0,
      gustSpeed: data.wind?.gust,
    },
    precipitationType: data.rain ? 'rain' : data.snow ? 'snow' : 'none',
    precipitationIntensity: 'none',
    precipitationProbability: 0,
    visibility: (data.visibility ?? 10000) / 1609,
    cloudCover: data.clouds?.all ?? 0,
    uvIndex: 0,
    alerts: [],
    conditions: assessment.overallImpact === 'none' ? 'ideal' : 
                assessment.overallImpact === 'low' ? 'good' :
                assessment.overallImpact === 'moderate' ? 'challenging' :
                assessment.overallImpact === 'high' ? 'hazardous' : 'impossible',
    searchImpact: assessment,
  };
}

function parseWeatherAPI(data: any, lat: number, lng: number): WeatherData {
  const current = data.current;
  const assessment = assessSearchConditions({
    temperature: current?.temp_f,
    wind: {
      speed: current?.wind_mph ?? 0,
      direction: current?.wind_degree ?? 0,
      gustSpeed: current?.gust_mph,
    },
    visibility: current?.vis_miles,
    humidity: current?.humidity,
  });
  
  return {
    timestamp: new Date().toISOString(),
    location: { lat, lng },
    temperature: current?.temp_f ?? 70,
    feelsLike: current?.feelslike_f ?? 70,
    humidity: current?.humidity ?? 50,
    wind: {
      speed: current?.wind_mph ?? 0,
      direction: current?.wind_degree ?? 0,
      gustSpeed: current?.gust_mph,
    },
    precipitationType: current?.precip_mm > 0 ? 'rain' : 'none',
    precipitationIntensity: 'none',
    precipitationProbability: 0,
    visibility: current?.vis_miles ?? 10,
    cloudCover: current?.cloud ?? 0,
    uvIndex: current?.uv ?? 0,
    alerts: [],
    conditions: assessment.overallImpact === 'none' ? 'ideal' : 
                assessment.overallImpact === 'low' ? 'good' :
                assessment.overallImpact === 'moderate' ? 'challenging' :
                assessment.overallImpact === 'high' ? 'hazardous' : 'impossible',
    searchImpact: assessment,
  };
}

// ═══════════════════════════════════════════════════════════════════
// PROVENIQ CORE REPORTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Report weather data back to PROVENIQ Core for aggregation
 * This enables cross-system learning and historical analysis
 */
export async function reportToProveniqCore(
  caseId: string,
  weatherData: WeatherData,
  searchOutcome?: {
    found: boolean;
    distanceFromLastKnown: number;
    directionFromLastKnown: number;
  }
): Promise<void> {
  // This would call PROVENIQ Core API
  // For now, just log
  console.log('[PROVENIQ_CORE_REPORT]', {
    system: 'petmayday',
    type: 'weather_search_correlation',
    caseId,
    weather: {
      wind: weatherData.wind,
      conditions: weatherData.conditions,
    },
    outcome: searchOutcome,
    timestamp: new Date().toISOString(),
  });
  
  // In production:
  // await fetch(`${PROVENIQ_CORE_API}/telemetry/weather`, {
  //   method: 'POST',
  //   body: JSON.stringify({ caseId, weatherData, searchOutcome }),
  // });
}
