'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { Phone, AlertTriangle, Clock, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CountySelectorCompact } from '@/components/county/county-selector';
import { useCountyPack, useSelectedCounty } from '@/lib/hooks/use-county-pack';
import type { EmergencyContact } from '@/lib/types';

const EMERGENCY_CONTACTS = {
  'GENERAL': {
    title: 'Emergency Services',
    description: 'For life-threatening emergencies',
    phone: '911',
    available: '24/7',
  },
  'POISON_CONTROL': {
    title: 'Animal Poison Control',
    description: 'For suspected poisonings',
    phone: '1-888-426-4435',
    available: '24/7',
  },
};

export default function EmergencyContactsPage() {
  const [selectedCounty, setSelectedCounty] = useSelectedCounty();
  const { erVets, animalControl, isLoading, error, refresh, pack } = useCountyPack(selectedCounty);

  useEffect(() => {
    if (!selectedCounty) return;
    if (typeof navigator === 'undefined' || !navigator.onLine) return;

    if (!pack && !isLoading && !error) {
      refresh();
    }
  }, [selectedCounty, pack, isLoading, error, refresh]);

  const localERVets = useMemo(() => erVets.filter((c) => c.accepts_emergency), [erVets]);
  const localACO = useMemo(() => animalControl.filter((c) => c.accepts_emergency), [animalControl]);

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <span className="font-bold text-white">Emergency Contacts</span>
            </div>
            <div className="flex items-center gap-3">
              <CountySelectorCompact onSelect={setSelectedCounty} />
              <Link
                href="/resources"
                className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                ← Back to Resources
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Critical Alert */}
          <Alert className="mb-8 border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">
              <strong>If this is a life-threatening emergency, call 911 immediately.</strong>
            </AlertDescription>
          </Alert>

          {/* General Emergency Contacts */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Emergency Services</h2>
            <div className="grid md:grid-cols-1 gap-4">
              {Object.entries(EMERGENCY_CONTACTS).map(([key, contact]) => (
                <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{contact.title}</h3>
                      <p className="text-slate-400 mb-3">{contact.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-4 h-4" />
                          {contact.available}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      {contact.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Local Contacts */}
          <div className="mb-12">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Local Emergency Contacts</h2>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800"
                onClick={() => refresh()}
                disabled={!selectedCounty || isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {!selectedCounty ? (
              <Alert className="border-slate-600 bg-slate-800/50">
                <MapPin className="h-4 w-4 text-slate-300" />
                <AlertDescription className="text-slate-300">
                  Select your county to see emergency vets and animal control near you.
                </AlertDescription>
              </Alert>
            ) : error ? (
              <Alert className="border-amber-500 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-200">
                  {error}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Emergency Veterinary Clinics</h3>
                  {localERVets.length === 0 ? (
                    <p className="text-slate-400">No emergency vet contacts are cached for this county yet.</p>
                  ) : (
                    <div className="grid md:grid-cols-1 gap-4">
                      {localERVets.map((contact) => (
                        <EmergencyContactCard key={contact.id} contact={contact} ctaLabel="Call Vet" />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Animal Control</h3>
                  {localACO.length === 0 ? (
                    <p className="text-slate-400">No animal control contacts are cached for this county yet.</p>
                  ) : (
                    <div className="grid md:grid-cols-1 gap-4">
                      {localACO.map((contact) => (
                        <EmergencyContactCard key={contact.id} contact={contact} ctaLabel="Call" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional Resources */}
          <div className="mt-12 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">What to Do in an Emergency</h3>
            <ul className="space-y-2 text-slate-300">
              <li>• Stay calm and keep the animal safe from further harm</li>
              <li>• Call ahead to let the emergency clinic know you're coming</li>
              <li>• If possible, have someone help with transport</li>
              <li>• Bring any relevant medical records or medications</li>
              <li>• Keep your pet secure in a carrier or on a leash</li>
            </ul>
          </div>

          {/* Back to Resources */}
          <div className="mt-8 text-center">
            <Link href="/resources">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                ← Back to All Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function EmergencyContactCard({ contact, ctaLabel }: { contact: EmergencyContact; ctaLabel: string }) {
  const address = contact.address;
  const hoursLine = contact.is_24_hour ? '24/7' : null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{contact.name}</h3>
          {address && (
            <div className="flex items-center gap-1 text-slate-300 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{address}</span>
            </div>
          )}
          <div className="flex items-center gap-4 text-sm">
            {hoursLine && (
              <div className="flex items-center gap-1 text-slate-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{hoursLine}</span>
              </div>
            )}
          </div>
        </div>

        <a
          href={`tel:${contact.phone_primary}`}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          <Phone className="w-5 h-5" />
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
