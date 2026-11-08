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
            searchRadius: 1000, // Default 1 km, in meters (0–5 km)
            // Roulette: last choices, remembered between visits
            rouletteCategory: 'bar',
            rouletteRadius: 500,

            // Actions
            setSearchRadius: (radius) => {
                console.log('[Settings] Search radius updated:', radius, 'meters');
                set({ searchRadius: radius });
            },

            setRouletteCategory: (rouletteCategory) => set({ rouletteCategory }),
            setRouletteRadius: (rouletteRadius) => set({ rouletteRadius }),

            // Helper to get radius in km
            getRadiusKm: () => {
                return (get().searchRadius / 1000).toFixed(1);
            },
        }),
        {
            name: 'detour-settings', // localStorage key
            version: 2,
            // v2: radius range became 0–5 km with a 1 km default; reset the old 5 km default
            migrate: (persistedState, version) =>
                version < 2 ? { ...persistedState, searchRadius: 1000 } : persistedState,
        }
    )
);

export default useSettingsStore;

