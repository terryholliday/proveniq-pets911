/**
 * Pipeline Orchestrator
 * Handles the single decision pipeline: Safety → Grounding → Waiting Room → Lost Pet → Clinical
 * Also handles prohibited response filtering, means redaction, and response sanitization
 */

import {
  TEMPLATES,
  PROHIBITED_RESPONSES,
  PET_LOSS_SUICIDE_FORBIDDEN,
  type RiskTier,
  type TemplateKey,
} from './companion-config';
import {
  type CrisisAssessment,
  isPetLossSuicideCoupling,
  shouldUseLowCognitionMode,
} from './crisis-engine';
import { resolveHotlines, type Region } from './hotline-resolver';

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineContext {
  userMessage: string;
  assessment: CrisisAssessment;
  region: Region;
  sessionFacts: SessionFacts;
  previousAssessment: CrisisAssessment | null;
  isPostCrisis: boolean;
  crisisConfirmed: boolean;
}

export interface SessionFacts {
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  symptom?: string;
  duration?: string;
  lastSeen?: string;
  location?: string;
  userName?: string;
}

export interface PipelineResult {
  response: string;
  templateUsed: string | null;
  mode: ResponseMode;
  showGrounding: boolean;
  groundingType: GroundingType | null;
  showVisualAid: VisualAidType | null;
  showTakeawayCard: TakeawayCardType | null;
  requiresConfirmation: boolean;
  confirmationParaphrase: string | null;
  enterWaitingRoom: boolean;
  enterPostCrisis: boolean;
}

export type ResponseMode = 
  | 'CRITICAL_SAFETY'
  | 'HIGH_SAFETY'
  | 'GROUNDING'
  | 'WAITING_ROOM'
  | 'LOST_PET'
  | 'BYSTANDER'
  | 'SCAM_WARNING'
  | 'POST_CRISIS'
  | 'CLINICAL'
  | 'STANDARD';

export type GroundingType = '5-4-3-2-1' | 'box_breathing' | 'grounding_questions';
export type VisualAidType = 'gum_color_chart' | 'heimlich_diagram' | 'cpr_steps';
export type TakeawayCardType = 'vet_er' | 'lost_pet_flyer' | 'police_report';

// ============================================================================
// MEANS REDACTION
// ============================================================================

const MEANS_PATTERNS = [
  /\b(gun|firearm|pistol|rifle|shotgun)\b/gi,
  /\b(pills?|overdose|medication|meds)\b/gi,
  /\b(rope|hanging|noose)\b/gi,
  /\b(bridge|building|jump|jumping)\b/gi,
  /\b(cutting|slit|wrist|razor)\b/gi,
  /\b(poison|toxic|bleach|chemicals)\b/gi,
];

export function redactMeans(text: string): string {
  let redacted = text;
  MEANS_PATTERNS.forEach(pattern => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });
  return redacted;
}

/**
 * Redact means for logging/storage only - NOT for display
 * As per Gemini's feedback: don't redact in live UI
 */
export function redactForStorage(text: string): string {
  return redactMeans(text);
}

// ============================================================================
// PROHIBITED RESPONSE FILTERING
// ============================================================================

export function containsProhibitedResponse(response: string): boolean {
  const lower = response.toLowerCase();
  
  // Check patterns
  for (const pattern of PROHIBITED_RESPONSES.patterns) {
    if (lower.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  
  // Check phrases
  for (const phrase of PROHIBITED_RESPONSES.phrases) {
    if (lower.includes(phrase.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

export function filterProhibitedContent(response: string): string {
  // Replace prohibited phrases with softer alternatives
  const replacements: Record<string, string> = {
    'you should see a professional': 'support is available when you\'re ready',
    'i am not qualified': 'I\'m here to listen and support you',
    'this is beyond my capabilities': 'let\'s work through this together',
    'you need real help': 'you deserve support',
    'time heals all wounds': 'healing takes time, and that\'s okay',
    'everything happens for a reason': 'this is hard, and your feelings are valid',
    'at least': 'I hear you',
    'you should be grateful': 'your feelings are valid',
    'others have it worse': 'your pain matters',
    'just think positive': 'it\'s okay to feel what you\'re feeling',
    'get over it': 'take all the time you need',
    'move on': 'healing happens at your own pace',
    'as an ai': '',
    'as a language model': '',
    'i cannot': 'I\'m here to help',
    'i am not able': 'let me try another way',
  };
  
  let filtered = response;
  
  for (const [prohibited, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(prohibited, 'gi');
    filtered = filtered.replace(regex, replacement);
  }
  
  return filtered.trim();
}

// ============================================================================
// PET LOSS SUICIDE COUPLING FILTER
// ============================================================================

export function filterPetLossSuicideContent(response: string): string {
  if (!PET_LOSS_SUICIDE_FORBIDDEN) return response;
  
  let filtered = response;
  
  for (const forbidden of PET_LOSS_SUICIDE_FORBIDDEN) {
    const regex = new RegExp(forbidden, 'gi');
    filtered = filtered.replace(regex, '');
  }
  
  return filtered.trim();
}

// ============================================================================
// RESPONSE SANITIZATION
// ============================================================================

export function sanitizeResponse(
  response: string,
  assessment: CrisisAssessment
): string {
  let sanitized = response;
  
  // Filter prohibited content
  sanitized = filterProhibitedContent(sanitized);
  
  // Filter pet loss suicide content if applicable
  if (isPetLossSuicideCoupling(assessment)) {
    sanitized = filterPetLossSuicideContent(sanitized);
  }
  
  // Clean up any double spaces or awkward formatting
  sanitized = sanitized
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .replace(/\s+,/g, ',')
    .trim();
  
  return sanitized;
}

// ============================================================================
// TEMPLATE SELECTION
// ============================================================================

function selectTemplate(
  assessment: CrisisAssessment,
  context: PipelineContext
): { templateKey: TemplateKey | null; mode: ResponseMode } {
  // Priority 1: Waiting room
  if (assessment.waitingRoom) {
    return { templateKey: 'waiting_room' as TemplateKey, mode: 'WAITING_ROOM' };
  }
  
  // Priority 2: Critical safety
  if (assessment.tier === 'CRITICAL') {
    if (assessment.bystander) {
      if (assessment.bystander.isMinor) {
        return { templateKey: 'bystander_minor' as TemplateKey, mode: 'BYSTANDER' };
      }
      return { templateKey: 'bystander_suicide' as TemplateKey, mode: 'BYSTANDER' };
    }
    
    if (assessment.primaryCrisis === 'suicide') {
      if (assessment.markers.some(m => m.includes('ACTIVE') || m.includes('INTENT'))) {
        return { templateKey: 'suicide_active' as TemplateKey, mode: 'CRITICAL_SAFETY' };
      }
      return { templateKey: 'suicide_passive' as TemplateKey, mode: 'HIGH_SAFETY' };
    }
    
    if (assessment.primaryCrisis === 'abuse') {
      return { templateKey: 'abuse' as TemplateKey, mode: 'CRITICAL_SAFETY' };
    }
    
    if (assessment.primaryCrisis === 'emergency') {
      return { templateKey: 'pet_emergency' as TemplateKey, mode: 'CRITICAL_SAFETY' };
    }
  }
  
  // Priority 3: High safety
  if (assessment.tier === 'HIGH') {
    if (assessment.primaryCrisis === 'suicide') {
      return { templateKey: 'suicide_passive' as TemplateKey, mode: 'HIGH_SAFETY' };
    }
    
    if (assessment.primaryCrisis === 'crisis') {
      return { templateKey: 'panic_crisis' as TemplateKey, mode: 'GROUNDING' };
    }
    
    if (assessment.primaryCrisis === 'self_harm') {
      return { templateKey: 'suicide_passive' as TemplateKey, mode: 'HIGH_SAFETY' };
    }
  }
  
  // Priority 4: Grounding for panic/crisis
  if (assessment.requiresGrounding) {
    return { templateKey: 'panic_crisis' as TemplateKey, mode: 'GROUNDING' };
  }
  
  // Priority 5: Post-crisis mode
  if (context.isPostCrisis) {
    return { templateKey: 'post_crisis' as TemplateKey, mode: 'POST_CRISIS' };
  }
  
  // Priority 6: Scam warning
  if (assessment.primaryCrisis === 'scam') {
    return { templateKey: 'scam_warning' as TemplateKey, mode: 'SCAM_WARNING' };
  }
  
  // Priority 7: Lost pet
  if (assessment.primaryCrisis === 'lost_pet') {
    return { templateKey: 'lost_pet' as TemplateKey, mode: 'LOST_PET' };
  }
  
  // Priority 8: Pet loss/grief
  if (assessment.primaryCrisis === 'death' || assessment.primaryCrisis === 'anticipatory') {
    return { templateKey: 'pet_loss' as TemplateKey, mode: 'CLINICAL' };
  }
  
  // Priority 9: Pet emergency (non-critical)
  if (assessment.primaryCrisis === 'emergency') {
    return { templateKey: 'pet_emergency' as TemplateKey, mode: 'CLINICAL' };
  }
  
  // Default: Standard clinical response
  return { templateKey: null, mode: 'STANDARD' };
}

// ============================================================================
// CONFIRMATION PARAPHRASE GENERATION
// ============================================================================

function generateConfirmationParaphrase(
  userMessage: string,
  primaryCrisis: string | null
): string {
  // Simple paraphrase for confirmation
  const crisisDescriptions: Record<string, string> = {
    suicide: 'you\'re having thoughts of ending your life',
    self_harm: 'you\'re thinking about hurting yourself',
    abuse: 'someone is hurting you or threatening your safety',
    emergency: 'your pet is having a medical emergency',
  };
  
  return crisisDescriptions[primaryCrisis || ''] || 
    'you\'re going through something very difficult right now';
}

// ============================================================================
// VISUAL AID DETERMINATION
// ============================================================================

function determineVisualAid(
  userMessage: string,
  assessment: CrisisAssessment
): VisualAidType | null {
  const lower = userMessage.toLowerCase();
  
  if (assessment.primaryCrisis === 'emergency') {
    if (lower.includes('choking') || lower.includes('cant breathe') || lower.includes("can't breathe")) {
      return 'heimlich_diagram';
    }
    if (lower.includes('gum') || lower.includes('pale') || lower.includes('color')) {
      return 'gum_color_chart';
    }
    if (lower.includes('cpr') || lower.includes('not breathing') || lower.includes('heart')) {
      return 'cpr_steps';
    }
  }
  
  return null;
}

// ============================================================================
// TAKEAWAY CARD DETERMINATION
// ============================================================================

function determineTakeawayCard(
  userMessage: string,
  assessment: CrisisAssessment,
  sessionFacts: SessionFacts
): TakeawayCardType | null {
  const lower = userMessage.toLowerCase();
  
  // Heading to vet
  if (
    (lower.includes('heading to') || lower.includes('on my way') || lower.includes('driving to')) &&
    (lower.includes('vet') || lower.includes('emergency') || lower.includes('hospital'))
  ) {
    if (sessionFacts.petName || sessionFacts.symptom) {
      return 'vet_er';
    }
  }
  
  // Lost pet flyer
  if (
    assessment.primaryCrisis === 'lost_pet' &&
    (lower.includes('flyer') || lower.includes('poster') || lower.includes('share'))
  ) {
    return 'lost_pet_flyer';
  }
  
  return null;
}

// ============================================================================
// GROUNDING TYPE DETERMINATION
// ============================================================================

function determineGroundingType(assessment: CrisisAssessment): GroundingType | null {
  if (!assessment.requiresGrounding) return null;
  
  // For panic attacks, start with box breathing
  if (assessment.markers.some(m => m.includes('PANIC') || m.includes('CRISIS'))) {
    return 'box_breathing';
  }
  
  // For general distress, use 5-4-3-2-1
  return '5-4-3-2-1';
}

// ============================================================================
// POST-CRISIS LENGTH ENFORCEMENT
// ============================================================================

function enforcePostCrisisLimits(response: string): string {
  const maxLength = 200;
  
  if (response.length > maxLength) {
    // Find a good break point
    const truncated = response.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('. ');
    
    if (lastSentence > maxLength * 0.6) {
      return truncated.substring(0, lastSentence + 1);
    }
    
    return truncated + '...';
  }
  
  return response;
}

// ============================================================================
// LOW COGNITION MODE TRANSFORMATION
// ============================================================================

function transformToLowCognition(response: string, templateKey: TemplateKey | null): string {
  // If template has a low cognition variant, use it
  if (templateKey && TEMPLATES[templateKey]?.lowCognitionVariant) {
    return TEMPLATES[templateKey].lowCognitionVariant!;
  }
  
  // Otherwise, simplify the response
  // Remove markdown formatting
  let simplified = response
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '');
  
  // Shorten sentences
  const sentences = simplified.split(/(?<=[.!?])\s+/);
  const shortSentences = sentences.slice(0, 3);
  
  return shortSentences.join(' ');
}

// ============================================================================
// NIGHTTIME ADJUSTMENT
// ============================================================================

function isNighttime(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
}

function addNighttimeContext(response: string, tier: RiskTier): string {
  if (!isNighttime()) return response;
  
  if (tier === 'CRITICAL' || tier === 'HIGH') {
    return response + '\n\nI see it\'s late. If this is urgent, please call now. I\'m here.';
  }
  
  return response;
}

// ============================================================================
// MAIN PIPELINE FUNCTION
// ============================================================================

export function processPipeline(context: PipelineContext): PipelineResult {
  const { assessment, region, sessionFacts, isPostCrisis, crisisConfirmed } = context;
  
  // Select template and mode
  const { templateKey, mode } = selectTemplate(assessment, context);
  
  // Build response
  let response: string;
  
  if (templateKey && TEMPLATES[templateKey]) {
    response = TEMPLATES[templateKey].response;
    
    // Resolve hotline placeholders
    response = resolveHotlines(response, region);
  } else {
    // No template - will need clinical response generation
    response = '';
  }
  
  // Check if confirmation needed for CRITICAL (before transformation)
  const requiresConfirmation = 
    assessment.tier === 'CRITICAL' && 
    !crisisConfirmed &&
    !assessment.waitingRoom;
  
  let confirmationParaphrase: string | null = null;
  if (requiresConfirmation) {
    confirmationParaphrase = generateConfirmationParaphrase(
      context.userMessage,
      assessment.primaryCrisis
    );
  }
  
  // Apply transformations
  if (shouldUseLowCognitionMode(assessment) && response) {
    response = transformToLowCognition(response, templateKey);
  }
  
  if (isPostCrisis && response) {
    response = enforcePostCrisisLimits(response);
    response = 'I\'m glad you\'re still here. ' + response;
  }
  
  // Add nighttime context
  response = addNighttimeContext(response, assessment.tier);
  
  // Sanitize
  if (response) {
    response = sanitizeResponse(response, assessment);
  }
  
  // Determine supporting elements
  const showGrounding = assessment.requiresGrounding && !assessment.waitingRoom;
  const groundingType = determineGroundingType(assessment);
  const showVisualAid = determineVisualAid(context.userMessage, assessment);
  const showTakeawayCard = determineTakeawayCard(context.userMessage, assessment, sessionFacts);
  
  // Determine mode transitions
  const enterWaitingRoom = assessment.waitingRoom;
  const enterPostCrisis = 
    context.previousAssessment?.tier === 'CRITICAL' && 
    assessment.tier !== 'CRITICAL';
  
  return {
    response,
    templateUsed: templateKey,
    mode,
    showGrounding,
    groundingType,
    showVisualAid,
    showTakeawayCard,
    requiresConfirmation,
    confirmationParaphrase,
    enterWaitingRoom,
    enterPostCrisis,
  };
}

// ============================================================================
// HANDOFF PACKET GENERATION
// ============================================================================

export interface HandoffPacket {
  timestamp: string;
  riskTier: RiskTier;
  markersDetected: string[];
  conversationSummary: string;
  userRegion: string;
  sessionDurationMinutes: number;
  volatilityTrend: string;
  primaryCrisis: string | null;
}

export function generateHandoffPacket(
  assessment: CrisisAssessment,
  messageCount: number,
  region: Region,
  sessionStartTime: Date
): HandoffPacket {
  const durationMs = Date.now() - sessionStartTime.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  
  // Create summary without PII
  const summary = `${messageCount} messages exchanged. Primary concern: ${assessment.primaryCrisis || 'general'}. Risk tier: ${assessment.tier}.`;
  
  return {
    timestamp: new Date().toISOString(),
    riskTier: assessment.tier,
    markersDetected: assessment.markers,
    conversationSummary: summary,
    userRegion: region,
    sessionDurationMinutes: durationMinutes,
    volatilityTrend: assessment.volatility,
    primaryCrisis: assessment.primaryCrisis,
  };
}
