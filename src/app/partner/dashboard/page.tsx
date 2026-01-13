'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, MapPin, Briefcase, Loader2 } from 'lucide-react';

interface IncomingCase {
  id: string;
  case_number: string;
  case_type: string;
  description?: string;
  location_county: string;
  total_animals: number;
  status: string;
  urgency?: string;
  created_at: string;
}

interface DashboardStats {
  active_alerts: number;
  urgent_count: number;
  cases_this_month: number;
  reunification_rate: number;
  avg_response_hours: number;
}

export default function PartnerDashboard() {
  const [incomingCases, setIncomingCases] = useState<IncomingCase[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [casesRes, statsRes] = await Promise.all([
        fetch('/api/partner/incoming-cases'),
        fetch('/api/partner/stats'),
      ]);

      if (casesRes.ok) {
        const data = await casesRes.json();
        setIncomingCases(data.cases || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Partner Dashboard</h1>
        <p className="text-zinc-500 text-sm">Welcome back. Here&apos;s what&apos;s happening in your service area.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">Active Alerts</span>
            <Bell className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{stats?.active_alerts ?? 0}</div>
          <div className="text-xs text-amber-500">{stats?.urgent_count ?? 0} urgent</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">Cases This Month</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats?.cases_this_month ?? 0}</div>
          <div className="text-xs text-green-500">Tracking progress</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">Reunification Rate</span>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{stats?.reunification_rate ?? 0}%</div>
          <div className="text-xs text-blue-500">Goal: 90%</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">Avg Response Time</span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">{stats?.avg_response_hours ?? 0}h</div>
          <div className="text-xs text-purple-500">Target: &lt;3h</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Incoming Cases from PetMayday */}
        <div className="bg-zinc-900 border border-amber-800/50 rounded-lg">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-500" />
              Incoming Cases
            </h2>
            <Link href="/partner/cases" className="text-xs text-amber-500 hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" />
            </div>
          ) : incomingCases.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No incoming cases in your area
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {incomingCases.slice(0, 5).map(caseItem => (
                <div key={caseItem.id} className="p-4 flex items-start gap-3">
                  <div className={`mt-0.5 ${caseItem.urgency === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>
                    {caseItem.urgency === 'CRITICAL' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <MapPin className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{caseItem.case_type.replace(/_/g, ' ')}</span>
                      {caseItem.urgency === 'CRITICAL' && (
                        <span className="text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded">URGENT</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {caseItem.total_animals} animal{caseItem.total_animals !== 1 ? 's' : ''} • {caseItem.location_county}
                    </div>
                    <div className="text-xs text-zinc-600 mt-1">{formatTimeAgo(caseItem.created_at)}</div>
                  </div>
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      caseItem.status === 'OPEN' ? 'bg-amber-900/50 text-amber-400' :
                      caseItem.status === 'IN_PROGRESS' ? 'bg-blue-900/50 text-blue-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Link href="/partner/intake" className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
              <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
              <div className="text-sm font-medium">New Intake</div>
              <div className="text-xs text-zinc-500">Log animal arrival</div>
            </Link>
            <Link href="/partner/capacity" className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
              <TrendingUp className="h-6 w-6 text-orange-500 mb-2" />
              <div className="text-sm font-medium">Update Capacity</div>
              <div className="text-xs text-zinc-500">Current head count</div>
            </Link>
            <Link href="/partner/transport" className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
              <Users className="h-6 w-6 text-blue-500 mb-2" />
              <div className="text-sm font-medium">Request Transport</div>
              <div className="text-xs text-zinc-500">Find a driver</div>
            </Link>
            <Link href="/partner/broadcast" className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
              <Bell className="h-6 w-6 text-amber-500 mb-2" />
              <div className="text-sm font-medium">Broadcast</div>
              <div className="text-xs text-zinc-500">Alert volunteers</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Network Status */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Volunteer Network</h2>
          <a href="/partner/volunteers" className="text-xs text-amber-500 hover:underline">Manage</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">8</div>
            <div className="text-xs text-zinc-500">Active Now</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">24</div>
            <div className="text-xs text-zinc-500">Total Volunteers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-zinc-500">Transporters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-zinc-500">Foster Homes</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-left">
          <Bell className="h-5 w-5 text-amber-500 mb-2" />
          <div className="text-sm font-medium">Broadcast Alert</div>
          <div className="text-xs text-zinc-500">Notify volunteers</div>
        </button>
        <button className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-left">
          <Users className="h-5 w-5 text-blue-500 mb-2" />
          <div className="text-sm font-medium">Request Transport</div>
          <div className="text-xs text-zinc-500">Find a driver</div>
        </button>
        <button className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-left">
          <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
          <div className="text-sm font-medium">Log Intake</div>
          <div className="text-xs text-zinc-500">New animal arrival</div>
        </button>
        <button className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-left">
          <TrendingUp className="h-5 w-5 text-purple-500 mb-2" />
          <div className="text-sm font-medium">View Reports</div>
          <div className="text-xs text-zinc-500">Impact metrics</div>
        </button>
      </div>
    </div>
  );
}
