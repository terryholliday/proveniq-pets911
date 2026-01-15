/**
 * SupportCompanionChat - Main Component
 * Complete orchestrator integrating all safety systems, UI components, and state management
 * 
 * FEATURES:
 * - Crisis detection with 400+ behavioral markers
 * - Disambiguation (negations, idioms) to reduce false positives
 * - Single decision pipeline: Safety → Grounding → Waiting Room → Lost Pet → Clinical
 * - Low cognition mode for CRITICAL/HIGH tiers
 * - Bystander mode detection
 * - Waiting room mode
 * - Post-crisis mode
 * - Safety exit (Shift+Esc, /exit, mobile triple-tap)
 * - Region-aware hotline substitution
 * - Volatility detection
 * - Follow-through tracking
 * - Session facts extraction (prevents re-asking answered questions)
 * - Single-flight request deduplication
 * - Full accessibility (ARIA, focus management, reduced motion)
 * - Error boundary with fallback hotline
 * - Response guards (authority claims, prohibited phrases)
 * - Means redaction for logs/exports only (NOT visible chat)
 */

'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';

// Config
import {
  OPENINGS,
  QUICK_ACTIONS,
  UI_CONFIG,
  HOTLINES,
  WAITING_ROOM_MODE,
  LOW_COGNITION_MODE,
  POST_CRISIS_MODE,
  type RiskTier,
} from './companion-config';

// Safety systems
import {
  assessCrisis,
  createVolatilityTracker,
  detectVolatilitySignals,
  isNighttimeLocal,
  type CrisisAssessment,
  type VolatilityTracker,
} from './crisis-engine';

import {
  processPipeline,
  type PipelineContext,
  type ResponseMode,
  type GroundingType,
  generateHandoffPacket,
} from './pipeline-orchestrator';

import { detectRegion, resolveHotlines, type Region } from './hotline-resolver';

import {
  createSessionFacts,
  extractFactsFromMessage,
  mergeFacts,
  buildContextFromFacts,
  generateVetERCardData,
  generateLostPetCardData,
  type SessionFacts,
} from './session-facts';

import { runAllGuards } from './guards';

// Hooks
import { useSafetyExit } from './useSafetyExit';
import { useMobileSafetyGesture } from './useMobileSafetyGesture';
import { useReducedMotion } from './useReducedMotion';
import { useSingleFlight } from './useSingleFlight';
import { useOfflineMode } from './useOfflineMode';
import { useFollowThrough } from './useFollowThrough';

// Components
import { SafetyErrorBoundary } from './SafetyErrorBoundary';
import {
  LowCognitionCard,
  GroundingTool,
  WaitingRoom,
  ScamWarning,
  CrisisConfirmation,
  SafetyExitButton,
} from './SafetyUI';
import { VisualAid, type VisualAidType } from './VisualAids';
import { TakeawayCard, type TakeawayCardType } from './DigitalTakeaway';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'companion' | 'system';
  content: string;
  timestamp: Date;
  assessment?: CrisisAssessment;
}

interface PendingConfirmation {
  assessment: CrisisAssessment;
  originalMessage: string;
  paraphrase: string;
}

interface SupportCompanionChatProps {
  onClose?: () => void;
  petName?: string;
  caseId?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function prefersReducedMotionCheck(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SupportCompanionChatInner: React.FC<SupportCompanionChatProps> = ({ onClose, petName, caseId }) => {
  // =========================================================================
  // STATE
  // =========================================================================
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [companionState, setCompanionState] = useState<'idle' | 'thinking' | 'typing'>('idle');
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [riskTier, setRiskTier] = useState<RiskTier>('STANDARD');
  const [currentMode, setCurrentMode] = useState<ResponseMode>('STANDARD');
  
  // Safety mode states
  const [lowCognitionMode, setLowCognitionMode] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);
  const [groundingType, setGroundingType] = useState<GroundingType | null>(null);
  const [showVisualAid, setShowVisualAid] = useState<VisualAidType | null>(null);
  const [showTakeawayCard, setShowTakeawayCard] = useState<TakeawayCardType | null>(null);
  const [showScamWarning, setShowScamWarning] = useState(false);
  const [waitingRoomMode, setWaitingRoomMode] = useState(false);
  const [waitingDistraction, setWaitingDistraction] = useState(false);
  const [postCrisisMode, setPostCrisisMode] = useState(false);
  
  // Confirmation state
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [crisisConfirmed, setCrisisConfirmed] = useState(false);
  
  // =========================================================================
  // REFS (for stale state prevention)
  // =========================================================================
  
  const messagesRef = useRef<Message[]>([]);
  const volatilityRef = useRef<VolatilityTracker>(createVolatilityTracker());
  const sessionFactsRef = useRef<SessionFacts>(createSessionFacts());
  const previousAssessmentRef = useRef<CrisisAssessment | null>(null);
  const riskTierRef = useRef<RiskTier>('STANDARD');
  const regionRef = useRef<Region>('US');
  const sessionStartRef = useRef<Date>(new Date());
  
  // Timer refs for cleanup
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  // Focus management refs
  const groundingRef = useRef<HTMLDivElement>(null);
  const crisisCardRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // =========================================================================
  // HOOKS
  // =========================================================================
  
  const prefersReducedMotion = useReducedMotion();
  const { isOffline } = useOfflineMode();
  const singleFlight = useSingleFlight();
  
  // Safety exit
  const handleSafetyExitCleanup = useCallback(() => {
    setMessages([]);
    setDisplayedResponse('');
    setInputValue('');
    setCompanionState('idle');
    setRiskTier('STANDARD');
    setLowCognitionMode(false);
    setShowGrounding(false);
    setShowVisualAid(null);
    setShowTakeawayCard(null);
    setPendingConfirmation(null);
    setWaitingRoomMode(false);
    setPostCrisisMode(false);
  }, []);
  
  const {
    triggerSafetyExit,
    registerInterval,
    registerTimeout,
    clearAllIntervals,
    clearAllTimeouts,
    onHeaderTap,
    isExitCommand,
  } = useSafetyExit({
    onExit: handleSafetyExitCleanup,
    intervalsRef,
    timeoutsRef,
    blurOnExit: true,
  });
  
  // Mobile safety gesture (for areas other than header)
  const { handleTap: handleMobileSafetyTap } = useMobileSafetyGesture({
    onTrigger: triggerSafetyExit,
  });
  
  // Follow-through tracking
  const appendSystemMessage = useCallback((content: string) => {
    const msg: Message = {
      id: `system-${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  }, []);
  
  const { startFollowThrough, recordResponse: recordFollowThroughResponse } = useFollowThrough({
    onCheckIn: appendSystemMessage,
    timeoutsRef,
  });
  
  // =========================================================================
  // SYNC REFS WITH STATE
  // =========================================================================
  
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  useEffect(() => {
    riskTierRef.current = riskTier;
  }, [riskTier]);
  
  // =========================================================================
  // PREFILL FROM LOST PET REPORT (sessionStorage bridge)
  // =========================================================================
  
  useEffect(() => {
    // Check sessionStorage for lost pet draft data
    try {
      const stored = sessionStorage.getItem('mayday_lost_pet_draft');
      if (stored) {
        const draft = JSON.parse(stored);
        // Map PetReport fields to SessionFacts
        const prefilled: Partial<SessionFacts> = {};
        if (draft.name) prefilled.petName = draft.name;
        if (draft.species) prefilled.petSpecies = draft.species.toLowerCase();
        if (draft.breed) prefilled.petBreed = draft.breed;
        if (draft.color) prefilled.petColor = draft.color;
        if (draft.lastSeenLocation) prefilled.lastSeenLocation = draft.lastSeenLocation;
        if (draft.lastSeenTime) prefilled.lastSeenTime = draft.lastSeenTime;
        if (draft.lastSeenDate) prefilled.lastSeen = draft.lastSeenDate;
        if (draft.ownerName) prefilled.userName = draft.ownerName;
        if (draft.ownerPhone) prefilled.contactPhone = draft.ownerPhone;
        if (draft.isChipped !== null) prefilled.microchipped = draft.isChipped;
        if (draft.collarDescription) prefilled.wearingCollar = !!draft.collarDescription;
        
        // Merge into sessionFactsRef
        sessionFactsRef.current = mergeFacts(sessionFactsRef.current, prefilled);
        console.log('[SUPPORT_COMPANION] Prefilled facts from lost pet draft:', prefilled);
      }
    } catch (e) {
      // Silently fail - sessionStorage may not be available
    }
    
    // Also check for petName prop (passed directly from widget)
    if (petName) {
      sessionFactsRef.current = mergeFacts(sessionFactsRef.current, { petName });
    }
  }, [petName]);
  
  // =========================================================================
  // OPENING MESSAGE
  // =========================================================================
  
  const opening = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * OPENINGS.length);
    return OPENINGS[randomIndex];
  }, []);
  
  useEffect(() => {
    if (messages.length === 0) {
      simulateTyping(`${opening.greeting}\n\n${opening.prompt}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // =========================================================================
  // AUTO-SCROLL
  // =========================================================================
  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, displayedResponse]);
  
  // =========================================================================
  // FOCUS MANAGEMENT
  // =========================================================================
  
  useEffect(() => {
    if (showGrounding && groundingRef.current) {
      groundingRef.current.focus();
    }
  }, [showGrounding]);
  
  useEffect(() => {
    if ((riskTier === 'CRITICAL' || riskTier === 'HIGH') && crisisCardRef.current) {
      crisisCardRef.current.focus();
    }
  }, [riskTier]);
  
  // =========================================================================
  // TYPING SIMULATION
  // =========================================================================
  
  const simulateTyping = useCallback((
    text: string,
    onComplete?: () => void
  ) => {
    // Skip animation for reduced motion, CRITICAL/HIGH tiers, or if specified
    const skipAnimation = 
      prefersReducedMotion || 
      prefersReducedMotionCheck() ||
      riskTierRef.current === 'CRITICAL' || 
      riskTierRef.current === 'HIGH';
    
    if (skipAnimation) {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'companion',
        content: text,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setDisplayedResponse('');
      setCompanionState('idle');
      
      if (onComplete) onComplete();
      return;
    }
    
    setDisplayedResponse('');
    setCompanionState('typing');
    
    let index = 0;
    const speed = riskTierRef.current === 'HIGH' 
      ? UI_CONFIG?.typingSpeed?.crisis || 10 
      : Math.floor(Math.random() * ((UI_CONFIG?.typingSpeed?.max || 35) - (UI_CONFIG?.typingSpeed?.min || 15))) + (UI_CONFIG?.typingSpeed?.min || 15);
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedResponse(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        intervalsRef.current.delete(interval);
        
        const newMessage: Message = {
          id: Date.now().toString(),
          role: 'companion',
          content: text,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, newMessage]);
        setDisplayedResponse('');
        setCompanionState('idle');
        
        if (onComplete) onComplete();
      }
    }, speed);
    
    intervalsRef.current.add(interval);
    registerInterval(interval);
  }, [prefersReducedMotion, registerInterval]);
  
  // =========================================================================
  // CLINICAL RESPONSE GENERATION
  // =========================================================================
  
  const generateClinicalResponse = useCallback((
    userMessage: string,
    assessment: CrisisAssessment,
    historyWindow: string,
    factsBlock: string
  ): string => {
    // This is where you'd integrate with an LLM API
    // The key is injecting history + facts to prevent re-asking questions
    
    const sessionFacts = sessionFactsRef.current;
    
    // Build personalized response based on context
    let response = '';
    
    if (sessionFacts.petName) {
      response += `I hear you about ${sessionFacts.petName}. `;
    }
    
    // Check for volatility
    const hasVolatility = detectVolatilitySignals(messagesRef.current);
    if (hasVolatility) {
      response = "I'm noticing a shift in what you're saying. Before we continue: are you feeling safe right now?\n\n" + response;
    }
    
    // Add nighttime context if applicable
    if (isNighttimeLocal() && (assessment.tier === 'HIGH' || assessment.tier === 'MEDIUM')) {
      response += "It's late where you are. If this is urgent, don't wait to reach out for support.\n\n";
    }
    
    response += "I'm here with you. Tell me more about what's happening.";
    
    return response;
  }, []);
  
  // =========================================================================
  // MAIN MESSAGE PROCESSING
  // =========================================================================
  
  const processMessage = useCallback(async (userMessage: string) => {
    // Check for exit command
    if (isExitCommand(userMessage)) {
      triggerSafetyExit();
      return;
    }
    
    // Single-flight: start new request, invalidate previous
    const requestId = singleFlight.start();
    
    // Add user message immediately
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setCompanionState('thinking');
    
    // Extract and update session facts (prevents re-asking)
    const newFacts = extractFactsFromMessage(userMessage);
    sessionFactsRef.current = mergeFacts(sessionFactsRef.current, newFacts);
    
    // Detect region from conversation
    regionRef.current = detectRegion(messagesRef.current);
    
    // Assess crisis with disambiguation
    const { assessment, updatedVolatility } = assessCrisis(
      userMessage,
      volatilityRef.current
    );
    volatilityRef.current = updatedVolatility;
    
    // Store assessment on message for reference
    userMsg.assessment = assessment;
    
    // Update risk tier
    setRiskTier(assessment.tier);
    
    // Determine low cognition mode
    const useLowCog = 
      (assessment.tier === 'CRITICAL' || assessment.tier === 'HIGH') &&
      (LOW_COGNITION_MODE?.enabled ?? true);
    setLowCognitionMode(useLowCog);
    
    // Check for follow-through response
    const lower = userMessage.toLowerCase();
    if (lower === 'yes' || lower === 'no' || lower.includes('still trying')) {
      const response = lower === 'yes' ? 'yes' : lower === 'no' ? 'no' : 'trying';
      recordFollowThroughResponse(response);
    }
    
    // Thinking delay
    const delay = setTimeout(async () => {
      // Check if this request is still active
      if (!singleFlight.isActive(requestId)) {
        console.log('Dropping stale request');
        return;
      }
      
      // Build pipeline context
      const pipelineContext: PipelineContext = {
        userMessage,
        assessment,
        region: regionRef.current,
        sessionFacts: sessionFactsRef.current,
        previousAssessment: previousAssessmentRef.current,
        isPostCrisis: postCrisisMode,
        crisisConfirmed,
      };
      
      // Process through pipeline
      const result = processPipeline(pipelineContext);
      
      // Update previous assessment
      previousAssessmentRef.current = assessment;
      
      // Handle result
      setCurrentMode(result.mode);
      
      // Handle confirmation requirement for CRITICAL
      if (result.requiresConfirmation && result.confirmationParaphrase) {
        setPendingConfirmation({
          assessment,
          originalMessage: userMessage,
          paraphrase: result.confirmationParaphrase,
        });
        setCompanionState('idle');
        singleFlight.finish(requestId);
        return;
      }
      
      // Update UI state based on pipeline result
      if (result.showGrounding && result.groundingType) {
        setShowGrounding(true);
        setGroundingType(result.groundingType);
      }
      
      if (result.showVisualAid) {
        setShowVisualAid(result.showVisualAid);
      }
      
      if (result.showTakeawayCard) {
        setShowTakeawayCard(result.showTakeawayCard);
      }
      
      if (result.enterWaitingRoom) {
        setWaitingRoomMode(true);
      }
      
      if (result.enterPostCrisis) {
        setPostCrisisMode(true);
      }
      
      if (result.mode === 'SCAM_WARNING') {
        setShowScamWarning(true);
      }
      
      // Generate response
      let finalResponse = result.response;
      
      // If no template response, generate clinical response with context injection
      if (!finalResponse) {
        // Build history window for context
        const historyWindow = messagesRef.current
          .slice(-10)
          .map(m => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n');
        
        // Build facts block
        const factsBlock = Object.entries(sessionFactsRef.current)
          .filter(([_, v]) => v != null)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join(', ') || 'None';
        
        finalResponse = generateClinicalResponse(
          userMessage,
          assessment,
          historyWindow,
          factsBlock
        );
      }
      
      // Resolve hotline placeholders
      finalResponse = resolveHotlines(finalResponse, regionRef.current);
      
      // Apply response guards (authority claims, prohibited phrases)
      const guardResult = runAllGuards(finalResponse);
      finalResponse = guardResult.clean;
      
      // Apply post-crisis constraints
      if (postCrisisMode && POST_CRISIS_MODE?.enabled) {
        const maxLen = POST_CRISIS_MODE.constraints?.maxResponseLength ?? 200;
        if (finalResponse.length > maxLen) {
          finalResponse = finalResponse.slice(0, maxLen) + '...';
        }
        finalResponse = "I'm glad you're still here. " + finalResponse;
      }
      
      // Generate handoff packet for CRITICAL/HIGH (for monitoring, not display)
      if (assessment.requiresHumanHandoff) {
        const packet = generateHandoffPacket(
          assessment,
          messagesRef.current.length,
          regionRef.current,
          sessionStartRef.current
        );
        console.log('[HANDOFF_PACKET]', packet);
        // In production: send to monitoring API
      }
      
      // Start follow-through if user indicates they will call
      if (
        (assessment.tier === 'CRITICAL' || assessment.tier === 'HIGH') &&
        (lower.includes('i will call') || lower.includes("i'll call") || lower.includes('calling now'))
      ) {
        const hotline = HOTLINES[regionRef.current]?.crisis_988 || HOTLINES.US.crisis_988;
        startFollowThrough(hotline);
      }
      
      // Display response
      if (finalResponse) {
        simulateTyping(finalResponse, () => {
          singleFlight.finish(requestId);
          inputRef.current?.focus();
        });
      } else {
        setCompanionState('idle');
        singleFlight.finish(requestId);
      }
      
    }, UI_CONFIG?.thinkingDelay || 800);
    
    timeoutsRef.current.add(delay);
    registerTimeout(delay);
    
  }, [
    crisisConfirmed,
    postCrisisMode,
    singleFlight,
    isExitCommand,
    triggerSafetyExit,
    generateClinicalResponse,
    simulateTyping,
    registerTimeout,
    startFollowThrough,
    recordFollowThroughResponse,
  ]);
  
  // =========================================================================
  // CONFIRMATION HANDLERS
  // =========================================================================
  
  const handleConfirmCrisis = useCallback(() => {
    if (!pendingConfirmation) return;
    
    setCrisisConfirmed(true);
    setPendingConfirmation(null);
    
    // Re-process with confirmation
    const pipelineContext: PipelineContext = {
      userMessage: pendingConfirmation.originalMessage,
      assessment: pendingConfirmation.assessment,
      region: regionRef.current,
      sessionFacts: sessionFactsRef.current,
      previousAssessment: previousAssessmentRef.current,
      isPostCrisis: postCrisisMode,
      crisisConfirmed: true,
    };
    
    const result = processPipeline(pipelineContext);
    
    let response = result.response;
    if (response) {
      response = resolveHotlines(response, regionRef.current);
      simulateTyping(response);
    }
    
    // Generate handoff packet
    if (pendingConfirmation.assessment.requiresHumanHandoff) {
      const packet = generateHandoffPacket(
        pendingConfirmation.assessment,
        messagesRef.current.length,
        regionRef.current,
        sessionStartRef.current
      );
      console.log('[HANDOFF_PACKET_CONFIRMED]', packet);
    }
  }, [pendingConfirmation, postCrisisMode, simulateTyping]);
  
  const handleDenyCrisis = useCallback(() => {
    setPendingConfirmation(null);
    setRiskTier('STANDARD');
    setLowCognitionMode(false);
    
    simulateTyping(
      "I apologize for misunderstanding. Please tell me in your own words what's happening, and I'll do my best to help."
    );
  }, [simulateTyping]);
  
  // =========================================================================
  // SAFETY CONFIRMATION HANDLERS
  // =========================================================================
  
  const handleUserSafe = useCallback(() => {
    setRiskTier('STANDARD');
    setLowCognitionMode(false);
    sessionFactsRef.current = { ...sessionFactsRef.current, userConfirmedSafe: true };
    
    simulateTyping("Thank you for telling me. What's happening right now?");
  }, [simulateTyping]);
  
  const handleUserMisunderstood = useCallback(() => {
    setRiskTier('STANDARD');
    setLowCognitionMode(false);
    
    simulateTyping("I'm sorry I misunderstood. Tell me in your own words what's going on.");
  }, [simulateTyping]);
  
  // =========================================================================
  // FORM SUBMIT
  // =========================================================================
  
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmed = inputValue.trim();
    if (!trimmed || companionState !== 'idle') return;
    
    setInputValue('');
    processMessage(trimmed);
  }, [inputValue, companionState, processMessage]);
  
  // =========================================================================
  // QUICK ACTIONS
  // =========================================================================
  
  const handleQuickAction = useCallback((action: typeof QUICK_ACTIONS[0]) => {
    const prompts: Record<string, string> = {
      pet_emergency: "I think my pet is having an emergency",
      lost_pet: "My pet is missing",
      feeling_low: "I'm not doing so well",
      grief: "I lost my pet recently",
      just_talk: "I just need someone to talk to",
    };
    
    const message = prompts[action.id] || action.label;
    setInputValue('');
    processMessage(message);
  }, [processMessage]);
  
  // =========================================================================
  // CRISIS ACTION BUTTON
  // =========================================================================
  
  const crisisPrimaryAction = useMemo(() => {
    const hotline = HOTLINES[regionRef.current]?.crisis_988 || HOTLINES.US.crisis_988;
    return { label: `Call ${hotline}`, href: `tel:${hotline}` };
  }, []);
  
  // =========================================================================
  // RENDER
  // =========================================================================
  
  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header - triple tap triggers exit on mobile */}
      <header 
        className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700"
        onClick={onHeaderTap}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🐾</span>
          </div>
          <div>
            <h1 className="text-white font-semibold">Support Companion</h1>
            <p className="text-slate-400 text-sm">Here for you</p>
          </div>
        </div>
        
        <SafetyExitButton onClick={triggerSafetyExit} />
      </header>
      
      {/* Offline banner */}
      {isOffline && (
        <div className="px-4 py-2 bg-amber-900/40 border-b border-amber-700 text-amber-100 text-sm">
          Limited connectivity. If this is urgent, call emergency services directly.
        </div>
      )}
      
      {/* Chat area */}
      <main 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation with Support Companion"
      >
        {/* CRITICAL/HIGH Low Cognition Card */}
        {(riskTier === 'CRITICAL' || riskTier === 'HIGH') && lowCognitionMode && !pendingConfirmation && (
          <div ref={crisisCardRef} tabIndex={-1} role="alert" aria-live="assertive">
            <LowCognitionCard
              crisisType={previousAssessmentRef.current?.primaryCrisis || 'suicide'}
              region={regionRef.current}
              onCallNow={() => {
                const hotline = HOTLINES[regionRef.current]?.crisis_988 || HOTLINES.US.crisis_988;
                startFollowThrough(hotline);
              }}
            />
            
            {/* Misclassification recovery buttons */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleUserSafe}
                className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                ✓ I'm safe
              </button>
              <button
                onClick={handleUserMisunderstood}
                className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                You misunderstood
              </button>
              <button
                onClick={() => {}} // Stay in CRITICAL
                className="bg-red-700 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                ⚠ I'm NOT safe
              </button>
            </div>
          </div>
        )}
        
        {/* Crisis Confirmation Dialog */}
        {pendingConfirmation && (
          <CrisisConfirmation
            paraphrase={pendingConfirmation.paraphrase}
            onConfirm={handleConfirmCrisis}
            onDeny={handleDenyCrisis}
          />
        )}
        
        {/* Waiting Room Mode */}
        {waitingRoomMode && (
          <WaitingRoom
            onDistractMe={() => setWaitingDistraction(true)}
            onSitQuietly={() => setWaitingDistraction(false)}
            distractionMode={waitingDistraction}
          />
        )}
        
        {/* Scam Warning */}
        {showScamWarning && (
          <ScamWarning onDismiss={() => setShowScamWarning(false)} />
        )}
        
        {/* Grounding Tool */}
        {showGrounding && groundingType && (
          <div ref={groundingRef} tabIndex={-1}>
            <GroundingTool
              type={groundingType}
              onComplete={() => setShowGrounding(false)}
              onDismiss={() => setShowGrounding(false)}
            />
          </div>
        )}
        
        {/* Visual Aid */}
        {showVisualAid && (
          <VisualAid
            type={showVisualAid}
            onDismiss={() => setShowVisualAid(null)}
          />
        )}
        
        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-teal-700 text-white'
                  : message.role === 'system'
                  ? 'bg-slate-700 text-slate-200 border border-slate-600'
                  : 'bg-slate-800 text-slate-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {companionState === 'typing' && displayedResponse && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-slate-800 text-slate-100">
              <p className="whitespace-pre-wrap">{displayedResponse}</p>
              <span className="inline-block w-2 h-4 bg-slate-400 animate-pulse ml-1" />
            </div>
          </div>
        )}
        
        {/* Thinking indicator */}
        {companionState === 'thinking' && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 bg-slate-800 text-slate-400">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        
        {/* Screen reader typing announcement */}
        {companionState === 'typing' && (
          <div aria-live="polite" className="sr-only">
            Support Companion is typing a response
          </div>
        )}
        
        {/* Takeaway Card */}
        {showTakeawayCard && (
          <TakeawayCard
            type={showTakeawayCard}
            vetERData={showTakeawayCard === 'vet_er' 
              ? generateVetERCardData(sessionFactsRef.current) || undefined 
              : undefined
            }
            lostPetData={showTakeawayCard === 'lost_pet_flyer'
              ? generateLostPetCardData(sessionFactsRef.current) || undefined
              : undefined
            }
            onDismiss={() => setShowTakeawayCard(null)}
          />
        )}
        
        {/* Quick Actions (only show at start) */}
        {messages.length <= 1 && companionState === 'idle' && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-full text-sm transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        
        <div ref={chatEndRef} />
      </main>
      
      {/* Input area */}
      <footer className="p-4 bg-slate-800 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700 text-white rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={companionState !== 'idle' || !!pendingConfirmation}
            aria-label="Message input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || companionState !== 'idle' || !!pendingConfirmation}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full transition-colors font-medium"
            aria-label="Send message"
          >
            Send
          </button>
        </form>
        
        {/* Helper links */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400 justify-center">
          <button
            type="button"
            onClick={() => { setShowGrounding(true); setGroundingType('box_breathing'); }}
            className="hover:text-slate-200 underline"
          >
            Box breathing
          </button>
          <button
            type="button"
            onClick={() => { setShowGrounding(true); setGroundingType('5-4-3-2-1'); }}
            className="hover:text-slate-200 underline"
          >
            5-4-3-2-1
          </button>
          <button
            type="button"
            onClick={triggerSafetyExit}
            className="hover:text-slate-200 underline"
          >
            Quick exit
          </button>
        </div>
        
        <p className="text-slate-500 text-xs text-center mt-2">
          If you're in crisis, call <strong>988</strong> • Press Shift+Esc to exit quickly
        </p>
      </footer>
    </div>
  );
};

// ============================================================================
// WRAPPED WITH ERROR BOUNDARY
// ============================================================================

const SupportCompanionChat: React.FC<SupportCompanionChatProps> = ({ onClose, petName, caseId }) => {
  return (
    <SafetyErrorBoundary fallbackHotline="988">
      <SupportCompanionChatInner onClose={onClose} petName={petName} caseId={caseId} />
    </SafetyErrorBoundary>
  );
};

export default SupportCompanionChat;
