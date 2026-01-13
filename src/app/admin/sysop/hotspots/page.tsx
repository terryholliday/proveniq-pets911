'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Eye,
  Flag
} from 'lucide-react';

interface Hotspot {
  id: string;
  location_address: string;
  location_description: string;
  location_lat: number;
  location_lng: number;
  county: string;
  incident_count: number;
  first_incident_at: string;
  last_incident_at: string;
  is_flagged: boolean;
}

export default function AbandonmentHotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');

  useEffect(() => {
    fetchHotspots();
  }, []);

  async function fetchHotspots() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hotspots');
      if (res.ok) {
        const data = await res.json();
        setHotspots(data.hotspots || []);
      }
    } catch (error) {
      console.error('Failed to fetch hotspots:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredHotspots = filter === 'flagged' 
    ? hotspots.filter(h => h.is_flagged) 
    : hotspots;

  const flaggedCount = hotspots.filter(h => h.is_flagged).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <MapPin className="h-7 w-7 text-red-500" />
              Abandonment Hotspots
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Locations with repeat abandonment incidents
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2">
              <div className="text-2xl font-bold text-red-400">{flaggedCount}</div>
              <div className="text-xs text-zinc-400">Flagged Locations</div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Automatic Hotspot Detection</p>
              <p className="text-xs text-amber-400/80 mt-1">
                Locations are automatically flagged when 3+ incidents occur at the same GPS coordinates.
                This helps identify patterns like repeat dumping at shelter doors.
              </p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-zinc-700 text-white' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            All Locations ({hotspots.length})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'flagged' 
                ? 'bg-red-700 text-white' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <Flag className="h-4 w-4" />
            Flagged Only ({flaggedCount})
          </button>
        </div>

        {/* Hotspots List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading hotspots...</div>
        ) : filteredHotspots.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500">No hotspots detected</p>
            <p className="text-zinc-600 text-sm mt-1">
              Hotspots appear when multiple incidents occur at the same location
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHotspots
              .sort((a, b) => b.incident_count - a.incident_count)
              .map(hotspot => (
                <div
                  key={hotspot.id}
                  className={`bg-zinc-900 border rounded-lg p-4 ${
                    hotspot.is_flagged ? 'border-red-700' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        hotspot.is_flagged ? 'bg-red-900/50' : 'bg-zinc-800'
                      }`}>
                        <MapPin className={`h-5 w-5 ${
                          hotspot.is_flagged ? 'text-red-400' : 'text-zinc-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {hotspot.location_description || hotspot.location_address || 'Unknown Location'}
                          </span>
                          {hotspot.is_flagged && (
                            <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">
                              FLAGGED
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-zinc-400 mt-1">
                          {hotspot.county} County
                        </div>
                        {hotspot.location_lat && hotspot.location_lng && (
                          <a
                            href={`https://maps.google.com/?q=${hotspot.location_lat},${hotspot.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View on Map
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        hotspot.incident_count >= 5 ? 'text-red-400' :
                        hotspot.incident_count >= 3 ? 'text-amber-400' :
                        'text-zinc-400'
                      }`}>
                        {hotspot.incident_count}
                      </div>
                      <div className="text-xs text-zinc-500">incidents</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      First: {new Date(hotspot.first_incident_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Last: {new Date(hotspot.last_incident_at).toLocaleDateString()}
                    </div>
                    <div>
                      Avg: {Math.round(
                        (new Date(hotspot.last_incident_at).getTime() - new Date(hotspot.first_incident_at).getTime()) 
                        / (1000 * 60 * 60 * 24 * Math.max(1, hotspot.incident_count - 1))
                      )} days between incidents
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
