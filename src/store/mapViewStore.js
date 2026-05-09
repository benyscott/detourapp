import { create } from 'zustand';

const useMapViewStore = create((set) => ({
    mode: 'zen',
    currentZoom: 22,
    deviceHeading: null,
    /** Set after explicit DeviceOrientationEvent.requestPermission outcome; null when none. */
    deviceOrientationIssue: null,
    isSearchOpen: false,
    isCafesOpen: false,

    setMode: (mode) => set({ mode }),
    setCurrentZoom: (currentZoom) => set({ currentZoom }),
    setDeviceHeading: (deviceHeading) => set({ deviceHeading }),
    setDeviceOrientationIssue: (deviceOrientationIssue) => set({ deviceOrientationIssue }),
    clearDeviceOrientationIssue: () => set({ deviceOrientationIssue: null }),
    toggleMode: () => set((state) => ({ mode: state.mode === 'zen' ? 'reveal' : 'zen' })),

    setSearchOpen: (isSearchOpen) =>
        set((state) => ({
            isSearchOpen,
            isCafesOpen: isSearchOpen ? false : state.isCafesOpen,
        })),
    toggleSearchOpen: () =>
        set((state) => ({
            isSearchOpen: !state.isSearchOpen,
            isCafesOpen: false,
        })),

    setCafesOpen: (isCafesOpen) =>
        set((state) => ({
            isCafesOpen,
            isSearchOpen: isCafesOpen ? false : state.isSearchOpen,
        })),
    toggleCafesOpen: () =>
        set((state) => ({
            isCafesOpen: !state.isCafesOpen,
            isSearchOpen: false,
        })),
}));

export default useMapViewStore;
