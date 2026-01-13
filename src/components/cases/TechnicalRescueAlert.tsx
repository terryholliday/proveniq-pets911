'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Wrench,
  MapPin,
  User,
  Phone,
  Clock,
  CheckCircle
} from 'lucide-react';

type EquipmentType = 
  | 'LADDER' | 'EXTENSION_LADDER' 
  | 'LIVE_TRAP_SMALL' | 'LIVE_TRAP_LARGE'
  | 'CATCH_POLE' | 'NET'
  | 'CRATE_SMALL' | 'CRATE_MEDIUM' | 'CRATE_LARGE' | 'CRATE_XLARGE'
  | 'VEHICLE_TRAILER' | 'BOAT' | 'KAYAK'
  | 'DRONE' | 'THERMAL_CAMERA' | 'OTHER';

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  LADDER: 'Ladder',
  EXTENSION_LADDER: 'Extension Ladder',
  LIVE_TRAP_SMALL: 'Live Trap (Small)',
  LIVE_TRAP_LARGE: 'Live Trap (Large)',
  CATCH_POLE: 'Catch Pole',
  NET: 'Net',
  CRATE_SMALL: 'Crate (Small)',
  CRATE_MEDIUM: 'Crate (Medium)',
  CRATE_LARGE: 'Crate (Large)',
  CRATE_XLARGE: 'Crate (XL)',
  VEHICLE_TRAILER: 'Vehicle Trailer',
  BOAT: 'Boat',
  KAYAK: 'Kayak',
  DRONE: 'Drone',
  THERMAL_CAMERA: 'Thermal Camera',
  OTHER: 'Other Equipment',
};

interface VolunteerWithEquipment {
  id: string;
  name: string;
  phone: string;
  equipment: EquipmentType[];
  distance_miles: number;
  last_active: string;
}

interface TechnicalRescueAlertProps {
  caseId: string;
  caseNumber: string;
  equipmentNeeded: EquipmentType[];
  locationNotes: string;
  county: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export function TechnicalRescueAlert({
  caseId,
  caseNumber,
  equipmentNeeded,
  locationNotes,
  county,
  urgency,
}: TechnicalRescueAlertProps) {
  const [volunteers, setVolunteers] = useState<VolunteerWithEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertSent, setAlertSent] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);

  useEffect(() => {
    fetchVolunteersWithEquipment();
  }, []);

  async function fetchVolunteersWithEquipment() {
    setLoading(true);
    try {
      const res = await fetch(`/api/volunteers/equipment?county=${county}&equipment=${equipmentNeeded.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setVolunteers(data.volunteers || []);
      }
    } catch (error) {
      console.error('Failed to fetch volunteers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendAlert() {
    try {
      await fetch('/api/alerts/technical-rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          volunteer_ids: selectedVolunteers.length > 0 ? selectedVolunteers : volunteers.map(v => v.id),
        }),
      });
      setAlertSent(true);
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  const urgencyColors = {
    CRITICAL: 'bg-red-900/30 border-red-600 text-red-400',
    HIGH: 'bg-orange-900/30 border-orange-600 text-orange-400',
    MEDIUM: 'bg-yellow-900/30 border-yellow-600 text-yellow-400',
    LOW: 'bg-blue-900/30 border-blue-600 text-blue-400',
  };

  if (alertSent) {
    return (
      <div className="bg-green-900/20 border border-green-700 rounded-xl p-6 text-center">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-semibold mb-2">Alert Sent</h3>
        <p className="text-zinc-400 text-sm">
          {selectedVolunteers.length > 0 
            ? `${selectedVolunteers.length} volunteer(s) notified`
            : `${volunteers.length} volunteer(s) with matching equipment notified`}
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 border ${urgencyColors[urgency]}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Wrench className="h-6 w-6 flex-shrink-0 mt-1" />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Technical Rescue Required</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyColors[urgency]}`}>
              {urgency}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Animal is trapped or inaccessible - requires specialized equipment
          </p>
        </div>
      </div>

      {/* Case info */}
      <div className="bg-zinc-900/50 rounded-lg p-4 mb-4">
        <div className="text-sm text-zinc-500">Case #{caseNumber}</div>
        <div className="flex items-start gap-2 mt-2">
          <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
          <span className="text-sm">{locationNotes}</span>
        </div>
      </div>

      {/* Equipment needed */}
      <div className="mb-6">
        <p className="text-sm text-zinc-400 mb-2 font-medium">Equipment Needed:</p>
        <div className="flex flex-wrap gap-2">
          {equipmentNeeded.map(eq => (
            <span key={eq} className="text-xs bg-zinc-800 px-3 py-1 rounded-full">
              {EQUIPMENT_LABELS[eq]}
            </span>
          ))}
        </div>
      </div>

      {/* Volunteers with equipment */}
      <div className="mb-6">
        <p className="text-sm text-zinc-400 mb-2 font-medium">
          Volunteers with matching equipment ({volunteers.length}):
        </p>
        
        {loading ? (
          <div className="text-center py-4 text-zinc-500">Loading...</div>
        ) : volunteers.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-lg p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm text-zinc-400">No volunteers found with required equipment</p>
            <p className="text-xs text-zinc-500 mt-1">Consider contacting Fire Department</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {volunteers.map(vol => (
              <label
                key={vol.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedVolunteers.includes(vol.id)
                    ? 'bg-amber-900/30 border border-amber-600'
                    : 'bg-zinc-900/50 hover:bg-zinc-800/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedVolunteers.includes(vol.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedVolunteers([...selectedVolunteers, vol.id]);
                    } else {
                      setSelectedVolunteers(selectedVolunteers.filter(id => id !== vol.id));
                    }
                  }}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-sm">{vol.name}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                    <span>{vol.distance_miles} mi away</span>
                    <span>Has: {vol.equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={sendAlert}
          disabled={volunteers.length === 0}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 py-3 rounded-lg font-semibold"
        >
          {selectedVolunteers.length > 0 
            ? `Alert ${selectedVolunteers.length} Selected`
            : `Alert All ${volunteers.length} Volunteers`}
        </button>
        <a
          href="tel:911"
          className="px-4 bg-red-700 hover:bg-red-600 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          <Phone className="h-4 w-4" />
          911
        </a>
      </div>
    </div>
  );
}

export default TechnicalRescueAlert;
