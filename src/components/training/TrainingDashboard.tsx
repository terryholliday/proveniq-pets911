'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrainingDashboard as DashboardData, 
  ModuleProgressSummary,
  TrainingTrack,
  TRACK_CONFIG,
  CooldownEvent,
  Certification,
  BackgroundCheck
} from '@/types/training';

interface TrainingDashboardProps {
  initialData?: DashboardData;
}

export function TrainingDashboard({ initialData }: TrainingDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [activeTrack, setActiveTrack] = useState<TrainingTrack>('all');

  useEffect(() => {
    if (!initialData) {
      fetchDashboard();
    }
  }, [initialData]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/training/dashboard');
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load training dashboard.</p>
        <button 
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeTrackData = dashboard.tracks.find(t => t.track === activeTrack);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cooldown Banner */}
      {dashboard.activeCooldown && (
        <CooldownBanner cooldown={dashboard.activeCooldown} />
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">PetMayday Training Academy</h1>
          <p className="text-gray-600 mt-1">
            Complete your training to become a certified volunteer
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Background Check Status */}
            <BackgroundCheckCard check={dashboard.backgroundCheck} />

            {/* Active Certifications */}
            <CertificationsCard 
              active={dashboard.activeCertifications}
              expiring={dashboard.expiringCertifications}
            />

            {/* Track Navigation */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Training Tracks</h3>
              <nav className="space-y-1">
                {dashboard.tracks.map(track => {
                  const config = TRACK_CONFIG[track.track];
                  const isActive = track.track === activeTrack;
                  const isComplete = track.completedCount === track.totalCount;
                  
                  return (
                    <button
                      key={track.track}
                      onClick={() => setActiveTrack(track.track)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className="text-sm font-medium">{config.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isComplete && (
                          <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                            ✓
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {track.completedCount}/{track.totalCount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTrackData && (
              <TrackView 
                track={activeTrackData}
                backgroundCheckCleared={
                  dashboard.backgroundCheck?.status === 'cleared'
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Track View Component
function TrackView({ 
  track, 
  backgroundCheckCleared 
}: { 
  track: DashboardData['tracks'][0];
  backgroundCheckCleared: boolean;
}) {
  const config = TRACK_CONFIG[track.track];
  const progressPct = track.totalCount > 0 
    ? Math.round((track.completedCount / track.totalCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Track Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
                <p className="text-gray-600">{config.description}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{progressPct}%</p>
            <p className="text-sm text-gray-500">Complete</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {track.completedCount} of {track.totalCount} modules completed
          </p>
        </div>

        {/* Badge earned */}
        {progressPct === 100 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              🏆
            </div>
            <div>
              <p className="font-medium text-green-800">{config.badgeTitle}</p>
              <p className="text-sm text-green-600">Badge Earned!</p>
            </div>
          </div>
        )}
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {track.modules.map((moduleProgress, index) => (
          <ModuleCard 
            key={moduleProgress.module.id}
            moduleProgress={moduleProgress}
            index={index}
            backgroundCheckCleared={backgroundCheckCleared}
          />
        ))}
      </div>
    </div>
  );
}

// Module Card Component
function ModuleCard({ 
  moduleProgress, 
  index,
  backgroundCheckCleared
}: { 
  moduleProgress: ModuleProgressSummary;
  index: number;
  backgroundCheckCleared: boolean;
}) {
  const { module, progress, prerequisitesMet, canStart, blockedReason } = moduleProgress;
  
  const status = progress?.status || 'not_started';
  const isComplete = status === 'completed';
  const isInProgress = status === 'in_progress' || status === 'content_complete' || status === 'quiz_pending';
  const isLocked = !canStart;
  const needsBackgroundCheck = module.requiresBackgroundCheck && !backgroundCheckCleared;

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 border-green-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    content_complete: 'bg-blue-100 text-blue-800 border-blue-200',
    quiz_pending: 'bg-amber-100 text-amber-800 border-amber-200',
    quiz_failed: 'bg-red-100 text-red-800 border-red-200',
    awaiting_signoff: 'bg-purple-100 text-purple-800 border-purple-200',
    awaiting_shadowing: 'bg-purple-100 text-purple-800 border-purple-200',
    expired: 'bg-gray-100 text-gray-800 border-gray-200',
    not_started: 'bg-gray-100 text-gray-600 border-gray-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    content_complete: 'Content Complete',
    quiz_pending: 'Quiz Available',
    quiz_failed: 'Quiz Failed',
    awaiting_signoff: 'Awaiting Signoff',
    awaiting_shadowing: 'Shadowing Required',
    expired: 'Expired',
    not_started: 'Not Started',
    suspended: 'Suspended',
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${
      isComplete ? 'border-l-green-500' : 
      isInProgress ? 'border-l-blue-500' : 
      isLocked ? 'border-l-gray-300' : 
      'border-l-gray-400'
    }`}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Index/Status indicator */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isComplete ? 'bg-green-500 text-white' :
              isInProgress ? 'bg-blue-500 text-white' :
              isLocked ? 'bg-gray-200 text-gray-400' :
              'bg-gray-300 text-gray-600'
            }`}>
              {isComplete ? '✓' : isLocked ? '🔒' : index + 1}
            </div>

            <div className="flex-1">
              <h3 className={`font-semibold ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                {module.title}
              </h3>
              {module.subtitle && (
                <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                  {module.subtitle}
                </p>
              )}
              
              {/* Module meta */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {module.estimatedMinutes} min
                </span>
                {module.requiresQuiz && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Quiz
                  </span>
                )}
                {module.requiresBackgroundCheck && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Background Check
                  </span>
                )}
                {module.requiresShadowing && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {module.shadowingHoursRequired}h Shadowing
                  </span>
                )}
              </div>

              {/* Progress bar for in-progress modules */}
              {isInProgress && progress && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${progress.contentProgressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {progress.contentProgressPct}% content complete
                    {progress.quizAttempts > 0 && ` • ${progress.quizAttempts} quiz attempt(s)`}
                  </p>
                </div>
              )}

              {/* Blocked reason */}
              {blockedReason && (
                <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {blockedReason}
                </p>
              )}
            </div>
          </div>

          {/* Status badge and action */}
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status] || statusColors.not_started}`}>
              {statusLabels[status] || 'Not Started'}
            </span>
            
            {!isLocked && (
              <Link
                href={`/admin/training/${module.slug}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isComplete
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isComplete ? 'Review' : isInProgress ? 'Continue' : 'Start'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Cooldown Banner Component
function CooldownBanner({ cooldown }: { cooldown: CooldownEvent }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const end = new Date(cooldown.endsAt).getTime();
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes % 60}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [cooldown.endsAt]);

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              ⏸️
            </div>
            <div>
              <p className="font-medium text-amber-800">
                Cooldown Active: {cooldown.cooldownType.replace('_', ' ')}
              </p>
              <p className="text-sm text-amber-700">
                {cooldown.triggerReason.replace(/_/g, ' ')} • {timeLeft} remaining
              </p>
            </div>
          </div>
          <p className="text-sm text-amber-600">
            This is for your wellbeing. Take a break. 💚
          </p>
        </div>
      </div>
    </div>
  );
}

// Background Check Card
function BackgroundCheckCard({ check }: { check: BackgroundCheck | null }) {
  const statusConfig = {
    not_started: { color: 'gray', label: 'Not Started', icon: '○' },
    pending: { color: 'amber', label: 'Pending', icon: '⏳' },
    in_review: { color: 'blue', label: 'In Review', icon: '🔍' },
    cleared: { color: 'green', label: 'Cleared', icon: '✓' },
    flagged: { color: 'amber', label: 'Flagged', icon: '⚠️' },
    failed: { color: 'red', label: 'Failed', icon: '✗' },
    expired: { color: 'gray', label: 'Expired', icon: '⏰' },
  };

  const status = check?.status || 'not_started';
  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Background Check</h3>
      <div className={`flex items-center gap-3 p-3 rounded-lg bg-${config.color}-50`}>
        <span className="text-xl">{config.icon}</span>
        <div>
          <p className={`font-medium text-${config.color}-800`}>{config.label}</p>
          {check?.expiresAt && status === 'cleared' && (
            <p className="text-xs text-gray-500">
              Expires: {new Date(check.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      {status === 'not_started' && (
        <Link
          href="/admin/training/background-check"
          className="mt-3 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Start Background Check
        </Link>
      )}
    </div>
  );
}

// Certifications Card
function CertificationsCard({ 
  active, 
  expiring 
}: { 
  active: Certification[];
  expiring: Certification[];
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Your Certifications</h3>
      
      {active.length === 0 ? (
        <p className="text-sm text-gray-500">No certifications yet. Complete training to earn badges!</p>
      ) : (
        <div className="space-y-2">
          {active.slice(0, 3).map(cert => (
            <div key={cert.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="text-lg">🏅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{cert.title}</p>
                <p className="text-xs text-gray-500">
                  {cert.expiresAt 
                    ? `Expires ${new Date(cert.expiresAt).toLocaleDateString()}`
                    : 'No expiration'
                  }
                </p>
              </div>
            </div>
          ))}
          {active.length > 3 && (
            <Link href="/admin/training/certifications" className="text-sm text-blue-600 hover:underline">
              View all {active.length} certifications →
            </Link>
          )}
        </div>
      )}

      {expiring.length > 0 && (
        <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs font-medium text-amber-800">
            ⚠️ {expiring.length} certification(s) expiring soon
          </p>
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-96" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4 h-32" />
            <div className="bg-white rounded-lg shadow-sm p-4 h-48" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6 h-40" />
            <div className="bg-white rounded-lg shadow-sm p-5 h-24" />
            <div className="bg-white rounded-lg shadow-sm p-5 h-24" />
            <div className="bg-white rounded-lg shadow-sm p-5 h-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainingDashboard;
