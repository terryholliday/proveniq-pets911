'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
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
  placeholder?: string;
  county?: string; // Bias results to this county
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter address...",
  county,
  className = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Build search query - bias toward West Virginia
        const searchQuery = county 
          ? `${value}, ${county} County, West Virginia, USA`
          : `${value}, West Virginia, USA`;
        
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
          const data: AddressSuggestion[] = await response.json();
          // Filter to WV results if possible
          const wvResults = data.filter(s => 
            s.display_name.toLowerCase().includes('west virginia') ||
            s.address?.state?.toLowerCase() === 'west virginia'
          );
          setSuggestions(wvResults.length > 0 ? wvResults : data.slice(0, 3));
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Address lookup failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, county]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    // Format a cleaner address
    const addr = suggestion.address;
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
    
    onChange(formattedAddress || suggestion.display_name.split(',').slice(0, 3).join(','));
    setShowSuggestions(false);
    onSelect?.(suggestion);
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
          {suggestions.map((suggestion, index) => {
            const addr = suggestion.address;
            const mainText = addr?.road 
              ? `${addr.house_number || ''} ${addr.road}`.trim()
              : suggestion.display_name.split(',')[0];
            const subText = [
              addr?.city || addr?.town || addr?.village,
              addr?.county,
              addr?.postcode
            ].filter(Boolean).join(', ');

            return (
              <button
                key={index}
                onClick={() => handleSelect(suggestion)}
                className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-colors ${
                  index === selectedIndex 
                    ? 'bg-amber-700/30' 
                    : 'hover:bg-zinc-700/50'
                }`}
              >
                <MapPin className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{mainText}</div>
                  {subText && (
                    <div className="text-xs text-zinc-400 truncate">{subText}</div>
                  )}
                </div>
              </button>
            );
          })}
          <div className="px-4 py-2 text-xs text-zinc-500 border-t border-zinc-700 bg-zinc-900/50">
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
