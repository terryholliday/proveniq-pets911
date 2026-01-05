/**
 * Reverse geocode coordinates to landmark text
 * When offline: show GPS + nearest road/route if available
 * Per task: never block on geocoding
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  timeout: number = 3000
): Promise<string> {
  // Format GPS coordinates as fallback
  const gpsFallback = formatGpsCoordinates(lat, lng);
  
  if (typeof navigator === 'undefined' || !navigator.onLine) {
    return gpsFallback;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Using OpenStreetMap Nominatim (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ProveniqPets/1.0',
        },
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return gpsFallback;
    }
    
    const data = await response.json();
    
    // Extract meaningful location parts
    const address = data.address || {};
    const parts: string[] = [];
    
    if (address.road) parts.push(address.road);
    if (address.neighbourhood) parts.push(address.neighbourhood);
    if (address.suburb) parts.push(address.suburb);
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village);
    }
    
    if (parts.length === 0) {
      return data.display_name?.split(',').slice(0, 2).join(', ') || gpsFallback;
    }
    
    return parts.slice(0, 2).join(', ');
    
  } catch {
    // Network error or timeout - return GPS coordinates
    return gpsFallback;
  }
}

/**
 * Format GPS coordinates for display
 */
export function formatGpsCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}°${latDir}, ${Math.abs(lng).toFixed(5)}°${lngDir}`;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get current position with timeout
 * Returns null if geolocation unavailable or times out
 */
export async function getCurrentPosition(
  timeout: number = 10000
): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 60000, // Accept cached position up to 1 minute old
      }
    );
  });
}
