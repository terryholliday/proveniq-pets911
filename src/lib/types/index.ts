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

// --- Volunteer/Helper Network ---
export * from './volunteer';

// --- Triage System (EMS-Aligned) ---
export * from './triage';

// --- Certification Tracks (PetMayday Academy) ---
export * from './certification-tracks';

// --- Training Modules ---
export type {
  TrainingModule as AcademyTrainingModule,
  TrainingLesson,
  SimulationScenario,
} from './training-modules';
export {
  MODERATOR_MODULES,
  TRANSPORT_MODULES,
  FOSTER_MODULES,
  TRAPPER_MODULES,
  SIMULATION_SCENARIOS,
  ALL_TRAINING_MODULES,
  getModulesByTrack,
  getModulesByTier,
  getModuleById,
  getModuleByCode,
  getPrerequisiteChain,
} from './training-modules';

// --- Training System (Claude's Implementation) ---
export * from './training-system';
