/**
 * PROVENIQ Ecosystem Integration
 * 
 * This module provides the integration layer between PROVENIQ PetMayday and the 
 * broader PROVENIQ ecosystem (VetOS, LifeLog, Teleport, Pet360).
 * 
 * Usage:
 * ```typescript
 * import { lifelog, teleport, vetos, pet360, metrics } from '@/lib/proveniq';
 * 
 * // Log a rescue event to PROVENIQ LifeLog
 * await lifelog.logRescue({
 *   case_id: 'CASE-001',
 *   volunteer_id: 'vol-123',
 *   county: 'KANAWHA',
 *   outcome: 'rescued'
 * });
 * 
 * // Transfer animal to shelter via PROVENIQ Teleport
 * await teleport.transferAnimalToVetOS({
 *   case_id: 'CASE-001',
 *   animal_data: { species: 'dog', breed: 'mixed' },
 *   destination_facility_id: 'shelter-001',
 *   volunteer_id: 'vol-123',
 *   reason: 'Stray intake'
 * });
 * 
 * // Check shelter capacity via PROVENIQ VetOS
 * const capacity = await vetos.checkFacilityCapacity('shelter-001');
 * 
 * // Search for matching lost pets via PROVENIQ Pet360
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
  proveniq,
  petnexus, // Legacy alias
  lifelog, 
  teleport, 
  vetos, 
  pet360, 
  metrics 
} from './client';

export type {
  ProveniqConfig,
  LifeLogEvent,
  TeleportTransfer,
  VetOSAnimalRecord,
  Pet360Profile,
} from './client';
