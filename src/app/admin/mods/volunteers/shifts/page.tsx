'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, Users, Plus, 
  AlertTriangle, CheckCircle, X, Edit, Trash2
} from 'lucide-react';

type Shift = {
  id: string;
  volunteer_id: string;
  volunteer_name: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'regular' | 'on-call' | 'backup';
  county: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'no-show';
};

type DaySlot = {
  date: Date;
  shifts: Shift[];
  isToday: boolean;
  isCurrentMonth: boolean;
};

// Mock shifts data
const MOCK_SHIFTS: Shift[] = [
  { id: 'S1', volunteer_id: 'V1', volunteer_name: 'Emily Carter', date: '2026-01-13', start_time: '08:00', end_time: '16:00', type: 'regular', county: 'KANAWHA', status: 'confirmed' },
  { id: 'S2', volunteer_id: 'V2', volunteer_name: 'James Wilson', date: '2026-01-13', start_time: '16:00', end_time: '00:00', type: 'regular', county: 'CABELL', status: 'scheduled' },
  { id: 'S3', volunteer_id: 'V3', volunteer_name: 'Sarah Martinez', date: '2026-01-13', start_time: '00:00', end_time: '08:00', type: 'on-call', county: 'GREENBRIER', status: 'confirmed' },
  { id: 'S4', volunteer_id: 'V1', volunteer_name: 'Emily Carter', date: '2026-01-14', start_time: '08:00', end_time: '16:00', type: 'regular', county: 'KANAWHA', status: 'scheduled' },
  { id: 'S5', volunteer_id: 'V4', volunteer_name: 'Michael Brown', date: '2026-01-14', start_time: '16:00', end_time: '00:00', type: 'backup', county: 'RALEIGH', status: 'scheduled' },
  { id: 'S6', volunteer_id: 'V5', volunteer_name: 'Lisa Kim', date: '2026-01-15', start_time: '08:00', end_time: '16:00', type: 'regular', county: 'MONONGALIA', status: 'scheduled' },
  { id: 'S7', volunteer_id: 'V6', volunteer_name: 'Tom Roberts', date: '2026-01-15', start_time: '16:00', end_time: '00:00', type: 'on-call', county: 'HARRISON', status: 'scheduled' },
  { id: 'S8', volunteer_id: 'V2', volunteer_name: 'James Wilson', date: '2026-01-16', start_time: '08:00', end_time: '16:00', type: 'regular', county: 'CABELL', status: 'scheduled' },
];

const TYPE_COLORS: Record<string, string> = {
  regular: 'bg-blue-900/50 text-blue-300 border-blue-800',
  'on-call': 'bg-amber-900/50 text-amber-300 border-amber-800',
  backup: 'bg-purple-900/50 text-purple-300 border-purple-800',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-zinc-700 text-zinc-300',
  confirmed: 'bg-green-900/50 text-green-300',
  completed: 'bg-blue-900/50 text-blue-300',
  'no-show': 'bg-red-900/50 text-red-300',
};

export default function ShiftCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 13)); // Jan 13, 2026
  const [view, setView] = useState<'week' | 'month'>('week');
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get week days
  const getWeekDays = (date: Date): DaySlot[] => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    
    const days: DaySlot[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        shifts: shifts.filter(s => s.date === dateStr),
        isToday: d.toDateString() === new Date().toDateString(),
        isCurrentMonth: d.getMonth() === date.getMonth(),
      });
    }
    return days;
  };

  // Get month days
  const getMonthDays = (date: Date): DaySlot[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: DaySlot[] = [];
    
    // Add padding days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        shifts: shifts.filter(s => s.date === dateStr),
        isToday: false,
        isCurrentMonth: false,
      });
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        shifts: shifts.filter(s => s.date === dateStr),
        isToday: d.toDateString() === new Date().toDateString(),
        isCurrentMonth: true,
      });
    }
    
    // Add padding days from next month
    const endPadding = 42 - days.length; // 6 rows x 7 days
    for (let i = 1; i <= endPadding; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        shifts: shifts.filter(s => s.date === dateStr),
        isToday: false,
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const days = view === 'week' ? getWeekDays(currentDate) : getMonthDays(currentDate);
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate coverage gaps
  const coverageGaps = days.filter(d => d.isCurrentMonth && d.shifts.length === 0);

  // Stats
  const stats = {
    totalShifts: shifts.length,
    confirmed: shifts.filter(s => s.status === 'confirmed').length,
    scheduled: shifts.filter(s => s.status === 'scheduled').length,
    gaps: coverageGaps.length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods/volunteers" className="text-blue-400 hover:text-blue-300 font-medium">← Volunteers</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Shift Calendar</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                Shift Calendar
              </h1>
              <p className="text-zinc-400 text-sm">Manage volunteer scheduling and coverage</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Shift
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">{stats.totalShifts}</span>
            <span className="text-zinc-500">Total Shifts</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">{stats.confirmed}</span>
            <span className="text-zinc-500">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-medium">{stats.scheduled}</span>
            <span className="text-zinc-500">Pending</span>
          </div>
          {stats.gaps > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">{stats.gaps}</span>
              <span className="text-zinc-500">Coverage Gaps</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigatePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-lg font-medium min-w-[200px] text-center">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric',
                ...(view === 'week' ? { day: 'numeric' } : {})
              })}
            </div>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={view === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button 
              variant={view === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('month')}
            >
              Month
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-zinc-900/50 border-b border-zinc-800">
            {weekDayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-zinc-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className={`grid grid-cols-7 ${view === 'month' ? '' : 'min-h-[400px]'}`}>
            {days.map((day, idx) => (
              <div 
                key={idx}
                className={`border-b border-r border-zinc-800 p-2 ${view === 'week' ? 'min-h-[400px]' : 'min-h-[100px]'} ${
                  !day.isCurrentMonth ? 'bg-zinc-900/30' : ''
                } ${day.isToday ? 'bg-blue-900/10' : ''}`}
              >
                <div className={`text-sm mb-2 ${day.isToday ? 'text-blue-400 font-bold' : day.isCurrentMonth ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {day.shifts.slice(0, view === 'week' ? undefined : 3).map(shift => (
                    <div 
                      key={shift.id}
                      className={`text-xs p-1.5 rounded border cursor-pointer hover:opacity-80 ${TYPE_COLORS[shift.type]}`}
                      title={`${shift.volunteer_name} - ${shift.start_time} to ${shift.end_time}`}
                    >
                      <div className="font-medium truncate">{shift.volunteer_name}</div>
                      <div className="text-[10px] opacity-70">{shift.start_time}-{shift.end_time}</div>
                      {view === 'week' && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${STATUS_COLORS[shift.status]}`}>
                            {shift.status}
                          </Badge>
                          <span className="text-[9px] opacity-70">{shift.county}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {view === 'month' && day.shifts.length > 3 && (
                    <div className="text-xs text-zinc-500">+{day.shifts.length - 3} more</div>
                  )}
                  {day.shifts.length === 0 && day.isCurrentMonth && (
                    <button 
                      onClick={() => {
                        setSelectedDate(day.date.toISOString().split('T')[0]);
                        setShowAddModal(true);
                      }}
                      className="w-full text-xs text-zinc-600 hover:text-zinc-400 p-2 border border-dashed border-zinc-800 rounded hover:border-zinc-600"
                    >
                      + Add shift
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-xs text-zinc-500">
          <span className="font-medium">Shift Types:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-900/50 border border-blue-800"></div>
            Regular
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-900/50 border border-amber-800"></div>
            On-Call
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-900/50 border border-purple-800"></div>
            Backup
          </div>
        </div>
      </div>

      {/* Add Shift Modal (simplified) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Shift</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Date</label>
                <input 
                  type="date" 
                  defaultValue={selectedDate || ''}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Start Time</label>
                  <input 
                    type="time" 
                    defaultValue="08:00"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">End Time</label>
                  <input 
                    type="time" 
                    defaultValue="16:00"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Volunteer</label>
                <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm">
                  <option value="">Select volunteer...</option>
                  <option value="V1">Emily Carter</option>
                  <option value="V2">James Wilson</option>
                  <option value="V3">Sarah Martinez</option>
                  <option value="V4">Michael Brown</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Shift Type</label>
                <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm">
                  <option value="regular">Regular</option>
                  <option value="on-call">On-Call</option>
                  <option value="backup">Backup</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1">Create Shift</Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
