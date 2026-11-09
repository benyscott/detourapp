import { create } from 'zustand';

const useMapViewStore = create((set) => ({
    mode: 'zen',
    currentZoom: 22,
    deviceHeading: null,
    /** Set after explicit DeviceOrientationEvent.requestPermission outcome; null when none. */
    deviceOrientationIssue: null,
    isSearchOpen: false,
    /** Category chip tapped under the search bar ('coffee', 'restaurant', …); null when closed */
    nearbyCategory: null,
    isRouletteOpen: false,
    isSettingsOpen: false,
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
            nearbyCategory: isSearchOpen ? null : state.nearbyCategory,
            isRouletteOpen: isSearchOpen ? false : state.isRouletteOpen,
        })),
    toggleSearchOpen: () =>
        set((state) => ({
            isSearchOpen: !state.isSearchOpen,
            nearbyCategory: null,
            isRouletteOpen: false,
        })),

    /** Open the nearby list for a category (closes search), or pass null to close it */
    setNearbyCategory: (nearbyCategory) =>
        set((state) => ({
            nearbyCategory,
            isSearchOpen: nearbyCategory ? false : state.isSearchOpen,
            isRouletteOpen: nearbyCategory ? false : state.isRouletteOpen,
        })),

    setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),

    setRouletteOpen: (isRouletteOpen) =>
        set((state) => ({
            isRouletteOpen,
            isSearchOpen: isRouletteOpen ? false : state.isSearchOpen,
            nearbyCategory: isRouletteOpen ? null : state.nearbyCategory,
        })),
    toggleRouletteOpen: () =>
        set((state) => ({
            isRouletteOpen: !state.isRouletteOpen,
            isSearchOpen: false,
            nearbyCategory: null,
        })),
}));

export default useMapViewStore;
