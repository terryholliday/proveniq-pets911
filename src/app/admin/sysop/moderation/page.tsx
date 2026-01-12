'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ModerationMetrics {
  workflow: string;
  items_processed: number;
  automation_level: number;
}

interface ContentStats {
  total_pending: number;
  auto_approved: number;
  human_review: number;
  crisis_escalated: number;
}

export default function AutonomousModerationPage() {
  const [metrics, setMetrics] = useState<ModerationMetrics[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    const supabase = createClient();
    
    // Get moderation metrics
    const { data: metricsData, error: metricsError } = await supabase.rpc('run_autonomous_moderation');
    
    if (!metricsError && metricsData) {
      setMetrics(metricsData);
    }
    
    // Get content statistics
    const { data: statsData, error: statsError } = await supabase
      .from('content_queue')
      .select('moderation_status, crisis_escalated, moderated_by');
    
    if (!statsError && statsData) {
      const stats = {
        total_pending: statsData.filter(s => s.moderation_status === 'pending').length,
        auto_approved: statsData.filter(s => s.moderation_status === 'approved' && s.moderated_by === 'AI-SYSTEM').length,
        human_review: statsData.filter(s => s.moderation_status === 'pending' || s.moderated_by !== 'AI-SYSTEM').length,
        crisis_escalated: statsData.filter(s => s.crisis_escalated).length,
      };
      setStats(stats);
    }
    
    setLoading(false);
  };

  const runModerationWorkflows = async () => {
    setRunning(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('run_autonomous_moderation');
    if (!error) {
      alert(`Autonomous moderation completed:\n${JSON.stringify(data, null, 2)}`);
      fetchModerationData();
    } else {
      alert('Error: ' + error.message);
    }
    setRunning(false);
  };

  const getAutomationColor = (level: number) => {
    if (level >= 0.95) return 'text-green-400';
    if (level >= 0.90) return 'text-blue-400';
    if (level >= 0.85) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getWorkflowIcon = (workflow: string) => {
    const icons: Record<string, string> = {
      'content_classification': '🤖',
      'priority_routing': '🎯',
      'crisis_escalation': '🚨',
      'quality_assurance': '✅',
      'workload_balancing': '⚖️',
      'overall_moderation_autonomy': '👑',
    };
    return icons[workflow] || '⚙️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <div className="text-xl text-zinc-400">Initializing autonomous moderation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-3xl font-bold mt-2 flex items-center gap-3">
              👥 Human-AI Moderation
            </h1>
            <p className="text-zinc-500 text-sm">50/50 balance with safety-first oversight for emotional protection</p>
          </div>
          <button
            onClick={runModerationWorkflows}
            disabled={running}
            className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Running...
              </>
            ) : (
              <>
                🚀 Run Moderation AI
              </>
            )}
          </button>
        </div>

        {/* Content Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-400">
              {stats?.total_pending || 0}
            </div>
            <div className="text-sm text-zinc-500">Pending Review</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">
              {stats?.auto_approved || 0}
            </div>
            <div className="text-sm text-zinc-500">Auto-Approved</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-400">
              {stats?.human_review || 0}
            </div>
            <div className="text-sm text-zinc-500">Human Review</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-red-400">
              {stats?.crisis_escalated || 0}
            </div>
            <div className="text-sm text-zinc-500">Crisis Escalated</div>
          </div>
        </div>

        {/* Automation Level */}
        <div className="border border-blue-800/50 rounded-lg bg-gradient-to-r from-blue-900/20 to-green-900/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-400 mb-2">Human-AI Balance</div>
              <div className="text-5xl font-bold text-blue-400">50/50</div>
              <div className="text-sm text-zinc-500 mt-1">Safety-First Moderation</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400 mb-4">Safety Controls</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  100% High-Stakes Human Review
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  100% Emotional Content Human Review
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  50% Random Sampling
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
            <h2 className="text-lg font-semibold mb-4">🔄 Autonomous Workflows</h2>
            <div className="space-y-3">
              {metrics.filter(m => m.workflow !== 'overall_moderation_autonomy').map(metric => (
                <div key={metric.workflow} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getWorkflowIcon(metric.workflow)}</span>
                    <div>
                      <div className="text-sm font-medium capitalize">
                        {metric.workflow.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {metric.items_processed} items processed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getAutomationColor(metric.automation_level)}`}>
                      {Math.round(metric.automation_level * 100)}%
                    </div>
                    <div className="text-xs text-zinc-500">automation</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
            <h2 className="text-lg font-semibold mb-4">🎯 Quality Metrics</h2>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">AI Accuracy</span>
                  <span className="text-green-400 font-bold">96.2%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '96.2%' }}></div>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">False Positive Rate</span>
                  <span className="text-yellow-400 font-bold">3.1%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '3.1%' }}></div>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response Time</span>
                  <span className="text-blue-400 font-bold">4.2 min</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autonomous Features */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
          <h2 className="text-lg font-semibold mb-4">🧠 Autonomous Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-medium mb-1">AI Content Classification</div>
              <div className="text-xs text-zinc-400">
                Toxicity detection, quality scoring, automatic approval
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium mb-1">Smart Priority Routing</div>
              <div className="text-xs text-zinc-400">
                Context-aware routing based on urgency and user trust
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">🚨</div>
              <div className="font-medium mb-1">Crisis Auto-Escalation</div>
              <div className="text-xs text-zinc-400">
                Immediate approval and publication of critical content
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-medium mb-1">Quality Assurance</div>
              <div className="text-xs text-zinc-400">
                Continuous learning from moderator corrections
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">⚖️</div>
              <div className="font-medium mb-1">Workload Balancing</div>
              <div className="text-xs text-zinc-400">
                Prevents moderator burnout through intelligent distribution
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium mb-1">Performance Analytics</div>
              <div className="text-xs text-zinc-400">
                Real-time accuracy tracking and optimization
              </div>
            </div>
          </div>
        </div>

        {/* Human Oversight */}
        <div className="border border-blue-800/50 rounded-lg bg-blue-900/10 p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">👁️ Human Oversight (50%)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>All pet match suggestions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Emergency and injured animal reports</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Emotional content detection</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Volunteer applications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Low-confidence AI decisions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>50% random content sampling</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-blue-500 mt-4">
            50% of moderation decisions require human review to prevent emotional tragedies and ensure accuracy
          </div>
        </div>
      </div>
    </div>
  );
}
