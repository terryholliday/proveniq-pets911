// ============================================================
// PROVENIQ PETS (WV) — TYPE DEFINITIONS
// Authoritative Reference: DATA_MODEL.md, API_CONTRACTS.md
// ============================================================

// --- Enumerations ---

export type County = 'GREENBRIER' | 'KANAWHA';

export type Species =
  | 'DOG'
  | 'CAT'
  | 'BIRD'
  | 'RABBIT'
  | 'REPTILE'
  | 'SMALL_MAMMAL'
  | 'LIVESTOCK'
  | 'OTHER';

export type CaseStatus =
  | 'ACTIVE'
  | 'PENDING_VERIFY'
  | 'MATCHED'
  | 'CLOSED_REUNITED'
  | 'CLOSED_ADOPTED'
  | 'CLOSED_DECEASED'
  | 'CLOSED_EXPIRED'
  | 'CLOSED_DUPLICATE'
  | 'LOCKED'
  | 'ESCALATED_TO_SHELTER';

export type ContactType =
  | 'ER_VET'
  | 'SHELTER'
  | 'ANIMAL_CONTROL'
  | 'DISPATCH'
  | 'RESCUE_ORG'
  | 'OTHER';

export type NotificationStatus =
  | 'QUEUED'
  | 'ATTEMPTED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'EXPIRED';

export type ModeratorActionType =
  | 'LOCK_CASE'
  | 'UNLOCK_CASE'
  | 'ESCALATE_TO_SHELTER'
  | 'CONFIRM_MATCH'
  | 'REJECT_MATCH'
  | 'RELEASE_CONTACT'
  | 'MERGE_CASES'
  | 'ADD_NOTE'
  | 'FLAG_ABUSE'
  | 'CLOSE_CASE';

export type MunicipalOutcome =
  | 'OFFICER_DISPATCHED'
  | 'CALLBACK_PROMISED'
  | 'NO_ANSWER'
  | 'REFERRED_ELSEWHERE'
  | 'DECLINED'
  | 'UNKNOWN';

export type UserRole =
  | 'PUBLIC_USER'
  | 'OWNER'
  | 'FINDER'
  | 'PIGPIG_MODERATOR'
  | 'SHELTER_MODERATOR'
  | 'SYSTEM_ADMIN';

export type SyncStatus =
  | 'PENDING'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED'
  | 'CONFLICT';

export type NetworkState = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export type ConditionTriage = 'CRITICAL' | 'INJURED_STABLE' | 'HEALTHY' | 'DECEASED';

export type ConfidenceLevel = 'CERTAIN' | 'LIKELY' | 'UNSURE';

export interface PetGoBagProfile {
  id: string;
  pet_name: string;
  species: Species;
  breed: string | null;
  color: string | null;
  microchip_id: string | null;
  microchip_registry: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  vet_address: string | null;
  medications: string | null;
  notes: string | null;
  photo_data_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SightingReportExtended {
  id: string;
  reporter_id?: string;
  reporter_name?: string;
  reporter_phone?: string;
  reporter_email?: string;
  missing_case_id?: string;
  sighting_at: string;
  sighting_lat?: number;
  sighting_lng?: number;
  sighting_address: string;
  description: string;
  direction_heading?: string;
  animal_behavior?: string;
  confidence_level: 'CERTAIN' | 'LIKELY' | 'UNSURE';
  photo_url?: string;
  county: 'GREENBRIER' | 'KANAWHA';
  can_stay_with_animal: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED';
  estimated_arrival?: string;
  rescuer_assigned?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;

  // Joined fields
  species?: Species;
  breed?: string;
  color?: string;
  size?: string;
  condition?: string;

  // Reporter info (joined)
  reporter?: {
    display_name?: string;
    phone?: string;
  };

  // Missing case info (joined)
  missing_case?: {
    id: string;
    pet_name: string;
    species: Species;
    owner?: {
      display_name: string;
    };
  };

  // Notifications for this sighting
  notifications: SightingNotification[];
}

export interface SightingNotification {
  id: string;
  type: 'STATUS_UPDATE' | 'ETA_UPDATE' | 'RESOLVER_ARRIVAL' | 'SAFETY_GUIDE';
  message: string;
  timestamp: string;
  read: boolean;
  sightingId?: string; // Added to link notification to sighting
}

// --- Infrastructure Entities ---

export interface CountyPack {
  id: string;
  county: County;
  display_name: string;
  timezone: string;
  version: number;
  last_updated_at: string;
  bundle_url: string;
  bundle_checksum: string;
  bundle_size_kb: number;
}

export interface EmergencyContact {
  id: string;
  county_pack_id: string;
  contact_type: ContactType;
  name: string;
  phone_primary: string | null;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  is_24_hour: boolean;
  accepts_emergency: boolean;
  accepts_wildlife: boolean;
  accepts_livestock: boolean;
  hours: Record<string, string>;
  availability_override?: {
    type: string;
    reason: string;
    effective_until: string;
    alternate_phone?: string;
  };
}

export interface ACOAvailabilityOverride {
  id: string;
  county_pack_id: string;
  override_type: string;
  reason: string | null;
  alternate_phone: string | null;
  alternate_name: string | null;
  effective_from: string;
  effective_until: string;
}

// --- Case Entities ---

export interface MissingPetCase {
  id: string;
  case_reference: string;
  status: CaseStatus;
  pet_name: string;
  species: Species;
  breed: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  distinguishing_features: string | null;
  weight_lbs: number | null;
  age_years: number | null;
  sex: string | null;
  is_neutered: boolean | null;
  microchip_id: string | null;
  photo_urls: string[];
  last_seen_at: string;
  last_seen_lat: number | null;
  last_seen_lng: number | null;
  last_seen_address: string | null;
  last_seen_area?: string;
  last_seen_notes: string | null;
  county: County;
  owner_id: string;
  assigned_moderator_id: string | null;
  sightings_count?: number;
  created_at: string;
  updated_at: string;
}

export interface FoundAnimalCase {
  id: string;
  case_reference: string;
  status: CaseStatus;
  species: Species;
  breed_guess: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  distinguishing_features: string | null;
  weight_lbs_estimate: number | null;
  age_estimate: string | null;
  sex: string | null;
  has_collar: boolean | null;
  collar_description: string | null;
  microchip_scanned: boolean;
  microchip_id: string | null;
  condition_notes: string | null;
  needs_immediate_vet: boolean;
  photo_urls: string[];
  found_at: string;
  found_lat: number | null;
  found_lng: number | null;
  found_address: string | null;
  found_notes: string | null;
  current_location_type: string | null;
  county: County;
  finder_id: string;
  assigned_moderator_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sighting {
  id: string;
  missing_case_id: string | null;
  sighting_at: string;
  sighting_lat: number | null;
  sighting_lng: number | null;
  sighting_address: string | null;
  sighting_area?: string;
  description: string | null;
  direction_heading: string | null;
  animal_behavior: string | null;
  confidence_level: ConfidenceLevel;
  is_verified: boolean;
  has_photo: boolean;
  photo_url: string | null;
  county: County;
  created_at: string;
}

export interface MatchSuggestion {
  match_id: string;
  confidence_score: number;
  scoring_factors: {
    species_match: boolean;
    breed_similarity: number;
    color_match: number;
    size_match: number;
    location_proximity_km: number;
    time_gap_hours: number;
    distinguishing_features_match: number;
  };
  missing_case: {
    id: string;
    case_reference: string;
    pet_name: string;
    species: Species;
    breed: string | null;
    last_seen_at: string;
    photo_url: string | null;
  };
  found_case: {
    id: string;
    case_reference: string;
    species: Species;
    breed_guess: string | null;
    found_at: string;
    photo_url: string | null;
  };
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  created_at: string;
  ai_advisory: string;
}

// --- Action Entities ---

export interface EmergencyVetNotifyAttempt {
  attempt_id: string;
  contact: {
    id: string;
    name: string;
    phone: string;
  };
  channels: {
    email?: { status: NotificationStatus; estimated_delivery?: string };
    voice?: { status: NotificationStatus; estimated_call_time?: string };
  };
}

export interface MunicipalCallScript {
  version: string;
  greeting: string;
  legal_framing: string;
  case_details: string;
  closing: string;
  prohibited_phrases: string[];
  allowed_outcomes: MunicipalOutcome[];
}

export interface MunicipalInteractionLog {
  log_id: string;
  case_id: string | null;
  case_type: 'missing' | 'found';
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  dialer_initiated_at: string;
  call_duration_seconds: number | null;
  outcome: MunicipalOutcome;
  outcome_notes: string | null;
  county: County;
  created_at: string;
}

// --- Offline Queue ---

export type QueueableAction =
  | 'CREATE_MISSING_CASE'
  | 'CREATE_FOUND_CASE'
  | 'UPDATE_CASE'
  | 'CREATE_SIGHTING'
  | 'LOG_MUNICIPAL_CALL'
  | 'REQUEST_ER_VET_NOTIFY';

export interface OfflineQueuedAction {
  id: string;
  idempotency_key: string;
  action_type: QueueableAction;
  payload: Record<string, unknown>;
  user_id: string;
  device_id: string;
  created_at: string;
  expires_at: string;
  sync_status: SyncStatus;
  sync_attempts: number;
  last_sync_attempt: string | null;
  sync_error: string | null;
  resolved_entity_id: string | null;
  sequence_number?: number;
}

// --- Sighting Intelligence ---

export interface SightingCluster {
  area_name: string;
  sighting_count: number;
  last_sighting_at: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  center_lat?: number;
  center_lng?: number;
}

export interface SightingIntelligence {
  hot_zones: SightingCluster[];
  recency_hours: number;
  total_sightings: number;
  advisory: string;
}

// --- API Response Envelope ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    request_id: string;
    timestamp: string;
    pilot_metric_logged?: boolean;
  };
}

// --- County Pack Cache Metadata ---

export interface CachedCountyPack {
  county: County;
  version: number;
  cached_at: string;
  expires_at: string;
  contacts: EmergencyContact[];
  aco_overrides: ACOAvailabilityOverride[];
  call_scripts: {
    missing_pet: MunicipalCallScript;
    found_animal: MunicipalCallScript;
  };
}

// --- User ---

export interface UserProfile {
  id: string;
  firebase_uid: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  sms_opt_in: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  primary_county: County | null;
}

// --- Volunteer/Helper Network ---
export * from './volunteer';
