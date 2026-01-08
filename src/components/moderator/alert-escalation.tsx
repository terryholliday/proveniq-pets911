'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Bell, 
  MapPin, 
  Users, 
  Smartphone, 
  Mail, 
  Building2,
  Truck,
  Monitor,
  Camera,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

interface AlertTier {
  tier: string;
  name: string;
  radius: string;
  channels: string[];
  ttl: string;
  status: 'active' | 'pending' | 'completed';
  progress: number;
}

interface AlertEscalationProps {
  caseId: string;
  caseType: 'missing' | 'found';
  createdAt: string;
  lastLocation?: string;
  species: string;
}

export function AlertEscalation({ caseId, caseType, createdAt, lastLocation, species }: AlertEscalationProps) {
  const [currentTier, setCurrentTier] = useState(1);
  const [tiers, setTiers] = useState<AlertTier[]>([]);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  useEffect(() => {
    // Calculate initial tier based on time since creation
    const timeSinceCreation = Date.now() - new Date(createdAt).getTime();
    const hoursSinceCreation = timeSinceCreation / (1000 * 60 * 60);
    
    let initialTier = 1;
    if (hoursSinceCreation > 48) initialTier = 4;
    else if (hoursSinceCreation > 24) initialTier = 3;
    else if (hoursSinceCreation > 6) initialTier = 2;
    
    setCurrentTier(initialTier);
    
    // Generate tier data
    const tierData: AlertTier[] = [
      {
        tier: 'T1',
        name: 'Local Alert',
        radius: '2-5 miles',
        channels: ['Mobile Push', 'Shelter Console', 'Email'],
        ttl: '2-6 hours',
        status: hoursSinceCreation > 6 ? 'completed' : 'active',
        progress: Math.min(100, (hoursSinceCreation / 6) * 100)
      },
      {
        tier: 'T2',
        name: 'Expanded Alert',
        radius: '5-10 miles',
        channels: ['Mobile Push', 'Shelter Console', 'SMS (optional)', 'Email'],
        ttl: '4-12 hours',
        status: hoursSinceCreation > 24 ? 'completed' : hoursSinceCreation > 6 ? 'active' : 'pending',
        progress: Math.max(0, Math.min(100, ((hoursSinceCreation - 6) / 18) * 100))
      },
      {
        tier: 'T3',
        name: 'Responder Network',
        radius: 'Route-based',
        channels: ['Delivery Network', 'Municipal Workers', 'Animal Control'],
        ttl: '2-8 hours',
        status: hoursSinceCreation > 48 ? 'completed' : hoursSinceCreation > 24 ? 'active' : 'pending',
        progress: Math.max(0, Math.min(100, ((hoursSinceCreation - 24) / 24) * 100))
      },
      {
        tier: 'T4',
        name: 'Public Display',
        radius: 'Regional Corridors',
        channels: ['Gas Stations', 'Community Kiosks', 'Digital Billboards'],
        ttl: '2-12 hours',
        status: hoursSinceCreation > 48 ? 'active' : 'pending',
        progress: Math.max(0, Math.min(100, ((hoursSinceCreation - 48) / 24) * 100))
      }
    ];
    
    setTiers(tierData);
    
    // Calculate time until next escalation
    const nextThreshold = initialTier === 1 ? 6 : initialTier === 2 ? 24 : initialTier === 3 ? 48 : 72;
    const hoursUntilNext = Math.max(0, nextThreshold - hoursSinceCreation);
    
    if (hoursUntilNext > 0) {
      const hours = Math.floor(hoursUntilNext);
      const minutes = Math.floor((hoursUntilNext - hours) * 60);
      setTimeUntilNext(`${hours}h ${minutes}m`);
    } else {
      setTimeUntilNext('Escalated');
    }
  }, [createdAt]);

  const channelIcons: Record<string, React.ReactNode> = {
    'Mobile Push': <Smartphone className="h-4 w-4" />,
    'Shelter Console': <Building2 className="h-4 w-4" />,
    'Email': <Mail className="h-4 w-4" />,
    'SMS': <Smartphone className="h-4 w-4" />,
    'Delivery Network': <Truck className="h-4 w-4" />,
    'Municipal Workers': <Users className="h-4 w-4" />,
    'Animal Control': <Users className="h-4 w-4" />,
    'Gas Stations': <Monitor className="h-4 w-4" />,
    'Community Kiosks': <Monitor className="h-4 w-4" />,
    'Digital Billboards': <Monitor className="h-4 w-4" />
  };

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              Current Alert Tier: <strong>T{currentTier}</strong> - {tiers[currentTier - 1]?.name}
            </span>
            <span className="text-sm">
              Next escalation in: <strong>{timeUntilNext}</strong>
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Alert Tiers */}
      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <Card 
            key={tier.tier} 
            className={tier.status === 'active' ? 'border-blue-200 bg-blue-50' : 
                     tier.status === 'completed' ? 'border-green-200 bg-green-50' : ''}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tier.status === 'active' ? 'bg-blue-100 text-blue-600' :
                    tier.status === 'completed' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {tier.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> :
                     tier.status === 'active' ? <AlertTriangle className="h-5 w-5" /> :
                     <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold">{tier.tier}: {tier.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {tier.radius}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tier.ttl}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant={tier.status === 'active' ? 'default' : 
                                  tier.status === 'completed' ? 'success' : 'secondary'}>
                  {tier.status}
                </Badge>
              </div>

              {/* Progress Bar */}
              {tier.status !== 'pending' && (
                <div className="mb-3">
                  <Progress value={tier.progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {tier.status === 'completed' ? 'Completed' : `${Math.round(tier.progress)}% complete`}
                  </p>
                </div>
              )}

              {/* Channels */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Alert Channels:</p>
                <div className="flex flex-wrap gap-2">
                  {tier.channels.map((channel) => (
                    <div 
                      key={channel}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        tier.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        tier.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {channelIcons[channel]}
                      {channel}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Case ID:</span>
              <p className="font-medium">{caseId}</p>
            </div>
            <div>
              <span className="text-gray-600">Species:</span>
              <p className="font-medium">{species}</p>
            </div>
            <div>
              <span className="text-gray-600">Last Location:</span>
              <p className="font-medium">{lastLocation || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600">Alert Type:</span>
              <p className="font-medium">{caseType === 'missing' ? 'Missing Pet' : 'Found Animal'}</p>
            </div>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Alerts are automatically escalated based on time since report and evidence strength. 
              Higher tiers require additional verification and have stricter rate limits to prevent spam.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
