'use client';

import { useState } from 'react';
import { useSelectedCounty, useCountyPack } from '@/lib/hooks/use-county-pack';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import type { County } from '@/lib/types';

const COUNTIES: { id: County; name: string; description: string }[] = [
  { 
    id: 'GREENBRIER', 
    name: 'Greenbrier County',
    description: 'Lewisburg, White Sulphur Springs, and surrounding areas'
  },
  { 
    id: 'KANAWHA', 
    name: 'Kanawha County',
    description: 'Charleston and surrounding areas'
  },
];

interface CountySelectorProps {
  onSelect?: (county: County) => void;
  showCacheStatus?: boolean;
}

/**
 * County selector with cache management
 * Per CANONICAL_LAW.md: Current Counties: Greenbrier, Kanawha
 */
export function CountySelector({ onSelect, showCacheStatus = true }: CountySelectorProps) {
  const [selectedCounty, setSelectedCounty] = useSelectedCounty();
  const { pack, isLoading, isStale, error, refresh } = useCountyPack(selectedCounty);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSelect = (county: County) => {
    setSelectedCounty(county);
    onSelect?.(county);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Your County
        </CardTitle>
        <CardDescription>
          Choose your county to access local emergency contacts and resources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {COUNTIES.map((county) => (
            <button
              key={county.id}
              onClick={() => handleSelect(county.id)}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                ${selectedCounty === county.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{county.name}</p>
                  <p className="text-sm text-gray-500">{county.description}</p>
                </div>
                {selectedCounty === county.id && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </button>
          ))}
        </div>

        {showCacheStatus && selectedCounty && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Cache Status:</span>
                {isLoading ? (
                  <Badge variant="secondary">Loading...</Badge>
                ) : error ? (
                  <Badge variant="destructive">Error</Badge>
                ) : isStale ? (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Stale
                  </Badge>
                ) : pack ? (
                  <Badge variant="success">v{pack.version} Cached</Badge>
                ) : (
                  <Badge variant="secondary">Not Cached</Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            {pack && (
              <p className="text-xs text-gray-400 mt-2">
                Last updated: {new Date(pack.cached_at).toLocaleString()}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-500 mt-2">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact county selector for headers
 */
export function CountySelectorCompact({ onSelect }: { onSelect?: (county: County) => void }) {
  const [selectedCounty, setSelectedCounty] = useSelectedCounty();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const county = e.target.value as County;
    setSelectedCounty(county);
    onSelect?.(county);
  };

  const selectedName = COUNTIES.find(c => c.id === selectedCounty)?.name || 'Select County';

  return (
    <div className="relative">
      <select
        value={selectedCounty || ''}
        onChange={handleChange}
        className="appearance-none pl-3 pr-8 py-2 rounded-full text-sm font-medium bg-white/90 text-gray-700 border-0 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <option value="" disabled>Select County</option>
        {COUNTIES.map((county) => (
          <option key={county.id} value={county.id}>
            {county.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
