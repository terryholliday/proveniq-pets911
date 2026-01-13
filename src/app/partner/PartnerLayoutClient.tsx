'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Bell, 
  Users, 
  FileText, 
  Settings, 
  Building2,
  TrendingUp,
  LogOut
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

interface PartnerLayoutClientProps {
  children: React.ReactNode;
  organizationId: string;
  organizationName: string;
}

export default function PartnerLayoutClient({ 
  children, 
  organizationName 
}: PartnerLayoutClientProps) {
  const pathname = usePathname();

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
          <div className="font-medium text-sm">{organizationName}</div>
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
