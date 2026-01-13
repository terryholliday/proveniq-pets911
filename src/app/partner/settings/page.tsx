'use client';

import { Bell, Shield, Users, Mail, Smartphone } from 'lucide-react';

export default function PartnerSettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-zinc-500 text-sm">Manage your account and notification preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Notifications */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-zinc-500" />
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Urgent Stray Alerts</div>
                <div className="text-xs text-zinc-500">Immediate notifications for Tier 1 emergencies</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Standard Stray Alerts</div>
                <div className="text-xs text-zinc-500">Alerts for non-urgent sightings in your area</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Transport Requests</div>
                <div className="text-xs text-zinc-500">When volunteers request transport assistance</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Daily Summary</div>
                <div className="text-xs text-zinc-500">End-of-day recap of activity</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-zinc-500" />
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-xs text-zinc-500">info@greenbrierhumanesociety.org</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-zinc-500" />
                <div>
                  <div className="text-sm font-medium">SMS</div>
                  <div className="text-xs text-zinc-500">(304) 645-4775</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Team Access */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-zinc-500" />
            Team Access
          </h3>
          <p className="text-sm text-zinc-500 mb-4">Manage who can access your organization&apos;s partner portal</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Jane Smith</div>
                <div className="text-xs text-zinc-500">jane@greenbrierhumanesociety.org</div>
              </div>
              <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded">Admin</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Mike Johnson</div>
                <div className="text-xs text-zinc-500">mike@greenbrierhumanesociety.org</div>
              </div>
              <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">Staff</span>
            </div>
          </div>
          <button className="mt-4 text-sm text-amber-500 hover:underline">+ Add Team Member</button>
        </div>

        {/* Security */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-zinc-500" />
            Security
          </h3>
          <div className="space-y-4">
            <button className="text-sm text-amber-500 hover:underline">Change Password</button>
            <button className="text-sm text-amber-500 hover:underline block">Enable Two-Factor Authentication</button>
            <button className="text-sm text-amber-500 hover:underline block">View Login History</button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-zinc-900 border border-red-900/50 rounded-lg p-6">
          <h3 className="font-semibold mb-4 text-red-400">Danger Zone</h3>
          <p className="text-sm text-zinc-500 mb-4">These actions are permanent and cannot be undone.</p>
          <button className="text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded">
            Deactivate Organization
          </button>
        </div>
      </div>
    </div>
  );
}
