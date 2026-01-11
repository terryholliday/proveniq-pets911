/**
 * ALERT CHANNEL DEFINITIONS
 * 
 * 7 Alert Channels as defined in the Pet911 Protocol:
 * 1. Mobile Push - Opt-in users, pet owners, community members
 * 2. SMS - High-urgency verified cases only
 * 3. Email - Low urgency summaries, follow-ups
 * 4. Shelter Console - Operational inbox for shelter staff
 * 5. Responder Network - USPS, UPS, FedEx, Uber, Lyft, municipal
 * 6. Public Displays - Gas stations, kiosks, digital billboards
 * 7. Camera/IoT - Ring-style ecosystems, smart cameras
 */

import type { AlertTier } from '../geofence';

// ═══════════════════════════════════════════════════════════════════
// CHANNEL TYPES
// ═══════════════════════════════════════════════════════════════════

export type ChannelId =
  | 'push'
  | 'sms'
  | 'email'
  | 'shelter_console'
  | 'responder_network'
  | 'public_display'
  | 'camera_iot';

export type ResponderType =
  | 'USPS'
  | 'UPS'
  | 'FedEx'
  | 'Amazon_Flex'
  | 'Uber'
  | 'Lyft'
  | 'DoorDash'
  | 'Instacart'
  | 'Municipal_Staff'
  | 'Animal_Control'
  | 'Utility_Worker';

export type PublicDisplayType =
  | 'gas_station_screen'
  | 'community_kiosk'
  | 'digital_billboard'
  | 'convenience_store'
  | 'library_display'
  | 'post_office_screen';

export type CameraIoTType =
  | 'ring_doorbell'
  | 'nest_camera'
  | 'arlo_camera'
  | 'blink_camera'
  | 'wyze_camera'
  | 'community_camera'
  | 'traffic_camera'
  | 'municipal_camera';

// ═══════════════════════════════════════════════════════════════════
// CHANNEL CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

export interface ChannelConfig {
  id: ChannelId;
  name: string;
  description: string;
  minTier: AlertTier;
  requiresConsent: boolean;
  requiresVerification: boolean;
  requiresHumanReview: boolean;
  requiresPartnerContract: boolean;
  defaultTTLHours: number;
  maxTTLHours: number;
  rateLimitPerDay: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export const CHANNEL_CONFIGS: Record<ChannelId, ChannelConfig> = {
  push: {
    id: 'push',
    name: 'Mobile Push',
    description: 'Opt-in users, pet owners, community members',
    minTier: 'T1',
    requiresConsent: true,
    requiresVerification: false,
    requiresHumanReview: false,
    requiresPartnerContract: false,
    defaultTTLHours: 4,
    maxTTLHours: 12,
    rateLimitPerDay: 10,
    urgencyLevel: 'medium',
  },
  sms: {
    id: 'sms',
    name: 'SMS',
    description: 'High-urgency verified cases only',
    minTier: 'T2',
    requiresConsent: true,
    requiresVerification: true,
    requiresHumanReview: false,
    requiresPartnerContract: false,
    defaultTTLHours: 2,
    maxTTLHours: 6,
    rateLimitPerDay: 3,
    urgencyLevel: 'high',
  },
  email: {
    id: 'email',
    name: 'Email',
    description: 'Low urgency summaries, follow-ups',
    minTier: 'T1',
    requiresConsent: true,
    requiresVerification: false,
    requiresHumanReview: false,
    requiresPartnerContract: false,
    defaultTTLHours: 12,
    maxTTLHours: 48,
    rateLimitPerDay: 5,
    urgencyLevel: 'low',
  },
  shelter_console: {
    id: 'shelter_console',
    name: 'Shelter Console',
    description: 'Operational inbox for shelter staff',
    minTier: 'T1',
    requiresConsent: false, // Shelter opt-in at org level
    requiresVerification: false,
    requiresHumanReview: false,
    requiresPartnerContract: true,
    defaultTTLHours: 24,
    maxTTLHours: 72,
    rateLimitPerDay: 50,
    urgencyLevel: 'medium',
  },
  responder_network: {
    id: 'responder_network',
    name: 'Responder Network',
    description: 'USPS, UPS, FedEx, Uber, Lyft, municipal staff',
    minTier: 'T3',
    requiresConsent: false, // Partner-level agreement
    requiresVerification: true,
    requiresHumanReview: false,
    requiresPartnerContract: true,
    defaultTTLHours: 4,
    maxTTLHours: 8,
    rateLimitPerDay: 20,
    urgencyLevel: 'high',
  },
  public_display: {
    id: 'public_display',
    name: 'Public Display Network',
    description: 'Gas stations, kiosks, digital billboards',
    minTier: 'T4',
    requiresConsent: false,
    requiresVerification: true,
    requiresHumanReview: true, // REQUIRED
    requiresPartnerContract: true,
    defaultTTLHours: 6,
    maxTTLHours: 12,
    rateLimitPerDay: 5,
    urgencyLevel: 'high',
  },
  camera_iot: {
    id: 'camera_iot',
    name: 'Camera/IoT Network',
    description: 'Ring-style ecosystems, smart cameras',
    minTier: 'T3',
    requiresConsent: false, // Partner-level
    requiresVerification: true,
    requiresHumanReview: false,
    requiresPartnerContract: true,
    defaultTTLHours: 8,
    maxTTLHours: 24,
    rateLimitPerDay: 10,
    urgencyLevel: 'medium',
  },
};

// ═══════════════════════════════════════════════════════════════════
// RESPONDER NETWORK CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export interface ResponderPartner {
  type: ResponderType;
  name: string;
  coverageAreas: string[]; // County codes
  activeHours: { start: number; end: number }; // 24h format
  estimatedResponseMinutes: number;
  requiresRouteMatch: boolean;
  integrationStatus: 'active' | 'pending' | 'pilot' | 'inactive';
}

export const RESPONDER_PARTNERS: ResponderPartner[] = [
  {
    type: 'USPS',
    name: 'United States Postal Service',
    coverageAreas: ['*'], // National
    activeHours: { start: 7, end: 18 },
    estimatedResponseMinutes: 240, // Route-based
    requiresRouteMatch: true,
    integrationStatus: 'pilot',
  },
  {
    type: 'UPS',
    name: 'UPS Drivers',
    coverageAreas: ['*'],
    activeHours: { start: 8, end: 20 },
    estimatedResponseMinutes: 180,
    requiresRouteMatch: true,
    integrationStatus: 'pending',
  },
  {
    type: 'FedEx',
    name: 'FedEx Drivers',
    coverageAreas: ['*'],
    activeHours: { start: 7, end: 20 },
    estimatedResponseMinutes: 180,
    requiresRouteMatch: true,
    integrationStatus: 'pending',
  },
  {
    type: 'Uber',
    name: 'Uber Drivers',
    coverageAreas: ['urban', 'suburban'],
    activeHours: { start: 0, end: 24 }, // 24/7
    estimatedResponseMinutes: 30,
    requiresRouteMatch: false,
    integrationStatus: 'pending',
  },
  {
    type: 'Lyft',
    name: 'Lyft Drivers',
    coverageAreas: ['urban', 'suburban'],
    activeHours: { start: 0, end: 24 },
    estimatedResponseMinutes: 30,
    requiresRouteMatch: false,
    integrationStatus: 'pending',
  },
  {
    type: 'Municipal_Staff',
    name: 'Municipal Workers',
    coverageAreas: ['WV-GRE', 'WV-KAN'], // Pilot counties
    activeHours: { start: 6, end: 18 },
    estimatedResponseMinutes: 60,
    requiresRouteMatch: false,
    integrationStatus: 'active',
  },
  {
    type: 'Animal_Control',
    name: 'Animal Control Officers',
    coverageAreas: ['WV-GRE', 'WV-KAN'],
    activeHours: { start: 8, end: 17 },
    estimatedResponseMinutes: 45,
    requiresRouteMatch: false,
    integrationStatus: 'active',
  },
];

// ═══════════════════════════════════════════════════════════════════
// PUBLIC DISPLAY NETWORK CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export interface PublicDisplayPartner {
  type: PublicDisplayType;
  name: string;
  locationCount: number;
  coverageAreas: string[];
  displayDurationSeconds: number;
  rotationSlots: number;
  integrationStatus: 'active' | 'pending' | 'pilot' | 'inactive';
}

export const PUBLIC_DISPLAY_PARTNERS: PublicDisplayPartner[] = [
  {
    type: 'gas_station_screen',
    name: 'Gas Station Digital Displays',
    locationCount: 0, // To be configured per region
    coverageAreas: ['WV-GRE', 'WV-KAN'],
    displayDurationSeconds: 15,
    rotationSlots: 6,
    integrationStatus: 'pilot',
  },
  {
    type: 'community_kiosk',
    name: 'Community Information Kiosks',
    locationCount: 0,
    coverageAreas: ['WV-GRE', 'WV-KAN'],
    displayDurationSeconds: 30,
    rotationSlots: 4,
    integrationStatus: 'pending',
  },
  {
    type: 'digital_billboard',
    name: 'Digital Billboards',
    locationCount: 0,
    coverageAreas: [],
    displayDurationSeconds: 8,
    rotationSlots: 8,
    integrationStatus: 'pending',
  },
];

// ═══════════════════════════════════════════════════════════════════
// CAMERA/IOT NETWORK CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export interface CameraIoTPartner {
  type: CameraIoTType;
  name: string;
  partnerApi: string;
  supportsGeofenceAlert: boolean;
  supportsImageMatch: boolean;
  privacyCompliant: boolean;
  integrationStatus: 'active' | 'pending' | 'pilot' | 'inactive';
}

export const CAMERA_IOT_PARTNERS: CameraIoTPartner[] = [
  {
    type: 'ring_doorbell',
    name: 'Ring Neighbors',
    partnerApi: 'ring_neighbors_api',
    supportsGeofenceAlert: true,
    supportsImageMatch: false, // Future
    privacyCompliant: true,
    integrationStatus: 'pending',
  },
  {
    type: 'community_camera',
    name: 'Community Security Cameras',
    partnerApi: 'community_cam_api',
    supportsGeofenceAlert: true,
    supportsImageMatch: true,
    privacyCompliant: true,
    integrationStatus: 'pilot',
  },
];

// ═══════════════════════════════════════════════════════════════════
// CHANNEL ELIGIBILITY CHECK
// ═══════════════════════════════════════════════════════════════════

export interface ChannelEligibility {
  channelId: ChannelId;
  eligible: boolean;
  reason: string;
  blockers: string[];
}

/**
 * Check if a case is eligible for a specific channel
 */
export function checkChannelEligibility(params: {
  channelId: ChannelId;
  tier: AlertTier;
  hasConsent: boolean;
  isVerified: boolean;
  hasHumanReview: boolean;
  hasPartnerContract: boolean;
  alertsToday: number;
}): ChannelEligibility {
  const config = CHANNEL_CONFIGS[params.channelId];
  const blockers: string[] = [];

  // Check tier
  const tierOrder: AlertTier[] = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'];
  if (tierOrder.indexOf(params.tier) < tierOrder.indexOf(config.minTier)) {
    blockers.push(`Requires tier ${config.minTier} or higher`);
  }

  // Check consent
  if (config.requiresConsent && !params.hasConsent) {
    blockers.push('User consent required');
  }

  // Check verification
  if (config.requiresVerification && !params.isVerified) {
    blockers.push('Case verification required');
  }

  // Check human review
  if (config.requiresHumanReview && !params.hasHumanReview) {
    blockers.push('Human review required');
  }

  // Check partner contract
  if (config.requiresPartnerContract && !params.hasPartnerContract) {
    blockers.push('Partner contract required');
  }

  // Check rate limit
  if (params.alertsToday >= config.rateLimitPerDay) {
    blockers.push(`Rate limit exceeded (${config.rateLimitPerDay}/day)`);
  }

  return {
    channelId: params.channelId,
    eligible: blockers.length === 0,
    reason: blockers.length === 0 ? 'All requirements met' : blockers[0],
    blockers,
  };
}

/**
 * Get all eligible channels for a case
 */
export function getEligibleChannels(params: {
  tier: AlertTier;
  hasConsent: boolean;
  isVerified: boolean;
  hasHumanReview: boolean;
  partnerContracts: ChannelId[];
  alertCountByChannel: Record<ChannelId, number>;
}): ChannelEligibility[] {
  const channelIds: ChannelId[] = Object.keys(CHANNEL_CONFIGS) as ChannelId[];

  return channelIds.map(channelId =>
    checkChannelEligibility({
      channelId,
      tier: params.tier,
      hasConsent: params.hasConsent,
      isVerified: params.isVerified,
      hasHumanReview: params.hasHumanReview,
      hasPartnerContract: params.partnerContracts.includes(channelId),
      alertsToday: params.alertCountByChannel[channelId] || 0,
    })
  );
}
