'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, Send, Users, MapPin, Truck, Home, Zap, Clock, 
  CheckCircle, AlertTriangle, Bell, Mail, Phone, FileText
} from 'lucide-react';

type MessageTemplate = {
  id: string;
  name: string;
  content: string;
  category: string;
};

type RecentMessage = {
  id: string;
  type: 'broadcast' | 'direct' | 'alert';
  recipient: string;
  content: string;
  sent_at: string;
  status: 'delivered' | 'pending' | 'failed';
};

const TEMPLATES: MessageTemplate[] = [
  { id: '1', name: 'Urgent Transport Needed', content: '🚨 URGENT: Transport volunteer needed in {county} for {animal}. Can you help? Reply YES to accept.', category: 'urgent' },
  { id: '2', name: 'Foster Request', content: '🏠 Foster home needed for {animal} in {county}. Duration: {duration}. Reply if available!', category: 'foster' },
  { id: '3', name: 'Shift Reminder', content: '⏰ Reminder: Your volunteer shift starts in 1 hour. Please confirm your availability.', category: 'reminder' },
  { id: '4', name: 'Thank You', content: '🙏 Thank you for completing mission #{id}! Your help saved a life today. You rock! 🌟', category: 'thanks' },
  { id: '5', name: 'Weather Alert', content: '⚠️ Weather Advisory: {condition} expected in {county}. Please use caution during transports.', category: 'alert' },
];

const RECENT_MESSAGES: RecentMessage[] = [
  { id: '1', type: 'broadcast', recipient: 'All Kanawha Transporters', content: 'Urgent transport needed - injured stray on Main St', sent_at: '10 min ago', status: 'delivered' },
  { id: '2', type: 'direct', recipient: 'John Mitchell', content: 'Can you take the Greenbrier pickup?', sent_at: '25 min ago', status: 'delivered' },
  { id: '3', type: 'alert', recipient: 'All Volunteers', content: 'System maintenance tonight 2-4am', sent_at: '1 hr ago', status: 'delivered' },
];

export default function ModeratorCommunicationsPage() {
  const [broadcastType, setBroadcastType] = useState<'all' | 'county' | 'capability'>('all');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedCapability, setSelectedCapability] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const applyTemplate = (template: MessageTemplate) => {
    setMessage(template.content);
    setSelectedTemplate(template.id);
  };

  const handleSend = () => {
    alert(`Message would be sent to: ${broadcastType === 'all' ? 'All Volunteers' : broadcastType === 'county' ? selectedCounty : selectedCapability}\n\nMessage: ${message}`);
    setMessage('');
    setSelectedTemplate(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">← Command Center</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Communications</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Communications Center</h1>
              <p className="text-zinc-400 text-sm">Send alerts and broadcast messages to volunteers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-blue-400" />Compose Broadcast</CardTitle>
                <CardDescription>Send messages to volunteers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipient Selection */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Recipients</label>
                  <div className="flex gap-2 mb-3">
                    <Button size="sm" variant={broadcastType === 'all' ? 'default' : 'outline'} onClick={() => setBroadcastType('all')}><Users className="w-4 h-4 mr-1" />All Volunteers</Button>
                    <Button size="sm" variant={broadcastType === 'county' ? 'default' : 'outline'} onClick={() => setBroadcastType('county')}><MapPin className="w-4 h-4 mr-1" />By County</Button>
                    <Button size="sm" variant={broadcastType === 'capability' ? 'default' : 'outline'} onClick={() => setBroadcastType('capability')}><Zap className="w-4 h-4 mr-1" />By Capability</Button>
                  </div>
                  {broadcastType === 'county' && (
                    <select className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm" value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}>
                      <option value="">Select County...</option>
                      <option value="KANAWHA">Kanawha</option>
                      <option value="CABELL">Cabell</option>
                      <option value="GREENBRIER">Greenbrier</option>
                      <option value="BERKELEY">Berkeley</option>
                      <option value="MONONGALIA">Monongalia</option>
                    </select>
                  )}
                  {broadcastType === 'capability' && (
                    <select className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm" value={selectedCapability} onChange={(e) => setSelectedCapability(e.target.value)}>
                      <option value="">Select Capability...</option>
                      <option value="TRANSPORT">Transporters</option>
                      <option value="FOSTER">Foster Homes</option>
                      <option value="EMERGENCY">Emergency Responders</option>
                    </select>
                  )}
                </div>

                {/* Message Compose */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Message</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm h-32 resize-none focus:outline-none focus:border-zinc-700"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-500">{message.length}/500 characters</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={!message} onClick={() => setMessage('')}>Clear</Button>
                      <Button size="sm" disabled={!message} onClick={handleSend}><Send className="w-4 h-4 mr-1" />Send Broadcast</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-zinc-400" />Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {RECENT_MESSAGES.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
                      <div className={`p-2 rounded-lg ${msg.type === 'broadcast' ? 'bg-blue-900/50' : msg.type === 'alert' ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
                        {msg.type === 'broadcast' ? <Users className="w-4 h-4 text-blue-400" /> : msg.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <MessageSquare className="w-4 h-4 text-green-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{msg.recipient}</span>
                          <Badge variant="secondary" className="text-xs">{msg.type}</Badge>
                        </div>
                        <p className="text-sm text-zinc-400 truncate">{msg.content}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />{msg.sent_at}
                          <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{msg.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates Sidebar */}
          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-amber-400" />Quick Templates</CardTitle>
                <CardDescription>Click to use a template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTemplate === template.id ? 'border-amber-600 bg-amber-900/20' : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'}`}
                    >
                      <div className="font-medium text-sm mb-1">{template.name}</div>
                      <div className="text-xs text-zinc-500 line-clamp-2">{template.content}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Today's Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-400">Messages Sent</span><span className="font-medium">24</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Broadcasts</span><span className="font-medium">3</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Direct Messages</span><span className="font-medium">18</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Alerts</span><span className="font-medium">3</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Response Rate</span><span className="text-green-400 font-medium">94%</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
