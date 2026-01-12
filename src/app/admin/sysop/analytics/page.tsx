'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Metrics {
  totalVolunteers: number;
  activeVolunteers: number;
  pendingApplications: number;
  activeCertifications: number;
  casesThisWeek: number;
  reunificationsThisMonth: number;
  avgResponseTime: number;
  conversionRate: number;
}

interface OutcomeData {
  outcome: string;
  count: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [outcomes, setOutcomes] = useState<OutcomeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const supabase = createClient();

    // Fetch volunteer counts
    const [
      { count: totalVolunteers },
      { count: activeVolunteers },
      { count: pendingApplications },
      { count: activeCertifications },
    ] = await Promise.all([
      supabase.from('volunteers').select('*', { count: 'exact', head: true }),
      supabase.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'INACTIVE'),
      supabase.from('volunteer_certifications').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    // Fetch outcomes
    const { data: outcomeData } = await supabase
      .from('case_outcomes')
      .select('outcome')
      .gte('created_at', getDateRange(timeRange));

    const outcomeCounts = (outcomeData || []).reduce((acc, row) => {
      acc[row.outcome] = (acc[row.outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setOutcomes(
      Object.entries(outcomeCounts).map(([outcome, count]) => ({ outcome, count }))
    );

    // Calculate conversion rate (approved / total applications)
    const conversionRate = totalVolunteers && activeVolunteers 
      ? Math.round((activeVolunteers / totalVolunteers) * 100) 
      : 0;

    setMetrics({
      totalVolunteers: totalVolunteers || 0,
      activeVolunteers: activeVolunteers || 0,
      pendingApplications: pendingApplications || 0,
      activeCertifications: activeCertifications || 0,
      casesThisWeek: outcomeData?.length || 0,
      reunificationsThisMonth: outcomeCounts['reunited'] || 0,
      avgResponseTime: 0, // Would come from dispatch_metrics
      conversionRate,
    });

    setLoading(false);
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const outcomeColors: Record<string, string> = {
    reunited: 'bg-green-500',
    adopted: 'bg-blue-500',
    fostered: 'bg-purple-500',
    transferred: 'bg-cyan-500',
    tnr_complete: 'bg-amber-500',
    deceased: 'bg-zinc-600',
    euthanized: 'bg-red-500',
    ongoing: 'bg-yellow-500',
  };

  const totalOutcomes = outcomes.reduce((sum, o) => sum + o.count, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">📊 Analytics Dashboard</h1>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-sm rounded ${timeRange === r ? 'bg-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading analytics...</div>
        ) : metrics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-400">{metrics.totalVolunteers}</div>
                <div className="text-sm text-zinc-500">Total Volunteers</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-400">{metrics.activeVolunteers}</div>
                <div className="text-sm text-zinc-500">Active Volunteers</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-400">{metrics.activeCertifications}</div>
                <div className="text-sm text-zinc-500">Active Certifications</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-amber-400">{metrics.conversionRate}%</div>
                <div className="text-sm text-zinc-500">Activation Rate</div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
              <h2 className="text-lg font-semibold mb-4">📈 Volunteer Funnel</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-center mb-2">
                    <div className="text-2xl font-bold">{metrics.totalVolunteers}</div>
                    <div className="text-xs text-zinc-500">Applications</div>
                  </div>
                  <div className="h-2 bg-blue-600 rounded"></div>
                </div>
                <div className="text-zinc-600">→</div>
                <div className="flex-1">
                  <div className="text-center mb-2">
                    <div className="text-2xl font-bold">{metrics.activeVolunteers}</div>
                    <div className="text-xs text-zinc-500">Activated</div>
                  </div>
                  <div className="h-2 bg-green-600 rounded" style={{ width: `${metrics.conversionRate}%` }}></div>
                </div>
                <div className="text-zinc-600">→</div>
                <div className="flex-1">
                  <div className="text-center mb-2">
                    <div className="text-2xl font-bold">{metrics.activeCertifications}</div>
                    <div className="text-xs text-zinc-500">Certified</div>
                  </div>
                  <div className="h-2 bg-purple-600 rounded" style={{ 
                    width: `${metrics.totalVolunteers ? (metrics.activeCertifications / metrics.totalVolunteers) * 100 : 0}%` 
                  }}></div>
                </div>
              </div>
            </div>

            {/* Outcome Distribution */}
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
              <h2 className="text-lg font-semibold mb-4">🎯 Case Outcomes ({timeRange})</h2>
              {outcomes.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">No outcome data for this period</div>
              ) : (
                <>
                  <div className="flex h-8 rounded overflow-hidden mb-4">
                    {outcomes.map(o => (
                      <div
                        key={o.outcome}
                        className={`${outcomeColors[o.outcome] || 'bg-zinc-600'}`}
                        style={{ width: `${(o.count / totalOutcomes) * 100}%` }}
                        title={`${o.outcome}: ${o.count}`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {outcomes.map(o => (
                      <div key={o.outcome} className="flex items-center gap-2 text-sm">
                        <div className={`w-3 h-3 rounded ${outcomeColors[o.outcome] || 'bg-zinc-600'}`}></div>
                        <span className="text-zinc-400">{o.outcome}:</span>
                        <span className="font-medium">{o.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Impact Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-green-900/50 rounded-lg bg-green-900/10 p-4 text-center">
                <div className="text-4xl mb-2">🏠</div>
                <div className="text-3xl font-bold text-green-400">{metrics.reunificationsThisMonth}</div>
                <div className="text-sm text-zinc-400">Pets Reunited ({timeRange})</div>
              </div>
              <div className="border border-blue-900/50 rounded-lg bg-blue-900/10 p-4 text-center">
                <div className="text-4xl mb-2">❤️</div>
                <div className="text-3xl font-bold text-blue-400">
                  {outcomes.find(o => o.outcome === 'adopted')?.count || 0}
                </div>
                <div className="text-sm text-zinc-400">Adoptions ({timeRange})</div>
              </div>
              <div className="border border-amber-900/50 rounded-lg bg-amber-900/10 p-4 text-center">
                <div className="text-4xl mb-2">✂️</div>
                <div className="text-3xl font-bold text-amber-400">
                  {outcomes.find(o => o.outcome === 'tnr_complete')?.count || 0}
                </div>
                <div className="text-sm text-zinc-400">TNR Completed ({timeRange})</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
