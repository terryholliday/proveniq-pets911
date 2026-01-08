'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { VolunteerMatch, County, Species } from '@/lib/types';

interface VolunteerDispatchCardProps {
  county: County;
  species: Species;
  animalSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  onDispatchCreated?: (dispatchId: string) => void;
}

export function VolunteerDispatchCard({
  county,
  species,
  animalSize,
  pickupLat,
  pickupLng,
  pickupAddress,
  requesterId,
  requesterName,
  requesterPhone,
  onDispatchCreated,
}: VolunteerDispatchCardProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<VolunteerMatch[]>([]);
  const [dispatchId, setDispatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const handleFindHelpers = async () => {
    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/dispatch/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'TRANSPORT',
          priority: 'HIGH',
          species,
          animal_size: animalSize,
          needs_crate: false,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          pickup_address: pickupAddress,
          county,
          requester_id: requesterId,
          requester_name: requesterName,
          requester_phone: requesterPhone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find helpers');
      }

      const data = await response.json();
      
      if (data.success) {
        setMatches(data.data.matches || []);
        setDispatchId(data.data.dispatch_request?.id || null);
        onDispatchCreated?.(data.data.dispatch_request?.id);
      } else {
        throw new Error(data.error?.message || 'Failed to find helpers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find helpers');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNotifyVolunteer = async (volunteerId: string) => {
    if (!dispatchId) return;

    setIsDispatching(true);
    try {
      const response = await fetch('/api/dispatch/request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatch_id: dispatchId,
          volunteer_id: volunteerId,
          status: 'ACCEPTED',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to notify volunteer');
      }

      const data = await response.json();
      if (data.success) {
        setMatches(prev => prev.map(m => 
          m.volunteer_id === volunteerId 
            ? { ...m, is_available_now: false }
            : m
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to notify volunteer');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-xl space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-blue-600" />
        <p className="font-semibold text-blue-800">Request Emergency Helper</p>
      </div>
      
      <p className="text-sm text-blue-700 mb-3">
        We can connect you with trained volunteers who can transport the animal to a vet or shelter.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!matches.length && !dispatchId && (
        <Button
          variant="default"
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleFindHelpers}
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Finding Helpers...
            </>
          ) : (
            <>
              <Users className="h-5 w-5 mr-2" />
              Find Available Helpers
            </>
          )}
        </Button>
      )}

      {matches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-800">
              {matches.length} helper{matches.length !== 1 ? 's' : ''} found nearby
            </p>
            <Badge variant="success">{matches.length} Available</Badge>
          </div>

          {matches.map((match) => (
            <Card key={match.volunteer_id} className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{match.volunteer_name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.distance_miles} mi away
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{match.estimated_arrival_minutes} min
                      </span>
                    </div>
                  </div>
                  {match.is_available_now && (
                    <Badge variant="success" className="text-xs">Available Now</Badge>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleNotifyVolunteer(match.volunteer_id)}
                    disabled={isDispatching}
                  >
                    {isDispatching ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Request This Helper
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `tel:${match.volunteer_phone}`}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <p className="text-xs text-blue-600 text-center">
            Helpers are notified via SMS and typically respond within 5-10 minutes
          </p>
        </div>
      )}

      {matches.length === 0 && dispatchId && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No helpers available in your area right now. Please contact Animal Control directly.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
