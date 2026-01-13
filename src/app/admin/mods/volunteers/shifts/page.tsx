'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, Users, Plus, 
  AlertTriangle, CheckCircle, X, Edit, Trash2, RefreshCw, Search, Filter, MapPin,
  ArrowLeftRight, UserCheck, XCircle, MessageSquare, Bell, BellRing, Send
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

type SwapRequest = {
  id: string;
  shift_id: string;
  shift: Shift;
  requesting_volunteer: string;
  accepting_volunteer?: string;
  status: 'pending' | 'claimed' | 'approved' | 'denied';
  reason?: string;
  created_at: string;
};

// Mock swap requests for fallback
const MOCK_SWAP_REQUESTS: SwapRequest[] = [
  { 
    id: 'SW1', 
    shift_id: 'S1', 
    shift: { id: 'S1', volunteer_id: 'V1', volunteer_name: 'Emily Carter', date: '2026-01-15', start_time: '08:00', end_time: '16:00', type: 'regular', county: 'KANAWHA', status: 'confirmed' },
    requesting_volunteer: 'Emily Carter',
    status: 'pending',
    reason: 'Family emergency - need coverage',
    created_at: '2026-01-13T10:00:00Z'
  },
  { 
    id: 'SW2', 
    shift_id: 'S3', 
    shift: { id: 'S3', volunteer_id: 'V2', volunteer_name: 'James Wilson', date: '2026-01-14', start_time: '12:00', end_time: '20:00', type: 'regular', county: 'CABELL', status: 'scheduled' },
    requesting_volunteer: 'James Wilson',
    accepting_volunteer: 'Sarah Martinez',
    status: 'claimed',
    reason: 'Doctor appointment',
    created_at: '2026-01-12T14:00:00Z'
  },
];

// Fallback mock shifts data
const FALLBACK_SHIFTS: Shift[] = [
  { id: 'S1', volunteer_id: 'V1', volunteer_name: 'Emily Carter', date: '2026-01-13', start_time: '08:00', end_time: '16:00', type: 'regular', county: 'KANAWHA', status: 'confirmed' },
  { id: 'S2', volunteer_id: 'V2', volunteer_name: 'James Wilson', date: '2026-01-13', start_time: '16:00', end_time: '00:00', type: 'regular', county: 'CABELL', status: 'scheduled' },
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

// WV Counties for filter
const WV_COUNTIES = [
  'KANAWHA', 'CABELL', 'BERKELEY', 'MONONGALIA', 'WOOD', 'RALEIGH', 
  'HARRISON', 'MARION', 'PUTNAM', 'MERCER', 'FAYETTE', 'JEFFERSON'
];

export default function ShiftCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [countyFilter, setCountyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  const [showGapsOnly, setShowGapsOnly] = useState(false);
  
  // Swap requests
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(MOCK_SWAP_REQUESTS);
  const [showSwapModal, setShowSwapModal] = useState<Shift | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [showSwapsPanel, setShowSwapsPanel] = useState(false);
  
  // Reminders
  const [showRemindersPanel, setShowRemindersPanel] = useState(false);
  const [pendingReminders, setPendingReminders] = useState<any[]>([]);
  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderChannel, setReminderChannel] = useState<'sms' | 'email' | 'all'>('sms');

  // Fetch pending reminders
  const fetchReminders = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        // Mock data
        setPendingReminders([
          { id: 'R1', volunteer_name: 'Emily Carter', shift_date: '2026-01-14', shift_time: '08:00-16:00', reminder_type: '24hr', send_at: '2026-01-13T08:00:00Z', status: 'pending', channel: 'sms' },
          { id: 'R2', volunteer_name: 'James Wilson', shift_date: '2026-01-14', shift_time: '16:00-00:00', reminder_type: '1hr', send_at: '2026-01-14T15:00:00Z', status: 'pending', channel: 'sms' },
        ]);
        return;
      }

      const res = await fetch('/api/admin/mods/reminders?status=pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data?.reminders) {
        setPendingReminders(data.data.reminders);
      }
    } catch (err) {
      console.error('Reminders fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Send test reminder
  const handleSendTestReminder = async (reminderId: string) => {
    console.log('Sending test reminder:', reminderId);
    // In real implementation, this would trigger the reminder immediately
    setPendingReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  // Cancel reminder
  const handleCancelReminder = async (reminderId: string) => {
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        setPendingReminders(prev => prev.filter(r => r.id !== reminderId));
        return;
      }

      await fetch('/api/admin/mods/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'cancel', reminder_id: reminderId }),
      });
      fetchReminders();
    } catch (err) {
      console.error('Cancel reminder error:', err);
    }
  };

  // Fetch shifts from API
  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        setShifts(FALLBACK_SHIFTS);
        setError('Not authenticated - showing sample data');
        return;
      }

      // Calculate date range based on view
      const start = new Date(currentDate);
      const end = new Date(currentDate);
      if (view === 'week') {
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 7);
      } else {
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
      }

      const res = await fetch(
        `/api/admin/mods/shifts?start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      if (data.success && data.data.shifts) {
        const apiShifts: Shift[] = data.data.shifts.map((s: any) => ({
          id: s.id,
          volunteer_id: s.volunteerId,
          volunteer_name: s.volunteerName || 'Unknown',
          date: s.date,
          start_time: s.startTime,
          end_time: s.endTime,
          type: s.type || 'regular',
          county: s.county || 'Unknown',
          status: s.status || 'scheduled',
        }));
        setShifts(apiShifts.length > 0 ? apiShifts : FALLBACK_SHIFTS);
        setError(apiShifts.length === 0 ? 'No shifts scheduled - showing sample data' : null);
      } else {
        setShifts(FALLBACK_SHIFTS);
      }
    } catch (err) {
      console.error('Shifts fetch error:', err);
      setShifts(FALLBACK_SHIFTS);
      setError('Failed to load - showing sample data');
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

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

  // Filter shifts based on search/filters
  const filteredShifts = shifts.filter(s => {
    if (searchTerm && !s.volunteer_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (countyFilter !== 'all' && s.county !== countyFilter) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    return true;
  });

  // Detect conflicts (overlapping shifts for same volunteer on same day)
  const detectConflicts = (dayShifts: Shift[]): Shift[] => {
    const conflicts: Shift[] = [];
    for (let i = 0; i < dayShifts.length; i++) {
      for (let j = i + 1; j < dayShifts.length; j++) {
        const a = dayShifts[i];
        const b = dayShifts[j];
        if (a.volunteer_id === b.volunteer_id) {
          // Same volunteer, check time overlap
          const aStart = a.start_time;
          const aEnd = a.end_time;
          const bStart = b.start_time;
          const bEnd = b.end_time;
          if (aStart < bEnd && bStart < aEnd) {
            if (!conflicts.includes(a)) conflicts.push(a);
            if (!conflicts.includes(b)) conflicts.push(b);
          }
        }
      }
    }
    return conflicts;
  };

  // Calculate coverage gaps and conflicts
  const coverageGaps = days.filter(d => d.isCurrentMonth && d.shifts.length === 0);
  const allConflicts = days.flatMap(d => detectConflicts(d.shifts));
  const hasConflicts = allConflicts.length > 0;
  const pendingSwaps = swapRequests.filter(s => s.status === 'pending' || s.status === 'claimed');

  // Swap request handlers
  const handleRequestSwap = async (shift: Shift) => {
    if (!swapReason.trim()) return;
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        // Mock for demo
        const newSwap: SwapRequest = {
          id: `SW${Date.now()}`,
          shift_id: shift.id,
          shift,
          requesting_volunteer: shift.volunteer_name,
          status: 'pending',
          reason: swapReason,
          created_at: new Date().toISOString(),
        };
        setSwapRequests(prev => [...prev, newSwap]);
        setShowSwapModal(null);
        setSwapReason('');
        return;
      }

      await fetch('/api/admin/mods/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'request_swap', shift_id: shift.id, reason: swapReason }),
      });
      setShowSwapModal(null);
      setSwapReason('');
      fetchShifts();
    } catch (err) {
      console.error('Swap request error:', err);
    }
  };

  const handleClaimSwap = async (swapId: string) => {
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        // Mock update
        setSwapRequests(prev => prev.map(s => 
          s.id === swapId ? { ...s, status: 'claimed' as const, accepting_volunteer: 'You' } : s
        ));
        return;
      }

      await fetch('/api/admin/mods/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'claim_swap', swap_id: swapId }),
      });
      fetchShifts();
    } catch (err) {
      console.error('Claim swap error:', err);
    }
  };

  const handleApproveSwap = async (swapId: string) => {
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        // Mock update
        setSwapRequests(prev => prev.filter(s => s.id !== swapId));
        return;
      }

      await fetch('/api/admin/mods/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'approve_swap', swap_id: swapId }),
      });
      fetchShifts();
    } catch (err) {
      console.error('Approve swap error:', err);
    }
  };

  const handleDenySwap = async (swapId: string) => {
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        // Mock update
        setSwapRequests(prev => prev.filter(s => s.id !== swapId));
        return;
      }

      await fetch('/api/admin/mods/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'deny_swap', swap_id: swapId }),
      });
      fetchShifts();
    } catch (err) {
      console.error('Deny swap error:', err);
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  // Stats
  const stats = {
    totalShifts: filteredShifts.length,
    confirmed: filteredShifts.filter(s => s.status === 'confirmed').length,
    scheduled: filteredShifts.filter(s => s.status === 'scheduled').length,
    gaps: coverageGaps.length,
    conflicts: allConflicts.length,
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
              <p className="text-zinc-400 text-sm">Manage volunteer schedules</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowRemindersPanel(!showRemindersPanel)}
                variant={showRemindersPanel ? 'default' : 'outline'}
                size="sm"
                className={pendingReminders.length > 0 ? 'border-blue-600' : ''}
              >
                <Bell className="w-4 h-4 mr-2" />
                Reminders {pendingReminders.length > 0 && <Badge className="ml-1 bg-blue-600 text-xs">{pendingReminders.length}</Badge>}
              </Button>
              <Button
                onClick={() => setShowSwapsPanel(!showSwapsPanel)}
                variant={showSwapsPanel ? 'default' : 'outline'}
                size="sm"
                className={pendingSwaps.length > 0 ? 'border-amber-600' : ''}
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Swaps {pendingSwaps.length > 0 && <Badge className="ml-1 bg-amber-600 text-xs">{pendingSwaps.length}</Badge>}
              </Button>
              <Button
                onClick={fetchShifts}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView(view === 'week' ? 'month' : 'week')}
              >
                {view === 'week' ? 'Month View' : 'Week View'}
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
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
            <button 
              onClick={() => setShowGapsOnly(!showGapsOnly)}
              className={`flex items-center gap-2 px-2 py-1 rounded ${showGapsOnly ? 'bg-red-900/50' : 'hover:bg-zinc-800'}`}
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">{stats.gaps}</span>
              <span className="text-zinc-500">Coverage Gaps</span>
            </button>
          )}
          {stats.conflicts > 0 && (
            <button 
              onClick={() => setShowConflictsOnly(!showConflictsOnly)}
              className={`flex items-center gap-2 px-2 py-1 rounded ${showConflictsOnly ? 'bg-orange-900/50' : 'hover:bg-zinc-800'}`}
            >
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-medium">{stats.conflicts}</span>
              <span className="text-zinc-500">Conflicts</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-zinc-900/20 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search volunteer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-zinc-600" 
            />
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-zinc-500" />
            <select 
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            >
              <option value="all">All Counties</option>
              {WV_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="regular">Regular</option>
              <option value="on-call">On-Call</option>
              <option value="backup">Backup</option>
            </select>
          </div>
          {(searchTerm || countyFilter !== 'all' || typeFilter !== 'all') && (
            <button 
              onClick={() => { setSearchTerm(''); setCountyFilter('all'); setTypeFilter('all'); }}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 bg-zinc-800 rounded"
            >
              Clear Filters
            </button>
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
                  {day.shifts
                    .filter(s => {
                      if (searchTerm && !s.volunteer_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                      if (countyFilter !== 'all' && s.county !== countyFilter) return false;
                      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
                      if (showConflictsOnly && !allConflicts.includes(s)) return false;
                      return true;
                    })
                    .slice(0, view === 'week' ? undefined : 3).map(shift => {
                    const isConflict = allConflicts.includes(shift);
                    return (
                    <div 
                      key={shift.id}
                      className={`text-xs p-1.5 rounded border cursor-pointer hover:opacity-80 ${TYPE_COLORS[shift.type]} ${isConflict ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-zinc-900' : ''}`}
                      title={`${shift.volunteer_name} - ${shift.start_time} to ${shift.end_time}${isConflict ? ' ⚠️ CONFLICT' : ''}`}
                    >
                      <div className="font-medium truncate">{shift.volunteer_name}</div>
                      <div className="text-[10px] opacity-70">{shift.start_time}-{shift.end_time}</div>
                      {view === 'week' && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${STATUS_COLORS[shift.status]}`}>
                            {shift.status}
                          </Badge>
                          <span className="text-[9px] opacity-70">{shift.county}</span>
                          {isConflict && <span className="text-[9px] text-orange-400">⚠️</span>}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowSwapModal(shift); }}
                            className="ml-auto text-[9px] text-zinc-500 hover:text-amber-400" 
                            title="Request swap"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  })}
                  {view === 'month' && day.shifts.length > 3 && (
                    <div className="text-xs text-zinc-500">+{day.shifts.length - 3} more</div>
                  )}
                  {day.shifts.length === 0 && day.isCurrentMonth && (
                    <button 
                      onClick={() => {
                        setSelectedDate(day.date.toISOString().split('T')[0]);
                        setShowAddModal(true);
                      }}
                      className={`w-full text-xs p-2 border border-dashed rounded ${showGapsOnly ? 'text-red-400 border-red-800 bg-red-900/20 hover:bg-red-900/30' : 'text-zinc-600 hover:text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                    >
                      {showGapsOnly ? '⚠️ No coverage' : '+ Add shift'}
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

      {/* Reminders Panel */}
      {showRemindersPanel && (
        <div className="fixed right-0 top-0 h-full w-96 bg-zinc-900 border-l border-zinc-800 shadow-xl z-40 overflow-y-auto">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              Shift Reminders
            </h3>
            <button onClick={() => setShowRemindersPanel(false)} className="text-zinc-400 hover:text-zinc-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Settings */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Auto-Reminders</span>
              <button 
                onClick={() => setEnableReminders(!enableReminders)}
                className={`w-10 h-5 rounded-full transition-colors ${enableReminders ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enableReminders ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Channel:</span>
              <select 
                value={reminderChannel}
                onChange={(e) => setReminderChannel(e.target.value as any)}
                className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="all">All Channels</option>
              </select>
            </div>
            <div className="text-xs text-zinc-500 mt-2">
              Volunteers receive 24hr and 1hr reminders before shifts.
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Pending Reminders</span>
              <Badge className="bg-blue-600">{pendingReminders.length}</Badge>
            </div>
            
            {pendingReminders.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending reminders</p>
              </div>
            ) : (
              pendingReminders.map(reminder => (
                <div key={reminder.id} className="border border-blue-800/50 bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">{reminder.volunteer_name}</div>
                      <div className="text-xs text-zinc-500">
                        {reminder.shift_date} • {reminder.shift_time}
                      </div>
                    </div>
                    <Badge className={reminder.reminder_type === '24hr' ? 'bg-blue-700' : 'bg-purple-700'}>
                      {reminder.reminder_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-400 mb-2">
                    <BellRing className="w-3 h-3 inline mr-1" />
                    Sends: {new Date(reminder.send_at).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleSendTestReminder(reminder.id)}>
                      <Send className="w-3 h-3 mr-1" />
                      Send Now
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs text-red-400 border-red-800" onClick={() => handleCancelReminder(reminder.id)}>
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Swap Requests Panel */}
      {showSwapsPanel && (
        <div className="fixed right-0 top-0 h-full w-96 bg-zinc-900 border-l border-zinc-800 shadow-xl z-40 overflow-y-auto">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-amber-400" />
              Shift Swap Requests
            </h3>
            <button onClick={() => setShowSwapsPanel(false)} className="text-zinc-400 hover:text-zinc-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {pendingSwaps.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">
                <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending swap requests</p>
              </div>
            ) : (
              pendingSwaps.map(swap => (
                <div key={swap.id} className={`border rounded-lg p-3 ${
                  swap.status === 'claimed' ? 'border-green-800 bg-green-900/20' : 'border-amber-800 bg-amber-900/20'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">{swap.requesting_volunteer}</div>
                      <div className="text-xs text-zinc-500">
                        {swap.shift.date} • {swap.shift.start_time}-{swap.shift.end_time}
                      </div>
                    </div>
                    <Badge className={swap.status === 'claimed' ? 'bg-green-700' : 'bg-amber-700'}>
                      {swap.status}
                    </Badge>
                  </div>
                  {swap.reason && (
                    <div className="text-xs text-zinc-400 mb-2 flex items-start gap-1">
                      <MessageSquare className="w-3 h-3 mt-0.5" />
                      {swap.reason}
                    </div>
                  )}
                  {swap.accepting_volunteer && (
                    <div className="text-xs text-green-400 mb-2">
                      ✓ Claimed by: {swap.accepting_volunteer}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    {swap.status === 'pending' && (
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleClaimSwap(swap.id)}>
                        <UserCheck className="w-3 h-3 mr-1" />
                        Claim Shift
                      </Button>
                    )}
                    {swap.status === 'claimed' && (
                      <>
                        <Button size="sm" className="flex-1 text-xs bg-green-700 hover:bg-green-600" onClick={() => handleApproveSwap(swap.id)}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-red-400 border-red-800" onClick={() => handleDenySwap(swap.id)}>
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowSwapModal(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                Request Shift Swap
              </h3>
              <button onClick={() => setShowSwapModal(null)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-sm font-medium">{showSwapModal.volunteer_name}</div>
                <div className="text-xs text-zinc-400">
                  {showSwapModal.date} • {showSwapModal.start_time} - {showSwapModal.end_time}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {showSwapModal.county} • {showSwapModal.type}
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Reason for swap request *</label>
                <textarea
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Why do you need this shift covered?"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm h-20 resize-none"
                />
              </div>
              <div className="text-xs text-zinc-500">
                Your request will be posted for other volunteers to claim. A moderator must approve the swap.
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-amber-600 hover:bg-amber-500" 
                  disabled={!swapReason.trim()}
                  onClick={() => handleRequestSwap(showSwapModal)}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Request Swap
                </Button>
                <Button variant="outline" onClick={() => setShowSwapModal(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
