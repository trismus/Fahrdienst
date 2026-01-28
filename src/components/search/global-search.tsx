'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui';
import { searchPatients } from '@/lib/actions/patients-v2';
import { searchDestinations } from '@/lib/actions/destinations-v2';
import type { Patient, Destination } from '@/types/database';

// =============================================================================
// TYPES
// =============================================================================

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

interface SearchResults {
  patients: Patient[];
  destinations: Destination[];
}

// =============================================================================
// ICONS
// =============================================================================

function PatientIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DestinationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function GlobalSearch({
  placeholder = 'Patienten oder Ziele suchen...',
  className = '',
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ patients: [], destinations: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults({ patients: [], destinations: [] });
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Search both patients and destinations in parallel
      const [patients, destinations] = await Promise.all([
        searchPatients(searchQuery),
        searchDestinations(searchQuery),
      ]);

      setResults({ patients, destinations });
      setIsOpen(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Fehler bei der Suche');
      setResults({ patients: [], destinations: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce effect (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults({ patients: [], destinations: [] });
    setIsOpen(false);
  };

  // Handle result click
  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  const hasResults = results.patients.length > 0 || results.destinations.length > 0;
  const showDropdown = isOpen && (hasResults || isLoading || error);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <Input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (hasResults) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="pl-10 pr-10 w-full"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label="Suche loeschen"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-[400px] overflow-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2" />
              <p className="text-sm">Suche...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-4 text-center text-red-500">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && hasResults && (
            <>
              {/* Patient Results */}
              {results.patients.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      <PatientIcon />
                      <span>Patienten ({results.patients.length})</span>
                    </div>
                  </div>
                  <ul>
                    {results.patients.map((patient) => (
                      <li key={patient.id}>
                        <Link
                          href={`/patients/${patient.id}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {patient.city}
                              {patient.patientNumber && ` - Nr. ${patient.patientNumber}`}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Destination Results */}
              {results.destinations.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      <DestinationIcon />
                      <span>Ziele ({results.destinations.length})</span>
                    </div>
                  </div>
                  <ul>
                    {results.destinations.map((destination) => (
                      <li key={destination.id}>
                        <Link
                          href={`/destinations/${destination.id}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <DestinationIcon />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {destination.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {destination.city}
                              {destination.department && ` - ${destination.department}`}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* No Results */}
          {!isLoading && !error && !hasResults && query.length >= 2 && (
            <div className="p-6 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Keine Ergebnisse fuer &quot;{query}&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
