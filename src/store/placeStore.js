import { create } from 'zustand';
import { loadRecentPlaces, rememberPlace } from '@/lib/recentPlaces';

const usePlaceStore = create((set) => ({
    // State
    currentLocation: null, // { latitude, longitude }
    destination: null, // { id, latitude, longitude, name, provider, category, address }
    recommendations: [], // [{ id, latitude, longitude, ... }]
    distance: null, // string (formatted distance)
    angle: null, // number (bearing in degrees)
    /** Synced from useGeolocation when tracking so overlays can show errors without a second watch */
    geolocationError: null,
    /** Incremented to restart watchPosition after errors or a user-gesture getCurrentPosition */
    geolocationRetryKey: 0,

    // Actions
    setCurrentLocation: (location) => {
        console.log('[Store] Current location updated', location);
        set({ currentLocation: location });
    },

    /** Last places picked as a destination, newest first (shown when search opens) */
    recentPlaces: loadRecentPlaces(),

    /**
     * Every way of picking a destination goes through here, so this is where recents are
     * recorded. Pass { remember: false } for destinations that aren't a choice (tour stops).
     */
    setDestination: (destination, { remember = true } = {}) => {
        console.log('[Store] Destination set', destination);
        set((state) => ({
            destination,
            recentPlaces:
                remember && destination ? rememberPlace(destination, state.recentPlaces) : state.recentPlaces,
        }));
    },

    setRecommendations: (recommendations) => {
        set({ recommendations });
    },

    clearRecommendations: () => {
        set({ recommendations: [] });
    },

    clearDestination: () => {
        console.log('[Store] Destination cleared');
        set({
            destination: null,
            recommendations: [],
            distance: null,
            angle: null,
        });
    },

    setDistance: (distance) => set({ distance }),

    setAngle: (angle) => set({ angle }),

    setGeolocationError: (geolocationError) => set({ geolocationError }),

    bumpGeolocationRetry: () =>
        set((state) => ({ geolocationRetryKey: state.geolocationRetryKey + 1 })),
}));

export default usePlaceStore;
