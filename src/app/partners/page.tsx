'use client';

import { useState } from 'react';
import Link from 'next/link';

const WV_COUNTIES = [
  'Barbour', 'Berkeley', 'Boone', 'Braxton', 'Brooke', 'Cabell', 'Calhoun', 'Clay',
  'Doddridge', 'Fayette', 'Gilmer', 'Grant', 'Greenbrier', 'Hampshire', 'Hancock',
  'Hardy', 'Harrison', 'Jackson', 'Jefferson', 'Kanawha', 'Lewis', 'Lincoln', 'Logan',
  'Marion', 'Marshall', 'Mason', 'McDowell', 'Mercer', 'Mineral', 'Mingo', 'Monongalia',
  'Monroe', 'Morgan', 'Nicholas', 'Ohio', 'Pendleton', 'Pleasants', 'Pocahontas',
  'Preston', 'Putnam', 'Raleigh', 'Randolph', 'Ritchie', 'Roane', 'Summers', 'Taylor',
  'Tucker', 'Tyler', 'Upshur', 'Wayne', 'Webster', 'Wetzel', 'Wirt', 'Wood', 'Wyoming'
];

type OrgType = 'shelter' | 'rescue' | 'humane_society' | 'veterinary' | 'transport' | 'foster_network' | 'other';

interface PartnerApplication {
  organizationName: string;
  organizationType: OrgType;
  county: string;
  address: string;
  city: string;
  zipCode: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  ein: string;
  yearEstablished: string;
  annualIntake: string;
  services: string[];
  hasPhysicalLocation: boolean;
  operatingHours: string;
  staffCount: string;
  volunteerCount: string;
  currentChallenges: string;
  partnershipGoals: string;
  howDidYouHear: string;
}

const SERVICES = [
  { id: 'intake', label: 'Stray Intake' },
  { id: 'adoption', label: 'Adoptions' },
  { id: 'foster', label: 'Foster Program' },
  { id: 'spay_neuter', label: 'Spay/Neuter Services' },
  { id: 'microchip', label: 'Microchipping' },
  { id: 'vaccination', label: 'Vaccinations' },
  { id: 'emergency', label: 'Emergency Care' },
  { id: 'transport', label: 'Animal Transport' },
  { id: 'tnr', label: 'TNR (Trap-Neuter-Return)' },
  { id: 'behavior', label: 'Behavioral Training' },
  { id: 'cruelty', label: 'Cruelty Investigations' },
  { id: 'education', label: 'Community Education' },
];

export default function PartnersPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<PartnerApplication>({
    organizationName: '',
    organizationType: 'shelter',
    county: '',
    address: '',
    city: '',
    zipCode: '',
    contactName: '',
    contactTitle: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    ein: '',
    yearEstablished: '',
    annualIntake: '',
    services: [],
    hasPhysicalLocation: true,
    operatingHours: '',
    staffCount: '',
    volunteerCount: '',
    currentChallenges: '',
    partnershipGoals: '',
    howDidYouHear: '',
  });

  const handleServiceToggle = (serviceId: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-4">Application Received!</h1>
          <p className="text-zinc-400 mb-6">
            Thank you for your interest in partnering with Pet911. Our team will review your
            application and contact you within 5-7 business days.
          </p>
          <p className="text-sm text-zinc-500 mb-8">
            A confirmation email has been sent to <strong className="text-zinc-300">{form.contactEmail}</strong>
          </p>
          <Link href="/" className="text-amber-500 hover:underline">
            ← Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-900/20 to-transparent border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link href="/" className="text-amber-500 text-sm hover:underline">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4">Partner With Pet911</h1>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Join West Virginia&apos;s first unified animal emergency response network. 
            Together, we can save more lives and reunite more families.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-4">Why Partner With Us?</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl mb-2">📡</div>
            <div className="font-medium text-sm">Real-Time Alerts</div>
            <div className="text-xs text-zinc-500 mt-1">
              Receive instant notifications for strays in your service area
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl mb-2">🤝</div>
            <div className="font-medium text-sm">Network Access</div>
            <div className="text-xs text-zinc-500 mt-1">
              Connect with verified volunteers, transporters, and fosters
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-sm">Impact Dashboard</div>
            <div className="text-xs text-zinc-500 mt-1">
              Track outcomes and demonstrate your community impact
            </div>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Organization Info */}
          <section>
            <h3 className="text-lg font-semibold border-b border-zinc-800 pb-2 mb-4">Organization Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={form.organizationName}
                  onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                  placeholder="e.g. Greenbrier Humane Society"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Organization Type *</label>
                <select
                  required
                  value={form.organizationType}
                  onChange={(e) => setForm({ ...form, organizationType: e.target.value as OrgType })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                >
                  <option value="shelter">Animal Shelter</option>
                  <option value="rescue">Rescue Organization</option>
                  <option value="humane_society">Humane Society</option>
                  <option value="veterinary">Veterinary Clinic</option>
                  <option value="transport">Transport Network</option>
                  <option value="foster_network">Foster Network</option>
                  <option value="other">Other Non-Profit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Primary County *</label>
                <select
                  required
                  value={form.county}
                  onChange={(e) => setForm({ ...form, county: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                >
                  <option value="">-- Select County --</option>
                  {WV_COUNTIES.map(county => (
                    <option key={county} value={county}>{county} County</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">Street Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Main Street"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Lewisburg"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={form.zipCode}
                  onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                  placeholder="24901"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Contact Info */}
          <section>
            <h3 className="text-lg font-semibold border-b border-zinc-800 pb-2 mb-4">Primary Contact</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="Jane Smith"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Title/Role</label>
                <input
                  type="text"
                  value={form.contactTitle}
                  onChange={(e) => setForm({ ...form, contactTitle: e.target.value })}
                  placeholder="Executive Director"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="contact@example.org"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="(304) 555-1234"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://example.org"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">EIN (Tax ID)</label>
                <input
                  type="text"
                  value={form.ein}
                  onChange={(e) => setForm({ ...form, ein: e.target.value })}
                  placeholder="XX-XXXXXXX"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Operations */}
          <section>
            <h3 className="text-lg font-semibold border-b border-zinc-800 pb-2 mb-4">Operations</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Year Established</label>
                <input
                  type="text"
                  value={form.yearEstablished}
                  onChange={(e) => setForm({ ...form, yearEstablished: e.target.value })}
                  placeholder="2010"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Annual Animal Intake (approx)</label>
                <select
                  value={form.annualIntake}
                  onChange={(e) => setForm({ ...form, annualIntake: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  <option value="1-50">1-50 animals</option>
                  <option value="51-200">51-200 animals</option>
                  <option value="201-500">201-500 animals</option>
                  <option value="501-1000">501-1000 animals</option>
                  <option value="1000+">1000+ animals</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Paid Staff</label>
                <select
                  value={form.staffCount}
                  onChange={(e) => setForm({ ...form, staffCount: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  <option value="0">All volunteer</option>
                  <option value="1-5">1-5 staff</option>
                  <option value="6-15">6-15 staff</option>
                  <option value="16-30">16-30 staff</option>
                  <option value="30+">30+ staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Active Volunteers</label>
                <select
                  value={form.volunteerCount}
                  onChange={(e) => setForm({ ...form, volunteerCount: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  <option value="1-10">1-10 volunteers</option>
                  <option value="11-30">11-30 volunteers</option>
                  <option value="31-75">31-75 volunteers</option>
                  <option value="75+">75+ volunteers</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={form.operatingHours}
                  onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
                  placeholder="Mon-Sat 10am-5pm, Sun by appointment"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={form.hasPhysicalLocation}
                    onChange={(e) => setForm({ ...form, hasPhysicalLocation: e.target.checked })}
                    className="rounded"
                  />
                  We have a physical facility open to the public
                </label>
              </div>
            </div>
          </section>

          {/* Services */}
          <section>
            <h3 className="text-lg font-semibold border-b border-zinc-800 pb-2 mb-4">Services Offered</h3>
            <p className="text-sm text-zinc-500 mb-4">Select all that apply:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SERVICES.map(service => (
                <label key={service.id} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.services.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="rounded"
                  />
                  {service.label}
                </label>
              ))}
            </div>
          </section>

          {/* Goals */}
          <section>
            <h3 className="text-lg font-semibold border-b border-zinc-800 pb-2 mb-4">Partnership Goals</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  What are your organization&apos;s current challenges?
                </label>
                <textarea
                  value={form.currentChallenges}
                  onChange={(e) => setForm({ ...form, currentChallenges: e.target.value })}
                  rows={3}
                  placeholder="e.g. Limited capacity, transport needs, volunteer recruitment..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  What do you hope to achieve through this partnership? *
                </label>
                <textarea
                  required
                  value={form.partnershipGoals}
                  onChange={(e) => setForm({ ...form, partnershipGoals: e.target.value })}
                  rows={3}
                  placeholder="e.g. Faster stray intake, better community engagement, access to transport network..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">How did you hear about Pet911?</label>
                <select
                  value={form.howDidYouHear}
                  onChange={(e) => setForm({ ...form, howDidYouHear: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  <option value="social_media">Social Media</option>
                  <option value="another_org">Another Organization</option>
                  <option value="news">News/Press</option>
                  <option value="conference">Conference/Event</option>
                  <option value="search">Web Search</option>
                  <option value="referral">Personal Referral</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="border-t border-zinc-800 pt-6">
            <p className="text-xs text-zinc-500 mb-4">
              By submitting this application, you confirm that the information provided is accurate
              and that you are authorized to represent this organization.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded font-medium transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Partnership Application'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 py-8 text-center text-xs text-zinc-500">
        <p>Questions? Contact us at <a href="mailto:partners@proveniq.io" className="text-amber-500 hover:underline">partners@proveniq.io</a></p>
        <p className="mt-2">Pet911 is a project of PROVENIQ Foundation</p>
      </footer>
    </div>
  );
}
