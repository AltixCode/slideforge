/**
 * The splitter is what turns a paste into a carousel, so its rules are pinned
 * here. Every failure mode below produces a plausible-looking deck that reads
 * wrong, which is exactly the kind of thing a screenshot review misses.
 */
import { splitIntoSlides, splitSentences } from '../slideSplitter';

describe('splitSentences', () => {
  it('keeps the terminator with its sentence', () => {
    expect(splitSentences('One. Two! Three?')).toEqual(['One.', 'Two!', 'Three?']);
  });

  it('does not break on abbreviations', () => {
    // A naive split on "." starts a new sentence after "e.g." and the next
    // slide opens mid-thought.
    expect(splitSentences('Use a tripod, e.g. a cheap one. It helps.'))
      .toEqual(['Use a tripod, e.g. a cheap one.', 'It helps.']);
  });

  it('handles text with no terminator at all', () => {
    expect(splitSentences('no full stop here')).toEqual(['no full stop here']);
  });
});

describe('splitIntoSlides', () => {
  it('starts a new slide at a markdown heading', () => {
    const slides = splitIntoSlides('# First\nbody one\n\n# Second\nbody two');
    expect(slides).toHaveLength(2);
    expect(slides[0].title).toBe('First');
    expect(slides[1].title).toBe('Second');
    expect(slides[1].body).toEqual(['body two']);
  });

  it('treats a rule as an explicit slide break', () => {
    const slides = splitIntoSlides('one\n\n---\n\ntwo');
    expect(slides.map((s) => s.body)).toEqual([['one'], ['two']]);
  });

  it('never splits a sentence across slides', () => {
    const sentence = 'This sentence is quite long and must stay whole. ';
    const slides = splitIntoSlides(sentence.repeat(6), { maxCharsPerSlide: 100 });
    for (const slide of slides) {
      for (const line of slide.body) {
        expect(line.trim()).toMatch(/[.!?]$/);
      }
    }
  });

  it('keeps every slide within the character budget', () => {
    const slides = splitIntoSlides('Short one. '.repeat(40), { maxCharsPerSlide: 80 });
    for (const slide of slides) {
      const used = (slide.title?.length ?? 0) + slide.body.join(' ').length;
      expect(used).toBeLessThanOrEqual(80);
    }
  });

  it('keeps a single over-long unbreakable token whole rather than cutting mid-word', () => {
    const monster = 'x'.repeat(500);
    const slides = splitIntoSlides(monster, { maxCharsPerSlide: 100 });
    expect(slides.flatMap((s) => s.body).join('')).toBe(monster);
  });

  it('caps the deck instead of producing hundreds of cards', () => {
    const slides = splitIntoSlides('Line.\n\n'.repeat(200), { maxCharsPerSlide: 10, maxSlides: 12 });
    expect(slides).toHaveLength(12);
  });

  it('returns nothing for empty or whitespace-only input', () => {
    expect(splitIntoSlides('')).toEqual([]);
    expect(splitIntoSlides('   \n\n  \n')).toEqual([]);
  });
});
