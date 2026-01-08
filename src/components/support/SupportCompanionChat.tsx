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
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
              <p className="leading-relaxed whitespace-pre-wrap">{displayedResponse}</p>
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
