'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Home, DollarSign, Plus, Edit, Trash2, CheckCircle, 
  AlertTriangle, Clock, User, MapPin, Calendar, TrendingUp, TrendingDown,
  X, ArrowRight, RotateCcw
} from 'lucide-react';

// Types
type Equipment = {
  id: string;
  name: string;
  type: 'crate' | 'carrier' | 'trap' | 'medical' | 'other';
  size: 'small' | 'medium' | 'large' | 'xlarge';
  status: 'available' | 'checked_out' | 'maintenance' | 'retired';
  location: string;
  checked_out_to?: string;
  checked_out_at?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
};

type FosterHome = {
  id: string;
  name: string;
  county: string;
  capacity: number;
  current_animals: number;
  species_ok: string[];
  sizes_ok: string[];
  special_needs_ok: boolean;
  available: boolean;
  last_placement: string;
};

type FundTransaction = {
  id: string;
  type: 'expense' | 'donation' | 'reimbursement';
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  requested_by: string;
  date: string;
  category: string;
};

// Mock data
const EQUIPMENT: Equipment[] = [
  { id: 'E1', name: 'Large Dog Crate #1', type: 'crate', size: 'large', status: 'available', location: 'Kanawha HQ', condition: 'excellent' },
  { id: 'E2', name: 'Large Dog Crate #2', type: 'crate', size: 'large', status: 'checked_out', location: 'Field', checked_out_to: 'John Mitchell', checked_out_at: '2026-01-12', condition: 'good' },
  { id: 'E3', name: 'Cat Carrier Set A', type: 'carrier', size: 'small', status: 'available', location: 'Kanawha HQ', condition: 'good' },
  { id: 'E4', name: 'Medium Crate #1', type: 'crate', size: 'medium', status: 'maintenance', location: 'Repair Shop', condition: 'fair' },
  { id: 'E5', name: 'Humane Trap #1', type: 'trap', size: 'medium', status: 'available', location: 'Cabell Depot', condition: 'excellent' },
  { id: 'E6', name: 'First Aid Kit A', type: 'medical', size: 'small', status: 'available', location: 'Kanawha HQ', condition: 'good' },
  { id: 'E7', name: 'XL Crate (Giant Breed)', type: 'crate', size: 'xlarge', status: 'available', location: 'Greenbrier', condition: 'excellent' },
  { id: 'E8', name: 'Kitten Carrier Set', type: 'carrier', size: 'small', status: 'checked_out', location: 'Field', checked_out_to: 'Lisa Anderson', checked_out_at: '2026-01-13', condition: 'good' },
];

const FOSTER_HOMES: FosterHome[] = [
  { id: 'F1', name: 'Sarah\'s Foster Home', county: 'Kanawha', capacity: 3, current_animals: 2, species_ok: ['dog', 'cat'], sizes_ok: ['small', 'medium'], special_needs_ok: false, available: true, last_placement: '2026-01-10' },
  { id: 'F2', name: 'Miller Family', county: 'Cabell', capacity: 2, current_animals: 2, species_ok: ['cat'], sizes_ok: ['small', 'medium', 'large'], special_needs_ok: true, available: false, last_placement: '2026-01-08' },
  { id: 'F3', name: 'Davis Rescue Ranch', county: 'Greenbrier', capacity: 5, current_animals: 3, species_ok: ['dog'], sizes_ok: ['medium', 'large', 'xlarge'], special_needs_ok: true, available: true, last_placement: '2026-01-05' },
  { id: 'F4', name: 'Thompson Cat Haven', county: 'Kanawha', capacity: 4, current_animals: 1, species_ok: ['cat'], sizes_ok: ['small', 'medium'], special_needs_ok: false, available: true, last_placement: '2026-01-11' },
  { id: 'F5', name: 'Wilson Pet Care', county: 'Raleigh', capacity: 2, current_animals: 0, species_ok: ['dog', 'cat'], sizes_ok: ['small', 'medium'], special_needs_ok: false, available: true, last_placement: '2025-12-28' },
];

const TRANSACTIONS: FundTransaction[] = [
  { id: 'T1', type: 'expense', amount: 245.00, description: 'Emergency vet care - injured stray', status: 'approved', requested_by: 'John Mitchell', date: '2026-01-12', category: 'Veterinary' },
  { id: 'T2', type: 'donation', amount: 500.00, description: 'Monthly donor contribution', status: 'completed', requested_by: 'System', date: '2026-01-10', category: 'Donation' },
  { id: 'T3', type: 'reimbursement', amount: 67.50, description: 'Transport fuel reimbursement', status: 'pending', requested_by: 'Lisa Anderson', date: '2026-01-13', category: 'Transport' },
  { id: 'T4', type: 'expense', amount: 120.00, description: 'Crate repair and cleaning', status: 'pending', requested_by: 'Robert Davis', date: '2026-01-13', category: 'Equipment' },
  { id: 'T5', type: 'donation', amount: 100.00, description: 'One-time donation', status: 'completed', requested_by: 'System', date: '2026-01-08', category: 'Donation' },
];

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-900/50 text-green-300 border-green-800',
  checked_out: 'bg-amber-900/50 text-amber-300 border-amber-800',
  maintenance: 'bg-red-900/50 text-red-300 border-red-800',
  retired: 'bg-zinc-700 text-zinc-400 border-zinc-600',
};

const TRANSACTION_COLORS: Record<string, string> = {
  expense: 'text-red-400',
  donation: 'text-green-400',
  reimbursement: 'text-amber-400',
};

export default function ResourceManagementPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'foster' | 'fund'>('equipment');
  const [equipment, setEquipment] = useState<Equipment[]>(EQUIPMENT);
  const [fosterHomes, setFosterHomes] = useState<FosterHome[]>(FOSTER_HOMES);
  const [transactions, setTransactions] = useState<FundTransaction[]>(TRANSACTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundBalance, setFundBalance] = useState(2340.00);
  
  // Checkout modal state
  const [checkoutModal, setCheckoutModal] = useState<Equipment | null>(null);
  const [returnModal, setReturnModal] = useState<Equipment | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [returnCondition, setReturnCondition] = useState<string>('good');
  const [returnNotes, setReturnNotes] = useState('');

  // Mock volunteers for checkout
  const VOLUNTEERS = [
    { id: 'V1', name: 'Emily Carter', county: 'KANAWHA' },
    { id: 'V2', name: 'James Wilson', county: 'CABELL' },
    { id: 'V3', name: 'Sarah Martinez', county: 'BERKELEY' },
    { id: 'V4', name: 'Michael Brown', county: 'RALEIGH' },
    { id: 'V5', name: 'Lisa Anderson', county: 'KANAWHA' },
  ];

  // Fetch resources from API
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        setError('Not authenticated - showing sample data');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/mods/resources', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.equipment?.length > 0) {
          setEquipment(data.data.equipment);
        }
        if (data.data.fosterHomes?.length > 0) {
          setFosterHomes(data.data.fosterHomes.map((f: any) => ({
            ...f,
            species_ok: f.species_ok || [],
            sizes_ok: f.sizes_ok || [],
            last_placement: f.last_placement ? new Date(f.last_placement).toLocaleDateString() : 'Never',
          })));
        }
        if (data.data.transactions?.length > 0) {
          setTransactions(data.data.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date).toLocaleDateString(),
          })));
        }
        if (data.data.stats?.fund?.balance) {
          setFundBalance(data.data.stats.fund.balance);
        }
        setError(null);
      }
    } catch (err) {
      console.error('Resources fetch error:', err);
      setError('Failed to load - showing sample data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Equipment checkout handler
  const handleCheckout = async (item: Equipment) => {
    setCheckoutModal(item);
    setSelectedVolunteer('');
    setExpectedReturn(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutModal || !selectedVolunteer) return;
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      
      if (!token) {
        // Mock update
        const volunteer = VOLUNTEERS.find(v => v.id === selectedVolunteer);
        setEquipment(prev => prev.map(e => 
          e.id === checkoutModal.id 
            ? { ...e, status: 'checked_out' as const, checked_out_to: volunteer?.name, checked_out_at: new Date().toISOString().split('T')[0] }
            : e
        ));
        setCheckoutModal(null);
        return;
      }

      await fetch('/api/admin/mods/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          action: 'checkout', 
          resourceType: 'equipment', 
          equipment_id: checkoutModal.id,
          volunteer_id: selectedVolunteer,
          expected_return_at: expectedReturn,
        }),
      });
      setCheckoutModal(null);
      fetchResources();
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  // Equipment return handler
  const handleReturn = async (item: Equipment) => {
    setReturnModal(item);
    setReturnCondition(item.condition || 'good');
    setReturnNotes('');
  };

  const handleConfirmReturn = async () => {
    if (!returnModal) return;
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      
      if (!token) {
        // Mock update
        setEquipment(prev => prev.map(e => 
          e.id === returnModal.id 
            ? { ...e, status: 'available' as const, checked_out_to: undefined, checked_out_at: undefined, condition: returnCondition as any }
            : e
        ));
        setReturnModal(null);
        return;
      }

      await fetch('/api/admin/mods/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          action: 'return', 
          resourceType: 'equipment', 
          equipment_id: returnModal.id,
          condition_in: returnCondition,
          notes: returnNotes,
        }),
      });
      setReturnModal(null);
      fetchResources();
    } catch (err) {
      console.error('Return error:', err);
    }
  };

  // Fund approval handler
  const handleApproval = async (transactionId: string, approved: boolean) => {
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;

      await fetch('/api/admin/mods/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'approve', resourceType: 'fund', transaction_id: transactionId, approved }),
      });
      fetchResources();
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  // Calculate stats
  const equipmentStats = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'available').length,
    checkedOut: equipment.filter(e => e.status === 'checked_out').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
  };

  const fosterStats = {
    totalHomes: fosterHomes.length,
    totalCapacity: fosterHomes.reduce((sum, f) => sum + f.capacity, 0),
    currentAnimals: fosterHomes.reduce((sum, f) => sum + f.current_animals, 0),
    availableSlots: fosterHomes.reduce((sum, f) => sum + (f.available ? f.capacity - f.current_animals : 0), 0),
  };

  const fundStats = {
    balance: fundBalance,
    pendingExpenses: transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
    monthlyDonations: transactions.filter(t => t.type === 'donation').reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">← Command Center</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Resource Management</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6 text-purple-400" />
                Resource Management
              </h1>
              <p className="text-zinc-400 text-sm">Equipment, foster homes, and emergency fund tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">{equipmentStats.available}</span>
            <span className="text-zinc-500">Equipment Available</span>
          </div>
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">{fosterStats.availableSlots}</span>
            <span className="text-zinc-500">Foster Slots</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-medium">${fundStats.balance.toLocaleString()}</span>
            <span className="text-zinc-500">Emergency Fund</span>
          </div>
          {fundStats.pendingExpenses > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">${fundStats.pendingExpenses}</span>
              <span className="text-zinc-500">Pending Approval</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={activeTab === 'equipment' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('equipment')}
            className={activeTab === 'equipment' ? 'bg-blue-600' : ''}
          >
            <Package className="w-4 h-4 mr-2" />
            Equipment ({equipmentStats.total})
          </Button>
          <Button 
            variant={activeTab === 'foster' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('foster')}
            className={activeTab === 'foster' ? 'bg-green-600' : ''}
          >
            <Home className="w-4 h-4 mr-2" />
            Foster Network ({fosterStats.totalHomes})
          </Button>
          <Button 
            variant={activeTab === 'fund' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('fund')}
            className={activeTab === 'fund' ? 'bg-amber-600' : ''}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Emergency Fund
          </Button>
        </div>

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span className="text-green-400">● {equipmentStats.available} Available</span>
                <span className="text-amber-400">● {equipmentStats.checkedOut} Checked Out</span>
                <span className="text-red-400">● {equipmentStats.maintenance} Maintenance</span>
              </div>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Equipment</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map(item => (
                <Card key={item.id} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-zinc-500">{item.type.toUpperCase()} • {item.size.toUpperCase()}</div>
                      </div>
                      <Badge className={STATUS_COLORS[item.status]}>{item.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="text-sm space-y-1 text-zinc-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {item.location}
                      </div>
                      {item.checked_out_to && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {item.checked_out_to}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        Condition: <span className={item.condition === 'excellent' ? 'text-green-400' : item.condition === 'good' ? 'text-blue-400' : item.condition === 'fair' ? 'text-amber-400' : 'text-red-400'}>{item.condition}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {item.status === 'available' && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCheckout(item)}>Check Out</Button>
                      )}
                      {item.status === 'checked_out' && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReturn(item)}>Check In</Button>
                      )}
                      <Button size="sm" variant="ghost"><Edit className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Foster Network Tab */}
        {activeTab === 'foster' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span className="text-green-400">● {fosterStats.availableSlots} Slots Available</span>
                <span className="text-blue-400">● {fosterStats.currentAnimals} Currently Fostering</span>
                <span className="text-zinc-400">● {fosterStats.totalCapacity} Total Capacity</span>
              </div>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Foster Home</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fosterHomes.map(home => {
                const slotsAvailable = home.capacity - home.current_animals;
                const isFull = slotsAvailable === 0;
                return (
                  <Card key={home.id} className={`bg-zinc-900/50 border-zinc-800 ${!home.available ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {home.name}
                            {home.special_needs_ok && <Badge variant="outline" className="text-xs text-purple-400 border-purple-800">Special Needs OK</Badge>}
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {home.county} County
                          </div>
                        </div>
                        <Badge className={home.available && !isFull ? 'bg-green-900/50 text-green-300' : 'bg-zinc-700 text-zinc-400'}>
                          {!home.available ? 'Unavailable' : isFull ? 'Full' : `${slotsAvailable} slots`}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-2 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Capacity</span>
                          <div className="flex gap-1">
                            {Array.from({ length: home.capacity }).map((_, i) => (
                              <div key={i} className={`w-4 h-4 rounded ${i < home.current_animals ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {home.species_ok.map(s => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                          {home.sizes_ok.map(s => (
                            <Badge key={s} variant="outline" className="text-xs text-zinc-500">{s}</Badge>
                          ))}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Last placement: {home.last_placement}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1" disabled={!home.available || isFull}>Place Animal</Button>
                        <Button size="sm" variant="ghost"><Edit className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Emergency Fund Tab */}
        {activeTab === 'fund' && (
          <div className="space-y-6">
            {/* Fund Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-sm text-zinc-400 mb-1">Current Balance</div>
                  <div className="text-3xl font-bold text-green-400">${fundStats.balance.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" /> +$600 this month
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-sm text-zinc-400 mb-1">Pending Approvals</div>
                  <div className="text-3xl font-bold text-amber-400">${fundStats.pendingExpenses.toFixed(2)}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {transactions.filter(t => t.status === 'pending').length} requests waiting
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-sm text-zinc-400 mb-1">Monthly Donations</div>
                  <div className="text-3xl font-bold text-blue-400">${fundStats.monthlyDonations.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" /> 3 donors this month
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" />Request Funds</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-zinc-800">
                  {transactions.map(tx => (
                    <div key={tx.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'donation' ? 'bg-green-900/50' : tx.type === 'expense' ? 'bg-red-900/50' : 'bg-amber-900/50'
                        }`}>
                          {tx.type === 'donation' ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{tx.description}</div>
                          <div className="text-xs text-zinc-500">{tx.category} • {tx.requested_by} • {tx.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-medium ${TRANSACTION_COLORS[tx.type]}`}>
                          {tx.type === 'donation' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </div>
                        <Badge variant={tx.status === 'completed' || tx.status === 'approved' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}>
                          {tx.status}
                        </Badge>
                        {tx.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-green-400 border-green-800 hover:bg-green-900/50" onClick={() => handleApproval(tx.id, true)}>
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-400 border-red-800 hover:bg-red-900/50" onClick={() => handleApproval(tx.id, false)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Equipment Checkout Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setCheckoutModal(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-400" />
                Check Out Equipment
              </h3>
              <button onClick={() => setCheckoutModal(null)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-sm font-medium">{checkoutModal.name}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {checkoutModal.type.toUpperCase()} • {checkoutModal.size.toUpperCase()} • {checkoutModal.location}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Condition: <span className={checkoutModal.condition === 'excellent' ? 'text-green-400' : checkoutModal.condition === 'good' ? 'text-blue-400' : 'text-amber-400'}>{checkoutModal.condition}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Assign to Volunteer *</label>
                <select
                  value={selectedVolunteer}
                  onChange={(e) => setSelectedVolunteer(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                >
                  <option value="">Select volunteer...</option>
                  {VOLUNTEERS.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.county})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Expected Return Date</label>
                <input
                  type="date"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                />
              </div>
              <div className="text-xs text-zinc-500">
                Equipment checkout will be logged with timestamp for tracking purposes.
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-500" 
                  disabled={!selectedVolunteer}
                  onClick={handleConfirmCheckout}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Confirm Checkout
                </Button>
                <Button variant="outline" onClick={() => setCheckoutModal(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setReturnModal(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-green-400" />
                Check In Equipment
              </h3>
              <button onClick={() => setReturnModal(null)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-sm font-medium">{returnModal.name}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {returnModal.type.toUpperCase()} • {returnModal.size.toUpperCase()}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Checked out to: <span className="text-amber-400">{returnModal.checked_out_to}</span>
                </div>
                {returnModal.checked_out_at && (
                  <div className="text-xs text-zinc-500">
                    Since: {returnModal.checked_out_at}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Condition on Return *</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair - Needs Attention</option>
                  <option value="poor">Poor - Needs Repair</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Notes (optional)</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Any issues or notes about the equipment..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm h-20 resize-none"
                />
              </div>
              {returnCondition === 'poor' && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-2 text-xs text-red-300">
                  ⚠️ Equipment will be marked for maintenance and removed from available pool.
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-500" 
                  onClick={handleConfirmReturn}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Confirm Return
                </Button>
                <Button variant="outline" onClick={() => setReturnModal(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
