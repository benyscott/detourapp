import { create } from 'zustand';

const useMapViewStore = create((set) => ({
    mode: 'zen',
    setMode: (mode) => set({ mode }),
    toggleMode: () => set((state) => ({ mode: state.mode === 'zen' ? 'reveal' : 'zen' })),
}));

export default useMapViewStore;

