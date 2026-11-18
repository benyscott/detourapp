/**
 * Where you've opened Detour, by day, kept on this device (no accounts yet).
 * Drives the arrival welcome (BAN-162).
 *
 * Shape: { [placeId]: { name, days: ['YYYY-MM-DD', …], visitStart: 'YYYY-MM-DD' | null,
 *                       guideOpenedFor: 'YYYY-MM-DD' | null } }
 */

const STORAGE_KEY = 'detour-visit-history';
const KEEP_DAYS = 90;
/** A place is "new" if you haven't opened the app there in this many days */
const NEW_AFTER_DAYS = 30;
/** Home needs at least this many distinct days, so a first day somewhere isn't "home" */
const HOME_MIN_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar day, YYYY-MM-DD */
export const localDay = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / DAY_MS);

export function loadVisitHistory() {
    if (typeof window === 'undefined') return {};
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function saveVisitHistory(history) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
        // storage unavailable: history lives in memory for this session
    }
}

/** The place opened on the most distinct days (at least HOME_MIN_DAYS), or null */
export function homePlaceId(history) {
    let best = null;
    let bestDays = HOME_MIN_DAYS - 1;
    Object.entries(history).forEach(([id, entry]) => {
        if ((entry.days?.length ?? 0) > bestDays) {
            best = id;
            bestDays = entry.days.length;
        }
    });
    return best;
}

/**
 * Record that the app is open in `place` today. Starts a new "visit" when you hadn't been
 * there in the previous NEW_AFTER_DAYS days. Returns the updated history.
 */
export function recordVisit(place, history = loadVisitHistory(), today = localDay()) {
    if (!place?.id) return history;

    const entry = history[place.id] ?? { name: place.name, days: [], visitStart: null, guideOpenedFor: null };
    const previousDays = entry.days.filter((day) => day !== today);
    const lastSeen = previousDays[previousDays.length - 1];
    const isNewVisit = !entry.days.includes(today) && (!lastSeen || daysBetween(lastSeen, today) > NEW_AFTER_DAYS);

    const next = {
        ...history,
        [place.id]: {
            ...entry,
            name: place.name,
            days: entry.days.includes(today) ? entry.days : [...entry.days, today],
            visitStart: isNewVisit ? today : entry.visitStart,
        },
    };

    // Forget days older than KEEP_DAYS
    Object.values(next).forEach((item) => {
        item.days = item.days.filter((day) => daysBetween(day, today) <= KEEP_DAYS);
    });

    saveVisitHistory(next);
    return next;
}

/** Remember that the guide was opened during the current visit, which ends the welcome */
export function markGuideOpened(placeId, history = loadVisitHistory()) {
    const entry = history[placeId];
    if (!entry) return history;
    const next = { ...history, [placeId]: { ...entry, guideOpenedFor: entry.visitStart } };
    saveVisitHistory(next);
    return next;
}

/**
 * Welcome shows on the first day of a visit to a place that isn't home, until the guide is
 * opened. `isAway` (any non-home place) keeps the guide reachable from the search chips.
 */
export function welcomeState(placeId, history, today = localDay()) {
    const entry = history[placeId];
    if (!entry) return { isAway: false, showWelcome: false };
    const isAway = homePlaceId(history) !== placeId;
    const showWelcome =
        isAway && entry.visitStart === today && entry.guideOpenedFor !== entry.visitStart;
    return { isAway, showWelcome };
}
