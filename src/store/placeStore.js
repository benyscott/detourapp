import { create } from 'zustand';

const usePlaceStore = create((set) => ({
    // State
    currentLocation: null, // { latitude, longitude }
    destination: null, // { id, latitude, longitude, name }
    distance: null, // string (formatted distance)
    angle: null, // number (bearing in degrees)

    // Actions
    setCurrentLocation: (location) => {
        console.log('[Store] Current location updated', location);
        set({ currentLocation: location });
    },

    setDestination: (destination) => {
        console.log('[Store] Destination set', destination);
        set({ destination });
    },

    clearDestination: () => {
        console.log('[Store] Destination cleared');
        set({
            destination: null,
            distance: null,
            angle: null,
        });
    },

    setDistance: (distance) => set({ distance }),

    setAngle: (angle) => set({ angle }),
}));

export default usePlaceStore;
