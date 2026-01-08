/**
 * Tests for County Pack Cache
 * Per OFFLINE_PROTOCOL.md: Caching, versioning, expiry
 */
import 'fake-indexeddb/auto';
import {
  getCachedCountyPack,
  saveCountyPack,
  needsRefresh,
  getCachedERVets,
  getCachedAnimalControl,
  getCachedCallScript,
  getActiveACOOverrides,
  getCacheStatus,
  removeCachedCountyPack,
} from '../src/lib/db/county-pack-store';
import { clearAllData } from '../src/lib/db/indexed-db';
import type { EmergencyContact, MunicipalCallScript } from '../src/lib/types';

const mockERVet: EmergencyContact = {
  id: 'vet-greenbrier-1',
  county_pack_id: 'greenbrier-v1',
  contact_type: 'ER_VET',
  name: 'Greenbrier Veterinary Emergency Clinic',
  phone_primary: '+1-304-645-7800',
  phone_secondary: '+1-304-645-7801',
  email: 'emergency@greenbriervet.com',
  address: '300 Maplewood Ave, Lewisburg, WV 24901',
  is_24_hour: true,
  accepts_emergency: true,
  accepts_wildlife: false,
  accepts_livestock: false,
  hours: {
    monday: '24 hours',
    tuesday: '24 hours',
    wednesday: '24 hours',
    thursday: '24 hours',
    friday: '24 hours',
    saturday: '24 hours',
    sunday: '24 hours'
  },
};

const mockACO: EmergencyContact = {
  id: 'aco-greenbrier-1',
  county_pack_id: 'greenbrier-v1',
  contact_type: 'ANIMAL_CONTROL',
  name: 'Greenbrier County Humane Society',
  phone_primary: '+1-304-645-4772',
  phone_secondary: '+1-304-645-6425',
  email: 'greenbrierhumanesociety@gmail.com',
  address: '255 C&O Drive, Lewisburg, WV 24901',
  is_24_hour: false,
  accepts_emergency: true,
  accepts_wildlife: true,
  accepts_livestock: true,
  hours: {
    monday: '11am-4pm',
    tuesday: '11am-4pm',
    wednesday: '11am-4pm',
    thursday: '11am-4pm',
    friday: '11am-4pm',
    saturday: '11am-4pm',
    sunday: 'Closed'
  },
};

const mockCallScript: MunicipalCallScript = {
  version: '1.0',
  greeting: 'Hello, I\'m calling about a lost pet.',
  legal_framing: 'County ordinance indicates officers should respond.',
  case_details: '',
  closing: 'May I have your name and reference number?',
  prohibited_phrases: ['You are required', 'formal complaint'],
  allowed_outcomes: ['OFFICER_DISPATCHED', 'CALLBACK_PROMISED', 'NO_ANSWER'],
};

describe('County Pack Cache', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  describe('Basic Caching', () => {
    test('should save and retrieve county pack', async () => {
      await saveCountyPack(
        'GREENBRIER',
        1,
        [mockERVet, mockACO],
        [],
        { missing_pet: mockCallScript, found_animal: mockCallScript }
      );

      const cached = await getCachedCountyPack('GREENBRIER');

      expect(cached).not.toBeNull();
      expect(cached?.county).toEqual('GREENBRIER');
      expect(cached?.version).toEqual(1);
      expect(cached?.contacts.length).toEqual(2);
    });

    test('should return null for uncached county', async () => {
      const cached = await getCachedCountyPack('KANAWHA');
      expect(cached).toBeNull();
    });

    test('should update existing county pack', async () => {
      await saveCountyPack('GREENBRIER', 1, [mockERVet], [], {
        missing_pet: mockCallScript,
        found_animal: mockCallScript,
      });

      await saveCountyPack('GREENBRIER', 2, [mockERVet, mockACO], [], {
        missing_pet: mockCallScript,
        found_animal: mockCallScript,
      });

      const cached = await getCachedCountyPack('GREENBRIER');

      expect(cached?.version).toEqual(2);
      expect(cached?.contacts.length).toEqual(2);
    });
  });

  describe('Contact Filtering', () => {
    beforeEach(async () => {
      await saveCountyPack(
        'GREENBRIER',
        1,
        [mockERVet, mockACO],
        [],
        { missing_pet: mockCallScript, found_animal: mockCallScript }
      );
    });

    test('getCachedERVets should return only ER vets', async () => {
      const vets = await getCachedERVets('GREENBRIER');

      expect(vets.length).toEqual(1);
      expect(vets[0].contact_type).toEqual('ER_VET');
      expect(vets[0].name).toEqual('Greenbrier Veterinary Emergency Clinic');
    });

    test('getCachedAnimalControl should return only ACO contacts', async () => {
      const acos = await getCachedAnimalControl('GREENBRIER');

      expect(acos.length).toEqual(1);
      expect(acos[0].contact_type).toEqual('ANIMAL_CONTROL');
    });

    test('should return empty array for uncached county', async () => {
      const vets = await getCachedERVets('KANAWHA');
      expect(vets).toEqual([]);
    });
  });

  describe('Call Scripts', () => {
    beforeEach(async () => {
      await saveCountyPack(
        'GREENBRIER',
        1,
        [mockERVet],
        [],
        { missing_pet: mockCallScript, found_animal: mockCallScript }
      );
    });

    test('should retrieve missing pet call script', async () => {
      const script = await getCachedCallScript('GREENBRIER', 'missing');

      expect(script).not.toBeNull();
      expect(script?.greeting).toContain('lost pet');
    });

    test('should retrieve found animal call script', async () => {
      const script = await getCachedCallScript('GREENBRIER', 'found');

      expect(script).not.toBeNull();
    });

    test('should return null for uncached county', async () => {
      const script = await getCachedCallScript('KANAWHA', 'missing');
      expect(script).toBeNull();
    });
  });

  describe('Cache Status', () => {
    test('needsRefresh should return true for uncached county', async () => {
      const needs = await needsRefresh('GREENBRIER');
      expect(needs).toBe(true);
    });

    test('needsRefresh should return false for fresh cache', async () => {
      await saveCountyPack('GREENBRIER', 1, [mockERVet], [], {
        missing_pet: mockCallScript,
        found_animal: mockCallScript,
      });

      const needs = await needsRefresh('GREENBRIER');
      expect(needs).toBe(false);
    });

    test('getCacheStatus should return status for all cached counties', async () => {
      await saveCountyPack('GREENBRIER', 1, [mockERVet], [], {
        missing_pet: mockCallScript,
        found_animal: mockCallScript,
      });
      await saveCountyPack('KANAWHA', 2, [mockACO], [], {
        missing_pet: mockCallScript,
        found_animal: mockCallScript,
      });

      const status = await getCacheStatus();

      expect(status.length).toEqual(2);
      expect(status.find(s => s.county === 'GREENBRIER')?.version).toEqual(1);
      expect(status.find(s => s.county === 'KANAWHA')?.version).toEqual(2);
    });
  });

  describe('Cache Removal', () => {
    test('removeCachedCountyPack should delete cache', async () => {
      await saveCountyPack('GREENBRIER', 1, [mockERVet], [], {
        missing_pet: mockCallScript,
        found_animal: mockCallScript,
      });

      await removeCachedCountyPack('GREENBRIER');

      const cached = await getCachedCountyPack('GREENBRIER');
      expect(cached).toBeNull();
    });
  });

  describe('ACO Overrides', () => {
    test('getActiveACOOverrides should return current overrides', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      await saveCountyPack(
        'GREENBRIER',
        1,
        [mockERVet],
        [
          {
            id: 'override-1',
            county_pack_id: 'greenbrier-v1',
            override_type: 'HOLIDAY',
            reason: 'Holiday closure',
            alternate_phone: '+1-304-555-9999',
            alternate_name: 'On-Call Officer',
            effective_from: now.toISOString(),
            effective_until: futureDate.toISOString(),
          },
        ],
        { missing_pet: mockCallScript, found_animal: mockCallScript }
      );

      const overrides = await getActiveACOOverrides('GREENBRIER');

      expect(overrides.length).toEqual(1);
      expect(overrides[0].override_type).toEqual('HOLIDAY');
    });

    test('should not return expired overrides', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const evenPaster = new Date(Date.now() - 48 * 60 * 60 * 1000);
      
      await saveCountyPack(
        'GREENBRIER',
        1,
        [mockERVet],
        [
          {
            id: 'override-1',
            county_pack_id: 'greenbrier-v1',
            override_type: 'HOLIDAY',
            reason: 'Past holiday',
            alternate_phone: null,
            alternate_name: null,
            effective_from: evenPaster.toISOString(),
            effective_until: pastDate.toISOString(),
          },
        ],
        { missing_pet: mockCallScript, found_animal: mockCallScript }
      );

      const overrides = await getActiveACOOverrides('GREENBRIER');

      expect(overrides.length).toEqual(0);
    });
  });

  describe('Versioning', () => {
    test('should track version number', async () => {
      await saveCountyPack('GREENBRIER', 5, [mockERVet], [], {
        missing_pet: mockCallScript,
        found_animal: mockCallScript,
      });

      const cached = await getCachedCountyPack('GREENBRIER');

      expect(cached?.version).toEqual(5);
    });

    test('version should update on refresh', async () => {
      await saveCountyPack('GREENBRIER', 1, [mockERVet], [], {
        missing_pet: mockCallScript,
        found_animal: mockCallScript,
      });

      await saveCountyPack('GREENBRIER', 2, [mockERVet], [], {
        missing_pet: mockCallScript,
        found_animal: mockCallScript,
      });

      const cached = await getCachedCountyPack('GREENBRIER');

      expect(cached?.version).toEqual(2);
    });
  });
});
