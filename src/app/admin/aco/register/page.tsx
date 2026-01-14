'use client';

/**
 * ACO Officer Registration
 * 
 * Onboarding flow for Animal Control Officers to:
 * - Register their account
 * - Set notification preferences
 * - Configure shift schedule
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Shield, Phone, Mail, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface ACORegistration {
  // Personal
  displayName: string;
  email: string;
  phone: string;
  
  // Assignment
  county: 'GREENBRIER' | 'KANAWHA' | '';
  agencyName: string;
  badgeId: string;
  title: string;
  
  // Notifications
  notificationPreference: 'SMS' | 'EMAIL' | 'BOTH' | 'NONE';
  
  // Shifts
  availableShifts: string[];
}

const SHIFT_OPTIONS = [
  { id: 'DAY', label: 'Day Shift', time: '6am - 2pm' },
  { id: 'EVENING', label: 'Evening Shift', time: '2pm - 10pm' },
  { id: 'NIGHT', label: 'Night Shift', time: '10pm - 6am' },
];

export default function ACORegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ACORegistration>({
    displayName: '',
    email: '',
    phone: '',
    county: '',
    agencyName: 'Sheriff Department',
    badgeId: '',
    title: 'Animal Control Officer',
    notificationPreference: 'SMS',
    availableShifts: ['DAY'],
  });

  const supabase = createClient();

  const updateForm = (updates: Partial<ACORegistration>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const toggleShift = (shiftId: string) => {
    if (form.availableShifts.includes(shiftId)) {
      updateForm({ availableShifts: form.availableShifts.filter(s => s !== shiftId) });
    } else {
      updateForm({ availableShifts: [...form.availableShifts, shiftId] });
    }
  };

  async function handleSubmit() {
    if (!form.displayName || !form.county || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to register as an ACO officer.');
        setSubmitting(false);
        return;
      }

      // Check if user profile exists
      const { data: profile } = await supabase
        .from('user_profile')
        .select('id')
        .eq('firebase_uid', user.id)
        .single();

      if (!profile) {
        // Create user profile first
        const { data: newProfile, error: profileError } = await supabase
          .from('user_profile')
          .insert({
            firebase_uid: user.id,
            email: form.email || user.email,
            display_name: form.displayName,
            phone: form.phone,
            role: 'ACO_OFFICER',
          })
          .select()
          .single();

        if (profileError) {
          throw profileError;
        }

        // Create ACO officer record
        const { error: acoError } = await supabase
          .from('aco_officers')
          .insert({
            user_id: newProfile.id,
            county: form.county,
            agency_name: form.agencyName,
            badge_id: form.badgeId || null,
            title: form.title,
            phone: form.phone,
            email: form.email || user.email,
            notification_preference: form.notificationPreference,
            available_shifts: form.availableShifts,
            status: 'ACTIVE',
            appointed_at: new Date().toISOString(),
          });

        if (acoError) {
          throw acoError;
        }
      } else {
        // Update existing profile role and create ACO record
        await supabase
          .from('user_profile')
          .update({
            role: 'ACO_OFFICER',
            display_name: form.displayName,
            phone: form.phone,
          })
          .eq('id', profile.id);

        const { error: acoError } = await supabase
          .from('aco_officers')
          .insert({
            user_id: profile.id,
            county: form.county,
            agency_name: form.agencyName,
            badge_id: form.badgeId || null,
            title: form.title,
            phone: form.phone,
            email: form.email,
            notification_preference: form.notificationPreference,
            available_shifts: form.availableShifts,
            status: 'ACTIVE',
            appointed_at: new Date().toISOString(),
          });

        if (acoError) {
          throw acoError;
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('ACO registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-600 flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Registration Complete</h1>
            <p className="text-slate-300 mb-6">
              You&apos;ve been registered as an Animal Control Officer for {form.county} County.
              You&apos;ll now receive dispatch notifications via {form.notificationPreference}.
            </p>
            <div className="space-y-3">
              <Link href="/admin/aco">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Go to ACO Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-blue-900 border-b border-blue-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/admin/aco" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <span className="text-sm text-blue-200">
              Step {step + 1} of 3
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">ACO Officer Registration</h1>
              <p className="text-blue-200 text-sm">Join the Animal Control network</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
              <p className="text-slate-400">Your identity and contact details</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => updateForm({ displayName: e.target.value })}
                placeholder="Your full name"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm({ phone: e.target.value })}
                placeholder="(304) 555-0123"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <p className="text-slate-500 text-sm mt-1">Used for dispatch notifications</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                placeholder="you@agency.gov"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <Button
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 py-6"
              onClick={() => setStep(1)}
              disabled={!form.displayName || !form.phone}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Assignment Details</h2>
              <p className="text-slate-400">Your county and agency information</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">County *</label>
              <select
                value={form.county}
                onChange={(e) => updateForm({ county: e.target.value as 'GREENBRIER' | 'KANAWHA' | '' })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select county...</option>
                <option value="GREENBRIER">Greenbrier County</option>
                <option value="KANAWHA">Kanawha County</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Agency</label>
              <input
                type="text"
                value={form.agencyName}
                onChange={(e) => updateForm({ agencyName: e.target.value })}
                placeholder="Sheriff Department"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Badge/ID Number</label>
                <input
                  type="text"
                  value={form.badgeId}
                  onChange={(e) => updateForm({ badgeId: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  placeholder="Animal Control Officer"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 border-slate-600 text-slate-300 py-6"
                onClick={() => setStep(0)}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-6"
                onClick={() => setStep(2)}
                disabled={!form.county}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Notification Preferences</h2>
              <p className="text-slate-400">How should we contact you for dispatches?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Notification Method</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'SMS', label: 'SMS Text', icon: '📱' },
                  { id: 'EMAIL', label: 'Email', icon: '📧' },
                  { id: 'BOTH', label: 'Both', icon: '📬' },
                  { id: 'NONE', label: 'None', icon: '🔕' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => updateForm({ notificationPreference: opt.id as any })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      form.notificationPreference === opt.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{opt.icon}</span>
                    <span className={`font-medium ${form.notificationPreference === opt.id ? 'text-blue-400' : 'text-slate-300'}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                <Clock className="w-4 h-4 inline mr-1" />
                Available Shifts
              </label>
              <div className="space-y-2">
                {SHIFT_OPTIONS.map((shift) => (
                  <label
                    key={shift.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.availableShifts.includes(shift.id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.availableShifts.includes(shift.id)}
                      onChange={() => toggleShift(shift.id)}
                      className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className={`font-medium ${form.availableShifts.includes(shift.id) ? 'text-blue-400' : 'text-slate-300'}`}>
                        {shift.label}
                      </span>
                      <span className="text-slate-500 text-sm ml-2">{shift.time}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Card className="bg-blue-900/30 border-blue-700/50">
              <CardContent className="p-4">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> You&apos;ll receive dispatch notifications for your county 
                  during your available shifts. All responses and outcomes are logged for accountability.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 border-slate-600 text-slate-300 py-6"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-6"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Registering...' : 'Complete Registration'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
