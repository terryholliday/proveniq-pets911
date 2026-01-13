'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Check,
  ArrowLeft,
  Loader2
} from 'lucide-react';

type EquipmentType = 
  | 'LADDER' | 'EXTENSION_LADDER' 
  | 'LIVE_TRAP_SMALL' | 'LIVE_TRAP_LARGE'
  | 'CATCH_POLE' | 'NET'
  | 'CRATE_SMALL' | 'CRATE_MEDIUM' | 'CRATE_LARGE' | 'CRATE_XLARGE'
  | 'VEHICLE_TRAILER' | 'BOAT' | 'KAYAK'
  | 'DRONE' | 'THERMAL_CAMERA' | 'OTHER';

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string; category: string }[] = [
  { value: 'LADDER', label: 'Ladder (Standard)', category: 'Rescue' },
  { value: 'EXTENSION_LADDER', label: 'Extension Ladder', category: 'Rescue' },
  { value: 'LIVE_TRAP_SMALL', label: 'Live Trap (Small - cats/rabbits)', category: 'Trapping' },
  { value: 'LIVE_TRAP_LARGE', label: 'Live Trap (Large - dogs)', category: 'Trapping' },
  { value: 'CATCH_POLE', label: 'Catch Pole', category: 'Capture' },
  { value: 'NET', label: 'Capture Net', category: 'Capture' },
  { value: 'CRATE_SMALL', label: 'Transport Crate (Small)', category: 'Transport' },
  { value: 'CRATE_MEDIUM', label: 'Transport Crate (Medium)', category: 'Transport' },
  { value: 'CRATE_LARGE', label: 'Transport Crate (Large)', category: 'Transport' },
  { value: 'CRATE_XLARGE', label: 'Transport Crate (XL)', category: 'Transport' },
  { value: 'VEHICLE_TRAILER', label: 'Vehicle Trailer', category: 'Transport' },
  { value: 'BOAT', label: 'Boat', category: 'Water' },
  { value: 'KAYAK', label: 'Kayak', category: 'Water' },
  { value: 'DRONE', label: 'Drone', category: 'Tech' },
  { value: 'THERMAL_CAMERA', label: 'Thermal Camera', category: 'Tech' },
  { value: 'OTHER', label: 'Other Equipment', category: 'Other' },
];

interface Equipment {
  id: string;
  equipment_type: EquipmentType;
  equipment_detail?: string;
  is_available: boolean;
}

export default function VolunteerEquipmentPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEquipment, setNewEquipment] = useState<EquipmentType | ''>('');
  const [newDetail, setNewDetail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  async function fetchEquipment() {
    setLoading(true);
    try {
      const res = await fetch('/api/volunteer/equipment');
      if (res.ok) {
        const data = await res.json();
        setEquipment(data.equipment || []);
      } else if (res.status === 401) {
        router.push('/login?redirectTo=/volunteer/equipment');
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newEquipment) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/volunteer/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment_type: newEquipment,
          equipment_detail: newDetail || undefined,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Equipment added' });
        setShowAddModal(false);
        setNewEquipment('');
        setNewDetail('');
        fetchEquipment();
      } else {
        setMessage({ type: 'error', text: 'Failed to add equipment' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding equipment' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAvailable(id: string, currentValue: boolean) {
    try {
      await fetch(`/api/volunteer/equipment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !currentValue }),
      });
      setEquipment(prev => prev.map(e => 
        e.id === id ? { ...e, is_available: !currentValue } : e
      ));
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this equipment from your profile?')) return;
    
    try {
      await fetch(`/api/volunteer/equipment/${id}`, { method: 'DELETE' });
      setEquipment(prev => prev.filter(e => e.id !== id));
      setMessage({ type: 'success', text: 'Equipment removed' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove equipment' });
    }
  }

  const categories = [...new Set(EQUIPMENT_OPTIONS.map(e => e.category))];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/volunteer/dashboard" className="text-amber-500 text-sm mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Wrench className="h-6 w-6 text-amber-500" />
            My Equipment
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Register equipment you have for technical rescues
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
          }`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right">✕</button>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-200">
            <strong>Why register equipment?</strong>
          </p>
          <p className="text-xs text-blue-300/80 mt-1">
            When an animal is trapped or inaccessible (like a kitten stuck in a bridge hole), 
            we can alert volunteers who have the right equipment to help.
          </p>
        </div>

        {/* Equipment List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
          </div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500">No equipment registered</p>
            <p className="text-zinc-600 text-sm mt-1">Add equipment you can bring to rescues</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {equipment.map(item => {
              const opt = EQUIPMENT_OPTIONS.find(o => o.value === item.equipment_type);
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    item.is_available 
                      ? 'bg-zinc-900 border-zinc-800' 
                      : 'bg-zinc-900/50 border-zinc-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.is_available ? 'bg-amber-900/30' : 'bg-zinc-800'
                    }`}>
                      <Wrench className={`h-5 w-5 ${item.is_available ? 'text-amber-500' : 'text-zinc-500'}`} />
                    </div>
                    <div>
                      <div className="font-medium">{opt?.label || item.equipment_type}</div>
                      {item.equipment_detail && (
                        <div className="text-xs text-zinc-500">{item.equipment_detail}</div>
                      )}
                      <div className="text-xs text-zinc-600">{opt?.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAvailable(item.id, item.is_available)}
                      className={`text-xs px-3 py-1 rounded ${
                        item.is_available 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-zinc-500 hover:text-red-400 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-amber-700 hover:bg-amber-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Equipment
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add Equipment</h3>
            
            {/* Category Sections */}
            {categories.map(category => (
              <div key={category} className="mb-4">
                <div className="text-xs text-zinc-500 uppercase mb-2">{category}</div>
                <div className="space-y-1">
                  {EQUIPMENT_OPTIONS.filter(o => o.category === category).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNewEquipment(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        newEquipment === opt.value
                          ? 'bg-amber-700 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Detail (for OTHER) */}
            {newEquipment === 'OTHER' && (
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1">Describe your equipment</label>
                <input
                  type="text"
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                  placeholder="e.g., Generator, spotlight, etc."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewEquipment('');
                  setNewDetail('');
                }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newEquipment || saving}
                className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 py-2 rounded-lg font-medium"
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
