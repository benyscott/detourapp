import { create } from 'zustand';

const usePlaceStore = create((set) => ({
    // State
    currentLocation: null, // { latitude, longitude }
    destination: null, // { latitude, longitude, name }
    distance: null, // string (formatted distance)
    angle: null, // number (bearing in degrees)

    // Actions
    setCurrentLocation: (location) => set({ currentLocation: location }),

    setDestination: (destination) => set({ destination }),

    clearDestination: () => set({
        destination: null,
        distance: null,
        angle: null
    }),

    setDistance: (distance) => set({ distance }),

    setAngle: (angle) => set({ angle }),
}));

export default usePlaceStore;

