'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// import { createClient } from '@/lib/supabase/client'; // Commented out - not used in mock implementation
import { 
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  Award,
  Target,
  BarChart3,
  Play,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  required_for: string[];
  enrolled_count: number;
  completed_count: number;
  average_score: number;
  status: 'active' | 'draft' | 'archived';
}

interface TrainingProgress {
  module_id: string;
  module_title: string;
  enrolled: number;
  in_progress: number;
  completed: number;
  completion_rate: number;
}

interface VolunteerStats {
  total_volunteers: number;
  in_training: number;
  certified_count: number;
  average_progress: number;
}

export function TrainingDashboard() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with real API
      const mockModules: TrainingModule[] = [
        {
          id: 'MOD001',
          title: 'Animal Handling Basics',
          description: 'Safe handling techniques for dogs and cats',
          category: 'core',
          duration_minutes: 45,
          required_for: ['TRANSPORT', 'FOSTER'],
          enrolled_count: 156,
          completed_count: 142,
          average_score: 91.2,
          status: 'active'
        },
        {
          id: 'MOD002',
          title: 'Emergency Response Protocol',
          description: 'Critical response procedures for emergencies',
          category: 'emergency',
          duration_minutes: 60,
          required_for: ['EMERGENCY', 'TRANSPORT'],
          enrolled_count: 89,
          completed_count: 76,
          average_score: 88.5,
          status: 'active'
        },
        {
          id: 'MOD003',
          title: 'TNR Best Practices',
          description: 'Trap-Neuter-Return program guidelines',
          category: 'specialty',
          duration_minutes: 90,
          required_for: ['TNR'],
          enrolled_count: 42,
          completed_count: 38,
          average_score: 94.1,
          status: 'active'
        },
        {
          id: 'MOD004',
          title: 'Foster Care 101',
          description: 'Essential skills for foster volunteers',
          category: 'core',
          duration_minutes: 120,
          required_for: ['FOSTER'],
          enrolled_count: 67,
          completed_count: 61,
          average_score: 89.7,
          status: 'active'
        },
        {
          id: 'MOD005',
          title: 'Animal First Aid',
          description: 'Basic medical care and emergency treatment',
          category: 'emergency',
          duration_minutes: 75,
          required_for: ['EMERGENCY'],
          enrolled_count: 34,
          completed_count: 31,
          average_score: 92.3,
          status: 'active'
        }
      ];

      const mockProgress: TrainingProgress[] = mockModules.map(module => ({
        module_id: module.id,
        module_title: module.title,
        enrolled: module.enrolled_count,
        in_progress: module.enrolled_count - module.completed_count,
        completed: module.completed_count,
        completion_rate: Math.round((module.completed_count / module.enrolled_count) * 100)
      }));

      const mockStats: VolunteerStats = {
        total_volunteers: 251,
        in_training: 89,
        certified_count: 198,
        average_progress: 73.4
      };

      setModules(mockModules);
      setProgress(mockProgress);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-blue-900/50 text-blue-300';
      case 'emergency': return 'bg-red-900/50 text-red-300';
      case 'specialty': return 'bg-purple-900/50 text-purple-300';
      default: return 'bg-zinc-800 text-zinc-300';
    }
  };

  const filteredModules = selectedCategory === 'all' 
    ? modules 
    : modules.filter(m => m.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Modules', count: modules.length },
    { id: 'core', label: 'Core Training', count: modules.filter(m => m.category === 'core').length },
    { id: 'emergency', label: 'Emergency', count: modules.filter(m => m.category === 'emergency').length },
    { id: 'specialty', label: 'Specialty', count: modules.filter(m => m.category === 'specialty').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <div className="text-xl text-zinc-400">Loading training data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              Training Dashboard
            </h1>
            <p className="text-zinc-500 text-sm">Monitor training progress and manage modules</p>
          </div>
          <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-black font-medium rounded-lg flex items-center gap-2">
            <Play className="w-4 h-4" />
            Create New Module
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold">{stats?.total_volunteers || 0}</div>
                <div className="text-sm text-zinc-500">Total Volunteers</div>
              </div>
            </div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold">{stats?.in_training || 0}</div>
                <div className="text-sm text-zinc-500">In Training</div>
              </div>
            </div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold">{stats?.certified_count || 0}</div>
                <div className="text-sm text-zinc-500">Certified</div>
              </div>
            </div>
          </div>
          
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold">{stats?.average_progress || 0}%</div>
                <div className="text-sm text-zinc-500">Avg Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-zinc-800">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-2 text-sm rounded-t-lg transition-all ${
                selectedCategory === category.id 
                  ? 'bg-zinc-800 text-zinc-100 border-b border-zinc-600' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        {/* Training Progress Chart */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Module Completion Rates
          </h2>
          <div className="space-y-4">
            {progress.map(item => {
              const module = modules.find(m => m.id === item.module_id);
              return (
                <div key={item.module_id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.module_title}</span>
                    <span className="text-zinc-400">
                      {item.completed}/{item.enrolled} ({item.completion_rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all"
                      style={{ width: `${item.completion_rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map(module => (
            <div key={module.id} className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-6 hover:border-zinc-700 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{module.title}</h3>
                  <p className="text-sm text-zinc-400 mb-2">{module.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(module.category)}`}>
                      {module.category}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {module.duration_minutes} min
                    </span>
                  </div>
                </div>
                {module.status === 'active' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Enrolled</span>
                    <span className="font-medium">{module.enrolled_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Completed</span>
                    <span className="font-medium">{module.completed_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Avg Score</span>
                    <span className="font-medium">{module.average_score}%</span>
                  </div>
                  {module.required_for.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-1">Required for:</div>
                      <div className="flex flex-wrap gap-1">
                        {module.required_for.map(cap => (
                          <span key={cap} className="text-xs px-2 py-0.5 bg-zinc-800 rounded">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Details
                </button>
                <button className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Training Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <div className="flex-1">
                <div className="text-sm">John Doe completed Animal Handling Basics</div>
                <div className="text-xs text-zinc-500">2 hours ago</div>
              </div>
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                <Clock className="w-4 h-4 text-yellow-400" />
                <div className="flex-1">
                  <div className="text-sm">Jane Smith started Emergency Response Protocol</div>
                  <div className="text-xs text-zinc-500">4 hours ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                <Award className="w-4 h-4 text-purple-400" />
                <div className="flex-1">
                  <div className="text-sm">Mike Johnson earned TNR Certification</div>
                  <div className="text-xs text-zinc-500">6 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
