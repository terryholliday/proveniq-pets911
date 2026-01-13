'use client';

import { Users, MapPin, Car, Home, Shield, Clock } from 'lucide-react';

const MOCK_VOLUNTEERS = [
  { id: 1, name: 'Sarah Mitchell', role: 'Transport', status: 'active', badges: ['TRANSPORT_LEG'], lastActive: '2 min ago', completedTasks: 24 },
  { id: 2, name: 'Mike Johnson', role: 'Foster', status: 'active', badges: ['KITTEN_NURSE'], lastActive: '15 min ago', completedTasks: 12 },
  { id: 3, name: 'Emily Davis', role: 'Field Volunteer', status: 'active', badges: ['WATCHER', 'TRANSPORT_LEG'], lastActive: '1 hr ago', completedTasks: 45 },
  { id: 4, name: 'James Wilson', role: 'Transport', status: 'offline', badges: ['TRANSPORT_LEG'], lastActive: '3 hrs ago', completedTasks: 18 },
  { id: 5, name: 'Lisa Brown', role: 'Foster', status: 'offline', badges: ['KITTEN_NURSE', 'BIOSECURITY_SPECIALIST'], lastActive: 'Yesterday', completedTasks: 67 },
];

export default function PartnerVolunteersPage() {
  const activeCount = MOCK_VOLUNTEERS.filter(v => v.status === 'active').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Volunteer Network</h1>
          <p className="text-zinc-500 text-sm">Manage your local volunteer team</p>
        </div>
        <button className="bg-amber-700 hover:bg-amber-600 px-4 py-2 rounded text-sm font-medium">
          Invite Volunteer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          <div className="text-xs text-zinc-500">Active Now</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{MOCK_VOLUNTEERS.length}</div>
          <div className="text-xs text-zinc-500">Total Volunteers</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">3</div>
          <div className="text-xs text-zinc-500">Transporters</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">2</div>
          <div className="text-xs text-zinc-500">Foster Homes</div>
        </div>
      </div>

      {/* Volunteer List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
              <th className="px-4 py-3">Volunteer</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Badges</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tasks Completed</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {MOCK_VOLUNTEERS.map(volunteer => (
              <tr key={volunteer.id} className="hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">
                      {volunteer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{volunteer.name}</div>
                      <div className="text-xs text-zinc-500">Last active: {volunteer.lastActive}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    {volunteer.role === 'Transport' && <Car className="h-4 w-4 text-blue-500" />}
                    {volunteer.role === 'Foster' && <Home className="h-4 w-4 text-purple-500" />}
                    {volunteer.role === 'Field Volunteer' && <MapPin className="h-4 w-4 text-amber-500" />}
                    {volunteer.role}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {volunteer.badges.map(badge => (
                      <span key={badge} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        {badge.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    volunteer.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {volunteer.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">{volunteer.completedTasks}</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-amber-500 hover:underline">View Profile</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
