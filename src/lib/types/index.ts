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

// --- Certification Tracks (pet911 Academy) ---
export * from './certification-tracks';

// --- Training Modules ---
export * from './training-modules';

// --- Training System (Claude's Implementation) ---
export * from './training-system';
