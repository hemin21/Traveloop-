"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Map as MapIcon, MapPin, Star, Loader2, X } from 'lucide-react';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<{ trips: any[], cities: any[], activities: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(path);
  };

  return (
    <div className="relative flex-1 max-w-xl px-4 mx-auto lg:mx-8" ref={dropdownRef}>
      <div 
        className="relative flex items-center w-full h-10 px-4 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
      >
        <Search className="text-gray-500" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length > 0) setIsOpen(true);
          }}
          onFocus={() => { if (query.length > 0) setIsOpen(true); }}
          placeholder="Search your trips, cities, activities..."
          className="w-full h-full pl-3 text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-500"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults(null); setIsOpen(false); }}
            className="p-1 ml-2 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (query.length >= 2) && (
        <div className="absolute left-0 right-0 z-50 w-full mt-2 mx-4 overflow-hidden bg-white border border-gray-100 rounded-xl shadow-xl top-full" style={{ width: 'calc(100% - 32px)' }}>
          {isLoading && !results ? (
            <div className="flex items-center justify-center p-6 text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : results && (results.trips.length > 0 || results.cities.length > 0 || results.activities.length > 0) ? (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.trips.length > 0 && (
                <div className="mb-4 last:mb-0">
                  <div className="px-3 pb-1 mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase border-b border-gray-100">Your Trips</div>
                  {results.trips.map(trip => (
                    <button
                      key={trip._id}
                      onClick={() => handleSelect(`/trips/${trip._id}`)}
                      className="flex items-center w-full gap-3 px-3 py-2 text-left transition-colors rounded-lg hover:bg-teal-50 group"
                    >
                      <div className="p-2 bg-gray-100 rounded-md group-hover:bg-teal-100 group-hover:text-teal-600">
                        <MapIcon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{trip.title}</div>
                        <div className="text-xs text-gray-500">{trip.destination}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.cities.length > 0 && (
                <div className="mb-4 last:mb-0">
                  <div className="px-3 pb-1 mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase border-b border-gray-100">Cities</div>
                  {results.cities.map(city => (
                    <button
                      key={city._id}
                      onClick={() => handleSelect(`/search/cities?q=${encodeURIComponent(city.name)}`)}
                      className="flex items-center w-full gap-3 px-3 py-2 text-left transition-colors rounded-lg hover:bg-amber-50 group"
                    >
                      <div className="p-2 bg-gray-100 rounded-md group-hover:bg-amber-100 group-hover:text-amber-600">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{city.name}</div>
                        <div className="text-xs text-gray-500">{city.country}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.activities.length > 0 && (
                <div className="mb-4 last:mb-0">
                  <div className="px-3 pb-1 mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase border-b border-gray-100">Activities</div>
                  {results.activities.map(activity => (
                    <button
                      key={activity._id}
                      onClick={() => handleSelect(`/search/activities?q=${encodeURIComponent(activity.name)}`)}
                      className="flex items-center w-full gap-3 px-3 py-2 text-left transition-colors rounded-lg hover:bg-indigo-50 group"
                    >
                      <div className="p-2 bg-gray-100 rounded-md group-hover:bg-indigo-100 group-hover:text-indigo-600">
                        <Star size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                        <div className="text-xs text-gray-500">{activity.city} • {activity.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : results ? (
            <div className="p-6 text-sm text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
