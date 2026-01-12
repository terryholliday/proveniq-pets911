'use client';

import React, { useState, useEffect } from 'react';
import { ShadowingRecord } from '@/types/training';

// ============================================================================
// TYPES
// ============================================================================

interface ShadowingSession {
  id: string;
  moduleId: string;
  moduleTitle: string;
  mentorId: string;
  mentorName: string;
  mentorEmail?: string;
  sessionDate: Date;
  hours: number;
  activityType: string;
  activityDescription?: string;
  location?: string;
  verified: boolean;
  verifiedAt?: Date;
  mentorNotes?: string;
  mentorRating?: number;
  photoEvidenceUrl?: string;
  createdAt: Date;
}

interface AvailableMentor {
  id: string;
  name: string;
  email: string;
  certifications: string[];
  location?: string;
}

interface ShadowingManagementProps {
  userId: string;
  moduleId: string;
  moduleTitle: string;
  requiredHours: number;
  existingRecords?: ShadowingSession[];
  availableMentors?: AvailableMentor[];
  onRecordAdded?: (record: ShadowingSession) => void;
  onClose?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShadowingManagement({
  userId,
  moduleId,
  moduleTitle,
  requiredHours,
  existingRecords = [],
  availableMentors = [],
  onRecordAdded,
  onClose
}: ShadowingManagementProps) {
  const [records, setRecords] = useState<ShadowingSession[]>(existingRecords);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
  const verifiedHours = records.filter(r => r.verified).reduce((sum, r) => sum + r.hours, 0);
  const pendingHours = totalHours - verifiedHours;
  const progressPct = Math.min(100, (totalHours / requiredHours) * 100);
  const isComplete = verifiedHours >= requiredHours;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Shadowing Log</h2>
            <p className="text-indigo-200 text-sm">{moduleTitle}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Progress Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress to Certification</span>
            <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-indigo-600'}`}>
              {totalHours} / {requiredHours} hours
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{verifiedHours}h verified</span>
            {pendingHours > 0 && (
              <span className="text-amber-600">{pendingHours}h pending verification</span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {isComplete && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                ✅
              </div>
              <div>
                <p className="font-medium text-green-800">Shadowing Complete!</p>
                <p className="text-sm text-green-600">
                  You've completed all required shadowing hours for this module.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add New Session Button */}
        {!showAddForm && !isComplete && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6 px-4 py-3 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log New Shadowing Session
          </button>
        )}

        {/* Add Form */}
        {showAddForm && (
          <AddShadowingForm
            moduleId={moduleId}
            availableMentors={availableMentors}
            onSubmit={async (data) => {
              setLoading(true);
              setError(null);
              try {
                const response = await fetch('/api/training/shadowing', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...data,
                    moduleId,
                  }),
                });

                if (!response.ok) {
                  const err = await response.json();
                  throw new Error(err.error || 'Failed to log session');
                }

                const newRecord = await response.json();
                setRecords(prev => [newRecord, ...prev]);
                onRecordAdded?.(newRecord);
                setShowAddForm(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to log session');
              } finally {
                setLoading(false);
              }
            }}
            onCancel={() => setShowAddForm(false)}
            loading={loading}
            error={error}
          />
        )}

        {/* Records List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Session History</h3>
          
          {records.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-gray-600">No shadowing sessions logged yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Start by logging your first session with a mentor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <ShadowingRecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">About Shadowing Requirements</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Sessions must be with a certified mentor</li>
            <li>• Each session requires mentor verification</li>
            <li>• Log sessions within 48 hours of completion</li>
            <li>• Include specific activities performed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADD FORM COMPONENT
// ============================================================================

interface AddShadowingFormProps {
  moduleId: string;
  availableMentors: AvailableMentor[];
  onSubmit: (data: {
    mentorId: string;
    mentorEmail?: string;
    sessionDate: string;
    hours: number;
    activityType: string;
    activityDescription?: string;
    location?: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

const ACTIVITY_TYPES = [
  { value: 'observation', label: 'Observation Only', description: 'Watching mentor perform tasks' },
  { value: 'assisted', label: 'Assisted Practice', description: 'Helping mentor with tasks under supervision' },
  { value: 'supervised_independent', label: 'Supervised Independent', description: 'Performing tasks independently with mentor oversight' },
  { value: 'live_case', label: 'Live Case Work', description: 'Working on actual rescue cases' },
  { value: 'simulation', label: 'Simulation/Drill', description: 'Practice scenarios or training drills' },
];

function AddShadowingForm({
  moduleId,
  availableMentors,
  onSubmit,
  onCancel,
  loading,
  error
}: AddShadowingFormProps) {
  const [formData, setFormData] = useState({
    mentorId: '',
    mentorEmail: '',
    sessionDate: new Date().toISOString().split('T')[0],
    hours: 1,
    activityType: '',
    activityDescription: '',
    location: '',
  });
  const [useCustomMentor, setUseCustomMentor] = useState(availableMentors.length === 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
      <h4 className="font-semibold text-indigo-900 mb-4">Log New Session</h4>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Mentor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mentor *
          </label>
          {availableMentors.length > 0 && !useCustomMentor ? (
            <>
              <select
                value={formData.mentorId}
                onChange={(e) => setFormData(prev => ({ ...prev, mentorId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Select a mentor...</option>
                {availableMentors.map(mentor => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name} - {mentor.certifications.join(', ')}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setUseCustomMentor(true)}
                className="mt-1 text-sm text-indigo-600 hover:underline"
              >
                Mentor not in list? Enter email instead
              </button>
            </>
          ) : (
            <>
              <input
                type="email"
                value={formData.mentorEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, mentorEmail: e.target.value }))}
                placeholder="mentor@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                We'll send a verification request to this email
              </p>
              {availableMentors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseCustomMentor(false)}
                  className="mt-1 text-sm text-indigo-600 hover:underline"
                >
                  Select from available mentors
                </button>
              )}
            </>
          )}
        </div>

        {/* Date and Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Date *
            </label>
            <input
              type="date"
              value={formData.sessionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, sessionDate: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours *
            </label>
            <input
              type="number"
              value={formData.hours}
              onChange={(e) => setFormData(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
              min="0.5"
              max="12"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Activity Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Activity Type *
          </label>
          <select
            value={formData.activityType}
            onChange={(e) => setFormData(prev => ({ ...prev, activityType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            <option value="">Select activity type...</option>
            {ACTIVITY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {formData.activityType && (
            <p className="mt-1 text-xs text-gray-500">
              {ACTIVITY_TYPES.find(t => t.value === formData.activityType)?.description}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What did you do? (optional but recommended)
          </label>
          <textarea
            value={formData.activityDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, activityDescription: e.target.value }))}
            placeholder="Describe the specific tasks and skills practiced..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (optional)
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Downtown shelter, Field location"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// RECORD CARD COMPONENT
// ============================================================================

function ShadowingRecordCard({ record }: { record: ShadowingSession }) {
  const activityLabel = ACTIVITY_TYPES.find(t => t.value === record.activityType)?.label || record.activityType;

  return (
    <div className={`p-4 rounded-lg border ${record.verified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {new Date(record.sessionDate).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{record.hours}h</span>
          </div>
          
          <p className="text-sm text-gray-600">
            with <span className="font-medium">{record.mentorName}</span>
          </p>
          
          <div className="mt-2">
            <span className="inline-block px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-700">
              {activityLabel}
            </span>
          </div>
          
          {record.activityDescription && (
            <p className="mt-2 text-sm text-gray-600 italic">
              "{record.activityDescription}"
            </p>
          )}

          {record.mentorNotes && (
            <div className="mt-2 p-2 bg-white rounded border text-sm">
              <span className="font-medium text-gray-700">Mentor feedback: </span>
              <span className="text-gray-600">{record.mentorNotes}</span>
            </div>
          )}

          {record.mentorRating && (
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <span 
                  key={star} 
                  className={star <= record.mentorRating! ? 'text-yellow-400' : 'text-gray-300'}
                >
                  ★
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="ml-4">
          {record.verified ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MENTOR VERIFICATION COMPONENT
// ============================================================================

interface MentorVerificationProps {
  session: ShadowingSession;
  onVerify: (verified: boolean, notes?: string, rating?: number) => void;
}

export function MentorVerificationCard({ session, onVerify }: MentorVerificationProps) {
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (verified: boolean) => {
    setLoading(true);
    await onVerify(verified, notes, rating);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Shadowing Session</h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-500">Trainee:</span>
          <span className="font-medium">{session.moduleTitle}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date:</span>
          <span>{new Date(session.sessionDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Hours:</span>
          <span>{session.hours}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Activity:</span>
          <span>{ACTIVITY_TYPES.find(t => t.value === session.activityType)?.label}</span>
        </div>
        {session.activityDescription && (
          <div>
            <span className="text-gray-500 block mb-1">Description:</span>
            <p className="text-sm bg-gray-50 p-2 rounded">{session.activityDescription}</p>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rate their performance (optional)
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feedback for trainee (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations or suggestions..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Verify'}
        </button>
      </div>
    </div>
  );
}

export default ShadowingManagement;
