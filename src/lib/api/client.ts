import type { 
  ApiResponse, 
  CountyPack, 
  EmergencyContact,
  MunicipalCallScript,
  MatchSuggestion,
  MunicipalOutcome,
  County,
  OfflineQueuedAction,
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

/**
 * Get auth token from Firebase (stub - implement with Firebase Auth)
 */
async function getAuthToken(): Promise<string | null> {
  // TODO: Implement Firebase Auth token retrieval
  // const user = auth.currentUser;
  // return user ? await user.getIdToken() : null;
  return null;
}

/**
 * Make API request with standard headers and error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  idempotencyKey?: string
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = await getAuthToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (idempotencyKey) {
    (headers as Record<string, string>)['Idempotency-Key'] = idempotencyKey;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
      meta: data.meta || {
        request_id: 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }

  return data;
}

// ============================================================
// COUNTY PACK ENDPOINTS
// ============================================================

export async function fetchCountyPacks(): Promise<ApiResponse<{ county_packs: CountyPack[] }>> {
  return apiRequest('/county-packs');
}

export async function fetchEmergencyContacts(
  county: County,
  options?: { type?: string; accepts_emergency?: boolean }
): Promise<ApiResponse<{ contacts: EmergencyContact[] }>> {
  const params = new URLSearchParams();
  if (options?.type) params.set('type', options.type);
  if (options?.accepts_emergency !== undefined) {
    params.set('accepts_emergency', String(options.accepts_emergency));
  }
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/county-packs/${county}/emergency-contacts${query}`);
}

// ============================================================
// MUNICIPAL ENDPOINTS
// ============================================================

export async function fetchCallScript(
  county: County,
  caseId?: string,
  caseType?: 'missing' | 'found'
): Promise<ApiResponse<{
  agency: { name: string; phone: string; availability_note: string };
  script: MunicipalCallScript;
  override?: { active: boolean; type: string; alternate_phone?: string; message?: string };
}>> {
  const params = new URLSearchParams({ county });
  if (caseId) params.set('case_id', caseId);
  if (caseType) params.set('case_type', caseType);
  
  return apiRequest(`/municipal/call-script?${params.toString()}`);
}

export async function logMunicipalCall(
  data: {
    case_id?: string;
    case_type: 'missing' | 'found';
    contact_id: string;
    dialer_initiated_at: string;
    call_duration_seconds?: number;
    outcome: MunicipalOutcome;
    outcome_notes?: string;
    county: County;
  },
  idempotencyKey: string
): Promise<ApiResponse<{ log_id: string }>> {
  return apiRequest(
    '/municipal/call-log',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    idempotencyKey
  );
}

// ============================================================
// EMERGENCY VET NOTIFICATION
// ============================================================

export async function notifyEmergencyVet(
  data: {
    contact_id: string;
    case_id?: string;
    case_type?: 'missing' | 'found';
    emergency_summary: string;
    callback_number: string;
  },
  idempotencyKey: string
): Promise<ApiResponse<{
  attempt_id: string;
  contact: { id: string; name: string; phone: string };
  channels: {
    email?: { status: string; estimated_delivery?: string };
    voice?: { status: string; estimated_call_time?: string };
  };
}>> {
  return apiRequest(
    '/notifications/emergency-vet',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    idempotencyKey
  );
}

// ============================================================
// MODERATOR ENDPOINTS
// ============================================================

export async function fetchMatchSuggestions(
  county?: County,
  minConfidence?: number
): Promise<ApiResponse<{ suggestions: MatchSuggestion[]; count: number }>> {
  const params = new URLSearchParams();
  if (county) params.set('county', county);
  if (minConfidence !== undefined) params.set('min_confidence', String(minConfidence));
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/moderator/match-suggestions${query}`);
}

export async function resolveMatchSuggestion(
  matchId: string,
  resolution: 'CONFIRMED' | 'REJECTED',
  notes?: string,
  idempotencyKey?: string
): Promise<ApiResponse<{
  match_id: string;
  resolution: string;
  resolved_at: string;
}>> {
  return apiRequest(
    `/moderator/match-suggestions/${matchId}/resolve`,
    {
      method: 'POST',
      body: JSON.stringify({ resolution, notes }),
    },
    idempotencyKey
  );
}

export async function recordModeratorAction(
  data: {
    action_type: string;
    case_id?: string;
    case_type?: 'missing' | 'found';
    notes?: string;
    target_user_id?: string;
    consent_method?: string;
  },
  idempotencyKey: string
): Promise<ApiResponse<{ action_id: string }>> {
  return apiRequest(
    '/moderator/actions',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    idempotencyKey
  );
}

// ============================================================
// SYNC ENDPOINTS
// ============================================================

export async function syncQueuedActions(
  deviceId: string,
  actions: Array<{
    idempotency_key: string;
    action_type: string;
    payload: Record<string, unknown>;
    created_at: string;
  }>
): Promise<ApiResponse<{
  results: Array<{
    idempotency_key: string;
    status: 'SYNCED' | 'FAILED' | 'CONFLICT';
    resolved_entity_id?: string;
    error?: string;
  }>;
  synced_count: number;
  failed_count: number;
  conflict_count: number;
}>> {
  return apiRequest('/sync/queue', {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, actions }),
  });
}

// ============================================================
// HELPER: Map action type to endpoint
// ============================================================

export function getEndpointForAction(actionType: OfflineQueuedAction['action_type']): string {
  switch (actionType) {
    case 'CREATE_MISSING_CASE':
      return '/cases/missing';
    case 'CREATE_FOUND_CASE':
      return '/cases/found';
    case 'CREATE_SIGHTING':
      return '/sightings';
    case 'LOG_MUNICIPAL_CALL':
      return '/municipal/call-log';
    case 'REQUEST_ER_VET_NOTIFY':
      return '/notifications/emergency-vet';
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}
