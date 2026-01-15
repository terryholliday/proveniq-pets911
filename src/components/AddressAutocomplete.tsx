'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

// Google Places API types
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  placeholder?: string;
  county?: string;
  className?: string;
}

// Load Google Maps script
function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      resolve();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found, falling back to OpenStreetMap');
      reject(new Error('No API key'));
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onCoordinatesChange,
  placeholder = "Enter address...",
  county,
  className = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        // Create a dummy div for PlacesService (required but not displayed)
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
        setUseGoogleMaps(true);
      })
      .catch(() => {
        setUseGoogleMaps(false);
      });
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search with Google Places
  const searchGooglePlaces = useCallback((query: string) => {
    if (!autocompleteServiceRef.current || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Bias toward West Virginia
    const searchQuery = county 
      ? `${query}, ${county} County, WV`
      : `${query}, WV`;

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: searchQuery,
        componentRestrictions: { country: 'us' },
        types: ['address', 'establishment', 'geocode'],
      },
      (predictions, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, [county]);

  // Fallback to OpenStreetMap
  const searchOpenStreetMap = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchQuery = county 
        ? `${query}, ${county} County, West Virginia, USA`
        : `${query}, West Virginia, USA`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + 
        new URLSearchParams({
          q: searchQuery,
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'us',
        }),
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MaydayPetRescue/1.0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Convert to Google-like format
        const converted = data.map((item: any) => ({
          place_id: item.place_id,
          description: item.display_name,
          structured_formatting: {
            main_text: item.address?.road 
              ? `${item.address.house_number || ''} ${item.address.road}`.trim()
              : item.display_name.split(',')[0],
            secondary_text: [
              item.address?.city || item.address?.town || item.address?.village,
              item.address?.state,
            ].filter(Boolean).join(', '),
          },
          _osmData: item,
        }));
        setSuggestions(converted);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Address lookup failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [county]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (useGoogleMaps && autocompleteServiceRef.current) {
        searchGooglePlaces(value);
      } else {
        searchOpenStreetMap(value);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, useGoogleMaps, searchGooglePlaces, searchOpenStreetMap]);

  const handleSelect = (prediction: PlacePrediction) => {
    // If using Google Maps, get place details for coordinates
    if (useGoogleMaps && placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        { placeId: prediction.place_id, fields: ['formatted_address', 'geometry', 'address_components'] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const formattedAddress = place.formatted_address || prediction.description;
            onChange(formattedAddress);
            
            // Extract coordinates
            if (place.geometry?.location && onCoordinatesChange) {
              onCoordinatesChange(
                place.geometry.location.lat(),
                place.geometry.location.lng()
              );
            }

            // Build address suggestion object
            const addressComponents = place.address_components || [];
            const getComponent = (type: string) => 
              addressComponents.find(c => c.types.includes(type))?.long_name;

            const suggestion: AddressSuggestion = {
              display_name: formattedAddress,
              lat: place.geometry?.location?.lat().toString() || '',
              lon: place.geometry?.location?.lng().toString() || '',
              place_id: prediction.place_id,
              address: {
                house_number: getComponent('street_number'),
                road: getComponent('route'),
                city: getComponent('locality'),
                county: getComponent('administrative_area_level_2'),
                state: getComponent('administrative_area_level_1'),
                postcode: getComponent('postal_code'),
              },
            };

            onSelect?.(suggestion);
          } else {
            onChange(prediction.description);
          }
          setShowSuggestions(false);
        }
      );
    } else {
      // OpenStreetMap fallback
      const osmData = (prediction as any)._osmData;
      if (osmData) {
        const addr = osmData.address;
        let formattedAddress = '';
        
        if (addr) {
          const parts = [];
          if (addr.house_number && addr.road) {
            parts.push(`${addr.house_number} ${addr.road}`);
          } else if (addr.road) {
            parts.push(addr.road);
          }
          const city = addr.city || addr.town || addr.village;
          if (city) parts.push(city);
          if (addr.state) parts.push(addr.state);
          if (addr.postcode) parts.push(addr.postcode);
          formattedAddress = parts.join(', ');
        }
        
        onChange(formattedAddress || prediction.description);
        
        if (osmData.lat && osmData.lon && onCoordinatesChange) {
          onCoordinatesChange(parseFloat(osmData.lat), parseFloat(osmData.lon));
        }
        
        onSelect?.({
          display_name: formattedAddress || prediction.description,
          lat: osmData.lat,
          lon: osmData.lon,
          address: osmData.address,
        });
      } else {
        onChange(prediction.description);
      }
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-10 py-3 ${className}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 animate-spin" />
        )}
        {!isLoading && value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((prediction, index) => (
            <button
              key={prediction.place_id || index}
              type="button"
              onClick={() => handleSelect(prediction)}
              className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-colors ${
                index === selectedIndex 
                  ? 'bg-amber-700/30' 
                  : 'hover:bg-zinc-700/50'
              }`}
            >
              <MapPin className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate text-white">
                  {prediction.structured_formatting?.main_text || prediction.description.split(',')[0]}
                </div>
                {prediction.structured_formatting?.secondary_text && (
                  <div className="text-xs text-zinc-400 truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                )}
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-xs text-zinc-500 border-t border-zinc-700 bg-zinc-900/50">
            {useGoogleMaps ? 'Powered by Google Maps' : 'Powered by OpenStreetMap'}
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
