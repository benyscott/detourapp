/**
 * Roulette (BAN-157): pick a random place of a category within a radius.
 * Shared by the API route (server) and the panel (client).
 */

// `type` is a Google Places (legacy) place type. `openNow: false` for places that
// usually have no opening hours in Google (Google drops those when filtering on open-now).
export const ROULETTE_CATEGORIES = [
    { id: 'bar', label: 'Bar', emoji: '🍻', type: 'bar', openNow: true, noun: 'bars' },
    { id: 'coffee', label: 'Coffee', emoji: '☕️', type: 'cafe', openNow: true, noun: 'cafés' },
    { id: 'restaurant', label: 'Food', emoji: '🍽️', type: 'restaurant', openNow: true, noun: 'restaurants' },
    { id: 'bakery', label: 'Bakery', emoji: '🥐', type: 'bakery', openNow: true, noun: 'bakeries' },
    { id: 'museum', label: 'Museum', emoji: '🏛️', type: 'museum', openNow: true, noun: 'museums' },
    { id: 'park', label: 'Park', emoji: '🌳', type: 'park', openNow: false, noun: 'parks' },
];

// Slider range for "how far", in metres. When nothing turns up, the panel can widen the
// search past the slider, up to `expandMax`.
export const ROULETTE_RADIUS = { min: 100, max: 1500, step: 5, default: 500, expandMax: 5000 };

export const clampRadius = (meters, max = ROULETTE_RADIUS.max) => {
    const value = Number(meters);
    if (!Number.isFinite(value)) return ROULETTE_RADIUS.default;
    const stepped = Math.round(value / ROULETTE_RADIUS.step) * ROULETTE_RADIUS.step;
    return Math.min(max, Math.max(ROULETTE_RADIUS.min, stepped));
};

/** Next radius to offer when nothing was found: double inside the slider, then 2, 3, 5 km. */
export function nextWiderRadius(meters) {
    if (meters < ROULETTE_RADIUS.max) {
        return clampRadius(Math.max(meters * 2, meters + 50));
    }
    return [2000, 3000, ROULETTE_RADIUS.expandMax].find((value) => value > meters) ?? null;
}

// Minimum Google rating. 0 = any (also keeps places with no rating yet).
export const ROULETTE_MIN_RATINGS = [0, 3.5, 4, 4.5];

export const filterByRating = (places, minRating) =>
    minRating > 0 ? places.filter((place) => (place.rating ?? 0) >= minRating) : places;

export const getRouletteCategory = (id) =>
    ROULETTE_CATEGORIES.find((category) => category.id === id) ?? ROULETTE_CATEGORIES[0];

export const formatRadius = (meters) =>
    meters >= 2000 ? `${(meters / 1000).toFixed(1).replace(/\.0$/, '')} km` : `${meters} m`;

/**
 * Uniform random pick, skipping places already shown this round.
 * Once every place has been shown, the round restarts (but never repeats the last pick).
 * @returns {{ pick: object, seenIds: string[] } | null}
 */
export function pickRandomPlace(pool, seenIds = []) {
    if (!pool?.length) return null;

    const seen = new Set(seenIds);
    let candidates = pool.filter((place) => !seen.has(place.id));
    let nextSeen = seenIds;

    if (candidates.length === 0) {
        const lastId = seenIds[seenIds.length - 1];
        candidates = pool.length > 1 ? pool.filter((place) => place.id !== lastId) : pool;
        nextSeen = [];
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    return { pick, seenIds: [...nextSeen, pick.id] };
}
