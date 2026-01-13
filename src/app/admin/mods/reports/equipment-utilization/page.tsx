'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, TrendingUp, Clock, AlertTriangle, Download,
  MapPin, BarChart3, PieChart, Wrench
} from 'lucide-react';

type EquipmentStats = {
  id: string;
  name: string;
  type: string;
  total_checkouts: number;
  total_hours_used: number;
  avg_checkout_duration: number;
  maintenance_count: number;
  current_status: 'available' | 'checked_out' | 'maintenance';
  utilization_rate: number;
  location: string;
};

const MOCK_EQUIPMENT: EquipmentStats[] = [
  { id: 'E1', name: 'Large Dog Crate #1', type: 'crate', total_checkouts: 45, total_hours_used: 360, avg_checkout_duration: 8, maintenance_count: 2, current_status: 'available', utilization_rate: 78, location: 'Kanawha HQ' },
  { id: 'E2', name: 'Large Dog Crate #2', type: 'crate', total_checkouts: 38, total_hours_used: 304, avg_checkout_duration: 8, maintenance_count: 1, current_status: 'checked_out', utilization_rate: 65, location: 'Field' },
  { id: 'E3', name: 'Cat Carrier Set A', type: 'carrier', total_checkouts: 62, total_hours_used: 248, avg_checkout_duration: 4, maintenance_count: 0, current_status: 'available', utilization_rate: 85, location: 'Kanawha HQ' },
  { id: 'E4', name: 'Medium Crate #1', type: 'crate', total_checkouts: 28, total_hours_used: 224, avg_checkout_duration: 8, maintenance_count: 3, current_status: 'maintenance', utilization_rate: 48, location: 'Repair Shop' },
  { id: 'E5', name: 'Humane Trap #1', type: 'trap', total_checkouts: 15, total_hours_used: 360, avg_checkout_duration: 24, maintenance_count: 1, current_status: 'available', utilization_rate: 62, location: 'Cabell Depot' },
  { id: 'E6', name: 'First Aid Kit A', type: 'medical', total_checkouts: 89, total_hours_used: 178, avg_checkout_duration: 2, maintenance_count: 0, current_status: 'available', utilization_rate: 92, location: 'Kanawha HQ' },
  { id: 'E7', name: 'XL Crate (Giant Breed)', type: 'crate', total_checkouts: 12, total_hours_used: 144, avg_checkout_duration: 12, maintenance_count: 0, current_status: 'available', utilization_rate: 35, location: 'Greenbrier' },
  { id: 'E8', name: 'Kitten Carrier Set', type: 'carrier', total_checkouts: 54, total_hours_used: 162, avg_checkout_duration: 3, maintenance_count: 1, current_status: 'checked_out', utilization_rate: 72, location: 'Field' },
];

export default function EquipmentUtilizationReportPage() {
  const [equipment] = useState<EquipmentStats[]>(MOCK_EQUIPMENT);
  const [sortBy, setSortBy] = useState<'checkouts' | 'hours' | 'utilization' | 'maintenance'>('utilization');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const types = [...new Set(equipment.map(e => e.type))];

  const sortedEquipment = [...equipment]
    .filter(e => typeFilter === 'all' || e.type === typeFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'checkouts': return b.total_checkouts - a.total_checkouts;
        case 'hours': return b.total_hours_used - a.total_hours_used;
        case 'utilization': return b.utilization_rate - a.utilization_rate;
        case 'maintenance': return b.maintenance_count - a.maintenance_count;
        default: return 0;
      }
    });

  const stats = {
    totalEquipment: equipment.length,
    totalCheckouts: equipment.reduce((sum, e) => sum + e.total_checkouts, 0),
    totalHours: equipment.reduce((sum, e) => sum + e.total_hours_used, 0),
    avgUtilization: Math.round(equipment.reduce((sum, e) => sum + e.utilization_rate, 0) / equipment.length),
    inMaintenance: equipment.filter(e => e.current_status === 'maintenance').length,
    checkedOut: equipment.filter(e => e.current_status === 'checked_out').length,
  };

  const typeStats = types.map(type => ({
    type,
    count: equipment.filter(e => e.type === type).length,
    avgUtilization: Math.round(
      equipment.filter(e => e.type === type).reduce((sum, e) => sum + e.utilization_rate, 0) /
      equipment.filter(e => e.type === type).length
    ),
    totalCheckouts: equipment.filter(e => e.type === type).reduce((sum, e) => sum + e.total_checkouts, 0),
  }));

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-600';
      case 'checked_out': return 'bg-amber-600';
      case 'maintenance': return 'bg-red-600';
      default: return 'bg-zinc-600';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">← Command Center</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Reports</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Equipment Utilization</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-400" />
                Equipment Utilization Report
              </h1>
              <p className="text-zinc-400 text-sm">Track equipment usage, turnover, and maintenance</p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalEquipment}</div>
            <div className="text-xs text-zinc-500">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.totalCheckouts}</div>
            <div className="text-xs text-zinc-500">Total Checkouts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.totalHours}h</div>
            <div className="text-xs text-zinc-500">Hours Used</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getUtilizationColor(stats.avgUtilization)}`}>{stats.avgUtilization}%</div>
            <div className="text-xs text-zinc-500">Avg Utilization</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.checkedOut}</div>
            <div className="text-xs text-zinc-500">Checked Out</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.inMaintenance}</div>
            <div className="text-xs text-zinc-500">In Maintenance</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Type Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {typeStats.map(ts => (
            <Card key={ts.type} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{ts.type}</span>
                  <Badge variant="outline">{ts.count} items</Badge>
                </div>
                <div className="text-2xl font-bold mb-1">{ts.totalCheckouts}</div>
                <div className="text-xs text-zinc-500">checkouts</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${ts.avgUtilization >= 80 ? 'bg-green-500' : ts.avgUtilization >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${ts.avgUtilization}%` }}
                    />
                  </div>
                  <span className="text-xs">{ts.avgUtilization}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            {types.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="utilization">Sort by Utilization</option>
            <option value="checkouts">Sort by Checkouts</option>
            <option value="hours">Sort by Hours</option>
            <option value="maintenance">Sort by Maintenance</option>
          </select>
        </div>

        {/* Equipment Table */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">Equipment</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">Location</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Checkouts</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Hours Used</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Avg Duration</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Maintenance</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Utilization</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEquipment.map(item => (
                    <tr key={item.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-zinc-500 capitalize">{item.type}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-zinc-400">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{item.total_checkouts}</td>
                      <td className="py-3 px-4 text-center">{item.total_hours_used}h</td>
                      <td className="py-3 px-4 text-center">{item.avg_checkout_duration}h</td>
                      <td className="py-3 px-4 text-center">
                        {item.maintenance_count > 0 ? (
                          <span className="text-amber-400 flex items-center justify-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {item.maintenance_count}
                          </span>
                        ) : (
                          <span className="text-zinc-500">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${item.utilization_rate >= 80 ? 'bg-green-500' : item.utilization_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${item.utilization_rate}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${getUtilizationColor(item.utilization_rate)}`}>
                            {item.utilization_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getStatusColor(item.current_status)}>
                          {item.current_status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                High Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedEquipment.filter(e => e.utilization_rate >= 80).slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-green-900/20 border border-green-800/50">
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-zinc-500">{item.total_checkouts} checkouts</div>
                    </div>
                    <Badge className="bg-green-600">{item.utilization_rate}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedEquipment.filter(e => e.utilization_rate < 50 || e.maintenance_count > 1).slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-amber-900/20 border border-amber-800/50">
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-zinc-500">
                        {item.utilization_rate < 50 ? 'Low utilization' : `${item.maintenance_count} repairs`}
                      </div>
                    </div>
                    <Badge className={item.utilization_rate < 50 ? 'bg-red-600' : 'bg-amber-600'}>
                      {item.utilization_rate < 50 ? `${item.utilization_rate}%` : 'Repair'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
