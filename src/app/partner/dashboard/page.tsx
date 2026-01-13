'use client';

import { Bell, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, MapPin } from 'lucide-react';

const MOCK_ALERTS = [
  { id: 1, type: 'STRAY_SIGHTED', location: 'Downtown Lewisburg', time: '15 min ago', status: 'new', urgency: 'urgent' },
  { id: 2, type: 'STRAY_SIGHTED', location: 'White Sulphur Springs', time: '2 hrs ago', status: 'acknowledged', urgency: 'normal' },
  { id: 3, type: 'TRANSPORT_NEEDED', location: 'Rainelle', time: '4 hrs ago', status: 'pending', urgency: 'normal' },
];

const MOCK_RECENT_CASES = [
  { id: 'GHC-2026-0142', animal: 'Brown Tabby Cat', status: 'intake', date: 'Today' },
  { id: 'GHC-2026-0141', animal: 'Black Lab Mix', status: 'reunited', date: 'Yesterday' },
  { id: 'GHC-2026-0140', animal: 'Orange Tabby', status: 'adopted', date: 'Jan 10' },
];

export default function PartnerDashboard() {
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
          <div className="text-2xl font-bold">3</div>
          <div className="text-xs text-amber-500">1 urgent</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">Cases This Month</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">24</div>
          <div className="text-xs text-green-500">+12% from last month</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">Reunification Rate</span>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">67%</div>
          <div className="text-xs text-zinc-500">County avg: 42%</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">Avg Response Time</span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">2.3h</div>
          <div className="text-xs text-zinc-500">Target: &lt;4h</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold">Active Alerts</h2>
            <a href="/partner/alerts" className="text-xs text-amber-500 hover:underline">View All</a>
          </div>
          <div className="divide-y divide-zinc-800">
            {MOCK_ALERTS.map(alert => (
              <div key={alert.id} className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 ${alert.urgency === 'urgent' ? 'text-red-500' : 'text-amber-500'}`}>
                  {alert.urgency === 'urgent' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <MapPin className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{alert.type.replace('_', ' ')}</span>
                    {alert.urgency === 'urgent' && (
                      <span className="text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded">URGENT</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">{alert.location}</div>
                  <div className="text-xs text-zinc-600 mt-1">{alert.time}</div>
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    alert.status === 'new' ? 'bg-amber-900/50 text-amber-400' :
                    alert.status === 'acknowledged' ? 'bg-blue-900/50 text-blue-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold">Recent Cases</h2>
            <a href="/partner/cases" className="text-xs text-amber-500 hover:underline">View All</a>
          </div>
          <div className="divide-y divide-zinc-800">
            {MOCK_RECENT_CASES.map(caseItem => (
              <div key={caseItem.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{caseItem.animal}</div>
                  <div className="text-xs text-zinc-500">{caseItem.id}</div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    caseItem.status === 'intake' ? 'bg-amber-900/50 text-amber-400' :
                    caseItem.status === 'reunited' ? 'bg-green-900/50 text-green-400' :
                    'bg-blue-900/50 text-blue-400'
                  }`}>
                    {caseItem.status}
                  </span>
                  <div className="text-xs text-zinc-600 mt-1">{caseItem.date}</div>
                </div>
              </div>
            ))}
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
