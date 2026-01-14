'use client';

/**
 * 911 Dispatcher Registration
 * 
 * Onboarding flow for 911 Center dispatchers to:
 * - Register their account
 * - Link to their 911 center
 * - Set notification preferences
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Radio, Phone, Mail, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface DispatcherRegistration {
  displayName: string;
  email: string;
  phone: string;
  centerId: string;
  badgeId: string;
}

interface Center {
  id: string;
  county: string;
  center_name: string;
  phone: string;
}

export default function Dispatcher911RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [centers, setCenters] = useState<Center[]>([]);
  const [form, setForm] = useState<DispatcherRegistration>({
    displayName: '',
    email: '',
    phone: '',
    centerId: '',
    badgeId: '',
  });

  const supabase = createClient();

  useEffect(() => {
    loadCenters();
  }, []);

  async function loadCenters() {
    const { data } = await supabase
      .from('dispatch_911_centers')
      .select('*')
      .eq('is_active', true);
    setCenters(data || []);
  }

  const updateForm = (updates: Partial<DispatcherRegistration>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  async function handleSubmit() {
    if (!form.displayName || !form.centerId || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to register.');
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
            role: 'DISPATCH_911',
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Create dispatcher record
        const { error: dispatcherError } = await supabase
          .from('dispatch_911_operators')
          .insert({
            user_id: newProfile.id,
            center_id: form.centerId,
            display_name: form.displayName,
            badge_id: form.badgeId || null,
            phone: form.phone,
            email: form.email || user.email,
            status: 'ACTIVE',
          });

        if (dispatcherError) throw dispatcherError;
      } else {
        // Update existing profile and create dispatcher record
        await supabase
          .from('user_profile')
          .update({
            role: 'DISPATCH_911',
            display_name: form.displayName,
            phone: form.phone,
          })
          .eq('id', profile.id);

        const { error: dispatcherError } = await supabase
          .from('dispatch_911_operators')
          .insert({
            user_id: profile.id,
            center_id: form.centerId,
            display_name: form.displayName,
            badge_id: form.badgeId || null,
            phone: form.phone,
            email: form.email,
            status: 'ACTIVE',
          });

        if (dispatcherError) throw dispatcherError;
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('911 dispatcher registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCenter = centers.find(c => c.id === form.centerId);

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-600 flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Registration Complete</h1>
            <p className="text-gray-300 mb-6">
              You&apos;ve been registered as a 911 Dispatcher at {selectedCenter?.center_name}.
              You can now acknowledge and route ACO dispatches during after-hours.
            </p>
            <div className="space-y-3">
              <Link href="/admin/dispatch-911">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Go to 911 Dispatch Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-indigo-900 border-b border-indigo-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/admin/dispatch-911" className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <span className="text-sm text-indigo-200">
              Step {step + 1} of 2
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-indigo-400" />
            <div>
              <h1 className="text-xl font-bold text-white">911 Dispatcher Registration</h1>
              <p className="text-indigo-200 text-sm">Join the after-hours dispatch network</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex gap-2 mb-8">
          {[0, 1].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-indigo-500' : 'bg-gray-700'
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
              <p className="text-gray-400">Your identity and contact details</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => updateForm({ displayName: e.target.value })}
                placeholder="Your full name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm({ phone: e.target.value })}
                placeholder="(304) 555-0123"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                placeholder="you@911center.gov"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Badge/Employee ID</label>
              <input
                type="text"
                value={form.badgeId}
                onChange={(e) => updateForm({ badgeId: e.target.value })}
                placeholder="Optional"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <Button
              size="lg"
              className="w-full bg-indigo-600 hover:bg-indigo-700 py-6"
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
              <h2 className="text-2xl font-bold text-white mb-2">Select Your 911 Center</h2>
              <p className="text-gray-400">Which dispatch center do you work at?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <Building2 className="w-4 h-4 inline mr-1" />
                911 Center *
              </label>
              <div className="space-y-3">
                {centers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Loading centers...</p>
                ) : (
                  centers.map((center) => (
                    <label
                      key={center.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.centerId === center.id
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="center"
                        checked={form.centerId === center.id}
                        onChange={() => updateForm({ centerId: center.id })}
                        className="w-5 h-5 text-indigo-600"
                      />
                      <div className="flex-1">
                        <span className={`font-medium block ${form.centerId === center.id ? 'text-indigo-400' : 'text-white'}`}>
                          {center.center_name}
                        </span>
                        <span className="text-gray-500 text-sm">{center.county} County • {center.phone}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <Card className="bg-indigo-900/30 border-indigo-700/50">
              <CardContent className="p-4">
                <p className="text-indigo-200 text-sm">
                  <strong>Note:</strong> As a 911 dispatcher, you&apos;ll be able to acknowledge and route 
                  ACO dispatches during after-hours. All actions are logged for accountability.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 border-gray-600 text-gray-300 py-6"
                onClick={() => setStep(0)}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-6"
                onClick={handleSubmit}
                disabled={submitting || !form.centerId}
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
