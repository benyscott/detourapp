export const ARRIVAL_THRESHOLD_M = 20;
export const RUN_STORAGE_PREFIX = 'detour:tour-run:';

const storageKey = (tourId) => `${RUN_STORAGE_PREFIX}${tourId}`;

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function loadRun(tourId) {
  if (!tourId || !isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(tourId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const currentIndex = Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : 0;
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter((value) => Number.isInteger(value))
      : [];
    const updatedAt = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null;

    return { currentIndex, completed, updatedAt };
  } catch {
    return null;
  }
}

export function saveRun(tourId, state) {
  if (!tourId || !isBrowser()) {
    return;
  }

  try {
    const payload = {
      currentIndex: Number.isInteger(state?.currentIndex) ? state.currentIndex : 0,
      completed: Array.isArray(state?.completed) ? state.completed : [],
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(storageKey(tourId), JSON.stringify(payload));
  } catch {
    // Storage may be full or unavailable; silently ignore.
  }
}

export function clearRun(tourId) {
  if (!tourId || !isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey(tourId));
  } catch {
    // ignore
  }
}
