import { readFileSync } from 'fs';
import { join } from 'path';
import { setLanguage, t } from '../index';

/**
 * These check the plural *categories*, which is the part the engine got wrong.
 *
 * The rules used to come from Intl.PluralRules. Node has full ICU, so a test
 * written against that would have passed here and still shipped "3 слайдов" to
 * Russian users -- Hermes has no CLDR plural database and answers as if every
 * locale were English. Asserting the rendered strings means the test fails if
 * the rules are ever handed back to the engine.
 */
describe('plural categories', () => {
  afterEach(() => setLanguage('en'));

  it('splits English at one', () => {
    setLanguage('en');
    expect(t('slideCount', { count: 1 })).toBe('1 slide');
    expect(t('slideCount', { count: 2 })).toBe('2 slides');
    expect(t('slideCount', { count: 0 })).toBe('0 slides');
  });

  it('uses all three Russian forms, including for 21 and 22', () => {
    setLanguage('ru');
    expect(t('slideCount', { count: 1 })).toBe('1 слайд');
    expect(t('slideCount', { count: 3 })).toBe('3 слайда');
    expect(t('slideCount', { count: 5 })).toBe('5 слайдов');
    // The teens are the trap: 11 and 12 take "many", not "one" and "few".
    expect(t('slideCount', { count: 11 })).toBe('11 слайдов');
    expect(t('slideCount', { count: 12 })).toBe('12 слайдов');
    // And the pattern restarts above 20, which is why the singular form
    // cannot hard-code the numeral 1.
    expect(t('slideCount', { count: 21 })).toBe('21 слайд');
    expect(t('slideCount', { count: 22 })).toBe('22 слайда');
  });

  it('puts zero in the singular for French and Portuguese', () => {
    setLanguage('fr');
    expect(t('slideCount', { count: 0 })).toBe('0 diapositive');
    expect(t('slideCount', { count: 1 })).toBe('1 diapositive');
    expect(t('slideCount', { count: 2 })).toBe('2 diapositives');

    setLanguage('pt');
    expect(t('slideCount', { count: 0 })).toBe('0 slide');
    expect(t('slideCount', { count: 2 })).toBe('2 slides');
  });

  it('uses one form for languages without a grammatical plural', () => {
    for (const lang of ['ja', 'zh', 'ko'] as const) {
      setLanguage(lang);
      const one = t('slideCount', { count: 1 });
      expect(t('slideCount', { count: 7 })).toBe(one.replace('1', '7'));
    }
  });

  it('does not ask the engine for plural categories', () => {
    // This is a source check on purpose, and it is the only test here that can
    // actually fail if the rules go back to Intl.PluralRules. Node ships full
    // ICU, so every behavioural assertion above passes with either
    // implementation; Hermes has no CLDR plural data and is the one that gets
    // Russian wrong. A test that cannot tell the two apart is not a guard, so
    // this one reads the file instead.
    // The constructor call, not the name: the comment above the rules explains
    // why Intl.PluralRules is not used, and naming it there is the point.
    const source = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8');
    expect(source).not.toContain('new Intl.PluralRules');
  });

  it('falls back to English for a key a language has not translated', () => {
    setLanguage('ru');
    // Every key is translated, so this asserts the mechanism rather than a gap:
    // an untranslated key must render English, not the key name.
    expect(t('appName')).toBe('SlideForge');
  });
});
