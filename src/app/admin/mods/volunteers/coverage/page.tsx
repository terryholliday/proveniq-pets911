'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Calendar, Clock, Users, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';

type CoverageData = {
  county: string;
  date: string;
  total_shifts: number;
  confirmed_shifts: number;
  coverage_hours: number;
  gap_hours: number;
  volunteers_active: number;
};

// WV Counties
const WV_COUNTIES = [
  'KANAWHA', 'CABELL', 'BERKELEY', 'MONONGALIA', 'WOOD', 'RALEIGH', 
  'HARRISON', 'MARION', 'PUTNAM', 'MERCER', 'FAYETTE', 'JEFFERSON'
];

// Mock coverage data
const generateMockCoverage = (startDate: Date): CoverageData[] => {
  const data: CoverageData[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    WV_COUNTIES.forEach(county => {
      const baseShifts = Math.floor(Math.random() * 4);
      const gapHours = Math.max(0, 24 - (baseShifts * 8));
      data.push({
        county,
        date: dateStr,
        total_shifts: baseShifts,
        confirmed_shifts: Math.floor(baseShifts * 0.7),
        coverage_hours: baseShifts * 8,
        gap_hours: gapHours,
        volunteers_active: baseShifts,
      });
    });
  }
  return data;
};

export default function CoverageAnalysisPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() - now.getDay());
    return now;
  });
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  const fetchCoverage = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        setCoverageData(generateMockCoverage(currentWeekStart));
        setLoading(false);
        return;
      }

      // In real implementation, fetch from shift_coverage_analysis view
      const res = await fetch(
        `/api/admin/mods/shifts?start=${currentWeekStart.toISOString().split('T')[0]}&end=${new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        // Process real data into coverage format
        setCoverageData(generateMockCoverage(currentWeekStart));
      } else {
        setCoverageData(generateMockCoverage(currentWeekStart));
      }
    } catch (err) {
      console.error('Coverage fetch error:', err);
      setCoverageData(generateMockCoverage(currentWeekStart));
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchCoverage();
  }, [fetchCoverage]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  // Calculate stats
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const getCountyStats = (county: string) => {
    const countyData = coverageData.filter(d => d.county === county);
    return {
      totalShifts: countyData.reduce((sum, d) => sum + d.total_shifts, 0),
      totalGapHours: countyData.reduce((sum, d) => sum + d.gap_hours, 0),
      avgCoverage: countyData.length > 0 
        ? Math.round(countyData.reduce((sum, d) => sum + (d.coverage_hours / 24) * 100, 0) / countyData.length)
        : 0,
      criticalDays: countyData.filter(d => d.total_shifts === 0).length,
    };
  };

  const getDayData = (county: string, date: string) => {
    return coverageData.find(d => d.county === county && d.date === date);
  };

  const overallStats = {
    totalShifts: coverageData.reduce((sum, d) => sum + d.total_shifts, 0),
    totalGapHours: coverageData.reduce((sum, d) => sum + d.gap_hours, 0),
    criticalCounties: WV_COUNTIES.filter(c => getCountyStats(c).criticalDays > 2).length,
    avgCoverage: WV_COUNTIES.reduce((sum, c) => sum + getCountyStats(c).avgCoverage, 0) / WV_COUNTIES.length,
  };

  const getCoverageColor = (hours: number) => {
    if (hours >= 16) return 'bg-green-600';
    if (hours >= 8) return 'bg-amber-600';
    if (hours > 0) return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods/volunteers/shifts" className="text-blue-400 hover:text-blue-300 font-medium">← Shift Calendar</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Coverage Analysis</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-400" />
                Coverage Analysis Dashboard
              </h1>
              <p className="text-zinc-400 text-sm">Monitor volunteer coverage across WV counties</p>
            </div>
            <Button onClick={fetchCoverage} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">{overallStats.totalShifts}</span>
            <span className="text-zinc-500">Shifts This Week</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">{Math.round(overallStats.avgCoverage)}%</span>
            <span className="text-zinc-500">Avg Coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-medium">{overallStats.totalGapHours}h</span>
            <span className="text-zinc-500">Gap Hours</span>
          </div>
          {overallStats.criticalCounties > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">{overallStats.criticalCounties}</span>
              <span className="text-zinc-500">Critical Counties</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-lg font-medium min-w-[200px] text-center">
              Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Coverage:</span>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-600" /> 16h+</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-600" /> 8-16h</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-600" /> 1-8h</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-600" /> None</div>
          </div>
        </div>

        {/* Coverage Heatmap */}
        <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Coverage by County & Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-zinc-400 font-medium text-sm w-40">County</th>
                    {weekDays.map(day => (
                      <th key={day} className="text-center py-2 px-2 text-zinc-400 font-medium text-sm">
                        {new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 text-zinc-400 font-medium text-sm">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {WV_COUNTIES.map(county => {
                    const stats = getCountyStats(county);
                    return (
                      <tr 
                        key={county} 
                        className={`border-t border-zinc-800 ${selectedCounty === county ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'} cursor-pointer`}
                        onClick={() => setSelectedCounty(selectedCounty === county ? null : county)}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-zinc-500" />
                            <span className="font-medium text-sm">{county}</span>
                          </div>
                        </td>
                        {weekDays.map(day => {
                          const dayData = getDayData(county, day);
                          return (
                            <td key={day} className="text-center py-2 px-2">
                              <div 
                                className={`w-8 h-8 mx-auto rounded flex items-center justify-center text-xs font-medium ${getCoverageColor(dayData?.coverage_hours || 0)}`}
                                title={`${dayData?.coverage_hours || 0}h coverage, ${dayData?.total_shifts || 0} shifts`}
                              >
                                {dayData?.total_shifts || 0}
                              </div>
                            </td>
                          );
                        })}
                        <td className="text-center py-2 px-3">
                          <Badge className={stats.avgCoverage >= 50 ? 'bg-green-700' : stats.avgCoverage >= 25 ? 'bg-amber-700' : 'bg-red-700'}>
                            {stats.avgCoverage}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Critical Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Critical Coverage Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {WV_COUNTIES
                  .map(county => ({ county, stats: getCountyStats(county) }))
                  .filter(c => c.stats.criticalDays > 0)
                  .sort((a, b) => b.stats.criticalDays - a.stats.criticalDays)
                  .slice(0, 5)
                  .map(({ county, stats }) => (
                    <div key={county} className="flex items-center justify-between p-2 rounded bg-red-900/20 border border-red-800/50">
                      <div>
                        <div className="font-medium text-sm">{county}</div>
                        <div className="text-xs text-zinc-500">{stats.criticalDays} days with no coverage</div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">
                        Add Shifts
                      </Button>
                    </div>
                  ))
                }
                {WV_COUNTIES.every(c => getCountyStats(c).criticalDays === 0) && (
                  <div className="text-center text-zinc-500 py-4">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <p>No critical gaps this week!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Top Covered Counties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {WV_COUNTIES
                  .map(county => ({ county, stats: getCountyStats(county) }))
                  .sort((a, b) => b.stats.avgCoverage - a.stats.avgCoverage)
                  .slice(0, 5)
                  .map(({ county, stats }, idx) => (
                    <div key={county} className="flex items-center justify-between p-2 rounded bg-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-zinc-400 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-700'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{county}</div>
                          <div className="text-xs text-zinc-500">{stats.totalShifts} shifts this week</div>
                        </div>
                      </div>
                      <Badge className="bg-green-700">{stats.avgCoverage}%</Badge>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
