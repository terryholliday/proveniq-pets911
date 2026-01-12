/**
 * 50/50 HUMAN-AI MODERATION POLICY
 * 
 * Revised safety policy to prevent emotional tragedies
 * AI systems assist but humans make final decisions on high-stakes content
 */

export interface ModerationPolicy {
  version: string;
  effectiveDate: string;
  humanReviewRequired: boolean;
  aiAssistanceLevel: number; // 0-100
  highStakesThreshold: number;
}

export const MODERATION_POLICY_50_50: ModerationPolicy = {
  version: '2.0.0',
  effectiveDate: '2026-01-12',
  humanReviewRequired: true,
  aiAssistanceLevel: 50, // 50% AI assistance, 50% human judgment
  highStakesThreshold: 0.7, // 70% confidence requires human review
};

// High-stakes content categories that ALWAYS require human review
export const HIGH_STAKES_CATEGORIES = [
  'pet_match_suggestions',
  'emergency_reports', 
  'injured_animals',
  'missing_pet_reports',
  'volunteer_applications',
  'fraud_escalations',
  'crisis_interventions',
] as const;

// Content that can be auto-approved with AI assistance
export const AUTO_APPROVE_CATEGORIES = [
  'general_inquiries',
  'non_urgent_information',
  'community_posts',
  'volunteer_general_availability',
] as const;

export interface ModerationDecision {
  contentId: string;
  category: string;
  aiConfidence: number;
  humanReviewed: boolean;
  finalDecision: 'approve' | 'reject' | 'escalate';
  reviewerId?: string;
  aiRecommendation?: string;
  humanNotes?: string;
}

export function requiresHumanReview(
  category: string, 
  aiConfidence: number,
  policy: ModerationPolicy = MODERATION_POLICY_50_50
): boolean {
  // Always require human review for high-stakes categories
  if (HIGH_STAKES_CATEGORIES.includes(category as any)) {
    return true;
  }
  
  // Require human review if AI confidence is below threshold
  if (aiConfidence < policy.highStakesThreshold) {
    return true;
  }
  
  // Random 50% sampling for additional safety
  return Math.random() < 0.5;
}

export function getModerationPath(
  category: string,
  aiConfidence: number
): {
  requiresHuman: boolean;
  canAutoApprove: boolean;
  escalationLevel: 'low' | 'medium' | 'high' | 'critical';
} {
  const requiresHuman = requiresHumanReview(category, aiConfidence);
  const canAutoApprove = AUTO_APPROVE_CATEGORIES.includes(category as any) && !requiresHuman;
  
  let escalationLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  if (HIGH_STAKES_CATEGORIES.includes(category as any)) {
    escalationLevel = category.includes('emergency') || category.includes('injured') ? 'critical' : 'high';
  } else if (aiConfidence < 0.5) {
    escalationLevel = 'medium';
  }
  
  return {
    requiresHuman,
    canAutoApprove,
    escalationLevel,
  };
}

// Safety check for emotional content
export function containsEmotionalTriggers(content: string): boolean {
  const emotionalKeywords = [
    'family member', 'child', 'baby', 'dying', 'death', 'killed', 
    'suffering', 'pain', 'crying', 'heartbroken', 'devastated',
    'emergency', 'critical', 'life-threatening', 'last chance'
  ];
  
  return emotionalKeywords.some(keyword => 
    content.toLowerCase().includes(keyword)
  );
}

export function applySafetyOverrides(
  category: string,
  content: string,
  aiConfidence: number
): {
  requiresHuman: boolean;
  reason: string;
} {
  // Emotional content always needs human review
  if (containsEmotionalTriggers(content)) {
    return {
      requiresHuman: true,
      reason: 'Emotional content detected - human review required for safety'
    };
  }
  
  // Pet matches always need human review to prevent false hope
  if (category === 'pet_match_suggestions') {
    return {
      requiresHuman: true,
      reason: 'Pet match suggestions require human verification to prevent false hope'
    };
  }
  
  // Emergency reports always need human review
  if (category === 'emergency_reports') {
    return {
      requiresHuman: true,
      reason: 'Emergency content requires immediate human review'
    };
  }
  
  return {
    requiresHuman: requiresHumanReview(category, aiConfidence),
    reason: aiConfidence < MODERATION_POLICY_50_50.highStakesThreshold 
      ? 'AI confidence below threshold' 
      : 'Standard 50/50 human-AI review process'
  };
}
