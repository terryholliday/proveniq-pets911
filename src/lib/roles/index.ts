/**
 * Roles & Volunteer Management Module
 * 
 * Comprehensive role hierarchy, permissions, and application system for petmayday.
 */

// Role Hierarchy & Permissions
export {
  ROLE_DEFINITIONS,
  hasPermission,
  canApproveRole,
  getRolePermissions,
  getReportingChain,
  outranks,
  getManageableRoles,
} from './role-hierarchy';

export type {
  RoleId,
  PermissionId,
  RoleDefinition,
} from './role-hierarchy';

// Moderator Rules & Procedures
export {
  MODERATOR_CODE_OF_CONDUCT,
  STANDARD_PROCEDURES,
  SHIFT_REQUIREMENTS,
  TRAINING_MODULES,
  getProceduresForRole,
  getRequiredTraining,
  isTrainingComplete,
} from './moderator-rules';

export type {
  Procedure,
  ProcedureStep,
  TrainingModule,
} from './moderator-rules';

// Volunteer Application System
export {
  APPLICATION_REQUIREMENTS,
  createApplication,
  validateApplication,
  submitApplication,
  getNextStep,
  recordReviewAction,
  approveApplication,
  rejectApplication,
  getApplicationProgress,
} from './volunteer-application';

export type {
  ApplicationStatus,
  RejectionReason,
  VolunteerApplication,
  PersonalInfo,
  RoleSpecificInfo,
  AvailabilityInfo,
  Reference,
  BackgroundCheckInfo,
  InterviewInfo,
  TrainingProgress,
  ReviewEvent,
  ApplicationDecision,
  ApplicationRequirements,
} from './volunteer-application';
