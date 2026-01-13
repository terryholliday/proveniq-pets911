'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Users, Shield, Check, X, ChevronDown, ChevronRight, Search,
  AlertTriangle, CheckCircle, Plus, Trash2, Edit, Save, Loader2
} from 'lucide-react';

type AssignmentType = 'primary' | 'backup' | 'overflow';

type County = {
  id: string;
  name: string;
  state: string;
  displayName: string;
};

type Moderator = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  assignedCounties: { countyId: string; type: AssignmentType }[];
};

type CoverageStatus = 'covered' | 'partial' | 'uncovered';

// West Virginia Counties
const WV_COUNTIES: County[] = [
  'BARBOUR', 'BERKELEY', 'BOONE', 'BRAXTON', 'BROOKE', 'CABELL', 'CALHOUN',
  'CLAY', 'DODDRIDGE', 'FAYETTE', 'GILMER', 'GRANT', 'GREENBRIER', 'HAMPSHIRE',
  'HANCOCK', 'HARDY', 'HARRISON', 'JACKSON', 'JEFFERSON', 'KANAWHA', 'LEWIS',
  'LINCOLN', 'LOGAN', 'MARION', 'MARSHALL', 'MASON', 'MCDOWELL', 'MERCER',
  'MINERAL', 'MINGO', 'MONONGALIA', 'MONROE', 'MORGAN', 'NICHOLAS', 'OHIO',
  'PENDLETON', 'PLEASANTS', 'POCAHONTAS', 'PRESTON', 'PUTNAM', 'RALEIGH',
  'RANDOLPH', 'RITCHIE', 'ROANE', 'SUMMERS', 'TAYLOR', 'TUCKER', 'TYLER',
  'UPSHUR', 'WAYNE', 'WEBSTER', 'WETZEL', 'WIRT', 'WOOD', 'WYOMING'
].map(name => ({
  id: `WV-${name}`,
  name,
  state: 'WV',
  displayName: `${name.charAt(0) + name.slice(1).toLowerCase()} County`
}));

// Mock moderators
const MOCK_MODERATORS: Moderator[] = [
  { 
    id: 'MOD-001', 
    name: 'Emily Carter', 
    email: 'emily.c@PetMayday.org', 
    isActive: true,
    assignedCounties: [
      { countyId: 'WV-KANAWHA', type: 'primary' },
      { countyId: 'WV-PUTNAM', type: 'primary' },
      { countyId: 'WV-CABELL', type: 'backup' },
    ]
  },
  { 
    id: 'MOD-002', 
    name: 'James Wilson', 
    email: 'james.w@PetMayday.org', 
    isActive: true,
    assignedCounties: [
      { countyId: 'WV-CABELL', type: 'primary' },
      { countyId: 'WV-WAYNE', type: 'primary' },
      { countyId: 'WV-LINCOLN', type: 'primary' },
    ]
  },
  { 
    id: 'MOD-003', 
    name: 'Sarah Martinez', 
    email: 'sarah.m@PetMayday.org', 
    isActive: true,
    assignedCounties: [
      { countyId: 'WV-GREENBRIER', type: 'primary' },
      { countyId: 'WV-MONROE', type: 'primary' },
      { countyId: 'WV-SUMMERS', type: 'primary' },
      { countyId: 'WV-POCAHONTAS', type: 'primary' },
    ]
  },
  { 
    id: 'MOD-004', 
    name: 'Michael Brown', 
    email: 'michael.b@PetMayday.org', 
    isActive: false,
    assignedCounties: []
  },
];

const ASSIGNMENT_COLORS: Record<AssignmentType, string> = {
  primary: 'bg-green-600',
  backup: 'bg-amber-600',
  overflow: 'bg-blue-600',
};

export default function SysopModeratorCoveragePage() {
  const [moderators, setModerators] = useState<Moderator[]>(MOCK_MODERATORS);
  const [selectedModerator, setSelectedModerator] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [editingMod, setEditingMod] = useState<string | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<{ countyId: string; type: AssignmentType }[]>([]);
  const [saving, setSaving] = useState(false);

  // Calculate coverage status for each county
  const getCoverageStatus = (countyId: string): { status: CoverageStatus; mods: { name: string; type: AssignmentType }[] } => {
    const assignedMods: { name: string; type: AssignmentType }[] = [];
    moderators.forEach(mod => {
      if (mod.isActive) {
        const assignment = mod.assignedCounties.find(a => a.countyId === countyId);
        if (assignment) {
          assignedMods.push({ name: mod.name, type: assignment.type });
        }
      }
    });
    
    const hasPrimary = assignedMods.some(m => m.type === 'primary');
    const hasBackup = assignedMods.some(m => m.type === 'backup');
    
    if (hasPrimary && hasBackup) return { status: 'covered', mods: assignedMods };
    if (hasPrimary || hasBackup) return { status: 'partial', mods: assignedMods };
    return { status: 'uncovered', mods: assignedMods };
  };

  const coverageStats = {
    covered: WV_COUNTIES.filter(c => getCoverageStatus(c.id).status === 'covered').length,
    partial: WV_COUNTIES.filter(c => getCoverageStatus(c.id).status === 'partial').length,
    uncovered: WV_COUNTIES.filter(c => getCoverageStatus(c.id).status === 'uncovered').length,
  };

  const filteredCounties = WV_COUNTIES.filter(c => 
    c.name.toLowerCase().includes(countyFilter.toLowerCase()) ||
    c.displayName.toLowerCase().includes(countyFilter.toLowerCase())
  );

  const startEditing = (modId: string) => {
    const mod = moderators.find(m => m.id === modId);
    if (mod) {
      setEditingMod(modId);
      setPendingAssignments([...mod.assignedCounties]);
    }
  };

  const cancelEditing = () => {
    setEditingMod(null);
    setPendingAssignments([]);
  };

  const toggleCountyAssignment = (countyId: string, type: AssignmentType) => {
    const existing = pendingAssignments.find(a => a.countyId === countyId);
    if (existing) {
      if (existing.type === type) {
        // Remove assignment
        setPendingAssignments(pendingAssignments.filter(a => a.countyId !== countyId));
      } else {
        // Change type
        setPendingAssignments(pendingAssignments.map(a => 
          a.countyId === countyId ? { ...a, type } : a
        ));
      }
    } else {
      // Add new assignment
      setPendingAssignments([...pendingAssignments, { countyId, type }]);
    }
  };

  const saveAssignments = async () => {
    if (!editingMod) return;
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setModerators(moderators.map(mod => 
      mod.id === editingMod 
        ? { ...mod, assignedCounties: pendingAssignments }
        : mod
    ));
    
    setSaving(false);
    setEditingMod(null);
    setPendingAssignments([]);
  };

  const selectedModData = selectedModerator ? moderators.find(m => m.id === selectedModerator) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/sysop" className="text-blue-400 hover:text-blue-300 font-medium">← SYSOP Dashboard</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Moderator Coverage</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Moderator Coverage Assignment</h1>
              <p className="text-zinc-400 text-sm">Assign moderators to geographic coverage areas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Stats */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-300 font-medium">{WV_COUNTIES.length}</span>
            <span className="text-zinc-500">Total Counties (WV)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-400 font-medium">{coverageStats.covered}</span>
            <span className="text-zinc-500">Fully Covered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-amber-400 font-medium">{coverageStats.partial}</span>
            <span className="text-zinc-500">Partial Coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-400 font-medium">{coverageStats.uncovered}</span>
            <span className="text-zinc-500">No Coverage</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">{moderators.filter(m => m.isActive).length}</span>
            <span className="text-zinc-500">Active Moderators</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Moderators List */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Moderators
              </CardTitle>
              <CardDescription>Select a moderator to view/edit coverage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {moderators.map(mod => (
                <div
                  key={mod.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedModerator === mod.id 
                      ? 'border-blue-600 bg-blue-900/20' 
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-800/30'
                  } ${!mod.isActive ? 'opacity-50' : ''}`}
                  onClick={() => setSelectedModerator(mod.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{mod.name}</p>
                      <p className="text-xs text-zinc-500">{mod.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={mod.isActive ? 'default' : 'secondary'} className="text-xs">
                        {mod.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <p className="text-xs text-zinc-500 mt-1">
                        {mod.assignedCounties.length} counties
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Moderator Details & Assignment */}
          <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-400" />
                    {selectedModData ? selectedModData.name : 'Select a Moderator'}
                  </CardTitle>
                  <CardDescription>
                    {selectedModData ? 'Manage coverage area assignments' : 'Click a moderator to view their assignments'}
                  </CardDescription>
                </div>
                {selectedModData && editingMod !== selectedModerator && (
                  <Button size="sm" onClick={() => startEditing(selectedModerator!)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Coverage
                  </Button>
                )}
                {editingMod === selectedModerator && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                    <Button size="sm" onClick={saveAssignments} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedModData ? (
                <div className="text-center py-12 text-zinc-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a moderator from the list</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current Assignments */}
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">Current Assignments</h4>
                    <div className="flex flex-wrap gap-2">
                      {(editingMod === selectedModerator ? pendingAssignments : selectedModData.assignedCounties).length === 0 ? (
                        <p className="text-sm text-zinc-500">No counties assigned</p>
                      ) : (
                        (editingMod === selectedModerator ? pendingAssignments : selectedModData.assignedCounties).map(assignment => {
                          const county = WV_COUNTIES.find(c => c.id === assignment.countyId);
                          return (
                            <span 
                              key={assignment.countyId}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                                assignment.type === 'primary' ? 'bg-green-900/50 text-green-300 border border-green-800' :
                                assignment.type === 'backup' ? 'bg-amber-900/50 text-amber-300 border border-amber-800' :
                                'bg-blue-900/50 text-blue-300 border border-blue-800'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              {county?.displayName || assignment.countyId}
                              <Badge variant="outline" className="text-[10px] px-1 py-0">{assignment.type}</Badge>
                              {editingMod === selectedModerator && (
                                <button 
                                  onClick={() => toggleCountyAssignment(assignment.countyId, assignment.type)}
                                  className="ml-1 hover:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* County Selection (Edit Mode) */}
                  {editingMod === selectedModerator && (
                    <div className="border-t border-zinc-800 pt-4">
                      <h4 className="text-sm font-medium text-zinc-400 mb-2">Add Counties</h4>
                      <div className="mb-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="Search counties..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                            value={countyFilter}
                            onChange={(e) => setCountyFilter(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {filteredCounties.map(county => {
                          const assignment = pendingAssignments.find(a => a.countyId === county.id);
                          const coverage = getCoverageStatus(county.id);
                          return (
                            <div 
                              key={county.id}
                              className={`p-2 rounded border text-xs ${
                                assignment 
                                  ? 'border-blue-600 bg-blue-900/20' 
                                  : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{county.displayName}</span>
                                <div className={`w-2 h-2 rounded-full ${
                                  coverage.status === 'covered' ? 'bg-green-500' :
                                  coverage.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                                }`}></div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => toggleCountyAssignment(county.id, 'primary')}
                                  className={`flex-1 px-1.5 py-0.5 rounded text-[10px] ${
                                    assignment?.type === 'primary' 
                                      ? 'bg-green-600 text-white' 
                                      : 'bg-zinc-700 hover:bg-green-800'
                                  }`}
                                >
                                  Primary
                                </button>
                                <button
                                  onClick={() => toggleCountyAssignment(county.id, 'backup')}
                                  className={`flex-1 px-1.5 py-0.5 rounded text-[10px] ${
                                    assignment?.type === 'backup' 
                                      ? 'bg-amber-600 text-white' 
                                      : 'bg-zinc-700 hover:bg-amber-800'
                                  }`}
                                >
                                  Backup
                                </button>
                                <button
                                  onClick={() => toggleCountyAssignment(county.id, 'overflow')}
                                  className={`flex-1 px-1.5 py-0.5 rounded text-[10px] ${
                                    assignment?.type === 'overflow' 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-zinc-700 hover:bg-blue-800'
                                  }`}
                                >
                                  Overflow
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coverage Map */}
        <Card className="bg-zinc-900/50 border-zinc-800 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" />
              Coverage Map - West Virginia
            </CardTitle>
            <CardDescription>Click a county to see assigned moderators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-11 gap-2">
              {WV_COUNTIES.map(county => {
                const coverage = getCoverageStatus(county.id);
                return (
                  <div
                    key={county.id}
                    className={`p-2 rounded border text-center cursor-pointer transition-colors ${
                      coverage.status === 'covered' ? 'border-green-800 bg-green-900/30 hover:bg-green-900/50' :
                      coverage.status === 'partial' ? 'border-amber-800 bg-amber-900/30 hover:bg-amber-900/50' :
                      'border-red-800 bg-red-900/30 hover:bg-red-900/50'
                    }`}
                    title={coverage.mods.length > 0 ? coverage.mods.map(m => `${m.name} (${m.type})`).join('\n') : 'No coverage'}
                  >
                    <p className="text-xs font-medium truncate">{county.name}</p>
                    <div className="flex justify-center gap-0.5 mt-1">
                      {coverage.mods.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${ASSIGNMENT_COLORS[coverage.mods[i].type]}`}></div>
                      ))}
                      {coverage.mods.length === 0 && <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-400">
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"></div> Primary</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-600"></div> Backup</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600"></div> Overflow</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
