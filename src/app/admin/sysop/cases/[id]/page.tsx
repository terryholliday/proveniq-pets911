'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Phone,
  Dog,
  Cat,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Truck,
  Camera,
  FileText,
  Users,
  Send,
  Plus
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  event_type: string;
  description: string;
  actor_name?: string;
  actor_type: 'SYSTEM' | 'VOLUNTEER' | 'MODERATOR' | 'PARTNER' | 'REPORTER';
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface CaseAnimal {
  id: string;
  temp_id: string;
  species: string;
  breed?: string;
  color?: string;
  description?: string;
  condition: string;
  disposition?: string;
  photo_urls?: string[];
}

interface CaseDetail {
  id: string;
  case_number: string;
  case_type: string;
  status: string;
  location_address?: string;
  location_city?: string;
  location_county: string;
  location_notes?: string;
  total_animals: number;
  reporter_name?: string;
  reporter_phone?: string;
  created_at: string;
  updated_at: string;
  animals: CaseAnimal[];
  timeline: TimelineEvent[];
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  CASE_CREATED: <FileText className="h-4 w-4" />,
  STATUS_CHANGED: <CheckCircle className="h-4 w-4" />,
  VOLUNTEER_ASSIGNED: <User className="h-4 w-4" />,
  VOLUNTEER_DISPATCHED: <Send className="h-4 w-4" />,
  ANIMAL_ADDED: <Dog className="h-4 w-4" />,
  ANIMAL_UPDATED: <Dog className="h-4 w-4" />,
  PHOTO_ADDED: <Camera className="h-4 w-4" />,
  NOTE_ADDED: <MessageSquare className="h-4 w-4" />,
  TRANSPORT_STARTED: <Truck className="h-4 w-4" />,
  TRANSPORT_COMPLETED: <Truck className="h-4 w-4" />,
  PARTNER_NOTIFIED: <Users className="h-4 w-4" />,
  DISPOSITION_SET: <CheckCircle className="h-4 w-4" />,
};

const EVENT_COLORS: Record<string, string> = {
  CASE_CREATED: 'bg-blue-900/50 text-blue-400 border-blue-700',
  STATUS_CHANGED: 'bg-purple-900/50 text-purple-400 border-purple-700',
  VOLUNTEER_ASSIGNED: 'bg-green-900/50 text-green-400 border-green-700',
  VOLUNTEER_DISPATCHED: 'bg-amber-900/50 text-amber-400 border-amber-700',
  ANIMAL_ADDED: 'bg-teal-900/50 text-teal-400 border-teal-700',
  DISPOSITION_SET: 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'bg-blue-600' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-600' },
  PENDING_RESOURCES: { label: 'Pending Resources', color: 'bg-purple-600' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-600' },
  CLOSED: { label: 'Closed', color: 'bg-zinc-600' },
  LEGAL_HOLD: { label: 'Legal Hold', color: 'bg-red-600' },
};

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;
  
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (caseId) fetchCase();
  }, [caseId]);

  async function fetchCase() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setCaseData(data.case);
      }
    } catch (error) {
      console.error('Failed to fetch case:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });
      if (res.ok) {
        setNewNote('');
        fetchCase();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setAddingNote(false);
    }
  }

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchCase();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex items-center justify-center">
        <div className="text-zinc-500">Loading case...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
          <p className="text-zinc-500">Case not found</p>
          <Link href="/admin/sysop/cases" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            ← Back to cases
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[caseData.status] || { label: caseData.status, color: 'bg-zinc-600' };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/sysop/cases" className="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono">{caseData.case_number}</h1>
                <span className={`text-xs px-3 py-1 rounded-full ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-zinc-400 mt-1">{caseData.case_type.replace(/_/g, ' ')}</p>
            </div>
            
            {/* Status Actions */}
            <div className="flex gap-2">
              {caseData.status === 'OPEN' && (
                <button
                  onClick={() => updateStatus('IN_PROGRESS')}
                  className="bg-amber-700 hover:bg-amber-600 px-4 py-2 rounded-lg text-sm"
                >
                  Start Working
                </button>
              )}
              {caseData.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => updateStatus('RESOLVED')}
                  className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg text-sm"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Case Info & Animals */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location & Reporter */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400" />
                Location & Contact
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">County</span>
                  <p className="font-medium">{caseData.location_county}</p>
                </div>
                {caseData.location_city && (
                  <div>
                    <span className="text-zinc-500">City</span>
                    <p className="font-medium">{caseData.location_city}</p>
                  </div>
                )}
                {caseData.location_address && (
                  <div className="col-span-2">
                    <span className="text-zinc-500">Address</span>
                    <p className="font-medium">{caseData.location_address}</p>
                  </div>
                )}
                {caseData.location_notes && (
                  <div className="col-span-2">
                    <span className="text-zinc-500">Notes</span>
                    <p className="font-medium">{caseData.location_notes}</p>
                  </div>
                )}
                {caseData.reporter_name && (
                  <div>
                    <span className="text-zinc-500">Reporter</span>
                    <p className="font-medium">{caseData.reporter_name}</p>
                  </div>
                )}
                {caseData.reporter_phone && (
                  <div>
                    <span className="text-zinc-500">Phone</span>
                    <a href={`tel:${caseData.reporter_phone}`} className="font-medium text-blue-400">
                      {caseData.reporter_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Animals */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Dog className="h-4 w-4 text-zinc-400" />
                Animals ({caseData.total_animals})
              </h3>
              
              {caseData.animals?.length > 0 ? (
                <div className="space-y-3">
                  {caseData.animals.map(animal => (
                    <div key={animal.id} className="bg-zinc-800 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{animal.species === 'DOG' ? '🐕' : animal.species === 'CAT' ? '🐈' : '🐾'}</span>
                            <span className="font-medium">{animal.temp_id || `Animal #${animal.id.slice(0,8)}`}</span>
                            {animal.disposition && (
                              <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                                {animal.disposition}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-zinc-400 mt-1">
                            {[animal.breed, animal.color, animal.description].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          animal.condition === 'CRITICAL' ? 'bg-red-900/50 text-red-400' :
                          animal.condition === 'INJURED' ? 'bg-orange-900/50 text-orange-400' :
                          'bg-zinc-700 text-zinc-300'
                        }`}>
                          {animal.condition}
                        </span>
                      </div>
                      {animal.photo_urls && animal.photo_urls.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {animal.photo_urls.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt="" className="h-16 w-16 object-cover rounded" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">No individual animals recorded yet</p>
              )}
            </div>

            {/* Add Note */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-zinc-400" />
                Add Note
              </h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note to this case..."
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-2"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim() || addingNote}
                className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 px-4 py-2 rounded text-sm"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>

          {/* Right: Timeline */}
          <div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                Timeline
              </h3>
              
              {caseData.timeline?.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-800" />
                  
                  <div className="space-y-4">
                    {caseData.timeline.map((event, idx) => {
                      const colorClass = EVENT_COLORS[event.event_type] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
                      return (
                        <div key={event.id || idx} className="relative pl-10">
                          {/* Event dot */}
                          <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
                            {EVENT_ICONS[event.event_type] || <Clock className="h-3 w-3" />}
                          </div>
                          
                          <div className="text-sm">
                            <p className="text-zinc-300">{event.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                              {event.actor_name && <span>{event.actor_name}</span>}
                              <span>•</span>
                              <span>{new Date(event.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
                  <p className="text-zinc-500 text-sm">No timeline events yet</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mt-4">
              <h3 className="font-medium mb-3 text-sm text-zinc-400">Case Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Created</span>
                  <span>{new Date(caseData.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Updated</span>
                  <span>{new Date(caseData.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Animals</span>
                  <span>{caseData.total_animals}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
