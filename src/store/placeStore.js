import { create } from 'zustand';

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

    setDestination: (destination) => {
        console.log('[Store] Destination set', destination);
        set({ destination });
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
