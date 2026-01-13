/**
 * PetNexus Ecosystem Integration
 * 
 * This module provides the integration layer between PetMayday and the 
 * broader PetNexus ecosystem (VetOS, LifeLog, Teleport, Pet360).
 * 
 * Usage:
 * ```typescript
 * import { lifelog, teleport, vetos, pet360, metrics } from '@/lib/petnexus';
 * 
 * // Log a rescue event to LifeLog
 * await lifelog.logRescue({
 *   case_id: 'CASE-001',
 *   volunteer_id: 'vol-123',
 *   county: 'KANAWHA',
 *   outcome: 'rescued'
 * });
 * 
 * // Transfer animal to shelter via Teleport
 * await teleport.transferAnimalToVetOS({
 *   case_id: 'CASE-001',
 *   animal_data: { species: 'dog', breed: 'mixed' },
 *   destination_facility_id: 'shelter-001',
 *   volunteer_id: 'vol-123',
 *   reason: 'Stray intake'
 * });
 * 
 * // Check shelter capacity
 * const capacity = await vetos.checkFacilityCapacity('shelter-001');
 * 
 * // Search for matching lost pets
 * const matches = await pet360.searchLostPets({
 *   species: 'dog',
 *   county: 'KANAWHA'
 * });
 * 
 * // Record impact outcome
 * await metrics.recordOutcome({
 *   outcome_type: 'life_saved',
 *   case_id: 'CASE-001',
 *   volunteer_id: 'vol-123',
 *   county: 'KANAWHA'
 * });
 * ```
 */

export { 
  petnexus, 
  lifelog, 
  teleport, 
  vetos, 
  pet360, 
  metrics 
} from './client';

export type {
  PetNexusConfig,
  LifeLogEvent,
  TeleportTransfer,
  VetOSAnimalRecord,
  Pet360Profile,
} from './client';
