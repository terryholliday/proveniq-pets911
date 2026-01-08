'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Car, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  MapPin,
  Phone,
  Settings,
  TrendingUp,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { VolunteerProfile, DispatchRequest } from '@/lib/types';

export default function HelperDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [dispatches, setDispatches] = useState<DispatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const profileResponse = await fetch(`/api/volunteers/profile?user_id=${user.id}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.data);
      }

      const dispatchesResponse = await fetch(`/api/dispatch/history?volunteer_id=${user.id}`);
      if (dispatchesResponse.ok) {
        const dispatchesData = await dispatchesResponse.json();
        setDispatches(dispatchesData.data || []);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;

    const newStatus = profile.status === 'ACTIVE' ? 'TEMPORARILY_UNAVAILABLE' : 'ACTIVE';

    try {
      const response = await fetch('/api/volunteers/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          status: newStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
      }
    } catch (err) {
      setError('Failed to update availability');
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto pt-20 text-center text-white">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You haven't registered as an emergency helper yet.
            </AlertDescription>
          </Alert>
          <Button 
            className="mt-4 w-full" 
            onClick={() => router.push('/helpers/join')}
          >
            Register as Helper
          </Button>
        </div>
      </div>
    );
  }

  const activeDispatches = dispatches.filter(d => 
    ['PENDING', 'ACCEPTED', 'EN_ROUTE'].includes(d.status)
  );
  const completedDispatches = dispatches.filter(d => d.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto pt-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Emergency Helper Dashboard</h1>
            <p className="text-slate-300">Welcome back, {profile.display_name}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/helpers/settings')}
            className="text-white hover:text-white border-slate-600 hover:bg-slate-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Card */}
        <Card className="mb-6 border-2 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${
                  profile.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-semibold text-lg">
                    {profile.status === 'ACTIVE' ? 'Available for Dispatch' : 'Unavailable'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {profile.status === 'ACTIVE' 
                      ? 'You will receive emergency dispatch requests'
                      : 'You will not receive dispatch requests'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleToggleAvailability}
                variant={profile.status === 'ACTIVE' ? 'outline' : 'default'}
              >
                {profile.status === 'ACTIVE' ? 'Go Unavailable' : 'Go Available'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{profile.completed_dispatches}</p>
                  <p className="text-sm text-slate-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Car className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{profile.total_dispatches}</p>
                  <p className="text-sm text-slate-600">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {profile.average_response_time_minutes || '--'}
                  </p>
                  <p className="text-sm text-slate-600">Avg Response (min)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {profile.completed_dispatches > 0 
                      ? Math.round((profile.completed_dispatches / profile.total_dispatches) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-slate-600">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Dispatches */}
        {activeDispatches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Active Dispatches</h2>
            <div className="space-y-3">
              {activeDispatches.map((dispatch) => (
                <Card key={dispatch.id} className="border-2 border-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={dispatch.priority === 'CRITICAL' ? 'destructive' : 'warning'}>
                            {dispatch.priority}
                          </Badge>
                          <Badge>{dispatch.status}</Badge>
                        </div>
                        <p className="font-semibold mb-1">
                          {dispatch.species} ({dispatch.animal_size})
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <MapPin className="h-4 w-4" />
                          {dispatch.pickup_address}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4" />
                          Contact: {dispatch.requester_name}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {dispatch.status === 'ACCEPTED' && (
                          <Button size="sm" onClick={() => {/* Update to EN_ROUTE */}}>
                            Mark En Route
                          </Button>
                        )}
                        {dispatch.status === 'EN_ROUTE' && (
                          <Button size="sm" onClick={() => {/* Update to ARRIVED */}}>
                            Mark Arrived
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = `tel:${dispatch.requester_phone}`}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent History */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent History</h2>
          {completedDispatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No completed dispatches yet</p>
                <p className="text-sm mt-1">You'll see your rescue history here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedDispatches.slice(0, 10).map((dispatch) => (
                <Card key={dispatch.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <p className="font-semibold">
                            {dispatch.species} ({dispatch.animal_size})
                          </p>
                        </div>
                        <p className="text-sm text-slate-600">
                          {new Date(dispatch.completed_at!).toLocaleDateString()}
                        </p>
                        {dispatch.distance_miles && (
                          <p className="text-sm text-slate-600">
                            {dispatch.distance_miles} miles • {dispatch.duration_minutes} min
                          </p>
                        )}
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Verification Status */}
        {!profile.background_check_completed && (
          <Alert variant="warning" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Background check pending. You can accept dispatches, but full verification will increase your priority in the matching system.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
