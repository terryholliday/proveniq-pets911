/**
 * OPERATIONS MODULE - LOGISTICS DISPATCH
 * 
 * Geo-matching and volunteer dispatch system.
 */

import type { 
  UserId, GeoLocation, Address, Severity, Species, 
  AuditMetadata, ConfidenceLevel 
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// DISPATCH TYPES
// ═══════════════════════════════════════════════════════════════════

export type DispatchType = 
  | 'transport'          // Animal transport
  | 'trapping'           // TNR operation
  | 'rescue'             // Animal rescue
  | 'wellness_check'     // Check on animal
  | 'supply_delivery'    // Deliver supplies
  | 'medical_escort'     // Escort to vet
  | 'home_visit'         // Visit location
  | 'search_assist'      // Help search for lost pet
  | 'emergency_response'; // Emergency situation

export type DispatchStatus = 
  | 'pending'
  | 'searching'
  | 'assigned'
  | 'accepted'
  | 'en_route'
  | 'on_scene'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface DispatchRequest {
  id: string;
  caseId: string;
  type: DispatchType;
  priority: DispatchPriority;
  severity: Severity;
  
  // Location details
  pickupLocation?: {
    address: Address;
    coordinates: GeoLocation;
    contactName?: string;
    contactPhone?: string;
    specialInstructions?: string;
  };
  
  destinationLocation?: {
    address: Address;
    coordinates: GeoLocation;
    contactName?: string;
    contactPhone?: string;
    specialInstructions?: string;
  };
  
  // Animal details
  animalDetails?: {
    species: Species;
    breed?: string;
    size: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'giant';
    age?: 'puppy' | 'kitten' | 'young' | 'adult' | 'senior';
    healthStatus: 'healthy' | 'injured' | 'sick' | 'critical' | 'deceased';
    specialNeeds?: string[];
    aggressive: boolean;
    feral: boolean;
    requiresCage: boolean;
    requiresMuzzle: boolean;
    weightKg?: number;
  };
  
  // Requirements
  requirements: DispatchRequirements;
  
  // Timing
  requestedAt: string;
  requestedBy: UserId;
  neededBy?: string;
  estimatedDuration?: number; // minutes
  flexibleTiming: boolean;
  
  // Status
  status: DispatchStatus;
  assignedTo?: UserId;
  assignedAt?: string;
  acceptedAt?: string;
  enRouteAt?: string;
  onSceneAt?: string;
  completedAt?: string;
  
  // Communication
  notes: DispatchNote[];
  
  // Matching
  matchingScore?: number;
  matchedVolunteers?: VolunteerMatch[];
  
  audit: AuditMetadata;
}

export interface DispatchRequirements {
  // Volunteer requirements
  requiredRoles: string[];
  requiredSkills: string[];
  requiredEquipment: string[];
  minExperienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  
  // Physical requirements
  mustLiftWeightKg?: number;
  mustBeAbleToDrive: boolean;
  mustHaveVehicle: boolean;
  vehicleType?: 'sedan' | 'suv' | 'truck' | 'van' | 'minivan';
  
  // Special requirements
  mustBeComfortableWith: ('aggressive_animals' | 'feral_animals' | 'injured_animals' | 'deceased_animals')[];
  requiresBuddy: boolean;
  requiresCertification?: string[];
  
  // Location requirements
  maxDistanceKm?: number;
  mustBeInRegion?: string;
  preferredRegions?: string[];
}

export type DispatchPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

export interface DispatchNote {
  id: string;
  authorId: UserId;
  content: string;
  createdAt: string;
  type: 'general' | 'status_update' | 'safety_concern' | 'private';
  visibleToVolunteer: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// VOLUNTEER MATCHING
// ═══════════════════════════════════════════════════════════════════

export interface VolunteerMatch {
  volunteerId: UserId;
  score: number; // 0-100
  distance: number; // km
  estimatedArrival: number; // minutes
  matchFactors: {
    location: number; // 0-100
    skills: number; // 0-100
    availability: number; // 0-100
    experience: number; // 0-100
    workload: number; // 0-100
  };
  reasons: {
    positive: string[];
    negative: string[];
  };
}

export interface DispatchMatchingCriteria {
  dispatchId: string;
  location: GeoLocation;
  requirements: DispatchRequirements;
  priority: DispatchPriority;
  excludeVolunteers?: UserId[];
  preferredVolunteers?: UserId[];
  maxDistanceKm?: number;
  maxResults?: number;
}

export class DispatchMatcher {
  /**
   * Find matching volunteers for a dispatch
   */
  findMatches(
    criteria: DispatchMatchingCriteria,
    volunteers: VolunteerDispatchProfile[]
  ): VolunteerMatch[] {
    const matches: VolunteerMatch[] = [];
    
    for (const volunteer of volunteers) {
      // Skip excluded volunteers
      if (criteria.excludeVolunteers?.includes(volunteer.userId)) continue;
      
      // Check basic availability
      if (!volunteer.isAvailable) continue;
      
      // Check role requirements
      if (!this.meetsRoleRequirements(volunteer, criteria.requirements.requiredRoles)) {
        continue;
      }
      
      // Check skill requirements
      if (!this.meetsSkillRequirements(volunteer, criteria.requirements.requiredSkills)) {
        continue;
      }
      
      // Check equipment requirements
      if (!this.meetsEquipmentRequirements(volunteer, criteria.requirements.requiredEquipment)) {
        continue;
      }
      
      // Calculate distance
      const distance = this.calculateDistance(criteria.location, volunteer.homeLocation);
      const maxDistance = criteria.maxDistanceKm ?? criteria.requirements.maxDistanceKm ?? 50;
      
      if (distance > maxDistance) continue;
      
      // Calculate match score
      const match = this.calculateMatchScore(criteria, volunteer, distance);
      matches.push(match);
    }
    
    // Sort by score and return top results
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, criteria.maxResults ?? 10);
  }
  
  meetsRoleRequirements(volunteer: VolunteerDispatchProfile, requiredRoles: string[]): boolean {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some(role => volunteer.roles.includes(role));
  }
  
  meetsSkillRequirements(volunteer: VolunteerDispatchProfile, requiredSkills: string[]): boolean {
    if (requiredSkills.length === 0) return true;
    return requiredSkills.every(skill => volunteer.skills.includes(skill));
  }
  
  meetsEquipmentRequirements(volunteer: VolunteerDispatchProfile, requiredEquipment: string[]): boolean {
    if (requiredEquipment.length === 0) return true;
    return requiredEquipment.every(equipment => volunteer.equipment.includes(equipment));
  }
  
  private calculateDistance(from: GeoLocation, to: GeoLocation): number {
    // Simplified distance calculation - in production would use proper geodesic calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.lat - from.lat);
    const dLon = this.toRad(to.lng - from.lng);
    const lat1 = this.toRad(from.lat);
    const lat2 = this.toRad(to.lat);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }
  
  private toRad(value: number): number {
    return value * Math.PI / 180;
  }
  
  private calculateMatchScore(
    criteria: DispatchMatchingCriteria,
    volunteer: VolunteerDispatchProfile,
    distance: number
  ): VolunteerMatch {
    let score = 0;
    
    // Location score (30% weight)
    const locationScore = Math.max(0, 100 - (distance / 50) * 100);
    score += locationScore * 0.3;
    
    // Skills score (25% weight)
    const skillsScore = this.calculateSkillsScore(criteria.requirements.requiredSkills, volunteer.skills);
    score += skillsScore * 0.25;
    
    // Availability score (20% weight)
    const availabilityScore = volunteer.responseTimeScore;
    score += availabilityScore * 0.2;
    
    // Experience score (15% weight)
    const experienceScore = this.calculateExperienceScore(volunteer);
    score += experienceScore * 0.15;
    
    // Workload score (10% weight)
    const workloadScore = volunteer.workloadScore;
    score += workloadScore * 0.1;
    
    // Priority bonus
    if (criteria.priority === 'urgent' || criteria.priority === 'critical') {
      score += volunteer.emergencyResponseBonus;
    }
    
    // Preferred volunteer bonus
    if (criteria.preferredVolunteers?.includes(volunteer.userId)) {
      score += 20;
    }
    
    return {
      volunteerId: volunteer.userId,
      score: Math.round(Math.max(0, Math.min(100, score))),
      distance,
      estimatedArrival: Math.round(distance * 2), // Assume 30 km/h average speed
      matchFactors: {
        location: Math.round(locationScore),
        skills: Math.round(skillsScore),
        availability: Math.round(availabilityScore),
        experience: Math.round(experienceScore),
        workload: Math.round(workloadScore),
      },
      reasons: this.generateMatchReasons(criteria, volunteer, distance),
    };
  }
  
  private calculateSkillsScore(requiredSkills: string[], volunteerSkills: string[]): number {
    if (requiredSkills.length === 0) return 100;
    
    const matches = requiredSkills.filter(skill => volunteerSkills.includes(skill)).length;
    return (matches / requiredSkills.length) * 100;
  }
  
  private calculateExperienceScore(volunteer: VolunteerDispatchProfile): number {
    // Score based on experience level and completed dispatches
    let score = 0;
    
    switch (volunteer.experienceLevel) {
      case 'expert': score += 40; break;
      case 'advanced': score += 30; break;
      case 'intermediate': score += 20; break;
      case 'beginner': score += 10; break;
    }
    
    // Bonus for completed dispatches
    if (volunteer.completedDispatches > 100) score += 30;
    else if (volunteer.completedDispatches > 50) score += 20;
    else if (volunteer.completedDispatches > 10) score += 10;
    
    return Math.min(60, score);
  }
  
  private generateMatchReasons(
    criteria: DispatchMatchingCriteria,
    volunteer: VolunteerDispatchProfile,
    distance: number
  ): { positive: string[]; negative: string[] } {
    const positive: string[] = [];
    const negative: string[] = [];
    
    // Location
    if (distance < 5) positive.push('Very close to location');
    else if (distance > 30) negative.push('Far from location');
    
    // Skills
    if (criteria.requirements.requiredSkills.every(skill => volunteer.skills.includes(skill))) {
      positive.push('Has all required skills');
    }
    
    // Experience
    if (volunteer.completedDispatches > 50) {
      positive.push('Highly experienced');
    } else if (volunteer.completedDispatches < 5) {
      negative.push('Limited experience');
    }
    
    // Availability
    if (volunteer.responseTimeScore > 80) {
      positive.push('Very responsive');
    }
    
    // Workload
    if (volunteer.workloadScore < 30) {
      positive.push('Low current workload');
    } else if (volunteer.workloadScore > 80) {
      negative.push('High current workload');
    }
    
    return { positive, negative };
  }
}

// ═══════════════════════════════════════════════════════════════════
// DISPATCH PROFILE
// ═══════════════════════════════════════════════════════════════════

export interface VolunteerDispatchProfile {
  userId: UserId;
  
  // Status
  isAvailable: boolean;
  status: 'available' | 'busy' | 'on_break' | 'unavailable';
  
  // Location
  homeLocation: GeoLocation;
  currentLocation?: GeoLocation;
  serviceRadiusKm: number;
  
  // Capabilities
  roles: string[];
  skills: string[];
  equipment: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  // Performance
  completedDispatches: number;
  successRate: number; // percentage
  averageRating: number; // 1-5
  onTimePercentage: number; // percentage
  
  // Availability
  responseTimeScore: number; // 0-100
  workloadScore: number; // 0-100 (lower is better)
  emergencyResponseBonus: number; // 0-20
  
  // Preferences
  maxDistanceKm: number;
  preferredDispatchTypes: DispatchType[];
  avoidedDispatchTypes: DispatchType[];
  
  // Restrictions
  cannotLiftWeightKg: number;
  cannotHandle: ('aggressive_animals' | 'feral_animals' | 'injured_animals' | 'deceased_animals')[];
  requiresBuddy: boolean;
  
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════
// DISPATCH MANAGER
// ═══════════════════════════════════════════════════════════════════

export class DispatchManager {
  private matcher = new DispatchMatcher();
  
  /**
   * Create dispatch request
   */
  createDispatch(params: {
    caseId: string;
    type: DispatchType;
    priority: DispatchPriority;
    severity: Severity;
    pickupLocation?: any;
    destinationLocation?: any;
    animalDetails?: any;
    requirements: DispatchRequirements;
    requestedBy: UserId;
    neededBy?: string;
  }): DispatchRequest {
    const now = new Date().toISOString();
    
    return {
      id: crypto.randomUUID(),
      caseId: params.caseId,
      type: params.type,
      priority: params.priority,
      severity: params.severity,
      pickupLocation: params.pickupLocation,
      destinationLocation: params.destinationLocation,
      animalDetails: params.animalDetails,
      requirements: params.requirements,
      requestedAt: now,
      requestedBy: params.requestedBy,
      neededBy: params.neededBy,
      flexibleTiming: true,
      status: 'pending',
      notes: [],
      audit: {
        createdAt: now,
        createdBy: params.requestedBy,
        version: 1,
      },
    };
  }
  
  /**
   * Find volunteers for dispatch
   */
  findVolunteers(
    dispatch: DispatchRequest,
    volunteers: VolunteerDispatchProfile[],
    options?: {
      maxDistance?: number;
      maxResults?: number;
      excludeVolunteers?: UserId[];
    }
  ): VolunteerMatch[] {
    if (!dispatch.pickupLocation?.coordinates) {
      throw new Error('Dispatch must have pickup location');
    }
    
    const criteria: DispatchMatchingCriteria = {
      dispatchId: dispatch.id,
      location: dispatch.pickupLocation.coordinates,
      requirements: dispatch.requirements,
      priority: dispatch.priority,
      maxDistanceKm: options?.maxDistance,
      maxResults: options?.maxResults,
      excludeVolunteers: options?.excludeVolunteers,
    };
    
    const matches = this.matcher.findMatches(criteria, volunteers);
    
    // Update dispatch with matches
    dispatch.matchedVolunteers = matches;
    dispatch.matchingScore = matches.length > 0 ? matches[0].score : 0;
    
    return matches;
  }
  
  /**
   * Assign dispatch to volunteer
   */
  assignDispatch(
    dispatch: DispatchRequest,
    volunteerId: UserId,
    assignedBy: UserId
  ): DispatchRequest {
    const now = new Date().toISOString();

    const assignNote: DispatchNote = {
      id: crypto.randomUUID(),
      authorId: assignedBy,
      content: `Assigned to volunteer ${volunteerId}`,
      createdAt: now,
      type: 'status_update',
      visibleToVolunteer: true,
    };
    
    return {
      ...dispatch,
      status: 'assigned',
      assignedTo: volunteerId,
      assignedAt: now,
      notes: [
        ...dispatch.notes,
        assignNote,
      ],
      audit: {
        ...dispatch.audit,
        updatedAt: now,
        version: dispatch.audit.version + 1,
      },
    };
  }
  
  /**
   * Accept dispatch
   */
  acceptDispatch(
    dispatch: DispatchRequest,
    acceptedBy: UserId
  ): DispatchRequest {
    const now = new Date().toISOString();
    
    if (dispatch.assignedTo !== acceptedBy) {
      throw new Error('Only assigned volunteer can accept dispatch');
    }
    
    const acceptNote: DispatchNote = {
      id: crypto.randomUUID(),
      authorId: acceptedBy,
      content: 'Dispatch accepted',
      createdAt: now,
      type: 'status_update',
      visibleToVolunteer: true,
    };

    return {
      ...dispatch,
      status: 'accepted',
      acceptedAt: now,
      notes: [
        ...dispatch.notes,
        acceptNote,
      ],
      audit: {
        ...dispatch.audit,
        updatedAt: now,
        version: dispatch.audit.version + 1,
      },
    };
  }
  
  /**
   * Update dispatch status
   */
  updateStatus(
    dispatch: DispatchRequest,
    newStatus: DispatchStatus,
    updatedBy: UserId,
    note?: string
  ): DispatchRequest {
    const now = new Date().toISOString();

    const statusNote: DispatchNote = {
      id: crypto.randomUUID(),
      authorId: updatedBy,
      content: note ?? `Status changed to ${newStatus}`,
      createdAt: now,
      type: 'status_update',
      visibleToVolunteer: true,
    };
    
    const updatedDispatch = {
      ...dispatch,
      status: newStatus,
      notes: [...dispatch.notes, statusNote],
      audit: {
        ...dispatch.audit,
        updatedAt: now,
        version: dispatch.audit.version + 1,
      },
    };
    
    // Set timestamps for specific statuses
    switch (newStatus) {
      case 'en_route':
        updatedDispatch.enRouteAt = now;
        break;
      case 'on_scene':
        updatedDispatch.onSceneAt = now;
        break;
      case 'completed':
        updatedDispatch.completedAt = now;
        break;
    }
    
    return updatedDispatch;
  }
  
  /**
   * Add note to dispatch
   */
  addNote(
    dispatch: DispatchRequest,
    authorId: UserId,
    content: string,
    type: DispatchNote['type'] = 'general',
    visibleToVolunteer: boolean = true
  ): DispatchRequest {
    const note: DispatchNote = {
      id: crypto.randomUUID(),
      authorId,
      content,
      createdAt: new Date().toISOString(),
      type,
      visibleToVolunteer,
    };
    
    return {
      ...dispatch,
      notes: [...dispatch.notes, note],
      audit: {
        ...dispatch.audit,
        updatedAt: new Date().toISOString(),
        version: dispatch.audit.version + 1,
      },
    };
  }
  
  /**
   * Get dispatch statistics
   */
  getStatistics(dispatches: DispatchRequest[]): {
    total: number;
    pending: number;
    assigned: number;
    active: number;
    completed: number;
    failed: number;
    averageResponseTime: number;
    averageCompletionTime: number;
    successRate: number;
  } {
    const total = dispatches.length;
    const pending = dispatches.filter(d => d.status === 'pending').length;
    const assigned = dispatches.filter(d => d.status === 'assigned').length;
    const active = dispatches.filter(d => ['accepted', 'en_route', 'on_scene'].includes(d.status)).length;
    const completed = dispatches.filter(d => d.status === 'completed').length;
    const failed = dispatches.filter(d => d.status === 'failed').length;
    
    // Calculate response time (time from request to assignment)
    const withAssignmentTime = dispatches.filter(d => d.assignedAt);
    const averageResponseTime = withAssignmentTime.length > 0
      ? withAssignmentTime.reduce((sum, d) => {
          const responseTime = new Date(d.assignedAt!).getTime() - new Date(d.requestedAt).getTime();
          return sum + responseTime;
        }, 0) / withAssignmentTime.length / (1000 * 60) // minutes
      : 0;
    
    // Calculate completion time
    const withCompletionTime = dispatches.filter(d => d.completedAt && d.acceptedAt);
    const averageCompletionTime = withCompletionTime.length > 0
      ? withCompletionTime.reduce((sum, d) => {
          const completionTime = new Date(d.completedAt!).getTime() - new Date(d.acceptedAt!).getTime();
          return sum + completionTime;
        }, 0) / withCompletionTime.length / (1000 * 60) // minutes
      : 0;
    
    const successRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      total,
      pending,
      assigned,
      active,
      completed,
      failed,
      averageResponseTime,
      averageCompletionTime,
      successRate,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const dispatchManager = new DispatchManager();

export function createDispatchRequirements(): DispatchRequirements {
  return {
    requiredRoles: [],
    requiredSkills: [],
    requiredEquipment: [],
    mustLiftWeightKg: 0,
    mustBeAbleToDrive: false,
    mustHaveVehicle: false,
    mustBeComfortableWith: [],
    requiresBuddy: false,
  };
}

export function canVolunteerHandleDispatch(
  volunteer: VolunteerDispatchProfile,
  dispatch: DispatchRequest
): boolean {
  // Check availability
  if (!volunteer.isAvailable) return false;
  
    const matcher = new DispatchMatcher();

  // Check role requirements
  if (!matcher.meetsRoleRequirements(volunteer, dispatch.requirements.requiredRoles)) {
    return false;
  }

  // Check skill requirements
  if (!matcher.meetsSkillRequirements(volunteer, dispatch.requirements.requiredSkills)) {
    return false;
  }

  // Check equipment requirements
  if (!matcher.meetsEquipmentRequirements(volunteer, dispatch.requirements.requiredEquipment)) {
    return false;
  }
  
  // Check physical requirements
  if (dispatch.requirements.mustLiftWeightKg && volunteer.cannotLiftWeightKg < dispatch.requirements.mustLiftWeightKg) {
    return false;
  }
  
  // Check special requirements
  for (const requirement of dispatch.requirements.mustBeComfortableWith) {
    if (volunteer.cannotHandle.includes(requirement)) {
      return false;
    }
  }
  
  return true;
}

export function getDispatchPriorityScore(priority: DispatchPriority): number {
  switch (priority) {
    case 'critical': return 100;
    case 'urgent': return 80;
    case 'high': return 60;
    case 'normal': return 40;
    case 'low': return 20;
  }
}

export function isDispatchOverdue(dispatch: DispatchRequest): boolean {
  if (!dispatch.neededBy) return false;
  return new Date(dispatch.neededBy) <= new Date();
}

export function getDispatchETA(dispatch: DispatchRequest): number | null {
  if (!dispatch.assignedAt || dispatch.status !== 'en_route') return null;
  
  // Simple ETA calculation - in production would use real-time traffic
  const elapsed = Date.now() - new Date(dispatch.assignedAt).getTime();
  const estimatedDuration = dispatch.estimatedDuration ?? 60; // minutes
  
  return Math.max(0, estimatedDuration - (elapsed / (1000 * 60)));
}
