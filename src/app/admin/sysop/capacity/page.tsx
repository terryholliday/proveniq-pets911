'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Building2,
  TrendingUp,
  Bell,
  Users,
  Truck,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react';

interface ShelterCapacity {
  id: string;
  shelter_name: string;
  county: string;
  current_dogs: number;
  max_dogs: number;
  current_cats: number;
  max_cats: number;
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL' | 'OVERFLOW';
  last_updated: string;
  contact_email?: string;
  contact_phone?: string;
}

interface CapacityAlert {
  id: string;
  shelter_id: string;
  shelter_name: string;
  alert_type: 'ELEVATED' | 'CRITICAL' | 'OVERFLOW';
  species: 'DOG' | 'CAT' | 'BOTH';
  current_percentage: number;
  sent_at: string;
  volunteers_notified: number;
  responses_received: number;
}

const STATUS_CONFIG = {
  NORMAL: { label: 'Normal', color: 'bg-green-900/50 text-green-400', threshold: 70 },
  ELEVATED: { label: 'Elevated', color: 'bg-amber-900/50 text-amber-400', threshold: 85 },
  CRITICAL: { label: 'Critical', color: 'bg-orange-900/50 text-orange-400', threshold: 95 },
  OVERFLOW: { label: 'Overflow', color: 'bg-red-900/50 text-red-400', threshold: 100 },
};

export default function CapacityAlertsPage() {
  const [shelters, setShelters] = useState<ShelterCapacity[]>([]);
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShelter, setSelectedShelter] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [sheltersRes, alertsRes] = await Promise.all([
        fetch('/api/admin/shelter-capacity'),
        fetch('/api/admin/capacity-alerts'),
      ]);
      
      if (sheltersRes.ok) {
        const data = await sheltersRes.json();
        setShelters(data.shelters || []);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch capacity data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendCapacityAlert(shelterId: string) {
    try {
      const res = await fetch('/api/admin/capacity-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelter_id: shelterId }),
      });
      if (res.ok) {
        fetchData();
        alert('Alert sent to transport volunteers!');
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  const criticalShelters = shelters.filter(s => s.status === 'CRITICAL' || s.status === 'OVERFLOW');
  const elevatedShelters = shelters.filter(s => s.status === 'ELEVATED');

  const getCapacityPercent = (current: number, max: number) => 
    max > 0 ? Math.round((current / max) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <AlertTriangle className="h-7 w-7 text-orange-500" />
              Capacity Crisis Alerts
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Monitor shelter capacity and coordinate emergency transport
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">{criticalShelters.length}</div>
            <div className="text-xs text-zinc-400">Critical/Overflow</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">{elevatedShelters.length}</div>
            <div className="text-xs text-zinc-400">Elevated</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{alerts.length}</div>
            <div className="text-xs text-zinc-400">Alerts Sent (30d)</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {alerts.reduce((sum, a) => sum + a.responses_received, 0)}
            </div>
            <div className="text-xs text-zinc-400">Volunteer Responses</div>
          </div>
        </div>

        {/* Critical Alert Banner */}
        {criticalShelters.length > 0 && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-200 font-medium">
                  {criticalShelters.length} shelter{criticalShelters.length > 1 ? 's' : ''} at critical capacity
                </p>
                <p className="text-xs text-red-400/80 mt-1">
                  Immediate transport coordination needed to prevent euthanasia due to space
                </p>
              </div>
              <button
                onClick={() => criticalShelters.forEach(s => sendCapacityAlert(s.id))}
                className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Alert Transport Volunteers
              </button>
            </div>
          </div>
        )}

        {/* Shelters List */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-zinc-400" />
          Shelter Capacity Status
        </h2>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading capacity data...</div>
        ) : shelters.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500">No shelter capacity data</p>
            <p className="text-zinc-600 text-sm mt-1">
              Partner shelters will appear here when connected
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shelters
              .sort((a, b) => {
                const statusOrder = { OVERFLOW: 0, CRITICAL: 1, ELEVATED: 2, NORMAL: 3 };
                return statusOrder[a.status] - statusOrder[b.status];
              })
              .map(shelter => {
                const statusConfig = STATUS_CONFIG[shelter.status];
                const dogPercent = getCapacityPercent(shelter.current_dogs, shelter.max_dogs);
                const catPercent = getCapacityPercent(shelter.current_cats, shelter.max_cats);

                return (
                  <div
                    key={shelter.id}
                    className={`bg-zinc-900 border rounded-lg overflow-hidden ${
                      shelter.status === 'OVERFLOW' || shelter.status === 'CRITICAL'
                        ? 'border-red-700'
                        : shelter.status === 'ELEVATED'
                        ? 'border-amber-700'
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{shelter.shelter_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="text-sm text-zinc-400">{shelter.county} County</div>
                        </div>
                        {(shelter.status === 'CRITICAL' || shelter.status === 'OVERFLOW') && (
                          <button
                            onClick={() => sendCapacityAlert(shelter.id)}
                            className="bg-orange-700 hover:bg-orange-600 px-3 py-1.5 rounded text-sm flex items-center gap-2"
                          >
                            <Bell className="h-4 w-4" />
                            Send Alert
                          </button>
                        )}
                      </div>

                      {/* Capacity Bars */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Dogs */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-zinc-400">🐕 Dogs</span>
                            <span className={dogPercent >= 95 ? 'text-red-400' : dogPercent >= 85 ? 'text-amber-400' : 'text-zinc-400'}>
                              {shelter.current_dogs}/{shelter.max_dogs} ({dogPercent}%)
                            </span>
                          </div>
                          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                dogPercent >= 95 ? 'bg-red-600' :
                                dogPercent >= 85 ? 'bg-amber-600' :
                                dogPercent >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(dogPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Cats */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-zinc-400">🐈 Cats</span>
                            <span className={catPercent >= 95 ? 'text-red-400' : catPercent >= 85 ? 'text-amber-400' : 'text-zinc-400'}>
                              {shelter.current_cats}/{shelter.max_cats} ({catPercent}%)
                            </span>
                          </div>
                          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                catPercent >= 95 ? 'bg-red-600' :
                                catPercent >= 85 ? 'bg-amber-600' :
                                catPercent >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(catPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-zinc-800/50 px-4 py-2 flex items-center justify-between text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Updated: {new Date(shelter.last_updated).toLocaleString()}
                      </span>
                      {shelter.contact_phone && (
                        <a href={`tel:${shelter.contact_phone}`} className="text-blue-400 hover:text-blue-300">
                          {shelter.contact_phone}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-zinc-400" />
              Recent Alerts
            </h2>
            <div className="space-y-2">
              {alerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${STATUS_CONFIG[alert.alert_type]?.color || 'bg-zinc-800'}`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{alert.shelter_name}</div>
                      <div className="text-xs text-zinc-500">
                        {alert.current_percentage}% capacity • {alert.species}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="text-green-400">{alert.responses_received}</span>
                      <span className="text-zinc-500">/{alert.volunteers_notified} responses</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(alert.sent_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
