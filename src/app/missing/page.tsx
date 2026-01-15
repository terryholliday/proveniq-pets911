'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  ChevronLeft,
  Plus,
  Dog,
  Cat,
  Bird,
  Rabbit
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for missing pets
const MOCK_MISSING_PETS = [
  {
    id: '1',
    name: 'Buddy',
    species: 'DOG',
    breed: 'Golden Retriever',
    color: 'Golden',
    size: 'Large',
    lastSeenDate: '2024-01-03',
    lastSeenLocation: 'Downtown Lewisburg',
    county: 'GREENBRIER',
    description: 'Friendly, wearing blue collar with tags. Responds to name.',
    photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop',
    status: 'ACTIVE',
    daysAgo: 2,
  },
  {
    id: '2',
    name: 'Whiskers',
    species: 'CAT',
    breed: 'Domestic Shorthair',
    color: 'Orange Tabby',
    size: 'Medium',
    lastSeenDate: '2024-01-02',
    lastSeenLocation: 'East End, Charleston',
    county: 'KANAWHA',
    description: 'Indoor cat, very timid. Has microchip.',
    photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop',
    status: 'ACTIVE',
    daysAgo: 3,
  },
  {
    id: '3',
    name: 'Max',
    species: 'DOG',
    breed: 'German Shepherd',
    color: 'Black and Tan',
    size: 'Large',
    lastSeenDate: '2024-01-01',
    lastSeenLocation: 'White Sulphur Springs',
    county: 'GREENBRIER',
    description: 'Neutered male, no collar. Friendly but may be scared.',
    photoUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=300&h=300&fit=crop',
    status: 'ACTIVE',
    daysAgo: 4,
  },
  {
    id: '4',
    name: 'Luna',
    species: 'CAT',
    breed: 'Siamese Mix',
    color: 'Cream with dark points',
    size: 'Small',
    lastSeenDate: '2023-12-30',
    lastSeenLocation: 'South Charleston',
    county: 'KANAWHA',
    description: 'Blue eyes, very vocal. Indoor only.',
    photoUrl: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=300&h=300&fit=crop',
    status: 'ACTIVE',
    daysAgo: 5,
  },
];

type Species = 'ALL' | 'DOG' | 'CAT' | 'OTHER';
type County = 'ALL' | 'GREENBRIER' | 'KANAWHA';

export default function MissingPetsBoard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<Species>('ALL');
  const [countyFilter, setCountyFilter] = useState<County>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const handleOpenMissingPet = useCallback((id: string) => {
    router.push(`/missing/${id}`);
  }, [router]);

  const handleSeenThisPet = useCallback((pet: (typeof MOCK_MISSING_PETS)[number]) => {
    try {
      sessionStorage.setItem(
        'mayday_sighting_prefill',
        JSON.stringify({
          missing_case_id: pet.id,
          species: pet.species,
          description: `Possible sighting of ${pet.name}. Last seen: ${pet.lastSeenLocation}.`,
        })
      );
    } catch {
      // ignore
    }
    router.push(`/sighting/report?missing_case_id=${encodeURIComponent(pet.id)}`);
  }, [router]);

  const handleShare = useCallback(async (pet: (typeof MOCK_MISSING_PETS)[number]) => {
    const title = `Missing Pet: ${pet.name}`;
    const text = `🚨 MISSING PET ALERT 🚨

Have you seen ${pet.name}?
${pet.breed} • ${pet.color} • ${pet.size}
Last seen: ${pet.lastSeenLocation}

${pet.description}

Please share to help reunite ${pet.name} with their family! 🐾`;

    // Try native Web Share API with image first (works on mobile + some desktop)
    if (navigator.share && navigator.canShare) {
      try {
        // Fetch the pet image and convert to file
        const response = await fetch(pet.photoUrl);
        const blob = await response.blob();
        const file = new File([blob], `${pet.name.toLowerCase()}-missing.jpg`, { type: 'image/jpeg' });
        
        const shareData = { title, text, files: [file] };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return; // Success! Exit early
        }
      } catch {
        // Native share failed or cancelled, fall through to manual options
      }
    }

    // Fallback: Copy text to clipboard
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // ignore
    }

    // Show share platform choice
    const choice = window.prompt(
      `Share "${pet.name}" - Alert copied to clipboard!\n\n(Note: Photo sharing requires mobile or saving image separately)\n\n1 = Twitter/X (auto-fills text)\n2 = Facebook (you'll paste)\n3 = Just copy (done)\n\nEnter 1, 2, or 3:`,
      '1'
    );

    if (choice === '1') {
      const tweetText = `🚨 MISSING PET ALERT: ${pet.name}\n${pet.breed} • ${pet.color}\n📍 Last seen: ${pet.lastSeenLocation}\n\nPlease RT to help! 🐾`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank', 'width=600,height=400');
    } else if (choice === '2') {
      window.open('https://www.facebook.com/', '_blank');
      alert('Facebook opened!\n\n1. Click "What\'s on your mind?"\n2. Press Ctrl+V to paste text\n3. Click the photo icon to add the pet image');
    }
  }, []);

  const filteredPets = MOCK_MISSING_PETS.filter(pet => {
    const matchesSearch = searchQuery === '' || 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.lastSeenLocation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecies = speciesFilter === 'ALL' || pet.species === speciesFilter;
    const matchesCounty = countyFilter === 'ALL' || pet.county === countyFilter;
    
    return matchesSearch && matchesSpecies && matchesCounty;
  });

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <Link href="/missing/report">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Report Missing Pet
              </Button>
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">Missing Pets Board</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, breed, location..."
              className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-700 rounded-xl space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Species</label>
                <div className="flex gap-2 flex-wrap">
                  {(['ALL', 'DOG', 'CAT', 'OTHER'] as Species[]).map((species) => (
                    <button
                      key={species}
                      onClick={() => setSpeciesFilter(species)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        speciesFilter === species 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {species === 'ALL' ? 'All' : species.charAt(0) + species.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">County</label>
                <div className="flex gap-2 flex-wrap">
                  {(['ALL', 'GREENBRIER', 'KANAWHA'] as County[]).map((county) => (
                    <button
                      key={county}
                      onClick={() => setCountyFilter(county)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        countyFilter === county 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {county === 'ALL' ? 'All Counties' : county.charAt(0) + county.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Results Count */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <p className="text-slate-400">
          Showing <span className="text-white font-semibold">{filteredPets.length}</span> missing pets
          {countyFilter !== 'ALL' && <span> in {countyFilter.charAt(0) + countyFilter.slice(1).toLowerCase()} County</span>}
        </p>
      </div>
      
      {/* Pet Cards */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid gap-4">
          {filteredPets.map((pet) => (
            <div
              key={pet.id}
              className="block group"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleOpenMissingPet(pet.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenMissingPet(pet.id);
                  }
                }}
                className="bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-2xl p-5 transition-all cursor-pointer"
              >
                <div className="flex gap-5">
                  {/* Photo */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {pet.photoUrl ? (
                      <img 
                        src={pet.photoUrl} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        {pet.species === 'DOG' && <Dog className="w-12 h-12 text-slate-500" />}
                        {pet.species === 'CAT' && <Cat className="w-12 h-12 text-slate-500" />}
                        {pet.species === 'BIRD' && <Bird className="w-12 h-12 text-slate-500" />}
                        {pet.species === 'OTHER' && <Rabbit className="w-12 h-12 text-slate-500" />}
                      </>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white truncate">{pet.name}</h3>
                      <span className="px-2 py-1 bg-amber-600/20 text-amber-400 text-xs font-medium rounded-full flex-shrink-0">
                        {pet.daysAgo} days ago
                      </span>
                    </div>
                    
                    <p className="text-slate-300 mb-2">
                      {pet.breed} • {pet.color} • {pet.size}
                    </p>
                    
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{pet.lastSeenLocation}</span>
                    </div>
                    
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {pet.description}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSeenThisPet(pet);
                    }}
                  >
                    I&apos;ve Seen This Pet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleShare(pet);
                    }}
                  >
                    Share
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredPets.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No pets found</h3>
              <p className="text-slate-400 mb-6">Try adjusting your search or filters</p>
              <Button onClick={() => { setSearchQuery(''); setSpeciesFilter('ALL'); setCountyFilter('ALL'); }}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
