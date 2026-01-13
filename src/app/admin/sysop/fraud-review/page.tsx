'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Eye, 
  Ban, 
  Trash2, 
  CheckCircle,
  Search,
  Image,
  FileText,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface FraudFlag {
  id: string;
  type: 'donation' | 'post' | 'user' | 'application';
  reporter: string;
  reporter_type: 'auto' | 'user' | 'moderator';
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  target_id: string;
  target_data: any;
  evidence: string[];
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  resolution?: string;
}

export default function FraudReviewPage() {
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedFlag, setSelectedFlag] = useState<FraudFlag | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      // For now, use mock data - replace with real API
      const mockFlags: FraudFlag[] = [
        {
          id: 'FLAG001',
          type: 'donation',
          reporter: 'auto-detect',
          reporter_type: 'auto',
          reason: 'Duplicate image detected across multiple fundraisers',
          status: 'pending',
          severity: 'high',
          target_id: 'fund_123',
          target_data: {
            title: 'Emergency Vet Fund for Max',
            amount: '$2,500',
            creator: 'john_doe',
            image_url: '/api/placeholder/400/300'
          },
          evidence: [
            'Image hash matches 3 other fundraisers',
            'New account with no history',
            'No veterinary records provided'
          ],
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: 'FLAG002',
          type: 'post',
          reporter: 'user456',
          reporter_type: 'user',
          reason: 'Suspicious reunion claim - pet appears to be stock photo',
          status: 'pending',
          severity: 'critical',
          target_id: 'post_789',
          target_data: {
            title: 'Found Cat - Is this your Fluffy?',
            location: 'Charleston, WV',
            author: 'suspicious_user',
            images: ['/api/placeholder/400/300']
          },
          evidence: [
            'Reverse image search shows stock photo',
            'Account created 2 days ago',
            'Multiple similar posts in different counties'
          ],
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          id: 'FLAG003',
          type: 'application',
          reporter: 'moderator_jane',
          reporter_type: 'moderator',
          reason: 'Inconsistent information in volunteer application',
          status: 'resolved',
          severity: 'medium',
          target_id: 'app_456',
          target_data: {
            applicant: 'fake_user',
            email: 'fake@email.com',
            phone: '555-0123'
          },
          evidence: [
            'Phone number disconnected',
            'Address does not exist',
            'References cannot be verified'
          ],
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          reviewed_by: 'admin_sysop',
          resolution: 'Application rejected and user banned'
        }
      ];
      setFlags(mockFlags);
    } catch (error) {
      console.error('Failed to fetch flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, action: 'dismiss' | 'remove' | 'ban') => {
    const resolution = action === 'dismiss' ? 'Flag dismissed - no action needed' :
                     action === 'remove' ? 'Content removed - user warned' :
                     'User banned - policy violation';
    
    setFlags(flags.map(f => 
      f.id === id 
        ? { ...f, status: 'resolved', resolution, reviewed_at: new Date().toISOString() }
        : f
    ));
    setSelectedFlag(null);
  };

  const typeColors: Record<string, string> = {
    donation: 'bg-green-900 text-green-300',
    post: 'bg-blue-900 text-blue-300',
    user: 'bg-purple-900 text-purple-300',
    application: 'bg-orange-900 text-orange-300',
  };

  const severityColors: Record<string, string> = {
    low: 'bg-zinc-700 text-zinc-300',
    medium: 'bg-yellow-900 text-yellow-300',
    high: 'bg-orange-900 text-orange-300',
    critical: 'bg-red-900 text-red-300',
  };

  const filteredFlags = filter === 'all' ? flags : flags.filter(f => f.status === filter);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              Fraud Review Queue
            </h1>
            <p className="text-zinc-500 text-sm">Review flagged content and suspicious activity</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({flags.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending ({flags.filter(f => f.status === 'pending').length})
            </Button>
            <Button
              variant={filter === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('resolved')}
            >
              Resolved ({flags.filter(f => f.status === 'resolved').length})
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {flags.filter(f => f.status === 'pending').length}
              </div>
              <div className="text-sm text-zinc-500">Pending Review</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-400">
                {flags.filter(f => f.severity === 'critical').length}
              </div>
              <div className="text-sm text-zinc-500">Critical Flags</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">
                {flags.filter(f => f.status === 'resolved').length}
              </div>
              <div className="text-sm text-zinc-500">Resolved Today</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-400">
                {flags.filter(f => f.reporter_type === 'auto').length}
              </div>
              <div className="text-sm text-zinc-500">Auto-Detected</div>
            </CardContent>
          </Card>
        </div>

        {/* Flags List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading fraud flags...</div>
        ) : filteredFlags.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-zinc-400">No {filter === 'all' ? '' : filter} flags found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFlags.map(flag => (
              <Card key={flag.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-xs px-2 py-1 rounded ${typeColors[flag.type]}`}>
                          {flag.type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${severityColors[flag.severity]}`}>
                          {flag.severity}
                        </span>
                        <span className="text-xs text-zinc-500">
                          Flag #{flag.id}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(flag.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <h3 className="font-medium mb-2">{flag.reason}</h3>
                      
                      <div className="text-sm text-zinc-400 mb-3">
                        Reported by: {flag.reporter} ({flag.reporter_type})
                      </div>

                      {flag.target_data && (
                        <div className="bg-zinc-800/50 rounded p-3 mb-3">
                          <div className="text-xs text-zinc-500 mb-1">Target Content</div>
                          <div className="text-sm">
                            {flag.target_data.title || flag.target_data.applicant || 'Unknown'}
                          </div>
                        </div>
                      )}

                      {flag.evidence && flag.evidence.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-zinc-500 mb-2">Evidence:</div>
                          <ul className="text-sm text-zinc-400 space-y-1">
                            {flag.evidence.map((evidence, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span>
                                {evidence}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {flag.status === 'resolved' && (
                        <div className="bg-green-900/20 border border-green-800 rounded p-3">
                          <div className="text-sm text-green-400">
                            <strong>Resolution:</strong> {flag.resolution}
                          </div>
                          <div className="text-xs text-green-500 mt-1">
                            Resolved by {flag.reviewed_by} on {new Date(flag.reviewed_at || '').toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => setSelectedFlag(flag)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                      {flag.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResolve(flag.id, 'dismiss')}
                            className="text-green-400 hover:text-green-300"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResolve(flag.id, 'remove')}
                            className="text-orange-400 hover:text-orange-300"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResolve(flag.id, 'ban')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Ban
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Anti-Fraud Tools */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              Anti-Fraud Investigation Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <Image className="w-6 h-6" />
                <span className="text-sm">Reverse Image</span>
                <span className="text-xs text-zinc-500">Check for stolen photos</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <FileText className="w-6 h-6" />
                <span className="text-sm">Document Verify</span>
                <span className="text-xs text-zinc-500">Check 501(c)(3) status</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <User className="w-6 h-6" />
                <span className="text-sm">User Analysis</span>
                <span className="text-xs text-zinc-500">IP/Device tracking</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <Calendar className="w-6 h-6" />
                <span className="text-sm">Timeline View</span>
                <span className="text-xs text-zinc-500">Activity patterns</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Flag #{selectedFlag.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Reason</h4>
                <p className="text-zinc-400">{selectedFlag.reason}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Evidence</h4>
                <ul className="text-sm text-zinc-400 space-y-1">
                  {selectedFlag.evidence.map((evidence, idx) => (
                    <li key={idx}>• {evidence}</li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedFlag(null)}>
                  Close
                </Button>
                {selectedFlag.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleResolve(selectedFlag.id, 'dismiss')}
                      className="text-green-400 hover:text-green-300"
                    >
                      Dismiss Flag
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleResolve(selectedFlag.id, 'ban')}
                    >
                      Ban User
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
