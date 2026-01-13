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
  'sys101/fraud-detection': {
    id: 'sys101/fraud-detection',
    title: 'Fraud Detection & Prevention',
    description: 'Identify and handle fraudulent content and suspicious activity',
    duration: '45 min',
    isRequired: true,
    prerequisites: ['mod101/code-of-conduct'],
  },
  'sys101/emergency-broadcast': {
    id: 'sys101/emergency-broadcast',
    title: 'Emergency Broadcast System',
    description: 'Send critical alerts and manage emergency communications',
    duration: '30 min',
    isRequired: true,
    prerequisites: ['sys101/fraud-detection'],
  },
  'sys101/autonomous-operations': {
    id: 'sys101/autonomous-operations',
    title: 'Autonomous Operations Overview',
    description: 'Understanding the 99.9% automated system and human oversight',
    duration: '60 min',
    isRequired: true,
    prerequisites: ['sys101/emergency-broadcast'],
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
  SYSOP: ['vol101/orientation', 'vol101/platform-basics', 'vol101/safety', 'mod101/code-of-conduct', 'sys101/fraud-detection', 'sys101/emergency-broadcast', 'sys101/autonomous-operations'],
} as const;

export default function SimpleTrainingPage() {
  const { user, loading: authLoading } = useAuth();
  const [userCapabilities, setUserCapabilities] = useState<VolunteerCapability[]>([]);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volunteerStatus, setVolunteerStatus] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

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

        // Check if volunteer exists and is approved
        if (!volunteer) {
          setVolunteerStatus('not_registered');
          setLoading(false);
          return;
        }

        if (volunteer.status !== 'ACTIVE' && volunteer.status !== 'APPROVED') {
          setVolunteerStatus(volunteer.status || 'pending');
          setLoading(false);
          return;
        }

        setVolunteerStatus('approved');
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
      'PARTNER': 'COMMUNITY_VOLUNTEER',
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
      <div key={moduleId} className={`border rounded-lg p-4 ${isCompleted ? 'border-green-800 bg-green-900/20' : 'border-zinc-800 bg-zinc-900/50'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : status === 'locked' ? (
                <Lock className="w-5 h-5 text-zinc-500" />
              ) : (
                <BookOpen className="w-5 h-5 text-blue-400" />
              )}
              {module.title}
            </h3>
            {isRequired && (
              <Badge variant="destructive" className="ml-2 bg-red-900 text-red-300 border-red-800">Required</Badge>
            )}
          </div>
          <Badge variant={status === 'completed' ? 'default' : 'secondary'} className={status === 'completed' ? 'bg-green-900 text-green-300' : 'bg-zinc-800 text-zinc-300'}>
            {status === 'completed' ? 'Completed' : status === 'locked' ? 'Locked' : 'Available'}
          </Badge>
        </div>
        
        <p className="text-sm text-zinc-400 mb-3">{module.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {module.duration}
          </div>
        </div>

        {module.prerequisites.length > 0 && (
          <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/50 p-2 rounded mb-3">
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
        <div className="max-w-2xl mx-auto py-20">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Training Center</h1>
            <p className="text-slate-600">Training is available for approved volunteers and moderators only.</p>
          </div>
          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-slate-700 mb-4">To access training, you must:</p>
            <ol className="text-left text-sm text-slate-600 mb-6 space-y-2 max-w-md mx-auto">
              <li>1. Create an account or sign in</li>
              <li>2. Apply to become a volunteer</li>
              <li>3. Get approved by a moderator</li>
            </ol>
            <div className="flex gap-3 justify-center">
              <Link href="/login?redirectTo=/training">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/volunteer/apply">
                <Button>Apply to Volunteer</Button>
              </Link>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // Show gate for users who haven't registered as volunteers
  if (volunteerStatus === 'not_registered') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto py-20">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Become a Volunteer</h1>
            <p className="text-slate-600">Training is available after your volunteer application is approved.</p>
          </div>
          <div className="bg-white border rounded-lg p-6 text-center">
            <p className="text-slate-700 mb-4">You&apos;re signed in, but haven&apos;t applied to volunteer yet.</p>
            <Link href="/volunteer/apply">
              <Button size="lg">Apply to Volunteer</Button>
            </Link>
          </div>
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // Show pending status for users awaiting approval
  if (volunteerStatus && volunteerStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto py-20">
          <div className="text-center mb-8">
            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Pending</h1>
            <p className="text-slate-600">Your volunteer application is being reviewed.</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="text-amber-800 mb-2">Current status: <strong className="uppercase">{volunteerStatus}</strong></p>
            <p className="text-sm text-amber-700">Training will be available once your application is approved by a moderator. This usually takes 24-48 hours.</p>
          </div>
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to Home</Link>
          </div>
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
  const userRole: keyof typeof ROLE_TRAINING_PATHS = userCapabilities.includes('SYSOP') ? 'SYSOP' :
                   userCapabilities.includes('MODERATOR') ? 'MODERATOR' :
                   userCapabilities.includes('TRANSPORT') ? 'TRANSPORT' : 'COMMUNITY_VOLUNTEER';

  const requiredModules = ROLE_TRAINING_PATHS[userRole];
  const completedRequired = requiredModules.filter(id => completedModules.has(id)).length;
  const totalRequired = requiredModules.length;
  const progressPercentage = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-500 mb-2">Training Center</h1>
          <p className="text-zinc-400">Complete your training to become an effective volunteer</p>
        </div>

        {/* Progress Overview */}
        <div className="border border-zinc-800 rounded-lg p-4 mb-8 bg-zinc-900/50">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Your Training Progress
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Required Training</span>
              <span className="text-sm text-zinc-400">{completedRequired} of {totalRequired} completed</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-600 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {userCapabilities.map(cap => (
                <Badge key={cap} variant="outline" className="border-zinc-700 text-zinc-300">
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
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">Required Training</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {requiredModules.map(moduleId => renderModuleCard(moduleId as keyof typeof TRAINING_MODULES, true))}
          </div>
        </div>

        {/* SYSOP/Admin Access to Full Dashboard */}
        {userCapabilities.includes('SYSOP') && (
          <div className="mb-8 p-4 border-2 border-amber-600 rounded-lg bg-amber-900/20">
            <h2 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              SYSOP Access
            </h2>
            <p className="text-sm text-amber-300 mb-3">
              Access the full training management dashboard with cooldown controls, signoff management, and certification tracking.
            </p>
            <Link href="/training/dashboard">
              <Button variant="default" className="bg-amber-600 hover:bg-amber-700">
                Open Full Training Dashboard
              </Button>
            </Link>
          </div>
        )}

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
