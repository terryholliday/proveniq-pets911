'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, Plus, Clock, CheckCircle, XCircle, Eye, 
  MapPin, User, FileText, MessageSquare, Filter
} from 'lucide-react';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Status = 'open' | 'investigating' | 'resolved' | 'closed';

type Incident = {
  id: string;
  title: string;
  type: string;
  severity: Severity;
  status: Status;
  county: string;
  reported_by: string;
  reported_at: string;
  description: string;
  assigned_to?: string;
};

const MOCK_INCIDENTS: Incident[] = [
  { id: 'INC-001', title: 'Aggressive dog at pickup location', type: 'Safety', severity: 'high', status: 'investigating', county: 'KANAWHA', reported_by: 'John Mitchell', reported_at: '2 hours ago', description: 'Volunteer reported aggressive dog at 123 Main St. Owner was not present.', assigned_to: 'Mod Team' },
  { id: 'INC-002', title: 'Vehicle breakdown during transport', type: 'Logistics', severity: 'medium', status: 'resolved', county: 'CABELL', reported_by: 'Lisa Anderson', reported_at: '1 day ago', description: 'Transport volunteer vehicle broke down. Animal safely transferred to backup volunteer.' },
  { id: 'INC-003', title: 'Property access denied', type: 'Access', severity: 'low', status: 'closed', county: 'GREENBRIER', reported_by: 'Robert Davis', reported_at: '3 days ago', description: 'Gate code provided was incorrect. Contact updated in system.' },
  { id: 'INC-004', title: 'Animal escape during transfer', type: 'Safety', severity: 'critical', status: 'open', county: 'BERKELEY', reported_by: 'Sarah Williams', reported_at: '30 min ago', description: 'Cat escaped carrier during transfer. Still searching in area.' },
];

const SEVERITY_CONFIG: Record<Severity, { color: string; label: string }> = {
  critical: { color: 'bg-red-600 text-white', label: 'Critical' },
  high: { color: 'bg-orange-600 text-white', label: 'High' },
  medium: { color: 'bg-yellow-600 text-black', label: 'Medium' },
  low: { color: 'bg-blue-600 text-white', label: 'Low' },
};

const STATUS_CONFIG: Record<Status, { color: string; label: string; icon: typeof CheckCircle }> = {
  open: { color: 'text-red-400', label: 'Open', icon: AlertTriangle },
  investigating: { color: 'text-amber-400', label: 'Investigating', icon: Eye },
  resolved: { color: 'text-green-400', label: 'Resolved', icon: CheckCircle },
  closed: { color: 'text-zinc-400', label: 'Closed', icon: XCircle },
};

export default function ModeratorIncidentsPage() {
  const [incidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  const filteredIncidents = incidents.filter(i => {
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || i.severity === filterSeverity;
    return matchesStatus && matchesSeverity;
  });

  const stats = {
    open: incidents.filter(i => i.status === 'open').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    critical: incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">← Command Center</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Incident Reports</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Incident Management</h1>
              <p className="text-zinc-400 text-sm">Track and resolve operational incidents</p>
            </div>
            <Button onClick={() => setShowNewForm(!showNewForm)}><Plus className="w-4 h-4 mr-2" />Report Incident</Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-red-400 font-medium">{stats.open}</span><span className="text-zinc-500">Open</span></div>
          <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-amber-400" /><span className="text-amber-400 font-medium">{stats.investigating}</span><span className="text-zinc-500">Investigating</span></div>
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-red-400 font-medium">{stats.critical}</span><span className="text-zinc-500">Critical</span></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* New Incident Form */}
        {showNewForm && (
          <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle>Report New Incident</CardTitle>
              <CardDescription>Document an operational issue or safety concern</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Incident Title</label>
                  <input type="text" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm" placeholder="Brief description..." />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Type</label>
                  <select className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm">
                    <option>Safety</option>
                    <option>Logistics</option>
                    <option>Access</option>
                    <option>Communication</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Severity</label>
                  <select className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm">
                    <option value="critical">Critical - Immediate action needed</option>
                    <option value="high">High - Urgent attention</option>
                    <option value="medium">Medium - Should be addressed soon</option>
                    <option value="low">Low - Minor issue</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">County</label>
                  <select className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm">
                    <option>Kanawha</option>
                    <option>Cabell</option>
                    <option>Greenbrier</option>
                    <option>Berkeley</option>
                    <option>Monongalia</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Description</label>
                <textarea className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm h-24 resize-none" placeholder="Detailed description of the incident..." />
              </div>
              <div className="flex gap-2">
                <Button>Submit Report</Button>
                <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as Severity | 'all')}>
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {filteredIncidents.map(incident => {
            const StatusIcon = STATUS_CONFIG[incident.status].icon;
            return (
              <Card 
                key={incident.id} 
                className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer ${selectedIncident === incident.id ? 'border-blue-600' : ''}`}
                onClick={() => setSelectedIncident(selectedIncident === incident.id ? null : incident.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${incident.severity === 'critical' ? 'bg-red-900/50' : 'bg-zinc-800'}`}>
                        <AlertTriangle className={`w-5 h-5 ${incident.severity === 'critical' ? 'text-red-400' : 'text-zinc-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{incident.title}</span>
                          <Badge className={SEVERITY_CONFIG[incident.severity].color}>{SEVERITY_CONFIG[incident.severity].label}</Badge>
                          <Badge variant="outline" className="text-xs">{incident.type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{incident.id}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.county}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{incident.reported_by}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{incident.reported_at}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${STATUS_CONFIG[incident.status].color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {STATUS_CONFIG[incident.status].label}
                    </div>
                  </div>
                  
                  {selectedIncident === incident.id && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-sm text-zinc-400 mb-3">{incident.description}</p>
                      {incident.assigned_to && <p className="text-xs text-zinc-500 mb-3">Assigned to: {incident.assigned_to}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline"><Eye className="w-3 h-3 mr-1" />View Details</Button>
                        <Button size="sm" variant="outline"><MessageSquare className="w-3 h-3 mr-1" />Add Note</Button>
                        {incident.status === 'open' && <Button size="sm">Start Investigation</Button>}
                        {incident.status === 'investigating' && <Button size="sm" className="bg-green-600 hover:bg-green-700">Mark Resolved</Button>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredIncidents.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>No incidents match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
