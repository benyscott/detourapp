import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings store for app configuration
 * Persisted to localStorage
 */
const useSettingsStore = create(
    persist(
        (set, get) => ({
            // State
            searchRadius: 1000, // Default 1 km, in meters (100 m – 5 km)
            // Roulette: last choices, remembered between visits
            rouletteCategory: 'bar',
            rouletteRadius: 500,
            rouletteMinRating: 0,

            // Actions
            setSearchRadius: (radius) => {
                console.log('[Settings] Search radius updated:', radius, 'meters');
                set({ searchRadius: Math.max(100, radius) });
            },

            setRouletteCategory: (rouletteCategory) => set({ rouletteCategory }),
            setRouletteRadius: (rouletteRadius) => set({ rouletteRadius }),
            setRouletteMinRating: (rouletteMinRating) => set({ rouletteMinRating }),

            // Helper to get radius in km
            getRadiusKm: () => {
                return (get().searchRadius / 1000).toFixed(1);
            },
        }),
        {
            name: 'detour-settings', // localStorage key
            version: 3,
            // v2: radius range became 0–5 km with a 1 km default; reset the old 5 km default
            // v3: minimum radius is 100 m
            migrate: (persistedState, version) => {
                if (version < 2) return { ...persistedState, searchRadius: 1000 };
                return { ...persistedState, searchRadius: Math.max(100, persistedState.searchRadius ?? 1000) };
            },
        }
    )
);

export default useSettingsStore;

