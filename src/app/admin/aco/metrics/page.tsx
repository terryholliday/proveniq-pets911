'use client';

/**
 * ACO Metrics & Analytics Dashboard
 * 
 * Accountability metrics showing:
 * - Response times
 * - Resolution rates
 * - Dispatch volume by type
 * - ACO vs volunteer response comparison
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface MetricsData {
  totalDispatches: number;
  completedDispatches: number;
  pendingDispatches: number;
  avgResponseMinutes: number;
  acoResponses: number;
  volunteerResponses: number;
  resolutionBreakdown: { code: string; count: number }[];
  triggerBreakdown: { trigger: string; count: number }[];
  dispatchesByDay: { date: string; count: number }[];
}

export default function ACOMetricsPage() {
  const [county, setCounty] = useState<'GREENBRIER' | 'KANAWHA'>('GREENBRIER');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadMetrics();
  }, [county, timeRange]);

  async function loadMetrics() {
    setLoading(true);

    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch all ACO dispatches for the time range
    const { data: dispatches } = await supabase
      .from('dispatch_requests')
      .select('*')
      .eq('is_aco_dispatch', true)
      .eq('county', county)
      .gte('created_at', startDate.toISOString());

    if (!dispatches) {
      setLoading(false);
      return;
    }

    // Calculate metrics
    const completed = dispatches.filter(d => d.status === 'COMPLETED');
    const pending = dispatches.filter(d => ['PENDING', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED'].includes(d.status));

    // Average response time (from created to acknowledged)
    const respondedDispatches = dispatches.filter(d => d.acknowledged_at);
    let avgResponse = 0;
    if (respondedDispatches.length > 0) {
      const totalMinutes = respondedDispatches.reduce((sum, d) => {
        const created = new Date(d.created_at).getTime();
        const acknowledged = new Date(d.acknowledged_at).getTime();
        return sum + (acknowledged - created) / (1000 * 60);
      }, 0);
      avgResponse = Math.round(totalMinutes / respondedDispatches.length);
    }

    // ACO vs volunteer (check aco_officer_id presence)
    const acoResponses = dispatches.filter(d => d.aco_officer_id).length;

    // Resolution breakdown
    const resolutionCounts: Record<string, number> = {};
    completed.forEach(d => {
      const code = d.resolution_code || 'UNSPECIFIED';
      resolutionCounts[code] = (resolutionCounts[code] || 0) + 1;
    });

    // Trigger breakdown
    const triggerCounts: Record<string, number> = {};
    dispatches.forEach(d => {
      (d.law_triggers || []).forEach((trigger: string) => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    });

    // Dispatches by day
    const dayCountsMap: Record<string, number> = {};
    dispatches.forEach(d => {
      const date = new Date(d.created_at).toISOString().split('T')[0];
      dayCountsMap[date] = (dayCountsMap[date] || 0) + 1;
    });

    setMetrics({
      totalDispatches: dispatches.length,
      completedDispatches: completed.length,
      pendingDispatches: pending.length,
      avgResponseMinutes: avgResponse,
      acoResponses,
      volunteerResponses: dispatches.length - acoResponses,
      resolutionBreakdown: Object.entries(resolutionCounts)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count),
      triggerBreakdown: Object.entries(triggerCounts)
        .map(([trigger, count]) => ({ trigger, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      dispatchesByDay: Object.entries(dayCountsMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });

    setLoading(false);
  }

  const completionRate = metrics ? 
    Math.round((metrics.completedDispatches / Math.max(metrics.totalDispatches, 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/aco" className="text-blue-300 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">ACO Metrics & Analytics</h1>
                <p className="text-blue-200 text-sm">Accountability dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="bg-blue-800 text-white px-3 py-2 rounded text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value as 'GREENBRIER' | 'KANAWHA')}
                className="bg-blue-800 text-white px-3 py-2 rounded"
              >
                <option value="GREENBRIER">Greenbrier County</option>
                <option value="KANAWHA">Kanawha County</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading metrics...</div>
        ) : !metrics ? (
          <div className="text-center text-slate-500 py-12">No data available</div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs">Total Dispatches</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{metrics.totalDispatches}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Completion Rate</span>
                  </div>
                  <div className="text-3xl font-bold text-green-400">{completionRate}%</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Avg Response Time</span>
                  </div>
                  <div className="text-3xl font-bold text-amber-400">
                    {metrics.avgResponseMinutes > 0 ? `${metrics.avgResponseMinutes}m` : 'N/A'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Pending</span>
                  </div>
                  <div className="text-3xl font-bold text-red-400">{metrics.pendingDispatches}</div>
                </CardContent>
              </Card>
            </div>

            {/* ACO vs Others */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Response Source
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">ACO Officer Responses</span>
                        <span className="text-blue-400">{metrics.acoResponses}</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(metrics.acoResponses / Math.max(metrics.totalDispatches, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">Volunteer/911 Responses</span>
                        <span className="text-emerald-400">{metrics.volunteerResponses}</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(metrics.volunteerResponses / Math.max(metrics.totalDispatches, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {metrics.acoResponses === 0 && metrics.totalDispatches > 0 && (
                    <p className="mt-4 text-amber-400 text-sm">
                      ⚠️ No ACO responses recorded. Volunteers are covering all dispatches.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Resolution Outcomes
                  </h3>
                  {metrics.resolutionBreakdown.length === 0 ? (
                    <p className="text-slate-500">No completed dispatches yet</p>
                  ) : (
                    <div className="space-y-2">
                      {metrics.resolutionBreakdown.map(({ code, count }) => (
                        <div key={code} className="flex items-center justify-between">
                          <span className="text-slate-300 text-sm">{code.replace(/_/g, ' ')}</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Triggers */}
            <Card className="bg-slate-800 border-slate-700 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Top Law Triggers</h3>
                {metrics.triggerBreakdown.length === 0 ? (
                  <p className="text-slate-500">No trigger data available</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {metrics.triggerBreakdown.map(({ trigger, count }) => (
                      <div key={trigger} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                        <span className="text-slate-300 text-sm">{trigger.replace(/_/g, ' ')}</span>
                        <span className="text-amber-400 font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Volume */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Daily Dispatch Volume</h3>
                {metrics.dispatchesByDay.length === 0 ? (
                  <p className="text-slate-500">No dispatch data available</p>
                ) : (
                  <div className="flex items-end gap-1 h-32">
                    {metrics.dispatchesByDay.map(({ date, count }) => {
                      const maxCount = Math.max(...metrics.dispatchesByDay.map(d => d.count));
                      const height = (count / Math.max(maxCount, 1)) * 100;
                      return (
                        <div 
                          key={date} 
                          className="flex-1 bg-blue-600 rounded-t hover:bg-blue-500 transition-colors relative group"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        >
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                            {new Date(date).toLocaleDateString()}: {count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accountability Notice */}
            <div className="mt-8 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <h4 className="font-bold text-blue-300 mb-2">📊 Accountability Metrics</h4>
              <p className="text-blue-200 text-sm">
                This data provides accountability for ACO responses in {county} County. 
                All dispatches, response times, and outcomes are logged automatically and cannot be altered.
                This data can be used for policy advocacy and performance evaluation.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
