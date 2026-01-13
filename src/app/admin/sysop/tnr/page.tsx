'use client';

import { useState, useEffect } from 'react';
import { 
  Cat, 
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  Plus
} from 'lucide-react';

interface TNRColony {
  id: string;
  case_number: string;
  location_address?: string;
  location_county: string;
  location_notes?: string;
  estimated_count: number;
  cats_trapped: number;
  cats_fixed: number;
  cats_returned: number;
  status: 'REPORTED' | 'ASSESSING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' | 'MONITORING';
  coordinator_name?: string;
  coordinator_phone?: string;
  next_action_date?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  REPORTED: { label: 'Reported', color: 'bg-blue-900/50 text-blue-400' },
  ASSESSING: { label: 'Assessing', color: 'bg-purple-900/50 text-purple-400' },
  SCHEDULED: { label: 'Scheduled', color: 'bg-amber-900/50 text-amber-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-orange-900/50 text-orange-400' },
  COMPLETE: { label: 'Complete', color: 'bg-green-900/50 text-green-400' },
  MONITORING: { label: 'Monitoring', color: 'bg-teal-900/50 text-teal-400' },
};

export default function TNRColonyTrackerPage() {
  const [colonies, setColonies] = useState<TNRColony[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  useEffect(() => {
    fetchColonies();
  }, []);

  async function fetchColonies() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tnr-colonies');
      if (res.ok) {
        const data = await res.json();
        setColonies(data.colonies || []);
      }
    } catch (error) {
      console.error('Failed to fetch colonies:', error);
    } finally {
      setLoading(false);
    }
  }

  const activeStatuses = ['REPORTED', 'ASSESSING', 'SCHEDULED', 'IN_PROGRESS'];
  const filteredColonies = filter === 'active'
    ? colonies.filter(c => activeStatuses.includes(c.status))
    : colonies;

  const stats = {
    active: colonies.filter(c => activeStatuses.includes(c.status)).length,
    totalCats: colonies.reduce((sum, c) => sum + c.estimated_count, 0),
    catsFixed: colonies.reduce((sum, c) => sum + c.cats_fixed, 0),
    complete: colonies.filter(c => c.status === 'COMPLETE').length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Cat className="h-7 w-7 text-teal-500" />
              TNR Colony Tracker
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Trap-Neuter-Return coordination for feral cat colonies
            </p>
          </div>
          <button className="flex items-center gap-2 bg-teal-700 hover:bg-teal-600 px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="h-4 w-4" />
            Add Colony
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-teal-400">{stats.active}</div>
            <div className="text-xs text-zinc-400">Active Colonies</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">{stats.totalCats}</div>
            <div className="text-xs text-zinc-400">Estimated Cats</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.catsFixed}</div>
            <div className="text-xs text-zinc-400">Cats Fixed</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{stats.complete}</div>
            <div className="text-xs text-zinc-400">Colonies Complete</div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-teal-900/20 border border-teal-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Cat className="h-5 w-5 text-teal-500 mt-0.5" />
            <div>
              <p className="text-sm text-teal-200 font-medium">Trap-Neuter-Return Program</p>
              <p className="text-xs text-teal-400/80 mt-1">
                TNR is the humane method of managing feral cat populations. Cats are trapped, 
                spayed/neutered, ear-tipped, and returned to their colony. This reduces population 
                growth while allowing cats to live out their lives.
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
                ? 'bg-teal-700 text-white' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-zinc-700 text-white' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            All ({colonies.length})
          </button>
        </div>

        {/* Colonies List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading colonies...</div>
        ) : filteredColonies.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Cat className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500">No TNR colonies</p>
            <p className="text-zinc-600 text-sm mt-1">
              Colonies appear here when feral cat reports are submitted
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredColonies.map(colony => {
              const statusConfig = STATUS_CONFIG[colony.status] || { label: colony.status, color: 'bg-zinc-700' };
              const progress = colony.estimated_count > 0 
                ? Math.round((colony.cats_fixed / colony.estimated_count) * 100) 
                : 0;

              return (
                <div
                  key={colony.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          <span className="text-xs text-zinc-500">#{colony.case_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-zinc-500" />
                          <span>{colony.location_county} County</span>
                          {colony.location_notes && (
                            <span className="text-zinc-500">• {colony.location_notes}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-teal-400">~{colony.estimated_count}</div>
                        <div className="text-xs text-zinc-500">cats</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400">TNR Progress</span>
                        <span className="text-teal-400">{progress}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-600 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-600" />
                        <span className="text-zinc-400">Trapped: {colony.cats_trapped}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                        <span className="text-zinc-400">Fixed: {colony.cats_fixed}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                        <span className="text-zinc-400">Returned: {colony.cats_returned}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-zinc-800/50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      {colony.coordinator_name && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {colony.coordinator_name}
                        </div>
                      )}
                      {colony.next_action_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Next: {new Date(colony.next_action_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {colony.coordinator_phone && (
                        <a
                          href={`tel:${colony.coordinator_phone}`}
                          className="text-teal-400 hover:text-teal-300"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      <button className="text-xs bg-teal-700 hover:bg-teal-600 px-3 py-1 rounded">
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
