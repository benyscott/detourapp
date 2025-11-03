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
            searchRadius: 5000, // Default 5km in meters

            // Actions
            setSearchRadius: (radius) => {
                console.log('[Settings] Search radius updated:', radius, 'meters');
                set({ searchRadius: radius });
            },

            // Helper to get radius in km
            getRadiusKm: () => {
                return (get().searchRadius / 1000).toFixed(1);
            },
        }),
        {
            name: 'detour-settings', // localStorage key
            version: 1,
        }
    )
);

export default useSettingsStore;

