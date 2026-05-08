import { create } from 'zustand';

const useMapViewStore = create((set) => ({
    mode: 'zen',
    currentZoom: 22,
    deviceHeading: null,
    setMode: (mode) => set({ mode }),
    setCurrentZoom: (currentZoom) => set({ currentZoom }),
    setDeviceHeading: (deviceHeading) => set({ deviceHeading }),
    toggleMode: () => set((state) => ({ mode: state.mode === 'zen' ? 'reveal' : 'zen' })),
}));

export default useMapViewStore;

