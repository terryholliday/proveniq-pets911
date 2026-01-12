'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface AutonomyMetrics {
  workflow: string;
  items_processed: number;
  autonomous_level: number;
}

interface SystemHealth {
  health_check: string;
  status: string;
  auto_action: string;
}

export default function AutonomousPage() {
  const [metrics, setMetrics] = useState<AutonomyMetrics[]>([]);
  const [health, setHealth] = useState<SystemHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [overallAutonomy, setOverallAutonomy] = useState(0);

  useEffect(() => {
    fetchAutonomyData();
  }, []);

  const fetchAutonomyData = async () => {
    const supabase = createClient();
    
    // Get autonomy metrics
    const { data: metricsData, error: metricsError } = await supabase.rpc('run_autonomous_operations');
    
    if (!metricsError && metricsData) {
      setMetrics(metricsData);
      const overall = metricsData.find((m: AutonomyMetrics) => m.workflow === 'overall_autonomy');
      if (overall) {
        setOverallAutonomy(Math.round(overall.autonomous_level * 100));
      }
    }
    
    // Get system health
    const { data: healthData, error: healthError } = await supabase.rpc('auto_system_health_check');
    
    if (!healthError && healthData) {
      setHealth(healthData);
    }
    
    setLoading(false);
  };

  const runAutonomousWorkflows = async () => {
    setRunning(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('run_autonomous_operations');
    if (!error) {
      alert(`Autonomous operations completed:\n${JSON.stringify(data, null, 2)}`);
      fetchAutonomyData();
    } else {
      alert('Error: ' + error.message);
    }
    setRunning(false);
  };

  const getAutonomyColor = (level: number) => {
    if (level >= 0.95) return 'text-green-400';
    if (level >= 0.90) return 'text-blue-400';
    if (level >= 0.85) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': case 'optimal': return 'text-green-400';
      case 'warning': case 'attention': return 'text-yellow-400';
      case 'critical': case 'error': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  const getWorkflowIcon = (workflow: string) => {
    const icons: Record<string, string> = {
      'daily_workflows': '🔄',
      'hourly_workflows': '⏰',
      'auto_onboarding': '👥',
      'predictive_allocation': '🔮',
      'performance_optimization': '⚡',
      'dispatch_optimization': '🎯',
      'system_health_check': '🏥',
      'overall_autonomy': '🤖',
    };
    return icons[workflow] || '⚙️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <div className="text-xl text-zinc-400">Initializing autonomous systems...</div>
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
              🤖 Autonomous Operations
            </h1>
            <p className="text-zinc-500 text-sm">99.9% automated system with minimal human oversight</p>
          </div>
          <button
            onClick={runAutonomousWorkflows}
            disabled={running}
            className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Running...
              </>
            ) : (
              <>
                🚀 Run All Autonomous Workflows
              </>
            )}
          </button>
        </div>

        {/* Overall Autonomy Score */}
        <div className="border border-green-800/50 rounded-lg bg-gradient-to-r from-green-900/20 to-blue-900/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-400 mb-2">System Autonomy Level</div>
              <div className={`text-5xl font-bold ${getAutonomyColor(overallAutonomy / 100)}`}>
                {overallAutonomy}%
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                {overallAutonomy >= 95 ? 'Fully Autonomous' :
                 overallAutonomy >= 90 ? 'Highly Autonomous' :
                 overallAutonomy >= 85 ? 'Mostly Autonomous' : 'Partial Autonomy'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400 mb-4">Autonomous Features Active</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Auto-Onboarding
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Predictive Resource Allocation
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Performance Optimization
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  System Health Monitoring
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
              {metrics.filter(m => m.workflow !== 'overall_autonomy').map(metric => (
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
                    <div className={`text-lg font-bold ${getAutonomyColor(metric.autonomous_level)}`}>
                      {Math.round(metric.autonomous_level * 100)}%
                    </div>
                    <div className="text-xs text-zinc-500">autonomy</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
            <h2 className="text-lg font-semibold mb-4">🏥 System Health</h2>
            <div className="space-y-3">
              {health.length === 0 ? (
                <div className="text-center py-8 text-green-400">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-sm">All systems healthy</div>
                </div>
              ) : (
                health.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded">
                    <div>
                      <div className="text-sm font-medium capitalize">
                        {check.health_check.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {check.auto_action}
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${getStatusColor(check.status)}`}>
                      {check.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Autonomous Features */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-6">
          <h2 className="text-lg font-semibold mb-4">🚀 Autonomous Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">👥</div>
              <div className="font-medium mb-1">Smart Onboarding</div>
              <div className="text-xs text-zinc-400">
                Risk-based auto-approval of qualified volunteers
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">🔮</div>
              <div className="font-medium mb-1">Predictive Allocation</div>
              <div className="text-xs text-zinc-400">
                Pre-position resources based on demand patterns
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-medium mb-1">Performance Tuning</div>
              <div className="text-xs text-zinc-400">
                Auto-optimize system parameters in real-time
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium mb-1">Dispatch Optimization</div>
              <div className="text-xs text-zinc-400">
                Intelligent volunteer matching algorithms
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">🏥</div>
              <div className="font-medium mb-1">Self-Healing</div>
              <div className="text-xs text-zinc-400">
                Automatic cleanup and system maintenance
              </div>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium mb-1">Continuous Learning</div>
              <div className="text-xs text-zinc-400">
                Performance-based system improvements
              </div>
            </div>
          </div>
        </div>

        {/* Human Oversight Requirements */}
        <div className="border border-amber-800/50 rounded-lg bg-amber-900/10 p-6">
          <h2 className="text-lg font-semibold mb-4 text-amber-400">👁️ Human Oversight Required</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>High-risk applicant reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Critical system alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Emergency broadcasts</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Policy violations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Legal/Compliance issues</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>System failures</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-amber-500 mt-4">
            All other operations run autonomously with 99.9% automation
          </div>
        </div>
      </div>
    </div>
  );
}
