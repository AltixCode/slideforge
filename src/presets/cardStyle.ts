import { Platform } from "react-native";
import type { CarouselTheme } from "./themes";
import type { CardStylePrefs } from "../services/cardStylePrefs";

/**
 * Card customization presets: font, text color and background color.
 *
 * Feedback from a beta tester wanted a way to change these for content
 * creators who want their carousels to look distinct from the five built-in
 * themes. Kept to fixed, curated options -- no font files are bundled and no
 * color wheel is offered -- because this is a basic customization pass, not a
 * design tool.
 */

export interface CardFont {
  id: string;
  label: string;
  /** Resolved per-platform: Skia's matchFont looks up a native system font by
   * name, and the iOS and Android names for the same family differ. Nothing
   * here is a bundled font file -- only names both platforms already ship. */
  family: string;
}

export const CARD_FONTS: CardFont[] = [
  {
    id: "sans",
    label: "Sans",
    family: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
  {
    id: "serif",
    label: "Serif",
    family: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  {
    id: "mono",
    label: "Mono",
    family: Platform.OS === "ios" ? "Courier" : "monospace",
  },
];

export const DEFAULT_FONT = CARD_FONTS[0];

export interface CardColorOption {
  id: string;
  label: string;
  hex: string;
}

/** Reuses the exact hexes the built-in themes already pair for contrast,
 * rather than inventing a new palette -- these are colors this app has
 * already designed to read well on a full-bleed card. */
export const CARD_TEXT_COLORS: CardColorOption[] = [
  { id: "ink", label: "Ink", hex: "#F8FAFC" },
  { id: "paper", label: "Paper", hex: "#111827" },
  { id: "mint", label: "Mint", hex: "#ECFDF5" },
  { id: "plum", label: "Plum", hex: "#F5F3FF" },
  { id: "signal", label: "Signal", hex: "#FAFAFA" },
];

export const CARD_BACKGROUND_COLORS: CardColorOption[] = [
  { id: "ink", label: "Ink", hex: "#0F172A" },
  { id: "paper", label: "Paper", hex: "#FAF7F2" },
  { id: "mint", label: "Mint", hex: "#052E2B" },
  { id: "plum", label: "Plum", hex: "#2E1065" },
  { id: "signal", label: "Signal", hex: "#18181B" },
];

/**
 * A theme with the customization prefs layered on top -- `null` in a pref means "use the
 * theme's own color", so a partial customization (font only, say) leaves the rest of the
 * chosen built-in theme untouched.
 */
export function applyCardStyle(theme: CarouselTheme, prefs: CardStylePrefs): CarouselTheme {
  return {
    ...theme,
    title: prefs.textColor ?? theme.title,
    body: prefs.textColor ?? theme.body,
    background: prefs.backgroundColor ?? theme.background,
  };
}

export function fontFamilyFor(fontId: string): string {
  return (CARD_FONTS.find((f) => f.id === fontId) ?? DEFAULT_FONT).family;
}
