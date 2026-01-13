'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Clock, Calendar, TrendingUp, Award, Download,
  ChevronLeft, ChevronRight, Search, Filter, MapPin
} from 'lucide-react';

type VolunteerActivity = {
  id: string;
  name: string;
  county: string;
  total_hours: number;
  shifts_completed: number;
  cases_handled: number;
  response_rate: number;
  last_active: string;
  status: 'active' | 'inactive' | 'on_leave';
  certifications: string[];
};

// Mock data
const MOCK_VOLUNTEERS: VolunteerActivity[] = [
  { id: 'V1', name: 'Emily Carter', county: 'KANAWHA', total_hours: 156, shifts_completed: 24, cases_handled: 18, response_rate: 95, last_active: '2026-01-13', status: 'active', certifications: ['Basic', 'Transport', 'Medical'] },
  { id: 'V2', name: 'James Wilson', county: 'CABELL', total_hours: 128, shifts_completed: 20, cases_handled: 15, response_rate: 88, last_active: '2026-01-12', status: 'active', certifications: ['Basic', 'Transport'] },
  { id: 'V3', name: 'Sarah Martinez', county: 'BERKELEY', total_hours: 98, shifts_completed: 16, cases_handled: 12, response_rate: 92, last_active: '2026-01-11', status: 'active', certifications: ['Basic'] },
  { id: 'V4', name: 'Michael Brown', county: 'RALEIGH', total_hours: 84, shifts_completed: 14, cases_handled: 9, response_rate: 78, last_active: '2026-01-08', status: 'inactive', certifications: ['Basic', 'Medical'] },
  { id: 'V5', name: 'Lisa Anderson', county: 'KANAWHA', total_hours: 72, shifts_completed: 12, cases_handled: 8, response_rate: 85, last_active: '2026-01-13', status: 'active', certifications: ['Basic'] },
  { id: 'V6', name: 'David Thompson', county: 'WOOD', total_hours: 64, shifts_completed: 10, cases_handled: 7, response_rate: 90, last_active: '2026-01-10', status: 'active', certifications: ['Basic', 'Transport'] },
  { id: 'V7', name: 'Jennifer Garcia', county: 'MONONGALIA', total_hours: 48, shifts_completed: 8, cases_handled: 5, response_rate: 82, last_active: '2026-01-05', status: 'on_leave', certifications: ['Basic'] },
  { id: 'V8', name: 'Robert Davis', county: 'GREENBRIER', total_hours: 36, shifts_completed: 6, cases_handled: 4, response_rate: 75, last_active: '2025-12-28', status: 'inactive', certifications: ['Basic'] },
];

export default function VolunteerActivityReportPage() {
  const [volunteers, setVolunteers] = useState<VolunteerActivity[]>(MOCK_VOLUNTEERS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countyFilter, setCountyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'hours' | 'shifts' | 'cases' | 'response'>('hours');
  const [dateRange, setDateRange] = useState('month');

  // Calculate summary stats
  const stats = {
    totalVolunteers: volunteers.length,
    activeVolunteers: volunteers.filter(v => v.status === 'active').length,
    totalHours: volunteers.reduce((sum, v) => sum + v.total_hours, 0),
    totalShifts: volunteers.reduce((sum, v) => sum + v.shifts_completed, 0),
    totalCases: volunteers.reduce((sum, v) => sum + v.cases_handled, 0),
    avgResponseRate: Math.round(volunteers.reduce((sum, v) => sum + v.response_rate, 0) / volunteers.length),
  };

  // Filter and sort volunteers
  const filteredVolunteers = volunteers
    .filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           v.county.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchesCounty = countyFilter === 'all' || v.county === countyFilter;
      return matchesSearch && matchesStatus && matchesCounty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'hours': return b.total_hours - a.total_hours;
        case 'shifts': return b.shifts_completed - a.shifts_completed;
        case 'cases': return b.cases_handled - a.cases_handled;
        case 'response': return b.response_rate - a.response_rate;
        default: return 0;
      }
    });

  const counties = [...new Set(volunteers.map(v => v.county))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-zinc-600';
      case 'on_leave': return 'bg-amber-600';
      default: return 'bg-zinc-600';
    }
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
            <span className="text-zinc-400">Volunteer Activity</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                Volunteer Activity Report
              </h1>
              <p className="text-zinc-400 text-sm">Track volunteer hours, shifts, and performance</p>
            </div>
            <div className="flex gap-2">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
                <option value="year">Last Year</option>
              </select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalVolunteers}</div>
            <div className="text-xs text-zinc-500">Total Volunteers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.activeVolunteers}</div>
            <div className="text-xs text-zinc-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.totalHours}</div>
            <div className="text-xs text-zinc-500">Total Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.totalShifts}</div>
            <div className="text-xs text-zinc-500">Shifts Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-400">{stats.totalCases}</div>
            <div className="text-xs text-zinc-500">Cases Handled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.avgResponseRate}%</div>
            <div className="text-xs text-zinc-500">Avg Response Rate</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search volunteers..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
              />
            </div>
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
          <select 
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="all">All Counties</option>
            {counties.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="hours">Sort by Hours</option>
            <option value="shifts">Sort by Shifts</option>
            <option value="cases">Sort by Cases</option>
            <option value="response">Sort by Response Rate</option>
          </select>
        </div>

        {/* Volunteer Table */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">Volunteer</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">County</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Hours</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Shifts</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Cases</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Response</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">Certifications</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Status</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.map((volunteer, idx) => (
                    <tr key={volunteer.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            idx < 3 ? 'bg-amber-600 text-black' : 'bg-zinc-700'
                          }`}>
                            {idx < 3 ? idx + 1 : volunteer.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{volunteer.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-zinc-400">
                          <MapPin className="w-3 h-3" />
                          {volunteer.county}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-amber-400">{volunteer.total_hours}</span>
                      </td>
                      <td className="py-3 px-4 text-center">{volunteer.shifts_completed}</td>
                      <td className="py-3 px-4 text-center">{volunteer.cases_handled}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={volunteer.response_rate >= 90 ? 'text-green-400' : volunteer.response_rate >= 75 ? 'text-amber-400' : 'text-red-400'}>
                          {volunteer.response_rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {volunteer.certifications.map(cert => (
                            <Badge key={cert} variant="outline" className="text-xs">{cert}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getStatusColor(volunteer.status)}>
                          {volunteer.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-zinc-500">
                        {volunteer.last_active}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Most Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredVolunteers.slice(0, 3).map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-zinc-400 text-black' : 'bg-amber-700'
                      }`}>{i + 1}</span>
                      <span className="text-sm">{v.name}</span>
                    </div>
                    <span className="font-bold text-amber-400">{v.total_hours}h</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Best Response Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...filteredVolunteers].sort((a, b) => b.response_rate - a.response_rate).slice(0, 3).map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-green-500 text-black' : i === 1 ? 'bg-zinc-400 text-black' : 'bg-green-700'
                      }`}>{i + 1}</span>
                      <span className="text-sm">{v.name}</span>
                    </div>
                    <span className="font-bold text-green-400">{v.response_rate}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Most Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...filteredVolunteers].sort((a, b) => b.cases_handled - a.cases_handled).slice(0, 3).map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-purple-500 text-black' : i === 1 ? 'bg-zinc-400 text-black' : 'bg-purple-700'
                      }`}>{i + 1}</span>
                      <span className="text-sm">{v.name}</span>
                    </div>
                    <span className="font-bold text-purple-400">{v.cases_handled}</span>
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
