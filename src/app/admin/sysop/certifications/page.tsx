'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Certification {
  id: string;
  user_id: string;
  module_id: string;
  certificate_number: string;
  title: string;
  issued_at: string;
  expires_at: string | null;
  status: string;
  volunteer?: { display_name: string; email: string };
}

const STATUS_CONFIG: Record<string, { color: string; icon: string }> = {
  active: { color: 'bg-green-900 text-green-300', icon: '✓' },
  expired: { color: 'bg-zinc-800 text-zinc-400', icon: '⌛' },
  revoked: { color: 'bg-red-900 text-red-300', icon: '✗' },
  suspended: { color: 'bg-yellow-900 text-yellow-300', icon: '⏸' },
};

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'expiring' | 'all'>('active');
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCertifications();
  }, [filter]);

  const getSession = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchCertifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/certifications?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const json = await res.json();
      if (json.success && json.data) {
        setCertifications(json.data);
      } else {
        setError(json.error?.message || 'Failed to load');
      }
    } catch (e) {
      setError('Network error');
    }

    setLoading(false);
  };

  const updateCertStatus = async (status: string) => {
    if (!selectedCert) return;
    
    setSaving(true);
    try {
      const session = await getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/admin/certifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: selectedCert.id, 
          status, 
          reason: status === 'revoked' ? revokeReason : undefined 
        }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchCertifications();
        setSelectedCert(null);
        setRevokeReason('');
      } else {
        setError(json.error?.message || 'Failed to update');
      }
    } catch (e) {
      setError('Network error');
    }
    setSaving(false);
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const stats = {
    total: certifications.length,
    active: certifications.filter(c => c.status === 'active').length,
    expiring: certifications.filter(c => c.status === 'active' && isExpiringSoon(c.expires_at)).length,
    revoked: certifications.filter(c => c.status === 'revoked').length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">🏆 Certifications</h1>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="text-center px-3 py-2 bg-zinc-900 rounded-lg">
              <div className="text-lg font-bold text-green-400">{stats.active}</div>
              <div className="text-xs text-zinc-500">Active</div>
            </div>
            <div className="text-center px-3 py-2 bg-zinc-900 rounded-lg">
              <div className="text-lg font-bold text-orange-400">{stats.expiring}</div>
              <div className="text-xs text-zinc-500">Expiring</div>
            </div>
            <div className="text-center px-3 py-2 bg-zinc-900 rounded-lg">
              <div className="text-lg font-bold text-red-400">{stats.revoked}</div>
              <div className="text-xs text-zinc-500">Revoked</div>
            </div>
            <button onClick={fetchCertifications} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg">🔄</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">⚠️ {error}</div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {(['active', 'expiring', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                filter === f ? 'bg-amber-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {f === 'active' ? '✓ Active' : f === 'expiring' ? '⚠️ Expiring Soon' : '📋 All'}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading...</div>
        ) : certifications.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-8 text-center text-zinc-500">
            No certifications found
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-900/80">
                <tr className="text-left text-xs text-zinc-400 uppercase">
                  <th className="px-4 py-3">Certificate</th>
                  <th className="px-4 py-3">Volunteer</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {certifications.map(cert => {
                  const statusCfg = STATUS_CONFIG[cert.status] || STATUS_CONFIG.active;
                  const expiring = isExpiringSoon(cert.expires_at);
                  return (
                    <tr key={cert.id} className="hover:bg-zinc-900/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{cert.title}</div>
                        <div className="text-xs text-zinc-600 font-mono">{cert.certificate_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{cert.volunteer?.display_name || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{cert.volunteer?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {cert.expires_at ? (
                          <span className={expiring ? 'text-orange-400' : 'text-zinc-400'}>
                            {new Date(cert.expires_at).toLocaleDateString()}
                            {expiring && ' ⚠️'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusCfg.color}`}>
                          {statusCfg.icon} {cert.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cert.status === 'active' && (
                          <button
                            onClick={() => { setSelectedCert(cert); setRevokeReason(''); }}
                            className="text-xs bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded-lg"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-xs text-zinc-500 text-center">
          Showing {certifications.length} certifications
        </div>
      </div>

      {/* Revoke Modal */}
      {selectedCert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">⚠️ Revoke Certification</h2>
              <button onClick={() => setSelectedCert(null)} className="text-zinc-400 hover:text-white text-xl">×</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="font-medium">{selectedCert.title}</div>
                <div className="text-sm text-zinc-400">{selectedCert.volunteer?.display_name}</div>
                <div className="text-xs text-zinc-600 font-mono mt-1">{selectedCert.certificate_number}</div>
              </div>

              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-sm text-red-300">
                ⚠️ Revoking a certification is permanent. The volunteer will lose this credential.
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Revocation Reason</label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm h-20"
                  placeholder="Explain why this certification is being revoked..."
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button onClick={() => setSelectedCert(null)} className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={() => updateCertStatus('revoked')}
                disabled={saving}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Revoke Certification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
