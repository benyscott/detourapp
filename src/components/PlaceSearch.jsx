'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import DestinationBottomPanel from '@/components/DestinationBottomPanel';

export default function PlaceSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef(null);
    const searchInputRef = useRef(null);
    const locationRef = useRef(null);
    const hideResultsTimeoutRef = useRef(null);

    const { destination, setDestination, currentLocation, geolocationError: geoError } = usePlaceStore();
    const { searchRadius } = useSettingsStore();

    useEffect(() => {
        locationRef.current = currentLocation;
    }, [currentLocation]);

    useEffect(() => {
        if (!destination && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [destination]);

    useEffect(() => {
        return () => {
            if (hideResultsTimeoutRef.current !== null) {
                window.clearTimeout(hideResultsTimeoutRef.current);
            }
        };
    }, []);

    // Debounced search - only triggered by query change, not location updates
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!searchQuery.trim()) {
            setResults([]);
            setIsSearching(false);
            setShowResults(false);
            return;
        }

        // Don't search for very short queries — keep panel closed so focus doesn't reserve popper/layout space
        if (searchQuery.trim().length < 3) {
            console.log('[PlaceSearch] Query too short, waiting for more characters...');
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                console.log('[PlaceSearch] Searching for:', searchQuery, 'with radius:', searchRadius);
                
                // Build query params - use current location at time of search
                const params = new URLSearchParams({ 
                    q: searchQuery,
                    radius: searchRadius.toString(),
                });
                
                // Capture current location to avoid using stale value
                const searchLocation = locationRef.current;
                if (searchLocation) {
                    params.append('lat', searchLocation.latitude.toString());
                    params.append('lng', searchLocation.longitude.toString());
                }
                
                const response = await fetch(`/api/places?${params.toString()}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Search failed');
                }

                const data = await response.json();
                const results = data.results || [];
                console.log('[PlaceSearch] Found', results.length, 'results within', searchRadius / 1000, 'km');
                setResults(results);
                setShowResults(true);
            } catch (error) {
                console.error('[PlaceSearch] Search error:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 600); // Increased debounce to 600ms
    }, [searchQuery, searchRadius]);

    const handleSelectPlace = (place) => {
        if (hideResultsTimeoutRef.current !== null) {
            window.clearTimeout(hideResultsTimeoutRef.current);
            hideResultsTimeoutRef.current = null;
        }
        console.log('[PlaceSearch] Place selected:', place.name);
        setDestination({
            id: place.id,
            latitude: place.latitude,
            longitude: place.longitude,
            name: place.name,
            provider: place.provider,
            category: place.category,
            address: place.place_name ?? null,
        });
        setSearchQuery('');
        setResults([]);
        setShowResults(false);
    };

    // Hide search input when destination is selected
    const showSearchInput = !destination;
    const shouldShowPopover = showSearchInput && showResults && searchQuery.trim().length >= 3;

    const handleSearchFocus = () => {
        if (hideResultsTimeoutRef.current !== null) {
            window.clearTimeout(hideResultsTimeoutRef.current);
            hideResultsTimeoutRef.current = null;
        }
        if (searchQuery.trim().length >= 3) {
            setShowResults(true);
        }
    };

    const handleSearchBlur = () => {
        hideResultsTimeoutRef.current = window.setTimeout(() => {
            setShowResults(false);
            hideResultsTimeoutRef.current = null;
        }, 180);
    };

    return (
        <div className="fixed right-0 bottom-0 left-0 z-[100] flex flex-col items-center gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {destination && <DestinationBottomPanel />}
            {showSearchInput && (
                <div className="relative w-full max-w-md">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (results.length > 0) {
                                handleSelectPlace(results[0]);
                            }
                        }}
                    >
                        <Input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Where shall we go?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={handleSearchFocus}
                            onBlur={handleSearchBlur}
                            className="bg-background/85 backdrop-blur-sm"
                        />
                    </form>
                    {shouldShowPopover && (
                        <div
                            role="presentation"
                            className="bg-popover text-popover-foreground absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-md border shadow-md"
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            <Command shouldFilter={false}>
                                <CommandList className="max-h-[min(50vh,300px)]">
                                    {isSearching && (
                                        <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
                                            <Loader2 className="size-4 animate-spin" />
                                            Searching...
                                        </div>
                                    )}
                                    {!isSearching && (
                                        <>
                                            <CommandEmpty>No places found nearby.</CommandEmpty>
                                            {results.map((place) => (
                                                <CommandItem
                                                    key={place.id}
                                                    value={place.name}
                                                    onSelect={() => handleSelectPlace(place)}
                                                    className="h-auto cursor-pointer py-2"
                                                >
                                                    <div className="flex w-full flex-col">
                                                        <span className="font-medium">{place.name}</span>
                                                        {place.place_name !== place.name && (
                                                            <span className="text-muted-foreground text-xs">
                                                                {place.place_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </div>
                    )}
                </div>
            )}

            {geoError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                    {geoError}
                </p>
            )}
        </div>
    );
}
