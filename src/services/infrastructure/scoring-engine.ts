/**
 * SCORING ENGINE - Deterministic Scoring for Applications & Verification
 * 
 * All scoring logic is deterministic and auditable.
 * No randomness, no ML black boxes for critical decisions.
 * 
 * CONSTRAINTS:
 * - Every score calculation must be reproducible
 * - Score breakdowns logged for audit
 * - Thresholds are configurable but changes are audited
 */

// ═══════════════════════════════════════════════════════════════════
// SCORE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ScoreBreakdown {
  category: string;
  item: string;
  basePoints: number;
  multiplier: number;
  finalPoints: number;
  notes?: string;
}

export interface ScoringResult {
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  breakdown: ScoreBreakdown[];
  meetsThreshold: boolean;
  thresholdUsed: number;
  calculatedAt: string;
  algorithm: string;
  version: string;
}

export interface ScoringRule {
  id: string;
  category: string;
  item: string;
  basePoints: number;
  multiplierConditions?: MultiplierCondition[];
  maxPoints?: number;
}

export interface MultiplierCondition {
  condition: string;
  multiplier: number;
  description: string;
}

// ═══════════════════════════════════════════════════════════════════
// APPLICATION SCORING (Phase 1 Auto-Triage)
// ═══════════════════════════════════════════════════════════════════

export interface ApplicationScoreInput {
  hasRequiredDocuments: boolean;
  hasValidEmail: boolean;
  hasValidPhone: boolean;
  ageVerified: boolean;
  isOver18: boolean;
  agreedToCodeOfConduct: boolean;
  agreedToBackgroundCheck: boolean;
  agreedToTerms: boolean;
  hasTransportation: boolean;
  hasDriversLicense: boolean;
  regionAvailable: boolean;
  roleAvailable: boolean;
  previousVolunteerExperience: boolean;
  animalHandlingExperience: boolean;
  professionalBackground?: 'veterinary' | 'animal_shelter' | 'rescue' | 'training' | 'other' | 'none';
  referenceCount: number;
  completedInitialQuestionnaire: boolean;
}

const APPLICATION_SCORING_RULES: ScoringRule[] = [
  { id: 'required_docs', category: 'Documentation', item: 'Required Documents Submitted', basePoints: 10 },
  { id: 'valid_email', category: 'Contact', item: 'Valid Email', basePoints: 5 },
  { id: 'valid_phone', category: 'Contact', item: 'Valid Phone', basePoints: 5 },
  { id: 'age_verified', category: 'Eligibility', item: 'Age Verified', basePoints: 10 },
  { id: 'over_18', category: 'Eligibility', item: 'Over 18', basePoints: 10 },
  { id: 'code_of_conduct', category: 'Agreements', item: 'Code of Conduct Agreed', basePoints: 10 },
  { id: 'bg_check_consent', category: 'Agreements', item: 'Background Check Consent', basePoints: 10 },
  { id: 'terms_agreed', category: 'Agreements', item: 'Terms Agreed', basePoints: 5 },
  { id: 'transportation', category: 'Capabilities', item: 'Has Transportation', basePoints: 5 },
  { id: 'drivers_license', category: 'Capabilities', item: 'Has Drivers License', basePoints: 5 },
  { id: 'region_available', category: 'Availability', item: 'Region Available', basePoints: 10 },
  { id: 'role_available', category: 'Availability', item: 'Role Available', basePoints: 5 },
  { id: 'volunteer_exp', category: 'Experience', item: 'Previous Volunteer Experience', basePoints: 5 },
  { id: 'animal_exp', category: 'Experience', item: 'Animal Handling Experience', basePoints: 5 },
  { id: 'professional_bg', category: 'Experience', item: 'Professional Background', basePoints: 0, maxPoints: 15 },
  { id: 'references', category: 'References', item: 'References Provided', basePoints: 0, maxPoints: 15 },
  { id: 'questionnaire', category: 'Completion', item: 'Initial Questionnaire', basePoints: 5 },
];

export function calculateApplicationScore(input: ApplicationScoreInput): ScoringResult {
  const breakdown: ScoreBreakdown[] = [];
  let totalScore = 0;
  let maxPossible = 0;

  const addScore = (ruleId: string, earned: boolean, customPoints?: number): void => {
    const rule = APPLICATION_SCORING_RULES.find(r => r.id === ruleId);
    if (!rule) return;

    const points = customPoints ?? rule.basePoints;
    const maxPoints = rule.maxPoints ?? rule.basePoints;
    maxPossible += maxPoints;

    if (earned) {
      totalScore += points;
      breakdown.push({
        category: rule.category,
        item: rule.item,
        basePoints: rule.basePoints,
        multiplier: 1,
        finalPoints: points,
      });
    } else {
      breakdown.push({
        category: rule.category,
        item: rule.item,
        basePoints: rule.basePoints,
        multiplier: 0,
        finalPoints: 0,
        notes: 'Not met',
      });
    }
  };

  addScore('required_docs', input.hasRequiredDocuments);
  addScore('valid_email', input.hasValidEmail);
  addScore('valid_phone', input.hasValidPhone);
  addScore('age_verified', input.ageVerified);
  addScore('over_18', input.isOver18);
  addScore('code_of_conduct', input.agreedToCodeOfConduct);
  addScore('bg_check_consent', input.agreedToBackgroundCheck);
  addScore('terms_agreed', input.agreedToTerms);
  addScore('transportation', input.hasTransportation);
  addScore('drivers_license', input.hasDriversLicense);
  addScore('region_available', input.regionAvailable);
  addScore('role_available', input.roleAvailable);
  addScore('volunteer_exp', input.previousVolunteerExperience);
  addScore('animal_exp', input.animalHandlingExperience);

  // Professional background scoring
  const professionalPoints = input.professionalBackground === 'veterinary' ? 15
    : input.professionalBackground === 'animal_shelter' ? 12
    : input.professionalBackground === 'rescue' ? 10
    : input.professionalBackground === 'training' ? 8
    : input.professionalBackground === 'other' ? 3
    : 0;
  addScore('professional_bg', professionalPoints > 0, professionalPoints);

  // Reference scoring (5 points per reference, max 15)
  const referencePoints = Math.min(input.referenceCount * 5, 15);
  addScore('references', referencePoints > 0, referencePoints);

  addScore('questionnaire', input.completedInitialQuestionnaire);

  const percentageScore = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
  const threshold = 70; // 70% required for P1 auto-approval

  return {
    totalScore,
    maxPossibleScore: maxPossible,
    percentageScore,
    breakdown,
    meetsThreshold: percentageScore >= threshold,
    thresholdUsed: threshold,
    calculatedAt: new Date().toISOString(),
    algorithm: 'ApplicationScoreV1',
    version: '1.0.0',
  };
}

// ═══════════════════════════════════════════════════════════════════
// OWNERSHIP VERIFICATION SCORING
// ═══════════════════════════════════════════════════════════════════

export type EvidenceType =
  | 'microchip_match'
  | 'license_registration'
  | 'vet_records'
  | 'adoption_papers'
  | 'purchase_receipt'
  | 'photos_with_pet'
  | 'video_with_pet'
  | 'pet_knowledge_test'
  | 'neighbor_testimony'
  | 'social_media_posts'
  | 'collar_tag_match'
  | 'distinctive_marking_description'
  | 'government_id_verified'
  | 'address_verified';

export interface EvidenceItem {
  type: EvidenceType;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  documentUrl?: string;
  notes?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface OwnershipScoreInput {
  evidence: EvidenceItem[];
  claimantIdentityVerified: boolean;
  claimantAddressVerified: boolean;
  timeSinceReportDays: number;
  petDistinctiveMarkingsMatched: boolean;
  behaviorTestPassed?: boolean;
}

const EVIDENCE_POINTS: Record<EvidenceType, { base: number; verified: number }> = {
  microchip_match: { base: 0, verified: 40 },
  license_registration: { base: 5, verified: 25 },
  vet_records: { base: 10, verified: 20 },
  adoption_papers: { base: 10, verified: 25 },
  purchase_receipt: { base: 5, verified: 15 },
  photos_with_pet: { base: 5, verified: 10 },
  video_with_pet: { base: 5, verified: 12 },
  pet_knowledge_test: { base: 0, verified: 15 },
  neighbor_testimony: { base: 3, verified: 8 },
  social_media_posts: { base: 2, verified: 5 },
  collar_tag_match: { base: 5, verified: 15 },
  distinctive_marking_description: { base: 5, verified: 10 },
  government_id_verified: { base: 0, verified: 10 },
  address_verified: { base: 0, verified: 5 },
};

const RELEASE_THRESHOLD = 80; // 80 points required for animal release

export function calculateOwnershipScore(input: OwnershipScoreInput): ScoringResult {
  const breakdown: ScoreBreakdown[] = [];
  let totalScore = 0;

  // Calculate evidence scores
  for (const item of input.evidence) {
    const pointConfig = EVIDENCE_POINTS[item.type];
    const points = item.verified ? pointConfig.verified : pointConfig.base;
    
    const confidenceMultiplier = item.verified
      ? (item.confidence === 'high' ? 1.0 : item.confidence === 'medium' ? 0.8 : 0.6)
      : 0.5;

    const finalPoints = Math.round(points * confidenceMultiplier);
    totalScore += finalPoints;

    breakdown.push({
      category: 'Evidence',
      item: formatEvidenceType(item.type),
      basePoints: points,
      multiplier: confidenceMultiplier,
      finalPoints,
      notes: item.verified ? `Verified: ${item.confidence}` : 'Unverified',
    });
  }

  // Identity verification bonus
  if (input.claimantIdentityVerified) {
    totalScore += 10;
    breakdown.push({
      category: 'Identity',
      item: 'Government ID Verified',
      basePoints: 10,
      multiplier: 1,
      finalPoints: 10,
    });
  }

  // Address verification bonus
  if (input.claimantAddressVerified) {
    totalScore += 5;
    breakdown.push({
      category: 'Identity',
      item: 'Address Verified',
      basePoints: 5,
      multiplier: 1,
      finalPoints: 5,
    });
  }

  // Distinctive markings match
  if (input.petDistinctiveMarkingsMatched) {
    totalScore += 10;
    breakdown.push({
      category: 'Physical Match',
      item: 'Distinctive Markings Match',
      basePoints: 10,
      multiplier: 1,
      finalPoints: 10,
    });
  }

  // Behavior test
  if (input.behaviorTestPassed) {
    totalScore += 15;
    breakdown.push({
      category: 'Behavior',
      item: 'Pet Recognition Test Passed',
      basePoints: 15,
      multiplier: 1,
      finalPoints: 15,
    });
  }

  // Time decay penalty (reduces score for very old claims)
  if (input.timeSinceReportDays > 30) {
    const decayPenalty = Math.min(20, Math.floor((input.timeSinceReportDays - 30) / 10) * 2);
    totalScore = Math.max(0, totalScore - decayPenalty);
    breakdown.push({
      category: 'Time',
      item: 'Late Claim Penalty',
      basePoints: -decayPenalty,
      multiplier: 1,
      finalPoints: -decayPenalty,
      notes: `${input.timeSinceReportDays} days since report`,
    });
  }

  return {
    totalScore,
    maxPossibleScore: 150, // Theoretical max
    percentageScore: (totalScore / 150) * 100,
    breakdown,
    meetsThreshold: totalScore >= RELEASE_THRESHOLD,
    thresholdUsed: RELEASE_THRESHOLD,
    calculatedAt: new Date().toISOString(),
    algorithm: 'OwnershipScoreV1',
    version: '1.0.0',
  };
}

function formatEvidenceType(type: EvidenceType): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ═══════════════════════════════════════════════════════════════════
// ASSESSMENT GRADING (Training)
// ═══════════════════════════════════════════════════════════════════

export interface AssessmentAnswer {
  questionId: string;
  selectedOptionIds: string[];
  timeSpentSeconds: number;
}

export interface QuestionGrade {
  questionId: string;
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
  selectedOptionIds: string[];
  correctOptionIds: string[];
}

export interface AssessmentGradeResult {
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  passed: boolean;
  passingThreshold: number;
  questionGrades: QuestionGrade[];
  gradedAt: string;
  timeSpentMinutes: number;
}

export interface QuestionDefinition {
  id: string;
  type: 'single_select' | 'multiple_select' | 'true_false';
  points: number;
  correctOptionIds: string[];
  partialCreditAllowed?: boolean;
}

export function gradeAssessment(
  answers: AssessmentAnswer[],
  questions: QuestionDefinition[],
  passingThreshold: number = 80
): AssessmentGradeResult {
  const questionMap = new Map(questions.map(q => [q.id, q]));
  const questionGrades: QuestionGrade[] = [];
  let totalPoints = 0;
  let maxPoints = 0;
  let totalTimeSeconds = 0;

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    maxPoints += question.points;
    totalTimeSeconds += answer.timeSpentSeconds;

    const correctSet = new Set(question.correctOptionIds);
    const selectedSet = new Set(answer.selectedOptionIds);

    let pointsEarned = 0;

    if (question.type === 'multiple_select' && question.partialCreditAllowed) {
      // Partial credit for multiple select
      const correctSelected = answer.selectedOptionIds.filter(id => correctSet.has(id)).length;
      const incorrectSelected = answer.selectedOptionIds.filter(id => !correctSet.has(id)).length;
      const totalCorrect = question.correctOptionIds.length;

      if (incorrectSelected === 0 && correctSelected === totalCorrect) {
        pointsEarned = question.points;
      } else if (incorrectSelected === 0) {
        pointsEarned = Math.floor((correctSelected / totalCorrect) * question.points * 0.5);
      }
    } else {
      // All or nothing
      const isCorrect = correctSet.size === selectedSet.size &&
        Array.from(correctSet).every(id => selectedSet.has(id));
      
      if (isCorrect) {
        pointsEarned = question.points;
      }
    }

    totalPoints += pointsEarned;

    questionGrades.push({
      questionId: answer.questionId,
      correct: pointsEarned === question.points,
      pointsEarned,
      pointsPossible: question.points,
      selectedOptionIds: answer.selectedOptionIds,
      correctOptionIds: question.correctOptionIds,
    });
  }

  const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

  return {
    totalPoints,
    maxPoints,
    percentage,
    passed: percentage >= passingThreshold,
    passingThreshold,
    questionGrades,
    gradedAt: new Date().toISOString(),
    timeSpentMinutes: Math.ceil(totalTimeSeconds / 60),
  };
}
