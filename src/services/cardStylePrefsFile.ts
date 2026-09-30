import * as FileSystem from "expo-file-system/legacy";
import {
  DEFAULT_CARD_STYLE,
  parseCardStyle,
  serialiseCardStyle,
  type CardStylePrefs,
} from "./cardStylePrefs";

/**
 * Where the card customization (font, text color, background color) lives. A JSON file in
 * app storage, mirroring `adPacingFile.ts` -- this app has no AsyncStorage dependency, and a
 * lost preference file just falls back to the app's own designed defaults.
 */
const prefsPath = () =>
  `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}card-style.json`;

export async function readCardStyle(): Promise<CardStylePrefs> {
  try {
    const info = await FileSystem.getInfoAsync(prefsPath());
    if (!info.exists) return DEFAULT_CARD_STYLE;
    return parseCardStyle(await FileSystem.readAsStringAsync(prefsPath()));
  } catch {
    return DEFAULT_CARD_STYLE;
  }
}

export async function writeCardStyle(prefs: CardStylePrefs): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(prefsPath(), serialiseCardStyle(prefs));
  } catch {
    // A style that fails to persist just resets to the app's defaults next launch.
  }
}
