'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  Car,
  Home
} from 'lucide-react';
import type { VolunteerProfile } from '@/lib/types';

export default function AdminVolunteersPage() {
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerProfile | null>(null);

  useEffect(() => {
    loadVolunteers();
  }, [filter]);

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/volunteers?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setVolunteers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (volunteerId: string) => {
    try {
      const response = await fetch('/api/admin/volunteers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteer_id: volunteerId }),
      });

      if (response.ok) {
        loadVolunteers();
        setSelectedVolunteer(null);
      }
    } catch (error) {
      console.error('Failed to approve volunteer:', error);
    }
  };

  const handleSuspend = async (volunteerId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/volunteers/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteer_id: volunteerId, reason }),
      });

      if (response.ok) {
        loadVolunteers();
        setSelectedVolunteer(null);
      }
    } catch (error) {
      console.error('Failed to suspend volunteer:', error);
    }
  };

  const pendingCount = volunteers.filter(v => !v.background_check_completed).length;
  const activeCount = volunteers.filter(v => v.status === 'ACTIVE').length;
  const suspendedCount = volunteers.filter(v => v.status === 'SUSPENDED').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Volunteer Management</h1>
          <p className="text-slate-600">Review, approve, and manage emergency helpers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{volunteers.length}</p>
                  <p className="text-sm text-slate-600">Total Volunteers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('pending')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-slate-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('active')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-sm text-slate-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter('suspended')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{suspendedCount}</p>
                  <p className="text-sm text-slate-600">Suspended</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'active', 'suspended'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f as any)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Volunteers List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-12">
              <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">Loading volunteers...</p>
            </div>
          ) : volunteers.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">No volunteers found</p>
            </div>
          ) : (
            volunteers.map((volunteer) => (
              <Card 
                key={volunteer.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  !volunteer.background_check_completed ? 'border-2 border-amber-500' : ''
                }`}
                onClick={() => setSelectedVolunteer(volunteer)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{volunteer.display_name}</CardTitle>
                      <p className="text-sm text-slate-600">{volunteer.primary_county} County</p>
                    </div>
                    <Badge variant={
                      volunteer.status === 'ACTIVE' ? 'success' :
                      volunteer.status === 'SUSPENDED' ? 'destructive' :
                      'secondary'
                    }>
                      {volunteer.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4" />
                      {volunteer.phone}
                    </div>
                    {volunteer.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4" />
                        {volunteer.email}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="h-4 w-4" />
                      {volunteer.address_city}, {volunteer.address_zip}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {volunteer.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>{volunteer.completed_dispatches} completed</span>
                        <span>{volunteer.max_response_radius_miles} mi radius</span>
                      </div>
                      {!volunteer.background_check_completed && (
                        <Badge variant="warning" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Pending Check
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Volunteer Detail Modal */}
        {selectedVolunteer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedVolunteer.display_name}</CardTitle>
                    <p className="text-sm text-slate-600">Volunteer Details</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedVolunteer(null)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><Phone className="h-4 w-4 inline mr-2" />{selectedVolunteer.phone}</p>
                    {selectedVolunteer.email && (
                      <p><Mail className="h-4 w-4 inline mr-2" />{selectedVolunteer.email}</p>
                    )}
                    <p><MapPin className="h-4 w-4 inline mr-2" />
                      {selectedVolunteer.address_city}, {selectedVolunteer.address_zip}
                    </p>
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <h3 className="font-semibold mb-2">Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVolunteer.capabilities.map((cap) => (
                      <Badge key={cap}>{cap.replace('_', ' ')}</Badge>
                    ))}
                  </div>
                </div>

                {/* Transport Details */}
                {selectedVolunteer.has_vehicle && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Transport Details
                    </h3>
                    <div className="text-sm space-y-1">
                      <p>Vehicle: {selectedVolunteer.vehicle_type}</p>
                      <p>Max size: {selectedVolunteer.max_animal_size}</p>
                      <p>Can transport crate: {selectedVolunteer.can_transport_crate ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}

                {/* Foster Details */}
                {selectedVolunteer.can_foster_species.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Foster Details
                    </h3>
                    <div className="text-sm space-y-1">
                      <p>Species: {selectedVolunteer.can_foster_species.join(', ')}</p>
                      <p>Max capacity: {selectedVolunteer.max_foster_count}</p>
                      <p>Fenced yard: {selectedVolunteer.has_fenced_yard ? 'Yes' : 'No'}</p>
                      <p>Other pets: {selectedVolunteer.has_other_pets ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}

                {/* Background Check */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verification Status
                  </h3>
                  <div className="space-y-2">
                    {selectedVolunteer.background_check_completed ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Background check completed on {new Date(selectedVolunteer.background_check_date!).toLocaleDateString()}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Background check pending
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="font-semibold mb-2">Performance</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-2xl font-bold">{selectedVolunteer.completed_dispatches}</p>
                      <p className="text-slate-600">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedVolunteer.total_dispatches}</p>
                      <p className="text-slate-600">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {selectedVolunteer.average_response_time_minutes || '--'}
                      </p>
                      <p className="text-slate-600">Avg Response (min)</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {!selectedVolunteer.background_check_completed && (
                    <Button 
                      className="flex-1"
                      onClick={() => handleApprove(selectedVolunteer.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve (Manual Override)
                    </Button>
                  )}
                  {selectedVolunteer.status !== 'SUSPENDED' && (
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        const reason = prompt('Reason for suspension:');
                        if (reason) handleSuspend(selectedVolunteer.id, reason);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
