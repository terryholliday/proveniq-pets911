/**
 * Safety UI Components
 * Low Cognition Mode, Grounding Tools, Waiting Room, Post-Crisis Mode, Scam Warning
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getHotlineCard, type Region } from './hotline-resolver';
import { type GroundingType } from './pipeline-orchestrator';

// ============================================================================
// LOW COGNITION CARD
// ============================================================================

interface LowCognitionCardProps {
  crisisType: string;
  region: Region;
  onCallNow?: () => void;
}

export const LowCognitionCard: React.FC<LowCognitionCardProps> = ({
  crisisType,
  region,
  onCallNow,
}) => {
  const hotlineCard = getHotlineCard(crisisType, region);
  
  if (!hotlineCard) {
    // Fallback to 988
    return (
      <div 
        className="bg-red-900/50 border-2 border-red-500 rounded-2xl p-6 text-center"
        role="alert"
        aria-live="assertive"
      >
        <h2 className="text-white text-2xl font-bold mb-4">You are not alone.</h2>
        <a
          href="tel:988"
          onClick={onCallNow}
          className="block bg-red-600 hover:bg-red-700 text-white py-4 px-8 rounded-xl text-2xl font-bold transition-colors"
        >
          📞 Call 988
        </a>
        <p className="text-red-200 mt-4 text-lg">24/7 • Free • Confidential</p>
      </div>
    );
  }
  
  return (
    <div 
      className="bg-red-900/50 border-2 border-red-500 rounded-2xl p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <h2 className="text-white text-2xl font-bold mb-2">You are not alone.</h2>
      <p className="text-red-200 mb-4">{hotlineCard.name}</p>
      
      <a
        href={hotlineCard.telLink}
        onClick={onCallNow}
        className="block bg-red-600 hover:bg-red-700 text-white py-4 px-8 rounded-xl text-2xl font-bold transition-colors mb-3"
      >
        📞 Call {hotlineCard.phoneFormatted}
      </a>
      
      {hotlineCard.textOption && (
        <p className="text-red-200 text-lg mb-2">
          Or: {hotlineCard.textOption}
        </p>
      )}
      
      <p className="text-red-300 text-sm">{hotlineCard.availability}</p>
    </div>
  );
};

// ============================================================================
// BOX BREATHING TOOL
// ============================================================================

interface BoxBreathingProps {
  onComplete?: () => void;
  cycles?: number;
}

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'complete';

export const BoxBreathing: React.FC<BoxBreathingProps> = ({
  onComplete,
  cycles = 3,
}) => {
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [count, setCount] = useState(4);
  const [currentCycle, setCurrentCycle] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const phaseConfig: Record<BreathPhase, { label: string; duration: number; next: BreathPhase }> = {
    inhale: { label: 'Breathe in...', duration: 4, next: 'hold1' },
    hold1: { label: 'Hold...', duration: 4, next: 'exhale' },
    exhale: { label: 'Breathe out...', duration: 4, next: 'hold2' },
    hold2: { label: 'Hold...', duration: 4, next: 'inhale' },
    complete: { label: 'Complete', duration: 0, next: 'complete' },
  };
  
  useEffect(() => {
    if (phase === 'complete') return;
    
    timerRef.current = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          const config = phaseConfig[phase];
          const nextPhase = config.next;
          
          // Check if completing a full cycle
          if (phase === 'hold2') {
            if (currentCycle >= cycles) {
              setPhase('complete');
              if (onComplete) onComplete();
              return 0;
            }
            setCurrentCycle(c => c + 1);
          }
          
          setPhase(nextPhase);
          return phaseConfig[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, currentCycle, cycles, onComplete]);
  
  if (phase === 'complete') {
    return (
      <div className="bg-slate-700 rounded-xl p-6 text-center">
        <div className="text-4xl mb-4">✨</div>
        <p className="text-white text-xl font-medium">Well done.</p>
        <p className="text-slate-300 mt-2">How do you feel?</p>
      </div>
    );
  }
  
  const phaseColors: Record<string, string> = {
    inhale: 'bg-blue-600',
    hold1: 'bg-purple-600',
    exhale: 'bg-green-600',
    hold2: 'bg-purple-600',
  };
  
  return (
    <div className="bg-slate-700 rounded-xl p-6 text-center">
      <p className="text-slate-400 text-sm mb-2">
        Cycle {currentCycle} of {cycles}
      </p>
      
      <div 
        className={`w-32 h-32 rounded-full ${phaseColors[phase]} flex items-center justify-center mx-auto mb-4 transition-all duration-1000`}
        style={{
          transform: phase === 'inhale' ? 'scale(1.2)' : phase === 'exhale' ? 'scale(0.8)' : 'scale(1)',
        }}
      >
        <span className="text-white text-4xl font-bold">{count}</span>
      </div>
      
      <p className="text-white text-xl font-medium">
        {phaseConfig[phase].label}
      </p>
    </div>
  );
};

// ============================================================================
// 5-4-3-2-1 GROUNDING TOOL
// ============================================================================

interface FiveToOneGroundingProps {
  onComplete?: () => void;
}

type SenseStep = 5 | 4 | 3 | 2 | 1 | 0;

const sensePrompts: Record<SenseStep, { sense: string; icon: string; prompt: string }> = {
  5: { sense: 'See', icon: '👁️', prompt: 'Name 5 things you can SEE right now' },
  4: { sense: 'Touch', icon: '✋', prompt: 'Name 4 things you can TOUCH or feel' },
  3: { sense: 'Hear', icon: '👂', prompt: 'Name 3 things you can HEAR' },
  2: { sense: 'Smell', icon: '👃', prompt: 'Name 2 things you can SMELL' },
  1: { sense: 'Taste', icon: '👅', prompt: 'Name 1 thing you can TASTE' },
  0: { sense: 'Complete', icon: '✨', prompt: 'You did great. Take a moment.' },
};

export const FiveToOneGrounding: React.FC<FiveToOneGroundingProps> = ({
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<SenseStep>(5);
  const [items, setItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const requiredItems = currentStep as number;
  const currentPrompt = sensePrompts[currentStep];
  
  const handleAddItem = () => {
    if (!inputValue.trim()) return;
    
    const newItems = [...items, inputValue.trim()];
    setItems(newItems);
    setInputValue('');
    
    if (newItems.length >= requiredItems) {
      // Move to next step
      const nextStep = (currentStep - 1) as SenseStep;
      setCurrentStep(nextStep);
      setItems([]);
      
      if (nextStep === 0 && onComplete) {
        onComplete();
      }
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };
  
  if (currentStep === 0) {
    return (
      <div className="bg-slate-700 rounded-xl p-6 text-center">
        <div className="text-4xl mb-4">{currentPrompt.icon}</div>
        <p className="text-white text-xl font-medium">{currentPrompt.prompt}</p>
        <p className="text-slate-300 mt-2">How do you feel now?</p>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl">{currentPrompt.icon}</span>
        <span className="text-slate-400 text-sm">
          {items.length} / {requiredItems}
        </span>
      </div>
      
      <p className="text-white text-lg font-medium mb-4">
        {currentPrompt.prompt}
      </p>
      
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {items.map((item, i) => (
            <span 
              key={i}
              className="bg-slate-600 text-slate-200 px-3 py-1 rounded-full text-sm"
            >
              {item}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Type something you can ${currentPrompt.sense.toLowerCase()}...`}
          className="flex-1 bg-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={currentPrompt.prompt}
        />
        <button
          onClick={handleAddItem}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// GROUNDING TOOL WRAPPER
// ============================================================================

interface GroundingToolProps {
  type: GroundingType;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export const GroundingTool: React.FC<GroundingToolProps> = ({
  type,
  onComplete,
  onDismiss,
}) => {
  return (
    <div className="relative" tabIndex={-1}>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 text-slate-400 hover:text-white"
          aria-label="Close grounding exercise"
        >
          ✕
        </button>
      )}
      
      {type === 'box_breathing' && <BoxBreathing onComplete={onComplete} />}
      {type === '5-4-3-2-1' && <FiveToOneGrounding onComplete={onComplete} />}
      {type === 'grounding_questions' && <FiveToOneGrounding onComplete={onComplete} />}
    </div>
  );
};

// ============================================================================
// WAITING ROOM MODE
// ============================================================================

interface WaitingRoomProps {
  onDistractMe?: () => void;
  onSitQuietly?: () => void;
  distractionMode: boolean;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  onDistractMe,
  onSitQuietly,
  distractionMode,
}) => {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="animate-pulse-slow bg-slate-700/50 rounded-xl p-6 text-center">
      <div className="text-4xl mb-4">⏱️</div>
      
      <p className="text-white text-xl font-medium mb-2">
        Help is on the way.
      </p>
      <p className="text-slate-300 mb-4">
        I'm here with you.
      </p>
      
      <p className="text-slate-400 text-sm mb-6">
        Waiting: {formatTime(elapsed)}
      </p>
      
      {!distractionMode ? (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onDistractMe}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Distract me
          </button>
          <button
            onClick={onSitQuietly}
            className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Sit quietly
          </button>
        </div>
      ) : (
        <div className="text-slate-300">
          <p>Did you know...</p>
          <p className="text-white mt-2">
            Dogs can smell up to 100,000 times better than humans.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SCAM WARNING UI
// ============================================================================

interface ScamWarningProps {
  onDismiss?: () => void;
}

export const ScamWarning: React.FC<ScamWarningProps> = ({ onDismiss }) => {
  return (
    <div className="bg-red-900/50 border-2 border-red-500 rounded-xl p-4">
      <div className="flex items-center gap-2 text-red-300 font-bold mb-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        SCAM WARNING
      </div>
      
      <ul className="text-red-100 text-sm space-y-2">
        <li className="flex items-center gap-2">
          <span className="text-red-400">🚫</span>
          NEVER share verification codes
        </li>
        <li className="flex items-center gap-2">
          <span className="text-red-400">🚫</span>
          NEVER send money before meeting
        </li>
        <li className="flex items-center gap-2">
          <span className="text-red-400">🚫</span>
          AVOID Western Union, gift cards, crypto
        </li>
      </ul>
      
      <p className="mt-4 text-red-200 text-sm">
        If someone is pressuring you to act fast, it's almost certainly a scam.
      </p>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="mt-4 text-red-300 hover:text-white text-sm underline"
        >
          I understand
        </button>
      )}
    </div>
  );
};

// ============================================================================
// CRISIS CONFIRMATION BUTTONS
// ============================================================================

interface CrisisConfirmationProps {
  paraphrase: string;
  onConfirm: () => void;
  onDeny: () => void;
}

export const CrisisConfirmation: React.FC<CrisisConfirmationProps> = ({
  paraphrase,
  onConfirm,
  onDeny,
}) => {
  return (
    <div className="bg-slate-700 rounded-xl p-4 mt-3">
      <p className="text-slate-300 mb-4">
        Before I proceed, I want to make sure I understood correctly. Are you saying {paraphrase}?
      </p>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onConfirm}
          className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Yes, I need help
        </button>
        <button
          onClick={onDeny}
          className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          No, you misunderstood
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// SAFETY EXIT BUTTON
// ============================================================================

interface SafetyExitButtonProps {
  onClick: () => void;
  className?: string;
}

export const SafetyExitButton: React.FC<SafetyExitButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`text-slate-500 hover:text-slate-300 text-sm transition-colors ${className}`}
      aria-label="Quick exit - press to leave site immediately"
      title="Press Escape twice for quick exit"
    >
      Quick Exit (Esc×2)
    </button>
  );
};
