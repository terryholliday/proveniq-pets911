import Link from 'next/link';
import { Phone, ArrowLeft, AlertTriangle, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EMERGENCY_CONTACTS = {
  'GENERAL': {
    title: 'Emergency Services',
    description: 'For life-threatening emergencies',
    phone: '911',
    available: '24/7',
  },
  'ANIMAL_CONTROL': {
    title: 'Animal Control',
    description: 'For dangerous or injured animals',
    phone: '1-800-Call-WVVA',
    available: '24/7',
  },
  'POISON_CONTROL': {
    title: 'Animal Poison Control',
    description: 'For suspected poisonings',
    phone: '1-888-426-4435',
    available: '24/7',
  },
};

const WV_EMERGENCY_VETS = [
  {
    name: 'VCA Animal Emergency Center',
    address: '1000 Veterinary Dr, South Charleston, WV 25309',
    phone: '304-746-4111',
    hours: '24/7 Emergency',
    counties: ['Kanawha', 'Putnam', 'Cabell'],
  },
  {
    name: 'Pet Emergency Clinic',
    address: '1 Professional Pl, South Charleston, WV 25309',
    phone: '304-925-1111',
    hours: '24/7 Emergency',
    counties: ['Kanawha', 'Boone', 'Lincoln'],
  },
  {
    name: 'Greenbrier Veterinary Emergency',
    address: '299 W Main St, Lewisburg, WV 24901',
    phone: '304-645-1335',
    hours: '24/7 Emergency',
    counties: ['Greenbrier', 'Monroe', 'Pocahontas'],
  },
];

export default function EmergencyContactsPage() {
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
            <Link
              href="/resources"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              ← Back to Resources
            </Link>
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

          {/* Emergency Vets by County */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">24/7 Emergency Veterinary Clinics</h2>
            <div className="grid md:grid-cols-1 gap-4">
              {WV_EMERGENCY_VETS.map((vet, index) => (
                <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{vet.name}</h3>
                      <div className="flex items-center gap-1 text-slate-300 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{vet.address}</span>
                      </div>
                      <p className="text-slate-400 mb-2">Serves: {vet.counties.join(', ')} counties</p>
                      <div className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{vet.hours}</span>
                      </div>
                    </div>
                    <a
                      href={`tel:${vet.phone}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Call Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
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
