'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Send, 
  Clock,
  Users,
  MapPin,
  CheckCircle,
  History,
  Copy,
  Edit
} from 'lucide-react';

interface Broadcast {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  target_county: string;
  sent_by: string;
  sent_at: string;
  recipients_count: number;
  read_count: number;
}

interface Template {
  id: string;
  name: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export default function EmergencyBroadcastPage() {
  const [message, setMessage] = useState('');
  const [county, setCounty] = useState('ALL');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchTemplates();
  }, []);

  const fetchHistory = async () => {
    try {
      // Mock data - replace with real API
      const mockHistory: Broadcast[] = [
        {
          id: 'BC001',
          message: 'Severe weather alert: All outdoor transports suspended until further notice',
          severity: 'critical',
          target_county: 'ALL',
          sent_by: 'admin_sysop',
          sent_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          recipients_count: 245,
          read_count: 238
        },
        {
          id: 'BC002',
          message: 'Urgent need for transport volunteers in Kanawha County - emergency rescue situation',
          severity: 'warning',
          target_county: 'KANAWHA',
          sent_by: 'moderator_jane',
          sent_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          recipients_count: 42,
          read_count: 39
        },
        {
          id: 'BC003',
          message: 'System maintenance complete - all services restored',
          severity: 'info',
          target_county: 'ALL',
          sent_by: 'admin_sysop',
          sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          recipients_count: 251,
          read_count: 245
        }
      ];
      setHistory(mockHistory);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Mock templates
      const mockTemplates: Template[] = [
        {
          id: 'TPL001',
          name: 'Severe Weather',
          message: 'Severe weather alert: All outdoor transports suspended until further notice. Please stay safe and check for updates.',
          severity: 'critical'
        },
        {
          id: 'TPL002',
          name: 'Urgent Transport Need',
          message: 'Urgent need for transport volunteers in {COUNTY} - emergency rescue situation. Please respond if available.',
          severity: 'warning'
        },
        {
          id: 'TPL003',
          name: 'System Maintenance',
          message: 'System maintenance in progress - some features may be temporarily unavailable. We apologize for the inconvenience.',
          severity: 'info'
        },
        {
          id: 'TPL004',
          name: 'Shelter at Capacity',
          message: 'Critical: {COUNTY} shelter at maximum capacity. Urgent need for foster homes. Please contact us if you can help.',
          severity: 'critical'
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!confirm(`Send ${severity.toUpperCase()} broadcast to ${county === 'ALL' ? 'ALL volunteers' : county}?\n\n"${message}"`)) return;

    setSending(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    
    // Add to history
    const newBroadcast: Broadcast = {
      id: `BC${Date.now()}`,
      message,
      severity,
      target_county: county,
      sent_by: 'current_user',
      sent_at: new Date().toISOString(),
      recipients_count: county === 'ALL' ? 250 : Math.floor(Math.random() * 50) + 20,
      read_count: 0
    };
    setHistory([newBroadcast, ...history]);
    
    setMessage('');
    setTimeout(() => setSent(false), 3000);
  };

  const useTemplate = (template: Template) => {
    setMessage(template.message.replace('{COUNTY}', county));
    setSeverity(template.severity);
    setShowTemplates(false);
  };

  const severityColors = {
    info: 'border-blue-600 bg-blue-900/20',
    warning: 'border-yellow-600 bg-yellow-900/20',
    critical: 'border-red-600 bg-red-900/20',
  };

  const severityBadgeColors = {
    info: 'bg-blue-900/50 text-blue-300',
    warning: 'bg-yellow-900/50 text-yellow-300',
    critical: 'bg-red-900/50 text-red-300',
  };

  const getCountyName = (code: string) => {
    const counties: Record<string, string> = {
      'ALL': 'All Regions',
      'GREENBRIER': 'Greenbrier County',
      'KANAWHA': 'Kanawha County',
    };
    return counties[code] || code;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              Emergency Broadcast
            </h1>
            <p className="text-zinc-500 text-sm">Send critical alerts to volunteers</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        {/* Warning */}
        <Card className="border-red-900/50 bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <div className="text-sm text-red-400 font-medium mb-1">⚠️ Emergency Use Only</div>
                <div className="text-xs text-zinc-400">
                  Emergency broadcasts are sent immediately to all matching volunteers. 
                  Use only for genuine emergencies. All broadcasts are logged in the audit trail.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Send Broadcast */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle>Send New Broadcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Severity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['info', 'warning', 'critical'] as const).map(s => (
                    <Button
                      key={s}
                      variant={severity === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSeverity(s)}
                      className={`capitalize ${severity === s ? severityColors[s] : ''}`}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Target Region</label>
                <select
                  value={county}
                  onChange={e => setCounty(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
                >
                  <option value="ALL">All Regions</option>
                  <option value="GREENBRIER">Greenbrier County</option>
                  <option value="KANAWHA">Kanawha County</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Enter your emergency broadcast message..."
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 resize-none"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  {message.length}/500 characters
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className={`w-full py-3 font-medium transition-all ${
                  sending ? 'bg-zinc-700 text-zinc-400' :
                  sent ? 'bg-green-700 text-green-100' :
                  severity === 'critical' ? 'bg-red-700 hover:bg-red-600 text-white' :
                  severity === 'warning' ? 'bg-yellow-700 hover:bg-yellow-600 text-white' :
                  'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : sent ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Broadcast Sent
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send {severity.toUpperCase()} Alert
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Active Volunteers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">251</div>
                    <div className="text-xs text-zinc-500">Total Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">198</div>
                    <div className="text-xs text-zinc-500">Online Now</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Kanawha County</span>
                    <span className="font-medium">87 volunteers</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Greenbrier County</span>
                    <span className="font-medium">42 volunteers</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.slice(0, 3).map(broadcast => (
                    <div key={broadcast.id} className="flex items-start gap-3 pb-3 border-b border-zinc-800 last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        broadcast.severity === 'critical' ? 'bg-red-400' :
                        broadcast.severity === 'warning' ? 'bg-yellow-400' :
                        'bg-blue-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{broadcast.message}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {getCountyName(broadcast.target_county)} • {new Date(broadcast.sent_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Templates Modal */}
        {showTemplates && (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Message Templates
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 cursor-pointer transition-all"
                    onClick={() => useTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${severityBadgeColors[template.severity]}`}>
                        {template.severity}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">{template.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {showHistory && (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Broadcast History
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">No broadcasts sent yet</p>
              ) : (
                <div className="space-y-3">
                  {history.map(broadcast => (
                    <div key={broadcast.id} className="p-4 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${severityBadgeColors[broadcast.severity]}`}>
                            {broadcast.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {getCountyName(broadcast.target_county)}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {new Date(broadcast.sent_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mb-3">{broadcast.message}</p>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Sent to {broadcast.recipients_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {broadcast.read_count} read
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {broadcast.sent_by}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
