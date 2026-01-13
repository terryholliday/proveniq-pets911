'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin,
  User,
  Plus,
  CheckCircle,
  Clock,
  ArrowRight,
  Phone,
  Route
} from 'lucide-react';

interface TransportRelay {
  id: string;
  case_number?: string;
  animal_description?: string;
  origin_address: string;
  origin_city?: string;
  origin_state?: string;
  destination_address: string;
  destination_city?: string;
  destination_state?: string;
  total_distance_miles?: number;
  status: 'PLANNING' | 'SEEKING_DRIVERS' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  target_date?: string;
  legs: TransportLeg[];
}

interface TransportLeg {
  id: string;
  leg_number: number;
  start_address: string;
  end_address: string;
  distance_miles?: number;
  volunteer_name?: string;
  volunteer_phone?: string;
  status: 'OPEN' | 'CLAIMED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduled_pickup?: string;
}

const STATUS_CONFIG = {
  PLANNING: { label: 'Planning', color: 'bg-zinc-700 text-zinc-300' },
  SEEKING_DRIVERS: { label: 'Seeking Drivers', color: 'bg-amber-900/50 text-amber-400' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-900/50 text-blue-400' },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-purple-900/50 text-purple-400' },
  COMPLETED: { label: 'Completed', color: 'bg-green-900/50 text-green-400' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-900/50 text-red-400' },
};

const LEG_STATUS_CONFIG = {
  OPEN: { label: 'Open', color: 'bg-zinc-700' },
  CLAIMED: { label: 'Claimed', color: 'bg-amber-900/50' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-900/50' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-900/50' },
  COMPLETED: { label: 'Done', color: 'bg-green-900/50' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-900/50' },
};

export default function TransportRelaysPage() {
  const [relays, setRelays] = useState<TransportRelay[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRelays();
  }, []);

  async function fetchRelays() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transport-relays');
      if (res.ok) {
        const data = await res.json();
        setRelays(data.relays || []);
      }
    } catch (error) {
      console.error('Failed to fetch relays:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRelays = filter === 'active'
    ? relays.filter(r => !['COMPLETED', 'CANCELLED'].includes(r.status))
    : relays;

  const activeCount = relays.filter(r => !['COMPLETED', 'CANCELLED'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Truck className="h-7 w-7 text-blue-500" />
              Transport Relays
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Coordinate multi-leg transport for long-distance reunifications
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New Relay
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{activeCount}</div>
            <div className="text-xs text-zinc-400">Active Relays</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">
              {relays.filter(r => r.status === 'SEEKING_DRIVERS').length}
            </div>
            <div className="text-xs text-zinc-400">Seeking Drivers</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {relays.filter(r => r.status === 'IN_TRANSIT').length}
            </div>
            <div className="text-xs text-zinc-400">In Transit</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {relays.filter(r => r.status === 'COMPLETED').length}
            </div>
            <div className="text-xs text-zinc-400">Completed</div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Route className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm text-blue-200 font-medium">Long-Distance Reunification</p>
              <p className="text-xs text-blue-400/80 mt-1">
                For cases like "Roscoe" (missing 3 years, found 500+ miles away in SC), 
                coordinate multiple volunteer drivers to relay the animal back home.
              </p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active' 
                ? 'bg-blue-700 text-white' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-zinc-700 text-white' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            All ({relays.length})
          </button>
        </div>

        {/* Relays List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading transport relays...</div>
        ) : filteredRelays.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Truck className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500">No transport relays</p>
            <p className="text-zinc-600 text-sm mt-1">
              Create one when you need to coordinate multi-driver transport
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRelays.map(relay => (
              <div
                key={relay.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
              >
                {/* Relay Header */}
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[relay.status].color}`}>
                          {STATUS_CONFIG[relay.status].label}
                        </span>
                        {relay.case_number && (
                          <span className="text-xs text-zinc-500">Case #{relay.case_number}</span>
                        )}
                      </div>
                      {relay.animal_description && (
                        <div className="font-medium">{relay.animal_description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      {relay.total_distance_miles && (
                        <div className="text-lg font-bold text-blue-400">
                          {relay.total_distance_miles} mi
                        </div>
                      )}
                      {relay.target_date && (
                        <div className="text-xs text-zinc-500">
                          Target: {new Date(relay.target_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route visualization */}
                  <div className="flex items-center gap-2 mt-4 text-sm">
                    <div className="flex items-center gap-1 text-green-400">
                      <MapPin className="h-4 w-4" />
                      <span>{relay.origin_city}, {relay.origin_state}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-500" />
                    <div className="flex items-center gap-1 text-blue-400">
                      <MapPin className="h-4 w-4" />
                      <span>{relay.destination_city}, {relay.destination_state}</span>
                    </div>
                  </div>
                </div>

                {/* Legs */}
                <div className="p-4">
                  <div className="text-xs text-zinc-500 mb-3">
                    {relay.legs.length} leg{relay.legs.length !== 1 ? 's' : ''} • 
                    {relay.legs.filter(l => l.status === 'OPEN').length} need drivers
                  </div>
                  <div className="space-y-2">
                    {relay.legs.map((leg, idx) => (
                      <div
                        key={leg.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${LEG_STATUS_CONFIG[leg.status].color}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
                          {leg.leg_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">
                            {leg.start_address} → {leg.end_address}
                          </div>
                          {leg.distance_miles && (
                            <div className="text-xs text-zinc-500">{leg.distance_miles} miles</div>
                          )}
                        </div>
                        {leg.volunteer_name ? (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-zinc-400" />
                            <span>{leg.volunteer_name}</span>
                            {leg.volunteer_phone && (
                              <a href={`tel:${leg.volunteer_phone}`} className="text-blue-400">
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <button className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1 rounded">
                            Find Driver
                          </button>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${LEG_STATUS_CONFIG[leg.status].color}`}>
                          {LEG_STATUS_CONFIG[leg.status].label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal - Simplified for now */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Create Transport Relay</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Transport relay creation coming soon. For now, coordinate manually via the case details page.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
