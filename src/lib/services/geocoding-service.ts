/**
 * Geocoding Service
 * Converts addresses to lat/lng coordinates using Google Geocoding API
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

export async function geocodeAddress(
  city: string,
  state: string,
  zip: string
): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key not configured');
    return null;
  }

  const address = `${city}, ${state} ${zip}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address,
      };
    }

    console.error('Geocoding failed:', data.status);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Fallback: Use ZIP code centroid lookup (offline, less accurate)
 * For when Google API is unavailable or rate-limited
 */
const ZIP_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  // West Virginia ZIP codes (sample - expand as needed)
  '24901': { lat: 37.7757, lng: -80.4423 }, // Lewisburg (Greenbrier)
  '25301': { lat: 38.3498, lng: -81.6326 }, // Charleston (Kanawha)
  '25302': { lat: 38.3732, lng: -81.5651 }, // Charleston
  '25303': { lat: 38.3287, lng: -81.6754 }, // South Charleston
  '25304': { lat: 38.3109, lng: -81.6651 }, // Charleston
  '25305': { lat: 38.3498, lng: -81.6326 }, // Charleston
};

export function geocodeByZipFallback(zip: string): GeocodeResult | null {
  const coords = ZIP_CENTROIDS[zip];
  if (!coords) {
    console.warn(`ZIP code ${zip} not in fallback database`);
    return null;
  }

  return {
    lat: coords.lat,
    lng: coords.lng,
    formatted_address: `${zip}, WV`,
  };
}

/**
 * Primary geocoding function with fallback
 */
export async function geocodeVolunteerAddress(
  city: string,
  zip: string
): Promise<GeocodeResult | null> {
  // Try Google API first
  const result = await geocodeAddress(city, 'WV', zip);
  if (result) return result;

  // Fallback to ZIP centroid
  return geocodeByZipFallback(zip);
}
