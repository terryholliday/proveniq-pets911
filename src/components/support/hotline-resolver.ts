/**
 * Hotline Resolver
 * Handles region detection and hotline substitution in templates
 */

import { HOTLINES } from './companion-config';

// ============================================================================
// TYPES
// ============================================================================

export type Region = 'US' | 'UK' | 'CA' | 'AU' | 'ES_US' | 'FR_CA';

// ============================================================================
// REGION DETECTION
// ============================================================================

const REGION_SIGNALS: Record<Region, string[]> = {
  UK: [
    '999', 'nhs', 'rspca', 'samaritans', '£', 'neighbours', 'colour',
    'favour', 'realise', 'centre', 'metre', 'litre', 'programme',
    'mum', 'gp surgery', 'a&e', 'postcode'
  ],
  CA: [
    'rcmp', 'canada', 'canadian', 'cad', 'ontario', 'quebec', 'british columbia',
    'alberta', 'manitoba', 'saskatchewan', 'nova scotia', 'eh?', 'colour',
    'favour', 'centre', 'kilometre', 'spca canada'
  ],
  AU: [
    '000', 'lifeline australia', 'beyond blue', 'australia', 'australian',
    'aud', 'mate', 'g\'day', 'melbourne', 'sydney', 'brisbane', 'perth',
    'adelaide', 'rspca australia', 'nsw', 'victoria', 'queensland'
  ],
  ES_US: [
    'español', 'spanish', 'habla español', 'en español', 'necesito ayuda',
    'emergencia', 'por favor', 'mi mascota', 'perdido', 'perdida',
    'ayuda por favor', 'hablo español'
  ],
  FR_CA: [
    'français', 'french', 'québec', 'montréal', 'parlez-vous français',
    'en français', 'je parle français', 'aide', "s'il vous plaît"
  ],
  US: [], // Default - no specific signals needed
};

/**
 * Detect region from conversation context
 */
export function detectRegion(messages: Array<{ content: string }>): Region {
  const allText = messages.map(m => m.content.toLowerCase()).join(' ');
  
  // Check each region's signals
  for (const [region, signals] of Object.entries(REGION_SIGNALS)) {
    if (region === 'US') continue; // Skip default
    
    const matchCount = signals.filter(s => allText.includes(s)).length;
    
    // Require at least 2 matches for non-US regions
    if (matchCount >= 2) {
      return region as Region;
    }
  }
  
  return 'US';
}

/**
 * Detect region from a single message
 */
export function detectRegionFromText(text: string): Region {
  return detectRegion([{ content: text }]);
}

// ============================================================================
// HOTLINE RESOLUTION
// ============================================================================

/**
 * Resolve hotline placeholders in template text
 * 
 * Supports formats:
 * - {HOTLINES.US.crisis_988} - Specific region
 * - {HOTLINES.{REGION}.crisis_988} - Dynamic region
 * - {HOTLINES.crisis_988} - Uses detected region
 */
export function resolveHotlines(template: string, region: Region): string {
  const hotlines = HOTLINES[region] || HOTLINES.US;
  
  // Replace {HOTLINES.{REGION}.key} patterns
  let resolved = template.replace(
    /\{HOTLINES\.(?:\{REGION\}|(\w+))\.(\w+)\}/g,
    (match, specificRegion, hotlineKey) => {
      const targetRegion = specificRegion || region;
      const regionHotlines = HOTLINES[targetRegion as Region] || HOTLINES.US;
      const candidate =
        (regionHotlines as any)?.[hotlineKey] ?? (HOTLINES.US as any)?.[hotlineKey];
      return typeof candidate === 'string' ? candidate : match;
    }
  );
  
  // Replace {HOTLINES.key} patterns (shorthand for current region)
  resolved = resolved.replace(
    /\{HOTLINES\.(\w+)\}/g,
    (match, hotlineKey) => {
      const candidate = (hotlines as any)?.[hotlineKey] ?? (HOTLINES.US as any)?.[hotlineKey];
      return typeof candidate === 'string' ? candidate : match;
    }
  );
  
  return resolved;
}

// ============================================================================
// HOTLINE FORMATTING
// ============================================================================

/**
 * Format a phone number for display
 */
export function formatPhoneNumber(number: string): string {
  // If it's a simple short code like 988, return as-is
  if (number.length <= 4) {
    return number;
  }
  
  // If it's already formatted, return as-is
  if (number.includes('-') || number.includes(' ') || number.includes('(')) {
    return number;
  }
  
  // Format US numbers
  if (number.startsWith('1') && number.length === 11) {
    return `1-${number.slice(1, 4)}-${number.slice(4, 7)}-${number.slice(7)}`;
  }
  
  // Format 10-digit numbers
  if (number.length === 10) {
    return `${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
  }
  
  return number;
}

/**
 * Get a clickable tel: link
 */
export function getTelLink(number: string): string {
  // Remove any formatting for the tel link
  const digits = number.replace(/\D/g, '');
  return `tel:${digits}`;
}

// ============================================================================
// HOTLINE AVAILABILITY
// ============================================================================

/**
 * Get available hotlines for a region
 */
export function getAvailableHotlines(region: Region): Record<string, string> {
  const regionHotlines = HOTLINES[region] || HOTLINES.US;
  
  // Filter out undefined values
  const available: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(regionHotlines)) {
    if (typeof value === 'string' && value) available[key] = value;
  }
  
  return available;
}

/**
 * Get the primary crisis hotline for a region
 */
export function getPrimaryCrisisHotline(region: Region): string {
  const hotlines = HOTLINES[region] || HOTLINES.US;
  const candidate = (hotlines as any)?.crisis_988;
  return typeof candidate === 'string' && candidate ? candidate : HOTLINES.US.crisis_988;
}

/**
 * Get text line option if available
 */
export function getCrisisTextLine(region: Region): string | null {
  const hotlines = HOTLINES[region] || HOTLINES.US;
  const candidate = (hotlines as any)?.crisis_text ?? (HOTLINES.US as any)?.crisis_text;
  return typeof candidate === 'string' && candidate ? candidate : null;
}

// ============================================================================
// HOTLINE CARD DATA
// ============================================================================

export interface HotlineCard {
  name: string;
  phone: string;
  phoneFormatted: string;
  telLink: string;
  textOption?: string;
  availability: string;
}

/**
 * Get formatted hotline card data for a specific crisis type
 */
export function getHotlineCard(
  crisisType: string,
  region: Region
): HotlineCard | null {
  const hotlines = HOTLINES[region] || HOTLINES.US;
  
  const crisisTypeToHotline: Record<string, { key: string; name: string; availability: string }> = {
    suicide: { key: 'crisis_988', name: 'Suicide & Crisis Lifeline', availability: '24/7' },
    self_harm: { key: 'crisis_988', name: 'Suicide & Crisis Lifeline', availability: '24/7' },
    abuse: { key: 'domestic_violence', name: 'National Domestic Violence Hotline', availability: '24/7' },
    emergency: { key: 'pet_poison', name: 'ASPCA Poison Control', availability: '24/7 (fee applies)' },
    veterans: { key: 'veterans', name: 'Veterans Crisis Line', availability: '24/7' },
    lgbtq: { key: 'trevor_project', name: 'Trevor Project', availability: '24/7' },
  };
  
  const config = crisisTypeToHotline[crisisType];
  if (!config) return null;
  
  const phoneCandidate = (hotlines as any)?.[config.key] ?? (HOTLINES.US as any)?.[config.key];
  if (typeof phoneCandidate !== 'string' || !phoneCandidate) return null;
  const phone = phoneCandidate;
  
  return {
    name: config.name,
    phone,
    phoneFormatted: formatPhoneNumber(phone),
    telLink: getTelLink(phone),
    textOption: getCrisisTextLine(region) || undefined,
    availability: config.availability,
  };
}
