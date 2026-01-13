'use client';

import { useState, useEffect } from 'react';
import { 
  Bell,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  Phone,
  AlertTriangle,
  Dog,
  Cat,
  Truck,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface DispatchRequest {
  id: string;
  case_number: string;
  case_type: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location_county: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  distance_miles?: number;
  species?: string;
  animal_count?: number;
  requested_at: string;
  expires_at: string;
  contact_phone?: string;
}

const URGENCY_CONFIG = {
  LOW: { label: 'Low', color: 'bg-blue-900/50 text-blue-400 border-blue-700' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-900/50 text-yellow-400 border-yellow-700' },
  HIGH: { label: 'High', color: 'bg-orange-900/50 text-orange-400 border-orange-700' },
  CRITICAL: { label: 'Critical', color: 'bg-red-900/50 text-red-400 border-red-700 animate-pulse' },
};

export default function VolunteerDispatchPage() {
  const [requests, setRequests] = useState<DispatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<DispatchRequest | null>(null);

  useEffect(() => {
    fetchRequests();
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch('/api/volunteer/dispatch-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        // Check if we have an active accepted request
        const active = data.requests?.find((r: DispatchRequest & { status?: string }) => r.status === 'ACCEPTED');
        if (active) setActiveRequest(active);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function respondToRequest(requestId: string, accept: boolean) {
    setResponding(requestId);
    try {
      const res = await fetch('/api/volunteer/dispatch-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, accept }),
      });
      if (res.ok) {
        if (accept) {
          const accepted = requests.find(r => r.id === requestId);
          if (accepted) setActiveRequest(accepted);
        }
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to respond:', error);
    } finally {
      setResponding(null);
    }
  }

  async function completeDispatch() {
    if (!activeRequest) return;
    try {
      const res = await fetch('/api/volunteer/dispatch-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: activeRequest.id }),
      });
      if (res.ok) {
        setActiveRequest(null);
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to complete:', error);
    }
  }

  const pendingRequests = requests.filter(r => !activeRequest || r.id !== activeRequest.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header - Fixed on mobile */}
      <header className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <span className="font-bold">Dispatch</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingRequests.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length} new
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 pb-24">
        {/* Active Dispatch */}
        {activeRequest && (
          <div className="mb-6">
            <h2 className="text-sm text-zinc-400 mb-2 font-medium">ACTIVE DISPATCH</h2>
            <div className="bg-green-900/30 border-2 border-green-600 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-green-400 font-medium">EN ROUTE</span>
                  <div className="font-mono font-bold">#{activeRequest.case_number}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border ${URGENCY_CONFIG[activeRequest.urgency].color}`}>
                  {URGENCY_CONFIG[activeRequest.urgency].label}
                </span>
              </div>

              <p className="text-sm mb-4">{activeRequest.description}</p>

              {/* Location */}
              <div className="bg-zinc-900/50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <span>{activeRequest.location_county} County</span>
                </div>
                {activeRequest.location_address && (
                  <p className="text-sm text-zinc-400 ml-6">{activeRequest.location_address}</p>
                )}
                
                {/* Navigation button */}
                {activeRequest.location_lat && activeRequest.location_lng && (
                  <a
                    href={`https://maps.google.com/maps?daddr=${activeRequest.location_lat},${activeRequest.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full bg-blue-700 hover:bg-blue-600 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-5 w-5" />
                    Open Navigation
                  </a>
                )}
              </div>

              {/* Contact */}
              {activeRequest.contact_phone && (
                <a
                  href={`tel:${activeRequest.contact_phone}`}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2 mb-4"
                >
                  <Phone className="h-5 w-5" />
                  Call Reporter
                </a>
              )}

              {/* Complete button */}
              <button
                onClick={completeDispatch}
                className="w-full bg-green-700 hover:bg-green-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Mark Complete
              </button>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        <div>
          <h2 className="text-sm text-zinc-400 mb-2 font-medium">
            {activeRequest ? 'OTHER REQUESTS' : 'DISPATCH REQUESTS'}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
              <p className="text-zinc-500 mt-2">Loading requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
              <Bell className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
              <p className="text-zinc-500">No dispatch requests</p>
              <p className="text-zinc-600 text-sm mt-1">You'll be notified when help is needed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests
                .sort((a, b) => {
                  const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                  return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                })
                .map(request => (
                  <div
                    key={request.id}
                    className={`bg-zinc-900 border rounded-xl overflow-hidden ${
                      request.urgency === 'CRITICAL' ? 'border-red-700' :
                      request.urgency === 'HIGH' ? 'border-orange-700' :
                      'border-zinc-800'
                    }`}
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {request.species === 'DOG' ? <Dog className="h-5 w-5 text-zinc-400" /> :
                           request.species === 'CAT' ? <Cat className="h-5 w-5 text-zinc-400" /> :
                           <AlertTriangle className="h-5 w-5 text-zinc-400" />}
                          <span className="font-mono text-sm">#{request.case_number}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded border ${URGENCY_CONFIG[request.urgency].color}`}>
                          {URGENCY_CONFIG[request.urgency].label}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm mb-3">{request.description}</p>

                      {/* Info row */}
                      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {request.location_county}
                          {request.distance_miles && ` • ${request.distance_miles} mi`}
                        </div>
                        {request.animal_count && (
                          <div>{request.animal_count} animal{request.animal_count > 1 ? 's' : ''}</div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => respondToRequest(request.id, false)}
                          disabled={responding === request.id}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-5 w-5" />
                          Decline
                        </button>
                        <button
                          onClick={() => respondToRequest(request.id, true)}
                          disabled={responding === request.id || !!activeRequest}
                          className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          {responding === request.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <CheckCircle className="h-5 w-5" />
                          )}
                          Accept
                        </button>
                      </div>
                    </div>

                    {/* Expiry warning */}
                    <div className="bg-zinc-800/50 px-4 py-2 flex items-center gap-2 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      Expires {new Date(request.expires_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav hint */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-3 text-center">
        <p className="text-xs text-zinc-500">
          Keep this page open to receive dispatch alerts
        </p>
      </div>
    </div>
  );
}
