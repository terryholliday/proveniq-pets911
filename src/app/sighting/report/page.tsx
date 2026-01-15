'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PhotoTips } from '@/components/shared/photo-tips';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { saveSightingReport } from '@/lib/db/indexed-db';
import { LawTriggerCheckboxes, type LawTriggerCategory } from '@/components/intake/LawTriggerCheckboxes';
import type { SightingReportExtended, Species } from '@/lib/types';

type AnimalCondition = 'HEALTHY' | 'INJURED' | 'CRITICAL' | 'UNKNOWN';

interface SightingReport {
  species: Species;
  breed: string;
  color: string;
  size: string;
  condition: AnimalCondition;
  sightingDate: string;
  sightingTime: string;
  location: string;
  stillThere: boolean | null;
  description: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
  canStayWithAnimal: boolean;
  photo: File | null;
  photoPreview: string | null;
  lawTriggers: LawTriggerCategory[];
}

const SPECIES_OPTIONS = [
  { id: 'DOG', label: 'Dog', icon: Dog },
  { id: 'CAT', label: 'Cat', icon: Cat },
  { id: 'BIRD', label: 'Bird', icon: Bird },
  { id: 'RABBIT', label: 'Rabbit', icon: Rabbit },
  { id: 'REPTILE', label: 'Reptile', icon: Rabbit },
  { id: 'SMALL_MAMMAL', label: 'Small Mammal', icon: Rabbit },
  { id: 'LIVESTOCK', label: 'Livestock', icon: Rabbit },
  { id: 'OTHER', label: 'Other', icon: Rabbit },
];

const SIZE_OPTIONS = [
  { id: 'SMALL', label: 'Small', description: 'Under 20 lbs' },
  { id: 'MEDIUM', label: 'Medium', description: '20-50 lbs' },
  { id: 'LARGE', label: 'Large', description: 'Over 50 lbs' },
];

const CONDITION_OPTIONS = [
  { id: 'HEALTHY', label: 'Appears Healthy', color: 'emerald' },
  { id: 'INJURED', label: 'Possibly Injured', color: 'amber' },
  { id: 'CRITICAL', label: 'Needs Urgent Help', color: 'red' },
  { id: 'UNKNOWN', label: 'Can\'t Tell', color: 'slate' },
];

export default function ReportSighting() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<SightingReport>({
    species: 'OTHER',
    breed: '',
    color: '',
    size: '',
    condition: 'UNKNOWN',
    sightingDate: new Date().toISOString().split('T')[0],
    sightingTime: new Date().toTimeString().slice(0, 5),
    location: '',
    stillThere: null,
    description: '',
    reporterName: '',
    reporterPhone: '',
    reporterEmail: '',
    canStayWithAnimal: false,
    photo: null,
    photoPreview: null,
    lawTriggers: [],
  });

  const updateReport = (updates: Partial<SightingReport>) => {
    setReport(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    console.log('Submitting sighting:', report);
    
    // Convert photo to data URL if exists
    let photoUrl: string | null = null;
    if (report.photo) {
      // TODO: Upload photo to storage and get URL
      photoUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(report.photo!);
      });
    }
    
    // Submit to backend API
    try {
      // Auto-generate description from form data
      const descriptionParts = [];
      if (report.species && report.species !== 'OTHER') descriptionParts.push(report.species.toLowerCase());
      if (report.color) descriptionParts.push(report.color);
      if (report.breed) descriptionParts.push(report.breed);
      if (report.size) descriptionParts.push(report.size);
      const autoDescription = descriptionParts.length > 0 
        ? `Sighting of ${descriptionParts.join(', ')}` 
        : 'Animal sighting reported';
      
      const payload = {
        reporter_name: report.reporterName,
        reporter_phone: report.reporterPhone,
        reporter_email: report.reporterEmail,
        sighting_address: report.location,
        description: report.description || autoDescription,
        species: report.species,
        breed: report.breed,
        color: report.color,
        size: report.size,
        condition: report.condition,
        can_stay_with_animal: report.canStayWithAnimal,
        photo_url: photoUrl,
        county: 'GREENBRIER', // TODO: Get from user profile
        sighting_at: new Date().toISOString(),
        law_triggers: report.lawTriggers,
      };
      
      console.log('Sending payload:', payload);
      
      const response = await fetch('/api/sightings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();
      console.log('API response:', responseData);
      
      if (!response.ok) {
        console.error('Failed to submit sighting:', responseData);
        alert(`Failed to submit sighting: ${responseData.error || 'Unknown error'}`);
        return;
      }
      
      console.log('Sighting submitted successfully:', responseData);
      
      // Navigate to success page
      router.push('/sighting/report/success');
    } catch (error) {
      console.error('Error submitting sighting:', error);
      alert('Failed to submit sighting. Please try again.');
    }
  };

  // If critical condition, show emergency prompt
  if (report.condition === 'CRITICAL' && currentStep === 0) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <Card className="bg-red-900/50 border-red-700">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-600 flex items-center justify-center">
                <AlertCircle className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">This animal needs urgent help</h1>
              <p className="text-red-200 mb-6">
                For critical emergencies, use our Emergency Assist to get immediate routing to help.
              </p>
              <div className="space-y-3">
                <Link href="/emergency">
                  <Button className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg">
                    Go to Emergency Assist
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full border-red-700 text-red-200"
                  onClick={() => updateReport({ condition: 'INJURED' })}
                >
                  Continue with sighting report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => {
                if (currentStep > 0) {
                  handleBack();
                } else {
                  // On first step, confirm before leaving
                  if (report.species !== 'OTHER' || report.color || report.photo) {
                    if (confirm('Are you sure you want to leave? Your progress will be lost.')) {
                      window.location.href = '/';
                    }
                  } else {
                    window.location.href = '/';
                  }
                }
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <span className="text-sm text-slate-400">
              Step {currentStep + 1} of 3
            </span>
          </div>
          
          {/* Progress */}
          <div className="flex gap-2">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {currentStep === 0 && (
          <AnimalDetailsStep report={report} updateReport={updateReport} onNext={handleNext} />
        )}
        {currentStep === 1 && (
          <LocationStep report={report} updateReport={updateReport} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === 2 && (
          <ContactStep report={report} updateReport={updateReport} onSubmit={handleSubmit} onBack={handleBack} />
        )}
      </div>
    </main>
  );
}

function AnimalDetailsStep({ 
  report, 
  updateReport, 
  onNext 
}: { 
  report: SightingReport; 
  updateReport: (updates: Partial<SightingReport>) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">What did you see?</h1>
        <p className="text-slate-400 text-lg">Describe the animal as best you can</p>
      </div>
      
      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Photo (if possible)</label>
        <div className="space-y-4">
          {report.photoPreview ? (
            <div className="relative">
              <img
                src={report.photoPreview}
                alt="Sighting photo"
                className="w-full h-64 object-cover rounded-xl border-2 border-slate-700"
              />
              <button
                onClick={() => {
                  updateReport({ photo: null, photoPreview: null });
                }}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Take Photo Button */}
              <label className="block">
                <div className="border-2 border-dashed border-slate-600 rounded-2xl p-6 text-center hover:border-slate-500 transition-colors cursor-pointer">
                  <Camera className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-300 font-medium mb-1">Take Photo</p>
                  <p className="text-slate-500 text-sm">Use camera</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          updateReport({
                            photo: file,
                            photoPreview: e.target?.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </label>
              
              {/* Upload Photo Button */}
              <label className="block">
                <div className="border-2 border-dashed border-slate-600 rounded-2xl p-6 text-center hover:border-slate-500 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-300 font-medium mb-1">Upload Photo</p>
                  <p className="text-slate-500 text-sm">From device</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          updateReport({
                            photo: file,
                            photoPreview: e.target?.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Photo Tips */}
      <PhotoTips 
        animalType={report.species === 'DOG' ? 'dog' : report.species === 'CAT' ? 'cat' : 'other'}
        context="found"
      />
      
      {/* Species */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Type of Animal</label>
        <div className="grid grid-cols-5 gap-2">
          {SPECIES_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => updateReport({ species: id as Species })}
              className={`p-3 rounded-xl border-2 transition-all ${
                report.species === id
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-1 ${report.species === id ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className={`text-xs ${report.species === id ? 'text-emerald-400' : 'text-slate-400'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Color/Markings</label>
        <input
          type="text"
          value={report.color}
          onChange={(e) => updateReport({ color: e.target.value })}
          placeholder="e.g., Black, White with spots, Orange tabby"
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>
      
      {/* Size */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Approximate Size</label>
        <div className="grid grid-cols-3 gap-3">
          {SIZE_OPTIONS.map(({ id, label, description }) => (
            <button
              key={id}
              type="button"
              onClick={() => updateReport({ size: id })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${report.size === id
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700 hover:border-slate-600'
                }`}
            >
              <span className={`block font-medium ${report.size === id ? 'text-emerald-400' : 'text-slate-300'}`}>{label}</span>
              <span className="text-sm text-slate-500">{description}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Additional details */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Any other details?</label>
        <textarea
          value={report.description}
          onChange={(e) => updateReport({ description: e.target.value })}
          placeholder="Collar? Tags? Behavior? Direction of travel?"
          rows={3}
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>
      
      <Button
        size="lg"
        className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
        onClick={onNext}
      >
        Continue
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}

function LocationStep({
  report,
  updateReport,
  onNext,
  onBack,
}: {
  report: SightingReport;
  updateReport: (updates: Partial<SightingReport>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const isValid = report.location;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          updateReport({ location: address });
        } catch {
          updateReport({ location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
        }
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out.');
            break;
          default:
            alert('An error occurred while getting your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Where did you see it?</h1>
        <p className="text-slate-400 text-lg">Be as specific as possible</p>
      </div>
      
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Calendar className="w-4 h-4 inline mr-2" />
          Date of Sighting
        </label>
        <input
          type="date"
          value={report.sightingDate}
          onChange={(e) => updateReport({ sightingDate: e.target.value })}
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
      
      {/* Time */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Clock className="w-4 h-4 inline mr-2" />
          Time of Sighting
        </label>
        <input
          type="time"
          value={report.sightingTime}
          onChange={(e) => updateReport({ sightingTime: e.target.value })}
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
      
      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <MapPin className="w-4 h-4 inline mr-2" />
          Location *
        </label>
        <AddressAutocomplete
          value={report.location}
          onChange={(value) => updateReport({ location: value })}
          placeholder="Street address, intersection, or landmark"
          className="text-white placeholder-slate-500"
        />
        <Button 
          variant="outline" 
          className="mt-3 border-slate-600 text-slate-300"
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation}
        >
          <MapPin className="w-4 h-4 mr-2" />
          {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
        </Button>
      </div>
      
      {/* Still There? */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Is the animal still there?</label>
        <div className="grid grid-cols-3 gap-3">
          {[{ value: true, label: 'Yes' }, { value: false, label: 'No' }, { value: null, label: 'Not Sure' }].map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => updateReport({ stillThere: opt.value })}
              className={`py-4 rounded-xl border-2 transition-all ${
                report.stillThere === opt.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Can Stay */}
      {report.stillThere === true && (
        <Card className="bg-emerald-900/30 border-emerald-700/50">
          <CardContent className="p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={report.canStayWithAnimal}
                onChange={(e) => updateReport({ canStayWithAnimal: e.target.checked })}
                className="mt-1 w-5 h-5 rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-medium text-emerald-300">I can stay with the animal</span>
                <p className="text-emerald-200/70 text-sm mt-1">
                  This greatly helps rescuers locate the animal. We&apos;ll keep you updated.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      )}
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 border-slate-600 text-slate-300 py-6"
          onClick={onBack}
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-6"
          onClick={onNext}
          disabled={!isValid}
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ContactStep({
  report,
  updateReport,
  onSubmit,
  onBack,
}: {
  report: SightingReport;
  updateReport: (updates: Partial<SightingReport>) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-50 mb-2">Almost done!</h1>
        <p className="text-amber-200/70 text-lg">Your contact info (optional but helpful)</p>
      </div>
      
      <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4">
        <p className="text-amber-100 text-sm">
          💡 <strong>You can submit anonymously</strong>, but providing contact info helps us follow up if we need more details.
        </p>
      </div>

      {/* Contact Fields */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wide">Contact Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Your Name</label>
          <input
            type="text"
            value={report.reporterName}
            onChange={(e) => updateReport({ reporterName: e.target.value })}
            placeholder="Optional"
            className="w-full px-4 py-3 bg-zinc-800/80 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Phone Number</label>
          <input
            type="tel"
            value={report.reporterPhone}
            onChange={(e) => updateReport({ reporterPhone: e.target.value })}
            placeholder="Optional - for follow-up only"
            className="w-full px-4 py-3 bg-zinc-800/80 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
          <input
            type="email"
            value={report.reporterEmail}
            onChange={(e) => updateReport({ reporterEmail: e.target.value })}
            placeholder="Optional"
            className="w-full px-4 py-3 bg-zinc-800/80 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Law Trigger Checkboxes */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
        <LawTriggerCheckboxes
          selectedTriggers={report.lawTriggers}
          onChange={(triggers) => updateReport({ lawTriggers: triggers })}
        />
      </div>
      
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800 py-6"
          onClick={onBack}
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-6"
          onClick={onSubmit}
        >
          Submit Sighting
        </Button>
      </div>
    </div>
  );
}
