// ============================================================
// PROVENIQ MAYDAY TELEPORT API SCHEMA
// Interoperability layer for PROVENIQ ShelterOS integration
// ============================================================
// 
// PROVENIQ ShelterOS (shelters) consume this API to:
// - Receive stray alerts in their service area
// - Log intake directly from their existing interface
// - Track reunification outcomes
// - View response metrics
//
// Standalone Partner Portal remains for:
// - Rescues, foster networks, transport orgs
// - Organizations not using PROVENIQ ShelterOS
// ============================================================

import type { County, TriageTier, TriageCode } from '../types';

// ============================================================
// TELEPORT DATA TYPES
// ============================================================

/**
 * Alert payload sent to PROVENIQ ShelterOS shelters
 * Privacy-aware: Reporter PII withheld until acknowledged
 */
export interface TeleportAlert {
  alert_id: string;
  created_at: string;
  expires_at: string;
  
  // Triage
  tier: TriageTier;
  code: TriageCode;
  urgency: 'CRITICAL' | 'URGENT' | 'ROUTINE';
  
  // Animal
  animal: {
    species: 'DOG' | 'CAT' | 'OTHER';
    description: string;
    color: string;
    size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'UNKNOWN';
    condition: 'HEALTHY' | 'INJURED_STABLE' | 'CRITICAL' | 'UNKNOWN';
    photo_urls: string[];
  };
  
  // Location (approximate until acknowledged)
  location: {
    county: County;
    city: string;
    approximate_area: string; // "Downtown Lewisburg" not exact address
    coordinates?: {
      lat: number;
      lng: number;
      accuracy_meters: number;
    };
  };
  
  // Status
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'EXPIRED';
  acknowledged_by?: string; // Organization ID
  acknowledged_at?: string;
  
  // Actions available
  actions: {
    can_acknowledge: boolean;
    can_resolve: boolean;
    acknowledge_url: string;
    resolve_url: string;
  };
}

/**
 * Full alert details (after acknowledgment)
 * Includes reporter contact for pickup coordination
 */
export interface TeleportAlertDetails extends TeleportAlert {
  // Revealed after acknowledgment
  reporter: {
    name: string;
    phone: string;
    email?: string;
    can_hold_animal: boolean;
    available_until?: string;
  };
  
  location_exact: {
    address: string;
    instructions?: string;
  };
  
  // Case linkage
  Mayday_case_id: string;
  lifelog_event_id?: string;
}

/**
 * Intake record to log animal receipt
 */
export interface TeleportIntakePayload {
  alert_id: string;
  organization_id: string;
  
  // Animal received
  animal: {
    species: 'DOG' | 'CAT' | 'OTHER';
    description: string;
    estimated_age?: string;
    sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
    weight_lbs?: number;
    microchip_id?: string;
    microchip_scanned: boolean;
  };
  
  // Intake details
  intake: {
    received_at: string;
    received_by: string;
    source: 'Mayday_ALERT' | 'WALK_IN' | 'TRANSPORT' | 'ACO_DELIVERY';
    condition_on_arrival: string;
    immediate_medical_needed: boolean;
    notes?: string;
  };
  
  // Disposition plan
  disposition: {
    stray_hold_days: number;
    placement_type: 'SHELTER' | 'FOSTER' | 'RESCUE_TRANSFER';
    foster_id?: string;
  };
}

/**
 * Reunification record
 */
export interface TeleportReunificationPayload {
  alert_id: string;
  Mayday_case_id: string;
  organization_id: string;
  
  reunification: {
    reunited_at: string;
    method: 'MICROCHIP' | 'OWNER_CLAIM' | 'PHOTO_MATCH' | 'COLLAR_TAG' | 'OTHER';
    verified_by: string;
    owner_verified: boolean;
    proof_of_ownership?: string;
  };
  
  // For LifeLog immutable record
  outcome: {
    type: 'REUNITED';
    days_in_care: number;
    notes?: string;
  };
}

/**
 * Metrics payload for PROVENIQ ShelterOS dashboard widget
 */
export interface TeleportMetrics {
  organization_id: string;
  period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  
  alerts: {
    received: number;
    acknowledged: number;
    avg_response_minutes: number;
  };
  
  outcomes: {
    total_intake: number;
    reunifications: number;
    reunification_rate: number;
    avg_days_to_reunite: number;
  };
  
  comparison: {
    county_avg_response_minutes: number;
    county_avg_reunification_rate: number;
    state_avg_reunification_rate: number;
  };
}

// ============================================================
// TELEPORT API ENDPOINTS
// ============================================================

export const TELEPORT_ENDPOINTS = {
  // Alerts
  GET_ALERTS: '/teleport/v1/Mayday/alerts',
  GET_ALERT_DETAILS: '/teleport/v1/Mayday/alerts/:id',
  ACKNOWLEDGE_ALERT: '/teleport/v1/Mayday/alerts/:id/acknowledge',
  
  // Intake
  LOG_INTAKE: '/teleport/v1/Mayday/intake',
  
  // Reunification
  LOG_REUNIFICATION: '/teleport/v1/Mayday/reunification',
  
  // Metrics
  GET_METRICS: '/teleport/v1/Mayday/metrics',
  
  // Webhooks (PROVENIQ ShelterOS subscribes)
  WEBHOOK_NEW_ALERT: '/teleport/v1/Mayday/webhooks/alert',
  WEBHOOK_CASE_UPDATE: '/teleport/v1/Mayday/webhooks/case',
} as const;

// ============================================================
// TELEPORT WEBHOOK EVENTS
// ============================================================

export type TeleportWebhookEvent = 
  | { type: 'ALERT_NEW'; payload: TeleportAlert }
  | { type: 'ALERT_ESCALATED'; payload: TeleportAlert }
  | { type: 'ALERT_EXPIRED'; payload: { alert_id: string } }
  | { type: 'CASE_REUNITED'; payload: { case_id: string; alert_id: string } }
  | { type: 'CASE_TRANSFERRED'; payload: { case_id: string; from_org: string; to_org: string } };

// ============================================================
// TELEPORT AUTH
// ============================================================

export interface TeleportAuthHeader {
  'X-Teleport-Org-ID': string;
  'X-Teleport-API-Key': string;
  'X-Teleport-Source': 'PROVENIQ_SHELTEROS' | 'PARTNER_PORTAL' | 'MOBILE';
}

/**
 * Validate Teleport API request
 */
export function validateTeleportAuth(headers: Partial<TeleportAuthHeader>): {
  valid: boolean;
  organizationId?: string;
  error?: string;
} {
  if (!headers['X-Teleport-Org-ID']) {
    return { valid: false, error: 'Missing X-Teleport-Org-ID header' };
  }
  if (!headers['X-Teleport-API-Key']) {
    return { valid: false, error: 'Missing X-Teleport-API-Key header' };
  }
  
  // TODO: Validate API key against database
  
  return {
    valid: true,
    organizationId: headers['X-Teleport-Org-ID'],
  };
}
