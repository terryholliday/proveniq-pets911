'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CooldownEvent, CooldownType } from '@/types/training';

// ============================================================================
// TYPES
// ============================================================================

interface CooldownConfig {
  type: CooldownType;
  title: string;
  description: string;
  icon: string;
  color: 'amber' | 'red' | 'blue' | 'purple';
  allowedActions: string[];
  resources: { title: string; link?: string }[];
}

const COOLDOWN_CONFIGS: Record<string, CooldownConfig> = {
  '2_code_red_60min': {
    type: 'short_break',
    title: 'Short Break Required',
    description: "You've handled 2 Code Red cases in the last hour. Take a 15-minute breather.",
    icon: '☕',
    color: 'amber',
    allowedActions: ['View Code Green posts', 'Review training', 'Message team'],
    resources: [{ title: 'Peer support chat available' }],
  },
  '5_code_red_24hr': {
    type: 'tier_restriction',
    title: 'Extended Cooldown',
    description: "You've handled 5 Code Red cases in 24 hours. You're restricted to Code Green cases.",
    icon: '🌙',
    color: 'purple',
    allowedActions: ['Code Green posts only', 'Training modules', 'Documentation'],
    resources: [
      { title: 'Peer support chat' },
      { title: 'Crisis Text Line: HOME to 741741' },
    ],
  },
  'manual_guardian': {
    type: 'mandatory_debrief',
    title: 'Guardian-Initiated Break',
    description: 'A Community Guardian has initiated a mandatory break. Please check your messages.',
    icon: '🛡️',
    color: 'blue',
    allowedActions: ['Read messages', 'View low-priority posts'],
    resources: [{ title: 'Check messages for more information' }],
  },
  'graphic_content_exposure': {
    type: 'short_break',
    title: 'Take a Moment',
    description: "You've viewed multiple pieces of graphic content. Your wellbeing matters.",
    icon: '💚',
    color: 'amber',
    allowedActions: ['Non-urgent tasks', 'Training', 'Documentation'],
    resources: [
      { title: 'Breathing exercise', link: '/resources/breathing' },
      { title: 'Peer support' },
    ],
  },
  'full_lockout': {
    type: 'full_lockout',
    title: 'Account Temporarily Restricted',
    description: 'Your account has been temporarily restricted. Please contact support.',
    icon: '⚠️',
    color: 'red',
    allowedActions: ['Contact support only'],
    resources: [{ title: 'support@pet911.org' }],
  },
};

const DEFAULT_CONFIG: CooldownConfig = {
  type: 'short_break',
  title: 'Cooldown Active',
  description: 'A mandatory break has been activated for your wellbeing.',
  icon: '⏸️',
  color: 'amber',
  allowedActions: ['Limited actions available'],
  resources: [],
};

// ============================================================================
// HOOK FOR COOLDOWN STATE
// ============================================================================

export function useCooldown(userId?: string) {
  const [cooldown, setCooldown] = useState<CooldownEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCooldown = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/training/cooldown');
      if (response.ok) {
        const data = await response.json();
        setCooldown(data.activeCooldown || null);
      }
    } catch (error) {
      console.error('Failed to fetch cooldown:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const acknowledgeCooldown = useCallback(async () => {
    if (!cooldown) return;

    try {
      await fetch('/api/training/cooldown/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cooldownId: cooldown.id }),
      });
      await fetchCooldown();
    } catch (error) {
      console.error('Failed to acknowledge cooldown:', error);
    }
  }, [cooldown, fetchCooldown]);

  useEffect(() => {
    fetchCooldown();
    
    // Poll for cooldown changes every minute
    const interval = setInterval(fetchCooldown, 60000);
    return () => clearInterval(interval);
  }, [fetchCooldown]);

  return {
    cooldown,
    loading,
    acknowledgeCooldown,
    refetch: fetchCooldown,
  };
}

// ============================================================================
// TIME DISPLAY HOOK
// ============================================================================

function useTimeRemaining(endsAt: Date | string | undefined) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endsAt) return;

    const updateTime = () => {
      const end = new Date(endsAt).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Complete');
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return { timeLeft, isExpired };
}

// ============================================================================
// BANNER VARIANT (for page headers)
// ============================================================================

interface CooldownBannerProps {
  cooldown: CooldownEvent;
  onDismiss?: () => void;
  compact?: boolean;
}

export function CooldownBanner({ cooldown, onDismiss, compact = false }: CooldownBannerProps) {
  const config = COOLDOWN_CONFIGS[cooldown.triggerReason] || DEFAULT_CONFIG;
  const { timeLeft, isExpired } = useTimeRemaining(cooldown.endsAt);

  if (isExpired) return null;

  const colorClasses = {
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };

  if (compact) {
    return (
      <div className={`${colorClasses[config.color]} border-b px-4 py-2`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{config.icon}</span>
            <span className="font-medium">{config.title}</span>
            <span className="text-sm opacity-75">• {timeLeft} remaining</span>
          </div>
          <span className="text-sm">💚 Take care of yourself</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${colorClasses[config.color]} border-b`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-xl`}>
              {config.icon}
            </div>
            <div>
              <p className="font-semibold">{config.title}</p>
              <p className="text-sm opacity-80">
                {cooldown.triggerReason.replace(/_/g, ' ')} • {timeLeft} remaining
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm hidden sm:block">
              💚 Your wellbeing matters
            </p>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-current opacity-60 hover:opacity-100 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL VARIANT (for full-screen acknowledgment)
// ============================================================================

interface CooldownModalProps {
  cooldown: CooldownEvent;
  onAcknowledge: () => void;
}

export function CooldownModal({ cooldown, onAcknowledge }: CooldownModalProps) {
  const config = COOLDOWN_CONFIGS[cooldown.triggerReason] || DEFAULT_CONFIG;
  const { timeLeft, isExpired } = useTimeRemaining(cooldown.endsAt);
  const [acknowledged, setAcknowledged] = useState(!!cooldown.acknowledgedAt);

  if (isExpired) return null;

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge();
  };

  const bgColors = {
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className={`${bgColors[config.color]} px-8 py-6 text-white text-center`}>
          <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4">
            <span className="text-4xl">{config.icon}</span>
          </div>
          <h2 className="text-2xl font-bold">{config.title}</h2>
        </div>

        <div className="p-6">
          <p className="text-gray-600 text-center mb-6">
            {config.description}
          </p>

          {/* Timer */}
          <div className="bg-gray-100 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-gray-500 mb-1">Time Remaining</p>
            <p className="text-4xl font-bold text-gray-900 font-mono">{timeLeft}</p>
          </div>

          {/* What you can do */}
          <div className="mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="font-medium text-green-800 mb-2">✓ You can still:</p>
              <ul className="text-sm text-green-700 space-y-1">
                {config.allowedActions.map((action, i) => (
                  <li key={i}>• {action}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Resources */}
          {config.resources.length > 0 && (
            <div className="mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-medium text-blue-800 mb-2">Support Resources:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {config.resources.map((resource, i) => (
                    <li key={i}>
                      {resource.link ? (
                        <a href={resource.link} className="hover:underline">
                          • {resource.title} →
                        </a>
                      ) : (
                        <span>• {resource.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Acknowledge button */}
          {!acknowledged ? (
            <button
              onClick={handleAcknowledge}
              className={`w-full py-3 ${bgColors[config.color]} text-white rounded-xl font-medium hover:opacity-90 transition-opacity`}
            >
              I Understand
            </button>
          ) : (
            <div className="text-center text-green-600 font-medium py-3">
              ✓ Take care of yourself. We'll see you soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CARD VARIANT (for dashboard sidebar)
// ============================================================================

interface CooldownCardProps {
  cooldown: CooldownEvent;
  onLearnMore?: () => void;
}

export function CooldownCard({ cooldown, onLearnMore }: CooldownCardProps) {
  const config = COOLDOWN_CONFIGS[cooldown.triggerReason] || DEFAULT_CONFIG;
  const { timeLeft, isExpired } = useTimeRemaining(cooldown.endsAt);

  if (isExpired) return null;

  const borderColors = {
    amber: 'border-amber-300',
    red: 'border-red-300',
    blue: 'border-blue-300',
    purple: 'border-purple-300',
  };

  const bgColors = {
    amber: 'bg-amber-50',
    red: 'bg-red-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
  };

  return (
    <div className={`${bgColors[config.color]} ${borderColors[config.color]} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{config.title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{timeLeft} remaining</p>
          
          {onLearnMore && (
            <button
              onClick={onLearnMore}
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              Learn more →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TOAST VARIANT (for floating notifications)
// ============================================================================

interface CooldownToastProps {
  cooldown: CooldownEvent;
  onClose: () => void;
  position?: 'top-right' | 'bottom-right' | 'bottom-center';
}

export function CooldownToast({ cooldown, onClose, position = 'bottom-right' }: CooldownToastProps) {
  const config = COOLDOWN_CONFIGS[cooldown.triggerReason] || DEFAULT_CONFIG;
  const { timeLeft, isExpired } = useTimeRemaining(cooldown.endsAt);

  useEffect(() => {
    if (isExpired) {
      onClose();
    }
  }, [isExpired, onClose]);

  if (isExpired) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 animate-in slide-in-from-bottom-2`}>
      <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{config.icon}</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{config.title}</p>
            <p className="text-sm text-gray-600">{timeLeft} remaining</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// INLINE VARIANT (for action blocking)
// ============================================================================

interface CooldownInlineProps {
  cooldown: CooldownEvent;
  blockedAction: string;
}

export function CooldownInline({ cooldown, blockedAction }: CooldownInlineProps) {
  const config = COOLDOWN_CONFIGS[cooldown.triggerReason] || DEFAULT_CONFIG;
  const { timeLeft, isExpired } = useTimeRemaining(cooldown.endsAt);

  if (isExpired) return null;

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2 text-amber-800">
        <span className="text-xl">{config.icon}</span>
        <span className="font-medium">
          {blockedAction} is temporarily unavailable
        </span>
      </div>
      <p className="text-sm text-amber-700 mt-1">
        Available again in {timeLeft}
      </p>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  CooldownBanner,
  CooldownModal,
  CooldownCard,
  CooldownToast,
  CooldownInline,
  useCooldown,
};
