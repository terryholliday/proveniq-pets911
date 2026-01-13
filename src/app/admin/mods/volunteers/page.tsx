'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, Search, MapPin, Phone, Truck, Home, Zap, Star, Clock, 
  CheckCircle, MessageSquare, Calendar, Award, Car, Package, X, Loader2, Send
} from 'lucide-react';

type Capability = 'TRANSPORT' | 'FOSTER' | 'EMERGENCY';
type Status = 'available' | 'busy' | 'offline';

type Volunteer = {
  id: string;
  name: string;
  phone: string;
  county: string;
  status: Status;
  capabilities: Capability[];
  vehicle_type: string | null;
  can_transport_crate: boolean;
  foster_capacity: number;
  completed_missions: number;
  rating: number;
  last_active: string;
};

const MOCK_VOLUNTEERS: Volunteer[] = [
  { id: 'VOL-001', name: 'John Mitchell', phone: '(304) 555-1234', county: 'KANAWHA', status: 'available', capabilities: ['TRANSPORT', 'EMERGENCY'], vehicle_type: 'SUV', can_transport_crate: true, foster_capacity: 0, completed_missions: 47, rating: 4.9, last_active: '2 min ago' },
  { id: 'VOL-002', name: 'Lisa Anderson', phone: '(304) 555-5678', county: 'CABELL', status: 'available', capabilities: ['FOSTER', 'TRANSPORT'], vehicle_type: 'Sedan', can_transport_crate: false, foster_capacity: 3, completed_missions: 23, rating: 4.7, last_active: '15 min ago' },
  { id: 'VOL-003', name: 'Robert Davis', phone: '(304) 555-9012', county: 'GREENBRIER', status: 'busy', capabilities: ['TRANSPORT', 'FOSTER', 'EMERGENCY'], vehicle_type: 'Truck', can_transport_crate: true, foster_capacity: 2, completed_missions: 89, rating: 5.0, last_active: 'On mission' },
  { id: 'VOL-004', name: 'Amy Thompson', phone: '(304) 555-3456', county: 'KANAWHA', status: 'available', capabilities: ['FOSTER'], vehicle_type: null, can_transport_crate: false, foster_capacity: 5, completed_missions: 15, rating: 4.8, last_active: '30 min ago' },
  { id: 'VOL-005', name: 'Michael Chen', phone: '(304) 555-7890', county: 'BERKELEY', status: 'offline', capabilities: ['TRANSPORT'], vehicle_type: 'Van', can_transport_crate: true, foster_capacity: 0, completed_missions: 31, rating: 4.6, last_active: '2 days ago' },
  { id: 'VOL-006', name: 'Sarah Williams', phone: '(304) 555-2345', county: 'MONONGALIA', status: 'available', capabilities: ['TRANSPORT', 'EMERGENCY'], vehicle_type: 'SUV', can_transport_crate: true, foster_capacity: 0, completed_missions: 56, rating: 4.9, last_active: '5 min ago' },
];

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  available: { color: 'bg-green-600', label: 'Available' },
  busy: { color: 'bg-amber-600', label: 'On Mission' },
  offline: { color: 'bg-zinc-600', label: 'Offline' },
};

const CAPABILITY_CONFIG: Record<Capability, { icon: typeof Truck; color: string; label: string }> = {
  TRANSPORT: { icon: Truck, color: 'bg-blue-900 text-blue-300', label: 'Transport' },
  FOSTER: { icon: Home, color: 'bg-green-900 text-green-300', label: 'Foster' },
  EMERGENCY: { icon: Zap, color: 'bg-red-900 text-red-300', label: 'Emergency' },
};

export default function ModeratorVolunteersPage() {
  const [volunteers] = useState<Volunteer[]>(MOCK_VOLUNTEERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [filterCapability, setFilterCapability] = useState<Capability | 'all'>('all');
  
  // Call modal state
  const [callModal, setCallModal] = useState<{ open: boolean; volunteer: Volunteer } | null>(null);
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  
  // Message modal state
  const [messageModal, setMessageModal] = useState<{ open: boolean; volunteer: Volunteer } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState<string | null>(null);

  const getAccessToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const handleCall = async (volunteer: Volunteer) => {
    setCalling(true);
    setCallStatus(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      
      const res = await fetch('/api/admin/mods/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ volunteer_id: volunteer.id, volunteer_phone: volunteer.phone, volunteer_name: volunteer.name, reason: 'dispatch' }),
      });
      const data = await res.json();
      setCallStatus(data.success ? (data.message || `Calling ${volunteer.name}...`) : `Error: ${data.error}`);
    } catch (err) {
      setCallStatus(`Error: ${err instanceof Error ? err.message : 'Failed to call'}`);
    } finally {
      setCalling(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageModal?.volunteer || !messageText.trim()) return;
    setSending(true);
    setMessageStatus(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      
      const res = await fetch('/api/admin/mods/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipient_id: messageModal.volunteer.id, recipient_name: messageModal.volunteer.name, message: messageText, context: 'volunteer_management' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessageStatus(`Message sent to ${messageModal.volunteer.name}`);
        setMessageText('');
        setTimeout(() => setMessageModal(null), 1500);
      } else {
        setMessageStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessageStatus(`Error: ${err instanceof Error ? err.message : 'Failed to send'}`);
    } finally {
      setSending(false);
    }
  };

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.county.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesCapability = filterCapability === 'all' || v.capabilities.includes(filterCapability);
    return matchesSearch && matchesStatus && matchesCapability;
  });

  const stats = {
    total: volunteers.length,
    available: volunteers.filter(v => v.status === 'available').length,
    busy: volunteers.filter(v => v.status === 'busy').length,
    offline: volunteers.filter(v => v.status === 'offline').length,
    totalMissions: volunteers.reduce((sum, v) => sum + v.completed_missions, 0),
    avgRating: (volunteers.reduce((sum, v) => sum + v.rating, 0) / volunteers.length).toFixed(1),
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">← Command Center</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Volunteer Management</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Volunteer Roster</h1>
              <p className="text-zinc-400 text-sm">Manage and monitor volunteer network</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm"><Calendar className="w-4 h-4 mr-2" />Shift Calendar</Button>
              <Button size="sm"><Users className="w-4 h-4 mr-2" />Add Volunteer</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-zinc-400" /><span className="text-zinc-300 font-medium">{stats.total}</span><span className="text-zinc-500">Total</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-green-400 font-medium">{stats.available}</span><span className="text-zinc-500">Available</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full"></div><span className="text-amber-400 font-medium">{stats.busy}</span><span className="text-zinc-500">On Mission</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-zinc-500 rounded-full"></div><span className="text-zinc-400 font-medium">{stats.offline}</span><span className="text-zinc-500">Offline</span></div>
          <div className="flex items-center gap-2 ml-auto"><CheckCircle className="w-4 h-4 text-blue-400" /><span className="text-blue-400 font-medium">{stats.totalMissions}</span><span className="text-zinc-500">Missions</span></div>
          <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /><span className="text-amber-400 font-medium">{stats.avgRating}</span><span className="text-zinc-500">Avg Rating</span></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" placeholder="Search by name or county..." className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="busy">On Mission</option>
            <option value="offline">Offline</option>
          </select>
          <select className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm" value={filterCapability} onChange={(e) => setFilterCapability(e.target.value as Capability | 'all')}>
            <option value="all">All Capabilities</option>
            <option value="TRANSPORT">Transport</option>
            <option value="FOSTER">Foster</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>

        {/* Volunteer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVolunteers.map(volunteer => (
            <Card key={volunteer.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-medium">{volunteer.name.charAt(0)}</div>
                    <div>
                      <CardTitle className="text-base">{volunteer.name}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-zinc-500"><MapPin className="w-3 h-3" />{volunteer.county}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[volunteer.status].color}`}></div>
                    <span className="text-xs text-zinc-400">{STATUS_CONFIG[volunteer.status].label}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-zinc-400"><Phone className="w-3 h-3" />{volunteer.phone}</div>
                <div className="flex flex-wrap gap-1.5">
                  {volunteer.capabilities.map(cap => {
                    const config = CAPABILITY_CONFIG[cap];
                    const Icon = config.icon;
                    return <span key={cap} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.color}`}><Icon className="w-3 h-3" />{config.label}</span>;
                  })}
                  {volunteer.can_transport_crate && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300"><Package className="w-3 h-3" />Crate</span>}
                  {volunteer.vehicle_type && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300"><Car className="w-3 h-3" />{volunteer.vehicle_type}</span>}
                  {volunteer.foster_capacity > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-900 text-purple-300"><Home className="w-3 h-3" />{volunteer.foster_capacity} slots</span>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-zinc-400"><CheckCircle className="w-3 h-3" />{volunteer.completed_missions}</span>
                    <span className="flex items-center gap-1 text-amber-400"><Star className="w-3 h-3" />{volunteer.rating}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-zinc-500"><Clock className="w-3 h-3" />{volunteer.last_active}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setMessageModal({ open: true, volunteer })}><MessageSquare className="w-3 h-3 mr-1" />Message</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setCallModal({ open: true, volunteer })}><Phone className="w-3 h-3 mr-1" />Call</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filteredVolunteers.length === 0 && (
          <div className="text-center py-12 text-zinc-500"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No volunteers match your filters</p></div>
        )}
      </div>

      {/* Call Modal */}
      {callModal?.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setCallModal(null); setCallStatus(null); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Phone className="w-5 h-5 text-green-400" />Call {callModal.volunteer.name}</h3>
              <button onClick={() => { setCallModal(null); setCallStatus(null); }} className="text-zinc-400 hover:text-zinc-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-sm text-zinc-400 mb-1">Phone Number</p>
                <p className="text-lg font-medium">{callModal.volunteer.phone}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-sm text-zinc-400 mb-1">County</p>
                <p className="font-medium">{callModal.volunteer.county}</p>
              </div>
              {callStatus && <div className={`p-3 rounded-lg text-sm ${callStatus.startsWith('Error') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>{callStatus}</div>}
              <div className="flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={calling} onClick={() => handleCall(callModal.volunteer)}>
                  {calling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
                  {calling ? 'Calling...' : 'Call Now'}
                </Button>
                <Button variant="outline" onClick={() => { setCallModal(null); setCallStatus(null); }}>Cancel</Button>
              </div>
              <p className="text-xs text-zinc-500 text-center">Call will be initiated via Twilio.</p>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal?.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setMessageModal(null); setMessageStatus(null); setMessageText(''); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-400" />Message {messageModal.volunteer.name}</h3>
              <button onClick={() => { setMessageModal(null); setMessageStatus(null); setMessageText(''); }} className="text-zinc-400 hover:text-zinc-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-medium">{messageModal.volunteer.name.charAt(0)}</div>
                <div>
                  <p className="font-medium">{messageModal.volunteer.name}</p>
                  <p className="text-xs text-zinc-400">{messageModal.volunteer.county} • {messageModal.volunteer.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Message</label>
                <textarea className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm h-24 resize-none focus:outline-none focus:border-zinc-600" placeholder="Type your message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} autoFocus />
              </div>
              {messageStatus && <div className={`p-3 rounded-lg text-sm ${messageStatus.startsWith('Error') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>{messageStatus}</div>}
              <div className="flex gap-3">
                <Button className="flex-1" disabled={sending || !messageText.trim()} onClick={handleSendMessage}>
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
                <Button variant="outline" onClick={() => { setMessageModal(null); setMessageStatus(null); setMessageText(''); }}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
