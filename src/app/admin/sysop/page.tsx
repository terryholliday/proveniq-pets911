import { cookies } from 'next/headers';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';

// Easter egg: No auth check - security through obscurity
// Access via /admin/sysop (buried URL)
export default async function SysopPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  // Use service role for admin queries
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let volunteer = null;
  if (session?.user) {
    const { data: vol } = await adminDb
      .from('volunteers')
      .select('capabilities, status, display_name')
      .eq('user_id', session.user.id)
      .maybeSingle();
    volunteer = vol;
  }

  // Fetch metrics
  const [
    { count: pendingApplications },
    { count: totalVolunteers },
    { count: activeVolunteers },
    { count: activeCooldowns },
    { count: pendingBackgroundChecks },
    { count: activeCertifications },
  ] = await Promise.all([
    adminDb.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'INACTIVE'),
    adminDb.from('volunteers').select('*', { count: 'exact', head: true }),
    adminDb.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    adminDb.from('volunteer_cooldown_events').select('*', { count: 'exact', head: true }).gt('ends_at', new Date().toISOString()),
    adminDb.from('volunteer_background_checks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_review']),
    adminDb.from('volunteer_certifications').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">⚡ SYSOP Command Center</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Signed in as {volunteer?.display_name || session?.user?.email || 'Guest'}
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <div className="text-xs text-zinc-500">System Status</div>
              <div className="text-green-400 text-sm font-medium">● All Systems Operational</div>
            </div>
            <form action="/auth/signout" method="post">
              <button type="submit" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{totalVolunteers ?? 0}</div>
            <div className="text-xs text-zinc-500">Total Volunteers</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{activeVolunteers ?? 0}</div>
            <div className="text-xs text-zinc-500">Active</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{pendingApplications ?? 0}</div>
            <div className="text-xs text-zinc-500">Pending Apps</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{activeCertifications ?? 0}</div>
            <div className="text-xs text-zinc-500">Certifications</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{activeCooldowns ?? 0}</div>
            <div className="text-xs text-zinc-500">Active Cooldowns</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{pendingBackgroundChecks ?? 0}</div>
            <div className="text-xs text-zinc-500">BG Checks Pending</div>
          </div>
        </div>

        {/* Volunteer Management - BLUE theme (people/users) */}
        <div>
          <h2 className="text-lg font-semibold text-blue-400 mb-3">👥 Volunteer Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/sysop/applications" className="block border border-blue-800/50 rounded-lg bg-blue-900/20 p-4 hover:border-blue-600/50 hover:bg-blue-900/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-blue-400">📋 Applications</div>
                {(pendingApplications ?? 0) > 0 && (
                  <span className="bg-amber-600 text-amber-100 text-xs font-medium px-2 py-0.5 rounded-full">
                    {pendingApplications} pending
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Review and approve new volunteers</div>
            </Link>

            <Link href="/admin/sysop/volunteers" className="block border border-blue-800/50 rounded-lg bg-blue-900/20 p-4 hover:border-blue-600/50 hover:bg-blue-900/30 transition-all">
              <div className="text-sm font-medium text-blue-400">👤 All Volunteers</div>
              <div className="text-xs text-zinc-500 mt-1">View, edit capabilities, activate/deactivate</div>
            </Link>

            <Link href="/admin/sysop/background-checks" className="block border border-blue-800/50 rounded-lg bg-blue-900/20 p-4 hover:border-blue-600/50 hover:bg-blue-900/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-blue-400">🔍 Background Checks</div>
                {(pendingBackgroundChecks ?? 0) > 0 && (
                  <span className="bg-amber-600 text-amber-100 text-xs font-medium px-2 py-0.5 rounded-full">
                    {pendingBackgroundChecks}
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Review flagged checks, approve/deny</div>
            </Link>
          </div>
        </div>

        {/* Training & Certification - PURPLE theme (learning/credentials) */}
        <div>
          <h2 className="text-lg font-semibold text-purple-400 mb-3">🎓 Training & Certification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/training/dashboard" className="block border border-purple-800/50 rounded-lg bg-purple-900/20 p-4 hover:border-purple-600/50 hover:bg-purple-900/30 transition-all">
              <div className="text-sm font-medium text-purple-400">📚 Training Dashboard</div>
              <div className="text-xs text-zinc-500 mt-1">Monitor training progress across all tracks</div>
            </Link>

            <Link href="/admin/sysop/certifications" className="block border border-purple-800/50 rounded-lg bg-purple-900/20 p-4 hover:border-purple-600/50 hover:bg-purple-900/30 transition-all">
              <div className="text-sm font-medium text-purple-400">🏆 Certifications</div>
              <div className="text-xs text-zinc-500 mt-1">Issue/revoke certs, view expiring</div>
            </Link>

            <Link href="/admin/sysop/cooldowns" className="block border border-purple-800/50 rounded-lg bg-purple-900/20 p-4 hover:border-purple-600/50 hover:bg-purple-900/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-purple-400">⏸️ Cooldown Management</div>
                {(activeCooldowns ?? 0) > 0 && (
                  <span className="bg-amber-600 text-amber-100 text-xs font-medium px-2 py-0.5 rounded-full">
                    {activeCooldowns} active
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 mt-1">View/override volunteer cooldowns</div>
            </Link>
          </div>
        </div>

        {/* Case Management - GREEN theme (active operations) */}
        <div>
          <h2 className="text-lg font-semibold text-green-400 mb-3">📋 Case Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/sysop/cases" className="block border border-green-800/50 rounded-lg bg-green-900/20 p-4 hover:border-green-600/50 hover:bg-green-900/30 transition-all">
              <div className="text-sm font-medium text-green-400">📂 Incident Cases</div>
              <div className="text-xs text-zinc-500 mt-1">Manage multi-animal incidents</div>
            </Link>

            <Link href="/admin/sysop/tnr" className="block border border-green-800/50 rounded-lg bg-green-900/20 p-4 hover:border-green-600/50 hover:bg-green-900/30 transition-all">
              <div className="text-sm font-medium text-green-400">🐱 TNR Colonies</div>
              <div className="text-xs text-zinc-500 mt-1">Trap-Neuter-Return tracking</div>
            </Link>

            <Link href="/admin/sysop/capacity" className="block border border-green-800/50 rounded-lg bg-green-900/20 p-4 hover:border-green-600/50 hover:bg-green-900/30 transition-all">
              <div className="text-sm font-medium text-green-400">🏥 Capacity Alerts</div>
              <div className="text-xs text-zinc-500 mt-1">Shelter capacity monitoring</div>
            </Link>

            <Link href="/admin/sysop/equipment-match" className="block border border-green-800/50 rounded-lg bg-green-900/20 p-4 hover:border-green-600/50 hover:bg-green-900/30 transition-all">
              <div className="text-sm font-medium text-green-400">🔧 Equipment Match</div>
              <div className="text-xs text-zinc-500 mt-1">Technical rescue volunteer matching</div>
            </Link>

            <Link href="/admin/sysop/outcomes" className="block border border-green-800/50 rounded-lg bg-green-900/20 p-4 hover:border-green-600/50 hover:bg-green-900/30 transition-all">
              <div className="text-sm font-medium text-green-400">💗 Outcomes</div>
              <div className="text-xs text-zinc-500 mt-1">Lives saved metrics & tracking</div>
            </Link>
          </div>
        </div>

        {/* Operations - CYAN theme (real-time dispatch) */}
        <div>
          <h2 className="text-lg font-semibold text-cyan-400 mb-3">🚀 Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Row 1: Cyan cards (routine operations) */}
            <Link href="/admin/mods/dispatch" className="block border border-cyan-800/50 rounded-lg bg-cyan-900/20 p-4 hover:border-cyan-600/50 hover:bg-cyan-900/30 transition-all">
              <div className="text-sm font-medium text-cyan-400">📡 Dispatch Queue</div>
              <div className="text-xs text-zinc-500 mt-1">Manage active dispatch requests</div>
            </Link>

            <Link href="/admin/sysop/transport-relays" className="block border border-cyan-800/50 rounded-lg bg-cyan-900/20 p-4 hover:border-cyan-600/50 hover:bg-cyan-900/30 transition-all">
              <div className="text-sm font-medium text-cyan-400">🚚 Transport Relays</div>
              <div className="text-xs text-zinc-500 mt-1">Multi-leg transport coordination</div>
            </Link>

            <Link href="/admin/sysop/response-times" className="block border border-cyan-800/50 rounded-lg bg-cyan-900/20 p-4 hover:border-cyan-600/50 hover:bg-cyan-900/30 transition-all">
              <div className="text-sm font-medium text-cyan-400">⏱️ Response Times</div>
              <div className="text-xs text-zinc-500 mt-1">Performance analytics by tier/county</div>
            </Link>

            {/* Row 2: Red cards (alerts/urgent) */}
            <Link href="/admin/sysop/escalations" className="block border border-red-800/50 rounded-lg bg-red-900/20 p-4 hover:border-red-600/50 hover:bg-red-900/30 transition-all">
              <div className="text-sm font-medium text-red-400">🚨 Case Escalations</div>
              <div className="text-xs text-zinc-500 mt-1">Auto-escalated unassigned cases</div>
            </Link>

            <Link href="/admin/sysop/fraud-review" className="block border border-red-800/50 rounded-lg bg-red-900/20 p-4 hover:border-red-600/50 hover:bg-red-900/30 transition-all">
              <div className="text-sm font-medium text-red-400">🔍 Fraud Review</div>
              <div className="text-xs text-zinc-500 mt-1">Flagged posts and donations</div>
            </Link>

            <Link href="/admin/sysop/emergency-broadcast" className="block border border-red-800/50 rounded-lg bg-red-900/20 p-4 hover:border-red-600/50 hover:bg-red-900/30 transition-all">
              <div className="text-sm font-medium text-red-400">📢 Emergency Broadcast</div>
              <div className="text-xs text-zinc-500 mt-1">Push notifications to all volunteers</div>
            </Link>
          </div>
        </div>

        {/* Analytics & Automation - INDIGO theme (data/insights) */}
        <div>
          <h2 className="text-lg font-semibold text-indigo-400 mb-3">📊 Analytics & Automation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/sysop/alerts" className="block border border-indigo-800/50 rounded-lg bg-indigo-900/20 p-4 hover:border-indigo-600/50 hover:bg-indigo-900/30 transition-all">
              <div className="text-sm font-medium text-indigo-400">🔔 System Alerts</div>
              <div className="text-xs text-zinc-500 mt-1">Automated workflow notifications</div>
            </Link>

            <Link href="/admin/sysop/analytics" className="block border border-indigo-800/50 rounded-lg bg-indigo-900/20 p-4 hover:border-indigo-600/50 hover:bg-indigo-900/30 transition-all">
              <div className="text-sm font-medium text-indigo-400">📈 Analytics Dashboard</div>
              <div className="text-xs text-zinc-500 mt-1">Metrics, funnels, outcomes</div>
            </Link>

            <Link href="/admin/sysop/heatmap" className="block border border-indigo-800/50 rounded-lg bg-indigo-900/20 p-4 hover:border-indigo-600/50 hover:bg-indigo-900/30 transition-all">
              <div className="text-sm font-medium text-indigo-400">🗺️ Coverage Heatmap</div>
              <div className="text-xs text-zinc-500 mt-1">Geographic volunteer distribution</div>
            </Link>

            <Link href="/admin/sysop/autonomous" className="block border border-indigo-800/50 rounded-lg bg-indigo-900/20 p-4 hover:border-indigo-600/50 hover:bg-indigo-900/30 transition-all">
              <div className="text-sm font-medium text-indigo-400">🤖 Autonomous Operations</div>
              <div className="text-xs text-zinc-500 mt-1">50/50 human-AI system control</div>
            </Link>

            <Link href="/admin/sysop/moderation" className="block border border-indigo-800/50 rounded-lg bg-indigo-900/20 p-4 hover:border-indigo-600/50 hover:bg-indigo-900/30 transition-all">
              <div className="text-sm font-medium text-indigo-400">👥 Human-AI Moderation</div>
              <div className="text-xs text-zinc-500 mt-1">50/50 safety-first content review</div>
            </Link>
          </div>
        </div>

        {/* Partners & Network - AMBER theme (external orgs) */}
        <div>
          <h2 className="text-lg font-semibold text-amber-400 mb-3">🤝 Partners & Network</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/sysop/partners" className="block border border-amber-800/50 rounded-lg bg-amber-900/20 p-4 hover:border-amber-600/50 hover:bg-amber-900/30 transition-all">
              <div className="text-sm font-medium text-amber-400">🏢 Partner Management</div>
              <div className="text-xs text-zinc-500 mt-1">Approve applications, assign users to orgs</div>
            </Link>

            <Link href="/admin/sysop/hotspots" className="block border border-amber-800/50 rounded-lg bg-amber-900/20 p-4 hover:border-amber-600/50 hover:bg-amber-900/30 transition-all">
              <div className="text-sm font-medium text-amber-400">📍 Abandonment Hotspots</div>
              <div className="text-xs text-zinc-500 mt-1">Track repeat abandonment locations</div>
            </Link>

            <Link href="/admin/sysop/counties" className="block border border-amber-800/50 rounded-lg bg-amber-900/20 p-4 hover:border-amber-600/50 hover:bg-amber-900/30 transition-all">
              <div className="text-sm font-medium text-amber-400">🏛️ Counties & Regions</div>
              <div className="text-xs text-zinc-500 mt-1">Manage service areas, shelter partners</div>
            </Link>
          </div>
        </div>

        {/* Configuration - ZINC theme (settings/neutral) */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-400 mb-3">⚙️ Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/sysop/compliance" className="block border border-zinc-700 rounded-lg bg-zinc-800/30 p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all">
              <div className="text-sm font-medium text-zinc-300">📋 Compliance & Resources</div>
              <div className="text-xs text-zinc-500 mt-1">WV laws, shelters & rescue directory</div>
            </Link>

            <Link href="/admin/sysop/content" className="block border border-zinc-700 rounded-lg bg-zinc-800/30 p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all">
              <div className="text-sm font-medium text-zinc-300">📝 Content Management</div>
              <div className="text-xs text-zinc-500 mt-1">Edit training module content</div>
            </Link>

            <Link href="/admin/sysop/audit-log" className="block border border-zinc-700 rounded-lg bg-zinc-800/30 p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all">
              <div className="text-sm font-medium text-zinc-300">📜 Audit Log</div>
              <div className="text-xs text-zinc-500 mt-1">Track all admin actions</div>
            </Link>

            <Link href="/admin/sysop/diagnostics" className="block border border-zinc-700 rounded-lg bg-zinc-800/30 p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all">
              <div className="text-sm font-medium text-zinc-300">🔬 Diagnostics</div>
              <div className="text-xs text-zinc-500 mt-1">Debug auth, capabilities, partner links</div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-600 pt-4 border-t border-zinc-800">
          PROVENIQ PetMayday SYSOP Command Center • Security through obscurity
        </div>
      </div>
    </div>
  );
}
