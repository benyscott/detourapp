'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, X } from 'lucide-react';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import useMapViewStore from '@/store/mapViewStore';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { NEARBY_CATEGORIES } from '@/lib/nearbyCategories';

const MIN_QUERY_LENGTH = 2;

// Groups the keystrokes + final details lookup into one billed Google session.
// crypto.randomUUID only exists in secure contexts (HTTPS), hence the fallback.
const newSessionToken = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export default function PlaceSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef(null);
    const searchInputRef = useRef(null);
    const locationRef = useRef(null);
    const hideResultsTimeoutRef = useRef(null);
    const sessionTokenRef = useRef(null);

    const { setDestination, currentLocation } = usePlaceStore();
    const { searchRadius } = useSettingsStore();
    const isSearchOpen = useMapViewStore((s) => s.isSearchOpen);
    const setSearchOpen = useMapViewStore((s) => s.setSearchOpen);
    const setNearbyCategory = useMapViewStore((s) => s.setNearbyCategory);

    useEffect(() => {
        locationRef.current = currentLocation;
    }, [currentLocation]);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus({ preventScroll: true });
        }
    }, [isSearchOpen]);

    useEffect(() => {
        if (!isSearchOpen) {
            sessionTokenRef.current = null;
            setSearchQuery('');
            setResults([]);
            setShowResults(false);
            setIsSearching(false);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        return () => {
            if (hideResultsTimeoutRef.current !== null) {
                window.clearTimeout(hideResultsTimeoutRef.current);
            }
        };
    }, []);

    // Debounced search - only triggered by query change, not location updates
    useEffect(() => {
        if (!isSearchOpen) {
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!searchQuery.trim()) {
            setResults([]);
            setIsSearching(false);
            setShowResults(false);
            return;
        }

        if (searchQuery.trim().length < MIN_QUERY_LENGTH) {
            console.log('[PlaceSearch] Query too short, waiting for more characters...');
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                console.log('[PlaceSearch] Searching for:', searchQuery, 'with radius:', searchRadius);

                if (!sessionTokenRef.current) {
                    sessionTokenRef.current = newSessionToken();
                }

                const params = new URLSearchParams({
                    q: searchQuery,
                    radius: searchRadius.toString(),
                    sessionToken: sessionTokenRef.current,
                });

                const searchLocation = locationRef.current;
                if (searchLocation) {
                    params.append('lat', searchLocation.latitude.toString());
                    params.append('lng', searchLocation.longitude.toString());
                }

                const response = await fetch(`/api/places/autocomplete?${params.toString()}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Search failed');
                }

                const data = await response.json();
                const nextResults = data.results || [];
                console.log(
                    '[PlaceSearch] Found',
                    nextResults.length,
                    'results within',
                    searchRadius / 1000,
                    'km'
                );
                setResults(nextResults);
                setShowResults(true);
            } catch (error) {
                console.error('[PlaceSearch] Search error:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, [searchQuery, searchRadius, isSearchOpen]);

    const handleSelectPlace = async (place) => {
        if (hideResultsTimeoutRef.current !== null) {
            window.clearTimeout(hideResultsTimeoutRef.current);
            hideResultsTimeoutRef.current = null;
        }
        console.log('[PlaceSearch] Place selected:', place.name);

        let { latitude, longitude } = place;

        // Autocomplete predictions have no coordinates: resolve them, closing the billing session
        if (latitude == null || longitude == null) {
            try {
                const params = new URLSearchParams({ placeId: place.id });
                if (sessionTokenRef.current) {
                    params.append('sessionToken', sessionTokenRef.current);
                }
                const response = await fetch(`/api/place-details?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Place details failed');
                }
                const { result } = await response.json();
                latitude = result?.latitude;
                longitude = result?.longitude;
            } catch (error) {
                console.error('[PlaceSearch] Could not resolve place location:', error);
                return;
            } finally {
                sessionTokenRef.current = null;
            }
        }

        if (latitude == null || longitude == null) {
            return;
        }

        setDestination({
            id: place.id,
            latitude,
            longitude,
            name: place.name,
            provider: place.provider,
            category: place.category,
            address: place.place_name ?? null,
        });
        setSearchQuery('');
        setResults([]);
        setShowResults(false);
        setSearchOpen(false);
    };

    const shouldShowPopover = isSearchOpen && showResults && searchQuery.trim().length >= MIN_QUERY_LENGTH;

    const handleSearchFocus = () => {
        if (hideResultsTimeoutRef.current !== null) {
            window.clearTimeout(hideResultsTimeoutRef.current);
            hideResultsTimeoutRef.current = null;
        }
        if (searchQuery.trim().length >= MIN_QUERY_LENGTH) {
            setShowResults(true);
        }
    };

    const handleSearchBlur = () => {
        hideResultsTimeoutRef.current = window.setTimeout(() => {
            setShowResults(false);
            hideResultsTimeoutRef.current = null;
        }, 180);
    };

    if (!isSearchOpen) {
        return null;
    }

    return (
        <div className="flex w-full flex-col gap-2">
            {isSearchOpen && (
                <div className="relative w-full">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (results.length > 0) {
                                handleSelectPlace(results[0]);
                            }
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search here"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={handleSearchFocus}
                                onBlur={handleSearchBlur}
                                className="bg-background/85 backdrop-blur-sm"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon-sm"
                                className="shrink-0 rounded-full"
                                onClick={() => setSearchOpen(false)}
                                aria-label="Close search"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </form>

                    {/* Quick categories: type straight away, or tap one of these */}
                    <div
                        className="-mx-3 mt-2 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        role="list"
                        aria-label="Search nearby by category"
                    >
                        {NEARBY_CATEGORIES.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                role="listitem"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setNearbyCategory(id)}
                                className="glass-surface flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground"
                            >
                                <Icon className="size-4" aria-hidden />
                                {label}
                            </button>
                        ))}
                    </div>
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
        </div>
    );
}
