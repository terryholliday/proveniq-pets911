'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  MapPin,
  Clock,
  Filter,
  Search,
  AlertTriangle,
  Cat,
  Dog,
  Users,
  Home,
  Truck,
  Heart,
  Eye,
  ChevronRight
} from 'lucide-react';

interface IncidentCase {
  id: string;
  case_number: string;
  case_type: string;
  status: string;
  location_address?: string;
  location_city?: string;
  location_county: string;
  total_animals: number;
  species_breakdown: Record<string, number>;
  reporter_name?: string;
  created_at: string;
  updated_at: string;
}

const CASE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  STRAY_SINGLE: { label: 'Single Stray', icon: <Dog className="h-4 w-4" />, color: 'bg-blue-900/50 text-blue-400' },
  STRAY_LITTER: { label: 'Litter/Group', icon: <Users className="h-4 w-4" />, color: 'bg-amber-900/50 text-amber-400' },
  ABANDONMENT: { label: 'Abandonment', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-900/50 text-red-400' },
  DECEASED_OWNER: { label: 'Deceased Owner', icon: <Home className="h-4 w-4" />, color: 'bg-purple-900/50 text-purple-400' },
  COMMUNITY_CAT_COLONY: { label: 'TNR Colony', icon: <Cat className="h-4 w-4" />, color: 'bg-teal-900/50 text-teal-400' },
  SEIZURE: { label: 'Legal Seizure', icon: <Briefcase className="h-4 w-4" />, color: 'bg-orange-900/50 text-orange-400' },
  HOARDING: { label: 'Hoarding', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-900/50 text-red-400' },
  TECHNICAL_RESCUE: { label: 'Technical Rescue', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-yellow-900/50 text-yellow-400' },
  CRUELTY: { label: 'Cruelty/Neglect', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-900/50 text-red-400' },
  SURRENDER: { label: 'Owner Surrender', icon: <Heart className="h-4 w-4" />, color: 'bg-pink-900/50 text-pink-400' },
  TRANSPORT_RELAY: { label: 'Transport Relay', icon: <Truck className="h-4 w-4" />, color: 'bg-indigo-900/50 text-indigo-400' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'bg-blue-600' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-600' },
  PENDING_RESOURCES: { label: 'Pending Resources', color: 'bg-purple-600' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-600' },
  CLOSED: { label: 'Closed', color: 'bg-zinc-600' },
  LEGAL_HOLD: { label: 'Legal Hold', color: 'bg-red-600' },
};

export default function IncidentCasesPage() {
  const [cases, setCases] = useState<IncidentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [countyFilter, setCountyFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cases');
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

  const activeStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING_RESOURCES'];
  
  let filteredCases = filter === 'active'
    ? cases.filter(c => activeStatuses.includes(c.status))
    : cases;

  if (typeFilter) {
    filteredCases = filteredCases.filter(c => c.case_type === typeFilter);
  }

  if (countyFilter) {
    filteredCases = filteredCases.filter(c => c.location_county === countyFilter);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredCases = filteredCases.filter(c => 
      c.case_number.toLowerCase().includes(q) ||
      c.location_address?.toLowerCase().includes(q) ||
      c.reporter_name?.toLowerCase().includes(q)
    );
  }

  const stats = {
    total: cases.length,
    active: cases.filter(c => activeStatuses.includes(c.status)).length,
    open: cases.filter(c => c.status === 'OPEN').length,
    inProgress: cases.filter(c => c.status === 'IN_PROGRESS').length,
    totalAnimals: cases.reduce((sum, c) => sum + (c.total_animals || 0), 0),
  };

  const counties = [...new Set(cases.map(c => c.location_county))].sort();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Briefcase className="h-7 w-7 text-blue-500" />
              Incident Cases
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Manage multi-animal incidents and complex cases
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.active}</div>
            <div className="text-xs text-zinc-400">Active Cases</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.open}</div>
            <div className="text-xs text-zinc-400">Open</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">{stats.inProgress}</div>
            <div className="text-xs text-zinc-400">In Progress</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{stats.totalAnimals}</div>
            <div className="text-xs text-zinc-400">Total Animals</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-zinc-400">{stats.total}</div>
            <div className="text-xs text-zinc-400">All Time</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search case #, location, reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'active' 
                  ? 'bg-blue-700 text-white' 
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
              All ({stats.total})
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter || ''}
            onChange={(e) => setTypeFilter(e.target.value || null)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">All Types</option>
            {Object.entries(CASE_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* County Filter */}
          <select
            value={countyFilter || ''}
            onChange={(e) => setCountyFilter(e.target.value || null)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">All Counties</option>
            {counties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading cases...</div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500">No cases found</p>
            <p className="text-zinc-600 text-sm mt-1">
              {searchQuery || typeFilter || countyFilter 
                ? 'Try adjusting your filters'
                : 'Cases will appear here when multi-animal reports are submitted'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCases.map(caseItem => {
              const typeConfig = CASE_TYPE_CONFIG[caseItem.case_type] || {
                label: caseItem.case_type,
                icon: <Briefcase className="h-4 w-4" />,
                color: 'bg-zinc-800 text-zinc-400'
              };
              const statusConfig = STATUS_CONFIG[caseItem.status] || {
                label: caseItem.status,
                color: 'bg-zinc-600'
              };

              return (
                <Link
                  key={caseItem.id}
                  href={`/admin/sysop/cases/${caseItem.id}`}
                  className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Type Badge */}
                      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                        {typeConfig.icon}
                      </div>

                      {/* Case Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{caseItem.case_number}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-400 mt-1">
                          {typeConfig.label} • {caseItem.total_animals} animal{caseItem.total_animals !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Location */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-zinc-400">
                          <MapPin className="h-3 w-3" />
                          {caseItem.location_county}
                        </div>
                        {caseItem.location_city && (
                          <div className="text-xs text-zinc-500">{caseItem.location_city}</div>
                        )}
                      </div>

                      {/* Time */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {new Date(caseItem.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-zinc-600" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
