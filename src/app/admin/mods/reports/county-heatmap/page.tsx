'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Users, TrendingUp, AlertTriangle, Download,
  Clock, Calendar, ChevronDown
} from 'lucide-react';

type CountyData = {
  name: string;
  volunteers: number;
  shifts_week: number;
  avg_response_time: number;
  cases_month: number;
  coverage_score: number;
  population: number;
  area_sq_miles: number;
};

const WV_COUNTIES: CountyData[] = [
  { name: 'KANAWHA', volunteers: 24, shifts_week: 42, avg_response_time: 18, cases_month: 45, coverage_score: 92, population: 178124, area_sq_miles: 903 },
  { name: 'CABELL', volunteers: 18, shifts_week: 32, avg_response_time: 22, cases_month: 38, coverage_score: 85, population: 91436, area_sq_miles: 281 },
  { name: 'BERKELEY', volunteers: 15, shifts_week: 28, avg_response_time: 25, cases_month: 32, coverage_score: 78, population: 117615, area_sq_miles: 321 },
  { name: 'MONONGALIA', volunteers: 12, shifts_week: 22, avg_response_time: 28, cases_month: 25, coverage_score: 72, population: 105612, area_sq_miles: 361 },
  { name: 'WOOD', volunteers: 10, shifts_week: 18, avg_response_time: 32, cases_month: 20, coverage_score: 65, population: 83518, area_sq_miles: 367 },
  { name: 'RALEIGH', volunteers: 8, shifts_week: 14, avg_response_time: 35, cases_month: 18, coverage_score: 58, population: 73361, area_sq_miles: 607 },
  { name: 'HARRISON', volunteers: 7, shifts_week: 12, avg_response_time: 38, cases_month: 15, coverage_score: 52, population: 66469, area_sq_miles: 416 },
  { name: 'MARION', volunteers: 6, shifts_week: 10, avg_response_time: 40, cases_month: 12, coverage_score: 48, population: 55705, area_sq_miles: 309 },
  { name: 'PUTNAM', volunteers: 5, shifts_week: 8, avg_response_time: 42, cases_month: 10, coverage_score: 45, population: 57358, area_sq_miles: 346 },
  { name: 'MERCER', volunteers: 4, shifts_week: 6, avg_response_time: 48, cases_month: 8, coverage_score: 38, population: 57709, area_sq_miles: 420 },
  { name: 'FAYETTE', volunteers: 3, shifts_week: 4, avg_response_time: 55, cases_month: 6, coverage_score: 32, population: 41425, area_sq_miles: 664 },
  { name: 'JEFFERSON', volunteers: 5, shifts_week: 8, avg_response_time: 30, cases_month: 12, coverage_score: 55, population: 56179, area_sq_miles: 210 },
  { name: 'GREENBRIER', volunteers: 4, shifts_week: 6, avg_response_time: 50, cases_month: 8, coverage_score: 35, population: 33846, area_sq_miles: 1021 },
  { name: 'OHIO', volunteers: 6, shifts_week: 10, avg_response_time: 35, cases_month: 14, coverage_score: 52, population: 41411, area_sq_miles: 106 },
  { name: 'LOGAN', volunteers: 2, shifts_week: 3, avg_response_time: 60, cases_month: 4, coverage_score: 25, population: 32019, area_sq_miles: 454 },
  { name: 'WAYNE', volunteers: 3, shifts_week: 5, avg_response_time: 45, cases_month: 6, coverage_score: 35, population: 38992, area_sq_miles: 506 },
];

export default function CountyHeatmapPage() {
  const [counties] = useState<CountyData[]>(WV_COUNTIES);
  const [sortBy, setSortBy] = useState<'coverage' | 'volunteers' | 'response' | 'cases'>('coverage');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const sortedCounties = [...counties].sort((a, b) => {
    switch (sortBy) {
      case 'coverage': return b.coverage_score - a.coverage_score;
      case 'volunteers': return b.volunteers - a.volunteers;
      case 'response': return a.avg_response_time - b.avg_response_time;
      case 'cases': return b.cases_month - a.cases_month;
      default: return 0;
    }
  });

  const stats = {
    totalVolunteers: counties.reduce((sum, c) => sum + c.volunteers, 0),
    totalShifts: counties.reduce((sum, c) => sum + c.shifts_week, 0),
    avgCoverage: Math.round(counties.reduce((sum, c) => sum + c.coverage_score, 0) / counties.length),
    criticalCounties: counties.filter(c => c.coverage_score < 40).length,
    avgResponseTime: Math.round(counties.reduce((sum, c) => sum + c.avg_response_time, 0) / counties.length),
  };

  const getCoverageColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-green-500';
    if (score >= 40) return 'bg-amber-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const getCoverageTextColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-green-300';
    if (score >= 40) return 'text-amber-400';
    if (score >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">← Command Center</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Reports</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">County Coverage</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-400" />
                County Coverage Heatmap
              </h1>
              <p className="text-zinc-400 text-sm">Visualize volunteer distribution across West Virginia</p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalVolunteers}</div>
            <div className="text-xs text-zinc-500">Total Volunteers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.totalShifts}</div>
            <div className="text-xs text-zinc-500">Weekly Shifts</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getCoverageTextColor(stats.avgCoverage)}`}>{stats.avgCoverage}%</div>
            <div className="text-xs text-zinc-500">Avg Coverage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.avgResponseTime}m</div>
            <div className="text-xs text-zinc-500">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.criticalCounties}</div>
            <div className="text-xs text-zinc-500">Critical Counties</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-6 text-sm">
          <span className="text-zinc-400">Coverage:</span>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-green-600"></div> 80%+</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-green-500"></div> 60-79%</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-amber-500"></div> 40-59%</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-orange-500"></div> 20-39%</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-red-600"></div> &lt;20%</div>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 mb-6">
          {(['coverage', 'volunteers', 'response', 'cases'] as const).map(option => (
            <Button
              key={option}
              variant={sortBy === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(option)}
              className={sortBy === option ? 'bg-blue-600' : ''}
            >
              {option === 'coverage' && 'Coverage Score'}
              {option === 'volunteers' && 'Volunteers'}
              {option === 'response' && 'Response Time'}
              {option === 'cases' && 'Cases'}
            </Button>
          ))}
        </div>

        {/* County Grid - Visual Heatmap */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {sortedCounties.map((county, idx) => (
            <div
              key={county.name}
              onClick={() => setShowDetails(showDetails === county.name ? null : county.name)}
              className={`relative rounded-lg p-4 cursor-pointer transition-all ${getCoverageColor(county.coverage_score)} ${
                showDetails === county.name ? 'ring-2 ring-white' : 'hover:ring-1 hover:ring-white/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white">{county.name}</span>
                <span className="text-xs bg-black/30 px-2 py-0.5 rounded">{county.coverage_score}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
                <div><Users className="w-3 h-3 inline mr-1" />{county.volunteers}</div>
                <div><Clock className="w-3 h-3 inline mr-1" />{county.avg_response_time}m</div>
              </div>
              
              {/* Expanded Details */}
              {showDetails === county.name && (
                <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/90 space-y-1">
                  <div className="flex justify-between">
                    <span>Weekly Shifts:</span>
                    <span className="font-medium">{county.shifts_week}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Cases:</span>
                    <span className="font-medium">{county.cases_month}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Population:</span>
                    <span className="font-medium">{county.population.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Area:</span>
                    <span className="font-medium">{county.area_sq_miles} sq mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vol/10k Pop:</span>
                    <span className="font-medium">{((county.volunteers / county.population) * 10000).toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Critical Counties Alert */}
        {stats.criticalCounties > 0 && (
          <Card className="bg-red-900/20 border-red-800 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Critical Coverage Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {counties.filter(c => c.coverage_score < 40).map(county => (
                  <div key={county.name} className="flex items-center justify-between p-3 rounded bg-zinc-900/50 border border-red-800/50">
                    <div>
                      <div className="font-medium">{county.name}</div>
                      <div className="text-xs text-zinc-500">
                        {county.volunteers} volunteers • {county.avg_response_time}m response
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-red-600">{county.coverage_score}%</Badge>
                      <div className="text-xs text-zinc-500 mt-1">
                        Need {Math.ceil((40 - county.coverage_score) / 5)} more
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Best Covered Counties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedCounties.slice(0, 5).map((county, idx) => (
                  <div key={county.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-zinc-400 text-black' : idx === 2 ? 'bg-amber-700' : 'bg-zinc-700'
                      }`}>{idx + 1}</span>
                      <div>
                        <div className="font-medium text-sm">{county.name}</div>
                        <div className="text-xs text-zinc-500">{county.volunteers} volunteers</div>
                      </div>
                    </div>
                    <Badge className={getCoverageColor(county.coverage_score)}>{county.coverage_score}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Fastest Response Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...counties].sort((a, b) => a.avg_response_time - b.avg_response_time).slice(0, 5).map((county, idx) => (
                  <div key={county.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-blue-500 text-white' : idx === 1 ? 'bg-zinc-400 text-black' : idx === 2 ? 'bg-blue-700' : 'bg-zinc-700'
                      }`}>{idx + 1}</span>
                      <div>
                        <div className="font-medium text-sm">{county.name}</div>
                        <div className="text-xs text-zinc-500">{county.cases_month} cases/month</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-600">{county.avg_response_time}m</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
