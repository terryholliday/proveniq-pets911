'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Bell, 
  Users, 
  FileText, 
  Settings, 
  Building2,
  TrendingUp,
  LogOut,
  Loader2
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/partner/alerts', label: 'Stray Alerts', icon: Bell },
  { href: '/partner/cases', label: 'Cases', icon: FileText },
  { href: '/partner/volunteers', label: 'Volunteers', icon: Users },
  { href: '/partner/impact', label: 'Impact', icon: TrendingUp },
  { href: '/partner/organization', label: 'Organization', icon: Building2 },
  { href: '/partner/settings', label: 'Settings', icon: Settings },
];

interface PartnerContext {
  organizationId: string;
  organizationName: string;
}

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [partnerContext, setPartnerContext] = useState<PartnerContext | null>(null);

  useEffect(() => {
    async function checkPartnerAccess() {
      try {
        const response = await fetch('/api/partner/auth');
        if (!response.ok) {
          // Not authorized - redirect to login
          router.push('/login?redirectTo=/partner/dashboard&error=partner_required');
          return;
        }
        const data = await response.json();
        setPartnerContext({
          organizationId: data.organizationId,
          organizationName: data.organizationName,
        });
      } catch (error) {
        console.error('Partner auth check failed:', error);
        router.push('/login?redirectTo=/partner/dashboard');
      } finally {
        setLoading(false);
      }
    }
    checkPartnerAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Verifying partner access...</p>
        </div>
      </div>
    );
  }

  if (!partnerContext) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/icon-pet-profiles.ico"
              alt="Pet911"
              className="h-8 w-8"
            />
            <div>
              <span className="font-bold">Pet911</span>
              <span className="text-xs text-amber-500 block">Partner Portal</span>
            </div>
          </Link>
        </div>

        {/* Organization Info */}
        <div className="p-4 border-b border-zinc-800">
          <div className="text-xs text-zinc-500 mb-1">ORGANIZATION</div>
          <div className="font-medium text-sm">{partnerContext.organizationName}</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  isActive
                    ? 'bg-amber-900/30 text-amber-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
