'use client';

/**
 * ACO Shift Schedule Calendar
 * 
 * Visual calendar view showing:
 * - Who's on duty each day/shift
 * - Shift handoff history
 * - Coverage gaps
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface ShiftEntry {
  id: string;
  county: string;
  from_role: string;
  to_role: string;
  effective_at: string;
  reason: string;
  notes: string | null;
}

interface DaySchedule {
  date: string;
  shifts: ShiftEntry[];
  currentRole: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ACOSchedulePage() {
  const [county, setCounty] = useState<'GREENBRIER' | 'KANAWHA'>('GREENBRIER');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shiftHistory, setShiftHistory] = useState<ShiftEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadShiftHistory();
  }, [county, currentDate]);

  async function loadShiftHistory() {
    setLoading(true);
    
    // Get first and last day of month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('aco_shift_log')
      .select('*')
      .eq('county', county)
      .gte('effective_at', firstDay.toISOString())
      .lte('effective_at', lastDay.toISOString())
      .order('effective_at', { ascending: true });

    if (!error) {
      setShiftHistory(data || []);
    }
    setLoading(false);
  }

  // Generate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // Get shifts for a specific day
  const getShiftsForDay = (day: number): ShiftEntry[] => {
    const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1);
    
    return shiftHistory.filter(shift => {
      const shiftDate = new Date(shift.effective_at);
      return shiftDate >= dayStart && shiftDate < dayEnd;
    });
  };

  // Determine who was on duty for a given day (most recent shift before/on that day)
  const getOnDutyForDay = (day: number): string => {
    const dayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1);
    
    const relevantShifts = shiftHistory.filter(shift => {
      const shiftDate = new Date(shift.effective_at);
      return shiftDate < dayEnd;
    });

    if (relevantShifts.length > 0) {
      return relevantShifts[relevantShifts.length - 1].to_role;
    }
    return 'UNKNOWN';
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => 
    day === today.getDate() && 
    currentDate.getMonth() === today.getMonth() && 
    currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/aco" className="text-blue-300 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Shift Schedule</h1>
                <p className="text-blue-200 text-sm">ACO coverage calendar</p>
              </div>
            </div>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value as 'GREENBRIER' | 'KANAWHA')}
              className="bg-blue-800 text-white px-3 py-2 rounded"
            >
              <option value="GREENBRIER">Greenbrier County</option>
              <option value="KANAWHA">Kanawha County</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={prevMonth} className="border-slate-600 text-slate-300">
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <h2 className="text-2xl font-bold text-white">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="outline" onClick={nextMonth} className="border-slate-600 text-slate-300">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-600"></div>
            <span className="text-slate-300 text-sm">ACO On Duty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-indigo-600"></div>
            <span className="text-slate-300 text-sm">911 Dispatch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-600"></div>
            <span className="text-slate-300 text-sm">Sheriff</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 w-2 h-2"></div>
            <span className="text-slate-300 text-sm">Handoff</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-slate-700">
              {DAYS.map(day => (
                <div key={day} className="p-3 text-center text-slate-400 font-medium text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading schedule...</div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="min-h-[100px] bg-slate-900/50 border-b border-r border-slate-700" />;
                  }

                  const dayShifts = getShiftsForDay(day);
                  const onDuty = getOnDutyForDay(day);
                  const bgColor = onDuty === 'ACO_OFFICER' ? 'bg-blue-900/30' : 
                                  onDuty === 'DISPATCH_911' ? 'bg-indigo-900/30' :
                                  onDuty === 'SHERIFF' ? 'bg-amber-900/30' : '';

                  return (
                    <div 
                      key={day} 
                      className={`min-h-[100px] p-2 border-b border-r border-slate-700 ${bgColor} ${
                        isToday(day) ? 'ring-2 ring-green-500 ring-inset' : ''
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-green-400' : 'text-slate-300'}`}>
                        {day}
                      </div>
                      
                      {/* On-duty indicator */}
                      <div className="flex items-center gap-1 mb-1">
                        {onDuty === 'ACO_OFFICER' && <User className="w-3 h-3 text-blue-400" />}
                        {onDuty === 'DISPATCH_911' && <Radio className="w-3 h-3 text-indigo-400" />}
                        <span className="text-xs text-slate-400">
                          {onDuty === 'ACO_OFFICER' ? 'ACO' : 
                           onDuty === 'DISPATCH_911' ? '911' : 
                           onDuty === 'SHERIFF' ? 'Sheriff' : '?'}
                        </span>
                      </div>

                      {/* Shift changes */}
                      {dayShifts.map((shift, i) => (
                        <div key={shift.id} className="text-xs bg-green-500/20 text-green-300 rounded px-1 py-0.5 mb-1 truncate">
                          {new Date(shift.effective_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' → '}
                          {shift.to_role === 'ACO_OFFICER' ? 'ACO' : 
                           shift.to_role === 'DISPATCH_911' ? '911' : 'Sheriff'}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Handoffs */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Handoffs This Month</h3>
          {shiftHistory.length === 0 ? (
            <p className="text-slate-500">No shift handoffs recorded this month.</p>
          ) : (
            <div className="space-y-2">
              {shiftHistory.slice(-10).reverse().map((shift) => (
                <div key={shift.id} className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg">
                  <div className="text-slate-400 text-sm w-32">
                    {new Date(shift.effective_at).toLocaleDateString()}
                    {' '}
                    {new Date(shift.effective_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">{shift.from_role}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-white font-medium">{shift.to_role}</span>
                  </div>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                    {shift.reason.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
