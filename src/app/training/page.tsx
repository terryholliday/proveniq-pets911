'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Clock, CheckCircle, Lock, AlertTriangle, Play, Users, Shield, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import type { VolunteerCapability } from '@/lib/types/volunteer';

// Simplified training modules for website
const TRAINING_MODULES = {
  'vol101/orientation': {
    id: 'vol101/orientation',
    title: 'Volunteer Orientation',
    description: 'Introduction to the Pet911 network and our mission',
    duration: '15 min',
    isRequired: true,
    prerequisites: [],
  },
  'vol101/platform-basics': {
    id: 'vol101/platform-basics',
    title: 'Platform Basics',
    description: 'Learn to navigate the Pet911 platform',
    duration: '20 min',
    isRequired: true,
    prerequisites: ['vol101/orientation'],
  },
  'vol101/safety': {
    id: 'vol101/safety',
    title: 'Personal Safety',
    description: 'Stay safe during volunteer activities',
    duration: '25 min',
    isRequired: true,
    prerequisites: ['vol101/platform-basics'],
  },
  'mod101/code-of-conduct': {
    id: 'mod101/code-of-conduct',
    title: 'Moderator Code of Conduct',
    description: 'Moderator-specific conduct and enforcement',
    duration: '30 min',
    isRequired: true,
    prerequisites: ['vol101/safety'],
  },
  'trn101/vehicle-setup': {
    id: 'trn101/vehicle-setup',
    title: 'Vehicle Setup',
    description: 'Prepare your vehicle for safe pet transport',
    duration: '20 min',
    isRequired: true,
    prerequisites: ['vol101/safety'],
  },
} as const;

const ROLE_TRAINING_PATHS = {
  COMMUNITY_VOLUNTEER: ['vol101/orientation', 'vol101/platform-basics', 'vol101/safety'],
  TRANSPORT: ['vol101/orientation', 'vol101/platform-basics', 'vol101/safety', 'trn101/vehicle-setup'],
  MODERATOR: ['vol101/orientation', 'vol101/platform-basics', 'vol101/safety', 'mod101/code-of-conduct'],
  SYSOP: ['vol101/orientation', 'vol101/platform-basics', 'vol101/safety', 'mod101/code-of-conduct'],
} as const;

export default function SimpleTrainingPage() {
  const { user } = useAuth();
  const [userCapabilities, setUserCapabilities] = useState<VolunteerCapability[]>([]);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        
        // Fetch volunteer profile
        const { data: volunteer, error: volunteerError } = await supabase
          .from('volunteers')
          .select('capabilities, status')
          .eq('user_id', user.id)
          .single();

        if (volunteerError && volunteerError.code !== 'PGRST116') {
          console.error('Volunteer fetch error:', volunteerError);
          setError('Failed to load volunteer data');
          return;
        }

        const capabilities = volunteer?.capabilities || [];
        setUserCapabilities(capabilities);

        // Fetch training progress
        const { data: progress, error: progressError } = await supabase
          .from('training_module_completions')
          .select('module_id')
          .eq('user_id', user.id);

        if (progressError) {
          console.error('Progress fetch error:', progressError);
        } else {
          const completed = new Set(progress?.map(p => p.module_id) || []);
          setCompletedModules(completed);
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load training data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const getRequiredModulesForRole = (capability: VolunteerCapability) => {
    const roleMap: Record<VolunteerCapability, keyof typeof ROLE_TRAINING_PATHS> = {
      'TRANSPORT': 'TRANSPORT',
      'FOSTER_SHORT_TERM': 'COMMUNITY_VOLUNTEER',
      'FOSTER_LONG_TERM': 'COMMUNITY_VOLUNTEER',
      'EMERGENCY_RESPONSE': 'COMMUNITY_VOLUNTEER',
      'VET_TRANSPORT': 'TRANSPORT',
      'SHELTER_TRANSPORT': 'TRANSPORT',
      'MODERATOR': 'MODERATOR',
      'SYSOP': 'SYSOP',
    };
    
    const role = roleMap[capability];
    return role ? ROLE_TRAINING_PATHS[role] : ROLE_TRAINING_PATHS.COMMUNITY_VOLUNTEER;
  };

  const getModuleStatus = (moduleId: keyof typeof TRAINING_MODULES) => {
    const isCompleted = completedModules.has(moduleId);
    const module = TRAINING_MODULES[moduleId];
    
    if (!module) return 'locked';
    if (isCompleted) return 'completed';
    
    // Check prerequisites
    const hasPrerequisites = module.prerequisites.every(prereq => completedModules.has(prereq));
    return hasPrerequisites ? 'available' : 'locked';
  };

  const renderModuleCard = (moduleId: keyof typeof TRAINING_MODULES, isRequired: boolean = false) => {
    const module = TRAINING_MODULES[moduleId];
    if (!module) return null;

    const status = getModuleStatus(moduleId);
    const isCompleted = status === 'completed';

    return (
      <div key={moduleId} className={`border rounded-lg p-4 ${isCompleted ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : status === 'locked' ? (
                <Lock className="w-5 h-5 text-slate-400" />
              ) : (
                <BookOpen className="w-5 h-5 text-blue-600" />
              )}
              {module.title}
            </h3>
            {isRequired && (
              <Badge variant="destructive" className="ml-2">Required</Badge>
            )}
          </div>
          <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
            {status === 'completed' ? 'Completed' : status === 'locked' ? 'Locked' : 'Available'}
          </Badge>
        </div>
        
        <p className="text-sm text-slate-600 mb-3">{module.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {module.duration}
          </div>
        </div>

        {module.prerequisites.length > 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-3">
            Requires: {module.prerequisites.map(p => TRAINING_MODULES[p as keyof typeof TRAINING_MODULES]?.title).join(', ')}
          </div>
        )}

        <div className="flex gap-2">
          <Link href={`/training/${moduleId}`}>
            <Button 
              className="flex-1" 
              variant={isCompleted ? 'outline' : 'default'}
              disabled={status === 'locked'}
            >
              <Play className="w-4 h-4 mr-2" />
              {isCompleted ? 'Review' : status === 'locked' ? 'Locked' : 'Start'}
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to access training modules.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-2">Loading training modules...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Determine which training path to show
  const userRole = userCapabilities.includes('SYSOP') ? 'SYSOP' :
                   userCapabilities.includes('MODERATOR') ? 'MODERATOR' :
                   userCapabilities.includes('TRANSPORT') ? 'TRANSPORT' : 'COMMUNITY_VOLUNTEER';
  
  const requiredModules = getRequiredModulesForRole(userRole);
  const completedRequired = requiredModules.filter(id => completedModules.has(id)).length;
  const totalRequired = requiredModules.length;
  const progressPercentage = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Training Center</h1>
          <p className="text-slate-600">Complete your training to become an effective volunteer</p>
        </div>

        {/* Progress Overview */}
        <div className="border rounded-lg p-4 mb-8 bg-white">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Training Progress
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Required Training</span>
              <span className="text-sm text-slate-600">{completedRequired} of {totalRequired} completed</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {userCapabilities.map(cap => (
                <Badge key={cap} variant="outline">
                  {cap === 'SYSOP' && <Settings className="w-3 h-3 mr-1" />}
                  {cap === 'MODERATOR' && <Shield className="w-3 h-3 mr-1" />}
                  {cap.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Required Training */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Required Training</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {requiredModules.map(moduleId => renderModuleCard(moduleId as keyof typeof TRAINING_MODULES, true))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
