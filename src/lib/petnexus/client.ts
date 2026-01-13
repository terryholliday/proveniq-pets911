/**
 * PetNexus Ecosystem API Client
 * 
 * Provides cross-system sync between Pet911 and the PetNexus ecosystem:
 * - VetOS: System of Record for clinics
 * - LifeLog: Immutable biological event log
 * - Teleport: Interoperability and data portability
 * - Pet360: Holistic pet management
 */

export interface PetNexusConfig {
  baseUrl: string;
  apiKey: string;
  clientId: string;
  environment: 'development' | 'staging' | 'production';
}

export interface LifeLogEvent {
  event_type: string;
  pet_id?: string;
  case_id?: string;
  timestamp: string;
  source: 'pet911';
  data: Record<string, any>;
  provenance: {
    actor_id: string;
    actor_type: 'volunteer' | 'moderator' | 'system';
    action: string;
    location?: { county: string; lat?: number; lng?: number };
  };
}

export interface TeleportTransfer {
  source_system: string;
  target_system: string;
  transfer_type: 'animal' | 'case' | 'volunteer' | 'outcome';
  payload: Record<string, any>;
  metadata: {
    initiated_by: string;
    reason: string;
    timestamp: string;
  };
}

export interface VetOSAnimalRecord {
  pet_id: string;
  species: string;
  breed?: string;
  name?: string;
  microchip_id?: string;
  intake_date: string;
  intake_type: 'stray' | 'surrender' | 'transfer' | 'return';
  status: 'intake' | 'medical_hold' | 'available' | 'adopted' | 'transferred' | 'deceased';
  location: {
    facility_id?: string;
    foster_id?: string;
    county: string;
  };
  medical: {
    vaccinations: string[];
    spay_neuter: boolean;
    conditions: string[];
  };
}

export interface Pet360Profile {
  pet_id: string;
  owner_id?: string;
  species: string;
  name: string;
  status: 'lost' | 'found' | 'reunited' | 'adopted' | 'fostered';
  last_seen?: {
    timestamp: string;
    location: string;
    county: string;
    lat?: number;
    lng?: number;
  };
  photos: string[];
  microchip_id?: string;
}

class PetNexusClient {
  private config: PetNexusConfig;
  private initialized: boolean = false;

  constructor() {
    this.config = {
      baseUrl: process.env.PETNEXUS_API_URL || 'https://api.petnexus.io',
      apiKey: process.env.PETNEXUS_API_KEY || '',
      clientId: process.env.PETNEXUS_CLIENT_ID || 'pet911-wv',
      environment: (process.env.PETNEXUS_ENV as PetNexusConfig['environment']) || 'development',
    };
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: Record<string, any>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    if (!this.config.apiKey) {
      console.warn('[PetNexus] API key not configured - running in mock mode');
      return { success: true, data: undefined };
    }

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-Client-ID': this.config.clientId,
          'X-Environment': this.config.environment,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[PetNexus] API error: ${response.status} - ${error}`);
        return { success: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('[PetNexus] Request failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // ============================================================
  // LIFELOG - Immutable Event Logging
  // ============================================================

  async logEvent(event: LifeLogEvent): Promise<{ success: boolean; event_id?: string }> {
    console.log('[LifeLog] Recording event:', event.event_type);
    
    const result = await this.request<{ event_id: string }>('/lifelog/events', 'POST', {
      ...event,
      source: 'pet911',
      timestamp: event.timestamp || new Date().toISOString(),
    });

    if (result.success) {
      console.log('[LifeLog] Event recorded:', result.data?.event_id);
    }

    return { success: result.success, event_id: result.data?.event_id };
  }

  async logRescue(data: {
    case_id: string;
    pet_id?: string;
    volunteer_id: string;
    county: string;
    outcome: 'rescued' | 'transported' | 'fostered' | 'reunited' | 'shelter_intake';
    notes?: string;
  }): Promise<{ success: boolean }> {
    return this.logEvent({
      event_type: 'RESCUE_COMPLETED',
      case_id: data.case_id,
      pet_id: data.pet_id,
      timestamp: new Date().toISOString(),
      source: 'pet911',
      data: {
        outcome: data.outcome,
        notes: data.notes,
      },
      provenance: {
        actor_id: data.volunteer_id,
        actor_type: 'volunteer',
        action: 'rescue_complete',
        location: { county: data.county },
      },
    });
  }

  async logReunification(data: {
    case_id: string;
    pet_id: string;
    owner_id?: string;
    volunteer_id: string;
    county: string;
    method: 'microchip' | 'collar_tag' | 'social_media' | 'flyer' | 'owner_search' | 'other';
    time_to_reunite_hours?: number;
  }): Promise<{ success: boolean }> {
    return this.logEvent({
      event_type: 'PET_REUNIFIED',
      case_id: data.case_id,
      pet_id: data.pet_id,
      timestamp: new Date().toISOString(),
      source: 'pet911',
      data: {
        owner_id: data.owner_id,
        method: data.method,
        time_to_reunite_hours: data.time_to_reunite_hours,
      },
      provenance: {
        actor_id: data.volunteer_id,
        actor_type: 'volunteer',
        action: 'reunification',
        location: { county: data.county },
      },
    });
  }

  // ============================================================
  // TELEPORT - Data Transfer Between Systems
  // ============================================================

  async transferAnimalToVetOS(data: {
    case_id: string;
    animal_data: Partial<VetOSAnimalRecord>;
    destination_facility_id: string;
    volunteer_id: string;
    reason: string;
  }): Promise<{ success: boolean; vetos_id?: string }> {
    console.log('[Teleport] Transferring animal to VetOS');

    const transfer: TeleportTransfer = {
      source_system: 'pet911',
      target_system: 'vetos',
      transfer_type: 'animal',
      payload: {
        ...data.animal_data,
        intake_type: 'stray',
        status: 'intake',
        location: {
          facility_id: data.destination_facility_id,
          county: data.animal_data.location?.county,
        },
      },
      metadata: {
        initiated_by: data.volunteer_id,
        reason: data.reason,
        timestamp: new Date().toISOString(),
      },
    };

    const result = await this.request<{ transfer_id: string; vetos_id: string }>(
      '/teleport/transfer',
      'POST',
      transfer
    );

    // Also log to LifeLog
    if (result.success) {
      await this.logEvent({
        event_type: 'SHELTER_INTAKE',
        case_id: data.case_id,
        pet_id: result.data?.vetos_id,
        timestamp: new Date().toISOString(),
        source: 'pet911',
        data: {
          facility_id: data.destination_facility_id,
          transfer_id: result.data?.transfer_id,
        },
        provenance: {
          actor_id: data.volunteer_id,
          actor_type: 'volunteer',
          action: 'shelter_intake',
          location: { county: data.animal_data.location?.county || '' },
        },
      });
    }

    return { success: result.success, vetos_id: result.data?.vetos_id };
  }

  async syncCaseOutcome(data: {
    case_id: string;
    outcome_type: 'reunited' | 'adopted' | 'fostered' | 'transferred' | 'deceased' | 'closed';
    pet_id?: string;
    notes?: string;
    volunteer_id: string;
    county: string;
  }): Promise<{ success: boolean }> {
    console.log('[Teleport] Syncing case outcome');

    // Update Pet360 if pet_id exists
    if (data.pet_id) {
      await this.request('/pet360/pets/' + data.pet_id, 'PATCH', {
        status: data.outcome_type === 'reunited' ? 'reunited' : 
                data.outcome_type === 'adopted' ? 'adopted' :
                data.outcome_type === 'fostered' ? 'fostered' : 'found',
      });
    }

    // Log to LifeLog
    await this.logEvent({
      event_type: 'CASE_CLOSED',
      case_id: data.case_id,
      pet_id: data.pet_id,
      timestamp: new Date().toISOString(),
      source: 'pet911',
      data: {
        outcome_type: data.outcome_type,
        notes: data.notes,
      },
      provenance: {
        actor_id: data.volunteer_id,
        actor_type: data.volunteer_id === 'system' ? 'system' : 'volunteer',
        action: 'case_closed',
        location: { county: data.county },
      },
    });

    return { success: true };
  }

  // ============================================================
  // VETOS - Clinic/Shelter Integration
  // ============================================================

  async getPartnerFacilities(county?: string): Promise<{ 
    success: boolean; 
    facilities?: Array<{ id: string; name: string; type: string; county: string; capacity?: number }> 
  }> {
    const endpoint = county 
      ? `/vetos/facilities?county=${encodeURIComponent(county)}&partner=true`
      : '/vetos/facilities?partner=true';
    
    return this.request(endpoint);
  }

  async checkFacilityCapacity(facilityId: string): Promise<{
    success: boolean;
    capacity?: { total: number; available: number; waitlist: number };
  }> {
    return this.request(`/vetos/facilities/${facilityId}/capacity`);
  }

  // ============================================================
  // PET360 - Lost/Found Pet Integration
  // ============================================================

  async reportFoundPet(data: {
    species: string;
    description: string;
    county: string;
    lat?: number;
    lng?: number;
    photos?: string[];
    finder_id: string;
    case_id: string;
  }): Promise<{ success: boolean; pet360_id?: string }> {
    const result = await this.request<{ pet_id: string }>('/pet360/found', 'POST', {
      species: data.species,
      status: 'found',
      last_seen: {
        timestamp: new Date().toISOString(),
        location: data.description,
        county: data.county,
        lat: data.lat,
        lng: data.lng,
      },
      photos: data.photos || [],
      source: 'pet911',
      case_reference: data.case_id,
    });

    return { success: result.success, pet360_id: result.data?.pet_id };
  }

  async searchLostPets(criteria: {
    species?: string;
    county?: string;
    radius_miles?: number;
    lat?: number;
    lng?: number;
  }): Promise<{ success: boolean; matches?: Pet360Profile[] }> {
    const params = new URLSearchParams();
    if (criteria.species) params.set('species', criteria.species);
    if (criteria.county) params.set('county', criteria.county);
    if (criteria.radius_miles) params.set('radius', criteria.radius_miles.toString());
    if (criteria.lat) params.set('lat', criteria.lat.toString());
    if (criteria.lng) params.set('lng', criteria.lng.toString());

    return this.request(`/pet360/lost?${params.toString()}`);
  }

  // ============================================================
  // METRICS - Impact Tracking
  // ============================================================

  async recordOutcome(data: {
    outcome_type: 'life_saved' | 'reunification' | 'adoption' | 'foster_placement' | 'transport_completed';
    case_id: string;
    pet_id?: string;
    volunteer_id: string;
    county: string;
    metrics?: {
      response_time_minutes?: number;
      distance_miles?: number;
      cost_avoided?: number;
    };
  }): Promise<{ success: boolean }> {
    // Record to LifeLog for immutable tracking
    await this.logEvent({
      event_type: `OUTCOME_${data.outcome_type.toUpperCase()}`,
      case_id: data.case_id,
      pet_id: data.pet_id,
      timestamp: new Date().toISOString(),
      source: 'pet911',
      data: {
        metrics: data.metrics,
      },
      provenance: {
        actor_id: data.volunteer_id,
        actor_type: 'volunteer',
        action: data.outcome_type,
        location: { county: data.county },
      },
    });

    // Also post to metrics aggregation endpoint
    await this.request('/metrics/outcomes', 'POST', {
      source: 'pet911',
      outcome_type: data.outcome_type,
      case_id: data.case_id,
      county: data.county,
      timestamp: new Date().toISOString(),
      metrics: data.metrics,
    });

    return { success: true };
  }

  async getImpactMetrics(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    success: boolean;
    metrics?: {
      lives_saved: number;
      reunifications: number;
      adoptions: number;
      foster_placements: number;
      transports_completed: number;
      volunteer_hours: number;
      response_time_avg_minutes: number;
    };
  }> {
    return this.request(`/metrics/impact?period=${period}&source=pet911`);
  }
}

// Singleton instance
export const petnexus = new PetNexusClient();

// Convenience exports
export const lifelog = {
  logEvent: petnexus.logEvent.bind(petnexus),
  logRescue: petnexus.logRescue.bind(petnexus),
  logReunification: petnexus.logReunification.bind(petnexus),
};

export const teleport = {
  transferAnimalToVetOS: petnexus.transferAnimalToVetOS.bind(petnexus),
  syncCaseOutcome: petnexus.syncCaseOutcome.bind(petnexus),
};

export const vetos = {
  getPartnerFacilities: petnexus.getPartnerFacilities.bind(petnexus),
  checkFacilityCapacity: petnexus.checkFacilityCapacity.bind(petnexus),
};

export const pet360 = {
  reportFoundPet: petnexus.reportFoundPet.bind(petnexus),
  searchLostPets: petnexus.searchLostPets.bind(petnexus),
};

export const metrics = {
  recordOutcome: petnexus.recordOutcome.bind(petnexus),
  getImpactMetrics: petnexus.getImpactMetrics.bind(petnexus),
};
