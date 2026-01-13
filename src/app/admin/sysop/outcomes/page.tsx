'use client';

import { useState, useEffect } from 'react';
import { 
  Heart,
  TrendingUp,
  Home,
  Truck,
  Cat,
  Dog,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  MapPin
} from 'lucide-react';

interface OutcomeStats {
  lives_saved: number;
  lives_saved_change: number;
  reunifications: number;
  reunifications_change: number;
  adoptions: number;
  adoptions_change: number;
  tnr_cats: number;
  tnr_cats_change: number;
  transports_completed: number;
  avg_response_hours: number;
  avg_reunification_days: number;
}

interface OutcomeByType {
  type: string;
  count: number;
  percentage: number;
}

interface RecentOutcome {
  id: string;
  case_number: string;
  outcome_type: string;
  animal_description: string;
  county: string;
  completed_at: string;
}

export default function OutcomesDashboardPage() {
  const [stats, setStats] = useState<OutcomeStats | null>(null);
  const [byType, setByType] = useState<OutcomeByType[]>([]);
  const [recent, setRecent] = useState<RecentOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchOutcomes();
  }, [timeRange]);

  async function fetchOutcomes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outcomes?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setByType(data.by_type || []);
        setRecent(data.recent || []);
      }
    } catch (error) {
      console.error('Failed to fetch outcomes:', error);
    } finally {
      setLoading(false);
    }
  }

  const OUTCOME_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    REUNITED: { label: 'Reunited with Owner', icon: <Heart className="h-4 w-4" />, color: 'text-pink-400' },
    ADOPTED: { label: 'Adopted', icon: <Home className="h-4 w-4" />, color: 'text-green-400' },
    TNR: { label: 'TNR Complete', icon: <Cat className="h-4 w-4" />, color: 'text-teal-400' },
    TRANSFERRED: { label: 'Transferred to Rescue', icon: <Truck className="h-4 w-4" />, color: 'text-blue-400' },
    FOSTERED: { label: 'Placed in Foster', icon: <Users className="h-4 w-4" />, color: 'text-purple-400' },
    RELEASED: { label: 'Released (Wildlife)', icon: <CheckCircle className="h-4 w-4" />, color: 'text-amber-400' },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Heart className="h-7 w-7 text-pink-500" />
              Outcome Tracking
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Lives saved, reunifications, and impact metrics
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded text-sm ${
                  timeRange === range 
                    ? 'bg-pink-700 text-white' 
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {range === 'all' ? 'All Time' : range}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading outcomes...</div>
        ) : (
          <>
            {/* Hero Stat - Lives Saved */}
            <div className="bg-gradient-to-br from-pink-900/30 to-zinc-900 border border-pink-700/50 rounded-2xl p-8 mb-8 text-center">
              <div className="text-6xl font-black text-pink-400 mb-2">
                {stats?.lives_saved || 0}
              </div>
              <div className="text-xl text-pink-200 mb-4">Lives Saved</div>
              {stats?.lives_saved_change !== undefined && stats.lives_saved_change !== 0 && (
                <div className={`inline-flex items-center gap-1 text-sm ${
                  stats.lives_saved_change > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.lives_saved_change > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {Math.abs(stats.lives_saved_change)}% vs previous period
                </div>
              )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="text-sm">Reunifications</span>
                </div>
                <div className="text-3xl font-bold">{stats?.reunifications || 0}</div>
                {stats?.reunifications_change !== undefined && stats.reunifications_change !== 0 && (
                  <div className={`text-xs mt-1 ${stats.reunifications_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.reunifications_change > 0 ? '+' : ''}{stats.reunifications_change}%
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Home className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Adoptions</span>
                </div>
                <div className="text-3xl font-bold">{stats?.adoptions || 0}</div>
                {stats?.adoptions_change !== undefined && stats.adoptions_change !== 0 && (
                  <div className={`text-xs mt-1 ${stats.adoptions_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.adoptions_change > 0 ? '+' : ''}{stats.adoptions_change}%
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Cat className="h-4 w-4 text-teal-500" />
                  <span className="text-sm">TNR Cats</span>
                </div>
                <div className="text-3xl font-bold">{stats?.tnr_cats || 0}</div>
                {stats?.tnr_cats_change !== undefined && stats.tnr_cats_change !== 0 && (
                  <div className={`text-xs mt-1 ${stats.tnr_cats_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.tnr_cats_change > 0 ? '+' : ''}{stats.tnr_cats_change}%
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Truck className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Transports</span>
                </div>
                <div className="text-3xl font-bold">{stats?.transports_completed || 0}</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Response Time */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-zinc-400" />
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">Avg Response Time</span>
                      <span className="font-medium">{stats?.avg_response_hours || 0} hours</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full"
                        style={{ width: `${Math.min(100, 100 - ((stats?.avg_response_hours || 0) / 24) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Target: &lt;24 hours</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">Avg Reunification Time</span>
                      <span className="font-medium">{stats?.avg_reunification_days || 0} days</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pink-600 rounded-full"
                        style={{ width: `${Math.min(100, 100 - ((stats?.avg_reunification_days || 0) / 14) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Target: &lt;14 days</p>
                  </div>
                </div>
              </div>

              {/* Outcomes by Type */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-zinc-400" />
                  Outcomes by Type
                </h3>
                {byType.length > 0 ? (
                  <div className="space-y-3">
                    {byType.map(item => {
                      const config = OUTCOME_TYPES[item.type] || { 
                        label: item.type, 
                        icon: <CheckCircle className="h-4 w-4" />,
                        color: 'text-zinc-400'
                      };
                      return (
                        <div key={item.type}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                              <span className={config.color}>{config.icon}</span>
                              <span>{config.label}</span>
                            </div>
                            <span className="font-medium">{item.count} ({item.percentage}%)</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.type === 'REUNITED' ? 'bg-pink-600' :
                                item.type === 'ADOPTED' ? 'bg-green-600' :
                                item.type === 'TNR' ? 'bg-teal-600' :
                                item.type === 'TRANSFERRED' ? 'bg-blue-600' :
                                'bg-purple-600'
                              }`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">No outcome data yet</p>
                )}
              </div>
            </div>

            {/* Recent Outcomes */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Recent Positive Outcomes
              </h3>
              
              {recent.length > 0 ? (
                <div className="space-y-3">
                  {recent.map(outcome => {
                    const config = OUTCOME_TYPES[outcome.outcome_type] || {
                      label: outcome.outcome_type,
                      icon: <CheckCircle className="h-4 w-4" />,
                      color: 'text-zinc-400'
                    };
                    return (
                      <div
                        key={outcome.id}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-zinc-800 ${config.color}`}>
                            {config.icon}
                          </div>
                          <div>
                            <div className="font-medium">{outcome.animal_description}</div>
                            <div className="text-xs text-zinc-500">
                              #{outcome.case_number} • {config.label}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <MapPin className="h-3 w-3" />
                            {outcome.county}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {new Date(outcome.completed_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
                  <p className="text-zinc-500">No outcomes recorded yet</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Outcomes appear when cases are resolved with positive dispositions
                  </p>
                </div>
              )}
            </div>

            {/* Mission Statement */}
            <div className="mt-8 text-center">
              <p className="text-zinc-500 text-sm italic">
                "Every number represents a life saved, a family reunited, or suffering prevented."
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                — PROVENIQ Mission
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
