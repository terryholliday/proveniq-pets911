'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Phone, Heart, Car, Clock, AlertTriangle, Users, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { County, Species, VolunteerCapability } from '@/lib/types';

export default function HelperSignupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
    email: '',
    primary_county: '' as County | '',
    address_city: '',
    address_zip: '',
    
    capabilities: [] as VolunteerCapability[],
    max_response_radius_miles: 10,
    
    has_vehicle: false,
    vehicle_type: '',
    can_transport_crate: false,
    max_animal_size: '' as 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE' | '',
    
    can_foster_species: [] as Species[],
    max_foster_count: 1,
    has_fenced_yard: false,
    has_other_pets: false,
    other_pets_description: '',
    
    available_weekdays: false,
    available_weekends: false,
    available_nights: false,
    available_immediately: false,
    
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const getCapabilityIcon = (value: string) => {
    switch (value) {
      case 'TRANSPORT': return Car;
      case 'FOSTER_SHORT_TERM':
      case 'FOSTER_LONG_TERM': return Heart;
      case 'EMERGENCY_RESPONSE': return AlertTriangle;
      case 'VET_TRANSPORT':
      case 'SHELTER_TRANSPORT': return Car;
      case 'MODERATOR': return Shield;
      case 'SYSOP': return Settings;
      default: return Users;
    }
  };

  const CAPABILITY_OPTIONS: Array<{ value: VolunteerCapability; label: string; description: string }> = [
    {
      value: 'TRANSPORT',
      label: 'Animal Transport',
      description: 'Transport animals to and from shelters, vet clinics, and foster homes',
    },
    {
      value: 'FOSTER_SHORT_TERM',
      label: 'Short-Term Fostering',
      description: 'Provide temporary care for animals in need',
    },
    {
      value: 'FOSTER_LONG_TERM',
      label: 'Long-Term Fostering',
      description: 'Provide extended care for animals in need',
    },
    {
      value: 'EMERGENCY_RESPONSE',
      label: 'Emergency Response',
      description: 'Respond to emergency situations, such as natural disasters or animal cruelty cases',
    },
    {
      value: 'VET_TRANSPORT',
      label: 'Vet Transport',
      description: 'Transport animals to and from vet clinics',
    },
    {
      value: 'SHELTER_TRANSPORT',
      label: 'Shelter Transport',
      description: 'Transport animals to and from shelters',
    },
    {
      value: 'MODERATOR',
      label: 'Moderator',
      description: 'Help moderate online communities and forums',
    },
    {
      value: 'SYSOP',
      label: 'SysOp',
      description: 'Help manage and maintain our systems and infrastructure',
    },
  ];

  const handleCapabilityToggle = (capability: VolunteerCapability) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability]
    }));
  };

  const handleSpeciesToggle = (species: Species) => {
    setFormData(prev => ({
      ...prev,
      can_foster_species: prev.can_foster_species.includes(species)
        ? prev.can_foster_species.filter(s => s !== species)
        : [...prev.can_foster_species, species]
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be signed in to register as a helper');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/volunteers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Registration failed');
      }

      router.push('/helpers/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to register as an emergency helper.
            </AlertDescription>
          </Alert>
          <Link href={'/login?redirectTo=' + encodeURIComponent('/helpers/join')} className="mt-4 block">
            <Button className="w-full">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto pt-8 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join the Emergency Helper Network</h1>
          <p className="text-slate-300">Help save lives by providing transport, foster care, or emergency response</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {s}
                </div>
                {s < 4 && <div className={`w-12 h-1 ${step > s ? 'bg-blue-600' : 'bg-slate-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Primary County *</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={formData.primary_county}
                  onChange={(e) => setFormData({ ...formData, primary_county: e.target.value as County })}
                  required
                >
                  <option value="">Select County</option>
                  <option value="GREENBRIER">Greenbrier</option>
                  <option value="KANAWHA">Kanawha</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    value={formData.address_city}
                    onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    value={formData.address_zip}
                    onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => setStep(2)}
                disabled={!formData.display_name || !formData.phone || !formData.primary_county || !formData.address_city || !formData.address_zip}
              >
                Next: Capabilities
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                How Can You Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-3">Select all that apply:</p>
                <div className="space-y-2">
                  {[
                    {
                      value: 'TRANSPORT',
                      label: 'Animal Transport',
                      description: 'Transport pets from shelters to fosters/adopters',
                    },
                    {
                      value: 'FOSTER_SHORT_TERM',
                      label: 'Emergency Foster (24-72 hours)',
                      description: 'Short-term emergency fostering for urgent cases',
                    },
                    {
                      value: 'FOSTER_LONG_TERM',
                      label: 'Long-term Foster',
                      description: 'Extended foster care until adoption',
                    },
                    {
                      value: 'EMERGENCY_RESPONSE',
                      label: 'Emergency Response',
                      description: 'Respond to T1/T2 emergency alerts',
                    },
                    {
                      value: 'VET_TRANSPORT',
                      label: 'Veterinary Transport',
                      description: 'Transport pets to/from veterinary appointments',
                    },
                    {
                      value: 'SHELTER_TRANSPORT',
                      label: 'Shelter Transport',
                      description: 'Transport pets between shelters/rescues',
                    },
                    {
                      value: 'MODERATOR',
                      label: 'Moderator',
                      description: 'Review cases, verify matches, coordinate volunteers',
                    },
                    {
                      value: 'SYSOP',
                      label: 'System Operator (SYSOP)',
                      description: 'System administrator: superuser access (approval required)',
                    },
                  ].map(({ value, label, description }) => {
                    const Icon = getCapabilityIcon(value);
                    return (
                      <label key={value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={formData.capabilities.includes(value as VolunteerCapability)}
                          onChange={() => handleCapabilityToggle(value as VolunteerCapability)}
                          className="w-4 h-4"
                        />
                        <Icon className="h-5 w-5 text-slate-600" />
                        <div>
                          <span className="font-medium">{label}</span>
                          <p className="text-sm text-slate-500">{description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Response Distance (miles)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={formData.max_response_radius_miles}
                  onChange={(e) => setFormData({ ...formData, max_response_radius_miles: parseInt(e.target.value) })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                className="flex-1"
                disabled={formData.capabilities.length === 0}
              >
                Next: Details
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Transport & Foster Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.capabilities.some(c => c.includes('TRANSPORT')) && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold">Transport Capabilities</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.has_vehicle}
                      onChange={(e) => setFormData({ ...formData, has_vehicle: e.target.checked })}
                    />
                    I have a vehicle available
                  </label>
                  {formData.has_vehicle && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                        <select
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          value={formData.vehicle_type}
                          onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                        >
                          <option value="">Select type</option>
                          <option value="sedan">Sedan</option>
                          <option value="suv">SUV</option>
                          <option value="truck">Truck</option>
                          <option value="van">Van</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.can_transport_crate}
                          onChange={(e) => setFormData({ ...formData, can_transport_crate: e.target.checked })}
                        />
                        Can transport crate/carrier
                      </label>
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Animal Size</label>
                        <select
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          value={formData.max_animal_size}
                          onChange={(e) => setFormData({ ...formData, max_animal_size: e.target.value as any })}
                        >
                          <option value="">Select size</option>
                          <option value="SMALL">Small (under 20 lbs)</option>
                          <option value="MEDIUM">Medium (20-50 lbs)</option>
                          <option value="LARGE">Large (50-100 lbs)</option>
                          <option value="XLARGE">Extra Large (100+ lbs)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {formData.capabilities.some(c => c.includes('FOSTER')) && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold">Foster Capabilities</h3>
                  <div>
                    <p className="text-sm font-medium mb-2">Can foster species:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['DOG', 'CAT', 'BIRD', 'RABBIT', 'SMALL_MAMMAL'].map((species) => (
                        <label key={species} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.can_foster_species.includes(species as Species)}
                            onChange={() => handleSpeciesToggle(species as Species)}
                          />
                          {species.replace('_', ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max animals at once</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      value={formData.max_foster_count}
                      onChange={(e) => setFormData({ ...formData, max_foster_count: parseInt(e.target.value) })}
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.has_fenced_yard}
                      onChange={(e) => setFormData({ ...formData, has_fenced_yard: e.target.checked })}
                    />
                    I have a fenced yard
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.has_other_pets}
                      onChange={(e) => setFormData({ ...formData, has_other_pets: e.target.checked })}
                    />
                    I have other pets
                  </label>
                  {formData.has_other_pets && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Describe your pets</label>
                      <textarea
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        rows={2}
                        value={formData.other_pets_description}
                        onChange={(e) => setFormData({ ...formData, other_pets_description: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Next: Availability
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Availability & Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-3">When are you typically available?</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.available_weekdays}
                      onChange={(e) => setFormData({ ...formData, available_weekdays: e.target.checked })}
                    />
                    Weekdays (Mon-Fri)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.available_weekends}
                      onChange={(e) => setFormData({ ...formData, available_weekends: e.target.checked })}
                    />
                    Weekends (Sat-Sun)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.available_nights}
                      onChange={(e) => setFormData({ ...formData, available_nights: e.target.checked })}
                    />
                    Nights (after 6pm)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.available_immediately}
                      onChange={(e) => setFormData({ ...formData, available_immediately: e.target.checked })}
                    />
                    Can respond within 30 minutes
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Emergency Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Name *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Background checks and reference verification will be completed after registration.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={isSubmitting || !formData.emergency_contact_name || !formData.emergency_contact_phone}
              >
                {isSubmitting ? 'Registering...' : 'Complete Registration'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
