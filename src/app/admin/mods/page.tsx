'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { X, Loader2 } from 'lucide-react';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone,
  MessageSquare,
  BarChart3,
  Shield,
  Activity,
  Truck,
  Home,
  AlertCircle,
  ChevronRight,
  RefreshCcw,
  Zap,
  Dog,
  Cat,
  UserCheck,
  Send,
  Car,
  Package
} from 'lucide-react';

type TicketType = 'TRANSPORT' | 'FOSTER' | 'EMERGENCY_ASSIST';
type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type Capability = 'TRANSPORT' | 'FOSTER' | 'EMERGENCY';

type OpenTicket = {
  id: string;
  type: TicketType;
  priority: Priority;
  species: string;
  animal_size: string;
  county: string;
  pickup_address: string;
  waiting_minutes: number;
  requester_name: string;
  notes?: string;
};

type AvailableVolunteer = {
  id: string;
  name: string;
  phone: string;
  county: string;
  capabilities: Capability[];
  vehicle_type: string | null;
  can_transport_crate: boolean;
  foster_capacity: number;
  completed_missions: number;
  rating: number;
};

type Escalation = {
  id: string;
  ticket_id: string;
  reason: string;
};

// Mock data for demonstration - in production this comes from API
const MOCK_OPEN_TICKETS: OpenTicket[] = [
  {
    id: 'TKT-001',
    type: 'TRANSPORT',
    priority: 'CRITICAL',
    species: 'DOG',
    animal_size: 'LARGE',
    county: 'KANAWHA',
    pickup_address: '123 Main St, Charleston',
    waiting_minutes: 45,
    requester_name: 'Sarah Johnson',
    notes: 'Injured stray, needs immediate vet transport'
  },
  {
    id: 'TKT-002',
    type: 'FOSTER',
    priority: 'HIGH',
    species: 'CAT',
    animal_size: 'SMALL',
    county: 'CABELL',
    pickup_address: 'HCW Animal Shelter',
    waiting_minutes: 120,
    requester_name: 'Mike Wilson',
    notes: 'Mother cat with 4 kittens, shelter at capacity'
  },
  {
    id: 'TKT-003',
    type: 'TRANSPORT',
    priority: 'MEDIUM',
    species: 'DOG',
    animal_size: 'MEDIUM',
    county: 'GREENBRIER',
    pickup_address: 'Lewisburg Vet Clinic',
    waiting_minutes: 30,
    requester_name: 'Dr. Emily Chen',
    notes: 'Post-surgery recovery transport to foster'
  },
];

const MOCK_AVAILABLE_VOLUNTEERS: AvailableVolunteer[] = [
  {
    id: 'VOL-001',
    name: 'John Mitchell',
    phone: '(304) 555-1234',
    county: 'KANAWHA',
    capabilities: ['TRANSPORT', 'EMERGENCY'],
    vehicle_type: 'SUV',
    can_transport_crate: true,
    foster_capacity: 0,
    completed_missions: 47,
    rating: 4.9,
  },
  {
    id: 'VOL-002',
    name: 'Lisa Anderson',
    phone: '(304) 555-5678',
    county: 'CABELL',
    capabilities: ['FOSTER', 'TRANSPORT'],
    vehicle_type: 'Sedan',
    can_transport_crate: false,
    foster_capacity: 3,
    completed_missions: 23,
    rating: 4.7,
  },
  {
    id: 'VOL-003',
    name: 'Robert Davis',
    phone: '(304) 555-9012',
    county: 'GREENBRIER',
    capabilities: ['TRANSPORT', 'FOSTER', 'EMERGENCY'],
    vehicle_type: 'Truck',
    can_transport_crate: true,
    foster_capacity: 2,
    completed_missions: 89,
    rating: 5.0,
  },
  {
    id: 'VOL-004',
    name: 'Amy Thompson',
    phone: '(304) 555-3456',
    county: 'KANAWHA',
    capabilities: ['FOSTER'],
    vehicle_type: null,
    can_transport_crate: false,
    foster_capacity: 5,
    completed_missions: 15,
    rating: 4.8,
  },
];

const MOCK_ESCALATIONS: Escalation[] = [
  {
    id: 'ESC-001',
    ticket_id: 'TKT-002',
    reason: 'Waiting over 2 hours - no volunteer assigned',
  },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-600 text-white',
  MEDIUM: 'bg-yellow-600 text-black',
  LOW: 'bg-blue-600 text-white',
};

const TYPE_ICONS: Record<TicketType, typeof Truck> = {
  TRANSPORT: Truck,
  FOSTER: Home,
  EMERGENCY_ASSIST: Zap,
};

const CAPABILITY_CONFIG: Record<Capability, { icon: typeof Truck; color: string; label: string }> = {
  TRANSPORT: { icon: Truck, color: 'bg-blue-900 text-blue-300', label: 'Transport' },
  FOSTER: { icon: Home, color: 'bg-green-900 text-green-300', label: 'Foster' },
  EMERGENCY: { icon: Zap, color: 'bg-red-900 text-red-300', label: 'Emergency' },
};

export default function ModeratorDashboardPage() {
  const { user } = useAuth();
  const [openTickets] = useState<OpenTicket[]>(MOCK_OPEN_TICKETS);
  const [availableVolunteers] = useState<AvailableVolunteer[]>(MOCK_AVAILABLE_VOLUNTEERS);
  const [escalations] = useState<Escalation[]>(MOCK_ESCALATIONS);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  
  // Coverage area state
  const [myCoverage, setMyCoverage] = useState<{ counties: string[]; hasStatewide: boolean }>({ counties: [], hasStatewide: false });
  const [loadingCoverage, setLoadingCoverage] = useState(true);

  // Fetch moderator's coverage areas on mount
  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.access_token) return;
        
        const res = await fetch('/api/admin/mods/my-coverage', {
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });
        const data = await res.json();
        if (data.success) {
          setMyCoverage({ counties: data.data.counties || [], hasStatewide: data.data.hasStatewide || false });
        }
      } catch (err) {
        console.error('Failed to fetch coverage:', err);
      } finally {
        setLoadingCoverage(false);
      }
    };
    fetchCoverage();
  }, []);

  // Filter tickets by coverage area (unless statewide)
  const filteredTickets = myCoverage.hasStatewide 
    ? openTickets 
    : openTickets.filter(t => myCoverage.counties.length === 0 || myCoverage.counties.includes(t.county));
  
  // Filter volunteers by coverage area (unless statewide)
  const filteredVolunteers = myCoverage.hasStatewide
    ? availableVolunteers
    : availableVolunteers.filter(v => myCoverage.counties.length === 0 || myCoverage.counties.includes(v.county));
  
  // Call modal state
  const [callModal, setCallModal] = useState<{ open: boolean; volunteer?: AvailableVolunteer; requesterPhone?: string; requesterName?: string } | null>(null);
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  
  // Message modal state
  const [messageModal, setMessageModal] = useState<{ open: boolean; volunteer?: AvailableVolunteer } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState<string | null>(null);

  const getAccessToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const handleCall = async (phone: string, name: string, volunteerId?: string) => {
    setCalling(true);
    setCallStatus(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      
      const res = await fetch('/api/admin/mods/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ volunteer_id: volunteerId, volunteer_phone: phone, volunteer_name: name, reason: 'dispatch' }),
      });
      const data = await res.json();
      if (data.success) {
        setCallStatus(data.message || `Calling ${name}...`);
      } else {
        setCallStatus(`Error: ${data.error}`);
      }
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
        body: JSON.stringify({ 
          recipient_id: messageModal.volunteer.id, 
          recipient_name: messageModal.volunteer.name,
          message: messageText,
          context: 'dispatch'
        }),
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

  const stats = {
    openTickets: filteredTickets.length,
    criticalTickets: filteredTickets.filter(t => t.priority === 'CRITICAL').length,
    availableVolunteers: filteredVolunteers.length,
    transportCapable: filteredVolunteers.filter(v => v.capabilities.includes('TRANSPORT')).length,
    fosterCapable: filteredVolunteers.filter(v => v.capabilities.includes('FOSTER')).length,
    totalFosterSlots: filteredVolunteers.reduce((sum, v) => sum + (v.foster_capacity || 0), 0),
    escalations: escalations.length,
    avgWaitTime: Math.round(filteredTickets.reduce((sum, t) => sum + t.waiting_minutes, 0) / (filteredTickets.length || 1)),
  };

  const refreshData = async () => {
    setLoadingData(true);
    // In production, fetch from API
    setTimeout(() => setLoadingData(false), 500);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
            <Shield className="w-8 h-8 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-zinc-400">Please sign in to access the moderator dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Coverage Area Banner */}
      {!loadingCoverage && (
        <div className="bg-blue-900/30 border-b border-blue-800 px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 font-medium">Your Coverage:</span>
            {myCoverage.hasStatewide ? (
              <Badge variant="outline" className="border-blue-600 text-blue-300">West Virginia (Statewide)</Badge>
            ) : myCoverage.counties.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {myCoverage.counties.slice(0, 5).map(county => (
                  <Badge key={county} variant="outline" className="border-blue-800 text-blue-300 text-xs">{county}</Badge>
                ))}
                {myCoverage.counties.length > 5 && (
                  <Badge variant="outline" className="border-blue-800 text-blue-300 text-xs">+{myCoverage.counties.length - 5} more</Badge>
                )}
              </div>
            ) : (
              <span className="text-amber-400">No coverage assigned - contact SYSOP</span>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Moderator Command Center</h1>
              <p className="text-zinc-400 text-sm">Real-time operations dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={refreshData} disabled={loadingData}>
                <RefreshCcw className={`w-4 h-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge variant="outline" className="text-green-400 border-green-800">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Online
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">{stats.criticalTickets}</span>
            <span className="text-zinc-400">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-medium">{stats.openTickets}</span>
            <span className="text-zinc-400">Open Tickets</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">{stats.availableVolunteers}</span>
            <span className="text-zinc-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">{stats.transportCapable}</span>
            <span className="text-zinc-400">Transport</span>
          </div>
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 font-medium">{stats.totalFosterSlots}</span>
            <span className="text-zinc-400">Foster Slots</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-300 font-medium">{stats.avgWaitTime}m</span>
            <span className="text-zinc-400">Avg Wait</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Escalations Alert */}
        {escalations.length > 0 && (
          <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="flex-1">
                <p className="font-medium text-red-300">
                  {escalations.length} ticket{escalations.length > 1 ? 's' : ''} requiring immediate attention
                </p>
                <p className="text-sm text-red-400/80">
                  {escalations.map(e => `${e.ticket_id}: ${e.reason}`).join(' | ')}
                </p>
              </div>
              <Link href="/admin/mods/dispatch">
                <Button variant="destructive" size="sm">Handle Now</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Open Tickets Panel */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Open Tickets
                  <Badge variant="secondary">{openTickets.length}</Badge>
                </CardTitle>
                <Link href="/admin/mods/dispatch">
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Requests awaiting assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>All caught up! No open tickets in your coverage area.</p>
                </div>
              ) : (
                filteredTickets.map(ticket => {
                  const TypeIcon = TYPE_ICONS[ticket.type];
                  return (
                    <div 
                      key={ticket.id}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedTicket === ticket.id 
                          ? 'border-amber-600 bg-amber-900/20' 
                          : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
                      }`}
                      onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-zinc-800">
                            <TypeIcon className="w-4 h-4 text-zinc-300" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={PRIORITY_COLORS[ticket.priority]} variant="secondary">
                                {ticket.priority}
                              </Badge>
                              <span className="font-medium text-sm">{ticket.type}</span>
                              <span className="text-xs text-zinc-500">{ticket.id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {ticket.species === 'DOG' ? <Dog className="w-3 h-3" /> : <Cat className="w-3 h-3" />}
                              <span className="text-zinc-300">{ticket.species} ({ticket.animal_size})</span>
                              <span className="text-zinc-500">•</span>
                              <MapPin className="w-3 h-3 text-zinc-500" />
                              <span className="text-zinc-400">{ticket.county}</span>
                            </div>
                            {ticket.notes && (
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{ticket.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${ticket.waiting_minutes > 60 ? 'text-red-400' : 'text-amber-400'}`}>
                            {ticket.waiting_minutes}m
                          </div>
                          <div className="text-xs text-zinc-500">waiting</div>
                        </div>
                      </div>
                      
                      {selectedTicket === ticket.id && (
                        <div className="mt-3 pt-3 border-t border-zinc-700 space-y-2">
                          <div className="text-xs text-zinc-400">
                            <span className="font-medium">Pickup:</span> {ticket.pickup_address}
                          </div>
                          <div className="text-xs text-zinc-400">
                            <span className="font-medium">Requester:</span> {ticket.requester_name}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Link href={`/admin/mods/dispatch?ticket=${ticket.id}`} className="flex-1">
                              <Button size="sm" className="w-full">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Assign
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // For tickets, we'd call the requester - mock phone for now
                                setCallModal({ open: true, requesterPhone: '(304) 555-0000', requesterName: ticket.requester_name });
                              }}
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Call
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Available Volunteers Panel */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  Available Volunteers
                  <Badge variant="secondary" className="bg-green-900 text-green-300">
                    {availableVolunteers.length}
                  </Badge>
                </CardTitle>
                <Link href="/admin/mods/volunteers">
                  <Button variant="ghost" size="sm">
                    Manage <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Online and ready to help</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredVolunteers.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No volunteers available in your coverage area</p>
                </div>
              ) : (
                filteredVolunteers.map(volunteer => (
                  <div 
                    key={volunteer.id}
                    className="p-3 rounded-lg border border-zinc-800 bg-zinc-800/30 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{volunteer.name}</span>
                          <div className="flex items-center gap-1 text-xs text-amber-400">
                            <span>★</span>
                            <span>{volunteer.rating}</span>
                          </div>
                          <span className="text-xs text-zinc-500">({volunteer.completed_missions} missions)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{volunteer.county}</span>
                          <span className="text-zinc-600">•</span>
                          <Phone className="w-3 h-3" />
                          <span>{volunteer.phone}</span>
                        </div>
                        
                        {/* Capabilities */}
                        <div className="flex flex-wrap gap-1.5">
                          {volunteer.capabilities.map(cap => {
                            const config = CAPABILITY_CONFIG[cap];
                            const Icon = config.icon;
                            return (
                              <span key={cap} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.color}`}>
                                <Icon className="w-3 h-3" />
                                {config.label}
                              </span>
                            );
                          })}
                          {volunteer.can_transport_crate && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300">
                              <Package className="w-3 h-3" />
                              Crate OK
                            </span>
                          )}
                          {volunteer.vehicle_type && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300">
                              <Car className="w-3 h-3" />
                              {volunteer.vehicle_type}
                            </span>
                          )}
                          {volunteer.foster_capacity > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-900 text-purple-300">
                              <Home className="w-3 h-3" />
                              {volunteer.foster_capacity} slots
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => setMessageModal({ open: true, volunteer })}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => setCallModal({ open: true, volunteer })}
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Coverage Gaps */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400" />
                Coverage Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>McDowell County</span>
                  <Badge variant="destructive" className="text-xs">No Volunteers</Badge>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Wyoming County</span>
                  <Badge variant="destructive" className="text-xs">No Volunteers</Badge>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Webster County</span>
                  <Badge className="text-xs bg-orange-900 text-orange-300">1 Volunteer</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Status */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                Resource Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Transport Crates</span>
                  <span className="text-green-400">12 available</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Foster Homes</span>
                  <span className="text-green-400">{stats.totalFosterSlots} slots</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Emergency Fund</span>
                  <span className="text-amber-400">$2,340</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/admin/mods/communications">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Broadcast
                  </Button>
                </Link>
                <Link href="/admin/mods/incidents">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Report
                  </Button>
                </Link>
                <Link href="/admin/mods/analytics">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/admin/mods/volunteers">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Roster
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call Modal */}
      {callModal?.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setCallModal(null); setCallStatus(null); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-400" />
                Call {callModal.volunteer?.name || callModal.requesterName}
              </h3>
              <button onClick={() => { setCallModal(null); setCallStatus(null); }} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-sm text-zinc-400 mb-1">Phone Number</p>
                <p className="text-lg font-medium">{callModal.volunteer?.phone || callModal.requesterPhone}</p>
              </div>
              
              {callModal.volunteer && (
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-sm text-zinc-400 mb-1">County</p>
                  <p className="font-medium">{callModal.volunteer.county}</p>
                </div>
              )}
              
              {callStatus && (
                <div className={`p-3 rounded-lg text-sm ${callStatus.startsWith('Error') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                  {callStatus}
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={calling}
                  onClick={() => handleCall(
                    callModal.volunteer?.phone || callModal.requesterPhone || '',
                    callModal.volunteer?.name || callModal.requesterName || 'Unknown',
                    callModal.volunteer?.id
                  )}
                >
                  {calling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
                  {calling ? 'Calling...' : 'Call Now'}
                </Button>
                <Button variant="outline" onClick={() => { setCallModal(null); setCallStatus(null); }}>
                  Cancel
                </Button>
              </div>
              
              <p className="text-xs text-zinc-500 text-center">
                Call will be initiated via Twilio. Volunteer will hear a dispatch message.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal?.open && messageModal.volunteer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setMessageModal(null); setMessageStatus(null); setMessageText(''); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                Message {messageModal.volunteer.name}
              </h3>
              <button onClick={() => { setMessageModal(null); setMessageStatus(null); setMessageText(''); }} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-medium">
                  {messageModal.volunteer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{messageModal.volunteer.name}</p>
                  <p className="text-xs text-zinc-400">{messageModal.volunteer.county} • {messageModal.volunteer.phone}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Message</label>
                <textarea 
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm h-24 resize-none focus:outline-none focus:border-zinc-600"
                  placeholder="Type your message to the volunteer..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-zinc-500 mt-1">{messageText.length}/500 characters</p>
              </div>
              
              {messageStatus && (
                <div className={`p-3 rounded-lg text-sm ${messageStatus.startsWith('Error') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                  {messageStatus}
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  className="flex-1"
                  disabled={sending || !messageText.trim()}
                  onClick={handleSendMessage}
                >
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
                <Button variant="outline" onClick={() => { setMessageModal(null); setMessageStatus(null); setMessageText(''); }}>
                  Cancel
                </Button>
              </div>
              
              <p className="text-xs text-zinc-500 text-center">
                Message will be sent as a direct message in the Pet911 app.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
