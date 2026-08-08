import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Shared ambient audio preference for quick-filter / swipe "news feed" decks.
 * Once the user unmutes (e.g. Events card corner control), sound stays on
 * across carousel changes and can power future property/moto/yacht/worker decks.
 */
interface DeckAudioState {
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
  toggleSound: () => void;
}

export const useDeckAudioStore = create<DeckAudioState>()(
  persist(
    (set) => ({
      soundOn: false,
      setSoundOn: (on) => set({ soundOn: on }),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
    }),
    {
      name: 'swipess-deck-audio-v1',
      partialize: (s) => ({ soundOn: s.soundOn }),
    },
  ),
);
