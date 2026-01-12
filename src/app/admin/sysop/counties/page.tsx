'use client';

import { useState } from 'react';
import Link from 'next/link';

const COUNTIES = [
  { id: 'GREENBRIER', name: 'Greenbrier County', state: 'WV', volunteers: 12, shelters: 2, active: true },
  { id: 'KANAWHA', name: 'Kanawha County', state: 'WV', volunteers: 8, shelters: 1, active: true },
];

const SHELTERS = [
  { id: '1', name: 'Greenbrier Humane Society', county: 'GREENBRIER', type: 'shelter', verified: true },
  { id: '2', name: 'Almost Home Animal Rescue', county: 'GREENBRIER', type: 'rescue', verified: true },
  { id: '3', name: 'Kanawha-Charleston Humane Association', county: 'KANAWHA', type: 'shelter', verified: true },
];

export default function CountiesPage() {
  const [counties] = useState(COUNTIES);
  const [shelters] = useState(SHELTERS);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
          <h1 className="text-2xl font-bold mt-2">🗺️ Counties & Regions</h1>
          <p className="text-zinc-500 text-sm">Manage service areas and shelter partnerships</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-300">Active Counties</h2>
            <button className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded">
              + Add County
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {counties.map(county => (
              <div key={county.id} className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{county.name}</div>
                    <div className="text-sm text-zinc-500">{county.state}</div>
                    <div className="flex gap-4 mt-2 text-xs text-zinc-400">
                      <span>{county.volunteers} volunteers</span>
                      <span>{county.shelters} shelters</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${county.active ? 'bg-green-900 text-green-300' : 'bg-zinc-800'}`}>
                    {county.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-300">Partner Organizations</h2>
            <button className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded">
              + Add Partner
            </button>
          </div>
          <div className="space-y-2">
            {shelters.map(shelter => (
              <div key={shelter.id} className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-medium">{shelter.name}</div>
                    <div className="text-xs text-zinc-500">{shelter.county} • {shelter.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {shelter.verified && (
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">Verified</span>
                  )}
                  <button className="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
          <div className="text-sm font-medium mb-2">Expansion Roadmap</div>
          <div className="text-xs text-zinc-500">
            Planning to expand to Fayette, Raleigh, and Monroe counties in Q2 2026.
            Contact partners@proveniq.io to propose new regions.
          </div>
        </div>
      </div>
    </div>
  );
}
