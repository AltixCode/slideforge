import {
  CARD_BACKGROUND_COLORS,
  CARD_FONTS,
  CARD_TEXT_COLORS,
  DEFAULT_FONT,
} from "../presets/cardStyle";

/**
 * Parsing and serialising the card customization preferences (font, text
 * color, background color).
 *
 * Kept pure and separate from the file IO, mirroring adPacing.ts, so a
 * truncated write or a hand-edited file can be tested without a filesystem.
 * Everything here fails toward the app's own designed defaults: an unreadable
 * or unrecognized value is treated as "not customized" rather than trusted,
 * since an untrusted string would otherwise flow straight into a Skia color
 * prop.
 */

export interface CardStylePrefs {
  fontId: string;
  /** Overrides the selected theme's title/body color. `null` means "use the
   * theme's own color". */
  textColor: string | null;
  /** Overrides the selected theme's background color. `null` means "use the
   * theme's own color". */
  backgroundColor: string | null;
}

export const DEFAULT_CARD_STYLE: CardStylePrefs = {
  fontId: DEFAULT_FONT.id,
  textColor: null,
  backgroundColor: null,
};

function validFontId(value: unknown): string {
  return typeof value === "string" && CARD_FONTS.some((f) => f.id === value)
    ? value
    : DEFAULT_FONT.id;
}

function validColor(value: unknown, palette: { hex: string }[]): string | null {
  return typeof value === "string" && palette.some((c) => c.hex === value)
    ? value
    : null;
}

export function parseCardStyle(raw: string | null | undefined): CardStylePrefs {
  if (!raw) return DEFAULT_CARD_STYLE;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_CARD_STYLE;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    return DEFAULT_CARD_STYLE;

  const record = parsed as Record<string, unknown>;
  return {
    fontId: validFontId(record.fontId),
    textColor: validColor(record.textColor, CARD_TEXT_COLORS),
    backgroundColor: validColor(record.backgroundColor, CARD_BACKGROUND_COLORS),
  };
}

export function serialiseCardStyle(prefs: CardStylePrefs): string {
  return JSON.stringify({
    fontId: validFontId(prefs.fontId),
    textColor: validColor(prefs.textColor, CARD_TEXT_COLORS),
    backgroundColor: validColor(prefs.backgroundColor, CARD_BACKGROUND_COLORS),
  });
}
