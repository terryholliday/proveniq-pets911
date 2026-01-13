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
  Loader2
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
      <div className="bg-gradient-to-r from-amber-900/30 to-zinc-900 border-b border-zinc-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-900/50 flex items-center justify-center">
              <User className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  profile.status === 'ACTIVE' 
                    ? 'bg-green-900/50 text-green-400' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {profile.status}
                </span>
                <span className="text-sm text-zinc-500">
                  {profile.completed_dispatches} / {profile.total_dispatches} dispatches completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Capabilities */}
        {profile.capabilities && profile.capabilities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm text-zinc-500 uppercase mb-3">Your Capabilities</h2>
            <div className="flex flex-wrap gap-2">
              {profile.capabilities.map(cap => {
                const Icon = CAPABILITY_ICONS[cap] || CheckCircle;
                return (
                  <span 
                    key={cap}
                    className="inline-flex items-center gap-1 text-sm bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full"
                  >
                    <Icon className="h-4 w-4 text-amber-500" />
                    {cap.replace(/_/g, ' ')}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DASHBOARD_LINKS.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block p-4 rounded-lg border bg-zinc-900/50 transition-all ${link.color}`}
              >
                <div className="flex items-start justify-between">
                  <Icon className="h-6 w-6 text-zinc-400" />
                  {link.badge && (
                    <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">
                      {link.badge}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <div className="font-medium">{link.label}</div>
                  <div className="text-xs text-zinc-500 mt-1">{link.description}</div>
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
