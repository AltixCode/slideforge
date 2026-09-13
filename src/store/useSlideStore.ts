import { create } from 'zustand';
import { DEFAULT_THEME, THEMES, type CarouselTheme } from '../presets/themes';
import { splitIntoSlides, type Slide } from '../engine/slideSplitter';

/** Slides a free user can export before the paywall. */
export const FREE_SLIDE_LIMIT = 5;

interface SlideState {
  source: string;
  slides: Slide[];
  theme: CarouselTheme;
  isPro: boolean;
  /** Slides the split dropped because the input exceeded the deck ceiling. */
  truncated: boolean;

  setSource: (text: string) => void;
  setTheme: (id: string) => void;
  setIsPro: (pro: boolean) => void;
  reset: () => void;
  /** Slides the current entitlement actually allows exporting. */
  exportableSlides: () => Slide[];
}

export const useSlideStore = create<SlideState>((set, get) => ({
  source: '',
  slides: [],
  theme: DEFAULT_THEME,
  isPro: false,
  truncated: false,

  setSource: (text) => {
    const slides = splitIntoSlides(text);
    // splitIntoSlides caps the deck; compare against an uncapped split so the
    // UI can say that input was dropped rather than silently shipping fewer
    // cards than the user pasted.
    const uncapped = splitIntoSlides(text, { maxSlides: Number.MAX_SAFE_INTEGER });
    set({ source: text, slides, truncated: uncapped.length > slides.length });
  },

  setTheme: (id) => set({ theme: THEMES.find((t) => t.id === id) ?? DEFAULT_THEME }),
  setIsPro: (pro) => set({ isPro: pro }),
  reset: () => set({ source: '', slides: [], truncated: false }),

  exportableSlides: () => {
    const { slides, isPro } = get();
    return isPro ? slides : slides.slice(0, FREE_SLIDE_LIMIT);
  },
}));
