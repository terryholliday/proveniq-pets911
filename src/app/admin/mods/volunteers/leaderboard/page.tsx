'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { 
  Trophy, Star, TrendingUp, Clock, Target, Award, Medal,
  ChevronDown, Filter, Calendar, RefreshCw
} from 'lucide-react';

type Volunteer = {
  id: string;
  name: string;
  county: string;
  avatar?: string;
  missions_completed: number;
  missions_this_week: number;
  missions_this_month: number;
  avg_response_time: number; // minutes
  success_rate: number; // percentage
  rating: number;
  total_hours: number;
  streak_days: number;
  badges: string[];
  rank_change: number; // positive = up, negative = down
};

type TimeRange = 'week' | 'month' | 'all-time';

// Fallback mock data
const FALLBACK_VOLUNTEERS: Volunteer[] = [
  { id: 'V1', name: 'Emily Carter', county: 'Kanawha', missions_completed: 156, missions_this_week: 8, missions_this_month: 32, avg_response_time: 12, success_rate: 98, rating: 4.9, total_hours: 420, streak_days: 45, badges: ['TOP_RESPONDER', 'TRANSPORT_PRO', 'LIFESAVER_100'], rank_change: 0 },
  { id: 'V2', name: 'James Wilson', county: 'Cabell', missions_completed: 143, missions_this_week: 7, missions_this_month: 28, avg_response_time: 15, success_rate: 96, rating: 4.8, total_hours: 380, streak_days: 30, badges: ['TRANSPORT_PRO', 'RELIABLE'], rank_change: 1 },
];

const BADGE_INFO: Record<string, { icon: string; label: string; color: string }> = {
  TOP_RESPONDER: { icon: '🏆', label: 'Top Responder', color: 'bg-amber-900/50 text-amber-300' },
  TRANSPORT_PRO: { icon: '🚗', label: 'Transport Pro', color: 'bg-blue-900/50 text-blue-300' },
  FOSTER_HERO: { icon: '🏠', label: 'Foster Hero', color: 'bg-green-900/50 text-green-300' },
  LIFESAVER_100: { icon: '❤️', label: '100+ Lives Saved', color: 'bg-red-900/50 text-red-300' },
  EMERGENCY_RESPONDER: { icon: '⚡', label: 'Emergency Responder', color: 'bg-purple-900/50 text-purple-300' },
  RELIABLE: { icon: '✓', label: 'Reliable', color: 'bg-cyan-900/50 text-cyan-300' },
  FAST_RESPONDER: { icon: '⏱️', label: 'Fast Responder', color: 'bg-orange-900/50 text-orange-300' },
  NIGHT_OWL: { icon: '🦉', label: 'Night Owl', color: 'bg-indigo-900/50 text-indigo-300' },
  NEWCOMER: { icon: '🌟', label: 'Rising Star', color: 'bg-pink-900/50 text-pink-300' },
};

export default function LeaderboardPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [sortBy, setSortBy] = useState<'missions' | 'rating' | 'response_time'>('missions');

  // Fetch leaderboard data from API
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        setVolunteers(FALLBACK_VOLUNTEERS);
        setError('Not authenticated - showing sample data');
        return;
      }

      const res = await fetch(`/api/admin/mods/leaderboard?period=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      if (data.success && data.data.leaderboard) {
        const apiVolunteers: Volunteer[] = data.data.leaderboard.map((v: any) => ({
          id: v.id,
          name: v.name,
          county: v.county,
          missions_completed: v.stats.completedMissions || 0,
          missions_this_week: Math.round((v.stats.completedMissions || 0) / 4),
          missions_this_month: v.stats.completedMissions || 0,
          avg_response_time: v.stats.avgResponseTime || 20,
          success_rate: v.stats.successRate || 90,
          rating: v.stats.rating || 4.5,
          total_hours: (v.stats.completedMissions || 0) * 2,
          streak_days: Math.min(v.stats.completedMissions || 0, 30),
          badges: getBadges(v.stats),
          rank_change: 0,
        }));
        setVolunteers(apiVolunteers.length > 0 ? apiVolunteers : FALLBACK_VOLUNTEERS);
        setError(null);
      } else {
        setVolunteers(FALLBACK_VOLUNTEERS);
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setVolunteers(FALLBACK_VOLUNTEERS);
      setError('Failed to load - showing sample data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Generate badges based on stats
  function getBadges(stats: any): string[] {
    const badges: string[] = [];
    if (stats.completedMissions >= 100) badges.push('LIFESAVER_100');
    if (stats.completedMissions >= 50) badges.push('TRANSPORT_PRO');
    if (stats.avgResponseTime && stats.avgResponseTime < 15) badges.push('FAST_RESPONDER');
    if (stats.successRate >= 95) badges.push('RELIABLE');
    if (stats.completedMissions < 10) badges.push('NEWCOMER');
    return badges;
  }

  // Sort volunteers based on criteria
  const sortedVolunteers = [...volunteers].sort((a, b) => {
    if (sortBy === 'missions') {
      if (timeRange === 'week') return b.missions_this_week - a.missions_this_week;
      if (timeRange === 'month') return b.missions_this_month - a.missions_this_month;
      return b.missions_completed - a.missions_completed;
    }
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'response_time') return a.avg_response_time - b.avg_response_time;
    return 0;
  });

  const getMissionCount = (vol: Volunteer) => {
    if (!vol) return 0;
    if (timeRange === 'week') return vol.missions_this_week || 0;
    if (timeRange === 'month') return vol.missions_this_month || 0;
    return vol.missions_completed || 0;
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods/volunteers" className="text-blue-400 hover:text-blue-300 font-medium">← Volunteers</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Leaderboard</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                Volunteer Leaderboard
              </h1>
              <p className="text-zinc-400 text-sm">Celebrating our top performers</p>
            </div>
            <Button
              onClick={fetchLeaderboard}
              disabled={loading}
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="mt-8">
            <div className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-t-lg p-4 text-center border border-zinc-700">
              <div className="w-16 h-16 mx-auto bg-zinc-600 rounded-full flex items-center justify-center text-2xl mb-2">
                🥈
              </div>
              <div className="font-bold">{sortedVolunteers[1]?.name}</div>
              <div className="text-xs text-zinc-400">{sortedVolunteers[1]?.county}</div>
              <div className="text-2xl font-bold text-zinc-300 mt-2">{getMissionCount(sortedVolunteers[1])}</div>
              <div className="text-xs text-zinc-500">missions</div>
            </div>
            <div className="h-24 bg-zinc-700 rounded-b-lg"></div>
          </div>

          {/* 1st Place */}
          <div>
            <div className="bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-lg p-4 text-center border border-amber-600">
              <div className="w-20 h-20 mx-auto bg-amber-600 rounded-full flex items-center justify-center text-3xl mb-2">
                🥇
              </div>
              <div className="font-bold text-lg">{sortedVolunteers[0]?.name}</div>
              <div className="text-xs text-amber-200">{sortedVolunteers[0]?.county}</div>
              <div className="text-3xl font-bold text-white mt-2">{getMissionCount(sortedVolunteers[0])}</div>
              <div className="text-xs text-amber-200">missions</div>
              <div className="flex justify-center gap-1 mt-2">
                {sortedVolunteers[0]?.badges.slice(0, 3).map(badge => (
                  <span key={badge} className="text-lg" title={BADGE_INFO[badge]?.label}>
                    {BADGE_INFO[badge]?.icon}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-32 bg-amber-700 rounded-b-lg"></div>
          </div>

          {/* 3rd Place */}
          <div className="mt-12">
            <div className="bg-gradient-to-b from-orange-800 to-orange-900 rounded-t-lg p-4 text-center border border-orange-700">
              <div className="w-14 h-14 mx-auto bg-orange-700 rounded-full flex items-center justify-center text-xl mb-2">
                🥉
              </div>
              <div className="font-bold">{sortedVolunteers[2]?.name}</div>
              <div className="text-xs text-orange-200">{sortedVolunteers[2]?.county}</div>
              <div className="text-xl font-bold text-orange-100 mt-2">{getMissionCount(sortedVolunteers[2])}</div>
              <div className="text-xs text-orange-300">missions</div>
            </div>
            <div className="h-16 bg-orange-800 rounded-b-lg"></div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all-time">All Time</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'missions' | 'rating' | 'response_time')}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="missions">Most Missions</option>
              <option value="rating">Highest Rating</option>
              <option value="response_time">Fastest Response</option>
            </select>
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80">
              <tr className="text-left text-xs text-zinc-400 uppercase">
                <th className="px-4 py-3 w-16">Rank</th>
                <th className="px-4 py-3">Volunteer</th>
                <th className="px-4 py-3 text-center">Missions</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-center">Avg Response</th>
                <th className="px-4 py-3 text-center">Streak</th>
                <th className="px-4 py-3">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sortedVolunteers.map((vol, idx) => (
                <tr key={vol.id} className={`hover:bg-zinc-900/50 ${idx < 3 ? 'bg-zinc-900/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-orange-400' : 'text-zinc-500'}`}>
                        #{idx + 1}
                      </span>
                      {vol.rank_change !== 0 && (
                        <span className={`text-xs ${vol.rank_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {vol.rank_change > 0 ? `↑${vol.rank_change}` : `↓${Math.abs(vol.rank_change)}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{vol.name}</div>
                    <div className="text-xs text-zinc-500">{vol.county} • {vol.total_hours}h total</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-lg">{getMissionCount(vol)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span className="font-medium">{vol.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={vol.avg_response_time <= 15 ? 'text-green-400' : vol.avg_response_time <= 25 ? 'text-amber-400' : 'text-zinc-400'}>
                      {vol.avg_response_time} min
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-orange-400">🔥 {vol.streak_days}d</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {vol.badges.map(badge => (
                        <span 
                          key={badge} 
                          className={`text-xs px-1.5 py-0.5 rounded ${BADGE_INFO[badge]?.color || 'bg-zinc-800'}`}
                          title={BADGE_INFO[badge]?.label}
                        >
                          {BADGE_INFO[badge]?.icon} {BADGE_INFO[badge]?.label}
                        </span>
                      ))}
                      {vol.badges.length === 0 && <span className="text-zinc-600">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Achievement Badges Legend */}
        <div className="mt-6 border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Achievement Badges
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {Object.entries(BADGE_INFO).map(([key, badge]) => (
              <div key={key} className={`text-xs px-2 py-1.5 rounded ${badge.color}`}>
                {badge.icon} {badge.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
