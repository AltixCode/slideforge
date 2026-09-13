import * as FileSystem from 'expo-file-system/legacy';
// expo-media-library's root export deprecated saveToLibraryAsync in SDK 57 and
// now throws on use. The legacy entry keeps the function-style API working.
import * as MediaLibrary from 'expo-media-library/legacy';

export type SaveOutcome =
  | { ok: true; count: number }
  | { ok: false; reason: 'permission'; status: string }
  | { ok: false; reason: 'error'; message: string };

/**
 * Writes rendered cards to the camera roll in deck order.
 *
 * Asks for add-only access: SlideForge reads nothing from the library, and
 * requesting full read/write prompts for far more than it uses. iOS can also
 * refuse the full-access request without ever showing a prompt, which silently
 * breaks the export.
 */
export const saveCards = async (uris: string[]): Promise<SaveOutcome> => {
  let status: string;
  try {
    ({ status } = await MediaLibrary.requestPermissionsAsync(true));
  } catch (e) {
    return { ok: false, reason: 'error', message: `permission request: ${String(e)}` };
  }
  if (status !== 'granted') return { ok: false, reason: 'permission', status };

  try {
    let saved = 0;
    // Sequential, not Promise.all: the camera roll orders by write time, and
    // parallel writes land out of order, which scrambles a carousel.
    for (const uri of uris) {
      await MediaLibrary.saveToLibraryAsync(uri);
      saved += 1;
    }
    return { ok: true, count: saved };
  } catch (e) {
    return { ok: false, reason: 'error', message: String(e) };
  }
};

/** Moves a rendered card into the cache under a name that preserves deck order. */
export const stageCard = async (
  sourceUri: string,
  index: number,
): Promise<string> => {
  const base = FileSystem.cacheDirectory || `${FileSystem.documentDirectory}cache/`;
  // Zero-padded so a ten-plus card deck sorts correctly in any file browser.
  const target = `${base}slideforge_${String(index + 1).padStart(2, '0')}.png`;
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return target;
};
