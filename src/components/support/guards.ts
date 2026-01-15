/**
 * Response Guards
 * Authority claim guard and prohibited phrase filtering
 * Implements fail-closed behavior for safety
 */

import {
  AUTHORITY_CLAIM_GUARD,
  PROHIBITED_RESPONSES,
} from './companion-config';
import { normalizeText, escapeRegExp } from './text';

// ============================================================================
// TYPES
// ============================================================================

export interface GuardResult {
  clean: string;
  violated: boolean;
  violations: string[];
}

// ============================================================================
// AUTHORITY CLAIM GUARD
// ============================================================================

/**
 * Guard against false authority claims
 * CRITICAL: This is fail-closed - if we detect a claim, we remove it
 */
export function guardAuthorityClaims(text: string): GuardResult {
  const guard = AUTHORITY_CLAIM_GUARD;
  
  // If no guard configured, pass through
  if (!guard?.disallowedClaims?.length) {
    return { clean: text, violated: false, violations: [] };
  }
  
  const violations: string[] = [];
  let output = text;
  
  for (const claim of guard.disallowedClaims) {
    const pattern = new RegExp(escapeRegExp(claim), 'gi');
    
    if (pattern.test(output)) {
      violations.push(claim);
      
      // Replace with safe alternative or remove entirely
      const replacement = guard.correctPhrasing || '';
      output = output.replace(pattern, replacement);
    }
  }
  
  // Clean up any double spaces from removals
  output = output.replace(/\s+/g, ' ').trim();
  
  return {
    clean: output,
    violated: violations.length > 0,
    violations,
  };
}

// ============================================================================
// PROHIBITED PHRASES GUARD
// ============================================================================

/**
 * Guard against prohibited response phrases
 * Fail-closed: removes prohibited content rather than passing it through
 */
export function guardProhibitedPhrases(text: string): GuardResult {
  const prohibited = PROHIBITED_RESPONSES;
  
  // Check if we have prohibited content configured
  if (!prohibited?.patterns?.length && !prohibited?.phrases?.length) {
    return { clean: text, violated: false, violations: [] };
  }
  
  const violations: string[] = [];
  let output = text;
  const normalized = normalizeText(text);
  
  // Check patterns
  for (const pattern of prohibited.patterns || []) {
    const normalizedPattern = normalizeText(pattern);
    if (normalized.includes(normalizedPattern)) {
      violations.push(pattern);
      
      // Remove the pattern (case-insensitive)
      const regex = new RegExp(escapeRegExp(pattern), 'gi');
      output = output.replace(regex, '');
    }
  }
  
  // Check phrases
  for (const phrase of prohibited.phrases || []) {
    const normalizedPhrase = normalizeText(phrase);
    if (normalized.includes(normalizedPhrase)) {
      violations.push(phrase);
      
      // Remove the phrase (case-insensitive)
      const regex = new RegExp(escapeRegExp(phrase), 'gi');
      output = output.replace(regex, '');
    }
  }
  
  // Clean up artifacts
  output = output
    .replace(/\s+/g, ' ')       // collapse whitespace
    .replace(/\s+\./g, '.')      // fix space before period
    .replace(/\s+,/g, ',')       // fix space before comma
    .replace(/\.\./g, '.')       // fix double periods
    .replace(/,,/g, ',')         // fix double commas
    .trim();
  
  return {
    clean: output,
    violated: violations.length > 0,
    violations,
  };
}

// ============================================================================
// REPLACEMENT DEFINITIONS
// ============================================================================

const SOFT_REPLACEMENTS: Record<string, string> = {
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
};

/**
 * Apply soft replacements for prohibited phrases
 * Use when you want to transform rather than just remove
 */
export function applySoftReplacements(text: string): string {
  let output = text;
  
  for (const [prohibited, replacement] of Object.entries(SOFT_REPLACEMENTS)) {
    const regex = new RegExp(escapeRegExp(prohibited), 'gi');
    output = output.replace(regex, replacement);
  }
  
  return output.trim();
}

// ============================================================================
// COMBINED GUARD
// ============================================================================

/**
 * Run all guards in sequence
 * Fail-closed: any violation results in cleaned output
 */
export function runAllGuards(text: string): GuardResult {
  const allViolations: string[] = [];
  let output = text;
  
  // Authority claims first (most critical)
  const authResult = guardAuthorityClaims(output);
  output = authResult.clean;
  allViolations.push(...authResult.violations);
  
  // Then prohibited phrases
  const phraseResult = guardProhibitedPhrases(output);
  output = phraseResult.clean;
  allViolations.push(...phraseResult.violations);
  
  // Apply soft replacements for better UX
  output = applySoftReplacements(output);
  
  // Log violations for monitoring (never expose to user)
  if (allViolations.length > 0) {
    console.warn('[GUARD] Violations detected:', allViolations);
  }
  
  return {
    clean: output,
    violated: allViolations.length > 0,
    violations: allViolations,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if text contains any prohibited content
 * Quick check without modification
 */
export function containsProhibitedContent(text: string): boolean {
  const normalized = normalizeText(text);
  
  // Check authority claims
  const authClaims = AUTHORITY_CLAIM_GUARD?.disallowedClaims || [];
  for (const claim of authClaims) {
    if (normalized.includes(normalizeText(claim))) {
      return true;
    }
  }
  
  // Check patterns
  for (const pattern of PROHIBITED_RESPONSES?.patterns || []) {
    if (normalized.includes(normalizeText(pattern))) {
      return true;
    }
  }
  
  // Check phrases
  for (const phrase of PROHIBITED_RESPONSES?.phrases || []) {
    if (normalized.includes(normalizeText(phrase))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate response before sending
 * Returns validation result with details
 */
export function validateResponse(text: string): {
  valid: boolean;
  issues: string[];
  cleaned: string;
} {
  const issues: string[] = [];
  
  // Run guards
  const guardResult = runAllGuards(text);
  
  if (guardResult.violated) {
    issues.push(`Prohibited content removed: ${guardResult.violations.join(', ')}`);
  }
  
  // Check for empty result
  if (!guardResult.clean.trim()) {
    issues.push('Response was empty after cleaning');
  }
  
  // Check for very short result (might have lost context)
  if (guardResult.clean.length < 20 && text.length > 100) {
    issues.push('Response significantly shortened by guards');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    cleaned: guardResult.clean,
  };
}
