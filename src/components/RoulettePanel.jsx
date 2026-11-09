'use client';

import { useEffect, useRef, useState } from 'react';
import { Dices, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatDistance } from '@/lib/geoUtils';
import {
    clampRadius,
    filterByRating,
    formatRadius,
    getRouletteCategory,
    nextWiderRadius,
    pickRandomPlace,
    ROULETTE_CATEGORIES,
    ROULETTE_MIN_RATINGS,
    ROULETTE_RADIUS,
} from '@/lib/roulette';
import useMapViewStore from '@/store/mapViewStore';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import { cn } from '@/lib/utils';

const POOL_TTL_MS = 10 * 60 * 1000;
// Delays between names while the wheel slows down
const SPIN_STEPS_MS = [55, 55, 60, 65, 75, 85, 100, 120, 145, 175, 215, 265, 330];

/**
 * Pools and "already shown" ids survive closing the panel, so re-opening and spinning
 * again doesn't re-query Google or repeat a place. Keyed on a ~100 m location grid.
 */
const poolCache = new Map();
const poolKey = (categoryId, radius, location) =>
    `${categoryId}|${radius}|${location.latitude.toFixed(3)}|${location.longitude.toFixed(3)}`;

async function loadPool(categoryId, radius, location) {
    const key = poolKey(categoryId, radius, location);
    const cached = poolCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < POOL_TTL_MS) {
        return cached;
    }

    const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        radius: radius.toString(),
        category: categoryId,
    });
    const response = await fetch(`/api/roulette?${params.toString()}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || 'Could not load places');
    }

    const entry = { places: payload.results || [], seenIds: [], fetchedAt: Date.now() };
    poolCache.set(key, entry);
    return entry;
}

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function RoulettePanel() {
    const setRouletteOpen = useMapViewStore((s) => s.setRouletteOpen);
    const currentLocation = usePlaceStore((s) => s.currentLocation);
    const geolocationError = usePlaceStore((s) => s.geolocationError);
    const setDestination = usePlaceStore((s) => s.setDestination);
    const {
        rouletteCategory,
        rouletteRadius,
        rouletteMinRating,
        setRouletteCategory,
        setRouletteRadius,
        setRouletteMinRating,
    } = useSettingsStore();

    const category = getRouletteCategory(rouletteCategory);
    const sliderRadius = clampRadius(rouletteRadius);
    const minRating = ROULETTE_MIN_RATINGS.includes(rouletteMinRating) ? rouletteMinRating : 0;
    // Set when "Try 3 km" widens the search past the slider; cleared when the slider/category changes
    const [expandedRadius, setExpandedRadius] = useState(null);
    const radius = expandedRadius ?? sliderRadius;

    // idle | loading | spinning | result | empty | error
    const [phase, setPhase] = useState('idle');
    const [shownName, setShownName] = useState(null);
    const [pick, setPick] = useState(null);
    const [error, setError] = useState(null);
    const timersRef = useRef([]);

    const clearTimers = () => {
        timersRef.current.forEach((id) => window.clearTimeout(id));
        timersRef.current = [];
    };

    useEffect(() => clearTimers, []);

    const resetResult = () => {
        clearTimers();
        setPhase('idle');
        setPick(null);
        setShownName(null);
        setError(null);
    };

    // Changing what/how far keeps the current pick on screen; the next spin uses the new values.
    // Only a stale "nothing found" / error message is cleared.
    const clearStaleMessage = () => {
        if (phase === 'empty' || phase === 'error') resetResult();
    };

    const handleCategory = (id) => {
        if (id === category.id) return;
        setRouletteCategory(id);
        setExpandedRadius(null);
        clearStaleMessage();
    };

    const handleRadius = ([value]) => {
        if (value === radius) return;
        setRouletteRadius(value);
        setExpandedRadius(null);
        clearStaleMessage();
    };

    const handleMinRating = (value) => {
        if (value === minRating) return;
        setRouletteMinRating(value);
        clearStaleMessage();
    };

    const spin = async (radiusOverride) => {
        if (!currentLocation || phase === 'loading' || phase === 'spinning' || (radiusOverride ?? radius) <= 0) return;

        const spinRadius = radiusOverride ?? radius;
        clearTimers();
        setError(null);
        setPick(null);
        setShownName(null);
        setPhase('loading');

        let pool;
        try {
            pool = await loadPool(category.id, spinRadius, currentLocation);
        } catch (err) {
            setError(err.message);
            setPhase('error');
            return;
        }

        const candidates = filterByRating(pool.places, minRating);
        const draw = pickRandomPlace(candidates, pool.seenIds);
        if (!draw) {
            setPhase('empty');
            return;
        }
        pool.seenIds = draw.seenIds;

        const reveal = () => {
            setShownName(draw.pick.name);
            setPick(draw.pick);
            setPhase('result');
        };

        if (candidates.length < 2 || prefersReducedMotion()) {
            reveal();
            return;
        }

        // Slot-machine reveal: cycle through real names from the pool, slowing down
        setPhase('spinning');
        let elapsed = 0;
        let previous = null;
        SPIN_STEPS_MS.forEach((delay) => {
            elapsed += delay;
            timersRef.current.push(
                window.setTimeout(() => {
                    let next;
                    do {
                        next = candidates[Math.floor(Math.random() * candidates.length)].name;
                    } while (next === previous && candidates.length > 1);
                    previous = next;
                    setShownName(next);
                }, elapsed)
            );
        });
        timersRef.current.push(window.setTimeout(reveal, elapsed + 380));
    };

    const handleTryWider = () => {
        const wider = widerRadius;
        if (!wider) return;
        if (wider <= ROULETTE_RADIUS.max) {
            setRouletteRadius(wider);
            setExpandedRadius(null);
        } else {
            setExpandedRadius(wider);
        }
        spin(wider);
    };

    const handleGo = () => {
        if (!pick) return;
        setDestination({
            id: pick.id,
            latitude: pick.latitude,
            longitude: pick.longitude,
            name: pick.name,
            provider: pick.provider ?? 'google',
            category: pick.category,
            address: pick.place_name ?? null,
        });
        setRouletteOpen(false);
    };

    const widerRadius = nextWiderRadius(radius);
    const isBusy = phase === 'loading' || phase === 'spinning';

    return (
        <section className="glass-surface w-full max-w-md rounded-2xl px-4 py-3" aria-label="Roulette">
            <div className="flex items-center justify-between">
                <h3 className="m-0 flex items-center gap-1.5 text-base font-semibold">
                    <Dices className="size-4" aria-hidden />
                    Roulette
                </h3>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={() => setRouletteOpen(false)}
                    aria-label="Close roulette"
                >
                    <X className="size-4" />
                </Button>
            </div>

            <p className="text-muted-foreground m-0 mt-1 text-sm">
                Can&apos;t decide? Let fate pick at random.
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="What are you after?">
                {ROULETTE_CATEGORIES.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={item.id === category.id}
                        disabled={isBusy}
                        onClick={() => handleCategory(item.id)}
                        className={cn(
                            'rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-60',
                            item.id === category.id
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-background/60 text-foreground'
                        )}
                    >
                        <span aria-hidden>{item.emoji}</span> {item.label}
                    </button>
                ))}
            </div>

            <div className="mt-6 mb-5 flex items-center gap-3">
                <Slider
                    aria-label="How far"
                    min={ROULETTE_RADIUS.min}
                    max={ROULETTE_RADIUS.max}
                    step={ROULETTE_RADIUS.step}
                    value={[sliderRadius]}
                    onValueChange={handleRadius}
                    disabled={isBusy}
                    className="flex-1"
                />
                <span className="text-muted-foreground w-14 shrink-0 text-right text-xs tabular-nums">
                    {formatRadius(radius)}
                </span>
            </div>

            <div className="mb-1 flex gap-1.5" role="radiogroup" aria-label="Minimum rating">
                {ROULETTE_MIN_RATINGS.map((value) => (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={value === minRating}
                        disabled={isBusy}
                        onClick={() => handleMinRating(value)}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-1 rounded-full border py-1 text-xs tabular-nums transition-colors disabled:opacity-60',
                            value === minRating
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-background/60 text-foreground'
                        )}
                    >
                        {value === 0 ? (
                            'Any rating'
                        ) : (
                            <>
                                <Star className="size-3 fill-current" aria-hidden />
                                {value}+
                            </>
                        )}
                    </button>
                ))}
            </div>

            <div
                className={cn(
                    'flex flex-col items-center justify-center text-center',
                    (phase !== 'idle' || !currentLocation) && 'mt-3 min-h-[4.5rem]'
                )}
                aria-live="polite"
            >
                {!currentLocation && (
                    <p className="text-muted-foreground m-0 text-sm">
                        {geolocationError ?? 'Waiting for your location…'}
                    </p>
                )}

                {phase === 'loading' && (
                    <p className="m-0 text-2xl">
                        <span className="inline-block animate-spin" aria-hidden>{category.emoji}</span>
                        <span className="sr-only">Spinning…</span>
                    </p>
                )}

                {(phase === 'spinning' || phase === 'result') && shownName && (
                    <>
                        <p
                            className={cn(
                                'm-0 max-w-full truncate font-serif text-xl font-semibold',
                                phase === 'spinning' && 'text-muted-foreground'
                            )}
                        >
                            {shownName}
                        </p>
                        {phase === 'result' && pick && (pick.distance != null || pick.rating != null) && (
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
                        )}
                    </>
                )}

                {phase === 'empty' && (
                    <p className="text-muted-foreground m-0 text-sm">
                        No {category.openNow ? 'open ' : ''}{category.noun}
                        {minRating > 0 ? ` rated ${minRating}+` : ''} within {formatRadius(radius)}.
                    </p>
                )}

                {phase === 'error' && <p className="text-destructive m-0 text-sm">{error}</p>}
            </div>

            <div className="mt-3 flex gap-2">
                {phase === 'result' ? (
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1 rounded-full"
                            onClick={() => spin()}
                            disabled={radius <= 0}
                        >
                            Spin again
                        </Button>
                        <Button type="button" className="flex-1 rounded-full" onClick={handleGo}>
                            Let&apos;s go
                        </Button>
                    </>
                ) : phase === 'empty' && widerRadius ? (
                    <Button type="button" className="flex-1 rounded-full" onClick={handleTryWider} disabled={isBusy}>
                        Try {formatRadius(widerRadius)}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        className="flex-1 rounded-full"
                        disabled={!currentLocation || isBusy || radius <= 0}
                        onClick={() => spin()}
                    >
                        {isBusy ? 'Spinning…' : 'Spin'}
                    </Button>
                )}
            </div>
        </section>
    );
}
