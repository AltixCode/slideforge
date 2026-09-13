/**
 * The free limit is the paywall, so it is pinned here rather than left to a
 * screen to enforce. A store that hands back every slide regardless of
 * entitlement gives Pro away, and one that silently drops cards the user pasted
 * looks like a bug.
 */
import { useSlideStore, FREE_SLIDE_LIMIT } from '../../store/useSlideStore';

const reset = () => useSlideStore.setState({ source: '', slides: [], isPro: false, truncated: false });

describe('useSlideStore', () => {
  beforeEach(reset);

  it('limits a free user to the free slide count', () => {
    useSlideStore.getState().setSource('# A\n\n# B\n\n# C\n\n# D\n\n# E\n\n# F\n\n# G');
    expect(useSlideStore.getState().slides.length).toBeGreaterThan(FREE_SLIDE_LIMIT);
    expect(useSlideStore.getState().exportableSlides()).toHaveLength(FREE_SLIDE_LIMIT);
  });

  it('gives a Pro user every slide', () => {
    useSlideStore.getState().setSource('# A\n\n# B\n\n# C\n\n# D\n\n# E\n\n# F\n\n# G');
    useSlideStore.getState().setIsPro(true);
    const { slides, exportableSlides } = useSlideStore.getState();
    expect(exportableSlides()).toHaveLength(slides.length);
  });

  it('flags input that exceeded the deck ceiling', () => {
    useSlideStore.getState().setSource('# H\n\n'.repeat(40));
    expect(useSlideStore.getState().truncated).toBe(true);
  });

  it('does not flag truncation for input that fits', () => {
    useSlideStore.getState().setSource('# One\n\nbody');
    expect(useSlideStore.getState().truncated).toBe(false);
  });
});
