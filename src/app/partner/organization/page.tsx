'use client';

import { Building2, MapPin, Phone, Mail, Globe, Clock, Users, Shield } from 'lucide-react';

export default function PartnerOrganizationPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Organization Profile</h1>
        <p className="text-zinc-500 text-sm">Manage your organization&apos;s public profile and details</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Greenbrier Humane Society</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">Verified Partner</span>
                    <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded">Shelter</span>
                  </div>
                </div>
              </div>
              <button className="text-sm text-amber-500 hover:underline">Edit</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Address</div>
                  <div className="text-sm text-zinc-400">151 Holliday Lane</div>
                  <div className="text-sm text-zinc-400">Lewisburg, WV 24901</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Phone</div>
                  <div className="text-sm text-zinc-400">(304) 645-4775</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-sm text-zinc-400">info@greenbrierhumanesociety.org</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Website</div>
                  <div className="text-sm text-amber-500">greenbrierhumanesociety.org</div>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-zinc-500" />
                Operating Hours
              </h3>
              <button className="text-sm text-amber-500 hover:underline">Edit</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Monday</span>
                <span>10:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Tuesday</span>
                <span>10:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Wednesday</span>
                <span>10:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Thursday</span>
                <span>10:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Friday</span>
                <span>10:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Saturday</span>
                <span>10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400">Sunday</span>
                <span className="text-zinc-500">Closed</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Services Offered</h3>
              <button className="text-sm text-amber-500 hover:underline">Edit</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Stray Intake', 'Adoptions', 'Foster Program', 'Spay/Neuter', 'Microchipping', 'Vaccinations', 'Community Education'].map(service => (
                <span key={service} className="text-sm bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full">
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Service Area */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Service Area</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Greenbrier County</span>
                <span className="text-xs bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-500" />
                <span className="text-sm text-zinc-400">Monroe County</span>
                <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Secondary</span>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-500" />
              Team
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Primary Contact</div>
                <div className="text-sm text-zinc-400">Jane Smith, Executive Director</div>
              </div>
              <div>
                <div className="text-sm font-medium">Staff</div>
                <div className="text-sm text-zinc-400">8 paid staff</div>
              </div>
              <div>
                <div className="text-sm font-medium">Volunteers</div>
                <div className="text-sm text-zinc-400">24 active volunteers</div>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-zinc-500" />
              PetMayday Compliance
            </h3>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-amber-500 mb-1">SILVER</div>
              <div className="text-xs text-zinc-500">Compliance Tier</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Universal Scanning</span>
                <span className="text-green-400">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Digital Transparency</span>
                <span className="text-green-400">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Extended Holding</span>
                <span className="text-zinc-500">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Finder Immunity</span>
                <span className="text-zinc-500">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
