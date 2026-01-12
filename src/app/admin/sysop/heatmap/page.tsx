'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface CountyData {
  county: string;
  volunteerCount: number;
  activeCount: number;
  casesThisMonth: number;
  avgResponseTime: number;
}

// West Virginia counties with approximate center coordinates
const WV_COUNTIES: Record<string, { lat: number; lng: number; name: string }> = {
  GREENBRIER: { lat: 37.95, lng: -80.45, name: 'Greenbrier' },
  KANAWHA: { lat: 38.35, lng: -81.63, name: 'Kanawha' },
  FAYETTE: { lat: 38.05, lng: -81.10, name: 'Fayette' },
  RALEIGH: { lat: 37.77, lng: -81.25, name: 'Raleigh' },
  MONROE: { lat: 37.55, lng: -80.55, name: 'Monroe' },
  SUMMERS: { lat: 37.65, lng: -80.85, name: 'Summers' },
  POCAHONTAS: { lat: 38.33, lng: -80.00, name: 'Pocahontas' },
  NICHOLAS: { lat: 38.28, lng: -80.80, name: 'Nicholas' },
};

export default function HeatmapPage() {
  const [countyData, setCountyData] = useState<CountyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'volunteers' | 'coverage' | 'activity'>('volunteers');

  useEffect(() => {
    fetchCountyData();
  }, []);

  const fetchCountyData = async () => {
    const supabase = createClient();

    // Get volunteer counts by county
    const { data: volunteers } = await supabase
      .from('volunteers')
      .select('primary_county, status');

    const countyCounts: Record<string, { total: number; active: number }> = {};
    
    (volunteers || []).forEach(v => {
      const county = v.primary_county || 'UNKNOWN';
      if (!countyCounts[county]) {
        countyCounts[county] = { total: 0, active: 0 };
      }
      countyCounts[county].total++;
      if (v.status === 'ACTIVE') {
        countyCounts[county].active++;
      }
    });

    const data: CountyData[] = Object.entries(countyCounts).map(([county, counts]) => ({
      county,
      volunteerCount: counts.total,
      activeCount: counts.active,
      casesThisMonth: Math.floor(Math.random() * 20), // Placeholder
      avgResponseTime: Math.floor(Math.random() * 60) + 10, // Placeholder
    }));

    setCountyData(data);
    setLoading(false);
  };

  const getHeatColor = (value: number, max: number) => {
    const ratio = Math.min(value / max, 1);
    if (ratio === 0) return 'bg-zinc-800';
    if (ratio < 0.25) return 'bg-blue-900';
    if (ratio < 0.5) return 'bg-blue-700';
    if (ratio < 0.75) return 'bg-green-600';
    return 'bg-green-500';
  };

  const maxVolunteers = Math.max(...countyData.map(c => c.volunteerCount), 1);
  const totalVolunteers = countyData.reduce((sum, c) => sum + c.volunteerCount, 0);
  const totalActive = countyData.reduce((sum, c) => sum + c.activeCount, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">🗺️ Volunteer Coverage Heatmap</h1>
          </div>
          <div className="flex gap-2">
            {(['volunteers', 'coverage', 'activity'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm rounded capitalize ${viewMode === mode ? 'bg-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{totalVolunteers}</div>
            <div className="text-xs text-zinc-500">Total Volunteers</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{totalActive}</div>
            <div className="text-xs text-zinc-500">Active</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{countyData.length}</div>
            <div className="text-xs text-zinc-500">Counties Covered</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {Object.keys(WV_COUNTIES).length - countyData.filter(c => WV_COUNTIES[c.county]).length}
            </div>
            <div className="text-xs text-zinc-500">Coverage Gaps</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading heatmap data...</div>
        ) : (
          <>
            {/* Visual Heatmap Grid */}
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
              <h2 className="text-lg font-semibold mb-4">County Coverage</h2>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(WV_COUNTIES).map(([code, info]) => {
                  const data = countyData.find(c => c.county === code);
                  const value = viewMode === 'volunteers' ? (data?.volunteerCount || 0) :
                               viewMode === 'coverage' ? (data?.activeCount || 0) :
                               (data?.casesThisMonth || 0);
                  const maxVal = viewMode === 'volunteers' ? maxVolunteers :
                                viewMode === 'coverage' ? Math.max(...countyData.map(c => c.activeCount), 1) :
                                Math.max(...countyData.map(c => c.casesThisMonth), 1);
                  
                  return (
                    <div
                      key={code}
                      className={`${getHeatColor(value, maxVal)} rounded-lg p-4 transition-all hover:scale-105 cursor-pointer`}
                    >
                      <div className="font-medium">{info.name}</div>
                      <div className="text-2xl font-bold">{value}</div>
                      <div className="text-xs opacity-75">
                        {viewMode === 'volunteers' ? 'volunteers' :
                         viewMode === 'coverage' ? 'active' : 'cases/mo'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* County Details Table */}
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left p-3 font-medium">County</th>
                    <th className="text-center p-3 font-medium">Total</th>
                    <th className="text-center p-3 font-medium">Active</th>
                    <th className="text-center p-3 font-medium">Cases/Month</th>
                    <th className="text-center p-3 font-medium">Avg Response</th>
                    <th className="text-center p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {countyData.sort((a, b) => b.volunteerCount - a.volunteerCount).map(county => (
                    <tr key={county.county} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                      <td className="p-3 font-medium">{WV_COUNTIES[county.county]?.name || county.county}</td>
                      <td className="p-3 text-center">{county.volunteerCount}</td>
                      <td className="p-3 text-center text-green-400">{county.activeCount}</td>
                      <td className="p-3 text-center">{county.casesThisMonth}</td>
                      <td className="p-3 text-center">{county.avgResponseTime} min</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          county.activeCount >= 5 ? 'bg-green-900 text-green-300' :
                          county.activeCount >= 2 ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {county.activeCount >= 5 ? 'Good' : county.activeCount >= 2 ? 'Limited' : 'Critical'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="text-zinc-500">Coverage Level:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-zinc-800 rounded"></div>
                <span className="text-zinc-500">None</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-900 rounded"></div>
                <span className="text-zinc-500">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-700 rounded"></div>
                <span className="text-zinc-500">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className="text-zinc-500">Good</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-zinc-500">Excellent</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
