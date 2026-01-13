'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, AlertCircle, CheckCircle, MapPin, Clock, 
  ChevronRight, X, Loader2, Dog, Cat, Rabbit
} from 'lucide-react';

interface LostPetMatch {
  id: string;
  case_number: string;
  species: string;
  breed?: string;
  color?: string;
  name?: string;
  description?: string;
  county: string;
  last_seen_date: string;
  photo_url?: string;
  match_score: number; // 0-100
  distance_miles?: number;
  owner_contact?: string;
}

interface FoundPetMatcherProps {
  species: string;
  county: string;
  color?: string;
  description?: string;
  photoUrl?: string;
  onMatchSelected?: (match: LostPetMatch) => void;
  onNoMatch?: () => void;
  onSkip?: () => void;
}

const SPECIES_ICONS: Record<string, React.ReactNode> = {
  DOG: <Dog className="w-5 h-5" />,
  CAT: <Cat className="w-5 h-5" />,
  RABBIT: <Rabbit className="w-5 h-5" />,
};

export function FoundPetMatcher({
  species,
  county,
  color,
  description,
  photoUrl,
  onMatchSelected,
  onNoMatch,
  onSkip,
}: FoundPetMatcherProps) {
  const [matches, setMatches] = useState<LostPetMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<LostPetMatch | null>(null);

  useEffect(() => {
    searchForMatches();
  }, [species, county, color]);

  const searchForMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        species,
        county,
        ...(color && { color }),
        ...(description && { description }),
        status: 'lost',
        limit: '10',
      });

      const response = await fetch(`/api/pets/search-matches?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      } else {
        // Fallback: show demo data for development
        setMatches(generateDemoMatches(species, county));
      }
    } catch (err) {
      console.error('Match search error:', err);
      // Fallback: show demo data
      setMatches(generateDemoMatches(species, county));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (match: LostPetMatch) => {
    setSelectedMatch(match);
  };

  const handleConfirmMatch = () => {
    if (selectedMatch && onMatchSelected) {
      onMatchSelected(selectedMatch);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
          <p className="text-zinc-400">Searching for potential matches...</p>
          <p className="text-xs text-zinc-500 mt-2">Checking lost pet reports in {county} County</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedMatch) {
    return (
      <Card className="bg-zinc-900 border-amber-500/50">
        <CardHeader className="border-b border-zinc-800">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Confirm Match
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMatch(null)}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            {selectedMatch.photo_url && (
              <img 
                src={selectedMatch.photo_url} 
                alt="Lost pet" 
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg">
                {selectedMatch.name || `${selectedMatch.species} - ${selectedMatch.case_number}`}
              </h3>
              <p className="text-zinc-400 text-sm">{selectedMatch.description}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                <MapPin className="w-3 h-3" />
                <span>{selectedMatch.county} County</span>
                <Clock className="w-3 h-3 ml-2" />
                <span>Lost {formatDate(selectedMatch.last_seen_date)}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-400 mb-2">What happens next?</h4>
            <ul className="text-sm text-zinc-300 space-y-1">
              <li>• The owner will be notified immediately</li>
              <li>• A moderator will verify the match</li>
              <li>• You'll receive instructions for safe handoff</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setSelectedMatch(null)}
              className="flex-1"
            >
              Back to Results
            </Button>
            <Button 
              onClick={handleConfirmMatch}
              className="flex-1 bg-green-600 hover:bg-green-500"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              This is the Pet!
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="border-b border-zinc-800">
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-amber-500" />
          Is This Someone's Lost Pet?
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <h3 className="font-semibold mb-2">No Matches Found</h3>
            <p className="text-sm text-zinc-400 mb-6">
              We couldn't find any lost {species.toLowerCase()} reports matching this area.
              This may be an unreported stray.
            </p>
            <Button onClick={onNoMatch} className="bg-amber-600 hover:bg-amber-500">
              Continue With Report
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <p className="text-sm text-amber-200">
                <strong>Found {matches.length} potential match{matches.length > 1 ? 'es' : ''}!</strong> 
                {' '}Check if any of these lost pets look like the one you found.
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => handleSelectMatch(match)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800/50 cursor-pointer transition-all"
                >
                  {match.photo_url ? (
                    <img 
                      src={match.photo_url} 
                      alt="Lost pet" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center">
                      {SPECIES_ICONS[match.species] || <Dog className="w-6 h-6 text-zinc-600" />}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {match.name || `${match.breed || match.species}`}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          match.match_score >= 80 ? 'border-green-500 text-green-400' :
                          match.match_score >= 50 ? 'border-amber-500 text-amber-400' :
                          'border-zinc-600 text-zinc-400'
                        }`}
                      >
                        {match.match_score}% match
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{match.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {match.county}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(match.last_seen_date)}
                      </span>
                      {match.distance_miles && (
                        <span>{match.distance_miles} mi away</span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-zinc-600" />
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 flex gap-3">
              <Button 
                variant="outline" 
                onClick={onSkip}
                className="flex-1"
              >
                Skip - None of These
              </Button>
              <Button 
                onClick={onNoMatch}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600"
              >
                Continue as New Report
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Demo data generator for development
function generateDemoMatches(species: string, county: string): LostPetMatch[] {
  const demoMatches: LostPetMatch[] = [
    {
      id: 'demo-1',
      case_number: 'PM-2026-0142',
      species: species,
      breed: species === 'DOG' ? 'Golden Retriever Mix' : 'Tabby',
      color: 'Golden/Tan',
      name: species === 'DOG' ? 'Buddy' : 'Whiskers',
      description: `${species === 'DOG' ? 'Friendly golden dog' : 'Orange tabby cat'}, medium size, wearing blue collar`,
      county: county,
      last_seen_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      photo_url: species === 'DOG' 
        ? 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop'
        : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
      match_score: 85,
      distance_miles: 2.3,
    },
    {
      id: 'demo-2',
      case_number: 'PM-2026-0138',
      species: species,
      breed: species === 'DOG' ? 'Lab Mix' : 'Domestic Shorthair',
      color: 'Black',
      name: undefined,
      description: `Black ${species.toLowerCase()}, no collar, shy behavior`,
      county: county,
      last_seen_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      photo_url: undefined,
      match_score: 62,
      distance_miles: 4.8,
    },
  ];

  return demoMatches;
}

export default FoundPetMatcher;
