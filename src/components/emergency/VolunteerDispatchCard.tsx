'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { County, Species } from '@/lib/types';

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
  const [dispatchId, setDispatchId] = useState<string | null>(null);
  const [totalMatches, setTotalMatches] = useState<number | null>(null);
  const [notificationsAttempted, setNotificationsAttempted] = useState<number | null>(null);
  const [notificationsSent, setNotificationsSent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setDispatchId(data.data.dispatch_request?.id || null);
        setTotalMatches(typeof data.data.total_matches === 'number' ? data.data.total_matches : null);
        setNotificationsAttempted(typeof data.data.notifications_attempted === 'number' ? data.data.notifications_attempted : null);
        setNotificationsSent(typeof data.data.notifications_sent === 'number' ? data.data.notifications_sent : null);
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

      {!dispatchId && (
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

      {dispatchId && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Request created. Notified {notificationsSent ?? 0}/{notificationsAttempted ?? 0} nearby helper
            {(notificationsAttempted ?? 0) === 1 ? '' : 's'}. Please wait for a response (usually 5–10 minutes). If no one responds, contact Animal Control.
            {typeof totalMatches === 'number' ? ` (${totalMatches} eligible helper${totalMatches === 1 ? '' : 's'} found)` : ''}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
