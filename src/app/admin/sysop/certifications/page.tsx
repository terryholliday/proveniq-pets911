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

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'expiring' | 'all'>('active');

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('volunteer_certifications')
      .select('*, volunteer:volunteers(display_name, email)')
      .order('issued_at', { ascending: false });

    if (!error && data) {
      setCertifications(data);
    }
    setLoading(false);
  };

  const revokeCertification = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this certification?')) return;
    const supabase = createClient();
    await supabase.from('volunteer_certifications').update({ status: 'revoked' }).eq('id', id);
    fetchCertifications();
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // 30 days
  };

  const filtered = certifications.filter(c => {
    if (filter === 'active') return c.status === 'active';
    if (filter === 'expiring') return c.status === 'active' && isExpiringSoon(c.expires_at);
    return true;
  });

  const statusColors: Record<string, string> = {
    active: 'bg-green-900 text-green-300',
    expired: 'bg-zinc-800 text-zinc-400',
    revoked: 'bg-red-900 text-red-300',
    suspended: 'bg-yellow-900 text-yellow-300',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">🏆 Certifications</h1>
          </div>
          <div className="flex gap-2">
            {(['active', 'expiring', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded ${filter === f ? 'bg-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-8 text-center text-zinc-500">
            No certifications found
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(cert => (
              <div key={cert.id} className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{cert.title}</div>
                    <div className="text-sm text-zinc-500">{cert.volunteer?.display_name || cert.volunteer?.email}</div>
                    <div className="text-xs text-zinc-600 mt-1 font-mono">{cert.certificate_number}</div>
                    <div className="text-xs text-zinc-600">
                      Issued: {new Date(cert.issued_at).toLocaleDateString()}
                      {cert.expires_at && ` • Expires: ${new Date(cert.expires_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[cert.status] || 'bg-zinc-800'}`}>
                      {cert.status}
                    </span>
                    {isExpiringSoon(cert.expires_at) && (
                      <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded">Expiring Soon</span>
                    )}
                    {cert.status === 'active' && (
                      <button
                        onClick={() => revokeCertification(cert.id)}
                        className="text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
