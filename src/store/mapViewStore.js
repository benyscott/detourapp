import { create } from 'zustand';

const useMapViewStore = create((set) => ({
    mode: 'zen',
    currentZoom: 22,
    deviceHeading: null,
    /** Set after explicit DeviceOrientationEvent.requestPermission outcome; null when none. */
    deviceOrientationIssue: null,
    isSearchOpen: false,
    isCafesOpen: false,
    /** True while an itinerary tour is running on `/?tour=` (BAN-135). */
    tourOpen: false,
    /**
     * When true, map bearing tracks deviceHeading in reveal mode (BAN-141).
     * User rotate gestures flip this false until re-enabled via toggle.
     */
    bearingFollowsHeading: true,
    /** Increment so MapboxMap can ease bearing back to heading after toggling. */
    headingSnapToken: 0,

    setMode: (mode) => set({ mode }),
    setTourOpen: (tourOpen) => set({ tourOpen }),
    setBearingFollowsHeading: (bearingFollowsHeading) => set({ bearingFollowsHeading }),
    pulseHeadingSnap: () => set((state) => ({ headingSnapToken: state.headingSnapToken + 1 })),
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
