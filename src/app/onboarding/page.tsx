'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MapPin, Phone, ChevronRight, ChevronLeft, Check, Plus, Trash2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { County } from '@/lib/types';

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  county: County | '';
  addresses: Address[];
  completedOnboarding: boolean;
  createdAt: string;
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isCurrent: boolean;
  movedIn?: string;
  movedOut?: string;
}

const COUNTIES: { id: County; name: string }[] = [
  { id: 'GREENBRIER', name: 'Greenbrier County' },
  { id: 'KANAWHA', name: 'Kanawha County' },
];

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'profile', title: 'Your Info' },
  { id: 'address', title: 'Address History' },
  { id: 'complete', title: 'All Set' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phone: '',
    email: '',
    county: '',
    addresses: [],
    completedOnboarding: false,
    createdAt: new Date().toISOString(),
  });

  // Check if already onboarded
  useEffect(() => {
    const saved = localStorage.getItem('proveniq_user_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.completedOnboarding) {
        router.push('/');
      }
    }
  }, [router]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const finalProfile = {
      ...profile,
      completedOnboarding: true,
    };
    localStorage.setItem('proveniq_user_profile', JSON.stringify(finalProfile));
    router.push('/');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const addAddress = () => {
    const newAddress: Address = {
      id: crypto.randomUUID(),
      street: '',
      city: '',
      state: 'WV',
      zip: '',
      isCurrent: profile.addresses.length === 0,
    };
    updateProfile({ addresses: [...profile.addresses, newAddress] });
  };

  const updateAddress = (id: string, updates: Partial<Address>) => {
    const updated = profile.addresses.map(addr =>
      addr.id === id ? { ...addr, ...updates } : addr
    );
    // If setting as current, unset others
    if (updates.isCurrent) {
      updated.forEach(addr => {
        if (addr.id !== id) addr.isCurrent = false;
      });
    }
    updateProfile({ addresses: updated });
  };

  const removeAddress = (id: string) => {
    updateProfile({ 
      addresses: profile.addresses.filter(addr => addr.id !== id) 
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-500"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="pt-8 pb-4 px-4">
        <div className="max-w-lg mx-auto flex justify-center gap-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-all ${
                index <= currentStep ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pb-8">
        {currentStep === 0 && (
          <WelcomeStep onNext={handleNext} />
        )}
        {currentStep === 1 && (
          <ProfileStep 
            profile={profile} 
            updateProfile={updateProfile}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 2 && (
          <AddressStep
            addresses={profile.addresses}
            addAddress={addAddress}
            updateAddress={updateAddress}
            removeAddress={removeAddress}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <CompleteStep 
            profile={profile}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )}
      </div>
    </main>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center pt-12 animate-fade-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center">
        <Heart className="w-10 h-10 text-white" />
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-3">
        Welcome to PetNexus Pet911
      </h1>
      <p className="text-blue-100 text-lg mb-2">
        West Virginia Pilot Program
      </p>
      <p className="text-blue-200 mb-8 max-w-sm mx-auto">
        Help reunite lost pets with their families. Let&apos;s get you set up in just a few steps.
      </p>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3 text-left bg-white/10 backdrop-blur rounded-xl p-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-white">Local Emergency Resources</p>
            <p className="text-sm text-blue-200">Access vets & animal control in your county</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-left bg-white/10 backdrop-blur rounded-xl p-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-white">Works Offline</p>
            <p className="text-sm text-blue-200">Critical info cached for emergencies</p>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold"
        onClick={onNext}
      >
        Get Started
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
      
      <p className="text-xs text-blue-200 mt-4">
        Takes less than 2 minutes
      </p>
    </div>
  );
}

function ProfileStep({ 
  profile, 
  updateProfile,
  onNext,
  onBack 
}: { 
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = profile.name.trim() && profile.phone.trim() && profile.county;

  return (
    <div className="pt-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-2">Your Information</h2>
      <p className="text-blue-200 mb-6">
        This helps us contact you if your pet is found
      </p>

      <Card className="bg-white/95 backdrop-blur">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => updateProfile({ phone: e.target.value })}
              placeholder="(304) 555-0123"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => updateProfile({ email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your County *
            </label>
            <select
              value={profile.county}
              onChange={(e) => updateProfile({ county: e.target.value as County })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
            >
              <option value="" disabled>Select your county</option>
              {COUNTIES.map((county) => (
                <option key={county.id} value={county.id}>
                  {county.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={onBack}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
          onClick={onNext}
          disabled={!isValid}
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function AddressStep({
  addresses,
  addAddress,
  updateAddress,
  removeAddress,
  onNext,
  onBack,
}: {
  addresses: Address[];
  addAddress: () => void;
  updateAddress: (id: string, updates: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="pt-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-2">Address History</h2>
      <p className="text-blue-200 mb-6">
        If you&apos;ve moved recently, add your previous address too. Pets often return to old homes.
      </p>

      <div className="space-y-4 mb-6">
        {addresses.map((address, index) => (
          <Card key={address.id} className="bg-white/95 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">
                    {address.isCurrent ? 'Current Address' : `Previous Address ${index}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!address.isCurrent && (
                    <button
                      onClick={() => updateAddress(address.id, { isCurrent: true })}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Set as current
                    </button>
                  )}
                  <button
                    onClick={() => removeAddress(address.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => updateAddress(address.id, { street: e.target.value })}
                  placeholder="Street address"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => updateAddress(address.id, { city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                  />
                  <input
                    type="text"
                    value={address.zip}
                    onChange={(e) => updateAddress(address.id, { zip: e.target.value })}
                    placeholder="ZIP code"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                
                {!address.isCurrent && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Moved in</label>
                      <input
                        type="month"
                        value={address.movedIn || ''}
                        onChange={(e) => updateAddress(address.id, { movedIn: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Moved out</label>
                      <input
                        type="month"
                        value={address.movedOut || ''}
                        onChange={(e) => updateAddress(address.id, { movedOut: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <button
          onClick={addAddress}
          className="w-full p-4 rounded-xl border-2 border-dashed border-white/30 text-white/80 hover:bg-white/10 hover:border-white/50 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {addresses.length === 0 ? 'Add Your Current Address' : 'Add Another Address'}
        </button>
      </div>

      <p className="text-xs text-blue-200 mb-6 text-center">
        Address history helps find pets that may have returned to a previous home
      </p>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={onBack}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
          onClick={onNext}
        >
          {addresses.length === 0 ? 'Skip for Now' : 'Continue'}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({ 
  profile,
  onComplete,
  onBack 
}: { 
  profile: UserProfile;
  onComplete: () => void;
  onBack: () => void;
}) {
  const countyName = COUNTIES.find(c => c.id === profile.county)?.name || profile.county;
  
  return (
    <div className="pt-12 text-center animate-fade-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">You&apos;re All Set!</h2>
      <p className="text-blue-200 mb-8">
        Your profile is ready. Here&apos;s a summary:
      </p>

      <Card className="bg-white/95 backdrop-blur text-left mb-8">
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
            <p className="font-medium text-gray-900">{profile.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
            <p className="font-medium text-gray-900">{profile.phone}</p>
          </div>
          {profile.email && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
              <p className="font-medium text-gray-900">{profile.email}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">County</p>
            <p className="font-medium text-gray-900">{countyName}</p>
          </div>
          {profile.addresses.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Addresses</p>
              <p className="font-medium text-gray-900">{profile.addresses.length} saved</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={onBack}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
          onClick={onComplete}
        >
          Start Using App
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
