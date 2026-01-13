'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, 
  MapPin, 
  ArrowRight, 
  AlertTriangle,
  Dog,
  Cat,
  Rabbit,
  Plus,
  Minus,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { FoundPetMatcher } from '@/components/FoundPetMatcher';

type Species = 'DOG' | 'CAT' | 'RABBIT' | 'OTHER';

const SPECIES_OPTIONS: { value: Species; label: string; icon: React.ReactNode }[] = [
  { value: 'DOG', label: 'Puppies', icon: <Dog className="h-6 w-6" /> },
  { value: 'CAT', label: 'Kittens', icon: <Cat className="h-6 w-6" /> },
  { value: 'RABBIT', label: 'Rabbits', icon: <Rabbit className="h-6 w-6" /> },
  { value: 'OTHER', label: 'Other', icon: <Plus className="h-6 w-6" /> },
];

const COUNTIES = [
  'GREENBRIER',
  'KANAWHA',
];

export default function QuickLitterReportPage() {
  const router = useRouter();
  const [step, setStep] = useState<'photo' | 'details' | 'matching' | 'location' | 'submitting' | 'success'>('photo');
  const [matchedPetId, setMatchedPetId] = useState<string | null>(null);
  
  // Form state
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [species, setSpecies] = useState<Species>('DOG');
  const [count, setCount] = useState(1);
  const [description, setDescription] = useState('');
  const [county, setCounty] = useState('GREENBRIER');
  const [locationNotes, setLocationNotes] = useState('');
  const [canHold, setCanHold] = useState(true);
  const [phone, setPhone] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setStep('submitting');
    
    try {
      const formData = new FormData();
      if (photo) formData.append('photo', photo);
      formData.append('species', species);
      formData.append('count', String(count));
      formData.append('description', description);
      formData.append('county', county);
      formData.append('location_notes', locationNotes);
      formData.append('can_hold', String(canHold));
      formData.append('phone', phone);

      const res = await fetch('/api/report/litter', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCaseNumber(data.case_number);
        setStep('success');
      } else {
        alert('Failed to submit. Please try again.');
        setStep('location');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting report.');
      setStep('location');
    } finally {
      setSubmitting(false);
    }
  };

  const speciesLabel = species === 'DOG' ? 'puppies' : species === 'CAT' ? 'kittens' : 'animals';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900/50 to-red-900/50 border-b border-amber-800/50 p-4">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="text-amber-500 text-sm mb-2 block">← Back to Home</Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Quick Litter Report
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Found multiple animals together? Report them fast.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {['photo', 'details', 'matching', 'location'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                step === s ? 'bg-amber-600 text-white' :
                ['photo', 'details', 'matching', 'location'].indexOf(step) > i ? 'bg-green-600 text-white' :
                'bg-zinc-800 text-zinc-500'
              }`}>
                {['photo', 'details', 'matching', 'location'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 3 && <div className={`w-4 sm:w-8 h-0.5 ${['photo', 'details', 'matching', 'location'].indexOf(step) > i ? 'bg-green-600' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Photo */}
        {step === 'photo' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Take a Photo</h2>
              <p className="text-zinc-400 text-sm">One photo of the group is enough</p>
            </div>

            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                photoPreview ? 'border-green-600 bg-green-900/20' : 'border-zinc-700 hover:border-amber-600'
              }`}
              onClick={() => document.getElementById('photo-input')?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
              ) : (
                <>
                  <Camera className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
                  <p className="text-zinc-400">Tap to take or upload photo</p>
                </>
              )}
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <button
              onClick={() => setStep('details')}
              className="w-full bg-amber-700 hover:bg-amber-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              {photoPreview ? 'Continue' : 'Skip Photo'}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">What did you find?</h2>
            </div>

            {/* Species */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Species</label>
              <div className="grid grid-cols-4 gap-2">
                {SPECIES_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSpecies(opt.value)}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                      species === opt.value 
                        ? 'border-amber-500 bg-amber-900/30 text-amber-400' 
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {opt.icon}
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">How many {speciesLabel}?</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCount(Math.max(1, count - 1))}
                  className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="text-4xl font-bold w-20 text-center">{count}</div>
                <button
                  onClick={() => setCount(count + 1)}
                  className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Quick description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`e.g., "Mixed breed ${speciesLabel}, ~8 weeks old"`}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('photo')}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep('matching')}
                className="flex-1 bg-amber-700 hover:bg-amber-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                Check for Matches
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Matching - Auto-search for lost pets */}
        {step === 'matching' && (
          <div className="space-y-6">
            <FoundPetMatcher
              species={species}
              county={county}
              description={description}
              photoUrl={photoPreview || undefined}
              onMatchSelected={(match) => {
                setMatchedPetId(match.id);
                // Could auto-route to reunification flow here
                setStep('location');
              }}
              onNoMatch={() => setStep('location')}
              onSkip={() => setStep('location')}
            />
            <button
              onClick={() => setStep('details')}
              className="w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg font-semibold"
            >
              ← Back to Details
            </button>
          </div>
        )}

        {/* Step 4: Location */}
        {step === 'location' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Where are they?</h2>
            </div>

            {/* County */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">County</label>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
              >
                {COUNTIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Location notes */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Where exactly?
              </label>
              <textarea
                value={locationNotes}
                onChange={(e) => setLocationNotes(e.target.value)}
                placeholder="e.g., Outside KCHA back door, in a crate"
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
              />
            </div>

            {/* Can hold */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canHold}
                  onChange={(e) => setCanHold(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span>I can stay with the animals until help arrives</span>
              </label>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Your phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('matching')}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!phone}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                Submit Alert
                <AlertTriangle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold">Submitting Alert...</h2>
            <p className="text-zinc-400 mt-2">Creating case for {count} {speciesLabel}</p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Alert Submitted!</h2>
            <p className="text-zinc-400 mb-4">
              Case #{caseNumber} created for {count} {speciesLabel}
            </p>
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-zinc-400 mb-2">What happens next:</p>
              <ul className="text-sm space-y-1">
                <li>• Volunteers in {county} county are being notified</li>
                <li>• Local shelters/rescues will see this alert</li>
                <li>• You'll receive a text when help is on the way</li>
              </ul>
            </div>
            <Link
              href="/"
              className="inline-block bg-amber-700 hover:bg-amber-600 px-6 py-3 rounded-lg font-semibold"
            >
              Return Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
