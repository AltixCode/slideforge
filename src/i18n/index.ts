import * as Localization from 'expo-localization';

export type SupportedLanguage =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'pt'
  | 'ko'
  | 'it'
  | 'tr'
  | 'ar'
  | 'fa'
  | 'el';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'en',
  'es',
  'fr',
  'de',
  'ru',
  'zh',
  'ja',
  'pt',
  'ko',
  'it',
  'tr',
  'ar',
  'fa',
  'el',
];

export const translations = {
  "en": {
    "proBadge": "PRO",
    "storeUnavailable": "Store Unavailable",
    "noPriorPurchases": "No previous purchase was found for this account.",
    "lifetimeAccessPlain": "Unlock Lifetime Access",
    "cancelled": "Purchase Cancelled",
    "unlocked": "SlideForge Pro Unlocked",
    "appName": "SlideForge",
    "previewTitle": "Carousel Preview",
    "paywallTitle": "SlideForge Pro",
    "back": "Back",
    "cancel": "Cancel",
    "error": "Error",
    "lifetimeAccess": "Unlock Lifetime Access — {price}",
    "restorePurchases": "Restore Purchases",
    "oneTimePayment": "One-time payment. Never recurring.",
    "termsOfUse": "Terms of Use",
    "privacyPolicy": "Privacy Policy",
    "antiSubTitle": "ANTI-SUBSCRIPTION PROMISE",
    "antiSubHeadline": "No Subscriptions. No Accounts. 100% On-Device Privacy. Own It Forever.",
    "purchaseFailed": "Purchase Failed",
    "purchaseFailedDesc": "The purchase could not be completed. Please try again.",
    "restoreFailed": "Nothing to Restore",
    "restoreFailedDesc": "No previous purchase was found for this account.",
    "restored": "Purchase Restored",
    "restoredDesc": "SlideForge Pro is unlocked on this device.",
    "heroBadge": "Markdown to Carousel",
    "heroTitle": "Social Carousel Studio",
    "heroSubtitle": "Paste a script or notes and get balanced, ready-to-post carousel cards rendered at full resolution on your device.",
    "yourText": "Your text",
    "pastePlaceholder": "Paste a script, notes, or markdown. Use # for a heading and --- for a slide break.",
    "useSample": "Use sample text",
    "slideCount": "{count} slides",
    "slideCount_one": "1 slide",
    "buildCarousel": "Build {count} cards",
    "buildCarousel_one": "Build 1 card",
    "nothingToSplit": "Nothing to split",
    "nothingToSplitDesc": "Paste or type some text first.",
    "truncatedNotice": "Your text is longer than one carousel. Only the first cards were kept — split the rest into a second post.",
    "freeLimitNotice": "Free exports cover the first {limit} cards. Unlock Pro to export all {count}.",
    "archGuarantees": "HOW IT WORKS",
    "sentenceSafeTitle": "Sentence-safe splitting",
    "sentenceSafeDesc": "Cards break between sentences, never mid-thought, and headings or --- start a new card.",
    "onDeviceTitle": "100% on-device rendering",
    "onDeviceDesc": "Cards are drawn on your phone's GPU. Nothing is uploaded and there is no account.",
    "cardStyle": "CARD STYLE",
    "saveCards": "Save {count} cards",
    "saveCards_one": "Save 1 card",
    "exportingProgress": "Rendering card {current} of {total}...",
    "lockedCard": "Pro unlocks cards past the first {limit}",
    "lockedFooter": "{count} more cards unlock with Pro",
    "lockedFooter_one": "1 more card unlocks with Pro",
    "savedTitle": "Carousel saved",
    "savedDesc": "{count} cards were saved to your photo library in posting order.",
    "savedDesc_one": "1 card was saved to your photo library.",
    "permissionDenied": "Permission Denied",
    "permissionDeniedDesc": "Please allow adding photos so the cards can be saved.",
    "exportFailed": "Export Failed",
    "exportFailedDesc": "The cards could not be saved. They are still on this device — try again.",
    "antiSubDesc": "Carousel tools charge $12–$20 every month. SlideForge is a single one-time purchase you keep forever on all your devices.",
    "feat1Title": "Unlimited cards per carousel",
    "feat1Desc": "Export decks of any length instead of the first five cards.",
    "feat2Title": "Every card style",
    "feat2Desc": "Unlock all palettes, including the light and high-contrast sets.",
    "feat3Title": "Full-resolution export",
    "feat3Desc": "1080x1350 cards drawn on the GPU, sized exactly for Instagram and LinkedIn.",
    "feat4Title": "100% private on-device",
    "feat4Desc": "Your writing never leaves the phone. No server, no account, no tracking."
  }
} as const;

export type TranslationKey = keyof typeof translations['en'];

export function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    const code = locales?.[0]?.languageCode?.toLowerCase();
    if (code && (SUPPORTED_LANGUAGES as string[]).includes(code)) {
      return code as SupportedLanguage;
    }
  } catch {
    // fallback
  }
  return 'en';
}

let currentLanguage: SupportedLanguage = getDeviceLanguage();

export function setLanguage(lang: SupportedLanguage) {
  currentLanguage = lang;
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function isRTL(): boolean {
  return currentLanguage === 'ar' || currentLanguage === 'fa';
}

/**
 * CLDR plural category for `count` in the active language, e.g. "one" or
 * "other" in English, which also has "few"/"many" in Russian and Arabic.
 *
 * Falls back to an English-style one/other split where Intl.PluralRules is
 * unavailable, which is still better than always rendering the plural form.
 */
function pluralCategory(count: number): string {
  try {
    return new Intl.PluralRules(currentLanguage).select(count);
  } catch {
    return count === 1 ? 'one' : 'other';
  }
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const langDict = (translations as any)[currentLanguage] || translations.en;
  // A key may carry plural variants as suffixed siblings ("exportClips_one").
  // Only keys that actually define one are affected; everything else resolves
  // to the base key exactly as before.
  let resolved: string = key as string;
  if (params && typeof params.count === 'number') {
    const variant = `${key}_${pluralCategory(params.count)}`;
    if (langDict[variant] || (translations.en as any)[variant]) resolved = variant;
  }
  let text: string =
    langDict[resolved] || (translations.en as any)[resolved] ||
    langDict[key] || translations.en[key] || (key as string);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.split('{' + k + '}').join(String(v));
    });
  }
  return text;
}

export default t;
