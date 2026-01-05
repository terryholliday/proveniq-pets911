'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getCachedCountyPack, 
  saveCountyPack, 
  needsRefresh,
  getCachedERVets,
  getCachedAnimalControl,
  getCachedCallScript,
  getActiveACOOverrides
} from '@/lib/db/county-pack-store';
import { fetchEmergencyContacts, fetchCallScript } from '@/lib/api/client';
import type { 
  County, 
  CachedCountyPack, 
  EmergencyContact,
  ACOAvailabilityOverride,
  MunicipalCallScript 
} from '@/lib/types';

interface UseCountyPackResult {
  pack: CachedCountyPack | null;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  erVets: EmergencyContact[];
  animalControl: EmergencyContact[];
  acoOverrides: ACOAvailabilityOverride[];
}

/**
 * Hook to manage county pack data with offline-first caching
 * Per OFFLINE_PROTOCOL.md: County packs cached locally
 */
export function useCountyPack(county: County | null): UseCountyPackResult {
  const [pack, setPack] = useState<CachedCountyPack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erVets, setErVets] = useState<EmergencyContact[]>([]);
  const [animalControl, setAnimalControl] = useState<EmergencyContact[]>([]);
  const [acoOverrides, setAcoOverrides] = useState<ACOAvailabilityOverride[]>([]);

  // Load from cache first
  useEffect(() => {
    if (!county) {
      setPack(null);
      setIsLoading(false);
      return;
    }

    const loadFromCache = async () => {
      try {
        const cached = await getCachedCountyPack(county);
        if (cached) {
          setPack(cached);
          setIsStale((cached as CachedCountyPack & { _stale?: boolean })._stale || false);
          
          // Load derived data
          setErVets(await getCachedERVets(county));
          setAnimalControl(await getCachedAnimalControl(county));
          setAcoOverrides(await getActiveACOOverrides(county));
        }
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cache');
        setIsLoading(false);
      }
    };

    loadFromCache();
  }, [county]);

  // Background refresh if stale
  useEffect(() => {
    if (!county || typeof navigator === 'undefined' || !navigator.onLine) {
      return;
    }

    const checkAndRefresh = async () => {
      const shouldRefresh = await needsRefresh(county);
      if (shouldRefresh) {
        refresh();
      }
    };

    checkAndRefresh();
  }, [county]);

  // Refresh from server
  const refresh = useCallback(async () => {
    if (!county) return;
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      setError('Cannot refresh while offline');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch emergency contacts
      const contactsResponse = await fetchEmergencyContacts(county);
      if (!contactsResponse.success || !contactsResponse.data) {
        throw new Error(contactsResponse.error?.message || 'Failed to fetch contacts');
      }

      // Fetch call scripts
      const [missingScript, foundScript] = await Promise.all([
        fetchCallScript(county, undefined, 'missing'),
        fetchCallScript(county, undefined, 'found'),
      ]);

      // Save to cache
      await saveCountyPack(
        county,
        pack?.version ? pack.version + 1 : 1,
        contactsResponse.data.contacts,
        [], // ACO overrides would come from a separate endpoint
        {
          missing_pet: missingScript.data?.script || getDefaultScript('missing'),
          found_animal: foundScript.data?.script || getDefaultScript('found'),
        }
      );

      // Reload from cache
      const refreshed = await getCachedCountyPack(county);
      if (refreshed) {
        setPack(refreshed);
        setIsStale(false);
        setErVets(await getCachedERVets(county));
        setAnimalControl(await getCachedAnimalControl(county));
        setAcoOverrides(await getActiveACOOverrides(county));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [county, pack?.version]);

  return {
    pack,
    isLoading,
    isStale,
    error,
    refresh,
    erVets,
    animalControl,
    acoOverrides,
  };
}

/**
 * Get default call script if API unavailable
 */
function getDefaultScript(type: 'missing' | 'found'): MunicipalCallScript {
  if (type === 'missing') {
    return {
      version: '1.0',
      greeting: 'Hello, I\'m calling to request assistance with a missing pet.',
      legal_framing: 'County ordinance indicates officers should respond; I\'m requesting assistance.',
      case_details: '', // Will be filled in by UI
      closing: 'May I have your name and a reference number for this call? Thank you for your assistance.',
      prohibited_phrases: [
        'You are required to respond',
        'I\'m filing a formal complaint',
        'This is being recorded for public record',
      ],
      allowed_outcomes: [
        'OFFICER_DISPATCHED',
        'CALLBACK_PROMISED',
        'NO_ANSWER',
        'REFERRED_ELSEWHERE',
        'DECLINED',
        'UNKNOWN',
      ],
    };
  }

  return {
    version: '1.0',
    greeting: 'Hello, I\'m calling to report a found animal that may need assistance.',
    legal_framing: 'I\'m requesting guidance on proper procedure for this situation.',
    case_details: '',
    closing: 'May I have your name and a reference number for this call? Thank you for your assistance.',
    prohibited_phrases: [
      'You are required to respond',
      'I\'m filing a formal complaint',
      'This is being recorded for public record',
    ],
    allowed_outcomes: [
      'OFFICER_DISPATCHED',
      'CALLBACK_PROMISED',
      'NO_ANSWER',
      'REFERRED_ELSEWHERE',
      'DECLINED',
      'UNKNOWN',
    ],
  };
}

/**
 * Hook to get selected county from localStorage
 */
export function useSelectedCounty(): [County | null, (county: County) => void] {
  const [county, setCountyState] = useState<County | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('proveniq_selected_county');
    if (stored === 'GREENBRIER' || stored === 'KANAWHA') {
      setCountyState(stored);
    }
  }, []);

  const setCounty = useCallback((newCounty: County) => {
    setCountyState(newCounty);
    if (typeof window !== 'undefined') {
      localStorage.setItem('proveniq_selected_county', newCounty);
    }
  }, []);

  return [county, setCounty];
}
