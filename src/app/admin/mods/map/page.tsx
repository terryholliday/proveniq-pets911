'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, RefreshCcw, Truck, Home, Zap, Users, AlertTriangle, 
  ChevronRight, Eye, EyeOff, Layers, Filter
} from 'lucide-react';

// WV County coordinates (approximate centers)
const WV_COUNTIES: Record<string, { lat: number; lng: number; name: string }> = {
  'BARBOUR': { lat: 39.13, lng: -80.00, name: 'Barbour' },
  'BERKELEY': { lat: 39.46, lng: -77.98, name: 'Berkeley' },
  'BOONE': { lat: 38.01, lng: -81.71, name: 'Boone' },
  'BRAXTON': { lat: 38.70, lng: -80.72, name: 'Braxton' },
  'BROOKE': { lat: 40.27, lng: -80.57, name: 'Brooke' },
  'CABELL': { lat: 38.41, lng: -82.24, name: 'Cabell' },
  'CALHOUN': { lat: 38.84, lng: -81.13, name: 'Calhoun' },
  'CLAY': { lat: 38.46, lng: -81.08, name: 'Clay' },
  'DODDRIDGE': { lat: 39.27, lng: -80.71, name: 'Doddridge' },
  'FAYETTE': { lat: 38.05, lng: -81.10, name: 'Fayette' },
  'GILMER': { lat: 38.92, lng: -80.86, name: 'Gilmer' },
  'GRANT': { lat: 39.10, lng: -79.17, name: 'Grant' },
  'GREENBRIER': { lat: 37.95, lng: -80.45, name: 'Greenbrier' },
  'HAMPSHIRE': { lat: 39.32, lng: -78.61, name: 'Hampshire' },
  'HANCOCK': { lat: 40.52, lng: -80.57, name: 'Hancock' },
  'HARDY': { lat: 39.00, lng: -78.86, name: 'Hardy' },
  'HARRISON': { lat: 39.28, lng: -80.37, name: 'Harrison' },
  'JACKSON': { lat: 38.83, lng: -81.67, name: 'Jackson' },
  'JEFFERSON': { lat: 39.31, lng: -77.86, name: 'Jefferson' },
  'KANAWHA': { lat: 38.34, lng: -81.53, name: 'Kanawha' },
  'LEWIS': { lat: 39.00, lng: -80.47, name: 'Lewis' },
  'LINCOLN': { lat: 38.17, lng: -82.07, name: 'Lincoln' },
  'LOGAN': { lat: 37.84, lng: -81.99, name: 'Logan' },
  'MARION': { lat: 39.51, lng: -80.24, name: 'Marion' },
  'MARSHALL': { lat: 39.85, lng: -80.67, name: 'Marshall' },
  'MASON': { lat: 38.77, lng: -82.03, name: 'Mason' },
  'MCDOWELL': { lat: 37.38, lng: -81.65, name: 'McDowell' },
  'MERCER': { lat: 37.40, lng: -81.11, name: 'Mercer' },
  'MINERAL': { lat: 39.42, lng: -78.94, name: 'Mineral' },
  'MINGO': { lat: 37.72, lng: -82.14, name: 'Mingo' },
  'MONONGALIA': { lat: 39.63, lng: -80.05, name: 'Monongalia' },
  'MONROE': { lat: 37.56, lng: -80.55, name: 'Monroe' },
  'MORGAN': { lat: 39.56, lng: -78.26, name: 'Morgan' },
  'NICHOLAS': { lat: 38.29, lng: -80.79, name: 'Nicholas' },
  'OHIO': { lat: 40.07, lng: -80.62, name: 'Ohio' },
  'PENDLETON': { lat: 38.68, lng: -79.35, name: 'Pendleton' },
  'PLEASANTS': { lat: 39.37, lng: -81.16, name: 'Pleasants' },
  'POCAHONTAS': { lat: 38.33, lng: -79.99, name: 'Pocahontas' },
  'PRESTON': { lat: 39.47, lng: -79.67, name: 'Preston' },
  'PUTNAM': { lat: 38.51, lng: -81.91, name: 'Putnam' },
  'RALEIGH': { lat: 37.77, lng: -81.25, name: 'Raleigh' },
  'RANDOLPH': { lat: 38.77, lng: -79.87, name: 'Randolph' },
  'RITCHIE': { lat: 39.18, lng: -81.06, name: 'Ritchie' },
  'ROANE': { lat: 38.71, lng: -81.35, name: 'Roane' },
  'SUMMERS': { lat: 37.66, lng: -80.86, name: 'Summers' },
  'TAYLOR': { lat: 39.35, lng: -80.05, name: 'Taylor' },
  'TUCKER': { lat: 39.11, lng: -79.56, name: 'Tucker' },
  'TYLER': { lat: 39.47, lng: -80.89, name: 'Tyler' },
  'UPSHUR': { lat: 38.90, lng: -80.23, name: 'Upshur' },
  'WAYNE': { lat: 38.15, lng: -82.42, name: 'Wayne' },
  'WEBSTER': { lat: 38.49, lng: -80.42, name: 'Webster' },
  'WETZEL': { lat: 39.60, lng: -80.63, name: 'Wetzel' },
  'WIRT': { lat: 39.02, lng: -81.38, name: 'Wirt' },
  'WOOD': { lat: 39.21, lng: -81.52, name: 'Wood' },
  'WYOMING': { lat: 37.60, lng: -81.55, name: 'Wyoming' },
};

type Ticket = {
  id: string;
  request_type: 'TRANSPORT' | 'FOSTER' | 'EMERGENCY_ASSIST';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  county: string;
  species: string;
  status: string;
  requested_at: string;
};

type Volunteer = {
  id: string;
  name: string;
  county: string;
  capabilities: string[];
  is_available: boolean;
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
};

const TYPE_ICONS: Record<string, typeof Truck> = {
  TRANSPORT: Truck,
  FOSTER: Home,
  EMERGENCY_ASSIST: Zap,
};

export default function LiveMapPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTickets, setShowTickets] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  // Mock data for demonstration
  const MOCK_TICKETS: Ticket[] = [
    { id: 'T1', request_type: 'TRANSPORT', priority: 'CRITICAL', county: 'KANAWHA', species: 'Dog', status: 'PENDING', requested_at: new Date().toISOString() },
    { id: 'T2', request_type: 'FOSTER', priority: 'HIGH', county: 'CABELL', species: 'Cat', status: 'PENDING', requested_at: new Date().toISOString() },
    { id: 'T3', request_type: 'EMERGENCY_ASSIST', priority: 'CRITICAL', county: 'RALEIGH', species: 'Dog', status: 'PENDING', requested_at: new Date().toISOString() },
    { id: 'T4', request_type: 'TRANSPORT', priority: 'MEDIUM', county: 'GREENBRIER', species: 'Cat', status: 'PENDING', requested_at: new Date().toISOString() },
    { id: 'T5', request_type: 'FOSTER', priority: 'LOW', county: 'MONONGALIA', species: 'Dog', status: 'PENDING', requested_at: new Date().toISOString() },
    { id: 'T6', request_type: 'TRANSPORT', priority: 'HIGH', county: 'WOOD', species: 'Dog', status: 'PENDING', requested_at: new Date().toISOString() },
    { id: 'T7', request_type: 'EMERGENCY_ASSIST', priority: 'HIGH', county: 'MERCER', species: 'Cat', status: 'PENDING', requested_at: new Date().toISOString() },
  ];

  const MOCK_VOLUNTEERS: Volunteer[] = [
    { id: 'V1', name: 'Emily C.', county: 'KANAWHA', capabilities: ['TRANSPORT', 'FOSTER'], is_available: true },
    { id: 'V2', name: 'James W.', county: 'CABELL', capabilities: ['TRANSPORT'], is_available: true },
    { id: 'V3', name: 'Sarah M.', county: 'GREENBRIER', capabilities: ['FOSTER'], is_available: false },
    { id: 'V4', name: 'Mike B.', county: 'RALEIGH', capabilities: ['TRANSPORT', 'EMERGENCY'], is_available: true },
    { id: 'V5', name: 'Lisa K.', county: 'MONONGALIA', capabilities: ['TRANSPORT'], is_available: true },
    { id: 'V6', name: 'Tom R.', county: 'HARRISON', capabilities: ['FOSTER', 'EMERGENCY'], is_available: true },
    { id: 'V7', name: 'Anna P.', county: 'MARION', capabilities: ['TRANSPORT'], is_available: false },
  ];

  useEffect(() => {
    // Simulate loading data
    setTickets(MOCK_TICKETS);
    setVolunteers(MOCK_VOLUNTEERS);
    setLoading(false);
  }, []);

  // Calculate map bounds for WV
  const mapBounds = {
    minLat: 37.2,
    maxLat: 40.7,
    minLng: -82.7,
    maxLng: -77.7,
  };

  // Convert lat/lng to SVG coordinates
  const toSvgCoords = (lat: number, lng: number) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 800;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 600;
    return { x, y };
  };

  // Group tickets and volunteers by county
  const ticketsByCounty = tickets.reduce((acc, t) => {
    const county = t.county.toUpperCase();
    if (!acc[county]) acc[county] = [];
    acc[county].push(t);
    return acc;
  }, {} as Record<string, Ticket[]>);

  const volunteersByCounty = volunteers.reduce((acc, v) => {
    const county = v.county.toUpperCase();
    if (!acc[county]) acc[county] = [];
    acc[county].push(v);
    return acc;
  }, {} as Record<string, Volunteer[]>);

  // Filter tickets by priority if selected
  const filteredTicketsByCounty = filterPriority
    ? Object.entries(ticketsByCounty).reduce((acc, [county, tix]) => {
        const filtered = tix.filter(t => t.priority === filterPriority);
        if (filtered.length > 0) acc[county] = filtered;
        return acc;
      }, {} as Record<string, Ticket[]>)
    : ticketsByCounty;

  const stats = {
    totalTickets: tickets.length,
    criticalTickets: tickets.filter(t => t.priority === 'CRITICAL').length,
    availableVolunteers: volunteers.filter(v => v.is_available).length,
    countiesWithTickets: Object.keys(ticketsByCounty).length,
  };

  // Calculate coverage status for each county
  const getCoverageStatus = (countyCode: string): 'covered' | 'partial' | 'dead-zone' => {
    const vols = volunteersByCounty[countyCode] || [];
    const availableVols = vols.filter(v => v.is_available);
    if (availableVols.length >= 2) return 'covered';
    if (availableVols.length === 1) return 'partial';
    return 'dead-zone';
  };

  const coverageStats = {
    covered: Object.keys(WV_COUNTIES).filter(c => getCoverageStatus(c) === 'covered').length,
    partial: Object.keys(WV_COUNTIES).filter(c => getCoverageStatus(c) === 'partial').length,
    deadZones: Object.keys(WV_COUNTIES).filter(c => getCoverageStatus(c) === 'dead-zone').length,
  };

  const getCountyFillColor = (countyCode: string): string => {
    if (!showVolunteers) return '#18181b';
    const status = getCoverageStatus(countyCode);
    if (status === 'covered') return '#14532d'; // dark green
    if (status === 'partial') return '#422006'; // dark amber
    return '#450a0a'; // dark red (dead zone)
  };

  // Calculate distance between two counties (Haversine formula)
  const calculateDistance = (county1: string, county2: string): number => {
    const c1 = WV_COUNTIES[county1];
    const c2 = WV_COUNTIES[county2];
    if (!c1 || !c2) return 999;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (c2.lat - c1.lat) * Math.PI / 180;
    const dLng = (c2.lng - c1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  // Estimate travel time (rough: 1 mile = 2 minutes in rural WV)
  const estimateTravelTime = (miles: number): string => {
    const minutes = Math.round(miles * 2);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Find nearest volunteers to a county
  const findNearbyVolunteers = (countyCode: string, limit: number = 3) => {
    const allVols = volunteers.filter(v => v.is_available);
    const withDistance = allVols.map(v => ({
      ...v,
      distance: calculateDistance(countyCode, v.county.toUpperCase()),
    }));
    return withDistance.sort((a, b) => a.distance - b.distance).slice(0, limit);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex items-center justify-center">
        <p>Please sign in to access the Live Map.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">← Command Center</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Live Map</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-green-400" />
                Live Operations Map
              </h1>
              <p className="text-zinc-400 text-sm">Real-time view of tickets and volunteers across West Virginia</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLoading(true)}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">{stats.criticalTickets}</span>
            <span className="text-zinc-500">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-medium">{stats.totalTickets}</span>
            <span className="text-zinc-500">Open Tickets</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">{stats.availableVolunteers}</span>
            <span className="text-zinc-500">Available</span>
          </div>
          <div className="border-l border-zinc-700 pl-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-700"></div>
              <span className="text-green-400 font-medium">{coverageStats.covered}</span>
              <span className="text-zinc-500">Covered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-700"></div>
              <span className="text-amber-400 font-medium">{coverageStats.partial}</span>
              <span className="text-zinc-500">Partial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-700"></div>
              <span className="text-red-400 font-medium">{coverageStats.deadZones}</span>
              <span className="text-zinc-500">Dead Zones</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Panel */}
          <div className="lg:col-span-3 border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
            {/* Map Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={showTickets ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowTickets(!showTickets)}
                  className={showTickets ? 'bg-amber-600 hover:bg-amber-700' : ''}
                >
                  {showTickets ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  Tickets
                </Button>
                <Button
                  variant={showVolunteers ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowVolunteers(!showVolunteers)}
                  className={showVolunteers ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {showVolunteers ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  Volunteers
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-500" />
                <select
                  value={filterPriority || ''}
                  onChange={(e) => setFilterPriority(e.target.value || null)}
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                >
                  <option value="">All Priorities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High Only</option>
                  <option value="MEDIUM">Medium Only</option>
                  <option value="LOW">Low Only</option>
                </select>
              </div>
            </div>

            {/* SVG Map */}
            <div className="relative bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <svg viewBox="0 0 800 600" className="w-full h-full">
                {/* Background */}
                <rect width="800" height="600" fill="#09090b" />
                
                {/* County dots and labels */}
                {Object.entries(WV_COUNTIES).map(([code, county]) => {
                  const { x, y } = toSvgCoords(county.lat, county.lng);
                  const hasTickets = filteredTicketsByCounty[code]?.length > 0;
                  const hasVolunteers = volunteersByCounty[code]?.length > 0;
                  const isSelected = selectedCounty === code;
                  
                  return (
                    <g key={code} onClick={() => setSelectedCounty(isSelected ? null : code)} className="cursor-pointer">
                      {/* County base dot with coverage color */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 18 : 12}
                        fill={isSelected ? '#3b82f6' : getCountyFillColor(code)}
                        stroke={hasTickets && showTickets ? PRIORITY_COLORS[filteredTicketsByCounty[code][0].priority] : '#3f3f46'}
                        strokeWidth={hasTickets && showTickets ? 3 : 1}
                        className="transition-all duration-200 hover:opacity-80"
                      />
                      
                      {/* Ticket indicator */}
                      {showTickets && hasTickets && (
                        <g>
                          <circle
                            cx={x - 8}
                            cy={y - 8}
                            r={8}
                            fill={PRIORITY_COLORS[filteredTicketsByCounty[code][0].priority]}
                          />
                          <text
                            x={x - 8}
                            y={y - 5}
                            textAnchor="middle"
                            className="text-[10px] fill-white font-bold"
                          >
                            {filteredTicketsByCounty[code].length}
                          </text>
                        </g>
                      )}
                      
                      {/* Volunteer indicator */}
                      {showVolunteers && hasVolunteers && (
                        <g>
                          <circle
                            cx={x + 8}
                            cy={y - 8}
                            r={8}
                            fill="#22c55e"
                          />
                          <text
                            x={x + 8}
                            y={y - 5}
                            textAnchor="middle"
                            className="text-[10px] fill-white font-bold"
                          >
                            {volunteersByCounty[code].filter(v => v.is_available).length}
                          </text>
                        </g>
                      )}
                      
                      {/* County label */}
                      <text
                        x={x}
                        y={y + 22}
                        textAnchor="middle"
                        className={`text-[9px] ${isSelected ? 'fill-blue-400' : 'fill-zinc-500'}`}
                      >
                        {county.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 text-xs">
                <div className="font-medium mb-2">Legend</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-zinc-400">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-zinc-400">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-zinc-400">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-zinc-400">Volunteers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="font-medium">
                {selectedCounty ? `${WV_COUNTIES[selectedCounty]?.name} County` : 'Select a County'}
              </h3>
            </div>
            
            {selectedCounty ? (
              <div className="p-4 space-y-4">
                {/* Tickets in county */}
                <div>
                  <div className="text-xs text-zinc-500 uppercase mb-2">Open Tickets</div>
                  {ticketsByCounty[selectedCounty]?.length > 0 ? (
                    <div className="space-y-2">
                      {ticketsByCounty[selectedCounty].map(ticket => {
                        const TypeIcon = TYPE_ICONS[ticket.request_type];
                        return (
                          <div key={ticket.id} className="p-2 bg-zinc-800/50 rounded border border-zinc-700">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: PRIORITY_COLORS[ticket.priority], color: PRIORITY_COLORS[ticket.priority] }}
                              >
                                {ticket.priority}
                              </Badge>
                              <TypeIcon className="w-3 h-3 text-zinc-400" />
                              <span className="text-xs">{ticket.request_type}</span>
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">{ticket.species}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">No open tickets</div>
                  )}
                </div>

                {/* Volunteers in county */}
                <div>
                  <div className="text-xs text-zinc-500 uppercase mb-2">Local Volunteers</div>
                  {volunteersByCounty[selectedCounty]?.length > 0 ? (
                    <div className="space-y-2">
                      {volunteersByCounty[selectedCounty].map(vol => (
                        <div key={vol.id} className="p-2 bg-zinc-800/50 rounded border border-zinc-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{vol.name}</span>
                            <Badge variant={vol.is_available ? 'default' : 'secondary'} className="text-xs">
                              {vol.is_available ? 'Available' : 'Busy'}
                            </Badge>
                          </div>
                          <div className="flex gap-1 mt-1">
                            {vol.capabilities.map(cap => (
                              <span key={cap} className="text-xs bg-zinc-700 px-1 rounded">{cap}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 mb-2">No local volunteers</div>
                  )}
                </div>

                {/* Nearby Volunteers (from other counties) */}
                {getCoverageStatus(selectedCounty) !== 'covered' && (
                  <div>
                    <div className="text-xs text-zinc-500 uppercase mb-2">Nearest Available</div>
                    <div className="space-y-2">
                      {findNearbyVolunteers(selectedCounty).map(vol => (
                        <div key={vol.id} className="p-2 bg-blue-900/20 rounded border border-blue-800/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{vol.name}</span>
                            <span className="text-xs text-blue-400">{vol.distance} mi</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500 mt-1">
                            <span>{WV_COUNTIES[vol.county.toUpperCase()]?.name || vol.county}</span>
                            <span>~{estimateTravelTime(vol.distance)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link href="/admin/mods/dispatch">
                  <Button size="sm" className="w-full">
                    <ChevronRight className="w-4 h-4 mr-1" />
                    View Dispatch Queue
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-6 text-center text-zinc-500 text-sm">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Click a county on the map to see details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
