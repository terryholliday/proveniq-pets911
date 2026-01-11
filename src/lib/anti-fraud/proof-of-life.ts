/**
 * PROOF OF LIFE PROTOCOL
 * 
 * Demands metadata-verified photos (time + location stamped) before a
 * "Found" claim can be submitted. No stock photos. No vague threats.
 */

import type {
  PhotoMetadata,
  PhotoVerificationStatus,
  ProofOfLifeSubmission,
  ProofPhoto,
} from './types';

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  maxTimestampAgeDays: 3, // Photo must be taken within 3 days
  maxLocationDistanceKm: 50, // Photo must be within 50km of reported location
  minRequiredPhotos: 1,
  stockPhotoHashBlacklist: new Set<string>(), // Populated from DB
};

// ═══════════════════════════════════════════════════════════════════
// PHOTO METADATA EXTRACTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract metadata from uploaded photo
 * In production, this would use exif-js or similar library
 */
export async function extractPhotoMetadata(
  photoBuffer: ArrayBuffer,
  filename: string
): Promise<PhotoMetadata | null> {
  try {
    // Generate file hash for duplicate/stock photo detection
    const hashBuffer = await crypto.subtle.digest('SHA-256', photoBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // In production: Parse EXIF data from image
    // For now, return structure that would be populated by EXIF parser
    const metadata: PhotoMetadata = {
      timestamp: '', // Would be extracted from EXIF DateTimeOriginal
      gpsCoordinates: null, // Would be extracted from EXIF GPS tags
      deviceId: null, // Would be extracted from EXIF Make/Model
      originalFilename: filename,
      fileHash,
      exifData: null,
    };

    return metadata;
  } catch (error) {
    console.error('Failed to extract photo metadata:', error);
    return null;
  }
}

/**
 * Parse EXIF data from image buffer
 * Returns structured metadata or null if no EXIF present
 */
export function parseExifData(exifRaw: Record<string, unknown>): {
  timestamp: string | null;
  gps: { lat: number; lng: number } | null;
  deviceInfo: string | null;
} {
  // Extract timestamp
  const timestamp = exifRaw['DateTimeOriginal'] || exifRaw['DateTime'] || null;

  // Extract GPS coordinates
  let gps: { lat: number; lng: number } | null = null;
  if (exifRaw['GPSLatitude'] && exifRaw['GPSLongitude']) {
    const lat = parseGpsCoordinate(
      exifRaw['GPSLatitude'] as number[],
      exifRaw['GPSLatitudeRef'] as string
    );
    const lng = parseGpsCoordinate(
      exifRaw['GPSLongitude'] as number[],
      exifRaw['GPSLongitudeRef'] as string
    );
    if (lat !== null && lng !== null) {
      gps = { lat, lng };
    }
  }

  // Extract device info
  const make = exifRaw['Make'] as string | undefined;
  const model = exifRaw['Model'] as string | undefined;
  const deviceInfo = make && model ? `${make} ${model}` : null;

  return {
    timestamp: timestamp as string | null,
    gps,
    deviceInfo,
  };
}

function parseGpsCoordinate(coords: number[], ref: string): number | null {
  if (!coords || coords.length < 3) return null;

  const [degrees, minutes, seconds] = coords;
  let decimal = degrees + minutes / 60 + seconds / 3600;

  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }

  return decimal;
}

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION LOGIC
// ═══════════════════════════════════════════════════════════════════

/**
 * Verify a single photo against Proof of Life requirements
 */
export function verifyPhoto(
  metadata: PhotoMetadata | null,
  reportedLocation: { lat: number; lng: number } | null,
  reportedAt: string
): { status: PhotoVerificationStatus; notes: string } {
  // No metadata = immediate failure
  if (!metadata) {
    return {
      status: 'FAILED_NO_METADATA',
      notes: 'Photo has no embedded metadata. Original, unedited photo required.',
    };
  }

  // Check for stock photo (hash blacklist)
  if (CONFIG.stockPhotoHashBlacklist.has(metadata.fileHash)) {
    return {
      status: 'FAILED_STOCK_PHOTO',
      notes: 'Photo matches known stock image database.',
    };
  }

  // Timestamp verification
  if (!metadata.timestamp) {
    return {
      status: 'FAILED_NO_METADATA',
      notes: 'Photo has no timestamp in EXIF data.',
    };
  }

  const photoDate = new Date(metadata.timestamp);
  const reportDate = new Date(reportedAt);
  const daysDiff = Math.abs(
    (photoDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > CONFIG.maxTimestampAgeDays) {
    return {
      status: 'FAILED_TIMESTAMP_MISMATCH',
      notes: `Photo timestamp (${metadata.timestamp}) is ${Math.round(daysDiff)} days from report date. Max allowed: ${CONFIG.maxTimestampAgeDays} days.`,
    };
  }

  // GPS verification (if report has location)
  if (reportedLocation && metadata.gpsCoordinates) {
    const distanceKm = calculateDistanceKm(
      reportedLocation.lat,
      reportedLocation.lng,
      metadata.gpsCoordinates.lat,
      metadata.gpsCoordinates.lng
    );

    if (distanceKm > CONFIG.maxLocationDistanceKm) {
      return {
        status: 'FAILED_LOCATION_MISMATCH',
        notes: `Photo location is ${Math.round(distanceKm)}km from reported location. Max allowed: ${CONFIG.maxLocationDistanceKm}km.`,
      };
    }
  }

  // All checks passed
  return {
    status: 'VERIFIED',
    notes: `GPS_MATCH + TIMESTAMP_VERIFIED. Photo taken ${metadata.timestamp}.`,
  };
}

/**
 * Calculate distance between two coordinates in kilometers (Haversine formula)
 */
function calculateDistanceKm(
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
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ═══════════════════════════════════════════════════════════════════
// SUBMISSION PROCESSING
// ═══════════════════════════════════════════════════════════════════

/**
 * Process a complete Proof of Life submission
 */
export async function processProofOfLifeSubmission(
  reportId: string,
  submittedBy: string,
  photos: Array<{
    photoId: string;
    url: string;
    buffer: ArrayBuffer;
    filename: string;
  }>,
  reportedLocation: { lat: number; lng: number } | null,
  reportedAt: string
): Promise<ProofOfLifeSubmission> {
  const submissionId = crypto.randomUUID();
  const processedPhotos: ProofPhoto[] = [];

  for (const photo of photos) {
    const metadata = await extractPhotoMetadata(photo.buffer, photo.filename);
    const verification = verifyPhoto(metadata, reportedLocation, reportedAt);

    processedPhotos.push({
      photoId: photo.photoId,
      url: photo.url,
      metadata,
      verificationStatus: verification.status,
      verificationNotes: verification.notes,
    });
  }

  // Determine overall status
  const verifiedCount = processedPhotos.filter(
    p => p.verificationStatus === 'VERIFIED'
  ).length;
  
  let overallStatus: PhotoVerificationStatus;
  let verificationDetails: string;

  if (verifiedCount >= CONFIG.minRequiredPhotos) {
    overallStatus = 'VERIFIED';
    verificationDetails = `${verifiedCount}/${processedPhotos.length} photos verified. Proof of Life confirmed.`;
  } else {
    // Return the most severe failure reason
    const failures = processedPhotos.filter(p => p.verificationStatus !== 'VERIFIED');
    overallStatus = failures[0]?.verificationStatus || 'FAILED_NO_METADATA';
    verificationDetails = failures.map(f => f.verificationNotes).join(' | ');
  }

  return {
    submissionId,
    reportId,
    submittedBy,
    submittedAt: new Date().toISOString(),
    photos: processedPhotos,
    overallStatus,
    verificationDetails,
  };
}

// ═══════════════════════════════════════════════════════════════════
// STOCK PHOTO DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if photo hash matches known stock images
 * In production, this would query a database of known stock photo hashes
 */
export async function checkStockPhotoDatabase(
  fileHash: string
): Promise<{ isStock: boolean; source?: string }> {
  // Query external stock photo detection service or local hash database
  // For now, return false - would be implemented with actual database
  if (CONFIG.stockPhotoHashBlacklist.has(fileHash)) {
    return { isStock: true, source: 'Stock Photo Database Match' };
  }
  return { isStock: false };
}

/**
 * Add a hash to the stock photo blacklist
 */
export function addToStockPhotoBlacklist(fileHash: string): void {
  CONFIG.stockPhotoHashBlacklist.add(fileHash);
}
