'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { clearRun, loadRun, saveRun } from '@/lib/itineraries/runner';

const DEFAULT_SNAPSHOT = '{"currentIndex":0,"completed":[]}';

const subscribers = new Set();

const subscribe = (callback) => {
  subscribers.add(callback);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', callback);
  }
  return () => {
    subscribers.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', callback);
    }
  };
};

const notify = () => {
  subscribers.forEach((callback) => callback());
};

const snapshotCache = new Map();

const readSnapshot = (tourId) => {
  if (!tourId || typeof window === 'undefined') return DEFAULT_SNAPSHOT;

  const stored = loadRun(tourId);
  const serialized = JSON.stringify({
    currentIndex: stored?.currentIndex ?? 0,
    completed: stored?.completed ?? [],
  });

  const cached = snapshotCache.get(tourId);
  if (cached === serialized) return cached;
  snapshotCache.set(tourId, serialized);
  return serialized;
};

const getServerSnapshot = () => DEFAULT_SNAPSHOT;

const clamp = (value, min, max) => {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
};

const uniqueSortedInts = (values) =>
  Array.from(new Set(values.filter((value) => Number.isInteger(value)))).sort((a, b) => a - b);

/**
 * Tracks tour-runner progress in localStorage via `useSyncExternalStore`,
 * so SSR + client first render are consistent without a `useState`/`useEffect`
 * hydration flag.
 */
export default function useTourRun({ tourId, totalStops }) {
  const safeTotal = Number.isInteger(totalStops) && totalStops >= 0 ? totalStops : 0;

  const getSnapshot = useCallback(() => readSnapshot(tourId), [tourId]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const { currentIndex, completed } = useMemo(() => {
    const parsed = JSON.parse(snapshot);
    const storedIndex = Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : 0;
    return {
      currentIndex: clamp(storedIndex, 0, Math.max(safeTotal, 0)),
      completed: Array.isArray(parsed.completed) ? uniqueSortedInts(parsed.completed) : [],
    };
  }, [snapshot, safeTotal]);

  const advance = useCallback(() => {
    if (!tourId) return;
    const nextIndex = clamp(currentIndex + 1, 0, Math.max(safeTotal, 0));
    const nextCompleted = uniqueSortedInts([...completed, currentIndex]);
    saveRun(tourId, { currentIndex: nextIndex, completed: nextCompleted });
    snapshotCache.delete(tourId);
    notify();
  }, [tourId, currentIndex, completed, safeTotal]);

  const reset = useCallback(() => {
    if (!tourId) return;
    clearRun(tourId);
    snapshotCache.delete(tourId);
    notify();
  }, [tourId]);

  const goTo = useCallback(
    (nextIndex) => {
      if (!tourId) return;
      const clamped = clamp(Number(nextIndex) || 0, 0, Math.max(safeTotal - 1, 0));
      if (clamped === currentIndex) return;
      saveRun(tourId, { currentIndex: clamped, completed });
      snapshotCache.delete(tourId);
      notify();
    },
    [tourId, currentIndex, completed, safeTotal]
  );

  const isComplete = safeTotal > 0 && currentIndex >= safeTotal;

  return {
    currentIndex,
    completed,
    advance,
    goTo,
    reset,
    isComplete,
  };
}
