/**
 * Complex Incident Case Types
 * Supports: Litters, Seizures, Hoarding, Technical Rescues,
 * Capacity Crisis, Hotspots, Transport Relays
 */

import type { County } from './index';

// ===================
// CASE TYPES
// ===================

export type CaseType =
  | 'STRAY_SINGLE'      // Normal single animal
  | 'STRAY_LITTER'      // Group found together (14 puppies)
  | 'ABANDONMENT'       // Intentional dump
  | 'SEIZURE'           // Legal seizure (Sissonville)
  | 'HOARDING'          // Hoarding situation
  | 'TECHNICAL_RESCUE'  // Trapped/inaccessible
  | 'CRUELTY'           // Abuse/neglect
  | 'SURRENDER'         // Owner surrender
  | 'TRANSPORT_RELAY';  // Multi-leg transport

export type CaseStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING_RESOURCES'
  | 'RESOLVED'
  | 'CLOSED'
  | 'LEGAL_HOLD';

export type ExpandedSpecies =
  | 'DOG'
  | 'CAT'
  | 'RABBIT'
  | 'BIRD'
  | 'REPTILE'
  | 'SMALL_MAMMAL'  // hamster, guinea pig, etc.
  | 'LIVESTOCK'     // donkey, llama, goat, pig
  | 'EXOTIC'        // wallaby, etc.
  | 'OTHER';

export type AnimalCondition =
  | 'HEALTHY'
  | 'MINOR_INJURY'
  | 'INJURED'
  | 'CRITICAL'
  | 'MALNOURISHED'
  | 'SCARED_SELF_HARMING'
  | 'DECEASED'
  | 'UNKNOWN';

export type AnimalDisposition =
  | 'PENDING'
  | 'SHELTER_INTAKE'
  | 'FOSTER_PLACEMENT'
  | 'RESCUE_TRANSFER'
  | 'SANCTUARY'          // For exotics like wallabies
  | 'SPECIALIST_CARE'    // Exotic vet, wildlife rehab
  | 'RETURNED_TO_OWNER'
  | 'COMMUNITY_CAT'      // TNR'd and released
  | 'EUTHANIZED'
  | 'DECEASED_ON_ARRIVAL';

export type EquipmentType =
  | 'LADDER'
  | 'EXTENSION_LADDER'
  | 'LIVE_TRAP_SMALL'
  | 'LIVE_TRAP_LARGE'
  | 'CATCH_POLE'
  | 'NET'
  | 'CRATE_SMALL'
  | 'CRATE_MEDIUM'
  | 'CRATE_LARGE'
  | 'CRATE_XLARGE'
  | 'VEHICLE_TRAILER'
  | 'BOAT'
  | 'KAYAK'
  | 'DRONE'
  | 'THERMAL_CAMERA'
  | 'OTHER';

export type BreederReleaseSign =
  | 'C_SECTION_SCAR'
  | 'MAMMARY_TUMORS'
  | 'MULTIPLE_LITTERS'
  | 'EXCESSIVE_BREEDING'
  | 'POOR_DENTAL'
  | 'MATTED_NEGLECTED';

// ===================
// INTERFACES
// ===================

export interface IncidentCase {
  id: string;
  case_number: string;
  case_type: CaseType;
  status: CaseStatus;
  
  // Location
  location_address?: string;
  location_city?: string;
  location_county: County;
  location_lat?: number;
  location_lng?: number;
  location_notes?: string;
  location_hash?: string;
  
  // Animal counts
  total_animals: number;
  species_breakdown?: Record<ExpandedSpecies, number>;
  
  // Legal references
  legal_case_number?: string;
  law_enforcement_agency?: string;
  law_enforcement_contact?: string;
  
  // Flags
  requires_equipment: boolean;
  equipment_needed?: EquipmentType[];
  is_multi_species: boolean;
  is_capacity_crisis: boolean;
  shelter_refused_intake: boolean;
  shelter_refusal_reason?: string;
  
  // Reporter
  reporter_id?: string;
  reporter_name?: string;
  reporter_phone?: string;
  reporter_email?: string;
  
  // Timestamps
  reported_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  
  // Nested
  animals?: CaseAnimal[];
  litters?: Litter[];
}

export interface CaseAnimal {
  id: string;
  case_id: string;
  animal_id?: string;
  temp_id?: string;
  
  // Species
  species: ExpandedSpecies;
  species_detail?: string;
  
  // Description
  description?: string;
  breed?: string;
  color?: string;
  size?: 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  age_estimate?: string;
  weight_lbs?: number;
  
  // Condition
  condition: AnimalCondition;
  condition_notes?: string;
  requires_immediate_medical: boolean;
  
  // Litter/Group
  is_litter_member: boolean;
  litter_id?: string;
  
  // Breeder flags
  suspected_breeder_release: boolean;
  breeder_release_signs?: BreederReleaseSign[];
  
  // ID
  microchip_id?: string;
  microchip_scanned: boolean;
  has_collar: boolean;
  collar_description?: string;
  
  // Disposition
  disposition?: AnimalDisposition;
  disposition_org_id?: string;
  disposition_notes?: string;
  
  // Photos
  photo_urls?: string[];
  is_group_photo: boolean;
  
  // Timestamps
  intake_at?: string;
  disposition_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Litter {
  id: string;
  case_id: string;
  count: number;
  species: ExpandedSpecies;
  description?: string;
  group_photo_url?: string;
  processed: boolean;
  processed_at?: string;
  processed_by?: string;
  created_at: string;
}

export interface AbandonmentHotspot {
  id: string;
  location_hash: string;
  location_lat: number;
  location_lng: number;
  location_address?: string;
  location_description?: string;
  county: County;
  incident_count: number;
  first_incident_at: string;
  last_incident_at: string;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransportRelay {
  id: string;
  case_id?: string;
  animal_id?: string;
  
  // Route
  origin_address: string;
  origin_city?: string;
  origin_state?: string;
  origin_lat?: number;
  origin_lng?: number;
  
  destination_address: string;
  destination_city?: string;
  destination_state?: string;
  destination_lat?: number;
  destination_lng?: number;
  
  total_distance_miles?: number;
  
  // Status
  status: 'PLANNING' | 'SEEKING_DRIVERS' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  
  // Timing
  target_date?: string;
  started_at?: string;
  completed_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // Nested
  legs?: TransportRelayLeg[];
}

export interface TransportRelayLeg {
  id: string;
  relay_id: string;
  leg_number: number;
  
  // Segment
  start_address: string;
  start_lat?: number;
  start_lng?: number;
  end_address: string;
  end_lat?: number;
  end_lng?: number;
  distance_miles?: number;
  
  // Driver
  volunteer_id?: string;
  volunteer_name?: string;
  volunteer_phone?: string;
  
  // Status
  status: 'OPEN' | 'CLAIMED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  // Timing
  scheduled_pickup?: string;
  actual_pickup?: string;
  actual_dropoff?: string;
  
  notes?: string;
  created_at: string;
}

export interface VolunteerEquipment {
  id: string;
  volunteer_id: string;
  equipment_type: EquipmentType;
  equipment_detail?: string;
  is_available: boolean;
  created_at: string;
}

// ===================
// FORM TYPES (for UI)
// ===================

export interface QuickLitterEntry {
  count: number;
  species: ExpandedSpecies;
  description: string;
  photo?: File;
  location: {
    address?: string;
    city?: string;
    county: County;
    lat?: number;
    lng?: number;
    notes?: string;
  };
}

export interface CapacityCrisisOptions {
  case_id: string;
  selected_option: 'FOSTER_APPEAL' | 'RESCUE_PARTNER' | 'COMMUNITY_CAT' | 'TRANSPORT_OUT';
  notes?: string;
}

export interface TechnicalRescueRequest {
  case_id: string;
  equipment_needed: EquipmentType[];
  location_notes: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}
