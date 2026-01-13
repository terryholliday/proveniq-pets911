'use client';

import { useState, useEffect } from 'react';
import { 
  Wrench, 
  MapPin,
  User,
  Phone,
  Search,
  CheckCircle,
  AlertTriangle,
  Send,
  Filter
} from 'lucide-react';

interface VolunteerEquipment {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_phone: string;
  county: string;
  equipment_type: string;
  equipment_detail?: string;
  is_available: boolean;
  distance_miles?: number;
}

interface TechnicalRescueCase {
  id: string;
  case_number: string;
  description: string;
  location_county: string;
  location_address?: string;
  equipment_needed: string[];
  status: 'OPEN' | 'VOLUNTEERS_CONTACTED' | 'IN_PROGRESS' | 'RESOLVED';
  created_at: string;
}

const EQUIPMENT_TYPES: Record<string, { label: string; icon: string }> = {
  LADDER: { label: 'Ladder', icon: '🪜' },
  EXTENSION_LADDER: { label: 'Extension Ladder', icon: '🪜' },
  LIVE_TRAP_SMALL: { label: 'Small Live Trap', icon: '🪤' },
  LIVE_TRAP_LARGE: { label: 'Large Live Trap', icon: '🪤' },
  CATCH_POLE: { label: 'Catch Pole', icon: '🎣' },
  NET: { label: 'Net', icon: '🥅' },
  CRATE_SMALL: { label: 'Small Crate', icon: '📦' },
  CRATE_MEDIUM: { label: 'Medium Crate', icon: '📦' },
  CRATE_LARGE: { label: 'Large Crate', icon: '📦' },
  CRATE_XLARGE: { label: 'XL Crate', icon: '📦' },
  VEHICLE_TRAILER: { label: 'Vehicle/Trailer', icon: '🚗' },
  BOAT: { label: 'Boat', icon: '🚤' },
  KAYAK: { label: 'Kayak', icon: '🛶' },
  DRONE: { label: 'Drone', icon: '🚁' },
  THERMAL_CAMERA: { label: 'Thermal Camera', icon: '📷' },
  OTHER: { label: 'Other', icon: '🔧' },
};

export default function EquipmentMatchPage() {
  const [cases, setCases] = useState<TechnicalRescueCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<TechnicalRescueCase | null>(null);
  const [matchedVolunteers, setMatchedVolunteers] = useState<VolunteerEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);
  const [countyFilter, setCountyFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/technical-rescues');
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  }

  async function searchVolunteers(equipmentType: string, county: string) {
    setSearching(true);
    try {
      const res = await fetch(`/api/volunteers/equipment?type=${equipmentType}&county=${county}`);
      if (res.ok) {
        const data = await res.json();
        setMatchedVolunteers(data.volunteers || []);
      }
    } catch (error) {
      console.error('Failed to search volunteers:', error);
    } finally {
      setSearching(false);
    }
  }

  async function contactVolunteer(volunteerId: string, caseId: string) {
    try {
      const res = await fetch('/api/admin/dispatch-volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteer_id: volunteerId, case_id: caseId }),
      });
      if (res.ok) {
        alert('Volunteer contacted!');
        fetchCases();
      }
    } catch (error) {
      console.error('Failed to contact volunteer:', error);
    }
  }

  const openCases = cases.filter(c => c.status === 'OPEN');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Wrench className="h-7 w-7 text-yellow-500" />
              Equipment Matching
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Find volunteers with equipment for technical rescues
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-200 font-medium">Technical Rescue Situations</p>
              <p className="text-xs text-yellow-400/80 mt-1">
                For cases like cat stuck in tree, dog trapped in culvert, or animals in inaccessible locations.
                Match equipment needs with volunteers who have registered their gear.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Open Cases */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              Active Technical Rescues ({openCases.length})
            </h2>

            {loading ? (
              <div className="text-center py-8 text-zinc-500">Loading cases...</div>
            ) : openCases.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
                <Wrench className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
                <p className="text-zinc-500">No active technical rescues</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openCases.map(caseItem => (
                  <button
                    key={caseItem.id}
                    onClick={() => {
                      setSelectedCase(caseItem);
                      if (caseItem.equipment_needed?.length > 0) {
                        searchVolunteers(caseItem.equipment_needed[0], caseItem.location_county);
                      }
                    }}
                    className={`w-full text-left bg-zinc-900 border rounded-lg p-4 transition-colors ${
                      selectedCase?.id === caseItem.id 
                        ? 'border-yellow-500' 
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-sm text-zinc-400">#{caseItem.case_number}</span>
                      <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">
                        {caseItem.status}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{caseItem.description}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <MapPin className="h-3 w-3" />
                      {caseItem.location_county}
                    </div>
                    {caseItem.equipment_needed?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {caseItem.equipment_needed.map(eq => (
                          <span key={eq} className="text-xs bg-zinc-800 px-2 py-0.5 rounded">
                            {EQUIPMENT_TYPES[eq]?.icon} {EQUIPMENT_TYPES[eq]?.label || eq}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Equipment Search & Volunteers */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-400" />
              Find Volunteers with Equipment
            </h2>

            {/* Search Filters */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Equipment Type</label>
                  <select
                    value={equipmentFilter || ''}
                    onChange={(e) => {
                      setEquipmentFilter(e.target.value || null);
                      if (e.target.value && countyFilter) {
                        searchVolunteers(e.target.value, countyFilter);
                      }
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select equipment...</option>
                    {Object.entries(EQUIPMENT_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>{config.icon} {config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">County</label>
                  <select
                    value={countyFilter || ''}
                    onChange={(e) => {
                      setCountyFilter(e.target.value || null);
                      if (equipmentFilter && e.target.value) {
                        searchVolunteers(equipmentFilter, e.target.value);
                      }
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select county...</option>
                    <option value="GREENBRIER">GREENBRIER</option>
                    <option value="KANAWHA">KANAWHA</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => equipmentFilter && countyFilter && searchVolunteers(equipmentFilter, countyFilter)}
                disabled={!equipmentFilter || !countyFilter || searching}
                className="w-full mt-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 py-2 rounded text-sm font-medium"
              >
                {searching ? 'Searching...' : 'Search Volunteers'}
              </button>
            </div>

            {/* Matched Volunteers */}
            {matchedVolunteers.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  {matchedVolunteers.length} volunteer{matchedVolunteers.length > 1 ? 's' : ''} found with this equipment
                </p>
                {matchedVolunteers.map((vol, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          vol.is_available ? 'bg-green-900/50' : 'bg-zinc-800'
                        }`}>
                          <User className={`h-5 w-5 ${vol.is_available ? 'text-green-400' : 'text-zinc-500'}`} />
                        </div>
                        <div>
                          <div className="font-medium">{vol.volunteer_name}</div>
                          <div className="text-xs text-zinc-400">{vol.county} County</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        vol.is_available 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {vol.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="bg-zinc-800 px-2 py-1 rounded text-xs">
                        {EQUIPMENT_TYPES[vol.equipment_type]?.icon} {EQUIPMENT_TYPES[vol.equipment_type]?.label}
                      </span>
                      {vol.equipment_detail && (
                        <span className="text-zinc-400 text-xs">{vol.equipment_detail}</span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {vol.volunteer_phone && (
                        <a
                          href={`tel:${vol.volunteer_phone}`}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </a>
                      )}
                      {selectedCase && vol.is_available && (
                        <button
                          onClick={() => contactVolunteer(vol.volunteer_id, selectedCase.id)}
                          className="flex items-center gap-1 bg-yellow-700 hover:bg-yellow-600 px-3 py-1 rounded text-sm"
                        >
                          <Send className="h-4 w-4" />
                          Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : equipmentFilter && countyFilter && !searching ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
                <Wrench className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
                <p className="text-zinc-500">No volunteers found with this equipment</p>
                <p className="text-xs text-zinc-600 mt-1">Try a different equipment type or county</p>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
                <Search className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
                <p className="text-zinc-500">Select equipment and county to search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
