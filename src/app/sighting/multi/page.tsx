'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, 
  MapPin, 
  ArrowRight, 
  ArrowLeft,
  AlertTriangle,
  Users,
  Home,
  Cat,
  Heart,
  Plus,
  Minus,
  Loader2,
  CheckCircle,
  Phone
} from 'lucide-react';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

type Scenario = 
  | 'LITTER'           // Found puppies/kittens together
  | 'DECEASED_OWNER'   // Animals from deceased owner's property
  | 'FERAL_COLONY'     // Feral cat colony for TNR
  | 'HOARDING'         // Suspected hoarding situation
  | 'ABANDONMENT'      // Intentional abandonment (multiple)
  | 'OTHER';           // Other multi-animal situation

type Species = 'DOG' | 'CAT' | 'MIXED' | 'OTHER';

// Ordered by expected frequency of use
const SCENARIO_OPTIONS: { value: Scenario; label: string; description: string; icon: React.ReactNode; emoji: string }[] = [
  { 
    value: 'LITTER', 
    label: 'Litter / Group', 
    description: 'Puppies, kittens, or animals found together',
    icon: <Users className="h-6 w-6" />,
    emoji: '🐾'
  },
  { 
    value: 'ABANDONMENT', 
    label: 'Mass Abandonment', 
    description: 'Multiple animals dumped/left behind',
    icon: <Heart className="h-6 w-6" />,
    emoji: '💔'
  },
  { 
    value: 'FERAL_COLONY', 
    label: 'Feral Cat Colony', 
    description: 'Report for TNR (Trap-Neuter-Return)',
    icon: <Cat className="h-6 w-6" />,
    emoji: '🐱'
  },
  { 
    value: 'HOARDING', 
    label: 'Suspected Hoarding', 
    description: 'Multiple animals in poor conditions',
    icon: <AlertTriangle className="h-6 w-6" />,
    emoji: '⚠️'
  },
  { 
    value: 'DECEASED_OWNER', 
    label: 'Deceased Owner', 
    description: 'Animals left after owner passed away',
    icon: <Home className="h-6 w-6" />,
    emoji: '🏠'
  },
  { 
    value: 'OTHER', 
    label: 'Other Situation', 
    description: 'Describe your situation',
    icon: <Plus className="h-6 w-6" />,
    emoji: '📝'
  },
];

const COUNTIES = ['GREENBRIER', 'KANAWHA'];

export default function MultiAnimalReportPage() {
  const router = useRouter();
  const [step, setStep] = useState<'scenario' | 'details' | 'location' | 'contact' | 'submitting' | 'success'>('scenario');
  
  // Form state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [species, setSpecies] = useState<Species>('DOG');
  const [count, setCount] = useState(2);
  const [countUncertain, setCountUncertain] = useState(false);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [county, setCounty] = useState('GREENBRIER');
  const [address, setAddress] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [canHold, setCanHold] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
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
      formData.append('scenario', scenario || 'OTHER');
      formData.append('species', species);
      formData.append('count', countUncertain ? 'unknown' : String(count));
      formData.append('description', description);
      formData.append('county', county);
      formData.append('address', address);
      formData.append('location_notes', locationNotes);
      formData.append('urgency', urgency);
      formData.append('can_hold', String(canHold));
      formData.append('reporter_name', name);
      formData.append('reporter_phone', phone);
      formData.append('reporter_email', email);

      const res = await fetch('/api/sighting/multi', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCaseNumber(data.case_number);
        setStep('success');
      } else {
        alert('Failed to submit. Please try again.');
        setStep('contact');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting report.');
      setStep('contact');
    } finally {
      setSubmitting(false);
    }
  };

  const getScenarioLabel = () => {
    return SCENARIO_OPTIONS.find(s => s.value === scenario)?.label || 'animals';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900/50 to-zinc-900 border-b border-amber-800/50 p-4">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="text-amber-500 text-sm mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            Multi-Animal Report
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Report multiple animals that need help
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* Progress */}
        {!['submitting', 'success'].includes(step) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {['scenario', 'details', 'location', 'contact'].map((s, i) => {
                const stepLabels = ['Situation', 'Details', 'Location', 'Contact'];
                const isComplete = ['scenario', 'details', 'location', 'contact'].indexOf(step) > i;
                const isCurrent = step === s;
                return (
                  <div key={s} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isCurrent ? 'bg-amber-600 text-white ring-4 ring-amber-600/30 scale-110' :
                      isComplete ? 'bg-green-600 text-white' :
                      'bg-zinc-800 text-zinc-500'
                    }`}>
                      {isComplete ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs mt-1 ${isCurrent ? 'text-amber-400 font-medium' : 'text-zinc-500'}`}>
                      {stepLabels[i]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(['scenario', 'details', 'location', 'contact'].indexOf(step) + 1) * 25}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Scenario */}
        {step === 'scenario' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">What's the situation?</h2>
              <p className="text-zinc-400 text-sm">Select the option that best describes what you found</p>
            </div>

            <div className="space-y-3">
              {SCENARIO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setScenario(opt.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    scenario === opt.value 
                      ? 'border-amber-500 bg-amber-900/30 shadow-lg shadow-amber-900/20 scale-[1.02]' 
                      : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                      scenario === opt.value ? 'bg-amber-600 scale-110' : 'bg-zinc-800'
                    }`}>
                      {opt.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{opt.label}</div>
                      <div className="text-sm text-zinc-400">{opt.description}</div>
                    </div>
                    {scenario === opt.value && (
                      <CheckCircle className="h-6 w-6 text-amber-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => scenario && setStep('details')}
              disabled={!scenario}
              className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Tell us more</h2>
              <p className="text-zinc-400 text-sm">About the {getScenarioLabel().toLowerCase()}</p>
            </div>

            {/* Species (not for feral colony) */}
            {scenario !== 'FERAL_COLONY' && (
              <div>
                <label className="block text-sm text-zinc-400 mb-2">What type of animals?</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'DOG', label: 'Dogs', emoji: '🐕' },
                    { value: 'CAT', label: 'Cats', emoji: '🐈' },
                    { value: 'MIXED', label: 'Mixed', emoji: '🐾' },
                    { value: 'OTHER', label: 'Other', emoji: '❓' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSpecies(opt.value as Species)}
                      className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                        species === opt.value 
                          ? 'border-amber-500 bg-amber-900/30 scale-105' 
                          : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{opt.emoji}</div>
                      <div className="text-sm font-medium">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Count */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                How many animals? {scenario === 'FERAL_COLONY' && '(estimated)'}
              </label>
              
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={countUncertain}
                  onChange={(e) => setCountUncertain(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-zinc-400">I'm not sure / too many to count</span>
              </label>
              
              {!countUncertain && (
                <div className="flex items-center justify-center gap-6 py-4">
                  <button
                    onClick={() => setCount(Math.max(2, count - 1))}
                    className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 flex items-center justify-center transition-all shadow-lg"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <div className="w-24 text-center">
                    <div className="text-5xl font-black text-amber-400">{count}</div>
                    <div className="text-xs text-zinc-500 mt-1">animals</div>
                  </div>
                  <button
                    onClick={() => setCount(count + 1)}
                    className="w-14 h-14 rounded-full bg-amber-700 hover:bg-amber-600 active:scale-95 flex items-center justify-center transition-all shadow-lg"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Photo (optional but helpful)</label>
              {photoPreview ? (
                <div className="border-2 border-green-600 bg-green-900/20 rounded-xl p-4 text-center">
                  <img src={photoPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg mb-3" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Remove photo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById('photo-camera')?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-amber-600 rounded-xl p-4 text-center transition-colors"
                  >
                    <Camera className="h-6 w-6 mx-auto mb-2 text-zinc-500" />
                    <p className="text-zinc-400 text-sm">Take Photo</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-amber-600 rounded-xl p-4 text-center transition-colors"
                  >
                    <Plus className="h-6 w-6 mx-auto mb-2 text-zinc-500" />
                    <p className="text-zinc-400 text-sm">Upload Photo</p>
                  </button>
                </div>
              )}
              <input
                id="photo-camera"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  scenario === 'DECEASED_OWNER' 
                    ? "e.g., Owner passed away last week. 5 dogs living in a shack on the property..."
                    : scenario === 'FERAL_COLONY'
                    ? "e.g., Colony of ~10 cats behind the grocery store. Been there for months..."
                    : "Describe the situation and condition of the animals..."
                }
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm"
              />
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">How urgent is this?</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'LOW', label: 'Low', color: 'border-blue-500 bg-blue-900/40 text-blue-300', dot: 'bg-blue-500' },
                  { value: 'MEDIUM', label: 'Medium', color: 'border-yellow-500 bg-yellow-900/40 text-yellow-300', dot: 'bg-yellow-500' },
                  { value: 'HIGH', label: 'High', color: 'border-orange-500 bg-orange-900/40 text-orange-300', dot: 'bg-orange-500' },
                  { value: 'CRITICAL', label: 'Critical', color: 'border-red-500 bg-red-900/40 text-red-300 animate-pulse', dot: 'bg-red-500' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setUrgency(opt.value as typeof urgency)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      urgency === opt.value ? opt.color : 'border-zinc-800 bg-zinc-900/50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${urgency === opt.value ? opt.dot : 'bg-zinc-600'}`} />
                    <div className="text-xs font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Critical = animals in immediate danger or severe medical need
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('scenario')}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep('location')}
                className="flex-1 bg-amber-700 hover:bg-amber-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 'location' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Where are they?</h2>
            </div>

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

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Address or intersection (if known)</label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                county={county}
                placeholder="Start typing address for suggestions..."
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Location details
              </label>
              <textarea
                value={locationNotes}
                onChange={(e) => setLocationNotes(e.target.value)}
                placeholder="Describe how to find the animals..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('details')}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep('contact')}
                className="flex-1 bg-amber-700 hover:bg-amber-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Contact */}
        {step === 'contact' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Your contact info</h2>
              <p className="text-zinc-400 text-sm">So we can follow up and coordinate help</p>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name is fine"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Phone number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
                />
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canHold}
                  onChange={(e) => setCanHold(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span>I can stay with the animals or provide access</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('location')}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!phone || !name}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                Submit Report <AlertTriangle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold">Submitting Report...</h2>
            <p className="text-zinc-400 mt-2">Creating case for {countUncertain ? 'multiple' : count} animals</p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-900/30 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
            <p className="text-zinc-400 mb-4">
              Case #{caseNumber} created
            </p>
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-zinc-400 mb-2">What happens next:</p>
              <ul className="text-sm space-y-1">
                {scenario === 'FERAL_COLONY' ? (
                  <>
                    <li>• TNR coordinators in {county} will be notified</li>
                    <li>• We'll contact you to schedule trapping</li>
                    <li>• Cats will be spayed/neutered and returned</li>
                  </>
                ) : (
                  <>
                    <li>• Volunteers and partners in {county} are being notified</li>
                    <li>• Local shelters will see this case</li>
                    <li>• You'll receive a call/text when help is coordinated</li>
                  </>
                )}
              </ul>
            </div>
            
            {urgency === 'CRITICAL' && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-400 font-medium">
                  <Phone className="h-4 w-4 inline mr-1" />
                  For immediate emergencies, also call Animal Control or 911
                </p>
              </div>
            )}
            
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
