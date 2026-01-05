import { getDB } from './indexed-db';
import type { 
  CachedCountyPack, 
  County, 
  EmergencyContact,
  ACOAvailabilityOverride,
  MunicipalCallScript 
} from '@/lib/types';

// Cache TTL values per OFFLINE_PROTOCOL.md
const CACHE_TTL = {
  county_pack: 7 * 24 * 60 * 60 * 1000,      // 7 days
  emergency_contacts: 24 * 60 * 60 * 1000,    // 24 hours
  aco_overrides: 6 * 60 * 60 * 1000,          // 6 hours
};

/**
 * Get cached county pack
 * Returns null if not cached or expired
 */
export async function getCachedCountyPack(
  county: County
): Promise<CachedCountyPack | null> {
  const db = await getDB();
  const cached = await db.get('county-packs', county);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  if (new Date(cached.expires_at) < new Date()) {
    // Return stale data but mark as expired
    // Per OFFLINE_PROTOCOL.md: "Show warning; allow continued use with stale indicator"
    return { ...cached, _stale: true } as CachedCountyPack & { _stale: boolean };
  }
  
  return cached;
}

/**
 * Save county pack to cache
 */
export async function saveCountyPack(
  county: County,
  version: number,
  contacts: EmergencyContact[],
  aco_overrides: ACOAvailabilityOverride[],
  call_scripts: {
    missing_pet: MunicipalCallScript;
    found_animal: MunicipalCallScript;
  }
): Promise<void> {
  const db = await getDB();
  
  const cached: CachedCountyPack = {
    county,
    version,
    cached_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CACHE_TTL.county_pack).toISOString(),
    contacts,
    aco_overrides,
    call_scripts,
  };
  
  await db.put('county-packs', cached);
}

/**
 * Get emergency contacts for county from cache
 * Per OFFLINE_PROTOCOL.md: Emergency contacts cached from CountyPack
 */
export async function getCachedEmergencyContacts(
  county: County,
  options?: {
    type?: string;
    accepts_emergency?: boolean;
  }
): Promise<EmergencyContact[]> {
  const cached = await getCachedCountyPack(county);
  
  if (!cached) {
    return [];
  }
  
  let contacts = cached.contacts;
  
  // Apply filters
  if (options?.type) {
    contacts = contacts.filter(c => c.contact_type === options.type);
  }
  
  if (options?.accepts_emergency !== undefined) {
    contacts = contacts.filter(c => c.accepts_emergency === options.accepts_emergency);
  }
  
  return contacts;
}

/**
 * Get ER vets for county
 */
export async function getCachedERVets(county: County): Promise<EmergencyContact[]> {
  return getCachedEmergencyContacts(county, {
    type: 'ER_VET',
    accepts_emergency: true,
  });
}

/**
 * Get animal control contacts for county
 */
export async function getCachedAnimalControl(county: County): Promise<EmergencyContact[]> {
  return getCachedEmergencyContacts(county, {
    type: 'ANIMAL_CONTROL',
  });
}

/**
 * Get call script from cache
 */
export async function getCachedCallScript(
  county: County,
  caseType: 'missing' | 'found'
): Promise<MunicipalCallScript | null> {
  const cached = await getCachedCountyPack(county);
  
  if (!cached) {
    return null;
  }
  
  return caseType === 'missing' 
    ? cached.call_scripts.missing_pet 
    : cached.call_scripts.found_animal;
}

/**
 * Get current ACO availability overrides
 */
export async function getActiveACOOverrides(
  county: County
): Promise<ACOAvailabilityOverride[]> {
  const cached = await getCachedCountyPack(county);
  
  if (!cached) {
    return [];
  }
  
  const now = new Date();
  
  return cached.aco_overrides.filter(override => {
    const from = new Date(override.effective_from);
    const until = new Date(override.effective_until);
    return from <= now && until >= now;
  });
}

/**
 * Check if county pack needs refresh
 */
export async function needsRefresh(county: County): Promise<boolean> {
  const cached = await getCachedCountyPack(county);
  
  if (!cached) {
    return true;
  }
  
  return new Date(cached.expires_at) < new Date();
}

/**
 * Get cache metadata for all counties
 */
export async function getCacheStatus(): Promise<{
  county: County;
  version: number;
  cached_at: string;
  expires_at: string;
  is_stale: boolean;
}[]> {
  const db = await getDB();
  const all = await db.getAll('county-packs');
  
  return all.map(pack => ({
    county: pack.county,
    version: pack.version,
    cached_at: pack.cached_at,
    expires_at: pack.expires_at,
    is_stale: new Date(pack.expires_at) < new Date(),
  }));
}

/**
 * Remove cached county pack
 */
export async function removeCachedCountyPack(county: County): Promise<void> {
  const db = await getDB();
  await db.delete('county-packs', county);
}
