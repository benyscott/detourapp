'use client';

import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMeters } from '@/lib/geoUtils';
import { resolveGeolocationErrorMessage } from '@/lib/geolocationMessages';
import { getNearbyCategory } from '@/lib/nearbyCategories';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import useMapViewStore from '@/store/mapViewStore';

/** Places of one category around you, opened from a chip under the search bar. */
export default function NearbyPlacesPanel() {
    const nearbyCategory = useMapViewStore((s) => s.nearbyCategory);
    const setNearbyCategory = useMapViewStore((s) => s.setNearbyCategory);
    const category = getNearbyCategory(nearbyCategory);

    const hasLocation = usePlaceStore((s) => Boolean(s.currentLocation));
    const geolocationError = usePlaceStore((s) => s.geolocationError);
    const setDestination = usePlaceStore((s) => s.setDestination);
    const setRecommendations = usePlaceStore((s) => s.setRecommendations);
    const clearRecommendations = usePlaceStore((s) => s.clearRecommendations);
    const { searchRadius } = useSettingsStore();

    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRequestingLocation, setIsRequestingLocation] = useState(false);

    // Map markers belong to this list: clear them when the panel goes away
    useEffect(() => () => clearRecommendations(), [clearRecommendations]);

    // Search once per category / radius, from where you are when it opens. GPS updates while
    // the list is open don't refetch (that made the list reload every second).
    useEffect(() => {
        if (!category || !hasLocation) {
            return undefined;
        }

        let cancelled = false;
        const load = async () => {
            const { latitude, longitude } = usePlaceStore.getState().currentLocation;
            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    lat: latitude.toString(),
                    lng: longitude.toString(),
                    radius: searchRadius.toString(),
                    type: category.type,
                    openNow: String(category.openNow),
                });
                const response = await fetch(`/api/nearby?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Could not load places nearby');
                }
                const list = (await response.json()).results || [];
                if (!cancelled) {
                    setResults(list);
                    setRecommendations(list);
                }
            } catch (err) {
                if (!cancelled) {
                    setResults([]);
                    setError(err instanceof Error ? err.message : 'Could not load places');
                    clearRecommendations();
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [category, hasLocation, searchRadius, setRecommendations, clearRecommendations]);

    const handleRequestLocation = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            usePlaceStore.getState().setGeolocationError('Geolocation is not supported by this browser.');
            return;
        }

        setIsRequestingLocation(true);
        const { setCurrentLocation, setGeolocationError, bumpGeolocationRetry } = usePlaceStore.getState();
        setGeolocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setGeolocationError(null);
                bumpGeolocationRetry();
                setIsRequestingLocation(false);
            },
            () => {
                setGeolocationError(resolveGeolocationErrorMessage());
                bumpGeolocationRetry();
                setIsRequestingLocation(false);
            },
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    };

    const handleSelectPlace = (place) => {
        setDestination({
            id: place.id,
            latitude: place.latitude,
            longitude: place.longitude,
            name: place.name,
            provider: place.provider ?? 'google',
            category: place.category,
            address: place.place_name ?? null,
        });
        setNearbyCategory(null);
    };

    if (!category) {
        return null;
    }

    const Icon = category.icon;
    const noun = category.label.toLowerCase();

    return (
        <section className="glass-surface w-full max-w-md rounded-2xl px-4 py-3" aria-label={`${category.label} nearby`}>
            <div className="flex items-center justify-between">
                <h3 className="m-0 flex items-center gap-1.5 text-base font-semibold">
                    <Icon className="size-4" aria-hidden />
                    {category.label}
                    {category.openNow ? <span className="text-muted-foreground font-sans text-xs font-normal">· open now</span> : null}
                </h3>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={() => setNearbyCategory(null)}
                    aria-label={`Close ${noun} list`}
                >
                    <X className="size-4" />
                </Button>
            </div>

            {!hasLocation && (
                <div className="flex flex-col items-center gap-3 py-4">
                    <p className="text-muted-foreground m-0 text-center text-sm">
                        {geolocationError ?? 'Waiting for your location…'}
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-1.5 rounded-full"
                        disabled={isRequestingLocation || (typeof navigator !== 'undefined' && !navigator.geolocation)}
                        onClick={handleRequestLocation}
                    >
                        <MapPin className="size-4" aria-hidden />
                        {isRequestingLocation ? 'Requesting…' : 'Use my location'}
                    </Button>
                </div>
            )}

            {hasLocation && isLoading && results.length === 0 && (
                <p className="text-muted-foreground m-0 py-6 text-center text-sm">Looking around…</p>
            )}
            {hasLocation && error && !isLoading && (
                <p className="text-destructive m-0 py-4 text-center text-sm">{error}</p>
            )}
            {hasLocation && !isLoading && !error && results.length === 0 && (
                <p className="text-muted-foreground m-0 py-6 text-center text-sm">
                    No {category.openNow ? 'open ' : ''}{noun} within {formatMeters(searchRadius)}.
                </p>
            )}

            {results.length > 0 && (
                <ul className="m-0 mt-1 max-h-[45vh] list-none divide-y divide-border/60 overflow-y-auto overscroll-contain p-0 [-webkit-overflow-scrolling:touch]">
                    {results.map((place) => (
                        <li key={place.id}>
                            <button
                                type="button"
                                onClick={() => handleSelectPlace(place)}
                                className="flex w-full items-center gap-3 py-2.5 text-left"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">{place.name}</span>
                                    {place.place_name && place.place_name !== place.name && (
                                        <span className="text-muted-foreground block truncate text-xs">{place.place_name}</span>
                                    )}
                                </span>
                                {place.distance != null && (
                                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                                        {formatMeters(place.distance)}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
