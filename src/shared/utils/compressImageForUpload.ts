import type { Action } from 'expo-image-manipulator';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { getInfoAsync } from 'expo-file-system/legacy';

/** Default max upload size (2 MiB). */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

async function getUriByteSize(uri: string): Promise<number | null> {
  try {
    const info = await getInfoAsync(uri);
    if (info.exists && !info.isDirectory && 'size' in info) {
      return info.size;
    }
  } catch {
    // fall through
  }
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return blob.size;
  } catch {
    return null;
  }
}

/**
 * Re-encodes a local JPEG (or image readable by expo-image-manipulator) until it is
 * at most `maxBytes`, by lowering quality and optionally width.
 */
export async function compressJpegUriUnderMaxBytes(
  uri: string,
  maxBytes: number = MAX_UPLOAD_BYTES,
): Promise<string> {
  let current = uri;
  let size = await getUriByteSize(current);
  if (size == null || size <= maxBytes) {
    return current;
  }

  let compress = 0.82;
  let width = 512;

  for (let i = 0; i < 20; i++) {
    const actions: Action[] =
      width < 512 ? [{ resize: { width } }] : [];

    const next = await manipulateAsync(current, actions, {
      compress,
      format: SaveFormat.JPEG,
    });
    current = next.uri;
    size = await getUriByteSize(current);
    if (size == null || size <= maxBytes) {
      return current;
    }

    if (compress > 0.5) {
      compress = Math.max(0.45, compress - 0.08);
    } else if (width > 256) {
      width -= 64;
      compress = 0.72;
    } else {
      compress = Math.max(0.38, compress - 0.05);
    }
  }

  return current;
}
