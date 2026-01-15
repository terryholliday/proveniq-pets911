'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ArrowLeft,
  Heart,
  AlertTriangle,
  Search,
  HelpCircle
} from 'lucide-react';
import SupportCompanionAvatar from './SupportCompanionAvatar';
import {
  SUPPORT_COMPANION_OPENINGS,
  SUPPORT_COMPANION_CONFIG,
  CRISIS_QUICK_ACTIONS
} from '@/lib/ai/SupportCompanionPersona';
import { generateCompanionResponse as generateClinicalResponse } from '@/lib/ai/counselor-engine';

interface Message {
  id: string;
  role: 'companion' | 'user';
  content: string;
  timestamp: Date;
}

interface SupportCompanionChatProps {
  onClose?: () => void;
  initialCrisisType?: 'lost_pet' | 'found_pet' | 'emergency' | 'general';
}

type LostPetFlow =
  | { stage: 'awaiting_animal_type' }
  | { stage: 'awaiting_details'; animalType: 'dog' | 'cat' | 'other' }
  | { stage: 'awaiting_location'; animalType: 'dog' | 'cat' | 'other'; details: string }
  | { stage: 'complete'; animalType: 'dog' | 'cat' | 'other'; details: string; location: string };

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  const parseBold = (line: string, lineIndex: number): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partIndex = 0;
    
    while (remaining.includes('**')) {
      const startIdx = remaining.indexOf('**');
      const endIdx = remaining.indexOf('**', startIdx + 2);
      
      if (endIdx === -1) break;
      
      if (startIdx > 0) {
        parts.push(<span key={`${lineIndex}-${partIndex++}`}>{remaining.slice(0, startIdx)}</span>);
      }
      
      const boldText = remaining.slice(startIdx + 2, endIdx);
      parts.push(<strong key={`${lineIndex}-${partIndex++}`} className="font-semibold text-white">{boldText}</strong>);
      
      remaining = remaining.slice(endIdx + 2);
    }
    
    if (remaining) {
      parts.push(<span key={`${lineIndex}-${partIndex++}`}>{remaining}</span>);
    }
    
    return parts.length > 0 ? parts : line;
  };
  
  lines.forEach((line, i) => {
    // Headers
    if (line.startsWith('### ')) {
      const headerContent = parseBold(line.slice(4), i);
      elements.push(<h3 key={i} className="text-base font-bold mt-3 mb-1 text-teal-300">{headerContent}</h3>);
      return;
    }
    if (line.startsWith('## ')) {
      const headerContent = parseBold(line.slice(3), i);
      elements.push(<h2 key={i} className="text-lg font-bold mt-3 mb-1 text-teal-300">{headerContent}</h2>);
      return;
    }
    
    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      return;
    }
    
    const content = parseBold(line, i);
    
    // List items
    if (line.match(/^\d+\)\s/) || line.startsWith('- ')) {
      elements.push(<div key={i} className="ml-2">{content}</div>);
      return;
    }
    
    elements.push(<div key={i}>{content}</div>);
  });
  
  return <div className="space-y-0.5">{elements}</div>;
}

function parseAnimalType(input: string): 'dog' | 'cat' | 'other' | null {
  const lower = input.toLowerCase();
  if (lower.includes('dog') || lower.includes('puppy') || lower.includes('pup')) return 'dog';
  if (lower.includes('cat') || lower.includes('kitten') || lower.includes('kitty')) return 'cat';
  if (lower.includes('bird') || lower.includes('rabbit') || lower.includes('hamster') || 
      lower.includes('ferret') || lower.includes('turtle') || lower.includes('snake') ||
      lower.includes('lizard') || lower.includes('guinea pig')) return 'other';
  return null;
}

function getAnimalTypePrompt(): string {
  return [
    `I'm so sorry you're going through this. Let's work together to bring them home.`,
    ``,
    `**First, what kind of animal is missing?**`,
    `- Dog (breed matters a lot for search strategy)`,
    `- Cat`,
    `- Other (bird, rabbit, etc.)`
  ].join('\n');
}

function getDetailsPrompt(animalType: 'dog' | 'cat' | 'other'): string {
  if (animalType === 'dog') {
    return [
      `Got it — a **dog**. Search strategy varies hugely by breed and age.`,
      ``,
      `**Tell me about your dog:**`,
      `- Breed (or mix) — e.g., "husky", "senior lab", "small chihuahua"`,
      `- Age — puppy, adult, or senior?`,
      `- Personality — bold/adventurous or shy/skittish?`,
      ``,
      `(Even a quick answer like "8yo beagle, friendly" helps me tailor advice)`
    ].join('\n');
  } else if (animalType === 'cat') {
    return [
      `Got it — a **cat**. Cats behave very differently than dogs when lost.`,
      ``,
      `**Tell me about your cat:**`,
      `- Indoor-only, outdoor, or indoor/outdoor?`,
      `- Age — kitten, adult, or senior?`,
      `- Personality — confident explorer or shy hider?`,
      ``,
      `(This determines whether they're likely hiding nearby or traveling)`
    ].join('\n');
  } else {
    return [
      `Got it. **Tell me what kind of animal** and any details that might help (species, can they fly, etc.)`
    ].join('\n');
  }
}

function getLocationPrompt(animalType: 'dog' | 'cat' | 'other', details: string): string {
  return [
    `Thanks — that helps a lot.`,
    ``,
    `**Where and when were they last seen?**`,
    `(Be specific: "backyard on Oak St" or "ran out the front door 2 hours ago")`
  ].join('\n');
}

function getSearchPlan(animalType: 'dog' | 'cat' | 'other', details: string, location: string): string {
  const lowerDetails = details.toLowerCase();
  
  // Dog-specific strategies
  if (animalType === 'dog') {
    const isHusky = lowerDetails.includes('husky') || lowerDetails.includes('malamute') || lowerDetails.includes('sled');
    const isSenior = lowerDetails.includes('senior') || lowerDetails.includes('old') || lowerDetails.includes('elderly') || /\b1[0-9]\s*(yo|year|yr)/.test(lowerDetails);
    const isSmall = lowerDetails.includes('small') || lowerDetails.includes('chihuahua') || lowerDetails.includes('yorkie') || lowerDetails.includes('toy') || lowerDetails.includes('pomeranian');
    const isShy = lowerDetails.includes('shy') || lowerDetails.includes('skittish') || lowerDetails.includes('scared') || lowerDetails.includes('nervous');
    const isBeagle = lowerDetails.includes('beagle') || lowerDetails.includes('hound');
    
    let strategy: string[] = [`**Search Plan for ${location}**`, ''];
    
    if (isHusky) {
      strategy.push(`### ⚡ Husky/Northern Breed Alert`);
      strategy.push(`Huskies can cover **10-20+ miles** in hours. They don't typically come when called.`);
      strategy.push(`1) **Expand search radius immediately** — check 3-5 mile radius`);
      strategy.push(`2) **Alert animal control + shelters** in neighboring counties NOW`);
      strategy.push(`3) **Post on lost pet Facebook groups** for your area + surrounding areas`);
      strategy.push(`4) **DO NOT CHASE** — they'll run. Sit down, look away, use high-value food`);
      strategy.push(`5) **Set a humane trap** with your worn clothing + smelly food`);
    } else if (isSenior) {
      strategy.push(`### 🐕 Senior Dog Strategy`);
      strategy.push(`Older dogs typically stay **very close to home** — often within a few blocks.`);
      strategy.push(`1) **Search close first** — check neighbors' yards, under porches, sheds`);
      strategy.push(`2) **They may be injured or stuck** — check anywhere they could get trapped`);
      strategy.push(`3) **Check with neighbors** — seniors often go to familiar places/people`);
      strategy.push(`4) **Call softly** — they may be resting and not hear well`);
      strategy.push(`5) **Leave your scent outside** — unwashed clothing by door`);
    } else if (isSmall) {
      strategy.push(`### 🐕 Small Dog Strategy`);
      strategy.push(`Small dogs are **high theft risk** and can hide in tiny spaces.`);
      strategy.push(`1) **Check SMALL hiding spots** — under bushes, in drainage pipes, under cars`);
      strategy.push(`2) **Alert neighbors ASAP** — someone may have "rescued" them`);
      strategy.push(`3) **Watch for coyotes/hawks** — search at dawn/dusk when predators are less active`);
      strategy.push(`4) **Post with REWARD** — deters people keeping a found small dog`);
      strategy.push(`5) **Check Craigslist/Facebook** for "found dog" posts`);
    } else if (isBeagle) {
      strategy.push(`### 🐕 Scent Hound Strategy`);
      strategy.push(`Beagles/hounds follow their nose and can travel **miles** on a scent trail.`);
      strategy.push(`1) **Follow their likely path** — they chase scents, often in straight lines`);
      strategy.push(`2) **Expand search 1-3 miles** in direction of travel`);
      strategy.push(`3) **Use high-value SMELLY food** — bacon, hot dogs at "scent stations"`);
      strategy.push(`4) **Don't chase** — they may think it's a game and keep running`);
      strategy.push(`5) **Alert hunters/outdoor groups** — hounds often found in woods`);
    } else if (isShy) {
      strategy.push(`### 🐕 Shy/Skittish Dog Strategy`);
      strategy.push(`Shy dogs often **hide and won't come when called** — even to their owner.`);
      strategy.push(`1) **DO NOT CHASE OR CALL LOUDLY** — this scares them further`);
      strategy.push(`2) **Search at dawn/dusk/night** — shy dogs move when it's quiet`);
      strategy.push(`3) **Set a humane trap** with your worn clothing + smelly food`);
      strategy.push(`4) **Use calming signals** — sit sideways, don't make eye contact`);
      strategy.push(`5) **Check hiding spots** — under decks, in culverts, dense brush`);
    } else {
      strategy.push(`### 🐕 General Dog Search — First 60 Minutes`);
      strategy.push(`1) **Tight radius first (100-300 ft)** — call their name softly, pause, listen`);
      strategy.push(`2) **Check hiding spots** — under porches, sheds, crawlspaces, parked cars`);
      strategy.push(`3) **Alert immediate neighbors** — ask them to check garages/sheds`);
      strategy.push(`4) **Leave scent station** — your unwashed clothing + treats outside`);
      strategy.push(`5) **Flashlight at night** — look for eye-shine in bushes/under vehicles`);
    }
    
    strategy.push('');
    strategy.push(`### 📱 Report Now`);
    strategy.push(`Would you like help creating a **missing pet flyer** to post in that area?`);
    
    return strategy.join('\n');
  }
  
  // Cat-specific strategies
  if (animalType === 'cat') {
    const isIndoor = lowerDetails.includes('indoor') && !lowerDetails.includes('outdoor');
    const isShy = lowerDetails.includes('shy') || lowerDetails.includes('skittish') || lowerDetails.includes('scared');
    
    let strategy: string[] = [`**Search Plan for ${location}**`, ''];
    
    if (isIndoor) {
      strategy.push(`### 🐱 Indoor-Only Cat — CRITICAL`);
      strategy.push(`Indoor cats are usually **hiding within 3-5 houses** of home. They're terrified.`);
      strategy.push(`1) **DO NOT CALL LOUDLY** — this scares them deeper into hiding`);
      strategy.push(`2) **Search at night (10pm-2am)** — they come out when it's quiet`);
      strategy.push(`3) **Use a flashlight** — look for eye-shine under bushes, decks, cars`);
      strategy.push(`4) **Check YOUR property first** — under deck, in garage, shed, crawlspace`);
      strategy.push(`5) **Put litter box outside** — the scent travels far and guides them home`);
      strategy.push(`6) **Shake treat bag** at 2am — they respond when neighborhood is silent`);
    } else if (isShy) {
      strategy.push(`### 🐱 Shy Cat Strategy`);
      strategy.push(`Shy cats hide in **silence mode** — they won't meow or come when called.`);
      strategy.push(`1) **Night search only** — daytime is useless for shy cats`);
      strategy.push(`2) **Set a humane trap** — with your worn clothing + strong-smelling food`);
      strategy.push(`3) **Check EVERY hiding spot** — they squeeze into tiny spaces`);
      strategy.push(`4) **Ask neighbors to check** — garages, sheds, under decks`);
      strategy.push(`5) **Be patient** — shy cats can hide for 7-10 days before emerging`);
    } else {
      strategy.push(`### 🐱 Cat Search Strategy`);
      strategy.push(`Cats typically stay within **3-5 houses** of home, even outdoor cats.`);
      strategy.push(`1) **Search at night** — cats are most active 10pm-6am`);
      strategy.push(`2) **Put litter box outside** — familiar scent helps guide them home`);
      strategy.push(`3) **Check hiding spots** — under porches, in bushes, garage, shed`);
      strategy.push(`4) **Talk to ALL neighbors** — cats often get trapped in garages/sheds`);
      strategy.push(`5) **Leave food + water outside** — they'll return if they can`);
    }
    
    strategy.push('');
    strategy.push(`### 📱 Report Now`);
    strategy.push(`Would you like help creating a **missing pet flyer** to post nearby?`);
    
    return strategy.join('\n');
  }
  
  // Other animals
  return [
    `**Search Plan for ${location}**`,
    '',
    `For exotic pets, contact:`,
    `1) **Local animal control** — report immediately`,
    `2) **Exotic pet groups on Facebook** for your area`,
    `3) **Neighbors** — they may have seen something unusual`,
    '',
    `Would you like help creating a missing pet flyer?`
  ].join('\n');
}

/**
 * CLINICAL RESPONSE GENERATION ENGINE
 * 
 * Based on:
 * - Kenneth Doka's Disenfranchised Grief theory
 * - Pauline Boss's Ambiguous Loss framework
 * - CBT protocols for guilt restructuring
 * - Trauma-Informed Care principles
 * 
 * PRIORITY ORDER (CRITICAL - DO NOT REORDER):
 * 0. SUICIDE RISK TRIAGE - ALWAYS CHECK FIRST
 * 1. DEATH/GRIEF - Pet has died
 * 2. ANTICIPATORY GRIEF - Pet is dying/terminal
 * 3. GUILT ("IF ONLY") - CBT intervention needed
 * 4. DISENFRANCHISED GRIEF - Society minimizing their loss
 * 5. EMERGENCY - Injury, immediate danger
 * 6. SCAM WARNING - Suspicious contact
 * 7. AMBIGUOUS LOSS - Missing pet (frozen grief)
 * 8. FOUND PET - Living pet needs reunification
 * 9. PEDIATRIC GRIEF - Parent helping child
 * 10. EMOTIONAL SUPPORT - General distress
 * 11. PRACTICAL GUIDANCE - Search tips, resources
 */
// Local engine removed. Now using centralized Counselor Engine.

export default function SupportCompanionChat({
  onClose,
  initialCrisisType
}: SupportCompanionChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [companionState, setCompanionState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isTyping, setIsTyping] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [crisisType, setCrisisType] = useState<string | undefined>(initialCrisisType);
  const [showQuickActions, setShowQuickActions] = useState(!initialCrisisType);
  const [lostPetFlow, setLostPetFlow] = useState<LostPetFlow>({ stage: 'awaiting_animal_type' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (showQuickActions) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedResponse]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0 && !initialCrisisType) {
      const greeting = SUPPORT_COMPANION_OPENINGS[Math.floor(Math.random() * SUPPORT_COMPANION_OPENINGS.length)];
      simulateTyping(greeting, () => {
        setMessages([{
          id: Date.now().toString(),
          role: 'companion',
          content: greeting,
          timestamp: new Date()
        }]);
      });
    }
  }, []);

  // Typing simulation
  const simulateTyping = useCallback((text: string, onComplete?: () => void) => {
    setIsTyping(true);
    setCompanionState('speaking');
    setDisplayedResponse('');

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedResponse(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setCompanionState('idle');
        setDisplayedResponse('');
        onComplete?.();
      }
    }, SUPPORT_COMPANION_CONFIG.typingSpeed);

    return () => clearInterval(interval);
  }, []);

  // Handle quick action selection
  const handleQuickAction = (actionType: string) => {
    setShowQuickActions(false);
    setCrisisType(actionType);
    
    // Reset flow state for lost_pet
    if (actionType === 'lost_pet') {
      setLostPetFlow({ stage: 'awaiting_animal_type' });
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: (CRISIS_QUICK_ACTIONS as any[]).find((a: any) => a.type === actionType)?.label || actionType,
      timestamp: new Date()
    };
    setMessages([userMessage]);

    // Generate and display response
    setCompanionState('thinking');
    setTimeout(() => {
      // Use custom flow for lost_pet, otherwise use clinical response
      const response = actionType === 'lost_pet' 
        ? getAnimalTypePrompt()
        : generateClinicalResponse(userMessage.content).response;
      
      simulateTyping(response, () => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'companion',
          content: response,
          timestamp: new Date()
        }]);
      });
    }, SUPPORT_COMPANION_CONFIG.thinkingDelay);
  };

  // Handle message submission
  const handleSubmit = (e?: React.FormEvent) => {
    const handleSendMessage = () => {
      if (!inputValue.trim()) return;
      setShowQuickActions(false);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputValue.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setCompanionState('thinking');

      // Generate response after thinking delay
      setTimeout(() => {
        // LOST PET FLOW: multi-stage state machine
        if (crisisType === 'lost_pet') {
          let response: string;
          
          if (lostPetFlow.stage === 'awaiting_animal_type') {
            // Try to parse animal type from their message
            const animalType = parseAnimalType(userMessage.content);
            if (animalType) {
              response = getDetailsPrompt(animalType);
              setLostPetFlow({ stage: 'awaiting_details', animalType });
            } else {
              // Couldn't parse - ask again
              response = getAnimalTypePrompt();
            }
          } else if (lostPetFlow.stage === 'awaiting_details') {
            response = getLocationPrompt(lostPetFlow.animalType, userMessage.content);
            setLostPetFlow({ stage: 'awaiting_location', animalType: lostPetFlow.animalType, details: userMessage.content });
          } else if (lostPetFlow.stage === 'awaiting_location') {
            response = getSearchPlan(lostPetFlow.animalType, lostPetFlow.details, userMessage.content);
            setLostPetFlow({ stage: 'complete', animalType: lostPetFlow.animalType, details: lostPetFlow.details, location: userMessage.content });
          } else {
            // Flow complete - use default engine
            const { response: clinicalResponse } = generateClinicalResponse(userMessage.content);
            response = clinicalResponse;
          }
          
          simulateTyping(response, () => {
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'companion',
              content: response,
              timestamp: new Date()
            }]);
          });
          return;
        }

        // Default: use clinical response engine with just the latest message
        const { response } = generateClinicalResponse(userMessage.content);
        
        simulateTyping(response, () => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'companion',
            content: response,
            timestamp: new Date()
          }]);
        });
      }, SUPPORT_COMPANION_CONFIG.thinkingDelay);
    };

    e?.preventDefault();
    handleSendMessage();
  };

  const getQuickActionIcon = (type: string) => {
    switch (type) {
      case 'lost_pet': return <Search className="w-5 h-5" />;
      case 'found_pet': return <Heart className="w-5 h-5" />;
      case 'emergency': return <AlertTriangle className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700 bg-slate-800/50">
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
        )}
        <SupportCompanionAvatar size="md" state={companionState} />
        <div className="flex-1">
          <h2 className="text-white font-semibold">Support Companion</h2>
          <p className="text-slate-400 text-sm">
            {companionState === 'thinking' ? 'Thinking...' :
              companionState === 'speaking' ? 'Responding...' :
                'Here to help'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Actions (shown only at start) */}
        {showQuickActions && !initialCrisisType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <SupportCompanionAvatar size="xl" state={companionState} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-white text-xl font-semibold">
                How can I help you today?
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                I'm here to support you through any pet-related situation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {(CRISIS_QUICK_ACTIONS as any[]).map((action: any) => (
                <button
                  key={action.type}
                  onClick={() => handleQuickAction(action.type)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-teal-500 transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 group-hover:bg-teal-500/30">
                    {getQuickActionIcon(action.type)}
                  </div>
                  <span className="text-slate-200 text-sm font-medium">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message History */}
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl ${message.role === 'user'
                  ? 'bg-teal-600 text-white rounded-br-sm'
                  : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                  }`}
              >
                {message.role === 'companion' && (
                  <div className="flex items-center gap-2 mb-2">
                    <SupportCompanionAvatar size="sm" state="idle" />
                    <span className="text-teal-400 text-sm font-medium">Support Companion</span>
                  </div>
                )}
                <div className="leading-relaxed">{renderMarkdown(message.content)}</div>
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-teal-200' : 'text-slate-500'
                  }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && displayedResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] p-4 rounded-2xl bg-slate-700 text-slate-100 rounded-bl-sm">
              <div className="flex items-center gap-2 mb-2">
                <SupportCompanionAvatar size="sm" state="speaking" />
                <span className="text-teal-400 text-sm font-medium">Support Companion</span>
              </div>
              <div className="leading-relaxed">{renderMarkdown(displayedResponse)}</div>
            </div>
          </motion.div>
        )}

        {/* Thinking Indicator */}
        {companionState === 'thinking' && !isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="p-4 rounded-2xl bg-slate-700 rounded-bl-sm">
              <div className="flex items-center gap-3">
                <SupportCompanionAvatar size="sm" state="thinking" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isTyping || companionState === 'thinking'}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping || companionState === 'thinking'}
            className="p-3 rounded-xl bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-slate-500 text-xs mt-2">
          Your conversations are private and not stored
        </p>
      </form>
    </div>
  );
}
