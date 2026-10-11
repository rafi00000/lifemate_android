import { create } from 'zustand';
import { CORE_FEATURES } from './content';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpotlightState {
  /** Tab bar position in window coordinates, reported by the tab bar itself. */
  tabBar: Rect | null;
  /** Index into CORE_FEATURES while the spotlight tour runs, otherwise null. */
  step: number | null;
  setTabBar: (rect: Rect) => void;
  start: () => void;
  next: () => void;
  back: () => void;
  stop: () => void;
}

/** Drives the "Show me around" tour that highlights each tab in turn. */
export const useSpotlight = create<SpotlightState>()((set, get) => ({
  tabBar: null,
  step: null,
  setTabBar: (tabBar) => set({ tabBar }),
  start: () => set({ step: 0 }),
  next: () => {
    const { step } = get();
    if (step === null) return;
    set({ step: step + 1 < CORE_FEATURES.length ? step + 1 : null });
  },
  back: () => {
    const { step } = get();
    if (step !== null && step > 0) set({ step: step - 1 });
  },
  stop: () => set({ step: null }),
}));
