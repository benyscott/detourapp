'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Dices, MapPin, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useRandomPick from '@/hooks/useRandomPick';
import { formatDistance, formatMeters } from '@/lib/geoUtils';
import { resolveGeolocationErrorMessage } from '@/lib/geolocationMessages';
import { getNearbyCategory } from '@/lib/nearbyCategories';
import { isOpenAt } from '@/lib/openingHours';
import { filterByRating, ROULETTE_MIN_RATINGS } from '@/lib/roulette';
import { cn } from '@/lib/utils';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import useMapViewStore from '@/store/mapViewStore';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Next 7 days as select options: Today, Tomorrow, then weekday names */
const dayOptions = () => {
    const today = new Date().getDay();
    return Array.from({ length: 7 }, (_, offset) => {
        const day = (today + offset) % 7;
        return { day, label: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : WEEKDAYS[day] };
    });
};

const nextFullHour = () => `${String((new Date().getHours() + 1) % 24).padStart(2, '0')}:00`;

/** Small pill-shaped native select: discreet, and iOS shows its own wheel picker */
function PillSelect({ value, onChange, children, label, className }) {
    return (
        <label className={cn('relative inline-flex items-center', className)}>
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="border-border bg-background/70 text-foreground h-7 appearance-none rounded-full border py-0 pl-3 pr-7 text-xs"
            >
                {children}
            </select>
            <ChevronDown className="text-muted-foreground pointer-events-none absolute right-2 size-3.5" aria-hidden />
        </label>
    );
}

/**
 * Places of one category around you, opened from a chip under the search bar.
 * One request per open (20 closest, with hours + rating); the filters and the random pick
 * work on that list without searching again.
 */
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

    // Filters. Parks rarely have hours in Google, so they default to "any time".
    const [timeMode, setTimeMode] = useState(() => (category?.openNow === false ? 'any' : 'now')); // now | any | at
    const [atDay, setAtDay] = useState(() => new Date().getDay());
    const [atTime, setAtTime] = useState(nextFullHour);
    const [minRating, setMinRating] = useState(0);

    const randomPick = useRandomPick();

    useEffect(() => () => clearRecommendations(), [clearRecommendations]);

    // Search once per category / radius, from where you are when it opens.
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
                });
                const response = await fetch(`/api/places/nearby?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Could not load places nearby');
                }
                const list = (await response.json()).results || [];
                if (!cancelled) setResults(list);
            } catch (err) {
                if (!cancelled) {
                    setResults([]);
                    setError(err instanceof Error ? err.message : 'Could not load places');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [category, hasLocation, searchRadius]);

    const filtered = useMemo(() => {
        let list = results;
        if (timeMode === 'now') {
            list = list.filter((place) => place.openNow === true);
        } else if (timeMode === 'at') {
            const [hours, mins] = atTime.split(':').map(Number);
            list = list.filter((place) => isOpenAt(place.periods, Number(atDay), hours * 60 + mins) === true);
        }
        return filterByRating(list, minRating);
    }, [results, timeMode, atDay, atTime, minRating]);

    // Map markers follow the filtered list
    useEffect(() => {
        setRecommendations(filtered);
    }, [filtered, setRecommendations]);

    const changeFilter = (setter) => (value) => {
        setter(value);
        randomPick.reset();
    };

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
    const isSpinning = randomPick.phase === 'spinning';
    const pick = randomPick.pick;

    return (
        <section className="glass-surface w-full max-w-md rounded-2xl px-4 py-3" aria-label={`${category.label} nearby`}>
            <div className="flex items-center justify-between">
                <h3 className="m-0 flex items-center gap-1.5 text-base font-semibold">
                    <Icon className="size-4" aria-hidden />
                    {category.label}
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

            {/* Discreet filters */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <PillSelect label="Opening time" value={timeMode} onChange={changeFilter(setTimeMode)}>
                    <option value="now">Open now</option>
                    <option value="at">Open at…</option>
                    <option value="any">Any time</option>
                </PillSelect>
                {timeMode === 'at' && (
                    <>
                        <PillSelect label="Day" value={String(atDay)} onChange={changeFilter((v) => setAtDay(Number(v)))}>
                            {dayOptions().map(({ day, label }) => (
                                <option key={day} value={day}>{label}</option>
                            ))}
                        </PillSelect>
                        <label className="relative inline-flex items-center">
                            <span className="sr-only">Time</span>
                            <input
                                type="time"
                                value={atTime}
                                onChange={(e) => changeFilter(setAtTime)(e.target.value || atTime)}
                                className="border-border bg-background/70 text-foreground h-7 rounded-full border px-3 text-xs tabular-nums"
                            />
                        </label>
                    </>
                )}
                <PillSelect label="Minimum rating" value={String(minRating)} onChange={changeFilter((v) => setMinRating(Number(v)))}>
                    {ROULETTE_MIN_RATINGS.map((value) => (
                        <option key={value} value={value}>{value === 0 ? 'Any rating' : `★ ${value}+`}</option>
                    ))}
                </PillSelect>
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

            {/* Random pick reveal */}
            {randomPick.phase !== 'idle' && randomPick.shownName && (
                <div className="border-border/60 mt-3 flex flex-col items-center rounded-xl border px-3 py-3 text-center" aria-live="polite">
                    <p className={cn('m-0 max-w-full truncate font-serif text-xl font-semibold', isSpinning && 'text-muted-foreground')}>
                        {randomPick.shownName}
                    </p>
                    {pick && (
                        <>
                            <p className="text-muted-foreground m-0 mt-1 flex items-center justify-center gap-1 text-xs tabular-nums">
                                {pick.rating != null && (
                                    <>
                                        <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                                        {pick.rating.toFixed(1)}
                                        {pick.distance != null && ' · '}
                                    </>
                                )}
                                {pick.distance != null && formatDistance(pick.distance)}
                            </p>
                            <div className="mt-3 flex w-full gap-2">
                                <Button type="button" variant="secondary" className="flex-1 rounded-full" onClick={() => randomPick.spin(filtered)}>
                                    Again
                                </Button>
                                <Button type="button" className="flex-1 rounded-full" onClick={() => handleSelectPlace(pick)}>
                                    Let&apos;s go
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {hasLocation && isLoading && results.length === 0 && (
                <p className="text-muted-foreground m-0 py-6 text-center text-sm">Looking around…</p>
            )}
            {hasLocation && error && !isLoading && (
                <p className="text-destructive m-0 py-4 text-center text-sm">{error}</p>
            )}
            {hasLocation && !isLoading && !error && filtered.length === 0 && (
                <p className="text-muted-foreground m-0 py-6 text-center text-sm">
                    {results.length === 0
                        ? `No ${noun} within ${formatMeters(searchRadius)}.`
                        : `None of the ${results.length} closest ${noun} match these filters.`}
                </p>
            )}

            {filtered.length > 0 && (
                <ul className="m-0 mt-1 max-h-[38vh] list-none divide-y divide-border/60 overflow-y-auto overscroll-contain p-0 [-webkit-overflow-scrolling:touch]">
                    {filtered.map((place) => (
                        <li key={place.id}>
                            <button
                                type="button"
                                onClick={() => handleSelectPlace(place)}
                                className="flex w-full items-center gap-3 py-2.5 text-left"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">{place.name}</span>
                                    {place.place_name && (
                                        <span className="text-muted-foreground block truncate text-xs">{place.place_name}</span>
                                    )}
                                </span>
                                <span className="text-muted-foreground flex shrink-0 flex-col items-end text-xs tabular-nums">
                                    {place.distance != null && <span>{formatMeters(place.distance)}</span>}
                                    {place.rating != null && (
                                        <span className="flex items-center gap-0.5">
                                            <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                                            {place.rating.toFixed(1)}
                                        </span>
                                    )}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {filtered.length > 0 && randomPick.phase === 'idle' && (
                <Button
                    type="button"
                    className="mt-3 w-full gap-1.5 rounded-full"
                    onClick={() => randomPick.spin(filtered)}
                >
                    <Dices className="size-4" aria-hidden />
                    Pick at random
                </Button>
            )}
        </section>
    );
}
