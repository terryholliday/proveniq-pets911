/**
 * OPERATIONS MODULE - VOLUNTEER CAPABILITIES
 * 
 * Skills, certifications, and capability management.
 */

import type { Species, AuditMetadata, UserId } from '../types';
import type { VolunteerProfile } from './profile';

// ═══════════════════════════════════════════════════════════════════
// CAPABILITY TYPES
// ═══════════════════════════════════════════════════════════════════

export type SkillCategory = 
  | 'animal_handling'
  | 'medical_care'
  | 'behavior'
  | 'transport'
  | 'foster_care'
  | 'trapping'
  | 'administrative'
  | 'technical'
  | 'communication'
  | 'safety';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  level: SkillLevel;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: UserId;
  evidence?: string[];
  lastUsed?: string;
  expiresAt?: string;
  audit: AuditMetadata;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issuedAt: string;
  expiresAt?: string;
  credentialId?: string;
  verificationUrl?: string;
  documentUrl?: string;
  verified: boolean;
  verifiedAt?: string;
  notes?: string;
  audit: AuditMetadata;
}

export interface TrainingRecord {
  id: string;
  moduleId: string;
  moduleName: string;
  completedAt: string;
  score?: number;
  passed: boolean;
  expiresAt?: string;
  certificateUrl?: string;
  instructor?: string;
  audit: AuditMetadata;
}

export interface Capability {
  userId: UserId;
  skills: Skill[];
  certifications: Certification[];
  training: TrainingRecord[];
  lastAssessed: string;
  nextAssessmentDue?: string;
  overallScore: number; // 0-100
  audit: AuditMetadata;
}

// ═══════════════════════════════════════════════════════════════════
// SKILL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export interface SkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  requiresVerification: boolean;
  validForDays?: number;
  prerequisites?: string[];
  maxLevel?: SkillLevel;
  evidenceRequired?: string[];
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  // Animal Handling
  {
    id: 'basic_animal_handling',
    name: 'Basic Animal Handling',
    category: 'animal_handling',
    description: 'Safe handling of domestic animals',
    requiresVerification: false,
    maxLevel: 'advanced',
  },
  {
    id: 'feral_cat_handling',
    name: 'Feral Cat Handling',
    category: 'animal_handling',
    description: 'Safe handling of feral cats',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['basic_animal_handling'],
    evidenceRequired: ['training_certificate', 'practical_assessment'],
  },
  {
    id: 'large_dog_handling',
    name: 'Large Dog Handling',
    category: 'animal_handling',
    description: 'Handling of large or powerful dogs',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['basic_animal_handling'],
    evidenceRequired: ['training_certificate', 'practical_assessment'],
  },
  {
    id: 'exotic_animal_handling',
    name: 'Exotic Animal Handling',
    category: 'animal_handling',
    description: 'Handling of exotic or non-domestic animals',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['basic_animal_handling'],
    evidenceRequired: ['license', 'training_certificate'],
  },
  
  // Medical Care
  {
    id: 'basic_first_aid',
    name: 'Basic Animal First Aid',
    category: 'medical_care',
    description: 'Basic first aid for injured animals',
    requiresVerification: true,
    validForDays: 730, // 2 years
    evidenceRequired: ['certificate', 'practical_assessment'],
  },
  {
    id: 'medication_administration',
    name: 'Medication Administration',
    category: 'medical_care',
    description: 'Administering oral and topical medications',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['basic_first_aid'],
    evidenceRequired: ['training_certificate', 'vet_approval'],
  },
  {
    id: 'subcutaneous_fluids',
    name: 'Subcutaneous Fluids',
    category: 'medical_care',
    description: 'Administering subcutaneous fluids',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['medication_administration'],
    evidenceRequired: ['vet_training', 'practical_assessment'],
  },
  {
    id: 'neonatal_care',
    name: 'Neonatal Kitten/Puppy Care',
    category: 'medical_care',
    description: 'Care for unweaned kittens/puppies',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['basic_first_aid'],
    evidenceRequired: ['training_certificate', 'practical_experience'],
  },
  
  // Behavior
  {
    id: 'basic_behavior_assessment',
    name: 'Basic Behavior Assessment',
    category: 'behavior',
    description: 'Basic animal behavior evaluation',
    requiresVerification: true,
    validForDays: 365,
    evidenceRequired: ['training_certificate', 'assessment_reports'],
  },
  {
    id: 'fearful_animal_rehab',
    name: 'Fearful Animal Rehabilitation',
    category: 'behavior',
    description: 'Rehabilitating fearful or traumatized animals',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['basic_behavior_assessment'],
    evidenceRequired: ['advanced_training', 'case_studies'],
  },
  {
    id: 'aggression_management',
    name: 'Aggression Management',
    category: 'behavior',
    description: 'Managing animal aggression',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['basic_behavior_assessment'],
    evidenceRequired: ['specialized_training', 'expert_supervision'],
  },
  
  // Transport
  {
    id: 'animal_transport',
    name: 'Animal Transport',
    category: 'transport',
    description: 'Safe animal transport procedures',
    requiresVerification: true,
    validForDays: 365,
    evidenceRequired: ['training_certificate', 'vehicle_inspection'],
  },
  {
    id: 'injured_animal_transport',
    name: 'Injured Animal Transport',
    category: 'transport',
    description: 'Transporting injured or sick animals',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['animal_transport', 'basic_first_aid'],
    evidenceRequired: ['advanced_training', 'medical_protocols'],
  },
  
  // Foster Care
  {
    id: 'foster_care_basics',
    name: 'Foster Care Basics',
    category: 'foster_care',
    description: 'Basic foster care requirements',
    requiresVerification: false,
  },
  {
    id: 'quarantine_procedures',
    name: 'Quarantine Procedures',
    category: 'foster_care',
    description: 'Proper quarantine protocols',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['foster_care_basics'],
    evidenceRequired: ['training_certificate', 'home_inspection'],
  },
  {
    id: 'hospice_care',
    name: 'Hospice Care',
    category: 'foster_care',
    description: 'End-of-life care for animals',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['foster_care_basics', 'basic_first_aid'],
    evidenceRequired: ['specialized_training', 'counseling_resources'],
  },
  
  // Trapping
  {
    id: 'tnr_basics',
    name: 'TNR Basics',
    category: 'trapping',
    description: 'Trap-Neuter-Return basics',
    requiresVerification: true,
    validForDays: 365,
    evidenceRequired: ['training_certificate', 'hands_on_training'],
  },
  {
    id: 'colony_management',
    name: 'Colony Management',
    category: 'trapping',
    description: 'Managing feral cat colonies',
    requiresVerification: true,
    validForDays: 365,
    prerequisites: ['tnr_basics'],
    evidenceRequired: ['advanced_training', 'colony_documentation'],
  },
  
  // Administrative
  {
    id: 'case_management',
    name: 'Case Management',
    category: 'administrative',
    description: 'Managing lost/found pet cases',
    requiresVerification: true,
    validForDays: 180,
    evidenceRequired: ['training_certificate', 'supervisor_approval'],
  },
  {
    id: 'data_entry',
    name: 'Data Entry',
    category: 'administrative',
    description: 'Accurate data entry and management',
    requiresVerification: false,
  },
  
  // Technical
  {
    id: 'photography',
    name: 'Animal Photography',
    category: 'technical',
    description: 'Taking effective animal photos',
    requiresVerification: false,
  },
  {
    id: 'social_media',
    name: 'Social Media Management',
    category: 'technical',
    description: 'Managing social media posts',
    requiresVerification: false,
  },
  
  // Communication
  {
    id: 'crisis_communication',
    name: 'Crisis Communication',
    category: 'communication',
    description: 'Communication during emergencies',
    requiresVerification: true,
    validForDays: 365,
    evidenceRequired: ['training_certificate', 'role_play_assessment'],
  },
  {
    id: 'grief_support',
    name: 'Grief Support',
    category: 'communication',
    description: 'Providing support to grieving owners',
    requiresVerification: true,
    validForDays: 365,
    evidenceRequired: ['training_certificate', 'counseling_resources'],
  },
  
  // Safety
  {
    id: 'personal_safety',
    name: 'Personal Safety',
    category: 'safety',
    description: 'Personal safety protocols',
    requiresVerification: true,
    validForDays: 365,
    evidenceRequired: ['training_certificate', 'safety_assessment'],
  },
  {
    id: 'zoonotic_disease_prevention',
    name: 'Zoonotic Disease Prevention',
    category: 'safety',
    description: 'Preventing disease transmission',
    requiresVerification: true,
    validForDays: 365,
    evidenceRequired: ['training_certificate', 'health_protocols'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// CAPABILITY ASSESSMENT
// ═══════════════════════════════════════════════════════════════════

export interface CapabilityAssessment {
  userId: string;
  assessedAt: string;
  assessedBy: string;
  overallScore: number;
  categoryScores: Record<SkillCategory, number>;
  skillAssessments: SkillAssessment[];
  recommendations: string[];
  nextAssessmentDue: string;
  audit: AuditMetadata;
}

export interface SkillAssessment {
  skillId: string;
  currentLevel: SkillLevel;
  demonstratedLevel: SkillLevel;
  confidence: number; // 0-100
  notes: string;
  needsImprovement: boolean;
  recommendedTraining?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CAPABILITY MANAGER
// ═══════════════════════════════════════════════════════════════════

export class CapabilityManager {
  /**
   * Add or update a skill
   */
  updateSkill(
    capability: Capability,
    skillDef: SkillDefinition,
    level: SkillLevel,
    verified: boolean = false,
    evidence?: string[]
  ): Skill {
    const now = new Date().toISOString();
    
    // Check prerequisites
    if (skillDef.prerequisites) {
      const hasPrerequisites = skillDef.prerequisites.every(prereq =>
        capability.skills.some(s => s.id === prereq && s.level !== 'beginner')
      );
      
      if (!hasPrerequisites) {
        throw new Error(`Missing prerequisites: ${skillDef.prerequisites.join(', ')}`);
      }
    }
    
    // Calculate expiration
    let expiresAt: string | undefined;
    if (skillDef.validForDays) {
      const expiry = new Date(now);
      expiry.setDate(expiry.getDate() + skillDef.validForDays);
      expiresAt = expiry.toISOString();
    }
    
    // Check if skill exists
    const existingSkill = capability.skills.find(s => s.id === skillDef.id);
    
    if (existingSkill) {
      // Update existing skill
      return {
        ...existingSkill,
        level,
        verified: verified && skillDef.requiresVerification,
        verifiedAt: verified ? now : existingSkill.verifiedAt,
        verifiedBy: verified ? capability.userId : existingSkill.verifiedBy,
        evidence: evidence ?? existingSkill.evidence,
        lastUsed: now,
        expiresAt,
        audit: {
          ...existingSkill.audit,
          updatedAt: now,
          version: existingSkill.audit.version + 1,
        },
      };
    }
    
    // Create new skill
    return {
      id: skillDef.id,
      name: skillDef.name,
      category: skillDef.category,
      description: skillDef.description,
      level,
      verified: verified && skillDef.requiresVerification,
      verifiedAt: verified ? now : undefined,
      verifiedBy: verified ? capability.userId : undefined,
      evidence,
      lastUsed: now,
      expiresAt,
      audit: {
        createdAt: now,
        createdBy: capability.userId,
        version: 1,
      },
    };
  }
  
  /**
   * Calculate overall capability score
   */
  calculateOverallScore(capability: Capability): number {
    if (capability.skills.length === 0) return 0;
    
    const levelScores: Record<SkillLevel, number> = {
      beginner: 25,
      intermediate: 50,
      advanced: 75,
      expert: 100,
    };
    
    const totalScore = capability.skills.reduce((sum, skill) => {
      const score = levelScores[skill.level];
      return sum + score;
    }, 0);
    
    return Math.round(totalScore / capability.skills.length);
  }
  
  /**
   * Get capability summary by category
   */
  getCategorySummary(capability: Capability): Record<SkillCategory, {
    skillCount: number;
    averageLevel: SkillLevel;
    verifiedCount: number;
    expiredCount: number;
  }> {
    const categories: Record<SkillCategory, {
      skills: Skill[];
      verifiedCount: number;
      expiredCount: number;
    }> = {
      animal_handling: { skills: [], verifiedCount: 0, expiredCount: 0 },
      medical_care: { skills: [], verifiedCount: 0, expiredCount: 0 },
      behavior: { skills: [], verifiedCount: 0, expiredCount: 0 },
      transport: { skills: [], verifiedCount: 0, expiredCount: 0 },
      foster_care: { skills: [], verifiedCount: 0, expiredCount: 0 },
      trapping: { skills: [], verifiedCount: 0, expiredCount: 0 },
      administrative: { skills: [], verifiedCount: 0, expiredCount: 0 },
      technical: { skills: [], verifiedCount: 0, expiredCount: 0 },
      communication: { skills: [], verifiedCount: 0, expiredCount: 0 },
      safety: { skills: [], verifiedCount: 0, expiredCount: 0 },
    };
    
    // Categorize skills
    for (const skill of capability.skills) {
      categories[skill.category].skills.push(skill);
      if (skill.verified) categories[skill.category].verifiedCount++;
      if (skill.expiresAt && new Date(skill.expiresAt) <= new Date()) {
        categories[skill.category].expiredCount++;
      }
    }
    
    // Calculate averages
    const result: Record<SkillCategory, {
      skillCount: number;
      averageLevel: SkillLevel;
      verifiedCount: number;
      expiredCount: number;
    }> = {
      animal_handling: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
      medical_care: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
      behavior: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
      transport: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
      foster_care: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
      trapping: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
      administrative: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
      technical: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
      communication: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
      safety: { skillCount: 0, averageLevel: 'beginner', verifiedCount: 0, expiredCount: 0 },
    };
    
    for (const [category, data] of Object.entries(categories)) {
      const avgLevel = this.calculateAverageLevel(data.skills);
      
      result[category as SkillCategory] = {
        skillCount: data.skills.length,
        averageLevel: avgLevel,
        verifiedCount: data.verifiedCount,
        expiredCount: data.expiredCount,
      };
    }
    
    return result;
  }
  
  /**
   * Check if volunteer is qualified for task
   */
  isQualifiedFor(
    capability: Capability,
    requiredSkills: { skillId: string; minLevel: SkillLevel }[]
  ): { qualified: boolean; missingSkills: string[] } {
    const missingSkills: string[] = [];
    
    for (const requirement of requiredSkills) {
      const skill = capability.skills.find(s => s.id === requirement.skillId);
      
      if (!skill) {
        missingSkills.push(requirement.skillId);
        continue;
      }
      
      // Check if skill level is sufficient
      const levels: Record<SkillLevel, number> = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
        expert: 4,
      };
      
      if (levels[skill.level] < levels[requirement.minLevel]) {
        missingSkills.push(`${requirement.skillId} (need ${requirement.minLevel})`);
      }
      
      // Check if skill is verified and not expired
      if (skill.expiresAt && new Date(skill.expiresAt) <= new Date()) {
        missingSkills.push(`${requirement.skillId} (expired)`);
      }
    }
    
    return {
      qualified: missingSkills.length === 0,
      missingSkills,
    };
  }
  
  /**
   * Get expiring skills
   */
  getExpiringSkills(capability: Capability, daysThreshold: number = 30): Skill[] {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);
    
    return capability.skills.filter(skill => 
      skill.expiresAt && 
      new Date(skill.expiresAt) <= threshold &&
      new Date(skill.expiresAt) > new Date()
    );
  }
  
  /**
   * Get recommended training
   */
  getRecommendedTraining(capability: Capability): string[] {
    const recommendations: string[] = [];
    const skillIds = new Set(capability.skills.map(s => s.id));
    
    // Find skills with prerequisites that are met
    for (const skillDef of SKILL_DEFINITIONS) {
      if (skillIds.has(skillDef.id)) continue;
      
      // Check if prerequisites are met
      if (skillDef.prerequisites) {
        const hasPrerequisites = skillDef.prerequisites.every(prereq => skillIds.has(prereq));
        if (hasPrerequisites) {
          recommendations.push(skillDef.name);
        }
      } else {
        recommendations.push(skillDef.name);
      }
    }
    
    return recommendations;
  }
  
  private calculateAverageLevel(skills: Skill[]): SkillLevel {
    if (skills.length === 0) return 'beginner';
    
    const levelCounts: Record<SkillLevel, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
    };
    
    for (const skill of skills) {
      levelCounts[skill.level]++;
    }
    
    // Find the most common level
    let maxCount = 0;
    let avgLevel: SkillLevel = 'beginner';
    
    for (const [level, count] of Object.entries(levelCounts)) {
      if (count > maxCount) {
        maxCount = count;
        avgLevel = level as SkillLevel;
      }
    }
    
    return avgLevel;
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const capabilityManager = new CapabilityManager();

export function createCapability(userId: UserId): Capability {
  const now = new Date().toISOString();
  
  return {
    userId,
    skills: [],
    certifications: [],
    training: [],
    lastAssessed: now,
    overallScore: 0,
    audit: {
      createdAt: now,
      createdBy: userId,
      version: 1,
    },
  };
}

export function getSkillDefinition(skillId: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS.find(s => s.id === skillId);
}

export function getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
  return SKILL_DEFINITIONS.filter(s => s.category === category);
}

export function canVerifySkill(skillId: string, userRole: string): boolean {
  const skill = getSkillDefinition(skillId);
  if (!skill || !skill.requiresVerification) return false;
  
  // Only certain roles can verify skills
  const verifyingRoles = ['lead_moderator', 'regional_coordinator', 'foundation_admin'];
  return verifyingRoles.includes(userRole);
}

export function isSkillExpired(skill: Skill): boolean {
  if (!skill.expiresAt) return false;
  return new Date(skill.expiresAt) <= new Date();
}

export function getSkillStatus(skill: Skill): 'active' | 'expiring' | 'expired' | 'unverified' {
  const def = getSkillDefinition(skill.id);
  if (!skill.verified && (def?.requiresVerification ?? false)) return 'unverified';
  if (!skill.expiresAt) return 'active';
  
  const now = new Date();
  const expires = new Date(skill.expiresAt);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  if (expires <= now) return 'expired';
  if (expires <= thirtyDaysFromNow) return 'expiring';
  return 'active';
}
