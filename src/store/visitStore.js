import { create } from 'zustand';
import { loadVisitHistory, markGuideOpened, recordVisit, welcomeState } from '@/lib/visitHistory';

/**
 * The town/city you're in and whether to welcome you to it (BAN-162).
 * currentPlace: { id, name, wikidataId, region, country, countryCode }
 */
const useVisitStore = create((set, get) => ({
    currentPlace: null,
    /** In a place that isn't home: the guide is reachable from the search chips */
    isAway: false,
    /** First day of a visit, guide not opened yet: welcome title + Discover panel */
    showWelcome: false,

    arriveAt: (place) => {
        const history = recordVisit(place, loadVisitHistory());
        set({ currentPlace: place, ...welcomeState(place.id, history) });
    },

    guideOpened: () => {
        const place = get().currentPlace;
        if (!place) return;
        const history = markGuideOpened(place.id, loadVisitHistory());
        set(welcomeState(place.id, history));
    },
}));

export default useVisitStore;
