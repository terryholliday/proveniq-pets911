'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  User, 
  Shield, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Copy
} from 'lucide-react';

interface DiagnosticsData {
  userId: string;
  email: string;
  lastSignIn: string | null;
  volunteer: {
    id: string;
    status: string;
    capabilities: string[];
    displayName: string | null;
    createdAt: string;
  } | null;
  partnerOrg: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export default function SysopDiagnosticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function fetchDiagnostics() {
    if (!user) return;
    
    setLoading(true);
    const supabase = createClient();

    try {
      // Get volunteer record
      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('id, status, capabilities, display_name, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get partner org if applicable
      let partnerOrg = null;
      if (volunteer?.capabilities?.includes('PARTNER')) {
        const { data: partnerUser } = await supabase
          .from('partner_users')
          .select('organization_id, role, partner_organizations(id, name)')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (partnerUser?.partner_organizations) {
          partnerOrg = {
            id: partnerUser.organization_id,
            name: (partnerUser.partner_organizations as any).name,
            role: partnerUser.role,
          };
        }
      }

      setData({
        userId: user.id,
        email: user.email || 'No email',
        lastSignIn: user.last_sign_in_at || null,
        volunteer: volunteer ? {
          id: volunteer.id,
          status: volunteer.status,
          capabilities: volunteer.capabilities || [],
          displayName: volunteer.display_name,
          createdAt: volunteer.created_at,
        } : null,
        partnerOrg,
      });
    } catch (err) {
      console.error('Diagnostics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDiagnostics();
  }, [user]);

  function copyToClipboard() {
    if (!data) return;
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          Not authenticated. Please sign in.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="h-7 w-7 text-amber-500" />
            SYSOP Diagnostics
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Debug authentication and authorization state
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading diagnostics...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Auth User */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Supabase Auth User
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">User ID</div>
                <code className="text-sm text-amber-400 bg-zinc-800 px-2 py-1 rounded block break-all">
                  {data.userId}
                </code>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Email</div>
                <div className="text-sm text-white">{data.email}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Last Sign In</div>
                <div className="text-sm text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  {data.lastSignIn 
                    ? new Date(data.lastSignIn).toLocaleString() 
                    : 'Never'}
                </div>
              </div>
            </div>
          </div>

          {/* Volunteer Record */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Volunteer Record
            </h2>
            {data.volunteer ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Volunteer ID</div>
                    <code className="text-sm text-amber-400 bg-zinc-800 px-2 py-1 rounded block break-all">
                      {data.volunteer.id}
                    </code>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Display Name</div>
                    <div className="text-sm text-white">
                      {data.volunteer.displayName || '(not set)'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      {data.volunteer.status === 'ACTIVE' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        data.volunteer.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {data.volunteer.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Created</div>
                    <div className="text-sm text-white">
                      {new Date(data.volunteer.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Capabilities</div>
                  <div className="flex flex-wrap gap-2">
                    {data.volunteer.capabilities.length > 0 ? (
                      data.volunteer.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            cap === 'SYSOP' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                            cap === 'MODERATOR' ? 'bg-purple-900/50 text-purple-400 border border-purple-800' :
                            cap === 'PARTNER' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' :
                            'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {cap}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-zinc-500">No capabilities assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-yellow-400 flex items-start gap-3">
                <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">No Volunteer Record Found</div>
                  <div className="text-sm text-yellow-500 mt-1">
                    This user_id ({data.userId}) has no row in the volunteers table.
                    They need to apply as a volunteer or be assigned capabilities by SYSOP.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Partner Organization */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Partner Organization
            </h2>
            {data.partnerOrg ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Organization ID</div>
                  <code className="text-sm text-amber-400 bg-zinc-800 px-2 py-1 rounded block break-all">
                    {data.partnerOrg.id}
                  </code>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Organization Name</div>
                  <div className="text-sm text-white">{data.partnerOrg.name}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Role</div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-900/50 text-blue-400 border border-blue-800 font-medium">
                    {data.partnerOrg.role}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-500">
                {data.volunteer?.capabilities?.includes('PARTNER') 
                  ? 'User has PARTNER capability but no organization link found in partner_users table.'
                  : 'Not a partner user (no PARTNER capability).'}
              </div>
            )}
          </div>

          {/* Access Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
              Access Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                {data.volunteer?.capabilities?.includes('SYSOP') ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-zinc-600" />
                )}
                <span className={data.volunteer?.capabilities?.includes('SYSOP') ? 'text-white' : 'text-zinc-500'}>
                  SYSOP Command Center (/admin/sysop)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {data.volunteer?.capabilities?.includes('SYSOP') || data.volunteer?.capabilities?.includes('MODERATOR') ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-zinc-600" />
                )}
                <span className={
                  data.volunteer?.capabilities?.includes('SYSOP') || data.volunteer?.capabilities?.includes('MODERATOR') 
                    ? 'text-white' : 'text-zinc-500'
                }>
                  Moderator Dashboard (/admin/mods)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {data.volunteer?.capabilities?.includes('SYSOP') || data.volunteer?.capabilities?.includes('PARTNER') ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-zinc-600" />
                )}
                <span className={
                  data.volunteer?.capabilities?.includes('SYSOP') || data.volunteer?.capabilities?.includes('PARTNER')
                    ? 'text-white' : 'text-zinc-500'
                }>
                  Partner Portal (/partner)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {data.volunteer?.status === 'ACTIVE' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-zinc-600" />
                )}
                <span className={data.volunteer?.status === 'ACTIVE' ? 'text-white' : 'text-zinc-500'}>
                  Volunteer Dashboard (/volunteer)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          Failed to load diagnostics data.
        </div>
      )}
    </div>
  );
}
