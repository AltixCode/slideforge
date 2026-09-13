/**
 * Splits pasted text into balanced carousel slides.
 *
 * The product promise is "paste a script, get a carousel", so the split has to
 * be defensible without the user rearranging it afterwards. Two rules drive it:
 *
 *  - Never break a sentence across slides. A carousel is read one card at a
 *    time; a sentence cut in half reads as a bug.
 *  - Keep slides within a character budget that actually fits the card at a
 *    legible size. Overflowing is worse than an extra slide.
 *
 * Author-declared breaks win over both. A line of `---` is an explicit slide
 * break, and a markdown heading starts a new slide, because someone who wrote
 * headings has already decided where the divisions are.
 */

export interface Slide {
  /** Heading shown at the top of the card, if the source supplied one. */
  title?: string;
  /** Body paragraphs, already fitted to the card. */
  body: string[];
}

export interface SplitOptions {
  /**
   * Characters that fit on one card at the default type size. 1080x1350 at the
   * shipped type scale holds roughly this much before the text has to shrink
   * below comfortable reading size.
   */
  maxCharsPerSlide?: number;
  /** Hard ceiling so a paste of a whole article cannot produce 200 cards. */
  maxSlides?: number;
}

const DEFAULTS: Required<SplitOptions> = { maxCharsPerSlide: 320, maxSlides: 20 };

const HEADING = /^\s{0,3}#{1,6}\s+(.*\S)\s*$/;
const EXPLICIT_BREAK = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;

/**
 * Splits on sentence ends, keeping the terminator attached.
 *
 * Abbreviations are the reason this is not a plain split on ".": "e.g." and
 * "Dr." would each start a spurious sentence, and the slide after them would
 * open mid-thought.
 */
export const splitSentences = (text: string): string[] => {
  const ABBREV = /\b(?:[A-Z]|e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|Prof|St|No|Fig|approx)\.$/i;
  const out: string[] = [];
  let current = '';
  for (const chunk of text.split(/(?<=[.!?])\s+/)) {
    current = current ? `${current} ${chunk}` : chunk;
    if (!ABBREV.test(current.trimEnd())) {
      out.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) out.push(current.trim());
  return out.filter(Boolean);
};

/** Breaks one over-long paragraph into card-sized pieces at sentence bounds. */
const fitParagraph = (paragraph: string, budget: number): string[] => {
  if (paragraph.length <= budget) return [paragraph];
  const pieces: string[] = [];
  let current = '';
  for (const sentence of splitSentences(paragraph)) {
    if (current && current.length + sentence.length + 1 > budget) {
      pieces.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
    // A single sentence longer than the budget has no sentence boundary to
    // break on. Splitting it mid-word would be worse than letting the card
    // render slightly smaller type, so it is kept whole.
    if (current.length > budget && !current.includes(' ')) {
      pieces.push(current);
      current = '';
    }
  }
  if (current) pieces.push(current);
  return pieces;
};

export const splitIntoSlides = (source: string, options: SplitOptions = {}): Slide[] => {
  const { maxCharsPerSlide, maxSlides } = { ...DEFAULTS, ...options };
  const slides: Slide[] = [];
  let slide: Slide = { body: [] };
  let used = 0;

  const flush = () => {
    if (slide.title || slide.body.length) slides.push(slide);
    slide = { body: [] };
    used = 0;
  };

  for (const rawBlock of source.split(/\n{2,}/)) {
    for (const line of rawBlock.split('\n')) {
      const text = line.trim();
      if (!text) continue;

      if (EXPLICIT_BREAK.test(text)) { flush(); continue; }

      const heading = text.match(HEADING);
      if (heading) {
        // A heading opens its own card; the one being built is finished.
        flush();
        slide.title = heading[1];
        used = heading[1].length;
        continue;
      }

      for (const piece of fitParagraph(text, maxCharsPerSlide)) {
        if (used && used + piece.length > maxCharsPerSlide) flush();
        slide.body.push(piece);
        used += piece.length;
      }
    }
  }
  flush();

  // Everything past the ceiling is dropped rather than silently truncated
  // mid-sentence; the caller surfaces the count so the user can trim the input.
  return slides.slice(0, maxSlides);
};
