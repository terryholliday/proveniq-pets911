/**
 * Volunteer/Emergency Helper Types
 * Supports foster network, transport volunteers, and emergency responders
 */

import type { County, Species } from './index';

export type VolunteerCapability = 
  | 'TRANSPORT'
  | 'FOSTER_SHORT_TERM'  // 24-72 hours
  | 'FOSTER_LONG_TERM'   // Weeks/months
  | 'EMERGENCY_RESPONSE'
  | 'VET_TRANSPORT'
  | 'SHELTER_TRANSPORT'
  | 'MODERATOR';

export type VolunteerStatus = 
  | 'ACTIVE'
  | 'INACTIVE'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'SUSPENDED';

export type DispatchStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface VolunteerProfile {
  id: string;
  user_id: string;
  status: VolunteerStatus;
  
  // Contact & Location
  display_name: string;
  phone: string;
  email: string | null;
  primary_county: County;
  address_city: string;
  address_zip: string;
  home_lat: number | null;
  home_lng: number | null;
  
  // Capabilities
  capabilities: VolunteerCapability[];
  max_response_radius_miles: number; // How far they'll travel
  
  // Transport capacity
  has_vehicle: boolean;
  vehicle_type: string | null; // 'sedan', 'suv', 'truck', 'van'
  can_transport_crate: boolean;
  max_animal_size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE' | null;
  
  // Foster capacity
  can_foster_species: Species[];
  max_foster_count: number | null; // How many animals at once
  has_fenced_yard: boolean;
  has_other_pets: boolean;
  other_pets_description: string | null;
  
  // Availability
  available_weekdays: boolean;
  available_weekends: boolean;
  available_nights: boolean; // After 6pm
  available_immediately: boolean; // Can respond within 30 min
  
  // Verification
  background_check_completed: boolean;
  background_check_date: string | null;
  references_verified: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  
  // Stats
  total_dispatches: number;
  completed_dispatches: number;
  declined_dispatches: number;
  average_response_time_minutes: number | null;
  last_active_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface DispatchRequest {
  id: string;
  
  // Request details
  request_type: 'TRANSPORT' | 'FOSTER' | 'EMERGENCY_ASSIST';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Animal details
  species: Species;
  animal_size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
  animal_condition: string | null;
  needs_crate: boolean;
  
  // Location
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  dropoff_address: string | null;
  county: County;
  
  // Requester (finder)
  requester_id: string;
  requester_name: string;
  requester_phone: string;
  
  // Assignment
  volunteer_id: string | null;
  volunteer_name: string | null;
  volunteer_phone: string | null;
  status: DispatchStatus;
  
  // Timing
  requested_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  expires_at: string; // Auto-cancel if not accepted
  
  // Outcome
  outcome_notes: string | null;
  distance_miles: number | null;
  duration_minutes: number | null;
  
  created_at: string;
  updated_at: string;
}

export interface VolunteerMatch {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_phone: string;
  distance_miles: number;
  estimated_arrival_minutes: number;
  capabilities: VolunteerCapability[];
  match_score: number; // 0-100, based on distance, availability, capacity
  is_available_now: boolean;
  last_dispatch_at: string | null;
}

export interface DispatchNotification {
  id: string;
  dispatch_request_id: string;
  volunteer_id: string;
  notification_type: 'SMS' | 'PUSH' | 'EMAIL';
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  response_at: string | null;
  response_action: 'ACCEPTED' | 'DECLINED' | null;
}
