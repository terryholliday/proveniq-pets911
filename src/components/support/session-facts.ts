/**
 * Session Facts Extraction
 * Extracts and tracks information from conversation for context building
 * and takeaway card generation
 */

export interface SessionFacts {
  // Pet information
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petAge?: string;
  petWeight?: string;
  petColor?: string;
  
  // Medical context
  symptom?: string;
  symptoms?: string[];
  duration?: string;
  severity?: string;
  onsetTime?: string;
  
  // Lost pet context
  lastSeen?: string;
  lastSeenTime?: string;
  lastSeenLocation?: string;
  wearingCollar?: boolean;
  microchipped?: boolean;
  
  // User context
  userName?: string;
  userLocation?: string;
  contactPhone?: string;

  userConfirmedSafe?: boolean;
  
  // Session metadata
  sessionStart: Date;
  lastUpdated: Date;
  messageCount: number;
}

// ============================================================================
// EXTRACTION PATTERNS
// ============================================================================

const NAME_PATTERNS = [
  /(?:my (?:dog|cat|pet|bird|rabbit|hamster|fish|reptile)'?s? name is|named|called)\s+(\w+)/i,
  /(\w+)(?:'s| is) (?:my|our) (?:dog|cat|pet|bird|rabbit)/i,
  /(?:he|she|they)'?(?:s| is| are) called\s+(\w+)/i,
];

const SPECIES_PATTERNS = [
  /my\s+(dog|cat|bird|rabbit|hamster|guinea pig|fish|reptile|snake|lizard|turtle|ferret|parrot|parakeet)/i,
  /(dog|cat|puppy|kitten|bird|rabbit|hamster|guinea pig|fish|reptile|snake|lizard|turtle|ferret|parrot|parakeet)(?:'s| is)/i,
];

const BREED_PATTERNS = [
  /(?:is a|a)\s+(\w+(?:\s+\w+)?)\s+(?:dog|cat|breed)/i,
  /(\w+(?:\s+\w+)?)\s+(?:mix|breed|purebred)/i,
  /(golden retriever|labrador|german shepherd|bulldog|poodle|beagle|chihuahua|husky|boxer|dachshund|shih tzu|yorkie|corgi|pitbull|rottweiler|great dane|border collie|australian shepherd|cocker spaniel|boston terrier|pomeranian|siamese|persian|maine coon|ragdoll|british shorthair|bengal|scottish fold|abyssinian|sphynx)/i,
];

const AGE_PATTERNS = [
  /(\d+)\s*(?:year|yr|month|mo|week|wk)s?\s*old/i,
  /(?:is|about)\s*(\d+)\s*(?:year|yr|month|mo|week|wk)s?/i,
  /(puppy|kitten|baby|senior|elderly|adult|young)/i,
];

const SYMPTOM_PATTERNS = [
  /(?:is|has been|started|been)\s+(vomiting|throwing up|not eating|lethargic|limping|bleeding|shaking|seizure|collapsed|unconscious|not breathing|difficulty breathing|diarrhea|not moving|won'?t get up|coughing|sneezing|scratching)/i,
  /(vomit(?:ing|ed)?|diarrhea|blood|bleeding|limping|shaking|trembling|seizure|collapse|lethargy|swelling|swollen|not eating|won'?t eat|breathing hard|difficulty breathing|wheezing|coughing)/i,
];

const DURATION_PATTERNS = [
  /(?:for|since|about|started)\s*(\d+)\s*(hour|hr|minute|min|day|week)s?\s*(?:ago|now)?/i,
  /(just now|just started|this morning|last night|yesterday|few hours|couple hours|all day|few days)/i,
];

const LOCATION_PATTERNS = [
  /(?:in|at|near|around)\s+(?:the\s+)?(\w+(?:\s+\w+){0,3})(?:\s+(?:area|neighborhood|park|street|avenue|road|drive|court|lane|boulevard))?/i,
  /(?:last seen|went missing|escaped|ran away)(?:\s+(?:near|at|from|in))?\s+(?:the\s+)?(\w+(?:\s+\w+){0,3})/i,
];

const TIME_PATTERNS = [
  /(?:at|around|about)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
  /(this morning|this afternoon|this evening|tonight|last night|yesterday|earlier today|\d+\s*(?:hour|minute)s?\s*ago)/i,
];

const CONTACT_PATTERNS = [
  /(?:call|reach|contact)(?:\s+me)?(?:\s+at)?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
  /(?:my (?:phone|number) is)\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
];

const USER_NAME_PATTERNS = [
  /(?:my name is|i'?m|call me)\s+(\w+)/i,
  /(?:this is)\s+(\w+)/i,
];

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

function extractFirst(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractAll(text: string, patterns: RegExp[]): string[] {
  const results: string[] = [];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      results.push(match[1].trim());
    }
  }
  
  return Array.from(new Set(results)); // Deduplicate
}

// ============================================================================
// MAIN EXTRACTION
// ============================================================================

/**
 * Extract facts from a single message
 */
export function extractFactsFromMessage(text: string): Partial<SessionFacts> {
  const facts: Partial<SessionFacts> = {};
  
  // Pet name
  const petName = extractFirst(text, NAME_PATTERNS);
  if (petName) facts.petName = petName;
  
  // Species
  const species = extractFirst(text, SPECIES_PATTERNS);
  if (species) facts.petSpecies = species.toLowerCase();
  
  // Breed
  const breed = extractFirst(text, BREED_PATTERNS);
  if (breed) facts.petBreed = breed;
  
  // Age
  const age = extractFirst(text, AGE_PATTERNS);
  if (age) facts.petAge = age;
  
  // Symptoms
  const symptoms = extractAll(text, SYMPTOM_PATTERNS);
  if (symptoms.length > 0) {
    facts.symptoms = symptoms;
    facts.symptom = symptoms[0]; // Primary symptom
  }
  
  // Duration
  const duration = extractFirst(text, DURATION_PATTERNS);
  if (duration) facts.duration = duration;
  
  // Location
  const location = extractFirst(text, LOCATION_PATTERNS);
  if (location) {
    facts.lastSeenLocation = location;
    facts.userLocation = location;
  }
  
  // Time
  const time = extractFirst(text, TIME_PATTERNS);
  if (time) facts.lastSeenTime = time;
  
  // Contact
  const contact = extractFirst(text, CONTACT_PATTERNS);
  if (contact) facts.contactPhone = contact;
  
  // User name
  const userName = extractFirst(text, USER_NAME_PATTERNS);
  if (userName) facts.userName = userName;
  
  // Collar/microchip detection
  if (/collar|tag|id tag/i.test(text)) {
    facts.wearingCollar = !/no collar|without collar|lost collar/i.test(text);
  }
  if (/microchip|chipped/i.test(text)) {
    facts.microchipped = !/not microchipped|no microchip|isn'?t chipped/i.test(text);
  }
  
  return facts;
}

/**
 * Merge new facts with existing facts
 * New facts take precedence unless they're undefined
 */
export function mergeFacts(
  existing: SessionFacts,
  newFacts: Partial<SessionFacts>
): SessionFacts {
  const merged = { ...existing };
  
  for (const [key, value] of Object.entries(newFacts)) {
    if (value !== undefined) {
      // For symptoms array, merge rather than replace
      if (key === 'symptoms' && Array.isArray(value) && merged.symptoms) {
        merged.symptoms = Array.from(new Set([...merged.symptoms, ...value]));
      } else {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }
  
  merged.lastUpdated = new Date();
  merged.messageCount = existing.messageCount + 1;
  
  return merged;
}

/**
 * Create initial session facts
 */
export function createSessionFacts(): SessionFacts {
  return {
    sessionStart: new Date(),
    lastUpdated: new Date(),
    messageCount: 0,
  };
}

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

/**
 * Build context string from session facts for response generation
 */
export function buildContextFromFacts(facts: SessionFacts): string {
  const contextParts: string[] = [];
  
  if (facts.petName) {
    contextParts.push(`Pet name: ${facts.petName}`);
  }
  
  if (facts.petSpecies) {
    let speciesInfo = `Species: ${facts.petSpecies}`;
    if (facts.petBreed) {
      speciesInfo += ` (${facts.petBreed})`;
    }
    contextParts.push(speciesInfo);
  }
  
  if (facts.petAge) {
    contextParts.push(`Age: ${facts.petAge}`);
  }
  
  if (facts.symptom || (facts.symptoms && facts.symptoms.length > 0)) {
    const symptomList = facts.symptoms?.join(', ') || facts.symptom;
    contextParts.push(`Symptoms: ${symptomList}`);
  }
  
  if (facts.duration) {
    contextParts.push(`Duration: ${facts.duration}`);
  }
  
  if (facts.lastSeenLocation) {
    let locationInfo = `Last seen: ${facts.lastSeenLocation}`;
    if (facts.lastSeenTime) {
      locationInfo += ` at ${facts.lastSeenTime}`;
    }
    contextParts.push(locationInfo);
  }
  
  if (contextParts.length === 0) {
    return '';
  }
  
  return `[Session Context: ${contextParts.join('; ')}]`;
}

// ============================================================================
// TAKEAWAY CARD DATA
// ============================================================================

export interface VetERCardData {
  petName: string;
  species: string;
  breed?: string;
  age?: string;
  symptoms: string;
  duration?: string;
  ownerName?: string;
  ownerPhone?: string;
  timestamp: string;
}

export interface LostPetCardData {
  petName: string;
  species: string;
  breed?: string;
  color?: string;
  age?: string;
  lastSeen: string;
  lastSeenTime?: string;
  hasCollar: boolean;
  microchipped: boolean;
  contactPhone?: string;
  reward?: boolean;
}

/**
 * Generate Vet ER card data from session facts
 */
export function generateVetERCardData(facts: SessionFacts): VetERCardData | null {
  // Need at least symptom to generate card
  if (!facts.symptom && (!facts.symptoms || facts.symptoms.length === 0)) {
    return null;
  }
  
  return {
    petName: facts.petName || 'Unknown',
    species: facts.petSpecies || 'Unknown',
    breed: facts.petBreed,
    age: facts.petAge,
    symptoms: facts.symptoms?.join(', ') || facts.symptom || 'Unknown',
    duration: facts.duration,
    ownerName: facts.userName,
    ownerPhone: facts.contactPhone,
    timestamp: new Date().toLocaleString(),
  };
}

/**
 * Generate Lost Pet card data from session facts
 */
export function generateLostPetCardData(facts: SessionFacts): LostPetCardData | null {
  // Need at least species and location
  if (!facts.petSpecies || !facts.lastSeenLocation) {
    return null;
  }
  
  return {
    petName: facts.petName || 'Unknown',
    species: facts.petSpecies,
    breed: facts.petBreed,
    color: facts.petColor,
    age: facts.petAge,
    lastSeen: facts.lastSeenLocation,
    lastSeenTime: facts.lastSeenTime,
    hasCollar: facts.wearingCollar ?? false,
    microchipped: facts.microchipped ?? false,
    contactPhone: facts.contactPhone,
    reward: false, // Default, can be updated
  };
}

// ============================================================================
// PRIVACY-SAFE SUMMARY
// ============================================================================

/**
 * Generate a privacy-safe summary for handoff packets
 * Excludes specific PII like phone numbers and exact locations
 */
export function generatePrivacySafeSummary(facts: SessionFacts): string {
  const parts: string[] = [];
  
  if (facts.petSpecies) {
    parts.push(`${facts.petSpecies}`);
  }
  
  if (facts.petBreed) {
    parts.push(`(${facts.petBreed})`);
  }
  
  if (facts.symptom) {
    parts.push(`presenting with ${facts.symptom}`);
  }
  
  if (facts.duration) {
    parts.push(`for ${facts.duration}`);
  }
  
  if (parts.length === 0) {
    return 'No specific details collected';
  }
  
  return parts.join(' ');
}
