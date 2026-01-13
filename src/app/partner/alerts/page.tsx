'use client';

import { useState } from 'react';
import { Bell, MapPin, AlertTriangle, Filter, CheckCircle } from 'lucide-react';

const MOCK_ALERTS = [
  { id: 1, type: 'STRAY_SIGHTED', animal: 'Orange tabby cat', location: 'Downtown Lewisburg', address: '123 Washington St', time: '15 min ago', status: 'new', urgency: 'urgent', reporter: 'Anonymous', notes: 'Cat appears injured, limping' },
  { id: 2, type: 'STRAY_SIGHTED', animal: 'Black medium dog', location: 'White Sulphur Springs', address: 'Near Main St Park', time: '2 hrs ago', status: 'acknowledged', urgency: 'normal', reporter: 'John D.', notes: 'Friendly, no collar' },
  { id: 3, type: 'TRANSPORT_NEEDED', animal: 'Litter of puppies (5)', location: 'Rainelle', address: '456 Oak Ave', time: '4 hrs ago', status: 'pending', urgency: 'normal', reporter: 'Sarah M.', notes: 'Found under porch, need transport to shelter' },
  { id: 4, type: 'STRAY_SIGHTED', animal: 'Gray cat', location: 'Caldwell', address: 'Route 60 rest stop', time: '6 hrs ago', status: 'resolved', urgency: 'normal', reporter: 'Mike R.', notes: 'Owner found via microchip' },
];

export default function PartnerAlertsPage() {
  const [filter, setFilter] = useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all');
  
  const filteredAlerts = filter === 'all' 
    ? MOCK_ALERTS 
    : MOCK_ALERTS.filter(a => a.status === filter);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stray Alerts</h1>
          <p className="text-zinc-500 text-sm">Incoming reports from your service area</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm"
          >
            <option value="all">All Alerts</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map(alert => (
          <div key={alert.id} className={`bg-zinc-900 border rounded-lg p-4 ${
            alert.urgency === 'urgent' ? 'border-red-800' : 'border-zinc-800'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${
                alert.urgency === 'urgent' ? 'bg-red-900/30 text-red-500' : 'bg-amber-900/30 text-amber-500'
              }`}>
                {alert.urgency === 'urgent' ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <MapPin className="h-6 w-6" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{alert.animal}</span>
                  {alert.urgency === 'urgent' && (
                    <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">URGENT</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    alert.status === 'new' ? 'bg-amber-900/50 text-amber-400' :
                    alert.status === 'acknowledged' ? 'bg-blue-900/50 text-blue-400' :
                    alert.status === 'resolved' ? 'bg-green-900/50 text-green-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {alert.status}
                  </span>
                </div>
                
                <div className="text-sm text-zinc-400 mb-2">
                  <span className="font-medium text-zinc-300">{alert.location}</span> • {alert.address}
                </div>
                
                <p className="text-sm text-zinc-500 mb-3">{alert.notes}</p>
                
                <div className="flex items-center gap-4 text-xs text-zinc-600">
                  <span>Reported by: {alert.reporter}</span>
                  <span>{alert.time}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {alert.status === 'new' && (
                  <button className="text-xs bg-blue-900/50 hover:bg-blue-900 text-blue-300 px-3 py-1.5 rounded">
                    Acknowledge
                  </button>
                )}
                {alert.status !== 'resolved' && (
                  <button className="text-xs bg-green-900/50 hover:bg-green-900 text-green-300 px-3 py-1.5 rounded">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Resolve
                  </button>
                )}
                <button className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded">
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No alerts matching this filter</p>
        </div>
      )}
    </div>
  );
}
