'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Settings, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Server,
  Globe,
  FileText,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SysopDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Server },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              SYSOP Dashboard
            </h1>
            <p className="text-slate-600 mt-1">System-wide administrative controls and monitoring</p>
          </div>
          <Badge variant="default" className="bg-red-600">
            Superuser Access
          </Badge>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">System Health</p>
                  <p className="text-2xl font-bold text-green-600">Operational</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Users</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending Reviews</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">System Alerts</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">Manage volunteer, moderator, and system accounts.</p>
                <div className="space-y-2">
                  <Link href="/admin/mods">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      Moderator Console
                    </Button>
                  </Link>
                  <Link href="/helpers/dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Volunteer Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <FileText className="w-4 h-4 mr-2" />
                    User Audits (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">Override capabilities and permissions.</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Settings className="w-4 h-4 mr-2" />
                    Capability Overrides (Coming Soon)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Clock className="w-4 h-4 mr-2" />
                    Session Management (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">Core system administration.</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Database className="w-4 h-4 mr-2" />
                    Database Management (Coming Soon)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Activity className="w-4 h-4 mr-2" />
                    Service Health (Coming Soon)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Globe className="w-4 h-4 mr-2" />
                    Environment Config (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">Monitor and resolve system issues.</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Active Incidents (Coming Soon)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <FileText className="w-4 h-4 mr-2" />
                    Alert Rules (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Content Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">Manage training content and resources.</p>
                <div className="space-y-2">
                  <Link href="/helpers/training">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Training Modules
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <FileText className="w-4 h-4 mr-2" />
                      Resource Library (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">System-wide metrics and reporting.</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Usage Metrics (Coming Soon)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <FileText className="w-4 h-4 mr-2" />
                    Impact Reports (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                System Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Audit trails and system logs.</p>
              <Button variant="outline" className="w-full justify-start" disabled>
                <FileText className="w-4 h-4 mr-2" />
                View Audit Logs (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Global configuration and preferences.</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Settings className="w-4 h-4 mr-2" />
                  Global Settings (Coming Soon)
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Globe className="w-4 h-4 mr-2" />
                  Environment Variables (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/mods">
                <Button variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Moderator Console
                </Button>
              </Link>
              <Link href="/helpers/dashboard">
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Volunteer Dashboard
                </Button>
              </Link>
              <Link href="/helpers/training">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Training Modules
                </Button>
              </Link>
              <Button variant="outline" size="sm" disabled>
                <Activity className="w-4 h-4 mr-2" />
                System Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
