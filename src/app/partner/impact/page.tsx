'use client';

import { TrendingUp, Users, Clock, CheckCircle, Heart, Home } from 'lucide-react';

export default function PartnerImpactPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Impact Dashboard</h1>
        <p className="text-zinc-500 text-sm">Track your organization&apos;s community impact</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 border border-green-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-zinc-400">Lives Saved</span>
          </div>
          <div className="text-3xl font-bold text-green-400">247</div>
          <div className="text-xs text-zinc-500 mt-1">This year</div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 border border-blue-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-zinc-400">Reunifications</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">89</div>
          <div className="text-xs text-zinc-500 mt-1">67% reunification rate</div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 border border-purple-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-zinc-400">Adoptions</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">124</div>
          <div className="text-xs text-zinc-500 mt-1">+18% from last year</div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/30 border border-amber-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-zinc-400">Avg Response</span>
          </div>
          <div className="text-3xl font-bold text-amber-400">2.3h</div>
          <div className="text-xs text-zinc-500 mt-1">County avg: 6.8h</div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Monthly Intake vs Outcomes</h3>
          <div className="space-y-3">
            {['Jan', 'Dec', 'Nov', 'Oct'].map((month, i) => (
              <div key={month} className="flex items-center gap-4">
                <span className="text-sm text-zinc-500 w-8">{month}</span>
                <div className="flex-1 flex gap-1">
                  <div className="h-6 bg-amber-900/50 rounded" style={{ width: `${30 - i * 3}%` }} title="Intake" />
                  <div className="h-6 bg-green-900/50 rounded" style={{ width: `${25 - i * 2}%` }} title="Reunited" />
                  <div className="h-6 bg-blue-900/50 rounded" style={{ width: `${20 - i * 2}%` }} title="Adopted" />
                </div>
                <span className="text-xs text-zinc-500">{75 - i * 8} total</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-900/50 rounded" /> Intake</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-900/50 rounded" /> Reunited</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-900/50 rounded" /> Adopted</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Volunteer Hours Contributed</h3>
          <div className="text-center py-8">
            <div className="text-5xl font-bold text-amber-500 mb-2">1,247</div>
            <div className="text-zinc-400">Total volunteer hours this year</div>
            <div className="text-sm text-zinc-500 mt-2">Equivalent to ~$31,175 in labor value</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center border-t border-zinc-800 pt-4">
            <div>
              <div className="font-bold">523</div>
              <div className="text-xs text-zinc-500">Transport</div>
            </div>
            <div>
              <div className="font-bold">412</div>
              <div className="text-xs text-zinc-500">Foster Care</div>
            </div>
            <div>
              <div className="font-bold">312</div>
              <div className="text-xs text-zinc-500">Field Ops</div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="font-semibold mb-4">How You Compare</h3>
        <p className="text-sm text-zinc-500 mb-6">Your performance vs. state and national averages</p>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Reunification Rate</span>
              <span className="text-green-400">67% (You) vs 42% (State Avg)</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '67%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Average Response Time</span>
              <span className="text-green-400">2.3h (You) vs 6.8h (State Avg)</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Live Release Rate</span>
              <span className="text-green-400">94% (You) vs 78% (State Avg)</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
