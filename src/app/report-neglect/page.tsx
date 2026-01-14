'use client';

/**
 * Report Neglect/Cruelty Page
 * 
 * Dedicated intake form for reporting animal cruelty, neglect, or abuse.
 * Automatically triggers ACO notification per WV statutes.
 * 
 * Legal Basis:
 * - WV Code §7-10-4 (Magistrate Authority - custody of neglected/abused animals)
 * - WV Code §7-1-14 (County Authority - animal welfare)
 * - WV Code §19-20-20 (Vicious Dogs)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle, Shield, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LawTriggerCheckboxes, type LawTriggerCategory } from '@/components/intake/LawTriggerCheckboxes';
import { createClient } from '@/lib/supabase/client';

interface ReportForm {
  // Location
  county: 'GREENBRIER' | 'KANAWHA' | '';
  address: string;
  locationDetails: string;
  
  // Animal info
  species: string;
  animalCount: string;
  description: string;
  
  // Situation
  lawTriggers: LawTriggerCategory[];
  situationDetails: string;
  isOngoing: boolean;
  frequency: string;
  
  // Evidence
  hasPhotos: boolean;
  hasWitnesses: boolean;
  witnessInfo: string;
  
  // Reporter
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
  wantsUpdates: boolean;
  isAnonymous: boolean;
  
  // Safety
  isUnsafeLocation: boolean;
  safetyNotes: string;
}

const SPECIES_OPTIONS = [
  'Dog',
  'Cat',
  'Horse',
  'Livestock (cattle, pigs, sheep, goats)',
  'Poultry',
  'Rabbit',
  'Bird',
  'Reptile',
  'Multiple species',
  'Other',
];

export default function ReportNeglectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<ReportForm>({
    county: '',
    address: '',
    locationDetails: '',
    species: '',
    animalCount: '1',
    description: '',
    lawTriggers: [],
    situationDetails: '',
    isOngoing: false,
    frequency: '',
    hasPhotos: false,
    hasWitnesses: false,
    witnessInfo: '',
    reporterName: '',
    reporterPhone: '',
    reporterEmail: '',
    wantsUpdates: true,
    isAnonymous: false,
    isUnsafeLocation: false,
    safetyNotes: '',
  });

  const updateForm = (updates: Partial<ReportForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const supabase = createClient();

  async function handleSubmit() {
    if (!form.county || !form.address || form.lawTriggers.length === 0) {
      alert('Please fill in all required fields and select at least one concern.');
      return;
    }

    setSubmitting(true);

    try {
      // Create sighting with law triggers (which will auto-create ACO dispatch)
      const response = await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          county: form.county,
          sighting_address: form.address,
          description: `NEGLECT/CRUELTY REPORT: ${form.situationDetails}\n\nAnimal: ${form.species} (${form.animalCount})\nDescription: ${form.description}\n\nOngoing: ${form.isOngoing ? 'Yes - ' + form.frequency : 'No'}\nWitnesses: ${form.hasWitnesses ? form.witnessInfo : 'None reported'}\nPhotos available: ${form.hasPhotos ? 'Yes' : 'No'}\n\nSafety concern: ${form.isUnsafeLocation ? form.safetyNotes : 'None'}`,
          species: form.species,
          reporter_name: form.isAnonymous ? 'Anonymous' : form.reporterName,
          reporter_phone: form.isAnonymous ? '' : form.reporterPhone,
          reporter_email: form.isAnonymous ? '' : form.reporterEmail,
          law_triggers: form.lawTriggers,
          animal_behavior: form.situationDetails,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again or call 911 for emergencies.');
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
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Report Submitted</h1>
            <p className="text-slate-300 mb-6">
              Your report has been received and Animal Control has been automatically notified.
              All reports are logged for accountability.
            </p>
            <div className="p-4 bg-amber-900/30 border border-amber-700 rounded-lg mb-6 text-left">
              <p className="text-amber-200 text-sm">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-amber-200/80 text-sm mt-2 space-y-1">
                <li>• ACO will receive notification with case details</li>
                <li>• Response time depends on priority level</li>
                <li>• All actions will be logged for accountability</li>
                {form.wantsUpdates && !form.isAnonymous && (
                  <li>• You&apos;ll receive updates at the contact info provided</li>
                )}
              </ul>
            </div>
            <div className="space-y-3">
              <Link href="/">
                <Button className="w-full bg-slate-700 hover:bg-slate-600">
                  Return Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full border-slate-600 text-slate-300"
                onClick={() => {
                  setSubmitted(false);
                  setStep(0);
                  setForm({
                    county: '',
                    address: '',
                    locationDetails: '',
                    species: '',
                    animalCount: '1',
                    description: '',
                    lawTriggers: [],
                    situationDetails: '',
                    isOngoing: false,
                    frequency: '',
                    hasPhotos: false,
                    hasWitnesses: false,
                    witnessInfo: '',
                    reporterName: '',
                    reporterPhone: '',
                    reporterEmail: '',
                    wantsUpdates: true,
                    isAnonymous: false,
                    isUnsafeLocation: false,
                    safetyNotes: '',
                  });
                }}
              >
                Submit Another Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-red-900 border-b border-red-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="flex items-center gap-2 text-red-200 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <span className="text-sm text-red-200">
              Step {step + 1} of 4
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Report Animal Neglect or Cruelty</h1>
              <p className="text-red-200 text-sm">This report will be sent to Animal Control</p>
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Banner */}
      <div className="bg-red-800 border-b border-red-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Phone className="w-5 h-5 text-white" />
          <p className="text-white text-sm">
            <strong>Emergency?</strong> If an animal is in immediate danger, call 911 directly.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-red-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Location of the Animal(s)</h2>
              <p className="text-slate-400">Where is this occurring?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">County *</label>
              <select
                value={form.county}
                onChange={(e) => updateForm({ county: e.target.value as 'GREENBRIER' | 'KANAWHA' | '' })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
              >
                <option value="">Select county...</option>
                <option value="GREENBRIER">Greenbrier County</option>
                <option value="KANAWHA">Kanawha County</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address or Location *
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateForm({ address: e.target.value })}
                placeholder="Street address, intersection, or landmark"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Location Details</label>
              <textarea
                value={form.locationDetails}
                onChange={(e) => updateForm({ locationDetails: e.target.value })}
                placeholder="Apartment number, house color, any landmarks that help identify the location"
                rows={2}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <Card className="bg-amber-900/30 border-amber-700/50">
              <CardContent className="p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isUnsafeLocation}
                    onChange={(e) => updateForm({ isUnsafeLocation: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-amber-600 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-medium text-amber-300">This location may be unsafe</span>
                    <p className="text-amber-200/70 text-sm mt-1">
                      Check this if there are aggressive people, weapons, or other hazards ACO should know about.
                    </p>
                  </div>
                </label>
                {form.isUnsafeLocation && (
                  <textarea
                    value={form.safetyNotes}
                    onChange={(e) => updateForm({ safetyNotes: e.target.value })}
                    placeholder="Describe the safety concern..."
                    rows={2}
                    className="mt-3 w-full px-3 py-2 bg-amber-900/50 border border-amber-700 rounded-lg text-amber-100 placeholder-amber-300/50 focus:outline-none focus:border-amber-500 resize-none"
                  />
                )}
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700 py-6"
              onClick={() => setStep(1)}
              disabled={!form.county || !form.address}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Animal Information</h2>
              <p className="text-slate-400">Tell us about the animal(s) involved</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Type of Animal *</label>
              <select
                value={form.species}
                onChange={(e) => updateForm({ species: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
              >
                <option value="">Select type...</option>
                {SPECIES_OPTIONS.map((species) => (
                  <option key={species} value={species}>{species}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">How many animals?</label>
              <input
                type="text"
                value={form.animalCount}
                onChange={(e) => updateForm({ animalCount: e.target.value })}
                placeholder="e.g., 1, 3, 10+, Unknown"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Animal Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                placeholder="Color, size, breed (if known), any distinguishing features"
                rows={3}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
              />
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
                className="flex-1 bg-red-600 hover:bg-red-700 py-6"
                onClick={() => setStep(2)}
                disabled={!form.species}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">What Are You Reporting?</h2>
              <p className="text-slate-400">Select all concerns that apply</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <LawTriggerCheckboxes
                selectedTriggers={form.lawTriggers}
                onChange={(triggers) => updateForm({ lawTriggers: triggers })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Describe the Situation *</label>
              <textarea
                value={form.situationDetails}
                onChange={(e) => updateForm({ situationDetails: e.target.value })}
                placeholder="What did you observe? Be as specific as possible."
                rows={4}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isOngoing}
                  onChange={(e) => updateForm({ isOngoing: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 text-red-600 focus:ring-red-500"
                />
                <span className="text-slate-300">This is ongoing</span>
              </label>
              <label className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasPhotos}
                  onChange={(e) => updateForm({ hasPhotos: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 text-red-600 focus:ring-red-500"
                />
                <span className="text-slate-300">I have photos/video</span>
              </label>
            </div>

            {form.isOngoing && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">How often does this occur?</label>
                <input
                  type="text"
                  value={form.frequency}
                  onChange={(e) => updateForm({ frequency: e.target.value })}
                  placeholder="e.g., Daily, Several times a week, Ongoing for months"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            )}

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
                className="flex-1 bg-red-600 hover:bg-red-700 py-6"
                onClick={() => setStep(3)}
                disabled={form.lawTriggers.length === 0 || !form.situationDetails}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Information</h2>
              <p className="text-slate-400">Optional but helps with follow-up</p>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAnonymous}
                    onChange={(e) => updateForm({ isAnonymous: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-600 text-slate-600 focus:ring-slate-500"
                  />
                  <div>
                    <span className="font-medium text-slate-300">Submit anonymously</span>
                    <p className="text-slate-400 text-sm mt-1">
                      Your identity will not be shared. Note: We won&apos;t be able to follow up with you.
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {!form.isAnonymous && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={form.reporterName}
                    onChange={(e) => updateForm({ reporterName: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={form.reporterPhone}
                    onChange={(e) => updateForm({ reporterPhone: e.target.value })}
                    placeholder="For follow-up questions"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.reporterEmail}
                    onChange={(e) => updateForm({ reporterEmail: e.target.value })}
                    placeholder="For case updates"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <label className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.wantsUpdates}
                    onChange={(e) => updateForm({ wantsUpdates: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-slate-300">I want to receive updates on this case</span>
                </label>
              </>
            )}

            <Card className="bg-red-900/30 border-red-700/50">
              <CardContent className="p-4">
                <p className="text-red-200 text-sm">
                  <strong>Legal Notice:</strong> By submitting this report, Animal Control will be 
                  automatically notified per WV Code §7-10-4 and §7-1-14. All reports and outcomes 
                  are logged for accountability purposes.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 border-slate-600 text-slate-300 py-6"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-red-600 hover:bg-red-700 py-6"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
