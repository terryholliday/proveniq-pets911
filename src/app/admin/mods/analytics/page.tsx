'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle, Users, 
  MapPin, Truck, Home, Zap, Calendar, Download, Target
} from 'lucide-react';

const DAILY_STATS = [
  { day: 'Mon', missions: 12, avgTime: 18 },
  { day: 'Tue', missions: 15, avgTime: 14 },
  { day: 'Wed', missions: 9, avgTime: 22 },
  { day: 'Thu', missions: 18, avgTime: 12 },
  { day: 'Fri', missions: 21, avgTime: 15 },
  { day: 'Sat', missions: 8, avgTime: 25 },
  { day: 'Sun', missions: 6, avgTime: 20 },
];

const COUNTY_STATS = [
  { county: 'Kanawha', missions: 34, volunteers: 12, avgTime: 14, trend: 'up' },
  { county: 'Cabell', missions: 22, volunteers: 8, avgTime: 18, trend: 'up' },
  { county: 'Greenbrier', missions: 15, volunteers: 5, avgTime: 22, trend: 'down' },
  { county: 'Berkeley', missions: 11, volunteers: 4, avgTime: 25, trend: 'up' },
  { county: 'Monongalia', missions: 9, volunteers: 3, avgTime: 28, trend: 'down' },
];

const TOP_VOLUNTEERS = [
  { name: 'Robert Davis', missions: 23, rating: 5.0, avgTime: 11 },
  { name: 'Sarah Williams', missions: 19, rating: 4.9, avgTime: 13 },
  { name: 'John Mitchell', missions: 17, rating: 4.9, avgTime: 14 },
  { name: 'Lisa Anderson', missions: 14, rating: 4.7, avgTime: 16 },
  { name: 'Amy Thompson', missions: 12, rating: 4.8, avgTime: 18 },
];

export default function ModeratorAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  const stats = {
    totalMissions: 89,
    completionRate: 94,
    avgResponseTime: 17,
    activeVolunteers: 24,
    missionsChange: +12,
    timeChange: -3,
  };

  const maxMissions = Math.max(...DAILY_STATS.map(d => d.missions));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">← Command Center</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Analytics</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-zinc-400 text-sm">Operations metrics and performance tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-zinc-900 rounded-lg p-1">
                <Button size="sm" variant={timeRange === 'week' ? 'default' : 'ghost'} onClick={() => setTimeRange('week')}>Week</Button>
                <Button size="sm" variant={timeRange === 'month' ? 'default' : 'ghost'} onClick={() => setTimeRange('month')}>Month</Button>
                <Button size="sm" variant={timeRange === 'year' ? 'default' : 'ghost'} onClick={() => setTimeRange('year')}>Year</Button>
              </div>
              <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Missions</p>
                  <p className="text-3xl font-bold">{stats.totalMissions}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" />+{stats.missionsChange}% vs last week</p>
                </div>
                <div className="p-3 bg-blue-900/30 rounded-lg"><CheckCircle className="w-6 h-6 text-blue-400" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Completion Rate</p>
                  <p className="text-3xl font-bold">{stats.completionRate}%</p>
                  <p className="text-xs text-zinc-500 mt-1">Target: 95%</p>
                </div>
                <div className="p-3 bg-green-900/30 rounded-lg"><Target className="w-6 h-6 text-green-400" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Avg Response Time</p>
                  <p className="text-3xl font-bold">{stats.avgResponseTime}m</p>
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-1"><TrendingDown className="w-3 h-3" />{stats.timeChange}m faster</p>
                </div>
                <div className="p-3 bg-amber-900/30 rounded-lg"><Clock className="w-6 h-6 text-amber-400" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Active Volunteers</p>
                  <p className="text-3xl font-bold">{stats.activeVolunteers}</p>
                  <p className="text-xs text-zinc-500 mt-1">6 new this week</p>
                </div>
                <div className="p-3 bg-purple-900/30 rounded-lg"><Users className="w-6 h-6 text-purple-400" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Missions Chart */}
          <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" />Missions This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-48">
                {DAILY_STATS.map(day => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-zinc-800 rounded-t relative" style={{ height: `${(day.missions / maxMissions) * 160}px` }}>
                      <div className="absolute inset-0 bg-blue-600 rounded-t opacity-80"></div>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-zinc-300">{day.missions}</div>
                    </div>
                    <span className="text-xs text-zinc-500">{day.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Volunteers */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-amber-400" />Top Volunteers</CardTitle>
              <CardDescription>This week's leaders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TOP_VOLUNTEERS.map((vol, i) => (
                  <div key={vol.name} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-600 text-black' : i === 1 ? 'bg-zinc-400 text-black' : i === 2 ? 'bg-amber-800 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{vol.name}</p>
                      <p className="text-xs text-zinc-500">{vol.missions} missions • ★ {vol.rating}</p>
                    </div>
                    <span className="text-xs text-zinc-400">{vol.avgTime}m avg</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* County Performance */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-green-400" />County Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="text-left py-3 px-2">County</th>
                    <th className="text-center py-3 px-2">Missions</th>
                    <th className="text-center py-3 px-2">Volunteers</th>
                    <th className="text-center py-3 px-2">Avg Response</th>
                    <th className="text-center py-3 px-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {COUNTY_STATS.map(county => (
                    <tr key={county.county} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-2 font-medium">{county.county}</td>
                      <td className="py-3 px-2 text-center">{county.missions}</td>
                      <td className="py-3 px-2 text-center">{county.volunteers}</td>
                      <td className="py-3 px-2 text-center">{county.avgTime}m</td>
                      <td className="py-3 px-2 text-center">
                        {county.trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-400 mx-auto" /> : <TrendingDown className="w-4 h-4 text-red-400 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
