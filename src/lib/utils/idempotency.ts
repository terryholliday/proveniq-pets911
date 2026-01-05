import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new idempotency key (UUID v4)
 * Per OFFLINE_PROTOCOL.md: Key must be generated ONCE when action is created
 * Key must persist through all retry attempts
 * Key must NOT be regenerated on retry
 */
export function generateIdempotencyKey(): string {
  return uuidv4();
}

/**
 * Generate a device ID for offline queue tracking
 * Persists to localStorage for consistency across sessions
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }
  
  const DEVICE_ID_KEY = 'proveniq_device_id';
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  
  if (stored) {
    return stored;
  }
  
  const newDeviceId = uuidv4();
  localStorage.setItem(DEVICE_ID_KEY, newDeviceId);
  return newDeviceId;
}

/**
 * Calculate expiry timestamp (7 days from now per OFFLINE_PROTOCOL.md)
 */
export function calculateExpiryTimestamp(): string {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + SEVEN_DAYS_MS).toISOString();
}
