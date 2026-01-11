/**
 * RANSOMWARE DETECTION PATTERNS
 * 
 * AI-driven pattern matching for common pet scam scripts.
 * Auto-bans actors instantly across the entire network.
 */

import type { ScamPattern, ScamPatternType } from './types';

export const SCAM_PATTERNS: ScamPattern[] = [
  // ═══════════════════════════════════════════════════════════════════
  // CASH DEMAND PATTERNS - "I have your dog, send money"
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'CASH_DEMAND',
    patterns: [
      /i\s+(have|found|got)\s+(your|the)\s+(dog|cat|pet).*(pay|money|cash|send)/i,
      /pay\s*(me|us)?\s*\$?\d+.*get\s*(your|the)\s*(dog|cat|pet)\s*back/i,
      /want\s*(your|the)\s*(dog|cat|pet)\s*back\??\s*(pay|send|transfer)/i,
      /\$\d+.*or\s*(you('ll)?|you\s*will)\s*(never|not)\s*see/i,
      /(ransom|reward|fee)\s*(of|for)?\s*\$\d+/i,
    ],
    severity: 'CRITICAL',
    autoAction: 'BAN',
  },

  // ═══════════════════════════════════════════════════════════════════
  // PAYMENT APP REQUESTS - Zelle, CashApp, Venmo
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'PAYMENT_APP_REQUEST',
    patterns: [
      /send\s*(me|us)?\s*(via|through|on|to)?\s*(zelle|cashapp|cash\s*app|venmo|paypal)/i,
      /(zelle|cashapp|cash\s*app|venmo|paypal)\s*(me|us)?\s*\$?\d+/i,
      /my\s*(zelle|cashapp|venmo|paypal)\s*(is|:)/i,
      /(transfer|send)\s*\$?\d+\s*(to|via)\s*(zelle|cashapp|venmo)/i,
      /friends\s*and\s*family\s*(payment|transfer)/i,
    ],
    severity: 'HIGH',
    autoAction: 'BLOCK',
  },

  // ═══════════════════════════════════════════════════════════════════
  // WIRE TRANSFER / WESTERN UNION
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'WIRE_TRANSFER',
    patterns: [
      /(wire|transfer)\s*(money|funds|payment)/i,
      /western\s*union/i,
      /money\s*gram/i,
      /bank\s*transfer.*\$\d+/i,
      /routing\s*number/i,
    ],
    severity: 'CRITICAL',
    autoAction: 'BAN',
  },

  // ═══════════════════════════════════════════════════════════════════
  // GIFT CARD SCAMS
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'GIFT_CARD',
    patterns: [
      /gift\s*card/i,
      /(itunes|google\s*play|amazon|steam)\s*(card|code)/i,
      /buy\s*(me|us)?\s*\d*\s*(gift|prepaid)\s*card/i,
      /send\s*(me|us)?\s*(the)?\s*(gift\s*)?card\s*(number|code)/i,
    ],
    severity: 'CRITICAL',
    autoAction: 'BAN',
  },

  // ═══════════════════════════════════════════════════════════════════
  // CRYPTOCURRENCY
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'CRYPTOCURRENCY',
    patterns: [
      /(bitcoin|btc|ethereum|eth|crypto)/i,
      /wallet\s*address/i,
      /send\s*(to)?\s*(my|this)\s*wallet/i,
      /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/, // Bitcoin address pattern
    ],
    severity: 'CRITICAL',
    autoAction: 'BAN',
  },

  // ═══════════════════════════════════════════════════════════════════
  // SHIPPING/TRANSPORT FEE SCAMS
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'SHIPPING_FEE',
    patterns: [
      /(shipping|transport|delivery)\s*(fee|cost|charge)/i,
      /flight\s*nanny/i,
      /pay\s*(for)?\s*(the)?\s*(shipping|transport)/i,
      /(different|another)\s*(state|city|country).*\$\d+/i,
      /insurance\s*(fee|deposit)/i,
    ],
    severity: 'HIGH',
    autoAction: 'BLOCK',
  },

  // ═══════════════════════════════════════════════════════════════════
  // VERIFICATION CODE THEFT (Google Voice scam)
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'VERIFICATION_CODE',
    patterns: [
      /verification\s*(code|number)/i,
      /send\s*(me|us)?\s*(the)?\s*code/i,
      /google\s*voice/i,
      /verify\s*(you('re)?|your|that\s*you)/i,
      /prove\s*(you('re)?|your|that\s*you)/i,
      /code\s*to\s*verify/i,
      /what('s)?\s*(the|your)\s*code/i,
    ],
    severity: 'HIGH',
    autoAction: 'BLOCK',
  },

  // ═══════════════════════════════════════════════════════════════════
  // URGENCY PRESSURE TACTICS
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'URGENCY_PRESSURE',
    patterns: [
      /(act|respond|pay)\s*(now|immediately|right\s*now|asap)/i,
      /only\s*have\s*\d+\s*(hour|minute)/i,
      /(deadline|time\s*limit|limited\s*time)/i,
      /before\s*(it('s)?|I)\s*(too\s*late|gone|give\s*away)/i,
      /last\s*chance/i,
    ],
    severity: 'MEDIUM',
    autoAction: 'FLAG',
  },

  // ═══════════════════════════════════════════════════════════════════
  // VAGUE THREATS
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'VAGUE_THREAT',
    patterns: [
      /never\s*see\s*(your|the)\s*(dog|cat|pet)\s*again/i,
      /(something|bad\s*things?)\s*(will|might)\s*happen/i,
      /don('t|t)\s*call\s*(the)?\s*(police|cops|authorities)/i,
      /keep\s*this\s*between\s*us/i,
      /if\s*you\s*tell\s*anyone/i,
    ],
    severity: 'CRITICAL',
    autoAction: 'BAN',
  },

  // ═══════════════════════════════════════════════════════════════════
  // RANSOM DEMAND
  // ═══════════════════════════════════════════════════════════════════
  {
    type: 'RANSOM_DEMAND',
    patterns: [
      /ransom/i,
      /holding\s*(your|the)\s*(dog|cat|pet)/i,
      /pay\s*(up|now).*or\s*else/i,
      /\$\d+.*no\s*(cops|police)/i,
      /we\s*(have|got)\s*(your|the)\s*(dog|cat|pet)/i,
    ],
    severity: 'CRITICAL',
    autoAction: 'BAN',
  },
];

/**
 * Analyze a message for scam patterns
 */
export function analyzeMessageForScams(
  content: string
): { isSuspicious: boolean; matches: Array<{ type: ScamPatternType; matchedText: string; severity: string; confidence: number }> } {
  const matches: Array<{ type: ScamPatternType; matchedText: string; severity: string; confidence: number }> = [];

  for (const pattern of SCAM_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = content.match(regex);
      if (match) {
        matches.push({
          type: pattern.type,
          matchedText: match[0],
          severity: pattern.severity,
          confidence: calculateConfidence(pattern.severity, matches.length),
        });
      }
    }
  }

  // Multiple pattern matches increase suspicion significantly
  const isSuspicious = matches.length > 0;

  return { isSuspicious, matches };
}

/**
 * Determine automatic action based on pattern matches
 */
export function determineAction(
  matches: Array<{ type: ScamPatternType; severity: string }>
): 'ALLOWED' | 'FLAGGED' | 'BLOCKED' | 'USER_BANNED' {
  if (matches.length === 0) return 'ALLOWED';

  const hasCritical = matches.some(m => m.severity === 'CRITICAL');
  const hasHigh = matches.some(m => m.severity === 'HIGH');
  const multipleMatches = matches.length >= 2;

  if (hasCritical || (hasHigh && multipleMatches)) {
    return 'USER_BANNED';
  }

  if (hasHigh) {
    return 'BLOCKED';
  }

  return 'FLAGGED';
}

function calculateConfidence(severity: string, existingMatchCount: number): number {
  const baseConfidence = {
    'CRITICAL': 95,
    'HIGH': 85,
    'MEDIUM': 70,
    'LOW': 50,
  }[severity] || 50;

  // Multiple matches increase confidence
  const boost = Math.min(existingMatchCount * 5, 15);
  return Math.min(baseConfidence + boost, 100);
}
