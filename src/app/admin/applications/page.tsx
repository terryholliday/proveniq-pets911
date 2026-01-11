'use client';

/**
 * Volunteer Application Review Dashboard
 * 
 * Admin interface for reviewing, approving, and managing volunteer applications.
 * Only accessible to moderators and above.
 */

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Filter, CheckCircle2, XCircle, Clock, AlertTriangle,
  Shield, Truck, Home, Target, Users, User, Phone, Mail, MapPin, Calendar,
  FileText, ChevronDown, ChevronRight, Eye, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RoleId, ApplicationStatus } from '@/lib/roles';
import { ROLE_DEFINITIONS, APPLICATION_REQUIREMENTS } from '@/lib/roles';

// Mock data for demonstration
const MOCK_APPLICATIONS = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'moderator' as RoleId, status: 'SUBMITTED' as ApplicationStatus, submittedAt: '2026-01-10T14:30:00Z', county: 'Kanawha' },
  { id: '2', name: 'Mike Peters', email: 'mike@example.com', role: 'transporter' as RoleId, status: 'PENDING_BACKGROUND' as ApplicationStatus, submittedAt: '2026-01-09T10:15:00Z', county: 'Greenbrier' },
  { id: '3', name: 'Emily Davis', email: 'emily@example.com', role: 'emergency_foster' as RoleId, status: 'UNDER_REVIEW' as ApplicationStatus, submittedAt: '2026-01-08T16:45:00Z', county: 'Kanawha' },
  { id: '4', name: 'John Smith', email: 'john@example.com', role: 'trapper' as RoleId, status: 'PENDING_TRAINING' as ApplicationStatus, submittedAt: '2026-01-07T09:00:00Z', county: 'Greenbrier' },
  { id: '5', name: 'Lisa Brown', email: 'lisa@example.com', role: 'foster' as RoleId, status: 'SUBMITTED' as ApplicationStatus, submittedAt: '2026-01-10T11:20:00Z', county: 'Kanawha' },
  { id: '6', name: 'David Wilson', email: 'david@example.com', role: 'community_volunteer' as RoleId, status: 'APPROVED' as ApplicationStatus, submittedAt: '2026-01-05T13:00:00Z', county: 'Greenbrier' },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  moderator: <Shield className="h-4 w-4" />,
  lead_moderator: <Shield className="h-4 w-4" />,
  junior_moderator: <Shield className="h-4 w-4" />,
  transporter: <Truck className="h-4 w-4" />,
  senior_transporter: <Truck className="h-4 w-4" />,
  foster: <Home className="h-4 w-4" />,
  emergency_foster: <AlertTriangle className="h-4 w-4" />,
  trapper: <Target className="h-4 w-4" />,
  community_volunteer: <Users className="h-4 w-4" />,
};

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Draft', color: 'bg-zinc-500', icon: <FileText className="h-3 w-3" /> },
  SUBMITTED: { label: 'New', color: 'bg-blue-500', icon: <Clock className="h-3 w-3" /> },
  UNDER_REVIEW: { label: 'Reviewing', color: 'bg-amber-500', icon: <Eye className="h-3 w-3" /> },
  PENDING_BACKGROUND: { label: 'Background Check', color: 'bg-purple-500', icon: <Shield className="h-3 w-3" /> },
  PENDING_TRAINING: { label: 'Training', color: 'bg-teal-500', icon: <FileText className="h-3 w-3" /> },
  PENDING_INTERVIEW: { label: 'Interview', color: 'bg-indigo-500', icon: <MessageSquare className="h-3 w-3" /> },
  APPROVED: { label: 'Approved', color: 'bg-green-500', icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED: { label: 'Rejected', color: 'bg-red-500', icon: <XCircle className="h-3 w-3" /> },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-zinc-400', icon: <XCircle className="h-3 w-3" /> },
};

export default function ApplicationsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [roleFilter, setRoleFilter] = useState<RoleId | 'all'>('all');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredApps = MOCK_APPLICATIONS.filter(app => {
    if (filter === 'pending' && ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(app.status)) return false;
    if (filter === 'approved' && app.status !== 'APPROVED') return false;
    if (filter === 'rejected' && app.status !== 'REJECTED') return false;
    if (roleFilter !== 'all' && app.role !== roleFilter) return false;
    if (search && !app.name.toLowerCase().includes(search.toLowerCase()) && !app.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingCount = MOCK_APPLICATIONS.filter(a => !['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(a.status)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/pigpig" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Volunteer Applications</h1>
                <p className="text-sm text-muted-foreground">{pendingCount} pending review</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && pendingCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as RoleId | 'all')}
            className="px-4 py-2 rounded-lg border border-border bg-background"
          >
            <option value="all">All Roles</option>
            <option value="moderator">Moderator</option>
            <option value="transporter">Transporter</option>
            <option value="foster">Foster</option>
            <option value="emergency_foster">Emergency Foster</option>
            <option value="trapper">Trapper</option>
            <option value="community_volunteer">Community</option>
          </select>
        </div>

        {/* Applications List */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-3">
            {filteredApps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No applications match your filters</p>
              </div>
            ) : (
              filteredApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedApp === app.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ROLE_ICONS[app.role]}
                      <span className="font-medium">{app.name}</span>
                    </div>
                    <Badge className={`${STATUS_CONFIG[app.status].color} text-white text-xs`}>
                      {STATUS_CONFIG[app.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{ROLE_DEFINITIONS[app.role]?.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.county}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {selectedApp ? (
              <ApplicationDetail 
                application={MOCK_APPLICATIONS.find(a => a.id === selectedApp)!}
                onAction={(action) => {
                  console.log('Action:', action);
                  alert(`Action: ${action}`);
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl p-12">
                <div className="text-center">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select an application to review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ApplicationDetail({ 
  application, 
  onAction 
}: { 
  application: typeof MOCK_APPLICATIONS[0];
  onAction: (action: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const requirements = APPLICATION_REQUIREMENTS[application.role];
  const statusConfig = STATUS_CONFIG[application.status];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-muted/30 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-background">{ROLE_ICONS[application.role]}</div>
              <div>
                <h2 className="text-xl font-bold">{application.name}</h2>
                <p className="text-muted-foreground">{ROLE_DEFINITIONS[application.role]?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{application.email}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{application.county} County</span>
            </div>
          </div>
          <Badge className={`${statusConfig.color} text-white`}>
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Requirements Checklist */}
        <div>
          <h3 className="font-semibold mb-3">Application Requirements</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <CheckItem label="Minimum Age" checked={true} detail={`${requirements.minimumAge}+ years`} />
            <CheckItem label="Background Check" checked={application.status !== 'SUBMITTED'} detail={requirements.requiresBackgroundCheck ? 'Required' : 'Not required'} required={requirements.requiresBackgroundCheck} />
            <CheckItem label="Interview" checked={application.status === 'APPROVED'} detail={requirements.requiresInterview ? 'Required' : 'Not required'} required={requirements.requiresInterview} />
            <CheckItem label="References" checked={true} detail={`${requirements.minimumReferences} verified`} required={requirements.requiresReferences} />
            <CheckItem label="Training" checked={application.status === 'APPROVED'} detail={`${requirements.requiredTraining.length} modules`} />
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="font-semibold mb-3">Application Timeline</h3>
          <div className="space-y-3">
            <TimelineItem date={application.submittedAt} event="Application submitted" status="complete" />
            {application.status !== 'SUBMITTED' && (
              <TimelineItem date={new Date().toISOString()} event="Review started" status="complete" />
            )}
            {requirements.requiresBackgroundCheck && (
              <TimelineItem 
                date={application.status === 'PENDING_BACKGROUND' ? new Date().toISOString() : undefined} 
                event="Background check" 
                status={application.status === 'PENDING_BACKGROUND' ? 'current' : ['PENDING_TRAINING', 'APPROVED'].includes(application.status) ? 'complete' : 'pending'} 
              />
            )}
            {requirements.requiresInterview && (
              <TimelineItem 
                event="Interview" 
                status={application.status === 'PENDING_INTERVIEW' ? 'current' : application.status === 'APPROVED' ? 'complete' : 'pending'} 
              />
            )}
            <TimelineItem 
              event="Training completion" 
              status={application.status === 'PENDING_TRAINING' ? 'current' : application.status === 'APPROVED' ? 'complete' : 'pending'} 
            />
            <TimelineItem 
              event="Final approval" 
              status={application.status === 'APPROVED' ? 'complete' : 'pending'} 
            />
          </div>
        </div>

        {/* Actions */}
        {!['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(application.status) && (
          <div className="pt-4 border-t border-border">
            <div className="flex flex-wrap gap-3">
              {application.status === 'SUBMITTED' && (
                <>
                  <Button onClick={() => onAction('start_review')}>
                    <Eye className="mr-2 h-4 w-4" /> Start Review
                  </Button>
                  <Button variant="outline" onClick={() => onAction('request_info')}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Request Info
                  </Button>
                </>
              )}
              {application.status === 'UNDER_REVIEW' && (
                <>
                  {requirements.requiresBackgroundCheck && (
                    <Button onClick={() => onAction('initiate_background')}>
                      <Shield className="mr-2 h-4 w-4" /> Initiate Background Check
                    </Button>
                  )}
                  {!requirements.requiresBackgroundCheck && (
                    <Button onClick={() => onAction('approve')}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  )}
                </>
              )}
              {application.status === 'PENDING_BACKGROUND' && (
                <Button onClick={() => onAction('background_complete')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Background Clear
                </Button>
              )}
              {application.status === 'PENDING_TRAINING' && (
                <Button onClick={() => onAction('training_complete')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Training Complete - Approve
                </Button>
              )}
              <Button variant="destructive" onClick={() => onAction('reject')}>
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckItem({ label, checked, detail, required = true }: { label: string; checked: boolean; detail: string; required?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${checked ? 'bg-green-500/10' : required ? 'bg-muted' : 'bg-muted/50'}`}>
      {checked ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : required ? (
        <Clock className="h-5 w-5 text-muted-foreground" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
      )}
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function TimelineItem({ date, event, status }: { date?: string; event: string; status: 'complete' | 'current' | 'pending' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${
        status === 'complete' ? 'bg-green-500' : 
        status === 'current' ? 'bg-amber-500 animate-pulse' : 
        'bg-muted-foreground/30'
      }`} />
      <div className="flex-1">
        <p className={`text-sm ${status === 'pending' ? 'text-muted-foreground' : ''}`}>{event}</p>
        {date && <p className="text-xs text-muted-foreground">{new Date(date).toLocaleString()}</p>}
      </div>
    </div>
  );
}
