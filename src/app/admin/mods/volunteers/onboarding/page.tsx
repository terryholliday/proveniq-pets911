'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, GraduationCap, Award, CheckCircle, Clock, 
  ArrowRight, Play, FileText, AlertTriangle, Search,
  ChevronRight, UserPlus, Shield
} from 'lucide-react';

type OnboardingStatus = 'pending' | 'in_training' | 'awaiting_cert' | 'certified' | 'active';

type OnboardingVolunteer = {
  id: string;
  name: string;
  email: string;
  county: string;
  applied_at: string;
  status: OnboardingStatus;
  training_progress: number;
  modules_completed: number;
  total_modules: number;
  certifications: string[];
  pending_certs: string[];
  background_check: 'pending' | 'passed' | 'failed';
  orientation_complete: boolean;
};

const MOCK_VOLUNTEERS: OnboardingVolunteer[] = [
  { id: 'O1', name: 'Alex Johnson', email: 'alex@email.com', county: 'KANAWHA', applied_at: '2026-01-10', status: 'in_training', training_progress: 65, modules_completed: 4, total_modules: 6, certifications: [], pending_certs: ['Basic'], background_check: 'passed', orientation_complete: true },
  { id: 'O2', name: 'Maria Santos', email: 'maria@email.com', county: 'CABELL', applied_at: '2026-01-08', status: 'awaiting_cert', training_progress: 100, modules_completed: 6, total_modules: 6, certifications: [], pending_certs: ['Basic', 'Transport'], background_check: 'passed', orientation_complete: true },
  { id: 'O3', name: 'Chris Lee', email: 'chris@email.com', county: 'BERKELEY', applied_at: '2026-01-12', status: 'pending', training_progress: 0, modules_completed: 0, total_modules: 6, certifications: [], pending_certs: [], background_check: 'pending', orientation_complete: false },
  { id: 'O4', name: 'Jordan Taylor', email: 'jordan@email.com', county: 'RALEIGH', applied_at: '2026-01-05', status: 'certified', training_progress: 100, modules_completed: 6, total_modules: 6, certifications: ['Basic'], pending_certs: ['Transport'], background_check: 'passed', orientation_complete: true },
  { id: 'O5', name: 'Sam Rivera', email: 'sam@email.com', county: 'WOOD', applied_at: '2026-01-11', status: 'in_training', training_progress: 33, modules_completed: 2, total_modules: 6, certifications: [], pending_certs: [], background_check: 'passed', orientation_complete: true },
  { id: 'O6', name: 'Pat Morgan', email: 'pat@email.com', county: 'KANAWHA', applied_at: '2026-01-03', status: 'active', training_progress: 100, modules_completed: 6, total_modules: 6, certifications: ['Basic', 'Transport'], pending_certs: [], background_check: 'passed', orientation_complete: true },
];

const STATUS_CONFIG: Record<OnboardingStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-zinc-600', icon: Clock },
  in_training: { label: 'In Training', color: 'bg-blue-600', icon: GraduationCap },
  awaiting_cert: { label: 'Awaiting Cert', color: 'bg-amber-600', icon: Award },
  certified: { label: 'Certified', color: 'bg-purple-600', icon: Shield },
  active: { label: 'Active', color: 'bg-green-600', icon: CheckCircle },
};

export default function VolunteerOnboardingPage() {
  const [volunteers, setVolunteers] = useState<OnboardingVolunteer[]>(MOCK_VOLUNTEERS);
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<OnboardingVolunteer | null>(null);

  const filteredVolunteers = volunteers
    .filter(v => statusFilter === 'all' || v.status === statusFilter)
    .filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 v.county.toLowerCase().includes(searchQuery.toLowerCase()));

  const stats = {
    pending: volunteers.filter(v => v.status === 'pending').length,
    inTraining: volunteers.filter(v => v.status === 'in_training').length,
    awaitingCert: volunteers.filter(v => v.status === 'awaiting_cert').length,
    certified: volunteers.filter(v => v.status === 'certified').length,
    active: volunteers.filter(v => v.status === 'active').length,
  };

  const handleApprove = (volunteerId: string) => {
    setVolunteers(prev => prev.map(v => 
      v.id === volunteerId ? { ...v, status: 'in_training' as OnboardingStatus, orientation_complete: true } : v
    ));
  };

  const handleIssueCertification = (volunteerId: string, cert: string) => {
    setVolunteers(prev => prev.map(v => {
      if (v.id !== volunteerId) return v;
      const newCerts = [...v.certifications, cert];
      const newPending = v.pending_certs.filter(c => c !== cert);
      return {
        ...v,
        certifications: newCerts,
        pending_certs: newPending,
        status: newPending.length === 0 ? 'certified' as OnboardingStatus : v.status,
      };
    }));
  };

  const handleActivate = (volunteerId: string) => {
    setVolunteers(prev => prev.map(v => 
      v.id === volunteerId ? { ...v, status: 'active' as OnboardingStatus } : v
    ));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods/volunteers" className="text-blue-400 hover:text-blue-300 font-medium">← Volunteers</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Onboarding Pipeline</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-blue-400" />
                Volunteer Onboarding
              </h1>
              <p className="text-zinc-400 text-sm">Track volunteers through training → certification → activation</p>
            </div>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Volunteer
            </Button>
          </div>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {Object.entries(STATUS_CONFIG).map(([status, config], idx) => {
              const count = stats[status === 'in_training' ? 'inTraining' : status === 'awaiting_cert' ? 'awaitingCert' : status as keyof typeof stats];
              const Icon = config.icon;
              return (
                <div key={status} className="flex items-center gap-2">
                  <button
                    onClick={() => setStatusFilter(status as OnboardingStatus)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      statusFilter === status ? 'bg-zinc-800 ring-1 ring-zinc-600' : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold">{count}</div>
                      <div className="text-xs text-zinc-500">{config.label}</div>
                    </div>
                  </button>
                  {idx < 4 && <ChevronRight className="w-5 h-5 text-zinc-600" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search volunteers..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            />
          </div>
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All ({volunteers.length})
          </Button>
        </div>

        {/* Volunteer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVolunteers.map(volunteer => {
            const statusConfig = STATUS_CONFIG[volunteer.status];
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card 
                key={volunteer.id} 
                className={`bg-zinc-900/50 border-zinc-800 cursor-pointer transition-all ${
                  selectedVolunteer?.id === volunteer.id ? 'ring-1 ring-blue-500' : 'hover:border-zinc-700'
                }`}
                onClick={() => setSelectedVolunteer(selectedVolunteer?.id === volunteer.id ? null : volunteer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-lg">{volunteer.name}</div>
                      <div className="text-sm text-zinc-500">{volunteer.email}</div>
                      <div className="text-xs text-zinc-500 mt-1">{volunteer.county} County • Applied {volunteer.applied_at}</div>
                    </div>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  {volunteer.status !== 'pending' && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400">Training Progress</span>
                        <span className="font-medium">{volunteer.training_progress}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            volunteer.training_progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${volunteer.training_progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {volunteer.modules_completed}/{volunteer.total_modules} modules completed
                      </div>
                    </div>
                  )}

                  {/* Status Indicators */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                      volunteer.background_check === 'passed' ? 'bg-green-900/30 text-green-400' :
                      volunteer.background_check === 'pending' ? 'bg-amber-900/30 text-amber-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      <Shield className="w-3 h-3" />
                      BG Check: {volunteer.background_check}
                    </div>
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                      volunteer.orientation_complete ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      <FileText className="w-3 h-3" />
                      Orientation: {volunteer.orientation_complete ? 'Complete' : 'Pending'}
                    </div>
                  </div>

                  {/* Certifications */}
                  {(volunteer.certifications.length > 0 || volunteer.pending_certs.length > 0) && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {volunteer.certifications.map(cert => (
                        <Badge key={cert} className="bg-green-700 text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                      {volunteer.pending_certs.map(cert => (
                        <Badge key={cert} variant="outline" className="text-xs text-amber-400 border-amber-700">
                          <Clock className="w-3 h-3 mr-1" />
                          {cert} (pending)
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-zinc-800">
                    {volunteer.status === 'pending' && (
                      <>
                        <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleApprove(volunteer.id); }}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve & Start Training
                        </Button>
                      </>
                    )}
                    {volunteer.status === 'in_training' && (
                      <Button size="sm" variant="outline" className="flex-1" disabled>
                        <Play className="w-3 h-3 mr-1" />
                        Training In Progress...
                      </Button>
                    )}
                    {volunteer.status === 'awaiting_cert' && volunteer.pending_certs.length > 0 && (
                      <Button 
                        size="sm" 
                        className="flex-1 bg-amber-600 hover:bg-amber-500"
                        onClick={(e) => { e.stopPropagation(); handleIssueCertification(volunteer.id, volunteer.pending_certs[0]); }}
                      >
                        <Award className="w-3 h-3 mr-1" />
                        Issue {volunteer.pending_certs[0]} Certification
                      </Button>
                    )}
                    {volunteer.status === 'certified' && (
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-500"
                        onClick={(e) => { e.stopPropagation(); handleActivate(volunteer.id); }}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Activate Volunteer
                      </Button>
                    )}
                    {volunteer.status === 'active' && (
                      <div className="flex-1 text-center text-sm text-green-400 py-1">
                        ✓ Fully Onboarded & Active
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredVolunteers.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No volunteers found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
