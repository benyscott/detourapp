'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import useGeolocation from '@/hooks/useGeolocation';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';

export default function StopSearch({ itineraryId, onStopAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingId, setIsAddingId] = useState(null);
  const [message, setMessage] = useState(null);
  const searchTimeoutRef = useRef(null);

  useGeolocation(true);
  const { currentLocation } = usePlaceStore();
  const { searchRadius } = useSettingsStore();

  useEffect(() => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 3) {
      return;
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      setIsSearching(true);
      setMessage(null);

      try {
        const params = new URLSearchParams({
          q: query.trim(),
          radius: searchRadius.toString(),
        });

        if (currentLocation) {
          params.set('lat', currentLocation.latitude.toString());
          params.set('lng', currentLocation.longitude.toString());
        }

        const response = await fetch(`/api/places/search?${params.toString()}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Search failed');
        }

        setResults(payload.results ?? []);
      } catch (error) {
        setResults([]);
        setMessage(error.message || 'Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [currentLocation, query, searchRadius]);

  const handleQueryChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);

    if (nextQuery.trim().length < 3) {
      setResults([]);
      setIsSearching(false);
    }
  };

  const handleAddStop = async (place) => {
    setIsAddingId(place.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          place,
          provider: place.provider,
          externalId: place.id,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to add stop');
      }

      onStopAdded(payload.stop);
      setQuery('');
      setResults([]);
      setMessage('Stop added');
    } catch (error) {
      setMessage(error.message || 'Failed to add stop');
    } finally {
      setIsAddingId(null);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border bg-card/80 p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Add stops</h2>
        <p className="text-sm text-muted-foreground">
          Search saved places first, then Google Places results.
        </p>
      </div>

      <Input
        value={query}
        onChange={handleQueryChange}
        placeholder="Search for a place"
        aria-label="Search places to add as stops"
      />

      {(query.trim().length >= 3 || message) && (
        <div className="overflow-hidden rounded-md border bg-popover text-popover-foreground">
          <Command shouldFilter={false}>
            <CommandList className="max-h-72">
              {isSearching && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Searching...
                </div>
              )}

              {!isSearching && (
                <>
                  <CommandEmpty>{message || 'No places found.'}</CommandEmpty>
                  {results.map((place) => (
                    <CommandItem
                      key={`${place.source}-${place.id}`}
                      value={`${place.name} ${place.address ?? ''}`}
                      className="flex items-center justify-between gap-3 py-2"
                      onSelect={() => handleAddStop(place)}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{place.name}</p>
                        {place.address && (
                          <p className="truncate text-xs text-muted-foreground">{place.address}</p>
                        )}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
                        <Plus />
                        {isAddingId === place.id ? 'Adding' : 'Add'}
                      </span>
                    </CommandItem>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </section>
  );
}
