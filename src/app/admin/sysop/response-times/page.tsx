'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ResponseMetric {
  id: string;
  triage_tier: number;
  county: string;
  response_time_seconds: number;
  created_at: string;
}

interface TierStats {
  tier: number;
  avg_seconds: number;
  count: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface CountyStats {
  county: string;
  avg_seconds: number;
  count: number;
  status: 'excellent' | 'good' | 'needs_improvement';
}

export default function ResponseTimesPage() {
  const [metrics, setMetrics] = useState<ResponseMetric[]>([]);
  const [tierStats, setTierStats] = useState<TierStats[]>([]);
  const [countyStats, setCountyStats] = useState<CountyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('dispatch_metrics')
      .select('*')
      .not('response_time_seconds', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error && data) {
      setMetrics(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (data: ResponseMetric[]) => {
    // Calculate tier stats
    const tierData: Record<number, ResponseMetric[]> = {};
    data.forEach(m => {
      if (!tierData[m.triage_tier]) tierData[m.triage_tier] = [];
      tierData[m.triage_tier].push(m);
    });

    const tiers = Object.entries(tierData).map(([tier, metrics]) => {
      const avgSeconds = Math.round(metrics.reduce((sum, m) => sum + m.response_time_seconds, 0) / metrics.length);
      return {
        tier: parseInt(tier),
        avg_seconds: avgSeconds,
        count: metrics.length,
        trend: 'stable' as const,
      };
    });
    setTierStats(tiers.sort((a, b) => a.tier - b.tier));

    // Calculate county stats
    const countyData: Record<string, ResponseMetric[]> = {};
    data.forEach(m => {
      if (!countyData[m.county]) countyData[m.county] = [];
      countyData[m.county].push(m);
    });

    const counties = Object.entries(countyData).map(([county, metrics]) => {
      const avgSeconds = Math.round(metrics.reduce((sum, m) => sum + m.response_time_seconds, 0) / metrics.length);
      return {
        county,
        avg_seconds: avgSeconds,
        count: metrics.length,
        status: (avgSeconds <= 300 ? 'excellent' : avgSeconds <= 600 ? 'good' : 'needs_improvement') as 'excellent' | 'good' | 'needs_improvement',
      };
    });
    setCountyStats(counties.sort((a, b) => a.avg_seconds - b.avg_seconds));
  };

  const updateMetrics = async () => {
    setUpdating(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('update_response_metrics');
    if (!error) {
      await fetchMetrics();
    }
    setUpdating(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status: 'excellent' | 'good' | 'needs_improvement') => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'needs_improvement': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'text-red-400';
      case 2: return 'text-yellow-400';
      case 3: return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">⏱️ Response Time Analytics</h1>
            <p className="text-zinc-500 text-sm">Volunteer response performance metrics</p>
          </div>
          <button
            onClick={updateMetrics}
            disabled={updating}
            className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update Metrics'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading response time data...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-400">
                  {metrics.length > 0 ? formatTime(Math.round(metrics.reduce((sum, m) => sum + m.response_time_seconds, 0) / metrics.length)) : '0m 0s'}
                </div>
                <div className="text-sm text-zinc-500">Average Response Time</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-400">{metrics.length}</div>
                <div className="text-sm text-zinc-500">Responses Tracked (7 days)</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-400">{countyStats.length}</div>
                <div className="text-sm text-zinc-500">Active Counties</div>
              </div>
            </div>

            {/* Tier Performance */}
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
              <h2 className="text-lg font-semibold mb-4">🎯 Performance by Triage Tier</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tierStats.map(tier => (
                  <div key={tier.tier} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-medium ${getTierColor(tier.tier)}`}>
                        Tier {tier.tier}
                      </span>
                      <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded">
                        {tier.count} responses
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-100">
                      {formatTime(tier.avg_seconds)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Average response time</div>
                  </div>
                ))}
              </div>
            </div>

            {/* County Performance */}
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
              <h2 className="text-lg font-semibold mb-4">🗺️ Performance by County</h2>
              <div className="space-y-2">
                {countyStats.map(county => (
                  <div key={county.county} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">{county.county}</div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        county.status === 'excellent' ? 'bg-green-900 text-green-300' :
                        county.status === 'good' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {county.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={getStatusColor(county.status)}>
                        {formatTime(county.avg_seconds)}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {county.count} cases
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Responses */}
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
              <h2 className="text-lg font-semibold mb-4">📊 Recent Response Times</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-800">
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Tier</th>
                      <th className="text-left p-2">County</th>
                      <th className="text-right p-2">Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.slice(0, 10).map(metric => (
                      <tr key={metric.id} className="border-b border-zinc-800/50">
                        <td className="p-2 text-zinc-400">
                          {new Date(metric.created_at).toLocaleTimeString()}
                        </td>
                        <td className={`p-2 ${getTierColor(metric.triage_tier)}`}>
                          Tier {metric.triage_tier}
                        </td>
                        <td className="p-2">{metric.county}</td>
                        <td className={`p-2 text-right ${getStatusColor(
                          metric.response_time_seconds <= 300 ? 'excellent' :
                          metric.response_time_seconds <= 600 ? 'good' : 'needs_improvement'
                        )}`}>
                          {formatTime(metric.response_time_seconds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
