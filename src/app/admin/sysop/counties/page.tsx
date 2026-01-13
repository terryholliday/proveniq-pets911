'use client';

import { useState } from 'react';
import Link from 'next/link';

const INITIAL_COUNTIES = [
  { id: 'GREENBRIER', name: 'Greenbrier County', state: 'WV', volunteers: 12, shelters: 2, active: true },
  { id: 'KANAWHA', name: 'Kanawha County', state: 'WV', volunteers: 8, shelters: 1, active: true },
];

const INITIAL_SHELTERS = [
  { id: '1', name: 'Greenbrier Humane Society', county: 'GREENBRIER', type: 'shelter', verified: true },
  { id: '2', name: 'Almost Home Animal Rescue', county: 'GREENBRIER', type: 'rescue', verified: true },
  { id: '3', name: 'Kanawha-Charleston Humane Association', county: 'KANAWHA', type: 'shelter', verified: true },
];

const AVAILABLE_COUNTIES = [
  'BARBOUR', 'BERKELEY', 'BOONE', 'BRAXTON', 'BROOKE', 'CABELL', 'CALHOUN', 'CLAY',
  'DODDRIDGE', 'FAYETTE', 'GILMER', 'GRANT', 'HAMPSHIRE', 'HANCOCK', 'HARDY', 'HARRISON',
  'JACKSON', 'JEFFERSON', 'LEWIS', 'LINCOLN', 'LOGAN', 'MARION', 'MARSHALL', 'MASON',
  'MCDOWELL', 'MERCER', 'MINERAL', 'MINGO', 'MONONGALIA', 'MONROE', 'MORGAN', 'NICHOLAS',
  'OHIO', 'PENDLETON', 'PLEASANTS', 'POCAHONTAS', 'PRESTON', 'PUTNAM', 'RALEIGH', 'RANDOLPH',
  'RITCHIE', 'ROANE', 'SUMMERS', 'TAYLOR', 'TUCKER', 'TYLER', 'UPSHUR', 'WAYNE', 'WEBSTER',
  'WETZEL', 'WIRT', 'WOOD', 'WYOMING'
];

type County = { id: string; name: string; state: string; volunteers: number; shelters: number; active: boolean };
type Shelter = { id: string; name: string; county: string; type: string; verified: boolean };

export default function CountiesPage() {
  const [counties, setCounties] = useState<County[]>(INITIAL_COUNTIES);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  
  // Modal states
  const [showAddCounty, setShowAddCounty] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Shelter | null>(null);
  
  // Form states
  const [newCountyId, setNewCountyId] = useState('');
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerCounty, setNewPartnerCounty] = useState('');
  const [newPartnerType, setNewPartnerType] = useState('shelter');

  const handleAddCounty = () => {
    if (!newCountyId) return;
    const exists = counties.find(c => c.id === newCountyId);
    if (exists) {
      alert('County already added');
      return;
    }
    setCounties([...counties, {
      id: newCountyId,
      name: `${newCountyId.charAt(0)}${newCountyId.slice(1).toLowerCase()} County`,
      state: 'WV',
      volunteers: 0,
      shelters: 0,
      active: true
    }]);
    setNewCountyId('');
    setShowAddCounty(false);
  };

  const handleAddPartner = () => {
    if (!newPartnerName || !newPartnerCounty) return;
    setShelters([...shelters, {
      id: String(Date.now()),
      name: newPartnerName,
      county: newPartnerCounty,
      type: newPartnerType,
      verified: false
    }]);
    setNewPartnerName('');
    setNewPartnerCounty('');
    setNewPartnerType('shelter');
    setShowAddPartner(false);
  };

  const handleUpdatePartner = () => {
    if (!editingPartner) return;
    setShelters(shelters.map(s => s.id === editingPartner.id ? editingPartner : s));
    setEditingPartner(null);
  };

  const handleToggleVerified = (id: string) => {
    setShelters(shelters.map(s => s.id === id ? { ...s, verified: !s.verified } : s));
  };

  const handleDeletePartner = (id: string) => {
    if (confirm('Are you sure you want to remove this partner?')) {
      setShelters(shelters.filter(s => s.id !== id));
    }
  };

  const handleRemoveCounty = (id: string) => {
    if (confirm('Are you sure you want to remove this county? This will also remove all associated partners.')) {
      setCounties(counties.filter(c => c.id !== id));
      setShelters(shelters.filter(s => s.county !== id));
    }
  };

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
            <button 
              onClick={() => setShowAddCounty(true)}
              className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded"
            >
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
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${county.active ? 'bg-green-900 text-green-300' : 'bg-zinc-800'}`}>
                      {county.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleRemoveCounty(county.id)}
                      className="text-xs text-red-400 hover:text-red-300 px-1"
                      title="Remove county"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-300">Partner Organizations</h2>
            <button 
              onClick={() => setShowAddPartner(true)}
              className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded"
            >
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
                  <button 
                    onClick={() => handleToggleVerified(shelter.id)}
                    className={`text-xs px-2 py-0.5 rounded ${shelter.verified ? 'bg-blue-900 text-blue-300' : 'bg-zinc-700 text-zinc-400'}`}
                  >
                    {shelter.verified ? 'Verified' : 'Unverified'}
                  </button>
                  <button 
                    onClick={() => setEditingPartner(shelter)}
                    className="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeletePartner(shelter.id)}
                    className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
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

      {/* Add County Modal */}
      {showAddCounty && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add County</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Select County</label>
                <select
                  value={newCountyId}
                  onChange={(e) => setNewCountyId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                >
                  <option value="">-- Select a county --</option>
                  {AVAILABLE_COUNTIES.filter(c => !counties.find(ec => ec.id === c)).map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowAddCounty(false); setNewCountyId(''); }}
                  className="text-sm px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCounty}
                  disabled={!newCountyId}
                  className="text-sm px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded disabled:opacity-50"
                >
                  Add County
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddPartner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Partner Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  placeholder="e.g. Fayette County Humane Society"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">County</label>
                <select
                  value={newPartnerCounty}
                  onChange={(e) => setNewPartnerCounty(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                >
                  <option value="">-- Select county --</option>
                  {counties.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Type</label>
                <select
                  value={newPartnerType}
                  onChange={(e) => setNewPartnerType(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                >
                  <option value="shelter">Shelter</option>
                  <option value="rescue">Rescue</option>
                  <option value="clinic">Clinic</option>
                  <option value="transport">Transport</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowAddPartner(false); setNewPartnerName(''); setNewPartnerCounty(''); }}
                  className="text-sm px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPartner}
                  disabled={!newPartnerName || !newPartnerCounty}
                  className="text-sm px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded disabled:opacity-50"
                >
                  Add Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {editingPartner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Partner</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={editingPartner.name}
                  onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Type</label>
                <select
                  value={editingPartner.type}
                  onChange={(e) => setEditingPartner({ ...editingPartner, type: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                >
                  <option value="shelter">Shelter</option>
                  <option value="rescue">Rescue</option>
                  <option value="clinic">Clinic</option>
                  <option value="transport">Transport</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={editingPartner.verified}
                  onChange={(e) => setEditingPartner({ ...editingPartner, verified: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="verified" className="text-sm text-zinc-400">Verified Partner</label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingPartner(null)}
                  className="text-sm px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePartner}
                  className="text-sm px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
