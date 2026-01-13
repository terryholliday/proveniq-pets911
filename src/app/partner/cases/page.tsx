'use client';

import { useState } from 'react';
import { FileText, Search, Filter, Plus } from 'lucide-react';

const MOCK_CASES = [
  { id: 'GHC-2026-0142', animal: 'Brown Tabby Cat', species: 'cat', status: 'intake', intakeDate: '2026-01-12', source: 'Stray Alert', microchip: 'Scanning...', notes: 'Found downtown, appears well-fed' },
  { id: 'GHC-2026-0141', animal: 'Black Lab Mix', species: 'dog', status: 'reunited', intakeDate: '2026-01-11', source: 'Owner Surrender', microchip: '985141404123456', notes: 'Reunited with owner via chip lookup', outcome: 'Returned to owner Jan 11' },
  { id: 'GHC-2026-0140', animal: 'Orange Tabby', species: 'cat', status: 'adopted', intakeDate: '2026-01-10', source: 'Transport', microchip: 'None', notes: 'Friendly, neutered', outcome: 'Adopted Jan 12' },
  { id: 'GHC-2026-0139', animal: 'Pit Mix - "Bella"', species: 'dog', status: 'foster', intakeDate: '2026-01-09', source: 'Stray Alert', microchip: '985141404789012', notes: 'In foster care for socialization' },
  { id: 'GHC-2026-0138', animal: 'Gray Kitten (x4)', species: 'cat', status: 'medical_hold', intakeDate: '2026-01-08', source: 'Found Litter', microchip: 'N/A - Kittens', notes: 'URI treatment, expected clearance Jan 15' },
];

export default function PartnerCasesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCases = MOCK_CASES.filter(c => {
    const matchesSearch = c.animal.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'intake': return 'bg-amber-900/50 text-amber-400';
      case 'reunited': return 'bg-green-900/50 text-green-400';
      case 'adopted': return 'bg-blue-900/50 text-blue-400';
      case 'foster': return 'bg-purple-900/50 text-purple-400';
      case 'medical_hold': return 'bg-red-900/50 text-red-400';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cases</h1>
          <p className="text-zinc-500 text-sm">Track animals in your care</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 px-4 py-2 rounded text-sm font-medium">
          <Plus className="h-4 w-4" />
          New Intake
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by animal name or case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded pl-10 pr-4 py-2 text-sm focus:border-amber-600 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="intake">Intake</option>
            <option value="foster">Foster</option>
            <option value="medical_hold">Medical Hold</option>
            <option value="reunited">Reunited</option>
            <option value="adopted">Adopted</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
              <th className="px-4 py-3">Case ID</th>
              <th className="px-4 py-3">Animal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Intake Date</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Microchip</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredCases.map(caseItem => (
              <tr key={caseItem.id} className="hover:bg-zinc-800/50">
                <td className="px-4 py-3 font-mono text-sm">{caseItem.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-sm">{caseItem.animal}</div>
                  <div className="text-xs text-zinc-500 capitalize">{caseItem.species}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">{caseItem.intakeDate}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{caseItem.source}</td>
                <td className="px-4 py-3 text-xs font-mono text-zinc-500">{caseItem.microchip}</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-amber-500 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No cases found</p>
        </div>
      )}
    </div>
  );
}
