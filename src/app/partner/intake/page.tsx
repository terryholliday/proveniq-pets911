'use client';

import { useState } from 'react';
import { 
  Briefcase, 
  Dog,
  Cat,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  CheckCircle,
  Camera,
  Plus,
  Minus,
  Loader2
} from 'lucide-react';

type Species = 'DOG' | 'CAT' | 'OTHER';
type IntakeType = 'STRAY' | 'SURRENDER' | 'TRANSFER' | 'SEIZED' | 'RETURN';

interface AnimalIntake {
  species: Species;
  breed?: string;
  color?: string;
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  age_estimate?: string;
  weight_estimate?: string;
  microchip_number?: string;
  has_collar: boolean;
  collar_description?: string;
  medical_notes?: string;
  behavioral_notes?: string;
}

export default function PartnerIntakePage() {
  const [step, setStep] = useState<'type' | 'source' | 'animals' | 'review' | 'submitting' | 'success'>('type');
  
  // Form state
  const [intakeType, setIntakeType] = useState<IntakeType | null>(null);
  const [caseNumber, setCaseNumber] = useState('');
  const [sourceDescription, setSourceDescription] = useState('');
  const [sourceAddress, setSourceAddress] = useState('');
  const [sourceCounty, setSourceCounty] = useState('GREENBRIER');
  const [sourcePhone, setSourcePhone] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [animals, setAnimals] = useState<AnimalIntake[]>([{
    species: 'DOG',
    has_collar: false,
  }]);
  
  const [submitting, setSubmitting] = useState(false);
  const [intakeId, setIntakeId] = useState<string | null>(null);

  const INTAKE_TYPES = [
    { value: 'STRAY', label: 'Stray Intake', description: 'Animal found with no owner', icon: <MapPin className="h-5 w-5" /> },
    { value: 'SURRENDER', label: 'Owner Surrender', description: 'Owner relinquishing animal', icon: <User className="h-5 w-5" /> },
    { value: 'TRANSFER', label: 'Transfer In', description: 'From another shelter/rescue', icon: <Briefcase className="h-5 w-5" /> },
    { value: 'SEIZED', label: 'Legal Seizure', description: 'ACO/law enforcement seizure', icon: <AlertTriangle className="h-5 w-5" /> },
    { value: 'RETURN', label: 'Return to Shelter', description: 'Adoption return or foster return', icon: <CheckCircle className="h-5 w-5" /> },
  ];

  const addAnimal = () => {
    setAnimals([...animals, { species: 'DOG', has_collar: false }]);
  };

  const removeAnimal = (index: number) => {
    if (animals.length > 1) {
      setAnimals(animals.filter((_, i) => i !== index));
    }
  };

  const updateAnimal = (index: number, field: keyof AnimalIntake, value: unknown) => {
    const updated = [...animals];
    updated[index] = { ...updated[index], [field]: value };
    setAnimals(updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setStep('submitting');
    
    try {
      const res = await fetch('/api/partner/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake_type: intakeType,
          case_number: caseNumber,
          source: {
            description: sourceDescription,
            address: sourceAddress,
            county: sourceCounty,
            phone: sourcePhone,
            name: sourceName,
          },
          animals,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIntakeId(data.intake_id);
        setStep('success');
      } else {
        alert('Failed to submit intake');
        setStep('review');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting intake');
      setStep('review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-emerald-500" />
            Partner Intake Form
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Record new animals entering your facility
          </p>
        </div>

        {/* Progress */}
        {!['submitting', 'success'].includes(step) && (
          <div className="flex items-center gap-2 mb-8">
            {['type', 'source', 'animals', 'review'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s ? 'bg-emerald-600 text-white' :
                  ['type', 'source', 'animals', 'review'].indexOf(step) > i ? 'bg-green-600 text-white' :
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {['type', 'source', 'animals', 'review'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 3 && <div className={`w-8 h-0.5 ${['type', 'source', 'animals', 'review'].indexOf(step) > i ? 'bg-green-600' : 'bg-zinc-800'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Intake Type */}
        {step === 'type' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">What type of intake is this?</h2>
            <div className="space-y-3">
              {INTAKE_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setIntakeType(type.value as IntakeType)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    intakeType === type.value 
                      ? 'border-emerald-500 bg-emerald-900/30' 
                      : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${intakeType === type.value ? 'bg-emerald-600' : 'bg-zinc-800'}`}>
                      {type.icon}
                    </div>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-zinc-400">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Link to existing case */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <label className="block text-sm text-zinc-400 mb-2">
                Link to Pet911 Case # (optional)
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="e.g., GRBR-2026-0142"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2"
              />
            </div>

            <button
              onClick={() => intakeType && setStep('source')}
              disabled={!intakeType}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 py-3 rounded-lg font-semibold"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Source Info */}
        {step === 'source' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              {intakeType === 'SURRENDER' ? 'Owner Information' :
               intakeType === 'TRANSFER' ? 'Sending Organization' :
               intakeType === 'SEIZED' ? 'Seizure Details' :
               'Where was the animal found?'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  {intakeType === 'SURRENDER' ? 'Owner Name' :
                   intakeType === 'TRANSFER' ? 'Organization Name' :
                   'Finder/Reporter Name'}
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={sourcePhone}
                  onChange={(e) => setSourcePhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  {intakeType === 'SURRENDER' ? 'Owner Address' :
                   intakeType === 'TRANSFER' ? 'Sending Shelter Address' :
                   'Location Found'}
                </label>
                <input
                  type="text"
                  value={sourceAddress}
                  onChange={(e) => setSourceAddress(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">County</label>
                <select
                  value={sourceCounty}
                  onChange={(e) => setSourceCounty(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
                >
                  <option value="GREENBRIER">GREENBRIER</option>
                  <option value="KANAWHA">KANAWHA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Additional Notes</label>
                <textarea
                  value={sourceDescription}
                  onChange={(e) => setSourceDescription(e.target.value)}
                  placeholder="Any relevant details about the intake source..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('type')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg">
                Back
              </button>
              <button onClick={() => setStep('animals')} className="flex-1 bg-emerald-700 hover:bg-emerald-600 py-3 rounded-lg font-semibold">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Animals */}
        {step === 'animals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Animal Information</h2>
              <button
                onClick={addAnimal}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Another
              </button>
            </div>

            <div className="space-y-4">
              {animals.map((animal, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">Animal #{idx + 1}</span>
                    {animals.length > 1 && (
                      <button
                        onClick={() => removeAnimal(idx)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Species</label>
                      <div className="flex gap-2">
                        {['DOG', 'CAT', 'OTHER'].map(sp => (
                          <button
                            key={sp}
                            onClick={() => updateAnimal(idx, 'species', sp)}
                            className={`flex-1 py-2 rounded text-sm ${
                              animal.species === sp 
                                ? 'bg-emerald-700' 
                                : 'bg-zinc-800 hover:bg-zinc-700'
                            }`}
                          >
                            {sp === 'DOG' ? '🐕' : sp === 'CAT' ? '🐈' : '🐾'} {sp}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Sex</label>
                      <div className="flex gap-2">
                        {['MALE', 'FEMALE', 'UNKNOWN'].map(sex => (
                          <button
                            key={sex}
                            onClick={() => updateAnimal(idx, 'sex', sex)}
                            className={`flex-1 py-2 rounded text-sm ${
                              animal.sex === sex 
                                ? 'bg-emerald-700' 
                                : 'bg-zinc-800 hover:bg-zinc-700'
                            }`}
                          >
                            {sex === 'MALE' ? '♂' : sex === 'FEMALE' ? '♀' : '?'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Breed</label>
                      <input
                        type="text"
                        value={animal.breed || ''}
                        onChange={(e) => updateAnimal(idx, 'breed', e.target.value)}
                        placeholder="e.g., Lab Mix"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Color</label>
                      <input
                        type="text"
                        value={animal.color || ''}
                        onChange={(e) => updateAnimal(idx, 'color', e.target.value)}
                        placeholder="e.g., Black and Tan"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Age Estimate</label>
                      <input
                        type="text"
                        value={animal.age_estimate || ''}
                        onChange={(e) => updateAnimal(idx, 'age_estimate', e.target.value)}
                        placeholder="e.g., ~2 years"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Weight Estimate</label>
                      <input
                        type="text"
                        value={animal.weight_estimate || ''}
                        onChange={(e) => updateAnimal(idx, 'weight_estimate', e.target.value)}
                        placeholder="e.g., ~40 lbs"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-400 mb-1">Microchip # (if scanned)</label>
                      <input
                        type="text"
                        value={animal.microchip_number || ''}
                        onChange={(e) => updateAnimal(idx, 'microchip_number', e.target.value)}
                        placeholder="Enter microchip number"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={animal.has_collar}
                          onChange={(e) => updateAnimal(idx, 'has_collar', e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Has collar/tags</span>
                      </label>
                      {animal.has_collar && (
                        <input
                          type="text"
                          value={animal.collar_description || ''}
                          onChange={(e) => updateAnimal(idx, 'collar_description', e.target.value)}
                          placeholder="Describe collar/tags..."
                          className="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                        />
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-400 mb-1">Medical Notes</label>
                      <textarea
                        value={animal.medical_notes || ''}
                        onChange={(e) => updateAnimal(idx, 'medical_notes', e.target.value)}
                        placeholder="Any visible injuries, conditions, etc."
                        rows={2}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('source')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg">
                Back
              </button>
              <button onClick={() => setStep('review')} className="flex-1 bg-emerald-700 hover:bg-emerald-600 py-3 rounded-lg font-semibold">
                Review
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Review Intake</h2>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
              <div>
                <span className="text-xs text-zinc-500">Intake Type</span>
                <p className="font-medium">{INTAKE_TYPES.find(t => t.value === intakeType)?.label}</p>
              </div>
              {caseNumber && (
                <div>
                  <span className="text-xs text-zinc-500">Linked Case</span>
                  <p className="font-medium">#{caseNumber}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-zinc-500">Source</span>
                <p className="font-medium">{sourceName || 'Unknown'}</p>
                <p className="text-sm text-zinc-400">{sourceAddress}</p>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Animals</span>
                <p className="font-medium">{animals.length} animal{animals.length > 1 ? 's' : ''}</p>
                <div className="flex gap-2 mt-1">
                  {animals.map((a, i) => (
                    <span key={i} className="text-xs bg-zinc-800 px-2 py-1 rounded">
                      {a.species === 'DOG' ? '🐕' : a.species === 'CAT' ? '🐈' : '🐾'} {a.breed || a.species}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('animals')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg">
                Back
              </button>
              <button onClick={handleSubmit} className="flex-1 bg-emerald-700 hover:bg-emerald-600 py-3 rounded-lg font-semibold">
                Submit Intake
              </button>
            </div>
          </div>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-500" />
            <h2 className="text-xl font-semibold">Processing Intake...</h2>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Intake Complete!</h2>
            <p className="text-zinc-400 mb-6">
              {animals.length} animal{animals.length > 1 ? 's' : ''} added to your facility
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setStep('type');
                  setIntakeType(null);
                  setCaseNumber('');
                  setAnimals([{ species: 'DOG', has_collar: false }]);
                }}
                className="bg-emerald-700 hover:bg-emerald-600 px-6 py-3 rounded-lg font-semibold"
              >
                New Intake
              </button>
              <a
                href="/partner/dashboard"
                className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-lg"
              >
                Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
