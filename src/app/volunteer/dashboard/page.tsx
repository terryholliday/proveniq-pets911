'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Wrench, 
  GraduationCap, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Truck,
  Home,
  ArrowRight,
  Loader2,
  Bell,
  Shield,
  Star,
  ChevronRight
} from 'lucide-react';

interface VolunteerProfile {
  display_name: string;
  status: string;
  capabilities: string[];
  total_dispatches: number;
  completed_dispatches: number;
}

export default function VolunteerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [equipmentCount, setEquipmentCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch profile
      const profileRes = await fetch('/api/volunteer/profile');
      if (profileRes.status === 401) {
        router.push('/login?redirectTo=/volunteer/dashboard');
        return;
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
      }

      // Fetch equipment count
      const equipRes = await fetch('/api/volunteer/equipment');
      if (equipRes.ok) {
        const data = await equipRes.json();
        setEquipmentCount(data.equipment?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h1 className="text-2xl font-bold mb-2">No Volunteer Profile</h1>
          <p className="text-zinc-400 mb-6">You need to apply as a volunteer first.</p>
          <Link 
            href="/volunteer/apply"
            className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 px-6 py-3 rounded-lg font-semibold"
          >
            Apply Now <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  const DASHBOARD_LINKS = [
    {
      href: '/volunteer/equipment',
      icon: Wrench,
      label: 'My Equipment',
      description: 'Register rescue equipment you have',
      badge: equipmentCount > 0 ? `${equipmentCount} items` : 'Add equipment',
      color: 'border-amber-700/50 hover:border-amber-600',
    },
    {
      href: '/training',
      icon: GraduationCap,
      label: 'Training',
      description: 'Complete required training modules',
      color: 'border-blue-700/50 hover:border-blue-600',
    },
    {
      href: '/volunteer/availability',
      icon: Clock,
      label: 'Availability',
      description: 'Set your schedule and response radius',
      color: 'border-green-700/50 hover:border-green-600',
    },
  ];

  const CAPABILITY_ICONS: Record<string, typeof User> = {
    TRANSPORT: Truck,
    FOSTER_SHORT_TERM: Home,
    FOSTER_LONG_TERM: Home,
    EMERGENCY_RESPONSE: AlertTriangle,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-900/40 via-zinc-900 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-900/30">
                  <User className="h-10 w-10 text-white" />
                </div>
                {profile.status === 'ACTIVE' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-zinc-950 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                    profile.status === 'ACTIVE' 
                      ? 'bg-green-900/50 text-green-400 border border-green-700/50' 
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    <Shield className="h-3 w-3" />
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>
            <Link 
              href="/volunteer/dispatch"
              className="hidden md:flex items-center gap-2 bg-amber-700 hover:bg-amber-600 px-4 py-2 rounded-xl font-medium transition-all hover:scale-105"
            >
              <Bell className="h-5 w-5" />
              Dispatch
            </Link>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-900/50 backdrop-blur rounded-xl p-4 border border-zinc-800">
              <div className="text-3xl font-bold text-amber-400">{profile.completed_dispatches}</div>
              <div className="text-xs text-zinc-500 mt-1">Completed</div>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur rounded-xl p-4 border border-zinc-800">
              <div className="text-3xl font-bold text-blue-400">{profile.total_dispatches}</div>
              <div className="text-xs text-zinc-500 mt-1">Total Dispatches</div>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur rounded-xl p-4 border border-zinc-800">
              <div className="text-3xl font-bold text-green-400">{equipmentCount}</div>
              <div className="text-xs text-zinc-500 mt-1">Equipment</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Capabilities */}
        {profile.capabilities && profile.capabilities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm text-zinc-400 font-medium mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Your Capabilities
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.capabilities.map(cap => {
                const Icon = CAPABILITY_ICONS[cap] || CheckCircle;
                return (
                  <span 
                    key={cap}
                    className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 px-4 py-2 rounded-xl shadow-sm"
                  >
                    <Icon className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{cap.replace(/_/g, ' ')}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <h2 className="text-sm text-zinc-400 font-medium mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DASHBOARD_LINKS.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group block p-5 rounded-2xl border-2 bg-zinc-900/50 transition-all duration-200 hover:bg-zinc-900 hover:scale-[1.02] hover:shadow-lg ${link.color}`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                    <Icon className="h-6 w-6 text-amber-500" />
                  </div>
                  {link.badge && (
                    <span className="text-xs bg-amber-900/30 text-amber-400 px-2.5 py-1 rounded-full font-medium">
                      {link.badge}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <div className="font-semibold text-lg flex items-center gap-2">
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">{link.description}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400">
            ← Back to Pet911 Home
          </Link>
        </div>
      </div>
    </div>
  );
}
