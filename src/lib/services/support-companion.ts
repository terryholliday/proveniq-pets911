/**
 * Support Companion Empathy Service
 * 
 * Provides emotional support and practical guidance for pet parents
 * during pet crises (lost, found, or medical emergencies).
 * 
 * This service provides:
 * - Emotional check-ins
 * - Practical search tips
 * - Gentle reminders
 * - Connection to resources
 */

export interface SupportMessage {
  id: string;
  type: 'companion' | 'user' | 'action';
  content: string;
  timestamp: string;
  actions?: SupportAction[];
}

export interface SupportAction {
  id: string;
  label: string;
  emoji?: string;
  actionType: 'response' | 'link' | 'callback';
  payload?: string;
}

export interface SupportSession {
  sessionId: string;
  petName: string;
  petSpecies: string;
  daysMissing: number;
  lastCheckIn: string;
  mood: 'anxious' | 'hopeful' | 'sad' | 'determined' | 'unknown';
  messages: SupportMessage[];
}

// Empathy responses categorized by context
const SUPPORT_RESPONSES = {
  greeting: [
    "I'm so sorry {petName} is missing. 💜 This must be incredibly difficult.",
    "I can only imagine how worried you must be about {petName}. I'm here with you.",
    "Losing {petName} must feel overwhelming right now. You're not alone in this.",
  ],

  searchTips: [
    "Many pets are found within a 3-5 block radius of where they went missing. Have you checked hiding spots nearby?",
    "Putting out items with your scent (worn clothes, their bed) near where {petName} was last seen can help guide them home.",
    "The early morning and evening hours are often the best times to search, when it's quieter.",
    "Local shelters should be checked in person - photos don't always do pets justice, especially if they're stressed.",
    "Social media groups for lost pets in your area can be incredibly helpful. Have you posted there?",
  ],

  emotionalSupport: [
    "It's okay to feel overwhelmed. What you're feeling is completely valid.",
    "Remember to take care of yourself too. {petName} needs you to stay strong.",
    "Many pets are found days or even weeks later. Don't lose hope. 💜",
    "You're doing everything you can. That matters.",
    "It's okay to take breaks. Exhausting yourself won't help {petName}.",
  ],

  checkIn: [
    "Hey, just checking in. How are you holding up today?",
    "Thinking of you and {petName}. Any updates?",
    "I wanted to see how you're doing. Remember, I'm here if you need to talk.",
  ],

  practicalHelp: [
    "Would you like me to help you create a lost pet flyer?",
    "I can help you draft a post for social media if you'd like.",
    "Let me know if you need help finding local resources like shelters or rescue groups.",
  ],
};

/**
 * Initialize a Support Companion session for a pet parent
 */
export function initSupportSession(petName: string, petSpecies: string, daysMissing: number = 0): SupportSession {
  const sessionId = crypto.randomUUID();
  const greeting = getRandomResponse('greeting', petName);

  return {
    sessionId,
    petName,
    petSpecies,
    daysMissing,
    lastCheckIn: new Date().toISOString(),
    mood: 'unknown',
    messages: [
      {
        id: crypto.randomUUID(),
        type: 'companion',
        content: greeting,
        timestamp: new Date().toISOString(),
        actions: getInitialActions(),
      },
    ],
  };
}

/**
 * Get a response from the Support Companion based on user input
 */
export function getSupportResponse(
  session: SupportSession,
  userMessage: string,
  context?: 'search_tips' | 'emotional' | 'practical' | 'check_in'
): SupportMessage {
  let responseCategory: keyof typeof SUPPORT_RESPONSES;
  let actions: SupportAction[] = [];

  // Determine response category based on context or message content
  if (context) {
    switch (context) {
      case 'search_tips':
        responseCategory = 'searchTips';
        actions = getSearchTipActions();
        break;
      case 'emotional':
        responseCategory = 'emotionalSupport';
        actions = getEmotionalSupportActions();
        break;
      case 'practical':
        responseCategory = 'practicalHelp';
        actions = getPracticalHelpActions();
        break;
      case 'check_in':
        responseCategory = 'checkIn';
        actions = getCheckInActions();
        break;
      default:
        responseCategory = 'emotionalSupport';
    }
  } else {
    // Analyze message for context
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('tip') || lowerMessage.includes('search') || lowerMessage.includes('find')) {
      responseCategory = 'searchTips';
      actions = getSearchTipActions();
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
      responseCategory = 'practicalHelp';
      actions = getPracticalHelpActions();
    } else {
      responseCategory = 'emotionalSupport';
      actions = getEmotionalSupportActions();
    }
  }

  const content = getRandomResponse(responseCategory, session.petName);

  return {
    id: crypto.randomUUID(),
    type: 'companion',
    content,
    timestamp: new Date().toISOString(),
    actions,
  };
}

/**
 * Get scheduled check-in message
 */
export function getCheckInMessage(session: SupportSession): SupportMessage {
  const content = getRandomResponse('checkIn', session.petName);

  return {
    id: crypto.randomUUID(),
    type: 'companion',
    content,
    timestamp: new Date().toISOString(),
    actions: getCheckInActions(),
  };
}

// Helper functions
function getRandomResponse(category: keyof typeof SUPPORT_RESPONSES, petName: string): string {
  const responses = SUPPORT_RESPONSES[category];
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex].replace(/{petName}/g, petName);
}

function getInitialActions(): SupportAction[] {
  return [
    { id: '1', label: 'Give me search tips', emoji: '📍', actionType: 'response', payload: 'search_tips' },
    { id: '2', label: 'I just need to talk', emoji: '💭', actionType: 'response', payload: 'emotional' },
    { id: '3', label: 'Connect me to help', emoji: '📞', actionType: 'response', payload: 'practical' },
  ];
}

function getSearchTipActions(): SupportAction[] {
  return [
    { id: '1', label: 'More tips', emoji: '💡', actionType: 'response', payload: 'search_tips' },
    { id: '2', label: 'I need emotional support', emoji: '💜', actionType: 'response', payload: 'emotional' },
    { id: '3', label: 'Help me make a flyer', emoji: '📄', actionType: 'response', payload: 'practical' },
  ];
}

function getEmotionalSupportActions(): SupportAction[] {
  return [
    { id: '1', label: 'That helps, thank you', emoji: '💜', actionType: 'response', payload: 'emotional' },
    { id: '2', label: 'Give me practical tips', emoji: '📍', actionType: 'response', payload: 'search_tips' },
    { id: '3', label: 'I need more help', emoji: '🆘', actionType: 'response', payload: 'practical' },
  ];
}

function getPracticalHelpActions(): SupportAction[] {
  return [
    { id: '1', label: 'Create a flyer', emoji: '📄', actionType: 'link', payload: '/tools/flyer' },
    { id: '2', label: 'Find local shelters', emoji: '🏠', actionType: 'link', payload: '/resources/shelters' },
    { id: '3', label: 'Social media templates', emoji: '📱', actionType: 'link', payload: '/tools/social' },
  ];
}

function getCheckInActions(): SupportAction[] {
  return [
    { id: '1', label: 'No updates yet', emoji: '😔', actionType: 'response', payload: 'emotional' },
    { id: '2', label: 'I have a lead!', emoji: '✨', actionType: 'response', payload: 'practical' },
    { id: '3', label: 'We found them!', emoji: '🎉', actionType: 'response', payload: 'reunion' },
  ];
}

/**
 * Support Companion API configuration
 */
export const SUPPORT_API_CONFIG = {
  // Configured via internal environment variables
  baseUrl: process.env.NEXT_PUBLIC_SUPPORT_API_URL || 'https://api.proveniq.org/support',
  endpoints: {
    initSession: '/sessions',
    sendMessage: '/sessions/{sessionId}/messages',
    getCheckIn: '/sessions/{sessionId}/check-in',
    endSession: '/sessions/{sessionId}/end',
  },
  headers: {
    'X-Client-Tag': 'proveniq-Pet911',
    'X-Companion-Type': 'empathy',
  },
};
