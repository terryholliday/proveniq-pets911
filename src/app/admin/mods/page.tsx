'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Activity
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type DashboardStats = {
  totalVolunteers: number;
  activeVolunteers: number;
  pendingRequests: number;
  completedToday: number;
  criticalRequests: number;
  countiesCovered: number;
};

type RecentActivity = {
  id: string;
  type: 'REQUEST' | 'ASSIGNMENT' | 'COMPLETION';
  description: string;
  timestamp: string;
  priority?: string;
  county?: string;
};

export default function ModeratorDashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalVolunteers: 0,
    activeVolunteers: 0,
    pendingRequests: 0,
    completedToday: 0,
    criticalRequests: 0,
    countiesCovered: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      loadDashboardData();
    }
  }, [loading, user]);

  const loadDashboardData = async () => {
    setLoadingStats(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // Load dashboard stats
      const statsResponse = await fetch('/api/admin/mods/dashboard', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Load recent activity
      const activityResponse = await fetch('/api/admin/mods/activity', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success) {
          setRecentActivity(activityData.data);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
            <Shield className="w-8 h-8 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-zinc-400">Please sign in to access the moderator dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
              <p className="text-zinc-400 mt-1">Operations management and oversight</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-green-400 border-green-800">
                Active Moderator
              </Badge>
              <Link href="/admin/mods/dispatch">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Dispatch Queue
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-zinc-900/50 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1">
            <Link href="/admin/mods" className="px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-400">
              📊 Overview
            </Link>
            <Link href="/admin/mods/dispatch" className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-zinc-400 hover:text-zinc-200">
              🚚 Dispatch
            </Link>
            <Link href="/admin/mods/volunteers" className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-zinc-400 hover:text-zinc-200">
              👥 Volunteers
            </Link>
            <Link href="/admin/mods/incidents" className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-zinc-400 hover:text-zinc-200">
              ⚠️ Incidents
            </Link>
            <Link href="/admin/mods/communications" className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-zinc-400 hover:text-zinc-200">
              💬 Communications
            </Link>
            <Link href="/admin/mods/analytics" className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-zinc-400 hover:text-zinc-200">
              📈 Analytics
            </Link>
            <Link href="/admin/mods/settings" className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-zinc-400 hover:text-zinc-200">
              ⚙️ Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
              <Users className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '...' : stats.totalVolunteers}</div>
              <p className="text-xs text-zinc-400">
                {loadingStats ? 'Loading...' : `${stats.activeVolunteers} active now`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '...' : stats.pendingRequests}</div>
              <p className="text-xs text-zinc-400">
                {loadingStats ? 'Loading...' : `${stats.criticalRequests} critical`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '...' : stats.completedToday}</div>
              <p className="text-xs text-zinc-400">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage</CardTitle>
              <MapPin className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '...' : stats.countiesCovered}</div>
              <p className="text-xs text-zinc-400">
                of 55 counties
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common moderator tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/mods/dispatch">
                <button className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">View Dispatch Queue</span>
                    <span className="text-xs text-zinc-400">{stats.pendingRequests} pending</span>
                  </div>
                </button>
              </Link>
              
              <Link href="/admin/mods/volunteers">
                <button className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Manage Volunteers</span>
                    <span className="text-xs text-zinc-400">{stats.activeVolunteers} online</span>
                  </div>
                </button>
              </Link>

              <Link href="/admin/mods/incidents">
                <button className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Review Incidents</span>
                    <AlertTriangle className="h-4 w-4 text-zinc-400" />
                  </div>
                </button>
              </Link>

              <Link href="/admin/mods/communications">
                <button className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Send Alert</span>
                    <MessageSquare className="h-4 w-4 text-zinc-400" />
                  </div>
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-zinc-400 text-sm">No recent activity</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-zinc-800 last:border-0">
                      <div className={`mt-0.5 ${
                        activity.type === 'REQUEST' ? 'text-blue-400' :
                        activity.type === 'ASSIGNMENT' ? 'text-amber-400' :
                        'text-green-400'
                      }`}>
                        {activity.type === 'REQUEST' && <AlertTriangle className="h-4 w-4" />}
                        {activity.type === 'ASSIGNMENT' && <Users className="h-4 w-4" />}
                        {activity.type === 'COMPLETION' && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.priority && (
                            <Badge variant={activity.priority === 'CRITICAL' ? 'destructive' : 'secondary'} className="text-xs">
                              {activity.priority}
                            </Badge>
                          )}
                          {activity.county && (
                            <span className="text-xs text-zinc-500">{activity.county}</span>
                          )}
                          <span className="text-xs text-zinc-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="bg-zinc-900/50 border-zinc-800 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-green-400">Services Online</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Dispatch API
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Volunteer Network
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Notification Service
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 text-amber-400">Attention Required</h4>
                <ul className="space-y-2 text-sm">
                  {stats.criticalRequests > 0 && (
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      {stats.criticalRequests} critical requests
                    </li>
                  )}
                  {stats.activeVolunteers < 5 && (
                    <li className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-amber-400" />
                      Low volunteer availability
                    </li>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 text-blue-400">Performance</h4>
                <ul className="space-y-2 text-sm">
                  <li>Avg response time: 12 minutes</li>
                  <li>Completion rate: 94%</li>
                  <li>Volunteer satisfaction: 4.7/5</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
