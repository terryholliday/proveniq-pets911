'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BackgroundCheck, BackgroundCheckStatus, ModuleProgressSummary } from '@/types/training';

// ============================================================================
// BACKGROUND CHECK GATE
// ============================================================================

interface BackgroundCheckGateProps {
  check: BackgroundCheck | null;
  requiredFor: string; // Module title
  onStartCheck?: () => void;
}

export function BackgroundCheckGate({ check, requiredFor, onStartCheck }: BackgroundCheckGateProps) {
  const [isStarting, setIsStarting] = useState(false);

  const handleStartCheck = async () => {
    setIsStarting(true);
    try {
      // Redirect to background check provider (e.g., Checkr)
      const response = await fetch('/api/training/background-check/start', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
      
      onStartCheck?.();
    } catch (error) {
      console.error('Failed to start background check:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const statusConfig: Record<BackgroundCheckStatus, {
    icon: string;
    title: string;
    description: string;
    color: string;
    action?: React.ReactNode;
  }> = {
    not_started: {
      icon: '🔒',
      title: 'Background Check Required',
      description: `A background check is required before you can access "${requiredFor}". This helps ensure the safety of animals and community members.`,
      color: 'amber',
      action: (
        <button
          onClick={handleStartCheck}
          disabled={isStarting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {isStarting ? 'Starting...' : 'Start Background Check'}
        </button>
      ),
    },
    pending: {
      icon: '⏳',
      title: 'Background Check In Progress',
      description: 'Your background check has been submitted and is being processed. This typically takes 2-5 business days.',
      color: 'blue',
      action: (
        <div className="text-sm text-gray-600">
          <p>Submitted: {check?.submittedAt ? new Date(check.submittedAt).toLocaleDateString() : 'Recently'}</p>
          <p className="mt-1">You'll receive an email when it's complete.</p>
        </div>
      ),
    },
    in_review: {
      icon: '🔍',
      title: 'Background Check Under Review',
      description: 'Your background check requires additional review. A team member will contact you if more information is needed.',
      color: 'purple',
    },
    cleared: {
      icon: '✅',
      title: 'Background Check Cleared',
      description: 'Your background check has been approved. You can now access this training module.',
      color: 'green',
    },
    flagged: {
      icon: '⚠️',
      title: 'Background Check Flagged',
      description: 'Your background check has been flagged for review. Please contact support for more information.',
      color: 'amber',
      action: (
        <Link
          href="/support/background-check"
          className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200"
        >
          Contact Support
        </Link>
      ),
    },
    failed: {
      icon: '❌',
      title: 'Background Check Not Approved',
      description: 'Unfortunately, your background check was not approved. You may appeal this decision.',
      color: 'red',
      action: (
        <Link
          href="/support/background-check-appeal"
          className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
        >
          Appeal Decision
        </Link>
      ),
    },
    expired: {
      icon: '⏰',
      title: 'Background Check Expired',
      description: 'Your background check has expired. Please complete a new one to continue.',
      color: 'gray',
      action: (
        <button
          onClick={handleStartCheck}
          disabled={isStarting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {isStarting ? 'Starting...' : 'Renew Background Check'}
        </button>
      ),
    },
  };

  const status = check?.status || 'not_started';
  const config = statusConfig[status];

  // If cleared, don't show the gate
  if (status === 'cleared') {
    return null;
  }

  return (
    <div className={`bg-${config.color}-50 border border-${config.color}-200 rounded-lg p-6`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full bg-${config.color}-100 flex items-center justify-center text-2xl flex-shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold text-${config.color}-900`}>
            {config.title}
          </h3>
          <p className={`mt-1 text-${config.color}-700`}>
            {config.description}
          </p>
          
          {/* What's included */}
          {status === 'not_started' && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">What's included:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  National criminal database search
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Sex offender registry check
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Identity verification
                </li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Cost: Free for volunteers • Processing: 2-5 business days
              </p>
            </div>
          )}

          {config.action && (
            <div className="mt-4">
              {config.action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PREREQUISITE GATE
// ============================================================================

interface PrerequisiteGateProps {
  unmetPrerequisites: { id: string; slug: string; title: string }[];
  targetModule: string;
}

export function PrerequisiteGate({ unmetPrerequisites, targetModule }: PrerequisiteGateProps) {
  if (unmetPrerequisites.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
          🔗
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-900">
            Prerequisites Required
          </h3>
          <p className="mt-1 text-amber-700">
            Complete the following modules before accessing "{targetModule}":
          </p>
          
          <div className="mt-4 space-y-2">
            {unmetPrerequisites.map((prereq, index) => (
              <Link
                key={prereq.id}
                href={`/admin/training/${prereq.slug}`}
                className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-amber-100 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-900">{prereq.title}</span>
                <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUPERVISOR SIGNOFF GATE
// ============================================================================

interface SignoffGateProps {
  moduleTitle: string;
  signoffStatus: 'pending' | 'needs_work' | 'denied' | null;
  requestedAt?: Date;
  supervisorNotes?: string;
  onRequestSignoff: () => void;
}

export function SignoffGate({ 
  moduleTitle, 
  signoffStatus, 
  requestedAt,
  supervisorNotes,
  onRequestSignoff 
}: SignoffGateProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      await onRequestSignoff();
    } finally {
      setIsRequesting(false);
    }
  };

  if (!signoffStatus) {
    // Not yet requested
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
            ✍️
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-purple-900">
              Supervisor Signoff Required
            </h3>
            <p className="mt-1 text-purple-700">
              You've passed the quiz! Now request a supervisor to review and approve your certification for "{moduleTitle}".
            </p>
            
            <div className="mt-4">
              <button
                onClick={handleRequest}
                disabled={isRequesting}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
              >
                {isRequesting ? 'Requesting...' : 'Request Supervisor Signoff'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: '⏳',
      title: 'Signoff Pending',
      description: 'Your signoff request is awaiting supervisor review.',
      color: 'blue',
    },
    needs_work: {
      icon: '📝',
      title: 'Additional Work Required',
      description: supervisorNotes || 'Your supervisor has requested some improvements.',
      color: 'amber',
    },
    denied: {
      icon: '❌',
      title: 'Signoff Denied',
      description: supervisorNotes || 'Your signoff request was not approved. Please contact your supervisor.',
      color: 'red',
    },
  };

  const config = statusConfig[signoffStatus];

  return (
    <div className={`bg-${config.color}-50 border border-${config.color}-200 rounded-lg p-6`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full bg-${config.color}-100 flex items-center justify-center text-2xl flex-shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold text-${config.color}-900`}>
            {config.title}
          </h3>
          <p className={`mt-1 text-${config.color}-700`}>
            {config.description}
          </p>
          
          {requestedAt && (
            <p className="mt-2 text-sm text-gray-500">
              Requested: {requestedAt.toLocaleDateString()}
            </p>
          )}

          {signoffStatus === 'needs_work' && (
            <button
              onClick={handleRequest}
              disabled={isRequesting}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {isRequesting ? 'Requesting...' : 'Request Re-Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SHADOWING GATE
// ============================================================================

interface ShadowingGateProps {
  moduleTitle: string;
  requiredHours: number;
  completedHours: number;
  records: {
    date: Date;
    hours: number;
    mentorName: string;
    verified: boolean;
  }[];
  onLogHours: () => void;
}

export function ShadowingGate({
  moduleTitle,
  requiredHours,
  completedHours,
  records,
  onLogHours
}: ShadowingGateProps) {
  const progressPct = Math.min(100, (completedHours / requiredHours) * 100);
  const isComplete = completedHours >= requiredHours;
  const verifiedHours = records.filter(r => r.verified).reduce((sum, r) => sum + r.hours, 0);

  return (
    <div className={`${isComplete ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-200'} border rounded-lg p-6`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full ${isComplete ? 'bg-green-100' : 'bg-indigo-100'} flex items-center justify-center text-2xl flex-shrink-0`}>
          {isComplete ? '✅' : '👥'}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${isComplete ? 'text-green-900' : 'text-indigo-900'}`}>
            {isComplete ? 'Shadowing Complete!' : 'Shadowing Required'}
          </h3>
          <p className={`mt-1 ${isComplete ? 'text-green-700' : 'text-indigo-700'}`}>
            {isComplete 
              ? `You've completed ${completedHours} hours of supervised practice for "${moduleTitle}".`
              : `Complete ${requiredHours} hours of supervised practice with a certified mentor.`
            }
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className={`font-medium ${isComplete ? 'text-green-600' : 'text-indigo-600'}`}>
                {completedHours} / {requiredHours} hours
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {verifiedHours < completedHours && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ {completedHours - verifiedHours} hours pending mentor verification
              </p>
            )}
          </div>

          {/* Recent records */}
          {records.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Sessions:</h4>
              <div className="space-y-2">
                {records.slice(0, 3).map((record, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-white rounded">
                    <div>
                      <span className="text-gray-900">{record.date.toLocaleDateString()}</span>
                      <span className="text-gray-500 ml-2">with {record.mentorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{record.hours}h</span>
                      {record.verified ? (
                        <span className="text-green-600 text-xs">✓ Verified</span>
                      ) : (
                        <span className="text-amber-600 text-xs">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isComplete && (
            <button
              onClick={onLogHours}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Log Shadowing Hours
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COOLDOWN OVERLAY
// ============================================================================

interface CooldownOverlayProps {
  triggerReason: string;
  endsAt: Date;
  restrictedActions: string[];
  onAcknowledge: () => void;
}

export function CooldownOverlay({ triggerReason, endsAt, restrictedActions, onAcknowledge }: CooldownOverlayProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  React.useEffect(() => {
    const updateTime = () => {
      const end = endsAt.getTime();
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft('Complete');
        return;
      }

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

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge();
  };

  const reasonMessages: Record<string, { title: string; message: string }> = {
    '2_code_red_60min': {
      title: 'Short Break Required',
      message: 'You\'ve handled 2 Code Red cases in the last hour. Take 15 minutes to decompress.',
    },
    '5_code_red_24hr': {
      title: 'Extended Cooldown Active',
      message: 'You\'ve handled 5 Code Red cases in 24 hours. You\'re restricted to Code Green cases for the next 12 hours.',
    },
    'manual_guardian': {
      title: 'Guardian-Initiated Break',
      message: 'A Community Guardian has initiated a mandatory break. Please check your messages.',
    },
  };

  const reasonConfig = reasonMessages[triggerReason] || {
    title: 'Cooldown Active',
    message: 'A mandatory break has been activated for your wellbeing.',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Calming icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-6">
          <span className="text-4xl">💚</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {reasonConfig.title}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {reasonConfig.message}
        </p>

        {/* Timer */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Time Remaining</p>
          <p className="text-3xl font-bold text-gray-900">{timeLeft}</p>
        </div>

        {/* What you can still do */}
        <div className="text-left mb-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-2">You can still:</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• View and respond to Code Green posts</li>
            <li>• Review training materials</li>
            <li>• Message team members</li>
          </ul>
        </div>

        {/* Resources */}
        <div className="text-left mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">Support Resources:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Peer support chat available</li>
            <li>• Crisis Text Line: Text HOME to 741741</li>
          </ul>
        </div>

        {!acknowledged ? (
          <button
            onClick={handleAcknowledge}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            I Understand
          </button>
        ) : (
          <p className="text-green-600 font-medium">
            ✓ Take care of yourself. We'll see you soon.
          </p>
        )}
      </div>
    </div>
  );
}

export default {
  BackgroundCheckGate,
  PrerequisiteGate,
  SignoffGate,
  ShadowingGate,
  CooldownOverlay,
};
