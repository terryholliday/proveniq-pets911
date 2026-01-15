/**
 * MAYDAY Support Companion - Response Engine
 * 
 * THIS IS THE FIX FOR THE REPEAT-RESPONSE BUG
 * 
 * The problem: The chatbot keeps saying "I'm here with you. Tell me more about what's happening."
 * regardless of what the user says.
 * 
 * Root cause: The response generator was stateless - it didn't know:
 * 1. What question it just asked
 * 2. What the user answered
 * 3. What stage of the conversation we're in
 * 
 * Solution: This engine tracks conversation state and generates appropriate
 * ADVANCING responses based on context.
 */

// Local type definitions (avoiding broken imports)
export type CrisisCategory = 'LOST_PET' | 'FOUND_PET' | 'PET_EMERGENCY' | 'GRIEF' | 'CRISIS' | 'SCAM' | null;
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskAssessment {
  level: RiskLevel;
  primaryCategory: CrisisCategory;
  confidence: number;
  signals: string[];
  requiresConfirmation: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface PetProfile {
  // Assuming this interface was previously defined elsewhere
  // If not, you can define it here as well
}

// ============================================================================
// TYPES
// ============================================================================

export interface ResponseContext {
  messages: Message[];
  riskAssessment: RiskAssessment | null;
  currentStage: ConversationStage;
  topic: CrisisCategory | null;
  collectedInfo: Map<string, string>;
  lastBotQuestion: string | null;
  turnCount: number;
}

export type ConversationStage = 
  | 'GREETING'
  | 'TOPIC_IDENTIFIED'
  | 'GATHERING_DETAILS'
  | 'PROVIDING_GUIDANCE'
  | 'FOLLOW_UP'
  | 'CLOSING';

export interface ResponseResult {
  text: string;
  nextStage: ConversationStage;
  extractedInfo: Record<string, string>;
  quickActions?: string[];
  shouldOfferGrounding?: boolean;
}

// ============================================================================
// PATTERN MATCHERS
// ============================================================================

const PATTERNS = {
  // Pet type detection
  DOG: /\b(dog|puppy|pup|canine)\b/i,
  CAT: /\b(cat|kitty|kitten|feline)\b/i,
  
  // Lost pet trigger
  LOST_PET: /\b(lost|missing|can'?t find|gone|ran away|escaped|got out)\b.*\b(pet|dog|cat|puppy|kitten)\b|\b(pet|dog|cat|puppy|kitten)\b.*\b(lost|missing|gone|ran away|escaped)\b/i,
  
  // Location indicators
  HAS_LOCATION: /\b(yard|house|home|park|street|road|neighborhood|outside|inside|front|back|garage|door|fence|gate|block|corner|area)\b/i,
  
  // Time indicators  
  HAS_TIME: /\b(today|yesterday|morning|afternoon|evening|night|hour|minute|just now|earlier|ago)\b/i,
  
  // Yes/No
  YES: /^(yes|yeah|yep|yea|sure|ok|okay|definitely|absolutely|please|mhm|uh huh|correct|right|exactly)\.?$/i,
  NO: /^(no|nope|nah|not really|don'?t think so|negative)\.?$/i,
  AFFIRMATIVE: /\b(yes|yeah|yep|sure|ok|okay|definitely|please)\b/i,
  NEGATIVE: /\b(no|nope|nah|not|don'?t|haven'?t|isn'?t|wasn'?t)\b/i,
  
  // Microchip
  MICROCHIPPED: /\b(microchip|chip|chipped|tagged|registered)\b/i,
  
  // Description elements
  HAS_COLOR: /\b(black|white|brown|tan|golden|yellow|orange|red|gray|grey|spotted|striped|brindle|merle)\b/i,
  HAS_SIZE: /\b(small|medium|large|big|tiny|huge|puppy|kitten|adult|senior|old|young)\b/i,
  HAS_BREED: /\b(labrador|lab|retriever|shepherd|terrier|bulldog|beagle|poodle|husky|corgi|pitbull|boxer|collie|dachshund|chihuahua|persian|siamese|tabby|maine coon|ragdoll|mixed|mutt)\b/i,
  
  // Crisis indicators
  DISTRESSED: /\b(scared|worried|panicking|panic|freaking out|can'?t breathe|help|please|desperate|terrified)\b/i,
  
  // Greetings
  GREETING: /^(hi|hello|hey|good morning|good afternoon|good evening)\.?$/i,
  
  // Questions
  ASKING_CAPABILITIES: /\b(what can you|how can you|what do you|can you help|help me)\b/i,
};

// ============================================================================
// INFO EXTRACTORS
// ============================================================================

function extractPetInfo(message: string, existing: Map<string, string>): Record<string, string> {
  const info: Record<string, string> = {};
  
  // Species
  if (!existing.has('species')) {
    if (PATTERNS.DOG.test(message)) info['species'] = 'dog';
    else if (PATTERNS.CAT.test(message)) info['species'] = 'cat';
  }
  
  // Location
  if (!existing.has('location') && PATTERNS.HAS_LOCATION.test(message)) {
    info['location'] = message; // Store whole message as location context
  }
  
  // Time
  if (!existing.has('timeframe') && PATTERNS.HAS_TIME.test(message)) {
    info['timeframe'] = message;
  }
  
  // Description elements
  if (PATTERNS.HAS_COLOR.test(message)) {
    const match = message.match(PATTERNS.HAS_COLOR);
    if (match) info['color'] = match[0].toLowerCase();
  }
  
  if (PATTERNS.HAS_BREED.test(message)) {
    const match = message.match(PATTERNS.HAS_BREED);
    if (match) info['breed'] = match[0].toLowerCase();
  }
  
  // Microchip status
  if (!existing.has('microchipped')) {
    if (PATTERNS.MICROCHIPPED.test(message)) {
      if (PATTERNS.NEGATIVE.test(message)) {
        info['microchipped'] = 'no';
      } else {
        info['microchipped'] = 'yes';
      }
    }
  }
  
  // Name extraction (look for "named X" or "name is X" or "called X")
  const nameMatch = message.match(/\b(?:named?|call(?:ed)?|name is)\s+(\w+)\b/i);
  if (nameMatch && !existing.has('petName')) {
    info['petName'] = nameMatch[1];
  }
  
  return info;
}

// ============================================================================
// RESPONSE TEMPLATES
// ============================================================================

const LOST_PET_RESPONSES = {
  // Initial acknowledgment - ONLY use this once!
  INITIAL: (species?: string) => {
    if (species === 'dog') {
      return `I'm so sorry your dog is missing. That's incredibly stressful. Let me help you with a search plan.\n\nFirst - where and when did you last see them?`;
    } else if (species === 'cat') {
      return `I'm so sorry your cat is missing. I know how frightening this is. Cats usually hide close to home.\n\nWhere and when did you last see them?`;
    }
    return `I'm so sorry your pet is missing. Let me help you find them.\n\nFirst, is it a dog or a cat?`;
  },
  
  // After we know species, ask for details
  ASK_DETAILS: (species: string) => {
    return `Got it. Can you tell me:\n• Their name\n• What they look like (color, size, breed if known)\n• Are they microchipped?`;
  },
  
  // After we have location
  ASK_DESCRIPTION: () => {
    return `That's helpful context. What does your pet look like? Color, size, any distinctive features?`;
  },
  
  // After we have description, give search advice
  SEARCH_ADVICE_DOG: (info: Map<string, string>) => {
    const name = info.get('petName') || 'your dog';
    const location = info.get('location') || 'where they were last seen';
    const isChipped = info.get('microchipped') === 'yes';
    
    let response = `Here's your search plan for ${name}:\n\n`;
    response += `**Right now:**\n`;
    response += `• Walk the area around ${location.includes('yard') ? 'your yard' : location}, calling their name calmly\n`;
    response += `• Check under porches, decks, bushes, and in garages\n`;
    response += `• Ask neighbors to check their yards and garages\n\n`;
    
    response += `**Today:**\n`;
    response += `• File a lost pet report at your local shelter (they may already be there!)\n`;
    response += `• Post on Nextdoor, Pawboost, and local Facebook lost pet groups\n`;
    response += `• Put out a worn item of your clothing - your scent can guide them home\n`;
    response += `• Leave water outside (not food, which attracts wildlife)\n\n`;
    
    if (isChipped) {
      response += `**Since they're microchipped:** Contact your microchip company NOW to report them missing. They can flag the chip.\n\n`;
    } else {
      response += `**Important:** When you find them, consider getting them microchipped - it dramatically increases the chance of reunion if this ever happens again.\n\n`;
    }
    
    response += `Most dogs are found within 2 miles of home. Don't give up - dogs are found days and even weeks later.\n\n`;
    response += `Would you like help creating a lost pet flyer, or do you have questions about search strategies?`;
    
    return response;
  },
  
  SEARCH_ADVICE_CAT: (info: Map<string, string>) => {
    const name = info.get('petName') || 'your cat';
    const isIndoor = info.get('indoor') === 'yes';
    const isChipped = info.get('microchipped') === 'yes';
    
    let response = `Here's your search plan for ${name}:\n\n`;
    response += `**Critical:** Cats hide when scared and usually stay VERY close - within 500 feet of home.\n\n`;
    
    response += `**Search strategy:**\n`;
    response += `• Search at dawn and dusk when cats are most active\n`;
    response += `• Look UP (trees, roofs, high shelves in garages) and DOWN (under cars, in bushes, tight spaces)\n`;
    response += `• Put their litter box outside - they can smell it from far away\n`;
    response += `• Shake a treat bag or open a can of tuna outside\n`;
    response += `• Search slowly and quietly - call softly, don't chase\n\n`;
    
    response += `**Important:** A scared cat will NOT come when called and will hide silently. You may need to physically look in every hiding spot.\n\n`;
    
    response += `**Also do:**\n`;
    response += `• Ask neighbors to check garages, sheds, and under decks\n`;
    response += `• Set a humane trap with their favorite food\n`;
    response += `• Post on Nextdoor and local Facebook groups\n`;
    response += `• File a report at local shelters\n\n`;
    
    if (isChipped) {
      response += `Contact your microchip company to report them missing.\n\n`;
    }
    
    response += `Would you like help with anything else - creating a flyer, or more search tips?`;
    
    return response;
  },
  
  // Follow-up responses
  OFFER_FLYER: () => {
    return `I can help you create an effective lost pet flyer. What information should we include?\n\n• Pet's name\n• Your phone number\n• Best photo you have\n• Any reward offered?\n\nOr if you just want to talk through the search, I'm here for that too.`;
  },
  
  MORE_TIPS: (species: string) => {
    if (species === 'dog') {
      return `Some additional tips:\n\n• Dogs often travel in the direction they were heading when lost\n• Check with mail carriers, delivery drivers, and joggers - they cover a lot of ground\n• Visit shelters in person every 2-3 days (don't just call)\n• Keep searching at different times of day\n• Consider hiring a pet detective or using tracking dogs for difficult cases\n\nWhat else can I help with?`;
    } else {
      return `Some additional tips for finding cats:\n\n• Indoor cats typically stay within 3 houses of home\n• Outdoor cats may travel further but often return to their territory\n• Night searches with a flashlight can catch eye reflection\n• Leave a garage or shed cracked open as a safe space\n• Some cats return on their own after 24-72 hours\n\nWhat else can I help with?`;
    }
  },
};

// Generic responses
const GENERIC_RESPONSES = {
  GREETING: `Hi, I'm here with you. I can help with:\n\n• **Lost pets** - Search strategies and action plans\n• **Found pets** - How to find their owner\n• **Pet emergencies** - Quick guidance and vet resources\n• **Emotional support** - Grounding exercises and crisis resources\n\nWhat's going on?`,
  
  CLARIFY_TOPIC: `I want to make sure I help you the right way. Can you tell me a bit more about what's happening?`,
  
  CAPABILITIES: `I can help with:\n\n• **Lost pet searches** - Personalized action plans to find your pet\n• **Found pet situations** - Steps to reunite pets with owners\n• **Pet emergencies** - Guidance and vet resources\n• **Emotional support** - Grounding exercises if you're feeling overwhelmed\n\nWhat do you need help with?`,
};

// ============================================================================
// MAIN RESPONSE ENGINE
// ============================================================================

export class ResponseEngine {
  private context: ResponseContext;
  
  constructor() {
    this.context = {
      messages: [],
      riskAssessment: null,
      currentStage: 'GREETING',
      topic: null,
      collectedInfo: new Map(),
      lastBotQuestion: null,
      turnCount: 0,
    };
  }
  
  /**
   * Generate a response based on user message and current context
   */
  generateResponse(userMessage: string, riskAssessment?: RiskAssessment | null): ResponseResult {
    const message = userMessage.trim();
    this.context.turnCount++;
    
    // Extract any info from this message
    const newInfo = extractPetInfo(message, this.context.collectedInfo);
    Object.entries(newInfo).forEach(([key, value]) => {
      this.context.collectedInfo.set(key, value);
    });
    
    // Detect topic if not set
    if (!this.context.topic) {
      this.context.topic = this.detectTopic(message, riskAssessment);
    }
    
    // Generate response based on current stage and topic
    const result = this.getContextualResponse(message);
    
    // Update context
    this.context.currentStage = result.nextStage;
    this.context.lastBotQuestion = result.text.includes('?') ? result.text : null;
    Object.entries(result.extractedInfo).forEach(([key, value]) => {
      this.context.collectedInfo.set(key, value);
    });
    
    return result;
  }
  
  /**
   * Detect the conversation topic
   */
  private detectTopic(message: string, assessment?: RiskAssessment | null): CrisisCategory | null {
    // Use risk assessment if available
    if (assessment?.primaryCategory) {
      return assessment.primaryCategory;
    }
    
    // Pattern matching
    if (PATTERNS.LOST_PET.test(message)) {
      return 'LOST_PET';
    }
    
    // Check for pet mentions without "lost"
    if ((PATTERNS.DOG.test(message) || PATTERNS.CAT.test(message)) && 
        /\b(missing|gone|can'?t find)\b/i.test(message)) {
      return 'LOST_PET';
    }
    
    return null;
  }
  
  /**
   * Get contextual response based on stage and collected info
   */
  private getContextualResponse(message: string): ResponseResult {
    const { currentStage, topic, collectedInfo, lastBotQuestion } = this.context;
    
    // Handle greetings
    if (PATTERNS.GREETING.test(message) && currentStage === 'GREETING') {
      return {
        text: GENERIC_RESPONSES.GREETING,
        nextStage: 'GREETING',
        extractedInfo: {},
      };
    }
    
    // Handle "what can you help with"
    if (PATTERNS.ASKING_CAPABILITIES.test(message)) {
      return {
        text: GENERIC_RESPONSES.CAPABILITIES,
        nextStage: 'GREETING',
        extractedInfo: {},
      };
    }
    
    // =========================================================================
    // LOST PET FLOW
    // =========================================================================
    if (topic === 'LOST_PET') {
      return this.handleLostPetFlow(message);
    }
    
    // =========================================================================
    // TOPIC NOT YET IDENTIFIED
    // =========================================================================
    if (!topic) {
      // Try to detect from this message
      if (PATTERNS.LOST_PET.test(message) || 
          ((PATTERNS.DOG.test(message) || PATTERNS.CAT.test(message)) && 
           /\b(missing|gone|can'?t find)\b/i.test(message))) {
        this.context.topic = 'LOST_PET';
        return this.handleLostPetFlow(message);
      }
      
      // Still can't determine topic
      return {
        text: GENERIC_RESPONSES.CLARIFY_TOPIC,
        nextStage: 'GREETING',
        extractedInfo: {},
      };
    }
    
    // Fallback
    return {
      text: GENERIC_RESPONSES.CLARIFY_TOPIC,
      nextStage: currentStage,
      extractedInfo: {},
    };
  }
  
  /**
   * Handle the lost pet conversation flow
   */
  private handleLostPetFlow(message: string): ResponseResult {
    const { currentStage, collectedInfo, lastBotQuestion } = this.context;
    const species = collectedInfo.get('species');
    
    // -------------------------------------------------------------------------
    // STAGE: Just identified topic OR first message about lost pet
    // -------------------------------------------------------------------------
    if (currentStage === 'GREETING' || currentStage === 'TOPIC_IDENTIFIED') {
      // If we already know species from the message, acknowledge and ask for details
      if (species) {
        // Check if we already have location info too
        if (collectedInfo.has('location') || PATTERNS.HAS_LOCATION.test(message)) {
          // They gave us species AND location - ask for description
          return {
            text: LOST_PET_RESPONSES.ASK_DESCRIPTION(),
            nextStage: 'GATHERING_DETAILS',
            extractedInfo: {},
          };
        }
        // Just have species - give initial response asking for location
        return {
          text: LOST_PET_RESPONSES.INITIAL(species),
          nextStage: 'GATHERING_DETAILS',
          extractedInfo: {},
        };
      }
      
      // Don't know species yet
      return {
        text: LOST_PET_RESPONSES.INITIAL(),
        nextStage: 'TOPIC_IDENTIFIED',
        extractedInfo: {},
      };
    }
    
    // -------------------------------------------------------------------------
    // STAGE: Gathering details
    // -------------------------------------------------------------------------
    if (currentStage === 'GATHERING_DETAILS') {
      // Check what we still need
      const hasSpecies = collectedInfo.has('species');
      const hasLocation = collectedInfo.has('location') || PATTERNS.HAS_LOCATION.test(message);
      const hasDescription = collectedInfo.has('color') || collectedInfo.has('breed') || 
                            PATTERNS.HAS_COLOR.test(message) || PATTERNS.HAS_BREED.test(message);
      
      // If user just told us species
      if (!hasSpecies && (PATTERNS.DOG.test(message) || PATTERNS.CAT.test(message))) {
        const detectedSpecies = PATTERNS.DOG.test(message) ? 'dog' : 'cat';
        return {
          text: LOST_PET_RESPONSES.INITIAL(detectedSpecies),
          nextStage: 'GATHERING_DETAILS',
          extractedInfo: { species: detectedSpecies },
        };
      }
      
      // If we have enough info, provide search guidance
      if (hasSpecies && (hasLocation || hasDescription)) {
        const sp = collectedInfo.get('species') || (PATTERNS.DOG.test(message) ? 'dog' : 'cat');
        if (sp === 'cat') {
          return {
            text: LOST_PET_RESPONSES.SEARCH_ADVICE_CAT(collectedInfo),
            nextStage: 'PROVIDING_GUIDANCE',
            extractedInfo: {},
          };
        } else {
          return {
            text: LOST_PET_RESPONSES.SEARCH_ADVICE_DOG(collectedInfo),
            nextStage: 'PROVIDING_GUIDANCE',
            extractedInfo: {},
          };
        }
      }
      
      // Still need more info
      if (!hasLocation) {
        return {
          text: `Where and when did you last see ${collectedInfo.get('petName') || 'them'}?`,
          nextStage: 'GATHERING_DETAILS',
          extractedInfo: {},
        };
      }
      
      if (!hasDescription) {
        return {
          text: LOST_PET_RESPONSES.ASK_DESCRIPTION(),
          nextStage: 'GATHERING_DETAILS',
          extractedInfo: {},
        };
      }
    }
    
    // -------------------------------------------------------------------------
    // STAGE: Already provided guidance, handling follow-ups
    // -------------------------------------------------------------------------
    if (currentStage === 'PROVIDING_GUIDANCE' || currentStage === 'FOLLOW_UP') {
      // Check what they're asking for
      if (/flyer|poster|sign/i.test(message)) {
        return {
          text: LOST_PET_RESPONSES.OFFER_FLYER(),
          nextStage: 'FOLLOW_UP',
          extractedInfo: {},
        };
      }
      
      if (/more|tip|else|what else|another/i.test(message)) {
        return {
          text: LOST_PET_RESPONSES.MORE_TIPS(collectedInfo.get('species') || 'dog'),
          nextStage: 'FOLLOW_UP',
          extractedInfo: {},
        };
      }
      
      if (/thank|thanks|helpful/i.test(message)) {
        return {
          text: `You're welcome. I really hope you find ${collectedInfo.get('petName') || 'your pet'} soon. Don't give up - pets are reunited with their families every day, sometimes weeks later. I'm here if you need anything else. 💚`,
          nextStage: 'CLOSING',
          extractedInfo: {},
        };
      }
      
      if (PATTERNS.AFFIRMATIVE.test(message) && message.length < 20) {
        return {
          text: LOST_PET_RESPONSES.OFFER_FLYER(),
          nextStage: 'FOLLOW_UP',
          extractedInfo: {},
        };
      }
      
      // They might be asking something else or providing more info
      return {
        text: `I want to make sure I help you with the right thing. Are you looking for:\n\n• More search tips\n• Help making a lost pet flyer\n• Something else?\n\nJust let me know!`,
        nextStage: 'FOLLOW_UP',
        extractedInfo: {},
      };
    }
    
    // Fallback - shouldn't reach here
    return {
      text: `I'm here to help you find your pet. Can you tell me more about what happened?`,
      nextStage: 'GATHERING_DETAILS',
      extractedInfo: {},
    };
  }
  
  /**
   * Reset the engine state
   */
  reset(): void {
    this.context = {
      messages: [],
      riskAssessment: null,
      currentStage: 'GREETING',
      topic: null,
      collectedInfo: new Map(),
      lastBotQuestion: null,
      turnCount: 0,
    };
  }
  
  /**
   * Get current context (for debugging)
   */
  getContext(): ResponseContext {
    return { ...this.context };
  }
}

// ============================================================================
// HOOK WRAPPER
// ============================================================================

import { useState, useCallback, useRef } from 'react';

export function useResponseEngine() {
  const engineRef = useRef(new ResponseEngine());
  const [lastResponse, setLastResponse] = useState<ResponseResult | null>(null);
  
  const generateResponse = useCallback((
    userMessage: string, 
    riskAssessment?: RiskAssessment | null
  ): string => {
    const result = engineRef.current.generateResponse(userMessage, riskAssessment);
    setLastResponse(result);
    return result.text;
  }, []);
  
  const reset = useCallback(() => {
    engineRef.current.reset();
    setLastResponse(null);
  }, []);
  
  const getContext = useCallback(() => {
    return engineRef.current.getContext();
  }, []);
  
  return {
    generateResponse,
    reset,
    getContext,
    lastResponse,
  };
}

export default ResponseEngine;