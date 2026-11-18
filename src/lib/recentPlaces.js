/**
 * Recent destinations, kept on this device (no accounts yet). Newest first, deduped by id.
 * localStorage can be missing or throw (private mode, blocked storage): every access is guarded.
 */

const STORAGE_KEY = 'detour-recent-places';
const MAX_STORED = 20;

export function loadRecentPlaces() {
    if (typeof window === 'undefined') return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/** Puts `place` at the top (moving it if already there) and returns the new list. */
export function rememberPlace(place, current = loadRecentPlaces()) {
    if (!place?.id || place.latitude == null || place.longitude == null) return current;

    const entry = {
        id: place.id,
        name: place.name,
        address: place.address ?? null,
        latitude: place.latitude,
        longitude: place.longitude,
        provider: place.provider ?? null,
        category: place.category ?? null,
        selectedAt: Date.now(),
    };
    const next = [entry, ...current.filter((item) => item.id !== place.id)].slice(0, MAX_STORED);

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // storage unavailable: keep the in-memory list for this session
    }
    return next;
}
