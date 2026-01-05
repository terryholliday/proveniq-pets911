'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Mail,
  Camera,
  AlertCircle,
  CheckCircle,
  Activity,
  ChevronRight,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getSightingReports, updateSightingReport } from '@/lib/db/indexed-db';
import type { SightingReportExtended } from '@/lib/types';

export default function SightingsPage() {
  const [sightings, setSightings] = useState<SightingReportExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadSightings();
  }, []);

  const loadSightings = async () => {
    try {
      const response = await fetch('/api/sightings');
      if (!response.ok) {
        throw new Error('Failed to fetch sightings');
      }
      const data = await response.json();
      setSightings(data.sightings || []);
    } catch (error) {
      console.error('Failed to load sightings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (sightingId: string, status: 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED') => {
    setUpdating(sightingId);
    try {
      const response = await fetch(`/api/sightings/${sightingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          // Add ETA and rescuer for IN_PROGRESS status
          ...(status === 'IN_PROGRESS' && {
            estimated_arrival: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            rescuer_assigned: 'Rescue Team Alpha',
          }),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sighting');
      }
      
      await loadSightings();
    } catch (error) {
      console.error('Failed to update sighting:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-blue-500 bg-blue-500/10';
      case 'IN_PROGRESS':
        return 'text-orange-500 bg-orange-500/10';
      case 'RESOLVED':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-slate-500 bg-slate-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'MEDIUM':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'LOW':
        return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
      default:
        return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading sightings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Sighting Reports</h1>
              <p className="text-slate-400 mt-1">
                Track and manage animal sightings in your area
              </p>
            </div>
            <Link href="/sighting/report">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Report New Sighting
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {sightings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-slate-600" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">No sightings reported yet</h2>
            <p className="text-slate-400 mb-8">
              Be the first to report an animal sighting in your area
            </p>
            <Link href="/sighting/report">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Report Sighting
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total</p>
                      <p className="text-2xl font-bold text-white">{sightings.length}</p>
                    </div>
                    <Activity className="w-8 h-8 text-slate-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Active</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {sightings.filter(s => s.status === 'ACTIVE').length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">In Progress</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {sightings.filter(s => s.status === 'IN_PROGRESS').length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">High Priority</p>
                      <p className="text-2xl font-bold text-red-500">
                        {sightings.filter(s => s.priority === 'HIGH').length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sighting List */}
            <div className="space-y-4">
              {sightings.map((sighting) => (
                <Card key={sighting.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Priority Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(sighting.priority)}`}>
                          {sighting.priority} PRIORITY
                        </span>
                        {/* Status Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sighting.status)}`}>
                          {sighting.status.replace('_', ' ')}
                        </span>
                        {sighting.can_stay_with_animal && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-emerald-500 bg-emerald-500/10">
                            With Reporter
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatTime(sighting.created_at)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Animal Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Species:</span>
                          <span className="text-white font-medium">{sighting.species}</span>
                        </div>
                        {sighting.breed && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Breed:</span>
                            <span className="text-white">{sighting.breed}</span>
                          </div>
                        )}
                        {sighting.color && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Color:</span>
                            <span className="text-white">{sighting.color}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Priority:</span>
                          <span className={`font-medium ${
                            sighting.priority === 'HIGH' ? 'text-red-500' :
                            sighting.priority === 'MEDIUM' ? 'text-yellow-500' :
                            'text-slate-500'
                          }`}>
                            {sighting.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Condition:</span>
                          <span className={`font-medium ${
                            sighting.condition === 'CRITICAL' ? 'text-red-500' :
                            sighting.condition === 'INJURED' ? 'text-orange-500' :
                            sighting.condition === 'HEALTHY' ? 'text-green-500' :
                            'text-slate-500'
                          }`}>
                            {sighting.condition}
                          </span>
                        </div>
                        {sighting.photo_url && (
                          <div className="mt-3">
                            <img 
                              src={sighting.photo_url} 
                              alt="Sighting" 
                              className="w-32 h-32 object-cover rounded-lg border border-slate-700"
                            />
                          </div>
                        )}
                      </div>

                      {/* Right Column - Location & Contact */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                          <div>
                            <span className="text-slate-400 block">Location:</span>
                            <span className="text-white">{sighting.sighting_address}</span>
                          </div>
                        </div>
                        {sighting.reporter_name && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-white">{sighting.reporter_name}</span>
                          </div>
                        )}
                        {sighting.reporter_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-white">{sighting.reporter_phone}</span>
                          </div>
                        )}
                        {sighting.estimated_arrival && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-500">
                              ETA: {new Date(sighting.estimated_arrival).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                        {sighting.rescuer_assigned && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-500">{sighting.rescuer_assigned}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {sighting.description && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-slate-400 text-sm mb-1">Description:</p>
                        <p className="text-white">{sighting.description}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-700">
                      {sighting.status === 'ACTIVE' && (
                        <Button
                          onClick={() => updateStatus(sighting.id, 'IN_PROGRESS')}
                          disabled={updating === sighting.id}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {updating === sighting.id ? 'Updating...' : 'Mark In Progress'}
                        </Button>
                      )}
                      {sighting.status === 'IN_PROGRESS' && (
                        <Button
                          onClick={() => updateStatus(sighting.id, 'RESOLVED')}
                          disabled={updating === sighting.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updating === sighting.id ? 'Updating...' : 'Mark Resolved'}
                        </Button>
                      )}
                      <Button variant="outline" className="border-slate-600 text-slate-300">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
