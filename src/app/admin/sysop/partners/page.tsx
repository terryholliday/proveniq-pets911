'use client';

import { useState, useEffect } from 'react';
import { Building2, UserPlus, Check, X, Search, Plus } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  type: string;
  county: string;
  status: string;
}

interface PartnerUser {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  email?: string;
}

interface PendingApplication {
  id: string;
  organization_name: string;
  organization_type: string;
  county: string;
  contact_email: string;
  status: string;
  submitted_at: string;
}

export default function PartnersManagementPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRole, setAssignRole] = useState('staff');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New org form
  const [newOrg, setNewOrg] = useState({
    name: '',
    type: 'shelter',
    county: 'GREENBRIER',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch organizations
      const orgsRes = await fetch('/api/admin/partners/organizations');
      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrganizations(data.organizations || []);
      }

      // Fetch pending applications
      const appsRes = await fetch('/api/admin/partners/applications');
      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrg() {
    try {
      const res = await fetch('/api/admin/partners/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrg),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Organization created' });
        setShowAddOrgModal(false);
        setNewOrg({ name: '', type: 'shelter', county: 'GREENBRIER' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: 'Failed to create organization' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating organization' });
    }
  }

  async function handleAssignPartner() {
    if (!selectedOrg || !assignEmail) return;
    
    setAssigning(true);
    try {
      // First, look up user by email
      const userRes = await fetch(`/api/admin/users/lookup?email=${encodeURIComponent(assignEmail)}`);
      if (!userRes.ok) {
        setMessage({ type: 'error', text: 'User not found with that email' });
        setAssigning(false);
        return;
      }
      const userData = await userRes.json();

      // Assign to organization
      const res = await fetch('/api/admin/partners/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          organizationId: selectedOrg.id,
          role: assignRole,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${assignEmail} assigned as ${assignRole} to ${selectedOrg.name}` });
        setShowAssignModal(false);
        setAssignEmail('');
        setSelectedOrg(null);
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to assign partner' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error assigning partner' });
    } finally {
      setAssigning(false);
    }
  }

  async function handleApproveApplication(app: PendingApplication) {
    try {
      const res = await fetch('/api/admin/partners/applications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `${app.organization_name} approved` });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error approving application' });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Building2 className="h-7 w-7 text-amber-500" />
              Partner Management
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Manage organizations and assign partner access</p>
          </div>
          <button
            onClick={() => setShowAddOrgModal(true)}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 px-4 py-2 rounded text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Organization
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right">✕</button>
          </div>
        )}

        {/* Pending Applications */}
        {applications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-amber-500">Pending Applications ({applications.length})</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">County</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-medium">{app.organization_name}</td>
                      <td className="px-4 py-3 text-sm capitalize">{app.organization_type}</td>
                      <td className="px-4 py-3 text-sm">{app.county}</td>
                      <td className="px-4 py-3 text-sm">{app.contact_email}</td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveApplication(app)}
                            className="text-xs bg-green-900/50 hover:bg-green-900 text-green-400 px-2 py-1 rounded flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button className="text-xs bg-red-900/50 hover:bg-red-900 text-red-400 px-2 py-1 rounded flex items-center gap-1">
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Organizations */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Partner Organizations ({organizations.length})</h2>
          {loading ? (
            <div className="text-center py-8 text-zinc-500">Loading...</div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
              <p className="text-zinc-500">No organizations yet</p>
              <p className="text-zinc-600 text-sm mt-1">Add one or approve a pending application</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">County</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {organizations.map(org => (
                    <tr key={org.id} className="hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-medium">{org.name}</td>
                      <td className="px-4 py-3 text-sm capitalize">{org.type}</td>
                      <td className="px-4 py-3 text-sm">{org.county}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          org.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedOrg(org);
                            setShowAssignModal(true);
                          }}
                          className="text-xs bg-blue-900/50 hover:bg-blue-900 text-blue-400 px-2 py-1 rounded flex items-center gap-1"
                        >
                          <UserPlus className="h-3 w-3" /> Assign User
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Organization Modal */}
      {showAddOrgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                  placeholder="Greenbrier Humane Society"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Type</label>
                <select
                  value={newOrg.type}
                  onChange={(e) => setNewOrg({ ...newOrg, type: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                >
                  <option value="shelter">Shelter</option>
                  <option value="rescue">Rescue</option>
                  <option value="humane_society">Humane Society</option>
                  <option value="veterinary">Veterinary</option>
                  <option value="transport">Transport</option>
                  <option value="foster_network">Foster Network</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">County</label>
                <select
                  value={newOrg.county}
                  onChange={(e) => setNewOrg({ ...newOrg, county: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                >
                  <option value="GREENBRIER">Greenbrier</option>
                  <option value="KANAWHA">Kanawha</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddOrgModal(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrg}
                className="flex-1 bg-amber-700 hover:bg-amber-600 px-4 py-2 rounded text-sm font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Assign User to {selectedOrg.name}</h3>
            <p className="text-sm text-zinc-500 mb-4">Enter the email of the user you want to grant partner access</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">User Email</label>
                <input
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                  placeholder="partner@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Role</label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                >
                  <option value="admin">Admin (full access)</option>
                  <option value="staff">Staff (standard access)</option>
                  <option value="viewer">Viewer (read-only)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrg(null);
                  setAssignEmail('');
                }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPartner}
                disabled={assigning || !assignEmail}
                className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium"
              >
                {assigning ? 'Assigning...' : 'Assign Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
