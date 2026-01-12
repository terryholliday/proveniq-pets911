'use client';

import React, { useState, useEffect } from 'react';
import { SignoffStatus } from '@/types/training';

// ============================================================================
// TYPES
// ============================================================================

interface PendingSignoff {
  id: string;
  volunteerId: string;
  volunteerName: string;
  volunteerEmail: string;
  volunteerAvatarUrl?: string;
  moduleId: string;
  moduleTitle: string;
  moduleCategory: string;
  quizScore: number;
  shadowingHours?: number;
  requestedAt: Date;
  previousAttempts: number;
  notes?: string;
}

interface CompletedSignoff {
  id: string;
  volunteerId: string;
  volunteerName: string;
  moduleTitle: string;
  status: SignoffStatus;
  competencyRating?: number;
  supervisorNotes?: string;
  reviewedAt: Date;
}

interface SignoffManagerProps {
  isSupervisor: boolean;
  supervisorName?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SignoffManager({ isSupervisor, supervisorName }: SignoffManagerProps) {
  const [pendingSignoffs, setPendingSignoffs] = useState<PendingSignoff[]>([]);
  const [completedSignoffs, setCompletedSignoffs] = useState<CompletedSignoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [selectedSignoff, setSelectedSignoff] = useState<PendingSignoff | null>(null);

  useEffect(() => {
    if (isSupervisor) {
      fetchSignoffs();
    }
  }, [isSupervisor]);

  const fetchSignoffs = async () => {
    try {
      const response = await fetch('/api/training/signoffs');
      if (response.ok) {
        const data = await response.json();
        setPendingSignoffs(data.pending || []);
        setCompletedSignoffs(data.completed || []);
      }
    } catch (error) {
      console.error('Failed to fetch signoffs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignoffDecision = async (
    signoffId: string,
    decision: 'approved' | 'needs_work' | 'denied',
    notes?: string,
    rating?: number
  ) => {
    try {
      const response = await fetch('/api/training/signoffs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signoffId,
          status: decision,
          supervisorNotes: notes,
          competencyRating: rating,
        }),
      });

      if (response.ok) {
        await fetchSignoffs();
        setSelectedSignoff(null);
      }
    } catch (error) {
      console.error('Failed to submit decision:', error);
    }
  };

  if (!isSupervisor) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-2">🔒</div>
        <h3 className="font-semibold text-amber-900">Supervisor Access Required</h3>
        <p className="text-sm text-amber-700 mt-1">
          You need supervisor privileges to access signoff management.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-600">Loading signoff requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Signoff Management</h2>
            <p className="text-purple-200 text-sm">
              Review and approve volunteer training completions
            </p>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="text-white text-sm font-medium">
              {pendingSignoffs.length} pending
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Review ({pendingSignoffs.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recently Completed
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'pending' ? (
          pendingSignoffs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold text-gray-900">All caught up!</h3>
              <p className="text-gray-500 mt-1">No pending signoff requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSignoffs.map((signoff) => (
                <PendingSignoffCard
                  key={signoff.id}
                  signoff={signoff}
                  onReview={() => setSelectedSignoff(signoff)}
                />
              ))}
            </div>
          )
        ) : (
          completedSignoffs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500">No completed signoffs to display.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedSignoffs.map((signoff) => (
                <CompletedSignoffCard key={signoff.id} signoff={signoff} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Review Modal */}
      {selectedSignoff && (
        <SignoffReviewModal
          signoff={selectedSignoff}
          supervisorName={supervisorName || 'Supervisor'}
          onSubmit={handleSignoffDecision}
          onClose={() => setSelectedSignoff(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// PENDING SIGNOFF CARD
// ============================================================================

function PendingSignoffCard({
  signoff,
  onReview,
}: {
  signoff: PendingSignoff;
  onReview: () => void;
}) {
  const waitTime = Math.floor(
    (Date.now() - new Date(signoff.requestedAt).getTime()) / (1000 * 60 * 60)
  );

  return (
    <div className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
            {signoff.volunteerAvatarUrl ? (
              <img
                src={signoff.volunteerAvatarUrl}
                alt={signoff.volunteerName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              signoff.volunteerName.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">{signoff.volunteerName}</h3>
            <p className="text-sm text-gray-500">{signoff.volunteerEmail}</p>
            
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                {signoff.moduleTitle}
              </span>
              <span className="text-xs text-gray-500">
                Quiz: {signoff.quizScore}%
              </span>
              {signoff.shadowingHours !== undefined && signoff.shadowingHours > 0 && (
                <span className="text-xs text-gray-500">
                  • {signoff.shadowingHours}h shadowing
                </span>
              )}
            </div>

            {signoff.previousAttempts > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ {signoff.previousAttempts} previous attempt(s)
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">
            {waitTime < 1 ? 'Just now' : `${waitTime}h ago`}
          </p>
          <button
            onClick={onReview}
            className="mt-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPLETED SIGNOFF CARD
// ============================================================================

function CompletedSignoffCard({ signoff }: { signoff: CompletedSignoff }) {
  const statusConfig = {
    approved: { color: 'green', label: 'Approved', icon: '✓' },
    needs_work: { color: 'amber', label: 'Needs Work', icon: '↻' },
    denied: { color: 'red', label: 'Denied', icon: '✗' },
    pending: { color: 'gray', label: 'Pending', icon: '...' },
  };

  const config = statusConfig[signoff.status] || statusConfig.pending;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className={`w-8 h-8 rounded-full bg-${config.color}-100 text-${config.color}-600 flex items-center justify-center text-sm`}>
          {config.icon}
        </span>
        <div>
          <p className="font-medium text-gray-900">{signoff.volunteerName}</p>
          <p className="text-xs text-gray-500">{signoff.moduleTitle}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`px-2 py-0.5 bg-${config.color}-100 text-${config.color}-700 rounded text-xs font-medium`}>
          {config.label}
        </span>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(signoff.reviewedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// REVIEW MODAL
// ============================================================================

interface SignoffReviewModalProps {
  signoff: PendingSignoff;
  supervisorName: string;
  onSubmit: (
    signoffId: string,
    decision: 'approved' | 'needs_work' | 'denied',
    notes?: string,
    rating?: number
  ) => void;
  onClose: () => void;
}

function SignoffReviewModal({
  signoff,
  supervisorName,
  onSubmit,
  onClose,
}: SignoffReviewModalProps) {
  const [decision, setDecision] = useState<'approved' | 'needs_work' | 'denied' | null>(null);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;
    setSubmitting(true);
    await onSubmit(signoff.id, decision, notes, rating > 0 ? rating : undefined);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Review Signoff Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Volunteer Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl font-semibold">
                {signoff.volunteerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{signoff.volunteerName}</h4>
                <p className="text-sm text-gray-500">{signoff.volunteerEmail}</p>
              </div>
            </div>
          </div>

          {/* Module Info */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Training Module</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Module</p>
                <p className="font-medium text-gray-900">{signoff.moduleTitle}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Quiz Score</p>
                <p className="font-medium text-gray-900">{signoff.quizScore}%</p>
              </div>
              {signoff.shadowingHours !== undefined && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Shadowing</p>
                  <p className="font-medium text-gray-900">{signoff.shadowingHours}h completed</p>
                </div>
              )}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Requested</p>
                <p className="font-medium text-gray-900">
                  {new Date(signoff.requestedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Volunteer Notes */}
          {signoff.notes && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Volunteer Notes</h4>
              <p className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                "{signoff.notes}"
              </p>
            </div>
          )}

          {/* Competency Rating */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Competency Rating (Optional)</h4>
            <p className="text-sm text-gray-500 mb-2">
              Rate their overall readiness for this role
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {rating === 1 && 'Needs significant improvement'}
                {rating === 2 && 'Below expectations'}
                {rating === 3 && 'Meets expectations'}
                {rating === 4 && 'Exceeds expectations'}
                {rating === 5 && 'Outstanding'}
              </p>
            )}
          </div>

          {/* Decision Buttons */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Your Decision</h4>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setDecision('approved')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  decision === 'approved'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-2xl mb-1">✓</div>
                <div className={`text-sm font-medium ${
                  decision === 'approved' ? 'text-green-700' : 'text-gray-700'
                }`}>
                  Approve
                </div>
              </button>
              <button
                onClick={() => setDecision('needs_work')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  decision === 'needs_work'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <div className="text-2xl mb-1">↻</div>
                <div className={`text-sm font-medium ${
                  decision === 'needs_work' ? 'text-amber-700' : 'text-gray-700'
                }`}>
                  Needs Work
                </div>
              </button>
              <button
                onClick={() => setDecision('denied')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  decision === 'denied'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="text-2xl mb-1">✗</div>
                <div className={`text-sm font-medium ${
                  decision === 'denied' ? 'text-red-700' : 'text-gray-700'
                }`}>
                  Deny
                </div>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">
              Feedback for Volunteer
              {decision === 'needs_work' && <span className="text-red-500"> *</span>}
            </h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                decision === 'approved'
                  ? 'Optional: Add any congratulatory notes or next steps...'
                  : decision === 'needs_work'
                  ? 'Required: Explain what needs improvement...'
                  : decision === 'denied'
                  ? 'Required: Explain the reason for denial...'
                  : 'Add feedback for the volunteer...'
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !decision ||
                submitting ||
                ((decision === 'needs_work' || decision === 'denied') && !notes.trim())
              }
              className={`flex-1 px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                decision === 'approved'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : decision === 'needs_work'
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : decision === 'denied'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Decision'}
            </button>
          </div>

          {/* Signing as */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Signing as {supervisorName}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VOLUNTEER VIEW - Request Signoff
// ============================================================================

interface RequestSignoffProps {
  moduleId: string;
  moduleTitle: string;
  currentStatus: SignoffStatus | null;
  supervisorNotes?: string;
  onRequestSignoff: () => Promise<void>;
}

export function RequestSignoffCard({
  moduleId,
  moduleTitle,
  currentStatus,
  supervisorNotes,
  onRequestSignoff,
}: RequestSignoffProps) {
  const [requesting, setRequesting] = useState(false);
  const [notes, setNotes] = useState('');

  const handleRequest = async () => {
    setRequesting(true);
    await onRequestSignoff();
    setRequesting(false);
  };

  if (currentStatus === 'approved') {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-medium text-green-800">Signoff Approved</p>
            <p className="text-sm text-green-600">
              You've been certified for {moduleTitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === 'pending') {
    return (
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-medium text-purple-800">Awaiting Supervisor Review</p>
            <p className="text-sm text-purple-600">
              Your signoff request is being reviewed
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === 'needs_work') {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">↻</span>
          <div className="flex-1">
            <p className="font-medium text-amber-800">Additional Work Required</p>
            {supervisorNotes && (
              <p className="text-sm text-amber-700 mt-1 p-2 bg-white rounded">
                "{supervisorNotes}"
              </p>
            )}
            <button
              onClick={handleRequest}
              disabled={requesting}
              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm"
            >
              {requesting ? 'Requesting...' : 'Request Re-Review'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === 'denied') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <p className="font-medium text-red-800">Signoff Denied</p>
            {supervisorNotes && (
              <p className="text-sm text-red-700 mt-1 p-2 bg-white rounded">
                "{supervisorNotes}"
              </p>
            )}
            <p className="text-sm text-red-600 mt-2">
              Please contact support if you have questions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not started - show request form
  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <h4 className="font-medium text-purple-900 mb-2">Request Supervisor Signoff</h4>
      <p className="text-sm text-purple-700 mb-4">
        A supervisor must verify your competency before certification.
      </p>
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional: Add any notes for the supervisor..."
        rows={2}
        className="w-full px-3 py-2 border border-purple-300 rounded-lg mb-3 text-sm"
      />
      
      <button
        onClick={handleRequest}
        disabled={requesting}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {requesting ? 'Requesting...' : 'Request Signoff'}
      </button>
    </div>
  );
}

export default SignoffManager;
