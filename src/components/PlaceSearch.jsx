'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import useMapViewStore from '@/store/mapViewStore';
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

    // Rendered inside the bottom action bar: the bar itself becomes the search field.
    // Results (while typing) or the category chips float just above the bar.
    return (
        <>
            <div
                className="absolute inset-x-0 bottom-full mb-2"
                onMouseDown={(e) => e.preventDefault()}
            >
                {shouldShowPopover ? (
                    <div role="presentation" className="glass-surface overflow-hidden rounded-2xl">
                        <Command shouldFilter={false} className="bg-transparent">
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
                                                className="h-auto cursor-pointer px-3 py-2"
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
                ) : (
                    /* Quick categories: type straight away, or tap one of these.
                       Vertical padding leaves room for the chip shadows: a horizontal scroller
                       clips anything outside its box, which drew a grey band under the chips. */
                    <div
                        className="-my-2 flex gap-2 overflow-x-auto px-0.5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        role="list"
                        aria-label="Search nearby by category"
                    >
                        {NEARBY_CATEGORIES.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                role="listitem"
                                onClick={() => setNearbyCategory(id)}
                                className="bg-card text-foreground flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium shadow-sm"
                            >
                                <Icon className="size-4" aria-hidden />
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <form
                className="min-w-0 flex-1"
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
                    enterKeyHint="search"
                    placeholder="Search here"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="h-11 border-0 bg-transparent px-2 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                />
            </form>
        </>
    );
}
