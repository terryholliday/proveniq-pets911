// PetMayday Training Components - Index
// Export all training-related components

// Core Components
export { TrainingDashboard } from './TrainingDashboard';
export { ModuleViewer } from './ModuleViewer';
export { QuizEngine } from './QuizEngine';

// Safety Gate Components
export { 
  BackgroundCheckGate,
  PrerequisiteGate,
  SignoffGate,
  ShadowingGate,
  CooldownOverlay,
} from './SafetyGates';

// Verification
export { CertificateVerificationPage } from './CertificateVerification';

// Shadowing Management
export { 
  ShadowingManagement,
  MentorVerificationCard 
} from './ShadowingManagement';

// Cooldown Notifications (multiple variants)
export {
  CooldownBanner,
  CooldownModal,
  CooldownCard,
  CooldownToast,
  CooldownInline,
  useCooldown,
} from './CooldownNotification';

// Supervisor Signoff Management
export { 
  SignoffManager,
  RequestSignoffCard 
} from './SignoffManager';

// Re-export types for convenience
export type {
  TrainingModule,
  UserProgress,
  QuizAttempt,
  Certification,
  BackgroundCheck,
  CooldownEvent,
  ModuleProgressSummary,
  TrainingDashboard as TrainingDashboardData,
  QuizQuestionForAttempt,
  CompleteQuizResponse,
} from '@/types/training';

export { TRACK_CONFIG, TRIAGE_CODES } from '@/types/training';
