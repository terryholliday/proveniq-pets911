'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  MapPin,
  Calendar,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Camera,
  Sparkles,
  Heart,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PhotoTips } from '@/components/shared/photo-tips';

type Species = 'DOG' | 'CAT' | 'BIRD' | 'OTHER';
type Size = 'SMALL' | 'MEDIUM' | 'LARGE';

interface PetReport {
  name: string;
  species: Species | '';
  breed: string;
  color: string;
  size: Size | '';
  lastSeenDate: string;
  lastSeenTime: string;
  lastSeenLocation: string;
  description: string;
  distinctiveFeatures: string;
  isChipped: boolean | null;
  collarDescription: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

const STEPS = [
  { id: 'pet', title: 'Pet Details' },
  { id: 'location', title: 'Last Seen' },
  { id: 'contact', title: 'Your Info' },
  { id: 'review', title: 'Review' },
];

const SPECIES_OPTIONS = [
  { id: 'DOG', label: 'Dog', icon: Dog },
  { id: 'CAT', label: 'Cat', icon: Cat },
  { id: 'BIRD', label: 'Bird', icon: Bird },
  { id: 'OTHER', label: 'Other', icon: Rabbit },
];

const SIZE_OPTIONS = [
  { id: 'SMALL', label: 'Small', description: 'Under 20 lbs' },
  { id: 'MEDIUM', label: 'Medium', description: '20-50 lbs' },
  { id: 'LARGE', label: 'Large', description: 'Over 50 lbs' },
];

export default function ReportMissingPet() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSupportCompanion, setShowSupportCompanion] = useState(false);
  const [report, setReport] = useState<PetReport>({
    name: '',
    species: '',
    breed: '',
    color: '',
    size: '',
    lastSeenDate: new Date().toISOString().split('T')[0],
    lastSeenTime: '',
    lastSeenLocation: '',
    description: '',
    distinctiveFeatures: '',
    isChipped: null,
    collarDescription: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
  });

  const updateReport = (updates: Partial<PetReport>) => {
    setReport(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
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

  const handleSubmit = () => {
    // In production, this would submit to the API
    console.log('Submitting report:', report);
    router.push('/missing/report/success');
  };

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/missing" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <span className="text-sm text-slate-400">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>

          {/* Progress */}
          <div className="flex gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-1 rounded-full transition-colors ${index <= currentStep ? 'bg-blue-500' : 'bg-slate-700'
                  }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {currentStep === 0 && (
          <PetDetailsStep report={report} updateReport={updateReport} onNext={handleNext} />
        )}
        {currentStep === 1 && (
          <LocationStep report={report} updateReport={updateReport} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === 2 && (
          <ContactStep report={report} updateReport={updateReport} onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === 3 && (
          <ReviewStep report={report} onSubmit={handleSubmit} onBack={handleBack} />
        )}
      </div>

      {/* Support Companion Widget */}
      <SupportCompanionWidget
        isOpen={showSupportCompanion}
        onToggle={() => setShowSupportCompanion(!showSupportCompanion)}
        petName={report.name}
      />
    </main>
  );
}

function PetDetailsStep({
  report,
  updateReport,
  onNext
}: {
  report: PetReport;
  updateReport: (updates: Partial<PetReport>) => void;
  onNext: () => void;
}) {
  const isValid = report.name && report.species && report.color;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Tell us about your pet</h1>
        <p className="text-slate-400 text-lg">The more details, the better chance of finding them</p>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Photo</label>
        <div className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center hover:border-slate-500 transition-colors cursor-pointer">
          <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">Upload a photo</p>
          <p className="text-slate-500 text-sm">Clear, recent photos help the most</p>
        </div>
      </div>

      {/* Photo Tips */}
      <PhotoTips 
        animalType={report.species === 'DOG' ? 'dog' : report.species === 'CAT' ? 'cat' : 'other'}
        context="missing"
      />

      {/* Pet Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Pet&apos;s Name *</label>
        <input
          type="text"
          value={report.name}
          onChange={(e) => updateReport({ name: e.target.value })}
          placeholder="What's your pet's name?"
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Species */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Species *</label>
        <div className="grid grid-cols-4 gap-3">
          {SPECIES_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => updateReport({ species: id as Species })}
              className={`p-4 rounded-xl border-2 transition-all ${report.species === id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600'
                }`}
            >
              <Icon className={`w-8 h-8 mx-auto mb-2 ${report.species === id ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className={`text-sm ${report.species === id ? 'text-blue-400' : 'text-slate-400'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Breed */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Breed</label>
        <input
          type="text"
          value={report.breed}
          onChange={(e) => updateReport({ breed: e.target.value })}
          placeholder="e.g., Golden Retriever, Tabby, Parakeet"
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Color/Markings *</label>
        <input
          type="text"
          value={report.color}
          onChange={(e) => updateReport({ color: e.target.value })}
          placeholder="e.g., Black with white chest, Orange tabby"
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Size */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Size</label>
        <div className="grid grid-cols-3 gap-3">
          {SIZE_OPTIONS.map(({ id, label, description }) => (
            <button
              key={id}
              onClick={() => updateReport({ size: id as Size })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${report.size === id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600'
                }`}
            >
              <span className={`block font-medium ${report.size === id ? 'text-blue-400' : 'text-slate-300'}`}>{label}</span>
              <span className="text-sm text-slate-500">{description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Distinctive Features */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Distinctive Features</label>
        <textarea
          value={report.distinctiveFeatures}
          onChange={(e) => updateReport({ distinctiveFeatures: e.target.value })}
          placeholder="Any unique markings, scars, or identifying features?"
          rows={3}
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Microchip & Collar */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Microchipped?</label>
          <div className="flex gap-2">
            {[{ value: true, label: 'Yes' }, { value: false, label: 'No' }, { value: null, label: 'Unknown' }].map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => updateReport({ isChipped: opt.value })}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${report.isChipped === opt.value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Collar Description</label>
          <input
            type="text"
            value={report.collarDescription}
            onChange={(e) => updateReport({ collarDescription: e.target.value })}
            placeholder="Color, tags, etc."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
        onClick={onNext}
        disabled={!isValid}
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
  report: PetReport;
  updateReport: (updates: Partial<PetReport>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = report.lastSeenLocation && report.lastSeenDate;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Where was {report.name || 'your pet'} last seen?</h1>
        <p className="text-slate-400 text-lg">This helps us focus the search area</p>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Calendar className="w-4 h-4 inline mr-2" />
          Date Last Seen *
        </label>
        <input
          type="date"
          value={report.lastSeenDate}
          onChange={(e) => updateReport({ lastSeenDate: e.target.value })}
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Time */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Approximate Time</label>
        <input
          type="time"
          value={report.lastSeenTime}
          onChange={(e) => updateReport({ lastSeenTime: e.target.value })}
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <MapPin className="w-4 h-4 inline mr-2" />
          Location *
        </label>
        <input
          type="text"
          value={report.lastSeenLocation}
          onChange={(e) => updateReport({ lastSeenLocation: e.target.value })}
          placeholder="Street address, intersection, or landmark"
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <Button variant="outline" className="mt-3 border-slate-600 text-slate-300">
          <MapPin className="w-4 h-4 mr-2" />
          Use Current Location
        </Button>
      </div>

      {/* Circumstances */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">What happened?</label>
        <textarea
          value={report.description}
          onChange={(e) => updateReport({ description: e.target.value })}
          placeholder="Describe how your pet went missing (escaped from yard, ran during walk, etc.)"
          rows={4}
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

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
          className="flex-1 bg-blue-600 hover:bg-blue-700 py-6"
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
  onNext,
  onBack,
}: {
  report: PetReport;
  updateReport: (updates: Partial<PetReport>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = report.ownerName && report.ownerPhone;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Your Contact Information</h1>
        <p className="text-slate-400 text-lg">So people can reach you if they find {report.name || 'your pet'}</p>
      </div>

      <Card className="bg-amber-900/30 border-amber-700/50">
        <CardContent className="p-4">
          <p className="text-amber-200 text-sm">
            <strong>Privacy note:</strong> Your contact info will only be shared with verified sighting reporters after moderator review.
          </p>
        </CardContent>
      </Card>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
        <input
          type="text"
          value={report.ownerName}
          onChange={(e) => updateReport({ ownerName: e.target.value })}
          placeholder="Full name"
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number *</label>
        <input
          type="tel"
          value={report.ownerPhone}
          onChange={(e) => updateReport({ ownerPhone: e.target.value })}
          placeholder="(304) 555-0123"
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Email (optional)</label>
        <input
          type="email"
          value={report.ownerEmail}
          onChange={(e) => updateReport({ ownerEmail: e.target.value })}
          placeholder="you@example.com"
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

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
          className="flex-1 bg-blue-600 hover:bg-blue-700 py-6"
          onClick={onNext}
          disabled={!isValid}
        >
          Review
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  report,
  onSubmit,
  onBack,
}: {
  report: PetReport;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Review Your Report</h1>
        <p className="text-slate-400 text-lg">Make sure everything looks correct</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-sm text-slate-400 uppercase tracking-wide mb-2">Pet Information</h3>
            <div className="space-y-2">
              <p className="text-white"><strong>Name:</strong> {report.name}</p>
              <p className="text-white"><strong>Species:</strong> {report.species}</p>
              <p className="text-white"><strong>Breed:</strong> {report.breed || 'Not specified'}</p>
              <p className="text-white"><strong>Color:</strong> {report.color}</p>
              <p className="text-white"><strong>Size:</strong> {report.size || 'Not specified'}</p>
              {report.distinctiveFeatures && <p className="text-white"><strong>Features:</strong> {report.distinctiveFeatures}</p>}
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-sm text-slate-400 uppercase tracking-wide mb-2">Last Seen</h3>
            <div className="space-y-2">
              <p className="text-white"><strong>Date:</strong> {report.lastSeenDate}</p>
              <p className="text-white"><strong>Time:</strong> {report.lastSeenTime || 'Not specified'}</p>
              <p className="text-white"><strong>Location:</strong> {report.lastSeenLocation}</p>
              {report.description && <p className="text-white"><strong>Details:</strong> {report.description}</p>}
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-sm text-slate-400 uppercase tracking-wide mb-2">Contact</h3>
            <div className="space-y-2">
              <p className="text-white"><strong>Name:</strong> {report.ownerName}</p>
              <p className="text-white"><strong>Phone:</strong> {report.ownerPhone}</p>
              {report.ownerEmail && <p className="text-white"><strong>Email:</strong> {report.ownerEmail}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 border-slate-600 text-slate-300 py-6"
          onClick={onBack}
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Edit
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-blue-600 hover:bg-blue-700 py-6"
          onClick={onSubmit}
        >
          Submit Report
        </Button>
      </div>
    </div>
  );
}

function SupportCompanionWidget({
  isOpen,
  onToggle,
  petName
}: {
  isOpen: boolean;
  onToggle: () => void;
  petName: string;
}) {
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={onToggle}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl transition-all z-50 flex items-center justify-center ${isOpen ? 'bg-slate-700' : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-110'
          }`}
      >
        {isOpen ? (
          <span className="text-white text-2xl">×</span>
        ) : (
          <Sparkles className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Support Companion</h3>
                <p className="text-purple-100 text-sm">Empathy Companion</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 h-64 overflow-y-auto">
            <div className="bg-slate-700 rounded-2xl rounded-tl-sm p-4 mb-3">
              <p className="text-slate-200 text-sm leading-relaxed">
                I&apos;m so sorry {petName ? `${petName} is` : 'your pet is'} missing. 💜 This must be incredibly stressful.
              </p>
            </div>
            <div className="bg-slate-700 rounded-2xl rounded-tl-sm p-4 mb-3">
              <p className="text-slate-200 text-sm leading-relaxed">
                I&apos;m here to support you through this. Would you like some search tips, or would you rather just talk?
              </p>
            </div>

            <div className="space-y-2 mt-4">
              <button className="w-full text-left p-3 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-300 text-sm hover:bg-purple-600/30 transition-colors">
                📍 Give me search tips
              </button>
              <button className="w-full text-left p-3 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-300 text-sm hover:bg-purple-600/30 transition-colors">
                💭 I just need to talk
              </button>
              <button className="w-full text-left p-3 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-300 text-sm hover:bg-purple-600/30 transition-colors">
                📞 Connect me to help
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-full text-white text-sm placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <button className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors">
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
