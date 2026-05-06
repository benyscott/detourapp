'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Square } from 'lucide-react';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import useGeolocation from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';

export default function PlaceSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef(null);
    const searchInputRef = useRef(null);
    const locationRef = useRef(null);

    const { destination, setDestination, clearDestination, currentLocation } = usePlaceStore();
    const { searchRadius } = useSettingsStore();
    const [isTracking, setIsTracking] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(true); // Track location for search filtering
    const { error: geoError } = useGeolocation(isTracking || isSearchMode);

    useEffect(() => {
        locationRef.current = currentLocation;
    }, [currentLocation]);

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

        // Don't search for very short queries
        if (searchQuery.trim().length < 3) {
            console.log('[PlaceSearch] Query too short, waiting for more characters...');
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
        console.log('[PlaceSearch] Place selected:', place.name);
        setDestination({
            latitude: place.latitude,
            longitude: place.longitude,
            name: place.name,
        });
        setSearchQuery('');
        setResults([]);
        setShowResults(false);
        setIsSearchMode(false); // Stop location tracking for search when destination is selected
    };

    const handleStartWay = () => {
        if (!destination) return;
        console.log('[PlaceSearch] Starting navigation to:', destination.name);
        setIsTracking(true);
    };

    const handleStopWay = () => {
        console.log('[PlaceSearch] Stopping navigation');
        setIsTracking(false);
        clearDestination();
        setSearchQuery('');
        setIsSearchMode(true); // Resume location tracking for search
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // Hide search input when destination is selected
    const showSearchInput = !destination;
    const showStartButton = destination && !isTracking;
    const showStopButton = destination && isTracking;
    const shouldShowPopover = showSearchInput && showResults && searchQuery.trim().length >= 3;

    return (
        <div className="fixed right-0 bottom-0 left-0 z-[100] flex flex-col items-center gap-3 p-4">
            {showSearchInput && (
                <Popover open={shouldShowPopover} onOpenChange={setShowResults}>
                    <form
                        className="w-full max-w-md"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (results.length > 0) {
                                handleSelectPlace(results[0]);
                            }
                        }}
                    >
                        <PopoverAnchor asChild>
                            <Input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Where shall we go?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowResults(true)}
                                className="bg-background/85 backdrop-blur-sm"
                            />
                        </PopoverAnchor>
                    </form>
                    <PopoverContent
                        align="center"
                        side="top"
                        sideOffset={8}
                        className="z-[1050] w-[var(--radix-popover-trigger-width)] p-0"
                    >
                        <Command shouldFilter={false}>
                            <CommandList>
                                {isSearching && (
                                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
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
                                                        <span className="text-xs text-muted-foreground">
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
                    </PopoverContent>
                </Popover>
            )}

            {showStartButton && (
                <Button onClick={handleStartWay} size="lg">
                    Start route
                </Button>
            )}

            {showStopButton && (
                <Button onClick={handleStopWay} size="icon-lg" variant="destructive" aria-label="Stop navigation">
                    <Square className="size-4 fill-current" />
                </Button>
            )}

            {geoError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                    {geoError}
                </p>
            )}
        </div>
    );
}
